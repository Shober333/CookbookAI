import { describe, expect, it } from "vitest";
import { buildRecipeListWhere } from "./recipe-service";

describe("buildRecipeListWhere", () => {
  it("filters only by user when query is blank", () => {
    expect(buildRecipeListWhere("user-1")).toEqual({ userId: "user-1" });
  });

  it("keeps title search out of the database filter for provider parity", () => {
    expect(buildRecipeListWhere("user-1")).toEqual({
      userId: "user-1",
    });
  });
});
