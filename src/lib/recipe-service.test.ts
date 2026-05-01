import { describe, expect, it } from "vitest";
import { buildRecipeListWhere } from "./recipe-service";

describe("buildRecipeListWhere", () => {
  it("filters only by user when query is blank", () => {
    expect(buildRecipeListWhere("user-1", "   ")).toEqual({ userId: "user-1" });
  });

  it("adds a parameterized title contains filter when query is present", () => {
    expect(buildRecipeListWhere("user-1", " pasta ")).toEqual({
      userId: "user-1",
      title: { contains: "pasta" },
    });
  });
});
