import { describe, expect, it } from "vitest";
import {
  INITIAL_VOICE_STATE,
  canSubmitTranscript,
  mapRecognitionError,
  recognitionLocale,
  voiceSessionReducer,
} from "../browser";

describe("browser voice helpers", () => {
  it("maps RU, EN, and ID recognition locales", () => {
    expect(recognitionLocale("ru")).toBe("ru-RU");
    expect(recognitionLocale("en")).toBe("en-US");
    expect(recognitionLocale("id")).toBe("id-ID");
  });

  it("handles permission, microphone, network, and no-speech errors", () => {
    expect(mapRecognitionError("not-allowed")).toBe("permission-denied");
    expect(mapRecognitionError("audio-capture")).toBe("audio-capture");
    expect(mapRecognitionError("network")).toBe("network");
    expect(mapRecognitionError("no-speech")).toBe("no-speech");
  });

  it("rejects empty transcripts but keeps text-only fallback usable", () => {
    expect(canSubmitTranscript("   ")).toBe(false);
    expect(canSubmitTranscript("typed question without a microphone")).toBe(true);
  });

  it("supports cancel and stop playback transitions", () => {
    const listening = voiceSessionReducer(INITIAL_VOICE_STATE, { type: "start" });
    const cancelled = voiceSessionReducer(listening, { type: "cancel" });
    expect(cancelled.listening).toBe(false);
    expect(cancelled.status).toBe("cancelled");

    const playing = voiceSessionReducer(cancelled, { type: "play" });
    expect(playing.playing).toBe(true);
    expect(voiceSessionReducer(playing, { type: "stop-playback" }).playing).toBe(false);
  });
});
