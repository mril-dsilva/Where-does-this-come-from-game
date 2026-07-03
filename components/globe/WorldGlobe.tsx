"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type {
  CSSProperties,
  ForwardRefExoticComponent,
  RefAttributes,
} from "react";
import { getCountryByCode } from "@/lib/data/index.ts";
import { loadCountryPolygons } from "@/lib/geo/world-polygons.ts";
import type { GlobeMethods, GlobeProps } from "react-globe.gl";
import { Raycaster, Sphere, Vector2, Vector3 } from "three";
import type { Object3D } from "three";

type GlobeHighlight = {
  countryCode: string;
  color: string;
  altitude: number;
  isLatest?: boolean;
};

type GlobePolygonObject = object & {
  countryCode?: string;
};

/** three-globe attaches the source polygon datum to its scene objects as `__data`. */
type PolygonHoverTarget = {
  __data?: unknown;
};

type WorldGlobeProps = {
  highlights?: GlobeHighlight[];
  focusCountryCode?: string | null;
  showHoverTooltips?: boolean;
  lightMode?: boolean;
  lightGlow?: "none" | "narrow" | "soft";
  lightHalo?: "none" | "tight" | "soft";
  shellMode?: "auto" | "flat";
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  enableZoom?: boolean;
  contentScale?: number;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereAltitude?: number;
  framed?: boolean;
  className?: string;
};

const Globe = dynamic(
  () => import("react-globe.gl").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[22rem] items-center justify-center text-sm text-[var(--muted)]">
        Loading globe…
      </div>
    ),
  },
) as unknown as ForwardRefExoticComponent<
  GlobeProps & RefAttributes<GlobeMethods>
>;

const BASE_GLOBE_IMAGE =
  "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
const LIGHT_GLOBE_IMAGE =
  "https://unpkg.com/three-globe/example/img/earth-day.jpg";
const BASE_BUMP_IMAGE =
  "https://unpkg.com/three-globe/example/img/earth-topology.png";
const BASE_BACKGROUND = "#071018";
const LIGHT_BACKGROUND = "#eef4fb";
const TRANSPARENT = "rgba(0, 0, 0, 0)";

// three-globe renders the globe as a sphere of radius 100 at the scene origin.
const GLOBE_RADIUS = 100;
// Accept hits slightly beyond the sphere surface (raised polygon caps), but
// reject hits on the far side of the globe.
const NEAR_SIDE_SLACK = 20;

