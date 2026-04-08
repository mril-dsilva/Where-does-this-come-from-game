"use client";

import { useEffect, useMemo, useState } from "react";
import { loadCountryPolygons } from "@/lib/geo/world-polygons.ts";
import {
  CORRECT_COLOR,
  HEAT_COLOR_PALETTE,
} from "@/lib/game/heat.ts";

type GlobeLegendProps = {
  className?: string;
};

type LegendItem = {
  country: string;
  code: string;
  status: string;
  color: string;
};

const LEGEND_ITEMS: LegendItem[] = [
  {
    country: "Australia",
    code: "AU",
    status: "Far",
    color: HEAT_COLOR_PALETTE.far,
  },
  {
    country: "Spain",
    code: "ES",
    status: "Slightly warm",
    color: HEAT_COLOR_PALETTE.slightlyWarm,
  },
  {
    country: "Germany",
    code: "DE",
    status: "Warm",
    color: HEAT_COLOR_PALETTE.warm,
  },
  {
    country: "Sweden",
    code: "SE",
    status: "Hot",
    color: HEAT_COLOR_PALETTE.hot,
  },
  {
    country: "Estonia",
    code: "EE",
    status: "Neighboring",
    color: HEAT_COLOR_PALETTE.neighboring,
  },
  {
    country: "Finland",
    code: "FI",
    status: "Correct",
    color: CORRECT_COLOR,
  },
];

type CountryGeometry = {
  type: "Polygon" | "MultiPolygon";
  coordinates: unknown;
};

export default function GlobeLegend({ className }: GlobeLegendProps) {
  const [countryGeometries, setCountryGeometries] = useState<
    Record<string, CountryGeometry | null>
  >({});

  useEffect(() => {
    let cancelled = false;

    loadCountryPolygons().then((polygons) => {
      if (cancelled) {
        return;
      }

      const next = Object.fromEntries(
        LEGEND_ITEMS.map((item) => {
          const found = polygons.find(
            (polygon) => polygon.countryCode === item.code,
          );

          return [item.code, found?.geometry ?? null];
        }),
      );

      setCountryGeometries(next);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className={`flex flex-col items-center gap-4 text-[0.85rem] text-white/52 ${className ?? ""}`.trim()}
    >
      <span className="text-base font-medium uppercase tracking-[0.4em] text-white/42">
        Globe Key
      </span>

      <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
        {LEGEND_ITEMS.map((item) => (
          <div
            key={item.country}
            className="flex flex-col items-center gap-2 text-center"
          >
            <CountryMapIcon
              countryCode={item.code}
              geometry={countryGeometries[item.code] ?? null}
              fill={item.color}
            />
            <div className="space-y-1">
              <p className="text-[0.95rem] font-medium text-white">{item.country}</p>
              <p className="text-xs text-white/48">{item.status}</p>
            </div>
          </div>
        ))}
      </div>

      <span className="text-xs text-white/48">
        Unguessed countries stay on the base Earth texture.
      </span>
      <span className="text-xs text-white/48">
        Drag to rotate, scroll to zoom.
      </span>
    </div>
  );
}

type CountryMapIconProps = {
  countryCode: string;
  geometry: CountryGeometry | null;
  fill: string;
};

function CountryMapIcon({ countryCode, geometry, fill }: CountryMapIconProps) {
  const paths = useMemo(() => {
    if (!geometry) {
      return ["M 7 10 L 21 10 L 21 18 L 7 18 Z"];
    }

    return geometryToPaths(geometry, countryCode);
  }, [countryCode, geometry]);

  return (
    <svg
      viewBox="0 0 28 28"
      className="h-14 w-14 drop-shadow-[0_8px_18px_rgba(0,0,0,0.25)] sm:h-16 sm:w-16"
      aria-hidden="true"
    >
      {paths.map((path, index) => (
        <path
          key={index}
          d={path}
          fill={fill}
          stroke="rgba(255, 255, 255, 0.26)"
          strokeWidth="1"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

function geometryToPaths(geometry: CountryGeometry, countryCode: string): string[] {
  const rings = extractRings(geometry.coordinates);
  const allPoints = rings.flat();

  if (allPoints.length === 0) {
    return ["M 7 10 L 21 10 L 21 18 L 7 18 Z"];
  }

  const bounds = getBounds(allPoints);
  const width = Math.max(bounds.maxX - bounds.minX, 1);
  const height = Math.max(bounds.maxY - bounds.minY, 1);
  const targetSize = 24;
  const baseScale = Math.min(targetSize / width, targetSize / height);
  const horizontalScale = countryCode === "FI" ? baseScale * 0.82 : baseScale;
  const verticalScale = countryCode === "FI" ? baseScale * 1.28 : baseScale * 1.12;
  const paddingX = (28 - width * horizontalScale) / 2;
  const paddingY = (28 - height * verticalScale) / 2;

  return rings.map((ring) =>
    ring
      .map(([longitude, latitude], index) => {
        const x = (longitude - bounds.minX) * horizontalScale + paddingX;
        const y = (bounds.maxY - latitude) * verticalScale + paddingY;
        return `${index === 0 ? "M" : "L"} ${formatNumber(x)} ${formatNumber(y)}`;
      })
      .join(" ") + " Z",
  );
}

function extractRings(coordinates: unknown): Array<Array<[number, number]>> {
  if (!Array.isArray(coordinates)) {
    return [];
  }

  if (
    coordinates.length > 0 &&
    Array.isArray(coordinates[0]) &&
    Array.isArray(coordinates[0][0]) &&
    typeof coordinates[0][0][0] === "number"
  ) {
    return coordinates as Array<Array<[number, number]>>;
  }

  const rings: Array<Array<[number, number]>> = [];

  for (const polygon of coordinates) {
    if (
      Array.isArray(polygon) &&
      Array.isArray(polygon[0]) &&
      Array.isArray(polygon[0][0]) &&
      typeof polygon[0][0][0] === "number"
    ) {
      rings.push(...(polygon as Array<Array<[number, number]>>));
    }
  }

  return rings;
}

function getBounds(points: Array<[number, number]>) {
  return points.reduce(
    (bounds, [x, y]) => ({
      minX: Math.min(bounds.minX, x),
      minY: Math.min(bounds.minY, y),
      maxX: Math.max(bounds.maxX, x),
      maxY: Math.max(bounds.maxY, y),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  );
}

function formatNumber(value: number): string {
  return Number(value.toFixed(2)).toString();
}
