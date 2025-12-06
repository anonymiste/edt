// utils/timeUtils.js
const { JourSemaine } = require('./enums');

/**
 * Utilitaires pour la gestion du temps et des horaires
 */
class TimeUtils {
  /**
   * Convertir une heure en minutes depuis minuit
   */
  static timeToMinutes(time) {
    if (!time) return 0;
    
    const [hours, minutes] = time.split(':').map(Number);
    return (hours * 60) + (minutes || 0);
  }

  /**
   * Convertir des minutes en heure formatée
   */
  static minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Ajouter des minutes à une heure
   */
  static addMinutesToTime(time, minutesToAdd) {
    const totalMinutes = this.timeToMinutes(time) + minutesToAdd;
    return this.minutesToTime(totalMinutes);
  }

  /**
   * Calculer la durée entre deux heures en minutes
   */
  static getDuration(startTime, endTime) {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    return end - start;
  }

  /**
   * Vérifier si deux créneaux se chevauchent
   */
  static doTimeSlotsOverlap(slot1, slot2) {
    const start1 = this.timeToMinutes(slot1.start);
    const end1 = this.timeToMinutes(slot1.end);
    const start2 = this.timeToMinutes(slot2.start);
    const end2 = this.timeToMinutes(slot2.end);

    return (start1 < end2 && end1 > start2);
  }

  /**
   * Vérifier si une heure est dans un intervalle
   */
  static isTimeInRange(time, startTime, endTime) {
    const timeMinutes = this.timeToMinutes(time);
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
  }

  /**
   * Obtenir le créneau horaire suivant
   */
  static getNextTimeSlot(currentTime, slotDuration = 60) {
    const currentMinutes = this.timeToMinutes(currentTime);
    const nextMinutes = Math.ceil(currentMinutes / slotDuration) * slotDuration;
    return this.minutesToTime(nextMinutes);
  }

  /**
   * Générer tous les créneaux horaires d'une journée
   */
  static generateTimeSlots(startTime = '08:00', endTime = '18:00', duration = 60) {
    const slots = [];
    let currentTime = startTime;

    while (this.timeToMinutes(currentTime) + duration <= this.timeToMinutes(endTime)) {
      const endTimeSlot = this.addMinutesToTime(currentTime, duration);
      slots.push({
        start: currentTime,
        end: endTimeSlot,
        duration: duration
      });
      currentTime = endTimeSlot;
    }

    return slots;
  }

  /**
   * Obtenir le jour de la semaine en français
   */
  static getFrenchDayName(dayIndex) {
    const days = [
      'dimanche', 'lundi', 'mardi', 'mercredi', 
      'jeudi', 'vendredi', 'samedi'
    ];
    return days[dayIndex];
  }

  /**
   * Obtenir le mois en français
   */
  static getFrenchMonthName(monthIndex) {
    const months = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    return months[monthIndex];
  }

  /**
   * Formater une date complète en français
   */
  static formatFrenchDate(date) {
    const d = new Date(date);
    const dayName = this.getFrenchDayName(d.getDay());
    const day = d.getDate();
    const month = this.getFrenchMonthName(d.getMonth());
    const year = d.getFullYear();

    return `${dayName} ${day} ${month} ${year}`;
  }

  /**
   * Calculer la différence entre deux dates
   */
  static getDateDiff(date1, date2, unit = 'days') {
    const diffMs = Math.abs(new Date(date2) - new Date(date1));
    
    switch (unit) {
      case 'seconds':
        return Math.floor(diffMs / 1000);
      case 'minutes':
        return Math.floor(diffMs / (1000 * 60));
      case 'hours':
        return Math.floor(diffMs / (1000 * 60 * 60));
      case 'days':
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
      case 'weeks':
        return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
      default:
        return diffMs;
    }
  }

  /**
   * Ajouter des jours à une date
   */
  static addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Ajouter des heures à une date
   */
  static addHours(date, hours) {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  }

  /**
   * Vérifier si une date est un jour ouvré
   */
  static isWorkingDay(date) {
    const day = new Date(date).getDay();
    return day >= 1 && day <= 5; // Lundi à Vendredi
  }

