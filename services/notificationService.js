// services/notificationService.js
const { Notification, Utilisateur } = require('../database/models');
const EmailService = require('./emailService');
const { TypeNotification, CanalNotification, PrioriteNotification } = require('../utils/enums');

class NotificationService {
  /**
   * Créer une notification
   */
  static async creerNotification({
    utilisateur_id,
    type,
    titre,
    message,
    lien_action = null,
    canal = CanalNotification.IN_APP,
    priorite = PrioriteNotification.NORMALE
  }) {
    try {
      const notification = await Notification.create({
        utilisateur_id,
        type,
        titre,
        message,
        lien_action,
        canal,
        priorite,
        date_envoi: new Date()
      });

      // Envoyer par email si demandé
      if (canal === CanalNotification.EMAIL || canal === CanalNotification.TOUS) {
        await this.envoyerNotificationEmail(notification);
      }

      return notification;
    } catch (error) {
      console.error('Erreur création notification:', error);
      throw error;
    }
  }

  /**
   * Envoyer une notification par email
   */
  static async envoyerNotificationEmail(notification) {
    try {
      const utilisateur = await Utilisateur.findByPk(notification.utilisateur_id);
      
      if (!utilisateur || !utilisateur.email) {
        console.warn('Utilisateur ou email non trouvé pour notification:', notification.id);
        return;
      }

      const sujet = this.getEmailSubject(notification);
      const contenu = this.getEmailContent(notification);

      await EmailService.envoyerEmail({
        to: utilisateur.email,
        subject: sujet,
        html: contenu
      });

      // Marquer comme envoyée par email
      await notification.update({ canal: CanalNotification.TOUS });

    } catch (error) {
      console.error('Erreur envoi notification email:', error);
      // Ne pas bloquer le processus principal en cas d'erreur d'email
    }
  }

  /**
   * Obtenir le sujet de l'email selon le type de notification
   */
  static getEmailSubject(notification) {
    const prefixes = {
      [TypeNotification.INFO]: '📋 Information',
      [TypeNotification.ALERTE]: '⚠️ Alerte',
      [TypeNotification.RAPPEL]: '🔔 Rappel',
      [TypeNotification.ABSENCE]: '👨‍🏫 Absence',
      [TypeNotification.RATTRAPAGE]: '🔄 Rattrapage',
      [TypeNotification.EMPLOI_TEMPS]: '📅 Emploi du temps'
    };

    const prefix = prefixes[notification.type] || '📧 Notification';
    return `${prefix} - ${notification.titre}`;
  }

  /**
   * Obtenir le contenu de l'email
   */
  static getEmailContent(notification) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .footer { background: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; }
          .btn { display: inline-block; padding: 10px 20px; background: #3B82F6; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EmploiDuTemps</h1>
          </div>
          <div class="content">
            <h2>${notification.titre}</h2>
            <p>${notification.message}</p>
            ${notification.lien_action ? `
              <p>
                <a href="${notification.lien_action}" class="btn">
                  Voir les détails
                </a>
              </p>
            ` : ''}
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Notifier la génération d'un emploi du temps
   */
  static async notifierGenerationEmploiTemps(emploiTemps) {
    const utilisateursConcernes = await this.getUtilisateursConcernesEmploiTemps(emploiTemps);

    for (const utilisateur of utilisateursConcernes) {
      await this.creerNotification({
        utilisateur_id: utilisateur.id,
        type: TypeNotification.EMPLOI_TEMPS,
        titre: 'Nouvel emploi du temps généré',
        message: `L'emploi du temps "${emploiTemps.nom_version}" pour la classe ${emploiTemps.classe.nom_classe} a été généré avec un score de ${emploiTemps.score_qualite}%.`,
        lien_action: `/emplois-temps/${emploiTemps.id}`,
        canal: CanalNotification.TOUS,
        priorite: PrioriteNotification.NORMALE
      });
    }
  }

  /**
   * Notifier une absence
   */
  static async notifierAbsence(absence) {
    const responsables = await this.getResponsablesPedagogiques();

    for (const responsable of responsables) {
      await this.creerNotification({
        utilisateur_id: responsable.id,
        type: TypeNotification.ABSENCE,
        titre: 'Nouvelle absence déclarée',
        message: `L'enseignant ${absence.enseignant.utilisateur.prenom} ${absence.enseignant.utilisateur.nom} est absent du ${absence.date_debut} au ${absence.date_fin}.`,
        lien_action: `/absences/${absence.id}`,
        canal: CanalNotification.TOUS,
        priorite: absence.necessite_remplacement ? PrioriteNotification.HAUTE : PrioriteNotification.NORMALE
      });
    }
  }

  /**
   * Notifier un rattrapage urgent
   */
  static async notifierRattrapageUrgent(rattrapage) {
    const responsables = await this.getResponsablesPedagogiques();

    for (const responsable of responsables) {
      await this.creerNotification({
        utilisateur_id: responsable.id,
        type: TypeNotification.RATTRAPAGE,
        titre: 'Rattrapage en attente depuis plus de 7 jours',
        message: `Le rattrapage pour le cours ${rattrapage.cours.matiere.nom_matiere} est en attente de planification depuis le ${rattrapage.date_demande}.`,
        lien_action: `/rattrapages/${rattrapage.id}`,
        canal: CanalNotification.TOUS,
        priorite: PrioriteNotification.CRITIQUE
      });
    }
  }

  /**
   * Obtenir les utilisateurs concernés par un emploi du temps
   */
  static async getUtilisateursConcernesEmploiTemps(emploiTemps) {
    // Implémentation simplifiée - dans la réalité, vous récupéreriez
    // les enseignants de la classe, les responsables, etc.
    return await Utilisateur.findAll({
      where: {
        role: ['admin', 'directeur', 'responsable_pedagogique'],
        etablissement_id: emploiTemps.etablissement_id
      },
      limit: 10
    });
  }

  /**
   * Obtenir les responsables pédagogiques
   */
  static async getResponsablesPedagogiques() {
    return await Utilisateur.findAll({
      where: {
        role: 'responsable_pedagogique'
      }
    });
  }

  /**
   * Marquer une notification comme lue
   */
  static async marquerCommeLue(notificationId) {
    const notification = await Notification.findByPk(notificationId);
    if (notification) {
      await notification.marquerCommeLue();
    }
  }

  /**
   * Obtenir les notifications non lues d'un utilisateur
   */
  static async getNotificationsNonLues(utilisateurId, limit = 20) {
    return await Notification.findAll({
      where: {
        utilisateur_id: utilisateurId,
        lue: false
      },
      order: [['date_envoi', 'DESC']],
      limit
    });
  }

  /**
   * Supprimer les anciennes notifications
   */
  static async nettoyerAnciennesNotifications(jours = 30) {
    const dateLimite = new Date();
    dateLimite.setDate(dateLimite.getDate() - jours);

    const result = await Notification.destroy({
      where: {
        date_envoi: {
          [Op.lt]: dateLimite
        },
        lue: true
      }
    });

    return result;
  }
}

module.exports = NotificationService;