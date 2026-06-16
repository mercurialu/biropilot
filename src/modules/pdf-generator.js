// ============================================================
// BIROPILOT — PDF Generator
// Completează formulare oficiale automate (ANAF, ONRC, etc.)
// ============================================================

/**
 * Hartă de formulare oficiale românești suportate
 * Fiecare formular are: template, câmpuri, instrucțiuni de completare
 */
const formsRegistry = {
  // === ANAF ===
  'declaratie-unica-200': {
    id: 'd200',
    nume: 'Declarația Unică (Formular 200)',
    institutie: 'ANAF',
    termen: '25 mai (anul următor)',
    perioada: 'Anuală',
    bazaLegala: 'OUG 79/2024',
    campuri: {
      'I.1': { label: 'Anul fiscal', dnaPath: 'anFiscal', tip: 'number' },
      'I.2': { label: 'CNP', dnaPath: 'cnp', tip: 'string' },
      'I.3': { label: 'Nume', dnaPath: 'nume', tip: 'string' },
      'I.4': { label: 'Prenume', dnaPath: 'prenume', tip: 'string' },
      'I.5': { label: 'Adresa domiciliu', dnaPath: 'adresaDomiciliu', tip: 'string' },
      'I.6': { label: 'Telefon', dnaPath: 'telefon', tip: 'string' },
      'I.7': { label: 'Email', dnaPath: 'email', tip: 'string' },
      'II.1': { label: 'Venit estimat anul curent', dnaPath: 'venitEstimatAnual', tip: 'number' },
      'II.2': { label: 'Venit realizat anul anterior', dnaPath: 'venitRealizatAnual', tip: 'number' },
      'II.3': { label: 'Cheltuieli deductibile', dnaPath: 'cheltuieliDeducibile', tip: 'number' },
      'II.4': { label: 'Norma de venit', dnaPath: 'normaVenit', tip: 'number' },
      'II.5': { label: 'CAS estimat', dnaPath: 'casEstimat', tip: 'string', calculated: true },
      'II.6': { label: 'CASS estimat', dnaPath: 'cassEstimat', tip: 'string', calculated: true },
      'II.7': { label: 'Impozit estimat', dnaPath: 'impozitEstimat', tip: 'string', calculated: true },
    },
    calcule: function(dna) {
      const venitEstimat = dna.venitEstimatAnual || 0;
      const venitRealizat = dna.venitRealizatAnual || 0;
      const cheltuieli = dna.cheltuieliDeducibile || 0;
      const norma = dna.normaVenit || 0;

      const bazaCAS = Math.max(venitRealizat - cheltuieli, norma);
      const bazaCASS = Math.max(venitRealizat - cheltuieli, norma);

      // Plafoane 2026 (se actualizează anual)
      const salariuMinim = 4050; // RON
      const plafonCASMin = salariuMinim * 12 * 0.25; // 25% din salariul minim
      const plafonCASMax = salariuMinim * 12 * 12; // de 12 ori salariul minim
      const plafonCASSCMin = salariuMinim * 12 * 0.06; // 6 salarii minime
      const plafonCASSCMax = salariuMinim * 12 * 12; // 12 salarii minime

      return {
        casEstimat: Math.min(Math.max(bazaCAS * 0.25, plafonCASMin), plafonCASMax).toFixed(0),
        cassEstimat: Math.min(Math.max(bazaCASS * 0.10, plafonCASSCMin), plafonCASSCMax).toFixed(0),
        impozitEstimat: Math.max(0, (bazaCAS - plafonCASMin) * 0.10).toFixed(0),
        totalEstimat: (Math.min(Math.max(bazaCAS * 0.25, plafonCASMin), plafonCASMax) +
                       Math.min(Math.max(bazaCASS * 0.10, plafonCASSCMin), plafonCASSCMax) +
                       Math.max(0, (bazaCAS - plafonCASMin) * 0.10)).toFixed(0)
      };
    }
  },

  // === ONRC ===
  'inmatriculare-pfa': {
    id: 'onrc-pfa',
    nume: 'Cerere Înmatriculare PFA',
    institutie: 'ONRC',
    termen: '15 zile de la începerea activității',
    perioada: 'O singură dată',
    bazaLegala: 'OUG 44/2008',
    campuri: {
      'A.1': { label: 'Nume', dnaPath: 'nume', tip: 'string' },
      'A.2': { label: 'Prenume', dnaPath: 'prenume', tip: 'string' },
      'A.3': { label: 'CNP', dnaPath: 'cnp', tip: 'string' },
      'A.4': { label: 'Domiciliu', dnaPath: 'adresaDomiciliu', tip: 'string' },
      'A.5': { label: 'Email', dnaPath: 'email', tip: 'string' },
      'A.6': { label: 'Telefon', dnaPath: 'telefon', tip: 'string' },
      'B.1': { label: 'Denumire PFA', dnaPath: 'denumirePFA', tip: 'string' },
      'B.2': { label: 'Domeniu CAEN', dnaPath: 'codCaen', tip: 'string' },
      'B.3': { label: 'Sediu profesional', dnaPath: 'sediuProfesional', tip: 'string' },
      'C.1': { label: 'Cont bancar', dnaPath: 'contBancar', tip: 'string' },
    },
    acteNecesare: [
      'Copie CI',
      'Certificat cazier fiscal',
      'Dovada sediului (contract chirie / act proprietate)',
      'Declarație pe propria răspundere'
    ],
    calcule: function(dna) {
      return { 'taxaONRC': 45 }; // Taxă ONRC 2026
    }
  },

  // === Casa Sănătății ===
  'asigurare-sanatate': {
    id: 'cas-sig',
    nume: 'Cerere Asigurare Sănătate',
    institutie: 'Casa Națională de Asigurări de Sănătate',
    termen: '30 zile de la angajare / înființare PFA',
    perioada: 'O singură dată',
    bazaLegala: 'Legea 95/2006',
    campuri: {
      '1': { label: 'Nume', dnaPath: 'nume', tip: 'string' },
      '2': { label: 'Prenume', dnaPath: 'prenume', tip: 'string' },
      '3': { label: 'CNP', dnaPath: 'cnp', tip: 'string' },
      '4': { label: 'Domiciliu', dnaPath: 'adresaDomiciliu', tip: 'string' },
      '5': { label: 'Telefon', dnaPath: 'telefon', tip: 'string' },
      '6': { label: 'Email', dnaPath: 'email', tip: 'string' },
    },
    acteNecesare: [
      'Copie CI',
      'Dovada calității de asigurat (contract muncă / certificat PFA)',
      'Declarație pe propria răspundere'
    ]
  },

  // === Primărie ===
  'certificat-urbanism': {
    id: 'urbanism',
    nume: 'Cerere Certificat de Urbanism',
    institutie: 'Primăria localității',
    termen: '30 zile de la depunere',
    perioada: 'La nevoie',
    bazaLegala: 'Legea 50/1991',
    campuri: {
      '1': { label: 'Nume', dnaPath: 'nume', tip: 'string' },
      '2': { label: 'Prenume', dnaPath: 'prenume', tip: 'string' },
      '3': { label: 'CNP', dnaPath: 'cnp', tip: 'string' },
      '4': { label: 'Adresa imobil', dnaPath: 'proprietati[0].adresa', tip: 'string' },
      '5': { label: 'Nr. Cadastral', dnaPath: 'proprietati[0].cadastral', tip: 'string' },
      '6': { label: 'Suprafață', dnaPath: 'proprietati[0].suprafata', tip: 'number' },
    },
    acteNecesare: [
      'Copie CI',
      'Act de proprietate',
      'Plan de încadrare în zonă',
      'Certificat fiscal',
    ]
  },

  // === DRPCIV ===
  'schimbare-buletin': {
    id: 'buletin',
    nume: 'Cerere Schimbare Buletin / Carte de Identitate',
    institutie: 'DRPCIV / SPCRPCIV',
    termen: '15 zile de la expirare / schimbare domiciliu',
    perioada: 'La expirare (10 ani)',
    bazaLegala: 'OUG 97/2005',
    campuri: {
      '1': { label: 'Nume', dnaPath: 'nume', tip: 'string' },
      '2': { label: 'Prenume', dnaPath: 'prenume', tip: 'string' },
      '3': { label: 'CNP', dnaPath: 'cnp', tip: 'string' },
      '4': { label: 'Adresa nouă', dnaPath: 'adresaDomiciliu', tip: 'string' },
      '5': { label: 'Telefon', dnaPath: 'telefon', tip: 'string' },
      '6': { label: 'Email', dnaPath: 'email', tip: 'string' },
    },
    acteNecesare: [
      'Buletinul vechi',
      'Certificat de naștere',
      'Dovada plății taxei (6-12 RON)',
      'Dovada programării online'
    ]
  }
};

