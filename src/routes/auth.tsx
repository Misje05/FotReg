import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/site-header";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — FotReg" },
      { name: "description", content: "Sign in to your FotReg parent account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success(t.auth.signedUp);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t.auth.signedIn);
      }
      navigate({ to: "/dashboard", replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? t.auth.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
        <div>
          <h1 className="font-display text-3xl font-bold">
            {mode === "signin" ? t.auth.signInTitle : t.auth.signUpTitle}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin" ? t.auth.signInSubtitle : t.auth.signUpSubtitle}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">{t.auth.fullName}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t.auth.password}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? t.common.loading : mode === "signin" ? t.auth.submitSignIn : t.auth.submitSignUp}
          </Button>
          <button
            type="button"
            className="block w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? t.auth.toggleToSignUp : t.auth.toggleToSignIn}
          </button>
        </form>
      </div>
    </div>
  );
}
