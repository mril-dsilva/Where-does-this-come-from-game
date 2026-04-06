import assert from "node:assert/strict";
import test from "node:test";

import { createCountryPolygons } from "../lib/geo/world-polygons.ts";

test("country polygon matching resolves common country names and codes", () => {
  const polygons = createCountryPolygons([
    {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [] },
      properties: {
        name: "United Kingdom",
        "ISO3166-1-Alpha-2": "GB",
      },
    },
    {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [] },
      properties: {
        admin: "India",
      },
    },
    {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [] },
      properties: {
        name: "Atlantis",
      },
    },
  ]);

  assert.equal(polygons.length, 2);
  assert.deepEqual(
    polygons.map((polygon) => polygon.countryCode),
    ["IN", "GB"],
  );
  assert.deepEqual(
    polygons.map((polygon) => polygon.countryName),
    ["India", "United Kingdom"],
  );
});

test("country polygon matching prefers the main country geometry over territories", () => {
  const polygons = createCountryPolygons([
    {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [] },
      properties: {
        ADMIN: "Puerto Rico",
        SOVEREIGNT: "United States of America",
        ISO_A2: "PR",
        ADM0_A3: "PRI",
      },
    },
    {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [] },
      properties: {
        ADMIN: "United States of America",
        SOVEREIGNT: "United States of America",
        ISO_A2: "US",
        ADM0_A3: "USA",
      },
    },
  ]);

  assert.equal(polygons.length, 1);
  assert.equal(polygons[0].countryCode, "US");
  assert.equal(polygons[0].countryName, "United States");
});
