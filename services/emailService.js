// services/emailService.js
const nodemailer = require('nodemailer');
const config = require('../config/config');

class EmailService {
  static transporter = null;

  /**
   * Initialiser le transporteur email
   */
  static initTransporter() {
    if (this.transporter) return this.transporter;

    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.pass
      }
    });

    return this.transporter;
  }

  /**
   * Envoyer un email
   */
  static async envoyerEmail({ to, subject, html, text = null }) {
    try {
      const transporter = this.initTransporter();

      const mailOptions = {
        from: `"EmploiDuTemps" <${config.email.from}>`,
        to,
        subject,
        html,
        text: text || this.htmlToText(html)
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Email envoyé:', result.messageId);
      return result;

    } catch (error) {
      console.error('Erreur envoi email:', error);
      throw new Error(`Échec envoi email: ${error.message}`);
    }
  }

  /**
   * Convertir HTML en texte simple
   */
  static htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Envoyer un email de bienvenue
   */
  static async envoyerEmailBienvenue(utilisateur, motDePasseTemporaire = null) {
    const sujet = 'Bienvenue sur EmploiDuTemps';
    const contenu = this.getEmailBienvenueContent(utilisateur, motDePasseTemporaire);

    return await this.envoyerEmail({
      to: utilisateur.email,
      subject: sujet,
      html: contenu
    });
  }

  /**
   * Contenu de l'email de bienvenue
   */
  static getEmailBienvenueContent(utilisateur, motDePasseTemporaire) {
    const motDePasseSection = motDePasseTemporaire ? `
      <p><strong>Mot de passe temporaire:</strong> ${motDePasseTemporaire}</p>
      <p>Nous vous recommandons de changer votre mot de passe après votre première connexion.</p>
    ` : '';

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
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bienvenue sur EmploiDuTemps</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${utilisateur.prenom},</h2>
            <p>Votre compte a été créé avec succès sur notre plateforme de gestion d'emploi du temps.</p>
            ${motDePasseSection}
            <p><strong>Rôle:</strong> ${utilisateur.role}</p>
            <p>Vous pouvez dès maintenant vous connecter à votre compte.</p>
            <p>
              <a href="${config.app.url}/login" style="display: inline-block; padding: 10px 20px; background: #3B82F6; color: white; text-decoration: none; border-radius: 5px;">
                Se connecter
              </a>
            </p>
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
   * Envoyer un email de réinitialisation de mot de passe
   */
  static async envoyerEmailReinitialisation(utilisateur, token) {
    const sujet = 'Réinitialisation de votre mot de passe';
    const lien = `${config.app.url}/reset-password?token=${token}`;

    const contenu = `
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
            <h1>Réinitialisation de mot de passe</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${utilisateur.prenom},</h2>
            <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
            <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
            <p>
              <a href="${lien}" class="btn">
                Réinitialiser mon mot de passe
              </a>
            </p>
            <p><em>Ce lien expirera dans 1 heure.</em></p>
            <p>Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.envoyerEmail({
      to: utilisateur.email,
      subject: sujet,
      html: contenu
    });
  }

  /**
   * Vérifier la configuration email
   */
  static async verifierConfiguration() {
    try {
      const transporter = this.initTransporter();
      await transporter.verify();
      return { ok: true, message: 'Configuration email valide' };
    } catch (error) {
      return { ok: false, message: `Erreur configuration email: ${error.message}` };
    }
  }
}

module.exports = EmailService;