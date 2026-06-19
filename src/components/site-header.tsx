import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

export function SiteHeader() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-display font-bold">
            F
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">
            {t.brand.name}
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {email && (
            <>
              <Link
                to="/dashboard"
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {t.nav.dashboard}
              </Link>
              <Link
                to="/sessions"
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {t.nav.sessions}
              </Link>
              <Link
                to="/children"
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {t.nav.children}
              </Link>
              <Link
                to="/buy"
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {t.nav.buy}
              </Link>
              <Link
                to="/admin"
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {t.nav.admin}
              </Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {email ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">{email}</span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                {t.nav.signOut}
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  {t.nav.signIn}
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm">{t.nav.getStarted}</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
