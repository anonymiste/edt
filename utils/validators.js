// utils/validators.js
const { Types } = require('mongoose');

/**
 * Validateurs personnalisés pour les données de l'application
 */
class CustomValidators {
  /**
   * Valider un UUID
   */
  static isUUID(value) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  /**
   * Valider un code matière (ex: MATH-101)
   */
  static isCodeMatiere(value) {
    const codeMatiereRegex = /^[A-Z]{2,4}-\d{3}$/;
    return codeMatiereRegex.test(value);
  }

  /**
   * Valider un matricule enseignant
   */
  static isMatriculeEnseignant(value) {
    const matriculeRegex = /^[A-Z]{2}\d{6}$/;
    return matriculeRegex.test(value);
  }

  /**
   * Valider une année scolaire (ex: 2024-2025)
   */
  static isAnneeScolaire(value) {
    const anneeScolaireRegex = /^\d{4}-\d{4}$/;
    if (!anneeScolaireRegex.test(value)) return false;

    const [debut, fin] = value.split('-').map(Number);
    return fin === debut + 1 && debut >= 2000 && debut < 2100;
  }

  /**
   * Valider un code couleur hexadécimal
   */
  static isHexColor(value) {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexColorRegex.test(value);
  }

  /**
   * Valider un numéro de téléphone français
   */
  static isFrenchPhoneNumber(value) {
    const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
    return phoneRegex.test(value.replace(/\s/g, ''));
  }

  /**
   * Valider un code postal français
   */
  static isFrenchPostalCode(value) {
    const postalCodeRegex = /^\d{5}$/;
    return postalCodeRegex.test(value);
  }

  /**
   * Valider une durée en minutes
   */
  static isDuration(value, min = 30, max = 240) {
    const duration = parseInt(value);
    return !isNaN(duration) && duration >= min && duration <= max && duration % 5 === 0;
  }

  /**
   * Valider un volume horaire hebdomadaire
   */
  static isWeeklyVolume(value) {
    const volume = parseInt(value);
    return !isNaN(volume) && volume >= 30 && volume <= 600 && volume % 30 === 0;
  }

  /**
   * Valider un effectif de classe
   */
  static isClassSize(value) {
    const size = parseInt(value);
    return !isNaN(size) && size >= 1 && size <= 500;
  }

  /**
   * Valider une capacité de salle
   */
  static isRoomCapacity(value) {
    const capacity = parseInt(value);
    return !isNaN(capacity) && capacity >= 1 && capacity <= 1000;
  }

  /**
   * Valider un coefficient de matière
   */
  static isCoefficient(value) {
    const coeff = parseFloat(value);
    return !isNaN(coeff) && coeff >= 0.1 && coeff <= 10.0;
  }

  /**
   * Valider un score de qualité
   */
  static isQualityScore(value) {
    const score = parseFloat(value);
    return !isNaN(score) && score >= 0 && score <= 100;
  }

