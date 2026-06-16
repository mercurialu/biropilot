// ============================================================
// BIROPILOT — Submission Hub
// Depunere documente la instituții + instrucțiuni pas cu pas
// ============================================================

/**
 * Configurația fiecărei instituții pentru depunere
 */
const institutionsConfig = {
  'ANAF': {
    metode: ['spv'],
    spv_url: 'https://spv.anaf.ro',
    tipDepunere: 'automata', // prin SPV
    acteSpecifice: true,
    programareNecesara: false,
    timpProcesare: '24-72 ore',
    bazaLegala: 'OUG 79/2024',
    instructiuni: [
      '1. Accesează SPV ANAF (Spațiul Privat Virtual)',
      '2. Autentifică-te cu certificatul digital',
      '3. Selectează „Depune document"',
      '4. Încarcă PDF-ul generat',
      '5. Semnează cu certificatul digital',
      '6. Salvează dovada de depunere'
    ]
  },
  'ONRC': {
    metode: ['email', 'ghiseu'],
    email: 'registratura@onrc.ro',
    tipDepunere: 'automata', // prin email
    programareNecesara: false,
    timpProcesare: '3-10 zile lucrătoare',
    bazaLegala: 'OUG 44/2008',
    instructiuni: [
      '1. Trimite PDF-ul semnat la registratura@onrc.ro',
      '2. Atașează actele necesare specificate',
      '3. Menționează în subiect: „Cerere înmatriculare PFA"',
      '4. Vei primi un număr de înregistrare pe email',
      '5. Plătește taxa de 45 RON la CEC Bank sau online',
      '6. Așteaptă confirmarea (3-10 zile lucrătoare)'
    ]
  },
  'Casa_Sanatatii': {
    metode: ['email', 'ghiseu'],
    email: 'documente@casan.ro', // Exemplu, diferă pe județe
    tipDepunere: 'automata',
    programareNecesara: false,
    timpProcesare: '5-15 zile',
    bazaLegala: 'Legea 95/2006',
    instructiuni: [
      '1. Trimite documentele la adresa de email a Casei de Asigurări de Sănătate județene',
      '2. Atașează PDF-ul semnat + actele necesare',
      '3. Menționează în subiect: „Cerere asigurare / modificare"',
      '4. Verifică statusul pe site-ul casei de sănătate'
    ]
  },
  'Primarie': {
    metode: ['fizic'],
    tipDepunere: 'semi-automata', // doar pregătim actele
    programareNecesara: true,
    timpProcesare: '30 zile',
    bazaLegala: 'Legea 50/1991',
    instructiuni: [
      '1. Programează-te online pe site-ul primăriei (recomandat)',
      '2. Tipărește PDF-ul generat (toate actele)',
      '3. Mergi la ghișeu cu actele originale + copii',
      '4. Plătește taxa la casierie (30-80 RON)',
      '5. Primești număr de înregistrare',
      '6. Verifică periodic statusul pe site-ul primăriei'
    ],
    ponturi: [
      '💡 Fa programare online — economisești 2-3 ore de așteptare',
      '💰 Taxele se plătesc la casierie sau online pe ghiseul.ro',
      '📋 Ai grijă să ai toate originalele la tine'
    ]
  },
  'DRPCIV': {
    metode: ['fizic'],
    tipDepunere: 'semi-automata',
    programareNecesara: true,
    timpProcesare: '2-5 zile',
    bazaLegala: 'OUG 97/2005',
    instructiuni: [
      '1. Fa programare pe portalul DRPCIV (obligatoriu)',
      '2. Tipărește PDF-ul cererii completate',
      '3. Mergi la ghișeu la ora programată',
      '4. Prezintă: buletin vechi, certificat naștere, dovada plată taxă',
      '5. Plătește taxa: 6 RON (buletin) / 12 RON (buletin + pașaport)',
      '6. Primești dovada și buletinul în 2-5 zile',
      '⚠ Nu uita: programarea e obligatorie și se face cu minim 24h înainte'
    ]
  },
  'ITM': {
    metode: ['revisal'],
    tipDepunere: 'automata',
    programareNecesara: false,
    timpProcesare: '24 ore',
    bazaLegala: 'Legea 53/2003',
    instructiuni: [
      '1. Accesează platforma Revisal',
      '2. Autentifică-te',
      '3. Completează datele contractului',
      '4. Confirmă transmiterea',
      '5. Salvează dovada'
    ]
  }
};

