import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { listMyChildren, addChild, removeChild } from "@/lib/fotreg.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/children")({
  component: ChildrenPage,
});

function ChildrenPage() {
  const listFn = useServerFn(listMyChildren);
  const addFn = useServerFn(addChild);
  const removeFn = useServerFn(removeChild);
  const qc = useQueryClient();

  const childrenQ = useSuspenseQuery({ queryKey: ["children"], queryFn: () => listFn() });

  const [name, setName] = useState("");
  const [group, setGroup] = useState("");
  const [year, setYear] = useState<string>("");

  const addM = useMutation({
    mutationFn: () =>
      addFn({
        data: {
          name,
          team_group: group || null,
          birth_year: year ? Number(year) : null,
        },
      }),
    onSuccess: () => {
      toast.success(t.children.added);
      setName("");
      setGroup("");
      setYear("");
      qc.invalidateQueries({ queryKey: ["children"] });
    },
    onError: (e: any) => toast.error(e?.message ?? t.auth.error),
  });

  const delM = useMutation({
    mutationFn: (id: string) => removeFn({ data: { id } }),
    onSuccess: () => {
      toast.success(t.children.deleted);
      qc.invalidateQueries({ queryKey: ["children"] });
    },
    onError: (e: any) => toast.error(e?.message ?? t.auth.error),
  });

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-3xl font-bold md:text-4xl">{t.children.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.children.subtitle}</p>
      </header>

      <section className="grid gap-8 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-2xl border border-border bg-card p-6">
          {childrenQ.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.children.empty}</p>
          ) : (
            <ul className="divide-y divide-border">
              {childrenQ.data.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-4">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {[c.team_group, c.birth_year].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => delM.mutate(c.id)}
                    disabled={delM.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">{t.children.remove}</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            addM.mutate();
          }}
          className="space-y-4 rounded-2xl border border-border bg-card p-6"
        >
          <h2 className="font-display text-lg font-semibold">{t.children.addNew}</h2>
          <div className="space-y-2">
            <Label htmlFor="cname">{t.children.name}</Label>
            <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cgroup">{t.children.teamGroup}</Label>
            <Input
              id="cgroup"
              placeholder="U10"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cyear">{t.children.birthYear}</Label>
            <Input
              id="cyear"
              inputMode="numeric"
              placeholder="2015"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={addM.isPending} className="w-full">
            {t.children.save}
          </Button>
        </form>
      </section>
    </div>
  );
}