  /**
   * Valider un objet JSON
   */
  static isJSON(value) {
    if (typeof value === 'object') return true;
    
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Valider une date de naissance (doit être >= 16 ans)
   */
  static isBirthDate(value) {
    const birthDate = new Date(value);
    const today = new Date();
    const minAgeDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
    
    return birthDate instanceof Date && !isNaN(birthDate) && birthDate <= minAgeDate;
  }

  /**
   * Valider une date d'embauche
   */
  static isHireDate(value) {
    const hireDate = new Date(value);
    const today = new Date();
    
    return hireDate instanceof Date && !isNaN(hireDate) && hireDate <= today;
  }

  /**
   * Valider un fuseau horaire IANA
   */
  static isTimezone(value) {
    const validTimezones = [
      'Europe/Paris', 'Europe/Berlin', 'Europe/London', 'UTC',
      'Europe/Madrid', 'Europe/Rome', 'Europe/Brussels'
    ];
    return validTimezones.includes(value);
  }

  /**
   * Valider un code langue (ISO 639-1)
   */
  static isLanguageCode(value) {
    const languageCodes = ['fr', 'en', 'es', 'de', 'it'];
    return languageCodes.includes(value.toLowerCase());
  }

  /**
   * Valider un nom de fichier sécurisé
   */
  static isSafeFileName(value) {
    const safeFileNameRegex = /^[a-zA-Z0-9_\-\s\.]+$/;
    return safeFileNameRegex.test(value) && !value.includes('..');
  }

  /**
   * Valider une URL sécurisée
   */
  static isSafeURL(value) {
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol) && 
             !url.hostname.includes('localhost') &&
             !url.hostname.includes('127.0.0.1');
    } catch {
      return false;
    }
  }

  /**
   * Valider un nom/prénom (caractères autorisés seulement)
   */
  static isName(value) {
    const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;
    return nameRegex.test(value) && value.length >= 2 && value.length <= 100;
  }

  /**
   * Valider un email avec domaine autorisé
   */
  static isEducationalEmail(value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return false;

    const educationalDomains = [
      'edu', 'ac.', 'univ-', 'universite', 'college', 'lycee', 'ecole', 'com', 'tg', 'net'
    ];

    return educationalDomains.some(domain => 
      value.toLowerCase().includes(domain)
    ) || value.endsWith('.fr') || value.endsWith('.edu');
  }
}

/**
 * Validateurs pour les énumérations
 */
class EnumValidators {
  /**
   * Valider un rôle utilisateur
   */
  static isUserRole(value) {
    const validRoles = ['admin', 'directeur', 'responsable_pedagogique', 'enseignant', 'etudiant', 'personnel'];
    return validRoles.includes(value);
  }

  /**
   * Valider un type d'établissement
   */
  static isEtablissementType(value) {
    const validTypes = ['ecole_primaire', 'college', 'lycee', 'universite', 'institut'];
    return validTypes.includes(value);
  }

  /**
   * Valider un type de cours
   */
  static isCourseType(value) {
    const validTypes = ['cours_magistral', 'td', 'tp', 'atelier'];
    return validTypes.includes(value);
  }

  /**
   * Valider un type de salle
   */
  static isRoomType(value) {
    const validTypes = ['standard', 'laboratoire', 'gymnase', 'amphitheatre', 'atelier', 'informatique', 'musique', 'arts'];
    return validTypes.includes(value);
  }

  /**
   * Valider un jour de la semaine
   */
  static isWeekDay(value) {
    const validDays = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    return validDays.includes(value);
  }

  /**
   * Valider un statut d'emploi du temps
   */
  static isScheduleStatus(value) {
    const validStatuses = ['brouillon', 'en_cours', 'valide', 'publie', 'archive'];
    return validStatuses.includes(value);
  }

  /**
   * Valider un type de rattrapage
   */
  static isMakeupType(value) {
    const validTypes = ['cours_annule', 'soutien', 'preparation_examen', 'tutorat'];
    return validTypes.includes(value);
  }

  /**
   * Valider un statut de rattrapage
   */
  static isMakeupStatus(value) {
    const validStatuses = ['demande', 'planifie', 'realise', 'annule'];
    return validStatuses.includes(value);
  }

  /**
   * Valider un statut d'absence
   */
  static isAbsenceStatus(value) {
    const validStatuses = ['declaree', 'validee', 'refusee'];
    return validStatuses.includes(value);
  }

  /**
   * Valider un mode de génération
   */
  static isGenerationMode(value) {
    const validModes = ['rapide', 'equilibre', 'optimal'];
    return validModes.includes(value);
  }

  /**
   * Valider un format d'export
   */
  static isExportFormat(value) {
    const validFormats = ['pdf', 'excel', 'ical', 'csv', 'json'];
    return validFormats.includes(value);
  }

  /**
   * Valider un type de contrainte
   */
  static isConstraintType(value) {
    const validTypes = ['dure', 'souple'];
    return validTypes.includes(value);
  }

  /**
   * Valider une catégorie de contrainte
   */
  static isConstraintCategory(value) {
    const validCategories = ['temporelle', 'ressource', 'pedagogique'];
    return validCategories.includes(value);
  }

