// utils/helpers.js
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Helper functions pour l'application
 */
class Helpers {
  /**
   * Générer un UUID v4
   */
  static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Générer un code d'accès aléatoire
   */
  static generateAccessCode(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Générer un matricule enseignant
   */
  static generateTeacherId() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    
    const letterPart = Array.from({ length: 2 }, () => 
      letters.charAt(Math.floor(Math.random() * letters.length))
    ).join('');
    
    const numberPart = Array.from({ length: 6 }, () => 
      numbers.charAt(Math.floor(Math.random() * numbers.length))
    ).join('');
    
    return letterPart + numberPart;
  }

  /**
   * Formater une durée en minutes vers un format lisible
   */
  static formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins}min`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h${mins.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Formater une date en français
   */
  static formatDate(date, includeTime = false) {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    const formatted = new Date(date).toLocaleDateString('fr-FR', options);
    
    if (includeTime) {
      const time = new Date(date).toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      return `${formatted} à ${time}`;
    }
    
    return formatted;
  }

  /**
   * Formater une heure
   */
  static formatTime(time) {
    const [hours, minutes] = time.split(':');
    return `${hours}h${minutes}`;
  }

  /**
   * Calculer l'âge à partir d'une date de naissance
   */
  static calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Obtenir le début et la fin de la semaine pour une date
   */
  static getWeekRange(date = new Date()) {
    const currentDate = new Date(date);
    const dayOfWeek = currentDate.getDay();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return { start: startOfWeek, end: endOfWeek };
  }

  /**
   * Obtenir le numéro de semaine ISO
   */
  static getISOWeek(date = new Date()) {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target) / 604800000);
  }

  /**
   * Nettoyer et normaliser un texte
   */
  static sanitizeText(text) {
    if (!text) return '';
    
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[<>]/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Capitaliser la première lettre
   */
  static capitalizeFirst(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  /**
   * Capitaliser chaque mot
   */
  static capitalizeWords(text) {
    if (!text) return '';
    return text.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  /**
   * Générer des initiales
   */
  static getInitials(firstName, lastName) {
    if (!firstName || !lastName) return '??';
    
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    
    return firstInitial + lastInitial;
  }

  /**
   * Obtenir une couleur aléatoire pour l'affichage
   */
  static getRandomColor() {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Calculer la différence entre deux dates en jours
   */
  static dateDiffInDays(date1, date2) {
    const diffTime = Math.abs(new Date(date2) - new Date(date1));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Vérifier si une date est dans le futur
   */
  static isFutureDate(date) {
    return new Date(date) > new Date();
  }

  /**
   * Vérifier si une date est dans le passé
   */
  static isPastDate(date) {
    return new Date(date) < new Date();
  }

  /**
   * Obtenir la date actuelle au format YYYY-MM-DD
   */
  static getCurrentDate() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Obtenir l'heure actuelle au format HH:MM
   */
  static getCurrentTime() {
    return new Date().toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }

  /**
   * Générer un hash sécurisé
   */
  static async generateHash(data, saltRounds = 12) {
    return await bcrypt.hash(data, saltRounds);
  }

  /**
   * Comparer un hash
   */
  static async compareHash(data, hash) {
    return await bcrypt.compare(data, hash);
  }

  /**
   * Générer un token aléatoire
   */
  static generateRandomToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Obtenir l'URL de base de l'application
   */
  static getBaseUrl(req) {
    return `${req.protocol}://${req.get('host')}`;
  }

  /**
   * Valider et parser un objet JSON
   */
  static safeJSONParse(str, defaultValue = {}) {
    try {
      return JSON.parse(str);
    } catch {
      return defaultValue;
    }
  }

  /**
   * Deep clone d'un objet
   */
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (obj instanceof Object) {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  }

  /**
   * Fusionner deux objets profondément
   */
  static deepMerge(target, source) {
    const output = Object.assign({}, target);
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  }

  /**
   * Vérifier si une valeur est un objet
   */
  static isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * Grouper un tableau par une clé
   */
  static groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }

  /**
   * Ordonner un tableau par une clé
   */
  static sortBy(array, key, order = 'asc') {
    return array.sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (order === 'desc') {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
      
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });
  }

  /**
   * Filtrer les doublons d'un tableau
   */
  static removeDuplicates(array, key = null) {
    if (key) {
      const seen = new Set();
      return array.filter(item => {
        const value = item[key];
        if (seen.has(value)) {
          return false;
        }
        seen.add(value);
        return true;
      });
    }
    
    return [...new Set(array)];
  }

  /**
   * Paginer un tableau
   */
  static paginate(array, page = 1, limit = 10) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      data: array.slice(startIndex, endIndex),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: array.length,
        pages: Math.ceil(array.length / limit)
      }
    };
  }

  /**
   * Générer un slug à partir d'un texte
   */
  static generateSlug(text) {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  /**
   * Masquer partiellement un email
   */
  static maskEmail(email) {
    const [local, domain] = email.split('@');
    const maskedLocal = local.substring(0, 2) + '***' + local.substring(local.length - 1);
    return maskedLocal + '@' + domain;
  }

  /**
   * Masquer partiellement un numéro de téléphone
   */
  static maskPhone(phone) {
    return phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2');
  }

  /**
   * Formater un nombre avec séparateurs
   */
  static formatNumber(number) {
    return new Intl.NumberFormat('fr-FR').format(number);
  }

  /**
   * Formater une taille de fichier
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Retarder l'exécution
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Exécuter une fonction avec timeout
   */
  static async withTimeout(promise, ms, errorMessage = 'Timeout') {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(errorMessage)), ms);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}

module.exports = Helpers;