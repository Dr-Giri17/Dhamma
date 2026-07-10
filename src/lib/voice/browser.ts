import type { SupportedLanguage } from "../i18n/language";

export type VoiceErrorCode =
  | "unsupported"
  | "permission-denied"
  | "no-speech"
  | "audio-capture"
  | "network"
  | "unknown";

export interface VoiceSessionState {
  listening: boolean;
  transcript: string;
  status: "idle" | "listening" | "stopped" | "cancelled" | "error";
  error?: VoiceErrorCode;
  playing: boolean;
}

export type VoiceSessionAction =
  | { type: "start" }
  | { type: "transcript"; value: string }
  | { type: "stop" }
  | { type: "end" }
  | { type: "cancel" }
  | { type: "error"; error: VoiceErrorCode }
  | { type: "play" }
  | { type: "stop-playback" };

export const INITIAL_VOICE_STATE: VoiceSessionState = {
  listening: false,
  transcript: "",
  status: "idle",
  playing: false,
};

export function voiceSessionReducer(
  state: VoiceSessionState,
  action: VoiceSessionAction
): VoiceSessionState {
  switch (action.type) {
    case "start":
      return { ...state, listening: true, status: "listening", error: undefined };
    case "transcript":
      return { ...state, transcript: normalizeTranscript(action.value) };
    case "stop":
      return { ...state, listening: false, status: "stopped" };
    case "end":
      if (state.status === "error" || state.status === "cancelled") {
        return { ...state, listening: false };
      }
      return { ...state, listening: false, status: "stopped" };
    case "cancel":
      return { ...state, listening: false, status: "cancelled" };
    case "error":
      return { ...state, listening: false, status: "error", error: action.error };
    case "play":
      return { ...state, playing: true };
    case "stop-playback":
      return { ...state, playing: false };
  }
}

export function recognitionLocale(language: SupportedLanguage): string {
  return { en: "en-US", ru: "ru-RU", id: "id-ID" }[language];
}

export function normalizeTranscript(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function canSubmitTranscript(value: string): boolean {
  return normalizeTranscript(value).length > 0;
}

export function mapRecognitionError(error: string): VoiceErrorCode {
  if (error === "not-allowed" || error === "service-not-allowed") return "permission-denied";
  if (error === "no-speech") return "no-speech";
  if (error === "audio-capture") return "audio-capture";
  if (error === "network") return "network";
  return "unknown";
}
