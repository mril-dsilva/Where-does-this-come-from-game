"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ComponentType } from "react";
import { loadCountryPolygons } from "@/lib/geo/world-polygons.ts";

type GlobeHighlight = {
  countryCode: string;
  color: string;
  altitude: number;
  isLatest?: boolean;
};

type WorldGlobeProps = {
  highlights: GlobeHighlight[];
  className?: string;
};

const Globe = dynamic(
  () =>
    import("react-globe.gl").then(
      (mod) => mod.default as ComponentType<Record<string, unknown>>,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[22rem] items-center justify-center text-sm text-[var(--muted)]">
        Loading globe…
      </div>
    ),
  },
) as unknown as ComponentType<Record<string, unknown>>;

const BASE_GLOBE_IMAGE =
  "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
const BASE_BUMP_IMAGE =
  "https://unpkg.com/three-globe/example/img/earth-topology.png";
const BASE_BACKGROUND = "#dfeef8";
const TRANSPARENT = "rgba(0, 0, 0, 0)";

export default function WorldGlobe({
  highlights,
  className,
}: WorldGlobeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [polygons, setPolygons] = useState<Awaited<
    ReturnType<typeof loadCountryPolygons>
  >>([]);
  const [size, setSize] = useState({ width: 0, height: 0 });

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

  const highlightByCode = useMemo(() => {
    const map = new Map<string, GlobeHighlight>();

    for (const highlight of highlights) {
      map.set(highlight.countryCode.trim().toUpperCase(), highlight);
    }

    return map;
  }, [highlights]);

  const globeProps = {
    globeImageUrl: BASE_GLOBE_IMAGE,
    bumpImageUrl: BASE_BUMP_IMAGE,
    backgroundColor: BASE_BACKGROUND,
    showAtmosphere: true,
    atmosphereColor: "#bcd7ef",
    atmosphereAltitude: 0.12,
    polygonsData: polygons,
    polygonGeoJsonGeometry: "geometry",
    polygonCapColor: (polygon: { countryCode: string }) =>
      highlightByCode.get(polygon.countryCode)?.color ?? TRANSPARENT,
    polygonSideColor: (polygon: { countryCode: string }) =>
      highlightByCode.get(polygon.countryCode)?.color ?? TRANSPARENT,
    polygonStrokeColor: (polygon: { countryCode: string }) => {
      const highlight = highlightByCode.get(polygon.countryCode);

      if (!highlight) {
        return "rgba(15, 23, 42, 0.18)";
      }

      return highlight.isLatest
        ? "rgba(15, 23, 42, 0.58)"
        : "rgba(15, 23, 42, 0.45)";
    },
    polygonAltitude: (polygon: { countryCode: string }) =>
      highlightByCode.get(polygon.countryCode)?.altitude ?? 0,
    polygonsTransitionDuration: 250,
  };

  const globeStyle: CSSProperties = {
    background: BASE_BACKGROUND,
  };

  return (
    <div
      ref={containerRef}
      className={`relative aspect-square w-full overflow-hidden rounded-[1.75rem] bg-[#dfeef8] ${className ?? ""}`.trim()}
      style={globeStyle}
      aria-label="Interactive world globe. Drag to rotate and scroll to zoom. Highlighted countries show guessed answers."
    >
      {size.width > 0 && size.height > 0 ? (
        <Globe
          width={size.width}
          height={size.height}
          {...globeProps}
        />
      ) : (
        <div className="flex h-full min-h-[22rem] items-center justify-center text-sm text-[var(--muted)]">
          Loading globe…
        </div>
      )}
    </div>
  );
}
