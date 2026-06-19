import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  listUpcomingSessions,
  listMyChildren,
  signupForSession,
  getCreditSummary,
} from "@/lib/fotreg.functions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/sessions")({
  component: SessionsPage,
});

function SessionsPage() {
  const sessionsFn = useServerFn(listUpcomingSessions);
  const childrenFn = useServerFn(listMyChildren);
  const creditsFn = useServerFn(getCreditSummary);
  const signupFn = useServerFn(signupForSession);
  const qc = useQueryClient();

  const sessionsQ = useSuspenseQuery({
    queryKey: ["upcoming-sessions"],
    queryFn: () => sessionsFn(),
  });
  const childrenQ = useSuspenseQuery({ queryKey: ["children"], queryFn: () => childrenFn() });
  const creditsQ = useSuspenseQuery({ queryKey: ["credits"], queryFn: () => creditsFn() });

  const [selectedChild, setSelectedChild] = useState<Record<string, string>>({});

  const signupM = useMutation({
    mutationFn: (vars: { childId: string; sessionId: string }) => signupFn({ data: vars }),
    onSuccess: () => {
      toast.success(t.sessions.signedUp);
      qc.invalidateQueries({ queryKey: ["signups"] });
      qc.invalidateQueries({ queryKey: ["credits"] });
    },
    onError: (e: any) => {
      const msg = e?.message ?? "";
      if (msg === "NO_CREDITS") toast.error(t.sessions.noCreditsError);
      else if (msg === "ALREADY_SIGNED_UP") toast.warning(t.sessions.alreadySignedUp);
      else toast.error(msg || t.auth.error);
    },
  });

  const noChildren = childrenQ.data.length === 0;
  const canBook = creditsQ.data.subscription_active || creditsQ.data.remaining_credits > 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold md:text-4xl">{t.sessions.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.sessions.subtitle}</p>
      </header>

      {noChildren && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-6">
          <p className="text-sm">
            {t.sessions.noChildren}{" "}
            <Link to="/children" className="font-medium underline">
              {t.children.addNew}
            </Link>
          </p>
        </div>
      )}

      {!noChildren && !canBook && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6">
          <p className="text-sm text-destructive">
            {t.sessions.noCreditsError}{" "}
            <Link to="/buy" className="font-medium underline">
              {t.dashboard.buyMore}
            </Link>
          </p>
        </div>
      )}

      {sessionsQ.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.sessions.empty}</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {sessionsQ.data.map((s) => (
            <li key={s.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(s.starts_at), "EEEE d MMMM · HH:mm")}–
                    {format(new Date(s.ends_at), "HH:mm")}
                  </p>
                </div>
                {s.team_group && (
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                    {s.team_group}
                  </span>
                )}
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div>
                  <dt className="text-xs uppercase tracking-wide">{t.sessions.coach}</dt>
                  <dd className="text-foreground">{s.coach_name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide">{t.sessions.location}</dt>
                  <dd className="text-foreground">{s.location ?? "—"}</dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Select
                  value={selectedChild[s.id] ?? ""}
                  onValueChange={(v) => setSelectedChild((p) => ({ ...p, [s.id]: v }))}
                  disabled={noChildren}
                >
                  <SelectTrigger className="min-w-[180px]">
                    <SelectValue placeholder={t.sessions.selectChild} />
                  </SelectTrigger>
                  <SelectContent>
                    {childrenQ.data.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  disabled={!selectedChild[s.id] || !canBook || signupM.isPending}
                  onClick={() =>
                    signupM.mutate({ childId: selectedChild[s.id], sessionId: s.id })
                  }
                >
                  {t.sessions.signUp}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
