// ============================================================
// BIROPILOT — Document DNA
// Sistemul de profil al utilizatorului
// Datele se completează O SINGURĂ DATĂ și se folosesc peste tot
// ============================================================

/**
 * Șablonul complet al Document DNA
 * Toate câmpurile pe care le poate completa un utilizator
 */
const dnaSchema = {
  // === Date personale ===
  nume: { label: 'Nume', type: 'string', required: true },
  prenume: { label: 'Prenume', type: 'string', required: true },
  cnp: { label: 'CNP', type: 'string', pattern: '^[0-9]{13}$', required: true },
  serieBuletin: { label: 'Serie Buletin', type: 'string', pattern: '^[A-Z]{2}[0-9]{6}$' },
  numarBuletin: { label: 'Nr. Buletin', type: 'string' },
  cnpSot: { label: 'CNP Soț/Soție', type: 'string', pattern: '^[0-9]{13}$' },
  email: { label: 'Email', type: 'string', format: 'email' },
  telefon: { label: 'Telefon', type: 'string', pattern: '^07[0-9]{8}$' },

  // === Adresă ===
  adresaDomiciliu: { label: 'Adresă Domiciliu', type: 'string' },
  judet: { label: 'Județ', type: 'string' },
  localitate: { label: 'Localitate', type: 'string' },
  codPostal: { label: 'Cod Poștal', type: 'string' },
  strada: { label: 'Stradă', type: 'string' },
  numar: { label: 'Număr', type: 'string' },
  bloc: { label: 'Bloc', type: 'string' },
  scara: { label: 'Scara', type: 'string' },
  apartament: { label: 'Apartament', type: 'string' },

  // === Date fiscale ===
  cui: { label: 'CUI (dacă PFA/SRL)', type: 'string', pattern: '^[0-9]+$' },
  onrc: { label: 'Nr. Înregistrare ONRC', type: 'string' },
  codCaen: { label: 'Cod CAEN principal', type: 'string', pattern: '^[0-9]{4}$' },
  formaJuridica: { label: 'Forma Juridică', type: 'string', enum: ['Persoană Fizică', 'PFA', 'SRL', 'II', 'IF', 'ONG'] },
  regimFiscal: { label: 'Regim Fiscal', type: 'string', enum: ['TVA la încasare', 'TVA lunar', 'TVA trimestrial', 'Neplătitor TVA'] },
  contBancar: { label: 'Cont Bancar IBAN', type: 'string', pattern: '^RO[0-9]{2}[A-Z]{4}[0-9A-Z]{16}$' },
  banca: { label: 'Bancă', type: 'string' },

  // === Venituri ===
  venitEstimatAnual: { label: 'Venit estimat anual (RON)', type: 'number' },
  venitRealizatAnual: { label: 'Venit realizat anual (RON)', type: 'number' },
  normaVenit: { label: 'Normă de venit (RON)', type: 'number' },
  cheltuieliDeducibile: { label: 'Cheltuieli deductibile (RON)', type: 'number' },

  // === Familie ===
  stareCivila: { label: 'Stare Civilă', type: 'string', enum: ['Necăsătorit', 'Căsătorit', 'Divorțat', 'Văduv'] },
  numarCopii: { label: 'Număr Copii în Întreținere', type: 'number' },
  copii: {
    label: 'Copii',
    type: 'array',
    items: {
      nume: { label: 'Nume Copil', type: 'string' },
      cnp: { label: 'CNP Copil', type: 'string', pattern: '^[0-9]{13}$' },
      dataNastere: { label: 'Data Nașterii', type: 'date' }
    }
  },

  // === Proprietăți ===
  proprietati: {
    label: 'Proprietăți',
    type: 'array',
    items: {
      tip: { label: 'Tip Proprietate', type: 'string', enum: ['Casă', 'Apartament', 'Teren', 'Garaj'] },
      adresa: { label: 'Adresă', type: 'string' },
      suprafata: { label: 'Suprafață (mp)', type: 'number' },
      cadastral: { label: 'Nr. Cadastral', type: 'string' },
      carteFunziara: { label: 'Nr. Carte Funziară', type: 'string' }
    }
  },

  // === Masina ===
  auto: {
    label: 'Autovehicul',
    type: 'array',
    items: {
      marca: { label: 'Marca', type: 'string' },
      model: { label: 'Model', type: 'string' },
      numarInmatriculare: { label: 'Nr. Înmatriculare', type: 'string' },
      serieSasiu: { label: 'Serie Șasiu (VIN)', type: 'string' },
      anFabricatie: { label: 'An Fabricație', type: 'number' }
    }
  },

  // === Certificate digitale ===
  certificateDigitale: {
    label: 'Certificate Digitale',
    type: 'array',
    items: {
      tip: { label: 'Tip', type: 'string', enum: ['certSIGN', 'Trans Sped', 'Altul'] },
      fisier: { label: 'Fișier certificat (.p12/.pfx)', type: 'file' },
      parola: { label: 'Parolă certificat', type: 'password' },
      dataExpirare: { label: 'Data Expirării', type: 'date' },
      valabil: { label: 'Valabil', type: 'boolean' }
    }
  },

  // === Credențiale instituții ===
  credidentiale: {
    label: 'Credențiale Instituții',
    type: 'object',
    properties: {
      spv: {
        user: { label: 'User SPV ANAF', type: 'string' },
        parola: { label: 'Parola SPV', type: 'password' }
      },
      ghiseul: {
        user: { label: 'User Ghiseul.ro', type: 'string' },
        parola: { label: 'Parola Ghiseul.ro', type: 'password' }
      },
      revisal: {
        user: { label: 'User Revisal', type: 'string' },
        parola: { label: 'Parola Revisal', type: 'password' }
      }
    }
  }
};

