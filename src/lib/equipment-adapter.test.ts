import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  adaptRecipeStepsWithAi,
  equipmentAdaptationSchema,
  normalizeEquipmentAdaptation,
} from "./equipment-adapter";

const mocks = vi.hoisted(() => ({
  generateRecipeObject: vi.fn(),
}));

vi.mock("@/lib/ai-provider", () => ({
  generateRecipeObject: mocks.generateRecipeObject,
}));

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

describe("adaptRecipeStepsWithAi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.generateRecipeObject.mockResolvedValue({
      adaptedSteps: ["Bake the chicken at 190°C until cooked through."],
      notes: "Replaced the stovetop.",
    });
  });

  it("routes adaptation through the shared provider boundary", async () => {
    await expect(
      adaptRecipeStepsWithAi({
        title: "Chicken Piccata",
        steps: ["Cook chicken in a skillet."],
        appliances: ["oven", "not_real"],
      }),
    ).resolves.toEqual({
      adaptedSteps: ["Bake the chicken at 190°C until cooked through."],
      notes: "Replaced the stovetop.",
    });

    expect(mocks.generateRecipeObject).toHaveBeenCalledWith(
      expect.objectContaining({
        zodSchema: equipmentAdaptationSchema,
        schemaName: "EquipmentAdaptation",
        prompt: expect.stringContaining("Available appliances: oven"),
      }),
    );
  });
});