/**
 * Clasa Submission Hub
 * Coordonează depunerea documentelor la instituții
 */
class SubmissionHub {
  constructor() {
    this.institutions = institutionsConfig;
  }

  /**
   * Obține instrucțiuni complete pentru o instituție
   * @param {string} institutionName - Numele instituției
   * @param {boolean} vreaProgramare - Dacă userul vrea link de programare
   * @returns {object} - Instrucțiuni + linkuri + ponturi
   */
  getInstructions(institutionName, vreaProgramare = true) {
    const inst = this.institutions[institutionName];
    if (!inst) {
      return this.getGenericInstructions(institutionName);
    }

    return {
      institutie: institutionName,
      tipDepunere: inst.tipDepunere,
      timpProcesare: inst.timpProcesare,
      bazaLegala: inst.bazaLegala,
      pasi: inst.instructiuni,
      ponturi: inst.ponturi || [],
      programare: vreaProgramare && inst.programareNecesara ? {
        necesara: true,
        link: this.getAppointmentLink(institutionName),
        sfat: 'Programarea online reduce timpul de așteptare cu 80%.'
      } : { necesara: false },
      metodeDepunere: inst.metode.map(m => this.getMethodDetails(m))
    };
  }

  /**
   * Verifică dacă o instituție suportă depunere automată
   */
  canSubmitAutomatically(institutionName) {
    const inst = this.institutions[institutionName];
    return inst && inst.tipDepunere === 'automata';
  }

  /**
   * Obține statusul procesării pentru un document
   */
  getProcessingStatus(institutionName, numarInregistrare) {
    const inst = this.institutions[institutionName];
    if (!inst) return { status: 'necunoscut' };

    return {
      institutie: institutionName,
      numarInregistrare,
      timpEstimat: inst.timpProcesare,
      sfaturi: [
        '💡 Verifică periodic site-ul instituției cu numărul de înregistrare',
        '📞 Sună la ghișeu după perioada estimată',
        `📧 Pentru ONRC / ANAF: verifică SPV sau email`
      ]
    };
  }

  /**
   * Generează instrucțiuni generice pentru o instituție neconfigurată
   */
  getGenericInstructions(institutionName) {
    return {
      institutie: institutionName,
      tipDepunere: 'manual',
      timpProcesare: 'Necunoscut',
      pasi: [
        '1. Sună la ghișeu să afli ce acte îți trebuie',
        '2. Verifică site-ul oficial pentru informații actualizate',
        '3. Pregătește actele conform listei',
        '4. Mergi la ghișeu (de preferat dimineața devreme)',
        '5. Plătește taxele corespunzătoare',
        '6. Păstrează dovada de înregistrare'
      ],
      ponturi: ['💡 Caută pe site-ul instituției secțiunea „Servicii online"']
    };
  }

  /**
   * Obține link de programare pentru o instituție
   */
  getAppointmentLink(institutionName) {
    const links = {
      'DRPCIV': 'https://www.drpciv.ro/programari/',
      'Primarie': 'https://www.ghiseul.ro/ghiseul/public/',
      'default': 'https://www.ghiseul.ro/'
    };
    return links[institutionName] || links.default;
  }

  /**
   * Obține detalii despre o metodă de depunere
   */
  getMethodDetails(method) {
    const details = {
      'spv': { nume: 'SPV ANAF', tip: 'online', nivel: 'automat' },
      'email': { nume: 'Email', tip: 'online', nivel: 'semi-automat' },
      'fizic': { nume: 'Ghișeu fizic', tip: 'offline', nivel: 'manual' },
      'ghiseu': { nume: 'Ghiseul.ro', tip: 'online', nivel: 'semi-automat' },
      'revisal': { nume: 'Platforma Revisal', tip: 'online', nivel: 'automat' }
    };
    return details[method] || { nume: method, tip: 'necunoscut', nivel: 'manual' };
  }

  /**
   * Obține lista instituțiilor disponibile
   */
  listInstitutions() {
    return Object.entries(this.institutions).map(([name, config]) => ({
      nume: name,
      tipDepunere: config.tipDepunere,
      timpProcesare: config.timpProcesare,
      programareNecesara: config.programareNecesara
    }));
  }
}

module.exports = { SubmissionHub, institutionsConfig };
