import { describe, expect, it } from "vitest";
import {
  toFileDateStamp,
  toFileSafeSegment,
} from "@/shared/utils/pdf-download.util";

describe("toFileSafeSegment", () => {
  it("lower-cases and hyphenates investigation names", () => {
    expect(toFileSafeSegment("Full Blood Count")).toBe("full-blood-count");
    expect(toFileSafeSegment("Chest X-Ray")).toBe("chest-x-ray");
    expect(toFileSafeSegment("  Urinalysis / Culture ")).toBe(
      "urinalysis-culture",
    );
  });

  it("strips diacritics and falls back when nothing remains", () => {
    expect(toFileSafeSegment("Hépatite B")).toBe("hepatite-b");
    expect(toFileSafeSegment("***")).toBe("file");
  });

  it("caps very long names", () => {
    expect(toFileSafeSegment("a".repeat(200)).length).toBeLessThanOrEqual(60);
  });
});

describe("toFileDateStamp", () => {
  it("formats dates as yyyymmdd", () => {
    expect(toFileDateStamp(new Date("2026-08-20T10:00:00.000Z"))).toBe(
      "20260820",
    );
  });

  it("marks invalid dates instead of throwing", () => {
    expect(toFileDateStamp(new Date("not-a-date"))).toBe("undated");
  });
});