function getPolygonCountryCode(polygon: GlobePolygonObject): string | null {
  if (!("countryCode" in polygon)) {
    return null;
  }

  const countryCode = polygon.countryCode;

  if (typeof countryCode !== "string" || !countryCode.trim()) {
    return null;
  }

  return countryCode.trim().toUpperCase();
}
export default function WorldGlobe({
  highlights = [],
  focusCountryCode,
  showHoverTooltips = false,
  lightMode = false,
  lightGlow = "soft",
  lightHalo = "soft",
  shellMode = "auto",
  autoRotate = false,
  autoRotateSpeed = 0.4,
  enableZoom = true,
  contentScale = 1,
  showAtmosphere = true,
  atmosphereColor = "#a7c1df",
  atmosphereAltitude = 0.12,
  framed = true,
  className,
}: WorldGlobeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<GlobeMethods | null>(null);
  const [polygons, setPolygons] = useState<
    Awaited<ReturnType<typeof loadCountryPolygons>>
  >([]);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [isGlobeReady, setIsGlobeReady] = useState(false);
  const [hoverCountryName, setHoverCountryName] = useState<string | null>(null);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const pointerPositionRef = useRef({ x: 0, y: 0 });
  // Ratio of visual (rendered) pixels to CSS layout pixels. The site applies
  // `zoom: 0.8` on <body>, which makes these two coordinate systems diverge.
  const zoomRef = useRef(1);

  useEffect(() => {
    let cancelled = false;

    loadCountryPolygons().then((loadedPolygons) => {
      if (!cancelled) {
        setPolygons(loadedPolygons);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return undefined;
    }

    const updateSize = () => {
      const nextWidth = Math.floor(element.clientWidth);
      const nextHeight = Math.floor(element.clientHeight);

      setSize({
        width: nextWidth,
        height: nextHeight,
      });
    };

    const frame = window.requestAnimationFrame(updateSize);

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isGlobeReady || !focusCountryCode) {
      return;
    }

    const country = getCountryByCode(focusCountryCode);

    if (!country) {
      return;
    }

    globeRef.current?.pointOfView(
      {
        lat: country.centroid.latitude,
        lng: country.centroid.longitude,
      },
      1200,
    );
  }, [focusCountryCode, isGlobeReady]);

  useEffect(() => {
    if (!isGlobeReady) {
      return;
    }

    const controls = globeRef.current?.controls();

    if (!controls) {
      return;
    }

    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = autoRotateSpeed;
  }, [autoRotate, autoRotateSpeed, isGlobeReady]);

  useEffect(() => {
    const element = containerRef.current;

    if (!showHoverTooltips || !isGlobeReady || !element) {
      return undefined;
    }

    const canvas = element.querySelector("canvas");
    const raycaster = new Raycaster();
    const pointerNdc = new Vector2();
    const globeSphere = new Sphere(new Vector3(0, 0, 0), GLOBE_RADIUS);
    const sphereHitPoint = new Vector3();
    const polygonData = new Set<object>(polygons);
    let frameId: number | null = null;

    // three-globe wraps each polygon datum as `{ data: <ours>, ... }` before
    // attaching it to scene objects, so unwrap one level when matching.
    const getPolygonDatum = (value: unknown): GlobePolygonObject | null => {
      if (!value || typeof value !== "object") {
        return null;
      }

      if (polygonData.has(value)) {
        return value as GlobePolygonObject;
      }

      const wrapped = (value as { data?: unknown }).data;

      return wrapped && typeof wrapped === "object" && polygonData.has(wrapped)
        ? (wrapped as GlobePolygonObject)
        : null;
    };

    const resolveHoveredCountryName = (): string | null => {
      const globe = globeRef.current;

      if (!globe || !canvas) {
        return null;
      }

      const rect = canvas.getBoundingClientRect();

      if (!rect.width || !rect.height) {
        return null;
      }

      // Normalize the cursor against the canvas's *visual* rect. This keeps
      // pointer coords and canvas size in the same coordinate system, which
      // the library's built-in raycast gets wrong under the body zoom.
      const { x, y } = pointerPositionRef.current;
      pointerNdc.set(
        ((x - rect.left) / rect.width) * 2 - 1,
        -((y - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointerNdc, globe.camera());

      const polygonObjects: Object3D[] = [];
      globe.scene().traverse((object) => {
        if (getPolygonDatum((object as PolygonHoverTarget).__data)) {
          polygonObjects.push(object);
        }
      });

      const [hit] = raycaster.intersectObjects(polygonObjects, true);

      if (!hit) {
        return null;
      }

      // The ray passes through the globe: reject countries on the far side.
      const surfacePoint = raycaster.ray.intersectSphere(
        globeSphere,
        sphereHitPoint,
      );

      if (
        surfacePoint &&
        hit.distance >
          raycaster.ray.origin.distanceTo(surfacePoint) + NEAR_SIDE_SLACK
      ) {
        return null;
      }

      let object: Object3D | null = hit.object;

      while (object) {
        const datum = getPolygonDatum((object as PolygonHoverTarget).__data);

        if (datum) {
          const countryCode = getPolygonCountryCode(datum);

          return countryCode
            ? (getCountryByCode(countryCode)?.name ?? null)
            : null;
        }

        object = object.parent;
      }

      return null;
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointerPositionRef.current = { x: event.clientX, y: event.clientY };

      if (canvas && canvas.clientWidth > 0) {
        zoomRef.current =
          canvas.getBoundingClientRect().width / canvas.clientWidth || 1;
      }

      const tooltip = tooltipRef.current;

      if (tooltip) {
        // The tooltip lives in the zoomed <body>, so convert viewport coords
        // back into the body's CSS coordinate space.
        tooltip.style.left = `${event.clientX / zoomRef.current}px`;
        tooltip.style.top = `${event.clientY / zoomRef.current}px`;
      }

      if (frameId === null) {
        frameId = window.requestAnimationFrame(() => {
          frameId = null;
          setHoverCountryName(resolveHoveredCountryName());
        });
      }
    };
    const handlePointerDown = () => setIsPointerDown(true);
    const handlePointerUp = () => setIsPointerDown(false);
    const handlePointerLeave = () => {
      setIsPointerDown(false);
      setHoverCountryName(null);
    };

    element.addEventListener("pointermove", handlePointerMove);
    element.addEventListener("pointerdown", handlePointerDown);
    element.addEventListener("pointerup", handlePointerUp);
    element.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      element.removeEventListener("pointermove", handlePointerMove);
      element.removeEventListener("pointerdown", handlePointerDown);
      element.removeEventListener("pointerup", handlePointerUp);
      element.removeEventListener("pointerleave", handlePointerLeave);

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      setIsPointerDown(false);
      setHoverCountryName(null);
    };
  }, [showHoverTooltips, isGlobeReady, polygons]);

  const highlightByCode = useMemo(() => {
    const map = new Map<string, GlobeHighlight>();

    for (const highlight of highlights) {
      map.set(highlight.countryCode.trim().toUpperCase(), highlight);
    }

    return map;
  }, [highlights]);

  const globeImageUrl = lightMode ? LIGHT_GLOBE_IMAGE : BASE_GLOBE_IMAGE;
  const atmosphereTint = lightMode ? "#d5e6f4" : atmosphereColor;
  const globeShellBackground = lightMode
    ? lightGlow === "none"
      ? "transparent"
      : lightGlow === "narrow"
        ? "radial-gradient(circle at center, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.035) 8%, rgba(255, 255, 255, 0.01) 12%, transparent 16%)"
        : "radial-gradient(circle at center, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.06) 38%, rgba(255, 255, 255, 0.01) 48%, transparent 56%)"
    : shellMode === "flat"
      ? "transparent"
      : BASE_BACKGROUND;

  const globeProps = {
    globeImageUrl,
    bumpImageUrl: BASE_BUMP_IMAGE,
    backgroundColor: framed
      ? lightMode
        ? LIGHT_BACKGROUND
        : BASE_BACKGROUND
      : TRANSPARENT,
    showAtmosphere,
    atmosphereColor: atmosphereTint,
    atmosphereAltitude,
    polygonsData: polygons,
    polygonGeoJsonGeometry: "geometry",
    polygonCapColor: (polygon: GlobePolygonObject) =>
      highlightByCode.get(getPolygonCountryCode(polygon) ?? "")?.color ??
      TRANSPARENT,
    polygonSideColor: (polygon: GlobePolygonObject) =>
      highlightByCode.get(getPolygonCountryCode(polygon) ?? "")?.color ??
      TRANSPARENT,
    polygonStrokeColor: (polygon: GlobePolygonObject) => {
      const highlight = highlightByCode.get(
        getPolygonCountryCode(polygon) ?? "",
      );

      if (!highlight) {
        return lightMode
          ? "rgba(25, 22, 19, 0.12)"
          : "rgba(255, 255, 255, 0.14)";
      }

      return highlight.isLatest
        ? lightMode
          ? "rgba(25, 22, 19, 0.38)"
          : "rgba(255, 255, 255, 0.52)"
        : lightMode
          ? "rgba(25, 22, 19, 0.26)"
          : "rgba(255, 255, 255, 0.34)";
    },
    polygonAltitude: (polygon: GlobePolygonObject) =>
      highlightByCode.get(getPolygonCountryCode(polygon) ?? "")?.altitude ?? 0,
    polygonLabel: () => "",
    polygonsTransitionDuration: 250,
  };

  const globeStyle: CSSProperties = {
    background: framed
      ? lightMode
        ? LIGHT_BACKGROUND
        : BASE_BACKGROUND
      : globeShellBackground,
    boxShadow:
      lightMode && lightHalo !== "none"
        ? lightHalo === "tight"
          ? "0 0 0 1px rgba(25, 22, 19, 0.08), 0 0 8px rgba(25, 22, 19, 0.05)"
          : "0 0 0 1px rgba(25, 22, 19, 0.08), 0 22px 70px rgba(25, 22, 19, 0.08)"
        : undefined,
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${
        framed
          ? lightMode
            ? "aspect-square w-full overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-[#eef4fb]"
            : "aspect-square w-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#071018]"
          : "inline-flex overflow-hidden rounded-full bg-transparent"
      } ${className ?? ""}`.trim()}
      style={globeStyle}
      aria-label="Interactive world globe. Drag to rotate and scroll to zoom. Highlighted countries show guessed answers."
    >
      <div
        className="absolute"
        style={
          framed
            ? { inset: 0 }
            : {
                width: size.width * contentScale,
                height: size.height * contentScale,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }
        }
      >
        {size.width > 0 && size.height > 0 ? (
          <Globe
            ref={globeRef}
            width={framed ? size.width : size.width * contentScale}
            height={framed ? size.height : size.height * contentScale}
            onGlobeReady={() => {
              const controls = globeRef.current?.controls();

              if (controls) {
                controls.enablePan = false;
                controls.enableRotate = true;
                controls.enableZoom = enableZoom;
                controls.minDistance = 180;
                controls.maxDistance = 360;
                controls.autoRotate = autoRotate;
                controls.autoRotateSpeed = autoRotateSpeed;
              }

              setIsGlobeReady(true);
            }}
            {...globeProps}
          />
        ) : (
          <div className="flex h-full min-h-[22rem] items-center justify-center text-sm text-[var(--muted)]">
            Loading globe…
          </div>
        )}
      </div>

      {showHoverTooltips && hoverCountryName && !isPointerDown
        ? createPortal(
            <div
              ref={(node) => {
                tooltipRef.current = node;

                if (node) {
                  node.style.left = `${pointerPositionRef.current.x / zoomRef.current}px`;
                  node.style.top = `${pointerPositionRef.current.y / zoomRef.current}px`;
                }
              }}
              className={`pointer-events-none fixed z-50 -translate-x-1/2 translate-y-4 rounded-full border px-3.5 py-1.5 text-sm font-medium backdrop-blur-xl ${
                lightMode
                  ? "border-[color:rgba(25,22,19,0.12)] bg-[rgba(250,246,240,0.95)] text-[var(--foreground)] shadow-[0_10px_30px_rgba(25,22,19,0.12)]"
                  : "border-white/12 bg-[rgba(7,16,24,0.85)] text-white/92 shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
              }`}
            >
              {hoverCountryName}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
