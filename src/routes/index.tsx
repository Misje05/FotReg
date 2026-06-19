import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, CreditCard, Users } from "lucide-react";
import heroImg from "@/assets/hero-football.jpg";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FotReg — Football registration for parents" },
      {
        name: "description",
        content:
          "Manage children, buy punch cards or subscriptions, and sign your kids up for training sessions — all from one parent account.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div>
            <span className="inline-block rounded-full bg-accent/30 px-3 py-1 text-xs font-medium uppercase tracking-wider text-accent-foreground">
              {t.landing.eyebrow}
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] text-foreground md:text-6xl">
              {t.landing.heroTitle}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              {t.landing.heroSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth">
                <Button size="lg">{t.landing.primaryCta}</Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline">
                  {t.landing.secondaryCta}
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-accent/20 blur-2xl" aria-hidden />
            <img
              src={heroImg}
              alt="Youth football players running on a Nordic pitch"
              width={1600}
              height={1100}
              className="relative rounded-2xl border border-border/60 object-cover shadow-2xl shadow-primary/10"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/60 bg-card/50">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:grid-cols-3">
          {[
            {
              icon: Users,
              title: t.landing.feature1Title,
              body: t.landing.feature1Body,
            },
            {
              icon: CreditCard,
              title: t.landing.feature2Title,
              body: t.landing.feature2Body,
            },
            {
              icon: CalendarCheck,
              title: t.landing.feature3Title,
              body: t.landing.feature3Body,
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card p-6 transition hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="font-display text-3xl font-bold md:text-4xl">
          {t.landing.howItWorks}
        </h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {[
            { n: "01", title: t.landing.step1, body: t.landing.step1Body },
            { n: "02", title: t.landing.step2, body: t.landing.step2Body },
            { n: "03", title: t.landing.step3, body: t.landing.step3Body },
          ].map((s) => (
            <li key={s.n} className="border-l-2 border-accent pl-5">
              <div className="font-display text-sm font-semibold text-accent-foreground/80">
                {s.n}
              </div>
              <div className="mt-1 font-display text-lg font-semibold">{s.title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12">
          <Link to="/auth">
            <Button size="lg">{t.landing.primaryCta}</Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10 text-center text-sm text-muted-foreground">
        {t.landing.footer}
      </footer>
    </div>
  );
}
