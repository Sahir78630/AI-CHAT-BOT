/* Meta Clinic chat widget.
 * Embed before </body>:
 *   <script src="https://YOUR-SERVER/widget.js" defer></script>
 * Optional: data-whatsapp="971501192758" data-phone="+971 50 119 2758" data-teaser="off"
 */
(function () {
  if (window.__metaClinicChat) return;
  window.__metaClinicChat = true;

  var script = document.currentScript || document.querySelector("script[data-api]");
  var API = (script && script.getAttribute("data-api")) || (script && script.src ? new URL(script.src).origin : "");
  var WA = (script && script.getAttribute("data-whatsapp")) || "971501192758";
  var PHONE = (script && script.getAttribute("data-phone")) || "+971 50 119 2758";
  var TEASER = !(script && script.getAttribute("data-teaser") === "off");
  var AUTO_OPEN = !!(script && script.getAttribute("data-open") === "true");
  var KEY = "mc_chat_v1";

  var T = {
    en: {
      title: "Meta Clinic", sub: "Mira · replies instantly", placeholder: "Type your message…", send: "Send",
      hello: "Hi! I'm Mira from Meta Clinic 👋 I can help you book with our medical, dental or aesthetic doctors, or answer questions about prices and offers. What can I help you with today?",
      chips: ["Book an appointment", "Dental offers", "Aesthetic treatments", "See a doctor today", "العربية"],
      teaser: "Free dental & aesthetic consultation. Book in 30 seconds?",
      wa: "WhatsApp", call: "Call", booked: "Request received · Ref", confirmWa: "Confirm faster on WhatsApp",
      err: "Sorry, I couldn't reply just now. Please WhatsApp or call us.", disclaimer: "Not for emergencies. Call 998 for an ambulance.",
    },
    ar: {
      title: "ميتا كلينك", sub: "ميرا · ترد فوراً", placeholder: "اكتب رسالتك…", send: "إرسال",
      hello: "مرحباً! أنا ميرا من ميتا كلينك 👋 أستطيع مساعدتك في حجز موعد مع أطبائنا في الطب العام أو الأسنان أو التجميل، أو الإجابة عن الأسعار والعروض. كيف أساعدك اليوم؟",
      chips: ["احجز موعد", "عروض الأسنان", "علاجات التجميل", "طبيب اليوم", "English"],
      teaser: "استشارة أسنان وتجميل مجانية. احجز خلال 30 ثانية؟",
      wa: "واتساب", call: "اتصال", booked: "تم استلام الطلب · رقم", confirmWa: "أكّد أسرع عبر واتساب",
      err: "عذراً، لم أتمكن من الرد الآن. تواصل معنا عبر واتساب أو الهاتف.", disclaimer: "ليس للحالات الطارئة. اتصل بـ 998 للإسعاف.",
    },
  };

  function load() { try { return JSON.parse(sessionStorage.getItem(KEY)) || null; } catch (e) { return null; } }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  var state = load() || {
    sessionId: Math.random().toString(36).slice(2) + Date.now().toString(36),
    lang: (document.documentElement.lang || navigator.language || "en").slice(0, 2) === "ar" ? "ar" : "en",
    messages: [], open: false, leadRef: null, teaserSeen: false,
  };

  var host = document.createElement("div");
  host.id = "meta-clinic-chat";
  document.body.appendChild(host);
  var root = host.attachShadow({ mode: "open" });

  root.innerHTML =
    '<style>' +
    ':host{all:initial}' +
    '*{box-sizing:border-box;font-family:"Segoe UI",Tahoma,system-ui,-apple-system,sans-serif}' +
    '.fab{position:fixed;bottom:20px;right:20px;z-index:2147483000;width:60px;height:60px;border-radius:50%;border:0;cursor:pointer;background:#0f6e6a;color:#fff;box-shadow:0 6px 20px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center}' +
    '.fab svg{width:28px;height:28px}' +
    '.teaser{position:fixed;bottom:92px;right:20px;z-index:2147483000;max-width:240px;background:#fff;color:#16302f;border-radius:14px 14px 4px 14px;padding:12px 14px;font-size:14px;line-height:1.4;box-shadow:0 6px 20px rgba(0,0,0,.18);cursor:pointer}' +
    '.teaser b{display:block;color:#0f6e6a;margin-bottom:2px}' +
    '.panel{position:fixed;bottom:92px;right:20px;z-index:2147483001;width:370px;max-width:calc(100vw - 24px);height:560px;max-height:calc(100vh - 120px);background:#f6f9f8;border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,.28);display:flex;flex-direction:column;overflow:hidden}' +
    '@media (max-width:480px){.panel{right:0;left:0;bottom:0;width:100%;max-width:100%;height:100%;max-height:100%;border-radius:0}}' +
    '.hd{background:#0f6e6a;color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px}' +
    '.av{width:38px;height:38px;border-radius:50%;background:#e8f3f1;color:#0f6e6a;display:flex;align-items:center;justify-content:center;font-weight:700}' +
    '.ht{flex:1;min-width:0}.ht b{display:block;font-size:15px}.ht span{font-size:12px;opacity:.85}' +
    '.hb{display:flex;gap:6px}.hb a,.hb button{background:rgba(255,255,255,.15);color:#fff;border:0;border-radius:8px;padding:6px 9px;font-size:12px;text-decoration:none;cursor:pointer}' +
    '.log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px}' +
    '.m{max-width:85%;padding:9px 12px;border-radius:14px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}' +
    '.bot{background:#fff;color:#16302f;align-self:flex-start;border-bottom-left-radius:4px}' +
    '.me{background:#0f6e6a;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}' +
    '.rtl .bot{border-bottom-left-radius:14px;border-bottom-right-radius:4px}.rtl .me{border-bottom-right-radius:14px;border-bottom-left-radius:4px}' +
    '.typing{color:#5d7473;font-size:13px;align-self:flex-start;padding:4px 8px}' +
    '.card{align-self:stretch;background:#e8f3f1;border:1px solid #bfe0da;border-radius:12px;padding:10px 12px;font-size:13px;color:#16302f}' +
    '.card a{display:inline-block;margin-top:6px;background:#25d366;color:#fff;border-radius:8px;padding:7px 10px;text-decoration:none;font-weight:600}' +
    '.chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 8px}' +
    '.chip{border:1px solid #0f6e6a;color:#0f6e6a;background:#fff;border-radius:999px;padding:6px 11px;font-size:13px;cursor:pointer}' +
    '.ft{display:flex;gap:8px;padding:10px;border-top:1px solid #dde8e6;background:#fff}' +
    '.ft input{flex:1;min-width:0;border:1px solid #cfdcda;border-radius:10px;padding:10px 12px;font-size:15px;outline:none}' +
    '.ft input:focus{border-color:#0f6e6a}' +
    '.ft button{background:#0f6e6a;color:#fff;border:0;border-radius:10px;padding:0 14px;font-size:14px;cursor:pointer}' +
    '.ft button:disabled{opacity:.5}' +
    '.disc{font-size:11px;color:#6b7f7e;text-align:center;padding:0 10px 8px;background:#fff}' +
    '[hidden]{display:none!important}' +
    '</style>' +
    '<div class="teaser" hidden></div>' +
    '<div class="panel" hidden>' +
    '  <div class="hd"><div class="av">M</div><div class="ht"><b class="t-title"></b><span class="t-sub"></span></div>' +
    '    <div class="hb"><a class="wa" target="_blank" rel="noopener"></a><a class="call"></a><button class="x" aria-label="Close">✕</button></div></div>' +
    '  <div class="log" role="log" aria-live="polite"></div>' +
    '  <div class="chips"></div>' +
    '  <form class="ft"><input aria-label="Message" autocomplete="off" maxlength="1000"><button type="submit"></button></form>' +
    '  <div class="disc"></div>' +
    '</div>' +
    '<button class="fab" aria-label="Chat with Meta Clinic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg></button>';

  var $ = function (s) { return root.querySelector(s); };
  var panel = $(".panel"), log = $(".log"), chips = $(".chips"), form = $(".ft"), input = $(".ft input"), sendBtn = $(".ft button"), teaser = $(".teaser");
  var busy = false;

  function t() { return T[state.lang]; }
  function waLink(text) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(text || "Hello Meta Clinic, I would like to book an appointment."); }

  function applyLang() {
    var L = t();
    panel.dir = state.lang === "ar" ? "rtl" : "ltr";
    panel.classList.toggle("rtl", state.lang === "ar");
    $(".t-title").textContent = L.title; $(".t-sub").textContent = L.sub;
    $(".wa").textContent = L.wa; $(".wa").href = waLink();
    $(".call").textContent = L.call; $(".call").href = "tel:" + PHONE.replace(/\s/g, "");
    input.placeholder = L.placeholder; sendBtn.textContent = L.send; $(".disc").textContent = L.disclaimer;
  }

  function bubble(role, text) {
    var d = document.createElement("div");
    d.className = "m " + (role === "user" ? "me" : "bot");
    d.textContent = text;
    log.appendChild(d); log.scrollTop = log.scrollHeight;
    return d;
  }

  function leadCard(ref, wa) {
    var L = t(), c = document.createElement("div");
    c.className = "card";
    c.textContent = "✅ " + L.booked + " " + ref + " ";
    var a = document.createElement("a"); a.href = wa || waLink(); a.target = "_blank"; a.rel = "noopener"; a.textContent = L.confirmWa;
    c.appendChild(document.createElement("br")); c.appendChild(a);
    log.appendChild(c); log.scrollTop = log.scrollHeight;
  }

  function renderChips() {
    chips.innerHTML = "";
    if (state.messages.some(function (m) { return m.role === "user"; })) { chips.hidden = true; return; }
    chips.hidden = false;
    t().chips.forEach(function (label, i, arr) {
      var b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = label;
      b.onclick = function () {
        if (i === arr.length - 1) { state.lang = state.lang === "ar" ? "en" : "ar"; save(); rerender(); return; }
        send(label);
      };
      chips.appendChild(b);
    });
  }

  function rerender() {
    applyLang(); log.innerHTML = "";
    bubble("assistant", t().hello);
    state.messages.forEach(function (m) { if (m.role === "card") leadCard(m.ref, m.wa); else bubble(m.role, m.content); });
    renderChips();
  }

  function send(text) {
    text = (text || "").trim();
    if (!text || busy) return;
    if (/[؀-ۿ]/.test(text) && state.lang !== "ar") { state.lang = "ar"; applyLang(); }
    state.messages.push({ role: "user", content: text }); save();
    bubble("user", text); chips.hidden = true; input.value = "";
    busy = true; sendBtn.disabled = true;
    var typing = document.createElement("div"); typing.className = "typing"; typing.textContent = "Mira is typing…"; log.appendChild(typing); log.scrollTop = log.scrollHeight;

    var history = [{ role: "assistant", content: t().hello }].concat(state.messages.filter(function (m) { return m.role !== "card"; }));
    fetch(API + "/api/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history, sessionId: state.sessionId, page: location.href }),
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        typing.remove();
        var reply = res.ok ? res.j.reply : (res.j.error || t().err);
        state.messages.push({ role: "assistant", content: reply }); bubble("assistant", reply);
        if (res.ok && res.j.lead && res.j.lead.ref && res.j.lead.ref !== state.leadRef) {
          state.leadRef = res.j.lead.ref;
          state.messages.push({ role: "card", ref: res.j.lead.ref, wa: res.j.whatsapp }); leadCard(res.j.lead.ref, res.j.whatsapp);
          try { window.dataLayer && window.dataLayer.push({ event: "chat_lead", lead_ref: res.j.lead.ref }); } catch (e) {}
        }
        save();
      })
      .catch(function () { typing.remove(); bubble("assistant", t().err); })
      .then(function () { busy = false; sendBtn.disabled = false; input.focus(); });
  }

  function setOpen(open) {
    state.open = open; panel.hidden = !open; teaser.hidden = true; save();
    if (open) { state.teaserSeen = true; setTimeout(function () { input.focus(); }, 50); }
  }

  $(".fab").onclick = function () { setOpen(panel.hidden); };
  $(".x").onclick = function () { setOpen(false); };
  teaser.onclick = function () { setOpen(true); };
  form.onsubmit = function (e) { e.preventDefault(); send(input.value); };

  rerender();
  if (state.open || (AUTO_OPEN && !state.teaserSeen)) setOpen(true);
  if (TEASER && !state.teaserSeen) {
    setTimeout(function () {
      if (!panel.hidden || state.teaserSeen) return;
      teaser.innerHTML = "<b>Meta Clinic</b>"; teaser.appendChild(document.createTextNode(t().teaser)); teaser.hidden = false;
      state.teaserSeen = true; save();
    }, 8000);
  }
})();
