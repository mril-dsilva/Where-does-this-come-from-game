import { getBorderDistanceKm } from "./border-distance.ts";

const MANUAL_NEIGHBOR_OVERRIDES: Readonly<Record<string, readonly string[]>> = {
  AD: ["ES", "FR"],
  LI: ["AT", "CH"],
  MC: ["FR"],
  PS: ["EG", "IL", "JO"],
  SM: ["IT"],
  VA: ["IT"],
} as const;

function normalizeCode(countryCode: string): string {
  return countryCode.trim().toUpperCase();
}

function getManualNeighborCodes(countryCode: string): readonly string[] {
  return MANUAL_NEIGHBOR_OVERRIDES[normalizeCode(countryCode)] ?? [];
}

export function isNeighboringCountryCode(
  leftCountryCode: string | null,
  rightCountryCode: string | null,
): boolean {
  if (!leftCountryCode || !rightCountryCode) {
    return false;
  }

  const left = normalizeCode(leftCountryCode);
  const right = normalizeCode(rightCountryCode);

  if (!left || !right || left === right) {
    return false;
  }

  if (getBorderDistanceKm(left, right) === 0) {
    return true;
  }

  return (
    getManualNeighborCodes(left).includes(right) ||
    getManualNeighborCodes(right).includes(left)
  );
}

