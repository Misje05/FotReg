import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, Clock } from "lucide-react";
import { format } from "date-fns";
import {
  createPunchCardOrder,
  createSubscriptionOrder,
  getCreditSummary,
  listMyOrders,
} from "@/lib/fotreg.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/buy")({
  component: BuyPage,
});

const PACKS: Array<{ credits: 6 | 12 | 18; price: string; perSession: string }> = [
  { credits: 6, price: "590 kr", perSession: "98 kr/session" },
  { credits: 12, price: "1090 kr", perSession: "91 kr/session" },
  { credits: 18, price: "1490 kr", perSession: "83 kr/session" },
];

function formatNok(cents: number) {
  return `${(cents / 100).toFixed(0)} kr`;
}

function BuyPage() {
  const punchFn = useServerFn(createPunchCardOrder);
  const subFn = useServerFn(createSubscriptionOrder);
  const creditsFn = useServerFn(getCreditSummary);
  const ordersFn = useServerFn(listMyOrders);
  const qc = useQueryClient();

  const creditsQ = useSuspenseQuery({ queryKey: ["credits"], queryFn: () => creditsFn() });
  const ordersQ = useSuspenseQuery({ queryKey: ["my-orders"], queryFn: () => ordersFn() });

  const punchM = useMutation({
    mutationFn: (credits: 6 | 12 | 18) => punchFn({ data: { credits } }),
    onSuccess: () => {
      toast.success("Order created — awaiting payment");
      qc.invalidateQueries({ queryKey: ["my-orders"] });
    },
    onError: (e: any) => toast.error(e?.message ?? t.auth.error),
  });

  const subM = useMutation({
    mutationFn: () => subFn(),
    onSuccess: () => {
      toast.success("Subscription order created — awaiting payment");
      qc.invalidateQueries({ queryKey: ["my-orders"] });
    },
    onError: (e: any) => toast.error(e?.message ?? t.auth.error),
  });

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-3xl font-bold md:text-4xl">{t.buy.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.buy.subtitle}</p>
      </header>

      <div className="rounded-xl border border-dashed border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
        Payments are not connected yet. Clicking <strong>Buy</strong> creates a pending
        order. An admin can mark it paid in the admin panel to credit your account
        — this is how we'll test the credit flow until Stripe is wired up.
      </div>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold">{t.buy.punchTitle}</h2>
        <p className="mb-6 text-sm text-muted-foreground">{t.buy.punchDesc}</p>
        <div className="grid gap-4 md:grid-cols-3">
          {PACKS.map((p) => (
            <div key={p.credits} className="flex flex-col rounded-2xl border border-border bg-card p-6">
              <div className="font-display text-4xl font-bold">{p.credits}</div>
              <div className="text-sm text-muted-foreground">{t.buy.sessions}</div>
              <div className="mt-4 font-display text-2xl">{p.price}</div>
              <div className="text-xs text-muted-foreground">{p.perSession}</div>
              <Button
                className="mt-6"
                disabled={punchM.isPending}
                onClick={() => punchM.mutate(p.credits)}
              >
                Buy
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold">{t.buy.subTitle}</h2>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="font-display text-3xl font-bold">
                349 kr<span className="text-base font-normal text-muted-foreground">{t.buy.perMonth}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t.buy.subDesc}</p>
              <ul className="mt-4 space-y-1.5 text-sm">
                {["Unlimited sessions for all children", "Cancel anytime", "Priority sign-up"].map(
                  (line) => (
                    <li key={line} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-success" /> {line}
                    </li>
                  ),
                )}
              </ul>
            </div>
            <Button
              size="lg"
              disabled={subM.isPending || creditsQ.data.subscription_active}
              onClick={() => subM.mutate()}
            >
              {creditsQ.data.subscription_active ? t.dashboard.subActive : "Buy subscription"}
            </Button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold">Your orders</h2>
        <div className="rounded-2xl border border-border bg-card">
          {ordersQ.data.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {ordersQ.data.map((o: any) => (
                <li key={o.id} className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <div className="font-medium">
                      {o.type === "punch_card"
                        ? `Punch card · ${o.credits} sessions`
                        : "Monthly subscription"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(o.created_at), "d MMM yyyy, HH:mm")} ·{" "}
                      {formatNok(o.amount_cents)}
                    </div>
                  </div>
                  <StatusBadge status={o.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "paid") return <Badge className="bg-success text-success-foreground">Paid</Badge>;
  if (status === "failed") return <Badge variant="destructive">Failed</Badge>;
  return (
    <Badge variant="secondary" className="gap-1">
      <Clock className="h-3 w-3" /> Pending
    </Badge>
  );
}