/**
 * Clasa PDF Generator
 * Completează formulare cu date din Document DNA
 */
class PDFGenerator {
  constructor(dna) {
    this.dna = dna;
    this.forms = formsRegistry;
  }

  /**
   * Obține lista formularelor disponibile
   */
  listForms() {
    return Object.entries(this.forms).map(([id, f]) => ({
      id,
      nume: f.nume,
      institutie: f.institutie,
      termen: f.termen,
      perioada: f.perioada
    }));
  }

  /**
   * Generează datele pentru un formular
   * @param {string} userId - ID utilizator
   * @param {string} formId - ID formular (ex: 'declaratie-unica-200')
   * @returns {object} - Datele completate + calcule
   */
  generate(userId, formId) {
    const form = this.forms[formId];
    if (!form) {
      throw new Error(`Formularul "${formId}" nu există.`);
    }

    const profile = this.dna.getProfile(userId);
    if (!profile) {
      throw new Error('Utilizatorul nu are un profil Document DNA.');
    }

    // Completează câmpurile
    const completedFields = {};
    const missingFields = [];

    for (const [fieldCode, fieldDef] of Object.entries(form.campuri)) {
      if (fieldDef.calculated) continue; // Câmpurile calculate se adaugă separat

      const value = this.dna.getField(userId, fieldDef.dnaPath);
      if (value !== null && value !== undefined && value !== '') {
        completedFields[fieldCode] = {
          label: fieldDef.label,
          value: value,
          filled: true
        };
      } else {
        completedFields[fieldCode] = {
          label: fieldDef.label,
          value: null,
          filled: false
        };
        if (!fieldDef.calculated) {
          missingFields.push(fieldDef.label);
        }
      }
    }

    // Calculează
    let calculated = {};
    if (form.calcule) {
      calculated = form.calcule(profile.data);
      for (const [key, value] of Object.entries(calculated)) {
        // Găsește câmpul corespunzător
        for (const [fieldCode, fieldDef] of Object.entries(form.campuri)) {
          if (fieldDef.dnaPath === key || fieldDef.dnaPath?.endsWith(key)) {
            completedFields[fieldCode] = {
              label: fieldDef.label,
              value: value,
              filled: true,
              calculated: true
            };
          }
        }
      }
    }

    return {
      formId,
      nume: form.nume,
      institutie: form.institutie,
      bazaLegala: form.bazaLegala,
      termen: form.termen,
      perioada: form.perioada,
      acteNecesare: form.acteNecesare || [],
      fields: completedFields,
      calculated,
      missingFields,
      complet: missingFields.length === 0,
      generatLa: new Date().toISOString()
    };
  }

  /**
   * Obține lista câmpurilor obligatorii pentru un formular
   */
  getRequiredFields(formId) {
    const form = this.forms[formId];
    if (!form) return [];
    return Object.values(form.campuri)
      .filter(f => !f.calculated)
      .map(f => f.dnaPath);
  }

  /**
   * Caută formulare după cuvinte cheie
   */
  searchForms(query) {
    const q = query.toLowerCase();
    return Object.entries(this.forms)
      .filter(([id, f]) =>
        id.includes(q) ||
        f.nume.toLowerCase().includes(q) ||
        f.institutie.toLowerCase().includes(q)
      )
      .map(([id, f]) => ({ id, nume: f.nume, institutie: f.institutie }));
  }
}

module.exports = { PDFGenerator, formsRegistry };
