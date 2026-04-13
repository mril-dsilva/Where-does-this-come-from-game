type MainlandBounds = {
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
};

const MAINLAND_BOUNDS_BY_COUNTRY: Readonly<Record<string, MainlandBounds>> = {
  FR: {
    minLatitude: 41.0,
    maxLatitude: 51.6,
    minLongitude: -5.6,
    maxLongitude: 10.0,
  },
  US: {
    minLatitude: 24.3,
    maxLatitude: 49.5,
    minLongitude: -125.0,
    maxLongitude: -66.0,
  },
  GB: {
    minLatitude: 49.8,
    maxLatitude: 60.9,
    minLongitude: -8.8,
    maxLongitude: 2.2,
  },
  DK: {
    minLatitude: 54.5,
    maxLatitude: 58.1,
    minLongitude: 7.0,
    maxLongitude: 16.0,
  },
  NO: {
    minLatitude: 58.0,
    maxLatitude: 71.5,
    minLongitude: 4.5,
    maxLongitude: 32.0,
  },
  ES: {
    minLatitude: 35.5,
    maxLatitude: 44.5,
    minLongitude: -10.5,
    maxLongitude: 5.5,
  },
  AU: {
    minLatitude: -44.5,
    maxLatitude: -10.5,
    minLongitude: 113.0,
    maxLongitude: 154.0,
  },
  PT: {
    minLatitude: 36.5,
    maxLatitude: 42.8,
    minLongitude: -10.0,
    maxLongitude: -6.0,
  },
  NZ: {
    minLatitude: -47.0,
    maxLatitude: -34.0,
    minLongitude: 166.0,
    maxLongitude: 179.0,
  },
} as const;

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function isPointWithinBounds(
  point: [number, number],
  bounds: MainlandBounds,
): boolean {
  const [longitude, latitude] = point;

  return (
    latitude >= bounds.minLatitude &&
    latitude <= bounds.maxLatitude &&
    longitude >= bounds.minLongitude &&
    longitude <= bounds.maxLongitude
  );
}

export function hasMainlandBounds(countryCode: string): boolean {
  return Boolean(MAINLAND_BOUNDS_BY_COUNTRY[normalizeCode(countryCode)]);
}

export function filterMainlandBorderSamplePoints(
  countryCode: string,
  points: Array<[number, number]>,
): Array<[number, number]> {
  const bounds = MAINLAND_BOUNDS_BY_COUNTRY[normalizeCode(countryCode)];

  if (!bounds) {
    return points;
  }

  return points.filter((point) => isPointWithinBounds(point, bounds));
}
