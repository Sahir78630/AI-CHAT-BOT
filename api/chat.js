// Vercel function: POST /api/chat. Talks to Claude and saves booking requests to Supabase.
import crypto from "node:crypto";
import { CLINIC, buildSystemPrompt, SAVE_LEAD_TOOL } from "../lib/knowledge.js";

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5-5";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://lhcnsiwrkhhhdakpmudc.supabase.co";
// Publishable key: row-level security only lets it insert new leads, never read them.
const SUPABASE_KEY = process.env.SUPABASE_KEY || "sb_publishable_fhUFSRttF59QlQvsAs-eFg_3XOnzZ86";
const LEAD_WEBHOOK_URL = process.env.LEAD_WEBHOOK_URL || "";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "*").split(",").map((s) => s.trim());

const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 30;
}

function normalizePhone(raw) {
  let d = String(raw || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("05")) d = "971" + d.slice(1);
  else if (d.startsWith("5") && d.length === 9) d = "971" + d;
  return d;
}

const FIELDS = ["name", "department", "service", "branch", "preferred_date", "preferred_time", "language", "insurance", "notes"];
const LIMITS = { notes: 1000, service: 300, name: 200 };

async function saveLead(input, meta) {
  const phone = normalizePhone(input.phone);
  if (phone.length < 9 || phone.length > 15) throw new Error("Phone number looks incomplete; ask the visitor to re-type it.");
  const lead = { ref: "MC-" + crypto.randomBytes(3).toString("hex").toUpperCase(), phone };
  for (const f of FIELDS) if (input[f]) lead[f] = String(input[f]).slice(0, LIMITS[f] || 100);
  if (!lead.name || !lead.department) throw new Error("Name and department are required.");
  if (meta.sessionId) lead.session_id = String(meta.sessionId).slice(0, 100);
  if (meta.page) lead.page = String(meta.page).slice(0, 500);

  const r = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(lead),
  });
  if (!r.ok) {
    console.error("supabase insert failed", r.status, await r.text());
    throw new Error("Could not save right now; give the visitor the WhatsApp number " + CLINIC.mainPhone);
  }
  if (LEAD_WEBHOOK_URL) {
    await fetch(LEAD_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lead) })
      .catch((e) => console.error("lead webhook failed", e.message));
  }
  console.log("lead saved", lead.ref, lead.department, lead.branch || "");
  return lead;
}

function whatsappLink(lead) {
  const text = lead
    ? `Hello Meta Clinic, I just requested an appointment (ref ${lead.ref}): ${lead.department}${lead.service ? " - " + lead.service : ""}, ${lead.branch || "any branch"}, ${[lead.preferred_date, lead.preferred_time].filter(Boolean).join(" ") || "first available"}. Name: ${lead.name}.`
    : "Hello Meta Clinic, I would like to book an appointment.";
  return `https://wa.me/${CLINIC.whatsapp}?text=${encodeURIComponent(text)}`;
}

async function callClaude(messages) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 600,
      system: [{ type: "text", text: buildSystemPrompt(), cache_control: { type: "ephemeral" } }],
      tools: [SAVE_LEAD_TOOL],
      messages,
    }),
  });
  const j = await r.json();
  if (!r.ok) throw Object.assign(new Error(j?.error?.message || "Claude API error"), { status: r.status });
  return j;
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && (ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  }
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const fallback = { whatsapp: whatsappLink(null), phone: CLINIC.mainPhone };
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: `Our assistant is being set up. Please WhatsApp or call us on ${CLINIC.mainPhone}.`, ...fallback });
  }
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) return res.status(429).json({ error: "Too many messages. Please call or WhatsApp us instead.", ...fallback });

  const { messages, sessionId, page } = req.body || {};
  if (!Array.isArray(messages) || !messages.length) return res.status(400).json({ error: "messages required" });
  const convo = messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-30)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  while (convo.length && convo[0].role !== "user") convo.shift();
  if (!convo.length || convo.at(-1).role !== "user") return res.status(400).json({ error: "last message must be from user" });

  let lead = null;
  try {
    for (let round = 0; round < 4; round++) {
      const resp = await callClaude(convo);
      convo.push({ role: "assistant", content: resp.content });
      const toolUses = resp.content.filter((b) => b.type === "tool_use");
      if (resp.stop_reason !== "tool_use" || !toolUses.length) {
        const reply = resp.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
        return res.json({ reply, lead: lead && { ref: lead.ref }, whatsapp: whatsappLink(lead), phone: CLINIC.mainPhone });
      }
      const results = [];
      for (const tu of toolUses) {
        try {
          lead = await saveLead(tu.input || {}, { sessionId, page });
          results.push({ type: "tool_result", tool_use_id: tu.id, content: JSON.stringify({ ok: true, ref: lead.ref }) });
        } catch (e) {
          results.push({ type: "tool_result", tool_use_id: tu.id, content: e.message, is_error: true });
        }
      }
      convo.push({ role: "user", content: results });
    }
    res.json({ reply: "Thank you! Our team will contact you shortly to confirm.", lead: lead && { ref: lead.ref }, whatsapp: whatsappLink(lead), phone: CLINIC.mainPhone });
  } catch (e) {
    console.error("chat error", e.status, e.message);
    res.status(502).json({ error: `Our assistant is unavailable right now. Please WhatsApp or call us on ${CLINIC.mainPhone}.`, ...fallback });
  }
}
