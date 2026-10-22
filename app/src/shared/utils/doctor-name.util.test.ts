import { describe, expect, it } from "vitest";
import {
  stripDoctorTitle,
  withDoctorTitle,
} from "@/shared/utils/doctor-name.util";

describe("withDoctorTitle", () => {
  it("adds the title when the doctor typed only a name", () => {
    expect(withDoctorTitle("Henry")).toBe("Dr Henry");
  });

  it("never duplicates a title the doctor already typed", () => {
    expect(withDoctorTitle("Dr Henry")).toBe("Dr Henry");
    expect(withDoctorTitle("Dr. Henry")).toBe("Dr Henry");
    expect(withDoctorTitle("dr henry")).toBe("Dr henry");
    expect(withDoctorTitle("DR HENRY")).toBe("Dr HENRY");
    expect(withDoctorTitle("Doctor Henry")).toBe("Dr Henry");
    expect(withDoctorTitle("Dr Dr Henry")).toBe("Dr Henry");
    expect(withDoctorTitle("Dr. Dr. Henry")).toBe("Dr Henry");
  });

  it("trims and collapses stray whitespace", () => {
    expect(withDoctorTitle("   Dr.   Henry  ")).toBe("Dr Henry");
    expect(withDoctorTitle("Dr   Henry")).toBe("Dr Henry");
  });

  it("respects non-doctor honorifics instead of demoting them", () => {
    expect(withDoctorTitle("Prof Henry")).toBe("Prof Henry");
    expect(withDoctorTitle("Professor Henry")).toBe("Professor Henry");
  });

  it("leaves blank names blank and handles a bare title", () => {
    expect(withDoctorTitle("")).toBe("");
    expect(withDoctorTitle("   ")).toBe("");
    expect(withDoctorTitle(null)).toBe("");
    expect(withDoctorTitle(undefined)).toBe("");
    expect(withDoctorTitle("Dr.")).toBe("Dr");
  });

  it("does not mistake names that merely start with 'Dr'", () => {
    expect(withDoctorTitle("Drew Henry")).toBe("Dr Drew Henry");
  });
});

describe("stripDoctorTitle", () => {
  it("removes one or more leading doctor titles", () => {
    expect(stripDoctorTitle("Dr Henry")).toBe("Henry");
    expect(stripDoctorTitle("Dr. Henry")).toBe("Henry");
    expect(stripDoctorTitle("Dr Dr Henry")).toBe("Henry");
    expect(stripDoctorTitle("Henry")).toBe("Henry");
  });
});
