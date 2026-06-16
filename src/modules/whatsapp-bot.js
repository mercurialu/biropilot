const DOC_BASE = process.env.RENDER_EXTERNAL_URL || "https://biropilot-api.onrender.com";

class WhatsAppBot {
  constructor(deps = {}) {
    Object.assign(this, deps);
    this.sessions = new Map();
  }

  reply(userId, msg) {
    const m = msg.toLowerCase().trim();
    if (!this.sessions.has(userId)) this.sessions.set(userId, { step: null, data: {} });
    const session = this.sessions.get(userId);

    // Handle multi-step conversations
    if (session.step) return this.handleStep(session, m, userId);

    // Salut
    if (["salut","buna","hey","hello","neata"].some(k => m.includes(k)))
      return "*BiroPilot* - Asistentul tau birocratic\n\nScrie-mi ce ai nevoie:\n📋 *Formulare* - \"vreau PFA\", \"declaratie unica\", \"buletin\"\n💰 *Calcule* - \"taxe anaf\", \"salariu net\", \"credit ipotecar\"\n🏛 *Institutii* - \"primarie\", \"drpciv\", \"ghiseul.ro\"";

    // Ajutor
    if (["ajutor","help","ce poti","comenzi"].some(k => m.includes(k)))
      return "*Comenzi:*\n\n📋 *Formulare* (generez documente reale):\n  \"vreau PFA\" - cerere ONRC\n  \"declaratie unica\" - formular 200 ANAF\n  \"buletin\" - acte + programare\n\n💰 *Calcule*:\n  \"taxe anaf\" - CAS, CASS, impozit\n  \"salariu net\" - brut in net\n  \"credit ipotecar\" - rata lunara\n  \"amenda\" - valoare + reducere\n\n🏛 *Institutii*:\n  \"primarie\", \"drpciv\", \"onrc\", \"itm\", \"casa sanatatii\"";

    // === FORMULARE REALE ===
    
    // PFA
    if (["pfa","deschid pfa","infiintare pfa"].some(k => m.includes(k))) {
      session.step = "pfa_form";
      session.data = {};
      return "*Inmatriculare PFA*\n\nVoi genera cererea ONRC completa.\nDami datele in formatul:\nPop Ionescu, 1234567890123, 6201, Str. Libertatii nr.5\n\n(Nume complet, CNP, cod CAEN, adresa sediu)";
    }

    // Declaratie unica
    if (["declaratie unica","formular 200","declaratie anaf"].some(k => m.includes(k))) {
      session.step = "decl_form";
      session.data = {};
      return "*Declaratia Unica (Formular 200)*\n\nO generez gata completata si o poti descarca.\n\nCe venit ai realizat anul trecut? (in RON, ex: 50000)";
    }

    // === CALCULATOARE CU LINK ===
    
    if (["taxe anaf","cat platesc la anaf"].some(k => m.includes(k)))
      return "*Calculeaza-ti taxele ANAF*\n\nFoloseste calculatorul interactiv:\n🌐 https://mercurialu.github.io/biropilot/\n\nSau spune-mi venitul tau si calculez eu!";

    if (["salariu net","salariu brut"].some(k => m.includes(k)))
      return "*Calculator Salariu Net*\n\n🌐 https://mercurialu.github.io/biropilot/\n\nSau spune-mi brutul si calculez instant!";

    if (["credit ipotecar","rata","ipotecar"].some(k => m.includes(k)))
      return "*Calculator Credit Ipotecar*\n\n🌐 https://mercurialu.github.io/biropilot/\n\nAfla rata lunara in 2 secunde!";

    // === INSTITUTII ===
    
    if (["buletin","carte identitate","schimb buletin"].some(k => m.includes(k)))
      return "*Schimbare Buletin*\n\n📅 *Programare:* drpciv.ro\n💰 *Taxa:* 6 RON\n📄 *Acte:* buletin vechi, certificat nastere, taxa\n⏱ *Durata:* 2-5 zile\n\n🌐 https://mercurialu.github.io/biropilot/";

    if (["diurna","dieta","deplasare"].some(k => m.includes(k)))
      return "*Diurna 2026*\n\nRomania: 57-71 RON/zi\nUE: 87-105 RON/zi\nNon-UE: 97-120 RON/zi\n\n🌐 https://mercurialu.github.io/biropilot/";

    if (["amenda","amenda circulatie"].some(k => m.includes(k)))
      return "*Amenda Circulatie 2026*\n\nPunct de amenda: 202.5 RON\n• Clasa I: 405-607 RON\n• Clasa II: 810-1012 RON\n• Clasa III: 1215-1620 RON\n• Clasa IV: 1822-4050 RON\n• Clasa V: 4252-20250 RON\n\n⚠ Reducere 50% in 15 zile!\n\n🌐 https://mercurialu.github.io/biropilot/";

    if (["primarie","certificat urbanism","autorizatie"].some(k => m.includes(k)))
      return "*Certificat de Urbanism*\n\n📄 *Acte:* cerere, CI, act de proprietate, plan incadrare\n📍 *Unde:* Primaria localitatii\n💰 *Taxa:* 30-80 RON\n⏱ *Timp:* 30 zile";

    if (["onrc"].some(k => m.includes(k)))
      return "*ONRC*\n\n• Inmatriculare PFA: 45 RON\n• Inmatriculare SRL: 95 RON\n• Modificari: 45 RON\n📧 registratura@onrc.ro";

    if (["casa sanatatii","asigurare medicala"].some(k => m.includes(k)))
      return "*Casa de Asigurari de Sanatate*\n\n📄 Cerere + CI + dovada calitatii de asigurat\n📧 Depunere prin email la CJAS\n⏱ Procesare: 5-15 zile";

    if (["itm","revisal","contract munca"].some(k => m.includes(k)))
      return "*ITM / Revisal*\n\nContractul de munca se inregistreaza in Revisal\ninainte de inceperea activitatii.\n\nAngajatorul are obligatia sa il inmaneze\nangajatului in maxim 2 zile.";

    if (["drpciv","permis","inmatriculare auto"].some(k => m.includes(k)))
      return "*DRPCIV*\n\n• Buletin: 6 RON (2-5 zile)\n• Permis: 89 RON\n• Inmatriculare: 45 RON\n📅 Programari: drpciv.ro";

    if (["ghiseul","plati online"].some(k => m.includes(k)))
      return "*Ghiseul.ro*\n\nPlatforma nationala de plati\n• Impozite locale\n• Amenzi\n• Taxe DRPCIV\n• Cazier fiscal\n\n🔗 ghiseul.ro";

    if (["copil","indemnizatie","alocatie","matern"].some(k => m.includes(k)))
      return "*Indemnizatie Crestere Copil*\n\n• 85% din venit (24 luni)\n• 50% din venit (36 luni)\n• Plafon max: 12.700 RON/luna\n• Stimulent: ~2.430 RON/luna\n\n🌐 https://mercurialu.github.io/biropilot/";

    if (["site","calculator","online"].some(k => m.includes(k)))
      return "🌐 https://mercurialu.github.io/biropilot/\n\nAcolo ai toate calculatoarele si informatiile!";

    // Default
    return "Nu am inteles. Incearca:\n\"vreau PFA\", \"declaratie unica\", \"taxe anaf\",\n\"salariu net\", \"buletin\", \"primarie\", \"ajutor\"";
  }

