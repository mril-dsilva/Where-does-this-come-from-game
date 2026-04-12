"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CSSProperties,
  ForwardRefExoticComponent,
  RefAttributes,
} from "react";
import { getCountryByCode } from "@/lib/data/index.ts";
import { loadCountryPolygons } from "@/lib/geo/world-polygons.ts";
import type { GlobeMethods, GlobeProps } from "react-globe.gl";

type GlobeHighlight = {
  countryCode: string;
  color: string;
  altitude: number;
  isLatest?: boolean;
};

type GlobePolygonObject = object & {
  countryCode?: string;
};

type WorldGlobeProps = {
  highlights?: GlobeHighlight[];
  focusCountryCode?: string | null;
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
  () =>
    import("react-globe.gl").then((mod) => mod.default),
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
export default function WorldGlobe({
  highlights = [],
  focusCountryCode,
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
  const [polygons, setPolygons] = useState<Awaited<
    ReturnType<typeof loadCountryPolygons>
  >>([]);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [isGlobeReady, setIsGlobeReady] = useState(false);

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

  const highlightByCode = useMemo(() => {
    const map = new Map<string, GlobeHighlight>();

    for (const highlight of highlights) {
      map.set(highlight.countryCode.trim().toUpperCase(), highlight);
    }

    return map;
  }, [highlights]);

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
      const highlight = highlightByCode.get(getPolygonCountryCode(polygon) ?? "");

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
    background: framed ? (lightMode ? LIGHT_BACKGROUND : BASE_BACKGROUND) : globeShellBackground,
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
        className="absolute inset-0"
        style={{
          transform: framed ? "none" : `scale(${contentScale})`,
          transformOrigin: "center center",
        }}
      >
        {size.width > 0 && size.height > 0 ? (
          <Globe
            ref={globeRef}
            width={size.width}
            height={size.height}
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
    </div>
  );
}