  /**
   * Valider un type de notification
   */
  static isNotificationType(value) {
    const validTypes = ['info', 'alerte', 'rappel', 'absence', 'rattrapage', 'emploi_temps'];
    return validTypes.includes(value);
  }

  /**
   * Valider un canal de notification
   */
  static isNotificationChannel(value) {
    const validChannels = ['in_app', 'email', 'tous'];
    return validChannels.includes(value);
  }

  /**
   * Valider une priorité de notification
   */
  static isNotificationPriority(value) {
    const validPriorities = ['basse', 'normale', 'haute', 'critique'];
    return validPriorities.includes(value);
  }
}

/**
 * Validateurs pour les données métier
 */
class BusinessValidators {
  /**
   * Valider la cohérence des dates de période
   */
  static isPeriodValid(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return start instanceof Date && 
           end instanceof Date && 
           !isNaN(start) && 
           !isNaN(end) && 
           start < end &&
           (end - start) <= (365 * 24 * 60 * 60 * 1000); // Max 1 an
  }

  /**
   * Valider la cohérence des horaires
   */
  static isTimeSlotValid(startTime, endTime, minDuration = 30, maxDuration = 240) {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    const duration = end - start;

    return start >= 0 && 
           end <= 24 * 60 && 
           duration >= minDuration && 
           duration <= maxDuration &&
           start < end;
  }

  /**
   * Valider la disponibilité d'un enseignant
   */
  static isTeacherAvailable(teacher, day, startTime, endTime) {
    if (!teacher.disponibilites || teacher.disponibilites.length === 0) {
      return true;
    }

    const matchingAvailability = teacher.disponibilites.find(dispo =>
      dispo.jour_semaine === day &&
      dispo.type === 'disponible' &&
      this.isTimeInSlot(startTime, endTime, dispo.heure_debut, dispo.heure_fin)
    );

    return !!matchingAvailability;
  }

  /**
   * Valider la compatibilité salle/cours
   */
  static isRoomCompatible(room, course) {
    // Vérifier la capacité
    if (room.capacite < course.effectif_estime) {
      return false;
    }

    // Vérifier le type de salle
    const roomRequirements = {
      'tp': ['laboratoire', 'informatique', 'atelier'],
      'atelier': ['atelier', 'arts', 'musique'],
      'cours_magistral': ['standard', 'amphitheatre'],
      'td': ['standard']
    };

    const requiredTypes = roomRequirements[course.type_cours] || ['standard'];
    return requiredTypes.includes(room.type_salle);
  }

  /**
   * Valider la charge de travail d'un enseignant
   */
  static isTeacherWorkloadValid(teacher, additionalHours = 0) {
    const currentHours = teacher.heures_actuelles || 0;
    const maxHours = teacher.heures_contractuelles || 0;
    
    return (currentHours + additionalHours) <= maxHours;
  }

  /**
   * Valider le chevauchement de créneaux
   */
  static hasScheduleConflict(existingSlots, newSlot) {
    return existingSlots.some(existingSlot =>
      existingSlot.jour_semaine === newSlot.jour_semaine &&
      this.doTimeSlotsOverlap(
        existingSlot.heure_debut, existingSlot.heure_fin,
        newSlot.heure_debut, newSlot.heure_fin
      )
    );
  }

  /**
   * Méthodes utilitaires privées
   */
  static timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  static isTimeInSlot(startTime, endTime, slotStart, slotEnd) {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    const slotStartMin = this.timeToMinutes(slotStart);
    const slotEndMin = this.timeToMinutes(slotEnd);

    return start >= slotStartMin && end <= slotEndMin;
  }

  static doTimeSlotsOverlap(start1, end1, start2, end2) {
    const s1 = this.timeToMinutes(start1);
    const e1 = this.timeToMinutes(end1);
    const s2 = this.timeToMinutes(start2);
    const e2 = this.timeToMinutes(end2);

    return (s1 < e2 && e1 > s2);
  }
}

module.exports = {
  CustomValidators,
  EnumValidators,
  BusinessValidators
};