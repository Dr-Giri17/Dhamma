import AskClient from "@/components/ask-client";

export default function AskPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Ask Dhamma</h1>
        <p className="prose-dhamma text-ink-soft">
          Ask a question about Theravāda teaching. Every doctrinal answer cites
          its sources. If the corpus holds no support, the answer says so
          plainly — it never invents a quotation or a Pāli term.
        </p>
      </div>
      <AskClient />
    </div>
  );
}
