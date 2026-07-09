import VoiceClient from "@/components/voice-client";
import { getRequestLanguage } from "@/lib/i18n/server";
import { VOICE_DISCLAIMER, VOICE_TITLE } from "@/lib/teacher/voice";

export default async function VoicePage() {
  const language = await getRequestLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">{VOICE_TITLE[language]}</h1>
        <p className="prose-dhamma text-ink-soft">
          {VOICE_DISCLAIMER[language]}
        </p>
      </div>
      <VoiceClient language={language} />
    </div>
  );
}
