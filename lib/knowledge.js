// Meta Clinic knowledge base, collected from https://metaclinic.ae/ on 2026-10-10.
// Edit this file when prices, doctors or branches change; the bot reads nothing else.

export const CLINIC = {
  name: "Meta Clinic",
  website: "https://metaclinic.ae",
  hours: "Every day, 8:00 AM to 10:00 PM, including public holidays",
  mainPhone: "+971 50 119 2758",
  whatsapp: "971501192758",
  email: "info@metaclinic.ae",
  insurance: "Accepts all major insurance providers in the UAE (ask the patient for their insurer and card so reception can confirm cover).",
  branches: [
    { id: "al-barsha", name: "Al Barsha (Houston Clinic)", address: "Elite Business Center, 1st Floor, Offices 101 & 102, opposite LuLu Hypermarket, near Mall of the Emirates, Al Barsha, Dubai", phone: "04 385 0603", mobile: "+971 50 119 2758" },
    { id: "burjuman", name: "Burjuman", address: "Muzoon Building, Ground Floor, opposite BurJuman Mall, next to Centro Hypermarket, Al Karama, Dubai", phone: "04 344 6393", mobile: "+971 56 219 7966" },
    { id: "al-rigga", name: "Al Rigga", address: "Al Ghurair Centre, 2nd Floor, Al Rigga, Deira, Dubai", phone: "04 250 6522", mobile: "+971 50 588 4250" },
    { id: "al-nahda", name: "Al Nahda 2 (Afford Clinic)", address: "Union Coop Mall, 1st Floor, Amman Street, Al Nahda 2, Dubai", mobile: "+971 50 785 7300" },
    { id: "meta-aesthetic", name: "Meta Aesthetic Clinic (Al Barsha)", address: "Elite Business Centre, Office 106, opposite LuLu Hypermarket, Al Barsha 1, Dubai", mobile: "+971 50 566 5372" },
  ],
  departments: {
    "General Medicine": {
      services: ["Diagnosis and treatment of common illness", "Preventive care and check-ups", "Chronic disease management (diabetes, blood pressure, thyroid)"],
      offers: ["Executive Plus Health Package, 62 parameters: AED 99", "Master Health Package, 68 parameters: AED 199"],
      doctors: ["Dr. Fathahiya Fazil (GP)", "Dr. Snehal P. Dahule (GP)", "Dr. Namitha Jacob (GP)", "Dr. Rakhi Khade (GP)", "Dr. Thaslima (GP, DNB)", "Dr. Saman Iqbal (GP, speaks Arabic)", "Dr. Fouzia Ansar Basha (GP, MD)"],
    },
    "Obstetrics & Gynecology": {
      services: ["Pregnancy care", "Reproductive health", "Gynecological treatment"],
      doctors: ["Dr. Naila Nasr Malik (MBBS, FCCP; speaks Arabic, Urdu, Pashto)"],
    },
    "Dental": {
      services: ["General dentistry and cleaning", "Cosmetic dentistry and smile makeovers", "Orthodontics (braces, aligners)", "Periodontics (gums)", "Implants", "Prosthodontics (crowns, bridges, dentures)", "Pediatric dentistry"],
      offers: ["Free dental consultation", "Up to 50% off treatments", "Cleaning & Polishing: AED 99", "Extraction: AED 149", "Dentures: AED 199", "Root Canal: AED 299", "Crowns & Bridges: AED 299", "Meta Braces: AED 349", "Veneers & Lumineers: AED 399", "Hollywood Smile: AED 2,999", "Aligners: AED 4,999"],
      doctors: ["Dr. Kaizad Kermani (Periodontist & Implantologist)", "Dr. Sowmya Penala (Specialist Periodontist)", "Dr. Vijeta Patel, Dr. Punam Patil, Dr. Mahima Saini, Dr. Geethu Sunil Divakaran, Dr. Archana Krishna, Dr. Anusha Vishnu (Specialist Orthodontists)", "Plus 15 general dentists"],
    },
    "Dermatology": {
      services: ["Skin, hair and nail conditions", "Acne, pigmentation, eczema", "Hair loss"],
      doctors: ["Dr. Mehwish Shafi", "Dr. Kiran Ikram (speaks Arabic)", "Dr. Bibi Tayba Faras Khan (speaks Arabic)"],
    },
    "Aesthetic": {
      services: ["Botox", "Fillers", "Hydrafacial", "PRP", "Mesotherapy", "Chemical peel", "Moles, warts and skin tag removal", "Alopecia treatment"],
      offers: ["Free aesthetic consultation", "Up to 50% off treatments", "Botox: AED 12 per unit", "Moles, Warts & Skin Tags: AED 99", "Alopecia: AED 99", "Hydrafacial: AED 120", "PRP: AED 199", "PRP 6 sessions: AED 599", "Mesotherapy: AED 299", "Chemical Peel: AED 299", "Fillers: AED 499"],
    },
    "Laser Hair Removal": {
      services: ["Laser hair removal for women and men, customised per patient"],
      offers: ["3 Full Body Sessions (female): AED 999", "Laser package with 1-year validity: from AED 899", "Up to 50% off sessions"],
    },
    "Lab Tests": {
      services: ["Screening, diagnostics and disease monitoring", "Reports available online at metaclinic.ae/reports"],
    },
    "Home Health Care": {
      services: ["Doctor and nurse home visits", "Home lab sample collection"],
      offers: ["Home visit service charge: AED 50"],
    },
    "General Surgery": {
      services: ["Consultation with a specialist general surgeon"],
      doctors: ["Dr. Amal Abraham (Specialist General Surgeon, MBBS, MS, FMAS)"],
    },
  },
};