/**
 * Clasa Document DNA
 * Stochează și manageriază datele personale ale utilizatorului
 */
class DocumentDNA {
  constructor(storagePath = './data/dna') {
    this.storagePath = storagePath;
    this.profiles = new Map();
    this.schema = dnaSchema;
  }

  /**
   * Creează un profil nou
   */
  createProfile(userId, initialData = {}) {
    if (this.profiles.has(userId)) {
      throw new Error(`Profilul pentru ${userId} există deja. Folosește updateProfile().`);
    }
    const profile = {
      id: userId,
      data: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };
    this.profiles.set(userId, profile);
    if (Object.keys(initialData).length > 0) {
      this.updateProfile(userId, initialData);
    }
    return profile;
  }

  /**
   * Actualizează câmpuri într-un profil existent
   */
  updateProfile(userId, updates) {
    const profile = this.profiles.get(userId);
    if (!profile) {
      throw new Error(`Profilul ${userId} nu există. Creează-l întâi.`);
    }

    for (const [key, value] of Object.entries(updates)) {
      if (this.schema[key]) {
        profile.data[key] = value;
      }
    }

    profile.updatedAt = new Date().toISOString();
    profile.version++;
    return profile;
  }

  /**
   * Obține un câmp din profil
   */
  getField(userId, fieldPath) {
    const profile = this.profiles.get(userId);
    if (!profile) return null;

    const parts = fieldPath.split('.');
    let current = profile.data;
    for (const part of parts) {
      if (current === null || current === undefined) return null;
      current = current[part];
    }
    return current;
  }

  /**
   * Obține profilul complet
   */
  getProfile(userId) {
    return this.profiles.get(userId) || null;
  }

  /**
   * Completează un formular cu datele din DNA
   * @param {string} userId - ID-ul utilizatorului
   * @param {object} formFields - Mă nume câmp formular → cale în DNA
   * @returns {object} - Datele completate
   */
  fillForm(userId, formFields) {
    const result = {};
    for (const [formField, dnaPath] of Object.entries(formFields)) {
      const value = this.getField(userId, dnaPath);
      if (value !== null && value !== undefined) {
        result[formField] = value;
      }
    }
    return result;
  }

  /**
   * Validează completitudinea profilului pentru o procedură
   * @param {string} userId
   * @param {string[]} requiredFields - Căi în DNA necesare
   * @returns {{ valid: boolean, missing: string[] }}
   */
  validateForProcedure(userId, requiredFields) {
    const missing = [];
    for (const field of requiredFields) {
      const value = this.getField(userId, field);
      if (value === null || value === undefined || value === '') {
        missing.push(field);
      }
    }
    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * Exportă profilul ca JSON (pentru backup/import)
   */
  exportProfile(userId) {
    const profile = this.profiles.get(userId);
    if (!profile) return null;
    return JSON.stringify(profile, null, 2);
  }

  /**
   * Importă un profil din JSON
   */
  importProfile(jsonData) {
    const profile = JSON.parse(jsonData);
    if (!profile.id || !profile.data) {
      throw new Error('Format de profil invalid');
    }
    this.profiles.set(profile.id, profile);
    return profile;
  }

  /**
   * Verifică ce câmpuri mai trebuie completate
   */
  getCompletionStatus(userId) {
    const profile = this.profiles.get(userId);
    if (!profile) {
      return { total: 0, completed: 0, percent: 0, missing: Object.keys(this.schema) };
    }

    const total = Object.keys(this.schema).length;
    let completed = 0;
    const missing = [];

    for (const [key, field] of Object.entries(this.schema)) {
      const value = profile.data[key];
      if (value !== null && value !== undefined && value !== '' &&
          !(Array.isArray(value) && value.length === 0) &&
          !(typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)) {
        completed++;
      } else if (field.required) {
        missing.push(key);
      }
    }

    return {
      total,
      completed,
      percent: Math.round((completed / total) * 100),
      missing
    };
  }
}

module.exports = { DocumentDNA, dnaSchema };
