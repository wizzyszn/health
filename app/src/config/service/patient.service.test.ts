import { describe, expect, it } from "vitest";
import { sanitizeProfilePatch } from "./patient.service";

describe("sanitizeProfilePatch", () => {
  it("strips server-only keys (mrn, _id, registration_no, etc.)", () => {
    const result = sanitizeProfilePatch({
      first_name: "Ada",
      mrn: "C-HACKED",
      _id: "x",
      registration_no: "y",
      email: "ada@example.com",
      age: "30",
      createdAt: "2024-01-01",
      updatedAt: "2024-06-01",
    });
    expect(result).toEqual({ first_name: "Ada" });
  });

  it("drops undefined values but keeps empty arrays (explicit clear)", () => {
    const result = sanitizeProfilePatch({
      allergies: [],
      address: undefined,
      occupation: "",
    });
    expect(result).toEqual({ allergies: [], occupation: "" });
  });

  it("passes through all allowed keys unchanged", () => {
    const input = {
      first_name: "Jane",
      last_name: "Doe",
      phone_number: "08012345678",
      date_of_birth: "1990-05-15",
      gender: "Female",
      marital_status: "Single",
      occupation: "Engineer",
      address: "123 Main St",
      allergies: ["Penicillin"],
      previous_medical_conditions: ["Asthma"],
      medical_flags: [],
      profile_picture_url: "https://example.com/pic.jpg",
    };
    const result = sanitizeProfilePatch(input);
    expect(result).toEqual(input);
  });

  it("returns empty object when all keys are server-only", () => {
    const result = sanitizeProfilePatch({
      _id: "abc",
      mrn: "MRN-001",
      registration_no: "REG-002",
      email: "test@test.com",
      age: "25",
      createdAt: "2024-01-01",
      updatedAt: "2024-12-01",
    });
    expect(result).toEqual({});
  });
});
