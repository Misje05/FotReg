import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// --- Children ---

export const listMyChildren = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("children")
      .select("id, name, team_group, birth_year, created_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addChild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        name: z.string().min(1).max(80),
        team_group: z.string().max(40).optional().nullable(),
        birth_year: z.number().int().min(2000).max(2030).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error, data: row } = await context.supabase
      .from("children")
      .insert({
        parent_id: context.userId,
        name: data.name,
        team_group: data.team_group ?? null,
        birth_year: data.birth_year ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const removeChild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("children").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- Sessions ---

export const listUpcomingSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("training_sessions")
      .select("id, title, starts_at, ends_at, team_group, coach_name, location, capacity")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// --- Credits / subscriptions ---

export const getCreditSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [cards, subs] = await Promise.all([
      context.supabase
        .from("punch_cards")
        .select("id, remaining_credits, total_credits, status, purchased_at")
        .eq("status", "active")
        .order("purchased_at", { ascending: true }),
      context.supabase
        .from("subscriptions")
        .select("id, status, current_period_end, created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1),
    ]);
    if (cards.error) throw new Error(cards.error.message);
    if (subs.error) throw new Error(subs.error.message);

    const remaining = (cards.data ?? []).reduce((sum, c) => sum + c.remaining_credits, 0);
    const sub = subs.data?.[0] ?? null;
    const subActive =
      !!sub &&
      sub.status === "active" &&
      (!sub.current_period_end || new Date(sub.current_period_end) > new Date());

    return { remaining_credits: remaining, cards: cards.data ?? [], subscription_active: subActive };
  });

// --- Orders / purchase intents ---
//
// Pricing is defined server-side so the client cannot tamper with amounts.
// Amounts are in øre (NOK * 100).
const PUNCH_CARD_PRICES: Record<6 | 12 | 18, number> = {
  6: 59000,
  12: 109000,
  18: 149000,
};
const SUBSCRIPTION_PRICE_CENTS = 34900;

export const createPunchCardOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ credits: z.union([z.literal(6), z.literal(12), z.literal(18)]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error, data: row } = await context.supabase
      .from("orders")
      .insert({
        parent_id: context.userId,
        type: "punch_card",
        credits: data.credits,
        amount_cents: PUNCH_CARD_PRICES[data.credits],
        currency: "NOK",
        status: "pending",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // TODO(stripe): create a Stripe Checkout Session here, persist the
    // returned session id on the order (stripe_session_id), and return
    // { url } so the client can redirect to Stripe. The Stripe webhook
    // (checkout.session.completed) will then call mark_order_paid, which
    // grants the punch_card credits. Until Stripe is wired up the order
    // stays `pending` and an admin marks it paid via the admin panel.

    return row;
  });

export const createSubscriptionOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error, data: row } = await context.supabase
      .from("orders")
      .insert({
        parent_id: context.userId,
        type: "subscription",
        credits: null,
        amount_cents: SUBSCRIPTION_PRICE_CENTS,
        currency: "NOK",
        status: "pending",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // TODO(stripe): create a Stripe Checkout Session in subscription mode,
    // persist stripe_session_id, return { url } for redirect, and let the
    // Stripe webhook activate the subscription via mark_order_paid.

    return row;
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, type, credits, amount_cents, currency, status, created_at, paid_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// --- Admin: orders ---

export const adminListPendingOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, parent_id, type, credits, amount_cents, currency, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminMarkOrderPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // mark_order_paid enforces admin via has_role inside the DB function
    // and grants the punch card credits or activates the subscription.
    const { error, data: row } = await context.supabase.rpc("mark_order_paid", {
      _order_id: data.id,
    });
    if (error) throw new Error(error.message);
    return row;
  });

// --- Signups ---

export const listMySignups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("signups")
      .select(
        "id, used_subscription, created_at, children(id, name), training_sessions(id, title, starts_at, ends_at, location, team_group, coach_name)",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    // Only keep future sessions, sorted ascending
    const upcoming = (data ?? [])
      .filter((s: any) => s.training_sessions && new Date(s.training_sessions.starts_at) > new Date())
      .sort(
        (a: any, b: any) =>
          new Date(a.training_sessions.starts_at).getTime() -
          new Date(b.training_sessions.starts_at).getTime(),
      );
    return upcoming;
  });

export const signupForSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ childId: z.string().uuid(), sessionId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error, data: row } = await context.supabase.rpc("signup_child_for_session", {
      _child_id: data.childId,
      _session_id: data.sessionId,
    });
    if (error) {
      // Surface clean error codes
      if (error.message.includes("NO_CREDITS")) throw new Error("NO_CREDITS");
      if (error.message.includes("Already signed up")) throw new Error("ALREADY_SIGNED_UP");
      throw new Error(error.message);
    }
    return row;
  });

export const cancelSignup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("signups").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- Admin ---

export const isAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw new Error(error.message);
    return !!data;
  });

// Demo helper — lets anyone grant themselves admin so the admin UI is testable
// without a separate seed step. Remove or gate before real launch.
export const grantSelfAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

export const adminListAllSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("training_sessions")
      .select("id, title, starts_at, ends_at, team_group, coach_name, location, capacity")
      .order("starts_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminCreateSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        title: z.string().min(1).max(120),
        starts_at: z.string(),
        ends_at: z.string(),
        team_group: z.string().max(40).optional().nullable(),
        coach_name: z.string().max(80).optional().nullable(),
        location: z.string().max(120).optional().nullable(),
        capacity: z.number().int().min(1).max(200),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error, data: row } = await context.supabase
      .from("training_sessions")
      .insert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const adminDeleteSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("training_sessions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