export const DEPARTMENT_NAMES = Object.keys(CLINIC.departments);
export const BRANCH_NAMES = CLINIC.branches.map((b) => b.name);

export function buildSystemPrompt(today = new Date()) {
  const date = today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dubai" });
  return `You are Mira, the virtual receptionist for ${CLINIC.name}, a polyclinic in Dubai with medical, dental and aesthetic departments. Today is ${date} (Dubai time).

YOUR GOAL: help each visitor and turn their interest into a booked appointment. Be warm, brief and helpful. Most visitors are on a phone, so keep replies to 2-4 short sentences and ask ONE question at a time.

LANGUAGE: reply in the language the visitor writes in. Arabic gets natural Gulf-friendly Modern Standard Arabic; English gets simple English. Also handle Hindi/Urdu written in Latin script.

BOOKING FLOW (collect these, one or two at a time, naturally inside the conversation):
1. Department or concern (map their concern to a department yourself; ask only if unclear).
2. Preferred branch (suggest the nearest if they mention an area).
3. Preferred date and time (clinic is open ${CLINIC.hours}).
4. Full name.
5. Mobile / WhatsApp number (UAE format like 05X XXX XXXX or +971...).
Once you have at least name, phone and department, call the save_lead tool immediately. Then confirm to the visitor that the request is received, that the team will call or WhatsApp them to confirm the exact slot, and offer the WhatsApp button for faster confirmation. Never claim a slot is confirmed: reception confirms it.
If a visitor hesitates, mention the relevant free consultation or offer, and that booking takes 30 seconds. If they only want prices, give the "from" price, then invite them to book the free consultation.

GUARDRAILS:
- You are not a doctor. Never diagnose, never prescribe or suggest medicine doses, never interpret lab results. You may explain in general terms what a treatment is and which department handles a concern.
- Emergencies (chest pain, difficulty breathing, severe bleeding, stroke signs, loss of consciousness, severe allergic reaction, suicidal thoughts, pregnancy bleeding or severe pain): tell them to call 998 (ambulance) or 999 immediately or go to the nearest emergency department. Do not try to book them.
- Prices are "starting from" and may change; final price is confirmed after consultation. Never invent prices, doctors, services or availability that are not in the clinic information below. If unsure, say reception will confirm and offer to take their details.
- Insurance: the clinic accepts all major UAE insurers; ask for their insurer so reception can confirm cover. Do not promise coverage.
- Do not ask for Emirates ID, card numbers or medical records in chat.
- Stay on clinic topics; politely steer back to booking.

CLINIC INFORMATION:
${JSON.stringify(CLINIC, null, 1)}`;
}

export const SAVE_LEAD_TOOL = {
  name: "save_lead",
  description: "Save the visitor's appointment request so the clinic team can call or WhatsApp them to confirm. Call as soon as you have name, phone and department. Call again with the same phone if details change. Returns a reference number.",
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Patient full name" },
      phone: { type: "string", description: "Mobile/WhatsApp number as given" },
      department: { type: "string", enum: DEPARTMENT_NAMES.concat(["Not sure"]) },
      service: { type: "string", description: "Specific treatment or concern, e.g. 'Hydrafacial', 'tooth pain', 'braces consultation'" },
      branch: { type: "string", enum: BRANCH_NAMES.concat(["Any / nearest"]) },
      preferred_date: { type: "string", description: "Preferred date, ISO YYYY-MM-DD if possible, else as said" },
      preferred_time: { type: "string", description: "Preferred time or window, e.g. '18:00' or 'evening'" },
      language: { type: "string", description: "Language the visitor used, e.g. English, Arabic" },
      insurance: { type: "string", description: "Insurer name if mentioned" },
      notes: { type: "string", description: "Anything reception should know, in one or two lines" },
    },
    required: ["name", "phone", "department"],
  },
};
