import { describe, expect, it } from "vitest";
import { normalizeEquipmentAdaptation } from "./equipment-adapter";

describe("normalizeEquipmentAdaptation", () => {
  it("accepts valid adapted steps and trims notes", () => {
    expect(
      normalizeEquipmentAdaptation({
        adaptedSteps: ["Use the air fryer.", "Rest before serving."],
        notes: "  Watch browning closely.  ",
      }),
    ).toEqual({
      adaptedSteps: ["Use the air fryer.", "Rest before serving."],
      notes: "Watch browning closely.",
    });
  });

  it("rejects empty adapted steps", () => {
    expect(() =>
      normalizeEquipmentAdaptation({ adaptedSteps: [], notes: "" }),
    ).toThrow("Invalid equipment adaptation response.");
  });
});
