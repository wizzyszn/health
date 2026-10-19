import { describe, expect, it } from "vitest";
import { DEFAULT_MEDIA_BY_ROLE } from "./use-daily-video-room.hook";

/**
 * Regression cover for the "voice isn't being transmitted" report.
 *
 * A patient who joins with `startAudioOff: true` publishes no audio at all
 * until they find the mic button. The far side sees a live tile and hears
 * nothing, and nothing in the payload says why — so the call reads as broken
 * rather than as muted. Patients now join audible, which is the behaviour
 * these assertions pin down.
 */
describe("DEFAULT_MEDIA_BY_ROLE", () => {
  it("joins the patient with the microphone live", () => {
    expect(DEFAULT_MEDIA_BY_ROLE.patient.startAudioOff).toBe(false);
  });

  it("keeps the patient's camera opt-in", () => {
    // Audible on join, but not visible on join: being heard is implied by
    // joining a call to speak to a doctor, being seen is a separate choice.
    expect(DEFAULT_MEDIA_BY_ROLE.patient.startVideoOff).toBe(true);
  });

  it("joins the doctor ready to examine", () => {
    expect(DEFAULT_MEDIA_BY_ROLE.doctor).toEqual({
      startAudioOff: false,
      startVideoOff: false,
    });
  });

  it("never leaves either role unable to be heard", () => {
    for (const role of ["doctor", "patient"] as const) {
      expect(DEFAULT_MEDIA_BY_ROLE[role].startAudioOff).toBe(false);
    }
  });
});
