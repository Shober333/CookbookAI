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

  it("defaults missing notes instead of rejecting an otherwise usable rewrite", () => {
    expect(
      normalizeEquipmentAdaptation({
        adaptedSteps: ["Bake the chicken until browned and cooked through."],
      }),
    ).toEqual({
      adaptedSteps: ["Bake the chicken until browned and cooked through."],
      notes: "",
    });
  });

  it("accepts common model variants for adapted step keys", () => {
    expect(
      normalizeEquipmentAdaptation({
        steps: ["Roast the sauce ingredients instead of using the stovetop."],
        notes: null,
      }),
    ).toEqual({
      adaptedSteps: [
        "Roast the sauce ingredients instead of using the stovetop.",
      ],
      notes: "",
    });
  });

  it("rejects empty adapted steps", () => {
    expect(() =>
      normalizeEquipmentAdaptation({ adaptedSteps: [], notes: "" }),
    ).toThrow("Invalid equipment adaptation response.");
  });
});
