import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import {
  isAdmin,
  grantSelfAdmin,
  adminListAllSessions,
  adminCreateSession,
  adminDeleteSession,
  adminListPendingOrders,
  adminMarkOrderPaid,
} from "@/lib/fotreg.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const isAdminFn = useServerFn(isAdmin);
  const grantFn = useServerFn(grantSelfAdmin);
  const listFn = useServerFn(adminListAllSessions);
  const createFn = useServerFn(adminCreateSession);
  const deleteFn = useServerFn(adminDeleteSession);
  const qc = useQueryClient();

  const adminQ = useSuspenseQuery({ queryKey: ["is-admin"], queryFn: () => isAdminFn() });

  const grantM = useMutation({
    mutationFn: () => grantFn(),
    onSuccess: () => {
      toast.success(t.admin.becameAdmin);
      qc.invalidateQueries({ queryKey: ["is-admin"] });
    },
    onError: (e: any) => toast.error(e?.message ?? t.auth.error),
  });

  if (!adminQ.data) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="font-display text-2xl font-semibold">{t.admin.notAdmin}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          For demo purposes you can grant yourself admin access below.
        </p>
        <Button className="mt-6" onClick={() => grantM.mutate()} disabled={grantM.isPending}>
          {t.admin.becomeAdmin}
        </Button>
      </div>
    );
  }

  return <AdminBody listFn={listFn} createFn={createFn} deleteFn={deleteFn} />;
}

function AdminBody({
  listFn,
  createFn,
  deleteFn,
}: {
  listFn: () => Promise<any>;
  createFn: (args: any) => Promise<any>;
  deleteFn: (args: any) => Promise<any>;
}) {
  const qc = useQueryClient();
  const sessionsQ = useSuspenseQuery({
    queryKey: ["admin-sessions"],
    queryFn: () => listFn(),
  });

  const [form, setForm] = useState({
    title: "",
    starts_at: "",
    ends_at: "",
    team_group: "",
    coach_name: "",
    location: "",
    capacity: 20,
  });

  const createM = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          title: form.title,
          starts_at: new Date(form.starts_at).toISOString(),
          ends_at: new Date(form.ends_at).toISOString(),
          team_group: form.team_group || null,
          coach_name: form.coach_name || null,
          location: form.location || null,
          capacity: Number(form.capacity),
        },
      }),
    onSuccess: () => {
      toast.success(t.admin.saved);
      setForm({
        title: "",
        starts_at: "",
        ends_at: "",
        team_group: "",
        coach_name: "",
        location: "",
        capacity: 20,
      });
      qc.invalidateQueries({ queryKey: ["admin-sessions"] });
      qc.invalidateQueries({ queryKey: ["upcoming-sessions"] });
    },
    onError: (e: any) => toast.error(e?.message ?? t.auth.error),
  });

  const delM = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success(t.admin.deleted);
      qc.invalidateQueries({ queryKey: ["admin-sessions"] });
      qc.invalidateQueries({ queryKey: ["upcoming-sessions"] });
    },
    onError: (e: any) => toast.error(e?.message ?? t.auth.error),
  });

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-3xl font-bold md:text-4xl">{t.admin.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.admin.subtitle}</p>
      </header>

      <section className="grid gap-8 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-2xl border border-border bg-card p-6">
          <ul className="divide-y divide-border">
            {sessionsQ.data.map((s: any) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-4">
                <div>
                  <div className="font-medium">{s.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(s.starts_at), "EEE d MMM, HH:mm")} · {s.team_group ?? "—"}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => delM.mutate(s.id)}
                  disabled={delM.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            createM.mutate();
          }}
          className="space-y-4 rounded-2xl border border-border bg-card p-6"
        >
          <h2 className="font-display text-lg font-semibold">{t.admin.create}</h2>
          <Field label={t.admin.sessionTitle}>
            <Input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field label={t.admin.startsAt}>
            <Input
              required
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
            />
          </Field>
          <Field label={t.admin.endsAt}>
            <Input
              required
              type="datetime-local"
              value={form.ends_at}
              onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
            />
          </Field>
          <Field label={t.admin.teamGroup}>
            <Input
              value={form.team_group}
              onChange={(e) => setForm({ ...form, team_group: e.target.value })}
              placeholder="U10"
            />
          </Field>
          <Field label={t.admin.coach}>
            <Input
              value={form.coach_name}
              onChange={(e) => setForm({ ...form, coach_name: e.target.value })}
            />
          </Field>
          <Field label={t.admin.location}>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </Field>
          <Field label={t.admin.capacity}>
            <Input
              type="number"
              min={1}
              max={200}
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
            />
          </Field>
          <Button type="submit" className="w-full" disabled={createM.isPending}>
            {t.admin.create}
          </Button>
        </form>
      </section>

      <PendingOrdersPanel />
    </div>
  );
}

function PendingOrdersPanel() {
  const listFn = useServerFn(adminListPendingOrders);
  const markFn = useServerFn(adminMarkOrderPaid);
  const qc = useQueryClient();

  const ordersQ = useSuspenseQuery({
    queryKey: ["admin-pending-orders"],
    queryFn: () => listFn(),
  });

  const markM = useMutation({
    mutationFn: (id: string) => markFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Order marked paid — credits granted");
      qc.invalidateQueries({ queryKey: ["admin-pending-orders"] });
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      qc.invalidateQueries({ queryKey: ["credits"] });
    },
    onError: (e: any) => toast.error(e?.message ?? t.auth.error),
  });

  return (
    <section>
      <header className="mb-4">
        <h2 className="font-display text-2xl font-semibold">Pending orders</h2>
        <p className="text-sm text-muted-foreground">
          Dev tool — mark an order paid to grant credits without a real payment.
          Replace with the Stripe webhook once Stripe is connected.
        </p>
      </header>
      <div className="rounded-2xl border border-border bg-card">
        {ordersQ.data.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No pending orders.</p>
        ) : (
          <ul className="divide-y divide-border">
            {ordersQ.data.map((o: any) => (
              <li key={o.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {o.type === "punch_card"
                        ? `Punch card · ${o.credits} sessions`
                        : "Monthly subscription"}
                    </span>
                    <Badge variant="secondary">{(o.amount_cents / 100).toFixed(0)} kr</Badge>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    Parent {o.parent_id.slice(0, 8)}… ·{" "}
                    {format(new Date(o.created_at), "d MMM, HH:mm")}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => markM.mutate(o.id)}
                  disabled={markM.isPending}
                >
                  Mark paid
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
