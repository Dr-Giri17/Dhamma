"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import type { SupportedLanguage } from "@/lib/i18n/language";
import type { GuideAnswer, GuideWarning } from "@/lib/guide/types";
import type { TeacherMode } from "@/lib/teacher/types";
import { MODE_LABELS } from "@/lib/teacher/voice";
import {
  INITIAL_VOICE_STATE,
  canSubmitTranscript,
  mapRecognitionError,
  recognitionLocale,
  voiceSessionReducer,
} from "@/lib/voice/browser";

interface RecognitionResultLike { isFinal: boolean; 0: { transcript: string } }
interface RecognitionEventLike { resultIndex: number; results: ArrayLike<RecognitionResultLike> }
interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionConstructor = new () => RecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  }
}

const modes: TeacherMode[] = ["strict_source", "explain_simple", "dhamma_voice"];

export default function VoiceClient({ language }: { language: SupportedLanguage }) {
  const [session, dispatch] = useReducer(voiceSessionReducer, INITIAL_VOICE_STATE);
  const [voiceLanguage, setVoiceLanguage] = useState<SupportedLanguage>(language);
  const [mode, setMode] = useState<TeacherMode>("dhamma_voice");
  const [answer, setAnswer] = useState<GuideAnswer | null>(null);
  const [pending, setPending] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState<boolean | null>(null);
  const [ttsSupported, setTtsSupported] = useState<boolean | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const resultRef = useRef<HTMLElement | null>(null);
  const t = copy[language];

  useEffect(() => {
    setRecognitionSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
    setTtsSupported(Boolean(window.speechSynthesis && window.SpeechSynthesisUtterance));
    return () => {
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (answer) resultRef.current?.focus();
  }, [answer]);

  function updateTranscript(value: string) {
    dispatch({ type: "transcript", value });
  }

  function startListening() {
    const Constructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Constructor) {
      dispatch({ type: "error", error: "unsupported" });
      setStatusMessage(t.errors.unsupported);
      return;
    }
    recognitionRef.current?.abort();
    const recognition = new Constructor();
    recognition.lang = recognitionLocale(voiceLanguage);
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += `${event.results[index][0].transcript} `;
      }
      updateTranscript(transcript);
      setStatusMessage(t.listeningLive);
    };
    recognition.onerror = (event) => {
      const error = mapRecognitionError(event.error);
      dispatch({ type: "error", error });
      setStatusMessage(t.errors[error]);
    };
    recognition.onend = () => {
      dispatch({ type: "stop" });
      setStatusMessage(t.stopped);
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      dispatch({ type: "start" });
      setStatusMessage(t.listening);
    } catch {
      dispatch({ type: "error", error: "unknown" });
      setStatusMessage(t.errors.unknown);
    }
  }

  function stopListening() {
    recognitionRef.current?.stop();
    dispatch({ type: "stop" });
    setStatusMessage(t.stopped);
  }

  function cancelListening() {
    recognitionRef.current?.abort();
    dispatch({ type: "cancel" });
    setStatusMessage(t.cancelled);
  }

  async function teach(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmitTranscript(session.transcript)) {
      setStatusMessage(t.errors.empty);
      return;
    }
    setPending(true);
    setAnswer(null);
    try {
      const response = await fetch("/api/guide", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: session.transcript, language: voiceLanguage, mode }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setAnswer(await response.json() as GuideAnswer);
      setStatusMessage(t.answerReady);
    } catch {
      setStatusMessage(t.errors.request);
    } finally {
      setPending(false);
    }
  }

  function playAnswer() {
    if (!answer || !ttsSupported) {
      setStatusMessage(t.errors.ttsUnsupported);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(answer.answer);
    utterance.lang = recognitionLocale(voiceLanguage);
    utterance.onend = () => dispatch({ type: "stop-playback" });
    utterance.onerror = () => {
      dispatch({ type: "stop-playback" });
      setStatusMessage(t.errors.playback);
    };
    window.speechSynthesis.speak(utterance);
    dispatch({ type: "play" });
    setStatusMessage(t.playing);
  }

  function pauseOrResume() {
    if (!window.speechSynthesis) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setStatusMessage(t.playing);
    } else {
      window.speechSynthesis.pause();
      setStatusMessage(t.paused);
    }
  }

  function stopPlayback() {
    window.speechSynthesis?.cancel();
    dispatch({ type: "stop-playback" });
    setStatusMessage(t.playbackStopped);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={teach} className="space-y-4">
        <label className="block text-sm font-medium">
          {t.voiceLanguage}
          <select
            value={voiceLanguage}
            onChange={(event) => setVoiceLanguage(event.target.value as SupportedLanguage)}
            className="ml-3 rounded-md border border-line bg-surface px-3 py-2"
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
            <option value="id">Indonesia</option>
          </select>
        </label>

        <textarea
          value={session.transcript}
          onChange={(event) => updateTranscript(event.target.value)}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder={t.placeholder}
          aria-label={t.transcript}
          rows={4}
          className="w-full px-4 py-3 rounded-md border border-line bg-surface text-ink focus:outline-none focus:border-accent-strong"
        />

        <div className="flex flex-wrap gap-2">
          <VoiceButton onClick={startListening} disabled={session.listening}>{t.start}</VoiceButton>
          <VoiceButton onClick={stopListening} disabled={!session.listening}>{t.stop}</VoiceButton>
          <VoiceButton onClick={cancelListening}>{t.cancel}</VoiceButton>
        </div>

        {recognitionSupported === false ? (
          <p className="text-sm text-warn">{t.errors.unsupported} {t.textFallback}</p>
        ) : null}
        <p aria-live="polite" className="text-sm text-ink-faint min-h-5">{statusMessage}</p>

        <div className="flex flex-wrap items-center gap-2">
          {modes.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={item === mode}
              onClick={() => setMode(item)}
              className={item === mode ? "px-3 py-2 rounded-md bg-action text-white text-sm" : buttonClass}
            >
              {MODE_LABELS[language][item]}
            </button>
          ))}
        </div>

        <button type="submit" disabled={pending} className="px-5 py-2 rounded-md bg-action text-white disabled:opacity-50 hover:bg-action-soft">
          {pending ? t.pending : t.button}
        </button>
      </form>

      {answer ? (
        <section ref={resultRef} tabIndex={-1} className="space-y-4 outline-none">
          <div className="card-dhamma space-y-3">
            <div className="flex flex-wrap gap-3 text-xs text-accent-strong">
              <span>{MODE_LABELS[language][answer.mode]}</span>
              <span>{answer.groundingStatus}</span>
              <span>{answer.answerType}</span>
            </div>
            <h2 className="font-serif text-xl">{t.appExplanation}</h2>
            <p className="prose-dhamma whitespace-pre-wrap">{answer.answer}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <VoiceButton onClick={playAnswer}>{t.play}</VoiceButton>
            <VoiceButton onClick={pauseOrResume} disabled={!session.playing}>{t.pause}</VoiceButton>
            <VoiceButton onClick={stopPlayback} disabled={!session.playing}>{t.stopPlayback}</VoiceButton>
            <VoiceButton onClick={playAnswer}>{t.replay}</VoiceButton>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="card-dhamma lg:col-span-2">
              <h3 className="font-serif text-lg mb-2">{t.directExcerpts}</h3>
              {answer.directExcerpts.length > 0 ? (
                <ul className="space-y-4">
                  {answer.directExcerpts.map((excerpt) => (
                    <li key={excerpt.id}>
                      <blockquote className="border-l-2 border-accent pl-3 text-sm">{excerpt.text}</blockquote>
                      <a href={excerpt.route} className="link-dhamma text-xs">
                        {excerpt.sourceRef} · {excerpt.segmentUid} · {excerpt.language.toUpperCase()}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-ink-faint">{t.noSources}</p>}
            </div>
            <div className="space-y-4">
              <div className="card-dhamma">
                <h3 className="font-serif text-lg mb-2">{t.sources}</h3>
                <ul className="text-sm space-y-2">
                  {answer.citations.map((citation) => (
                    <li key={citation.id}>
                      <a href={citation.route} className="link-dhamma">
                        {citation.sourceRef} · {citation.segmentUid}
                      </a>
                      <p className="text-xs text-ink-faint">{citation.translator} · {citation.licenseName}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card-dhamma">
                <h3 className="font-serif text-lg mb-2">{t.warnings}</h3>
                <ul className="text-sm text-ink-soft space-y-1">
                  {answer.warnings.map((warning) => (
                    <li key={warning}>{warningLabels[language][warning]}</li>
                  ))}
                </ul>
                {answer.fallbackUsed ? <p className="text-xs text-warn mt-2">{t.fallback}</p> : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

const buttonClass = "rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink-soft hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";

function VoiceButton({ children, onClick, disabled = false }: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return <button type="button" onClick={onClick} disabled={disabled} className={buttonClass}>{children}</button>;
}

const warningLabels: Record<SupportedLanguage, Record<GuideWarning, string>> = {
  en: {
    "app-explanation-not-scripture": "App explanation, not scripture.",
    "language-fallback": "Requested translation is unavailable; English fallback is shown.",
    "no-relevant-source": "No sufficiently relevant imported source was found.",
    "refused-to-impersonate-buddha": "Refused Buddha impersonation.",
    "refused-to-fabricate-quote": "Refused to fabricate scripture.",
    "not-an-ordained-monk": "The app is not an ordained monk.",
    "synthesis-validation-failed": "Optional synthesis failed validation; deterministic fallback used.",
  },
  ru: {
    "app-explanation-not-scripture": "Объяснение приложения, не писание.",
    "language-fallback": "Перевод недоступен; показан английский fallback.",
    "no-relevant-source": "Достаточно релевантный импортированный источник не найден.",
    "refused-to-impersonate-buddha": "Отказ от представления себя Буддой.",
    "refused-to-fabricate-quote": "Отказ от вымышленной цитаты.",
    "not-an-ordained-monk": "Приложение не является посвящённым монахом.",
    "synthesis-validation-failed": "Опциональный синтез не прошёл проверку; использован детерминированный ответ.",
  },
  id: {
    "app-explanation-not-scripture": "Penjelasan aplikasi, bukan kitab suci.",
    "language-fallback": "Terjemahan belum tersedia; fallback bahasa Inggris ditampilkan.",
    "no-relevant-source": "Tidak ditemukan sumber impor yang cukup relevan.",
    "refused-to-impersonate-buddha": "Menolak peniruan sebagai Buddha.",
    "refused-to-fabricate-quote": "Menolak membuat kitab suci palsu.",
    "not-an-ordained-monk": "Aplikasi bukan bhikkhu tertahbis.",
    "synthesis-validation-failed": "Sintesis opsional gagal validasi; fallback deterministik digunakan.",
  },
};

const copy = {
  en: voiceCopy({
    placeholder: "Ask a source-grounded Dhamma question", transcript: "Voice transcript or text question", voiceLanguage: "Voice language",
    button: "Ask guide", pending: "Retrieving sources…", start: "Start listening", stop: "Stop listening", cancel: "Cancel",
    listening: "Listening…", listeningLive: "Live transcript updated.", stopped: "Listening stopped; transcript remains editable.",
    cancelled: "Listening cancelled; text input remains available.", answerReady: "Grounded answer ready.", playing: "Playing answer.",
    paused: "Playback paused.", playbackStopped: "Playback stopped.", textFallback: "Type your question instead.",
    appExplanation: "App explanation", directExcerpts: "Direct excerpts", sources: "Sources", warnings: "Warnings",
    noSources: "No direct excerpts.", fallback: "A language fallback was used.", play: "Play answer", pause: "Pause / resume",
    stopPlayback: "Stop playback", replay: "Replay",
  }, {
    unsupported: "Speech recognition is not supported in this browser.", "permission-denied": "Microphone permission was denied.",
    "no-speech": "No speech was detected.", "audio-capture": "No microphone is available.", network: "Speech recognition network error.",
    unknown: "Microphone input failed.", empty: "Enter or record a question first.", request: "The guide request failed.",
    ttsUnsupported: "Text-to-speech is not supported in this browser.", playback: "Playback failed.",
  }),
  ru: voiceCopy({
    placeholder: "Задайте вопрос по Дхамме с опорой на источники", transcript: "Голосовая расшифровка или текстовый вопрос", voiceLanguage: "Язык голоса",
    button: "Спросить проводника", pending: "Поиск источников…", start: "Начать слушать", stop: "Остановить запись", cancel: "Отмена",
    listening: "Слушаю…", listeningLive: "Расшифровка обновлена.", stopped: "Запись остановлена; текст можно редактировать.",
    cancelled: "Запись отменена; текстовый ввод доступен.", answerReady: "Ответ с источниками готов.", playing: "Ответ воспроизводится.",
    paused: "Воспроизведение приостановлено.", playbackStopped: "Воспроизведение остановлено.", textFallback: "Введите вопрос текстом.",
    appExplanation: "Объяснение приложения", directExcerpts: "Прямые выдержки", sources: "Источники", warnings: "Предупреждения",
    noSources: "Прямых выдержек нет.", fallback: "Использован языковой fallback.", play: "Озвучить ответ", pause: "Пауза / продолжить",
    stopPlayback: "Остановить звук", replay: "Повторить",
  }, {
    unsupported: "Распознавание речи не поддерживается этим браузером.", "permission-denied": "Доступ к микрофону запрещён.",
    "no-speech": "Речь не обнаружена.", "audio-capture": "Микрофон недоступен.", network: "Сетевая ошибка распознавания речи.",
    unknown: "Ошибка голосового ввода.", empty: "Сначала введите или запишите вопрос.", request: "Не удалось получить ответ проводника.",
    ttsUnsupported: "Озвучивание не поддерживается этим браузером.", playback: "Ошибка воспроизведения.",
  }),
  id: voiceCopy({
    placeholder: "Ajukan pertanyaan Dhamma yang berpijak pada sumber", transcript: "Transkrip suara atau pertanyaan teks", voiceLanguage: "Bahasa suara",
    button: "Tanya panduan", pending: "Mencari sumber…", start: "Mulai mendengarkan", stop: "Berhenti mendengarkan", cancel: "Batal",
    listening: "Mendengarkan…", listeningLive: "Transkrip langsung diperbarui.", stopped: "Perekaman berhenti; transkrip tetap dapat diedit.",
    cancelled: "Perekaman dibatalkan; input teks tetap tersedia.", answerReady: "Jawaban bersumber siap.", playing: "Memutar jawaban.",
    paused: "Pemutaran dijeda.", playbackStopped: "Pemutaran dihentikan.", textFallback: "Ketik pertanyaan sebagai gantinya.",
    appExplanation: "Penjelasan aplikasi", directExcerpts: "Kutipan langsung", sources: "Sumber", warnings: "Peringatan",
    noSources: "Tidak ada kutipan langsung.", fallback: "Fallback bahasa digunakan.", play: "Putar jawaban", pause: "Jeda / lanjutkan",
    stopPlayback: "Hentikan pemutaran", replay: "Putar ulang",
  }, {
    unsupported: "Pengenalan suara tidak didukung browser ini.", "permission-denied": "Izin mikrofon ditolak.",
    "no-speech": "Tidak ada ucapan terdeteksi.", "audio-capture": "Mikrofon tidak tersedia.", network: "Kesalahan jaringan pengenalan suara.",
    unknown: "Input mikrofon gagal.", empty: "Masukkan atau rekam pertanyaan terlebih dahulu.", request: "Permintaan panduan gagal.",
    ttsUnsupported: "Text-to-speech tidak didukung browser ini.", playback: "Pemutaran gagal.",
  }),
} as const;

function voiceCopy<T extends Record<string, string>, E extends Record<string, string>>(base: T, errors: E) {
  return { ...base, errors };
}
