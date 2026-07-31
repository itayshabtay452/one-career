import Link from "next/link";

import { defaultLocale } from "@/i18n/config";
import { dictionaries } from "@/i18n/dictionaries";

export default function Home() {
  const dictionary = dictionaries[defaultLocale];

  return (
    <main className="launch-shell" data-testid="launch-screen">
      <div className="pitch-grid" aria-hidden="true" />
      <div className="orb orb-lime" aria-hidden="true" />
      <div className="orb orb-orange" aria-hidden="true" />

      <header className="topbar">
        <Link className="brand" href="/" aria-label={dictionary.brandHomeLabel}>
          <span className="brand-mark" aria-hidden="true">
            1
          </span>
          <span>{dictionary.brandName}</span>
        </Link>
        <span className="build-tag">{dictionary.buildTag}</span>
      </header>

      <section className="hero" aria-labelledby="launch-title">
        <p className="eyebrow">{dictionary.eyebrow}</p>
        <h1 id="launch-title">{dictionary.title}</h1>
        <p className="hero-copy">{dictionary.description}</p>

        <div className="status-card">
          <span className="status-dot" aria-hidden="true" />
          <span>{dictionary.status}</span>
        </div>
      </section>

      <section
        className="stat-grid"
        aria-label={dictionary.careerFormatLabel}
      >
        {dictionary.stats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

      <footer className="launch-footer">
        <span>{dictionary.footerLead}</span>
        <span className="footer-rule" aria-hidden="true" />
        <span>{dictionary.footerClosing}</span>
      </footer>
    </main>
  );
}
