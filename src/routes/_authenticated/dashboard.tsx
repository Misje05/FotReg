import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  getCreditSummary,
  listMyChildren,
  listMySignups,
  cancelSignup,
} from "@/lib/fotreg.functions";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const credits = useServerFn(getCreditSummary);
  const childrenFn = useServerFn(listMyChildren);
  const signupsFn = useServerFn(listMySignups);
  const cancelFn = useServerFn(cancelSignup);
  const qc = useQueryClient();

  const creditsQ = useSuspenseQuery({ queryKey: ["credits"], queryFn: () => credits() });
  const childrenQ = useSuspenseQuery({ queryKey: ["children"], queryFn: () => childrenFn() });
  const signupsQ = useSuspenseQuery({ queryKey: ["signups"], queryFn: () => signupsFn() });

  const cancelM = useMutation({
    mutationFn: (id: string) => cancelFn({ data: { id } }),
    onSuccess: () => {
      toast.success(t.dashboard.canceled);
      qc.invalidateQueries({ queryKey: ["signups"] });
      qc.invalidateQueries({ queryKey: ["credits"] });
    },
    onError: (e: any) => toast.error(e?.message ?? t.auth.error),
  });

  const remaining = creditsQ.data.remaining_credits;
  const subActive = creditsQ.data.subscription_active;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-3xl font-bold md:text-4xl">{t.dashboard.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.dashboard.subtitle}</p>
      </header>

      {/* Stat row */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label={t.dashboard.creditsLabel}
          value={remaining > 0 ? String(remaining) : t.dashboard.noCredits}
          tone={remaining > 0 ? "default" : "warn"}
          cta={
            <Link to="/buy">
              <Button size="sm" variant="outline">
                {t.dashboard.buyMore}
              </Button>
            </Link>
          }
        />
        <StatCard
          label={t.dashboard.subActiveLabel}
          value={subActive ? t.dashboard.subActive : t.dashboard.subInactive}
          tone={subActive ? "good" : "default"}
        />
        <StatCard
          label={t.dashboard.childrenLabel}
          value={`${childrenQ.data.length}`}
          cta={
            <Link to="/children">
              <Button size="sm" variant="outline">
                {t.dashboard.manageChildren}
              </Button>
            </Link>
          }
        />
      </div>

      {/* Upcoming */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">{t.dashboard.upcoming}</h2>
          <Link to="/sessions">
            <Button size="sm">{t.dashboard.browseSessions}</Button>
          </Link>
        </div>

        {childrenQ.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t.dashboard.addFirstChild}{" "}
            <Link to="/children" className="text-foreground underline">
              {t.children.addNew}
            </Link>
          </p>
        ) : signupsQ.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.dashboard.noUpcoming}</p>
        ) : (
          <ul className="divide-y divide-border">
            {signupsQ.data.map((s: any) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <div className="font-medium">
                    {s.training_sessions.title}
                    <span className="ml-2 text-sm text-muted-foreground">
                      — {s.children.name}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(s.training_sessions.starts_at), "EEE d MMM, HH:mm")} ·{" "}
                    {s.training_sessions.location ?? "—"}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => cancelM.mutate(s.id)}
                  disabled={cancelM.isPending}
                >
                  {t.dashboard.cancel}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
  cta,
}: {
  label: string;
  value: string;
  tone?: "default" | "good" | "warn";
  cta?: React.ReactNode;
}) {
  const toneClass =
    tone === "good"
      ? "text-success"
      : tone === "warn"
        ? "text-destructive"
        : "text-foreground";
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5">
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className={`mt-2 font-display text-2xl font-semibold ${toneClass}`}>{value}</div>
      </div>
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}
