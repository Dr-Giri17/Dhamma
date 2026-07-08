import AskClient from "@/components/ask-client";
import { UI } from "@/lib/ui";

export default function AskPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">{UI.ask.title}</h1>
        <p className="prose-dhamma text-ink-soft">
          {UI.ask.description}
        </p>
      </div>
      <AskClient />
    </div>
  );
}
