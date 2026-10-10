# Meta Clinic booking chatbot

A website chat assistant ("Mira") for metaclinic.ae that answers patient questions about the Medical, Dental, Aesthetic, Dermatology, OB/GYN, Laser, Lab and Home Care departments, and turns each conversation into a booking request for reception.

Live demo: https://claude.ai/artifact/SwqAP748wobWDnj48eg9Jp

## What's here

| Path | What it is |
|---|---|
| `server/knowledge.js` | Everything the bot knows: branches, hours, doctors, services, offer prices (taken from metaclinic.ae on 10 Oct 2026), the system prompt and the `save_lead` tool. Edit this when prices or doctors change. |
| `server/server.js` | Node backend. `POST /api/chat` talks to Claude and saves leads; `GET /admin/leads?token=…&format=csv` exports them; serves the widget at `/widget/widget.js`. |
| `widget/widget.js` | The embeddable chat bubble. One script tag, no dependencies, English + Arabic (RTL), WhatsApp and Call buttons, quick-reply chips, proactive teaser after 8 s, mobile full-screen. |
| `demo/metaclinic-demo.html` | Source of the live demo page. |

## How a booking flows

1. Visitor opens the bubble, asks a question or taps a chip ("Dental offers").
2. Mira answers from the clinic data, mentions the free consultation / "from" price, and asks for department, branch, date/time, name and mobile, one question at a time.
3. As soon as it has name + phone + department it calls `save_lead`. The lead gets a reference (e.g. `MC-3F9A21`), is appended to `server/data/leads.jsonl`, and is POSTed to `LEAD_WEBHOOK_URL` if set.
4. The visitor sees a "Request received" card with a **Confirm on WhatsApp** button that opens WhatsApp to +971 50 119 2758 with the booking details prefilled.
5. Reception calls/WhatsApps to confirm the slot. The bot never claims a slot is confirmed.

Guardrails in the prompt: no diagnosis, dosing or lab interpretation; emergencies are sent to 998/999; no invented prices or doctors; no Emirates ID or card numbers in chat.

## Run it

```bash
cd server
npm install
ANTHROPIC_API_KEY=sk-ant-... ADMIN_TOKEN=choose-a-secret node server.js
# open http://localhost:3000/widget/widget.js to check it is served
```

Environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | (required) | From console.anthropic.com |
| `CLAUDE_MODEL` | `claude-sonnet-5-5` | Fast, low cost for chat. Set `claude-opus-5-5` for the most capable model. |
| `ALLOWED_ORIGINS` | `https://metaclinic.ae,https://www.metaclinic.ae` | Sites allowed to call the API |
| `ADMIN_TOKEN` | (none, admin off) | Token for `/admin/leads` |
| `LEAD_WEBHOOK_URL` | (none) | Each new lead is POSTed here as JSON: use a Zapier/Make hook, a Google Apps Script that writes to a Sheet, or your CRM |
| `PORT`, `DATA_DIR` | `3000`, `server/data` | |

Deploy on any Node 20+ host (Render, Railway, a VPS, etc.). Put it on HTTPS, e.g. `https://chat.metaclinic.ae`.

## Add it to the website (WordPress / Elementor)

Add this before `</body>` (Elementor → Custom Code, or a "Header and Footer Scripts" plugin):

```html
<script src="https://chat.metaclinic.ae/widget/widget.js" data-api="https://chat.metaclinic.ae" defer></script>
```

Options: `data-whatsapp="9715XXXXXXXX"`, `data-phone="+971 ..."`, `data-teaser="off"`.
The widget pushes a `chat_lead` event to `dataLayer` so Google Tag Manager / Ads can count chat bookings as conversions.

## Next integrations (not built yet)

- **Real-time slot booking** into the clinic's system (e.g. Medas, Instahealth, Cliniko, Zoho) so the bot books an actual slot instead of a request.
- **WhatsApp Business API** (Meta Cloud API / 360dialog / Twilio) so the same bot answers on WhatsApp and Instagram DMs and sends confirmations automatically.
- Auto-notify reception per branch on each lead.

## Live deployment (10 Oct 2026)

- Site and widget: https://metaclinic-chat.vercel.app (Vercel project `metaclinic-chatbot`, source in `vercel/`)
- Embed on metaclinic.ae: `<script src="https://metaclinic-chat.vercel.app/widget.js" defer></script>`
- Leads: Supabase project `metaclinic-chatbot` (Mumbai), table `leads`. View them at https://supabase.com/dashboard/project/lhcnsiwrkhhhdakpmudc/editor. The website key can only insert rows; it cannot read them.
- Still needed: `ANTHROPIC_API_KEY` in Vercel → Project → Settings → Environment Variables (Production), then redeploy. Until then the chat replies with the WhatsApp/phone fallback.
