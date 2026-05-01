import { describe, expect, it } from "vitest";
import {
  normalizeAppliances,
  parseAppliances,
  serializeAppliances,
} from "./equipment-service";

describe("equipment appliance helpers", () => {
  it("round-trips valid appliance keys", () => {
    const appliances = ["oven", "air_fryer", "instant_pot"];

    expect(parseAppliances(serializeAppliances(appliances))).toEqual(appliances);
  });

  it("strips unknown keys and preserves valid keys once", () => {
    expect(
      normalizeAppliances(["oven", "campfire", "oven", " blender ", ""]),
    ).toEqual(["oven", "blender"]);
  });

  it("returns an empty array for missing stored profile data", () => {
    expect(parseAppliances(null)).toEqual([]);
    expect(parseAppliances("")).toEqual([]);
  });
});