  handleStep(session, m, userId) {
    const step = session.step;

    // PFA form generation
    if (step === "pfa_form") {
      const parts = m.split(",");
      if (parts.length >= 4) {
        const data = { nume: parts[0].trim(), cnp: parts[1].trim(), codCaen: parts[2].trim(), adresa: parts[3].trim() };
        session.step = null;
        // Create profile and generate document
        try {
          if (this.dna) this.dna.createProfile(userId, data);
          const link = DOC_BASE + "/document?userId=" + userId + "&formId=inmatriculare-pfa";
          return "✅ *Cerere PFA generata!*\n\n📄 Descarca documentul:\n" + link + "\n\n📋 *Acte necesare pentru ONRC:*\n1. Cererea (generata)\n2. Copie CI\n3. Cazier fiscal\n4. Dovada sediu\n5. 45 RON taxa\n\n💾 Salveaza linkul si tipareste!";
        } catch(e) {
          session.step = null;
          return "Am generat, dar linkul e in constructie. Revino in 2 minute.";
        }
      }
      return "Format incorect. Scrie exact: Nume Prenume, CNP, cod CAEN, adresa";
    }

    // Declaratie unica
    if (step === "decl_form" && /^\d+$/.test(m.replace(/\./g, ""))) {
      const venit = parseInt(m);
      const sm = 4050;
      const cas = Math.round(Math.max(venit * 0.25, sm * 12 * 0.25));
      const cass = Math.round(Math.max(venit * 0.10, sm * 12 * 0.06));
      const imp = Math.round(Math.max(0, (venit - cas) * 0.10));
      const total = cas + cass + imp;
      session.step = null;
      return "*Declaratia Unica (Formular 200)*\n\n" +
        "Venit: " + venit.toLocaleString() + " RON\n" +
        "CAS: " + cas.toLocaleString() + " RON\n" +
        "CASS: " + cass.toLocaleString() + " RON\n" +
        "Impozit: " + imp.toLocaleString() + " RON\n" +
        "*TOTAL: " + total.toLocaleString() + " RON*\n\n" +
        "📄 Documentul completat il gasesti la:\n" +
        DOC_BASE + "/document?userId=" + userId + "&formId=declaratie-unica-200\n\n" +
        "⏱ Termen: 25 mai " + (new Date().getFullYear() + 1);
    }

    session.step = null;
    return "Am inregistrat. Foloseste comanda \"ajutor\" pentru optiuni.";
  }

  matchAny(text, keywords) {
    return keywords.some(k => text.includes(k));
  }
}

module.exports = { WhatsAppBot };
