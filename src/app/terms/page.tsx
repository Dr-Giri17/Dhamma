import Link from "next/link";
import { GLOSSARY } from "@/lib/corpus/glossary";
import { getRequestLanguage } from "@/lib/i18n/server";
import { getUi } from "@/lib/ui";

export default async function TermsPage() {
  const language = await getRequestLanguage();
  const ui = getUi(language);
  const sorted = [...GLOSSARY].sort((a, b) => a.pali.localeCompare(b.pali));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">{ui.terms.title}</h1>
        <p className="prose-dhamma text-ink-soft">
          {ui.terms.description}
        </p>
      </div>
      <dl className="space-y-4">
        {sorted.map((t) => (
          <div key={t.pali} className="card-dhamma">
            <dt className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="pali font-serif text-xl">{t.pali}</span>
              <span className="text-sm text-ink-soft">{t.english}</span>
              {t.russian ? (
                <span className="text-sm text-ink-faint">{t.russian}</span>
              ) : null}
              {t.status === "draft" ? (
                <span className="text-xs text-warn uppercase">{ui.terms.draft}</span>
              ) : null}
            </dt>
            <dd className="mt-1">
              <p className="prose-dhamma">{t.shortDefinition}</p>
              <p className="text-xs text-accent-strong mt-1">
                {ui.terms.refs}{" "}
                {t.canonicalRefs.map((r, i) => (
                  <span key={r}>
                    <Link href={`/search?q=${encodeURIComponent(r)}`} className="link-dhamma">
                      {r}
                    </Link>
                    {i < t.canonicalRefs.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
