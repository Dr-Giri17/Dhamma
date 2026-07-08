import AskClient from "@/components/ask-client";
import { getRequestLanguage } from "@/lib/i18n/server";
import { getUi } from "@/lib/ui";

export default async function AskPage() {
  const language = await getRequestLanguage();
  const ui = getUi(language);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">{ui.ask.title}</h1>
        <p className="prose-dhamma text-ink-soft">
          {ui.ask.description}
        </p>
      </div>
      <AskClient language={language} ui={ui.ask} />
    </div>
  );
}