  /**
   * Obtenir le prochain jour ouvré
   */
  static getNextWorkingDay(date = new Date()) {
    let nextDay = new Date(date);
    
    do {
      nextDay.setDate(nextDay.getDate() + 1);
    } while (!this.isWorkingDay(nextDay));
    
    return nextDay;
  }

  /**
   * Compter les jours ouvrés entre deux dates
   */
  static countWorkingDays(startDate, endDate) {
    let count = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      if (this.isWorkingDay(current)) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * Obtenir le numéro de semaine dans l'année
   */
  static getWeekNumber(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }

  /**
   * Obtenir le premier jour de la semaine
   */
  static getFirstDayOfWeek(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  /**
   * Obtenir le dernier jour de la semaine
   */
  static getLastDayOfWeek(date = new Date()) {
    const firstDay = this.getFirstDayOfWeek(date);
    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);
    return lastDay;
  }

  /**
   * Convertir une date en timestamp Unix
   */
  static toUnixTimestamp(date) {
    return Math.floor(new Date(date).getTime() / 1000);
  }

  /**
   * Convertir un timestamp Unix en date
   */
  static fromUnixTimestamp(timestamp) {
    return new Date(timestamp * 1000);
  }

  /**
   * Formater une durée en texte lisible
   */
  static formatDurationText(minutes) {
    if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} heure${hours > 1 ? 's' : ''}`;
    }

    return `${hours} heure${hours > 1 ? 's' : ''} et ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
  }

  /**
   * Calculer l'âge exact
   */
  static calculateExactAge(birthDate) {
    const birth = new Date(birthDate);
    const now = new Date();

    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();

    if (days < 0) {
      months--;
      // Obtenir le dernier jour du mois précédent
      const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += lastMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    return { years, months, days };
  }

  /**
   * Vérifier si une année est bissextile
   */
  static isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  /**
   * Obtenir le nombre de jours dans un mois
   */
  static getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  /**
   * Générer un calendrier mensuel
   */
  static generateMonthlyCalendar(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const calendar = [];
    let week = [];

    // Remplir les jours vides du début
    for (let i = 0; i < firstDay.getDay(); i++) {
      week.push(null);
    }

    // Ajouter les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      week.push(new Date(year, month, day));
      
      if (week.length === 7) {
        calendar.push(week);
        week = [];
      }
    }

    // Remplir les jours vides de la fin
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null);
      }
      calendar.push(week);
    }

    return calendar;
  }

  /**
   * Valider un format d'heure
   */
  static isValidTimeFormat(time) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  /**
   * Valider un format de date
   */
  static isValidDateFormat(date) {
    return !isNaN(new Date(date).getTime());
  }

  /**
   * Convertir en fuseau horaire local
   */
  static toLocalTime(date, timezone = 'Europe/Paris') {
    return new Date(date).toLocaleString('fr-FR', { timeZone: timezone });
  }

  /**
   * Obtenir le décalage horaire en minutes
   */
  static getTimezoneOffset(timezone = 'Europe/Paris') {
    const now = new Date();
    const local = new Date(now.toLocaleString('fr-FR', { timeZone: timezone }));
    const utc = new Date(now.toLocaleString('fr-FR', { timeZone: 'UTC' }));
    return (local.getTime() - utc.getTime()) / (1000 * 60);
  }

  /**
   * Formater une durée pour l'affichage
   */
  static formatTimeDuration(startTime, endTime) {
    return `${this.formatTime(startTime)} - ${this.formatTime(endTime)}`;
  }

  /**
   * Formater une heure simple
   */
  static formatTime(time) {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    return `${hours}h${minutes}`;
  }

  /**
   * Comparer deux heures
   */
  static compareTimes(time1, time2) {
    const minutes1 = this.timeToMinutes(time1);
    const minutes2 = this.timeToMinutes(time2);
    
    if (minutes1 < minutes2) return -1;
    if (minutes1 > minutes2) return 1;
    return 0;
  }

  /**
   * Trier un tableau d'heures
   */
  static sortTimes(times) {
    return times.sort((a, b) => this.compareTimes(a, b));
  }

  /**
   * Obtenir l'heure actuelle formatée
   */
  static getCurrentTimeFormatted() {
    return new Date().toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }

  /**
   * Obtenir la date actuelle formatée
   */
  static getCurrentDateFormatted() {
    return new Date().toLocaleDateString('fr-FR');
  }
}

module.exports = TimeUtils;