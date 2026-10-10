# Meta Clinic booking chatbot

Website chat assistant for [metaclinic.ae](https://metaclinic.ae) that answers patient questions in English and Arabic and turns them into booking requests.

- `public/widget.js`: embeddable chat bubble. Add `<script src="https://metaclinic-chatbot.vercel.app/widget.js" defer></script>` to the site.
- `api/chat.js`: Vercel function. Calls Claude, saves leads to Supabase (`leads` table).
- `lib/knowledge.js`: clinic services, doctors, branches, offers and the assistant's instructions. Edit this when prices or doctors change.

Environment variables (Vercel): `ANTHROPIC_API_KEY` (required), `CLAUDE_MODEL`, `SUPABASE_URL`, `SUPABASE_KEY`, `LEAD_WEBHOOK_URL`, `ALLOWED_ORIGINS`.

Pushing to `main` redeploys automatically once the Vercel project is connected to this repository.
