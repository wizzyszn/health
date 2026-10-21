import { describe, expect, it } from "vitest";
import { displayMrn, MRN_NOT_ASSIGNED, normalizeMrn } from "./mrn";

describe("MRN display helpers", () => {
  it("returns the persisted MRN unchanged", () => {
    expect(normalizeMrn("A7B9C2D4E")).toBe("A7B9C2D4E");
    expect(displayMrn("A7B9C2D4E")).toBe("A7B9C2D4E");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeMrn("  A7B9C2D4E  ")).toBe("A7B9C2D4E");
  });

  it("never invents an MRN for a missing value", () => {
    expect(normalizeMrn(undefined)).toBeNull();
    expect(normalizeMrn("   ")).toBeNull();
    expect(displayMrn(undefined)).toBe(MRN_NOT_ASSIGNED);
    expect(displayMrn("")).toBe(MRN_NOT_ASSIGNED);
  });
});
