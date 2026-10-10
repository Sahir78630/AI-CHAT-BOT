import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Creates and manages staff logins. Auth is checked here: the very first call may create the
// head office admin (with the one-time setup code); every later call must come from a signed-in admin.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const DOMAIN = "staff.clinicopsdesk.app";
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let body: Record<string, string> = {};
  try { body = await req.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const action = body.action;
  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");
  const validUser = /^[a-z0-9._-]{3,30}$/.test(username);
  const validPass = password.length >= 8;

  if (action === "bootstrap") {
    const { count } = await admin.from("profiles").select("user_id", { count: "exact", head: true }).eq("role", "admin");
    if ((count ?? 0) > 0) return json({ error: "An admin account already exists. Sign in instead." }, 403);
    const { data: sc } = await admin.from("app_secrets").select("v").eq("k", "setup_code").maybeSingle();
    if (!sc || String(body.setup_code || "").trim().toUpperCase() !== sc.v) return json({ error: "The setup code is not correct." }, 403);
    if (!validUser) return json({ error: "Username must be 3-30 letters, numbers, dots or dashes." }, 400);
    if (!validPass) return json({ error: "Password must be at least 8 characters." }, 400);
    const { data, error } = await admin.auth.admin.createUser({ email: `${username}@${DOMAIN}`, password, email_confirm: true });
    if (error || !data.user) return json({ error: error?.message || "Could not create the account." }, 400);
    const { error: e2 } = await admin.from("profiles").insert({ user_id: data.user.id, username, role: "admin", staff_id: null });
    if (e2) { await admin.auth.admin.deleteUser(data.user.id); return json({ error: e2.message }, 400); }
    await admin.from("app_secrets").delete().eq("k", "setup_code");
    return json({ ok: true, username });
  }

  // Every other action needs a signed-in head office admin.
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: who } = await admin.auth.getUser(token);
  if (!who?.user) return json({ error: "Please sign in again." }, 401);
  const { data: me } = await admin.from("profiles").select("role").eq("user_id", who.user.id).maybeSingle();
  if (me?.role !== "admin") return json({ error: "Only the head office admin can manage logins." }, 403);

  if (action === "change_own") {
    if (!validPass) return json({ error: "Password must be at least 8 characters." }, 400);
    const { error } = await admin.auth.admin.updateUserById(who.user.id, { password });
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  }

  const staffId = String(body.staff_id || "");
  if (!staffId) return json({ error: "Choose a staff member." }, 400);

  if (action === "create") {
    if (!validUser) return json({ error: "Username must be 3-30 letters, numbers, dots or dashes." }, 400);
    if (!validPass) return json({ error: "Password must be at least 8 characters." }, 400);
    const { data: doc } = await admin.from("docs").select("data").eq("col", "staff").eq("id", staffId).maybeSingle();
    if (!doc) return json({ error: "That staff member no longer exists." }, 404);
    const role = ["admin", "manager", "staff"].includes(doc.data?.role) ? doc.data.role : "staff";
    const { data, error } = await admin.auth.admin.createUser({ email: `${username}@${DOMAIN}`, password, email_confirm: true });
    if (error || !data.user) return json({ error: /already/i.test(error?.message || "") ? "That username is taken." : (error?.message || "Could not create the login.") }, 400);
    const { error: e2 } = await admin.from("profiles").insert({ user_id: data.user.id, username, role, staff_id: staffId });
    if (e2) { await admin.auth.admin.deleteUser(data.user.id); return json({ error: /duplicate/i.test(e2.message) ? "This person already has a login." : e2.message }, 400); }
    return json({ ok: true, username });
  }

  const { data: prof } = await admin.from("profiles").select("user_id, username").eq("staff_id", staffId).maybeSingle();
  if (!prof) return json({ error: "This person has no login yet." }, 404);

  if (action === "reset") {
    if (!validPass) return json({ error: "Password must be at least 8 characters." }, 400);
    const { error } = await admin.auth.admin.updateUserById(prof.user_id, { password });
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true, username: prof.username });
  }
  if (action === "remove") {
    const { error } = await admin.auth.admin.deleteUser(prof.user_id);
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  }
  return json({ error: "Unknown action." }, 400);
});
