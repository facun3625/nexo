import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StoreHero } from "@/components/catalog/store-hero";
import { StoreFooter } from "@/components/catalog/store-footer";
import { getCurrentTenant } from "@/lib/tenant";
import { getStoreSettings } from "@/lib/settings";
import { FAQ_CATEGORIES } from "@/lib/faq-content";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  alternates: { canonical: "/preguntas-frecuentes" },
};

// FAQPage le permite a Google mostrar estas preguntas plegables directo en
// los resultados de búsqueda (rich snippet), sin que la persona tenga que
// entrar al sitio para verlas.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_CATEGORIES.flatMap(({ questions }) =>
    questions.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  ),
};

export default async function FrequentlyAskedQuestionsPage() {
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();
  const settings = await getStoreSettings(tenant.id);

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <StoreHero />

      <section className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <p className="text-xs font-black uppercase tracking-[.18em] text-primary">Centro de ayuda</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Preguntas frecuentes</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Todo lo que necesitás saber antes de consultar o visitar una propiedad con {settings.storeName}.
        </p>

        <div className="mt-10 space-y-10">
          {FAQ_CATEGORIES.map(({ icon: Icon, title, questions }) => (
            <section key={title}>
              <div className="mb-3 flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <h2 className="text-xl font-bold tracking-tight">{title}</h2>
              </div>
              <div className="divide-y rounded-xl border">
                {questions.map(([question, answer]) => (
                  <details key={question} className="group px-4 py-3">
                    <summary className="cursor-pointer list-none text-sm font-medium">
                      {question}
                    </summary>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <StoreFooter />
    </main>
  );
}
