import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface NegativeFeedbackAlertOptions {
  businessName: string;
  businessSlug?: string;
  ownerEmail: string;
  ownerName?: string | null;
  rating: number;
  selectedTags?: string[];
  message?: string | null;
  contactInfo?: string | null;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter | null = null;
  private cachedTransportKey = '';

  constructor(private configService: ConfigService) {}

  /**
   * Initializes or returns the cached Nodemailer SMTP transporter.
   */
  private getTransporter(): {
    transporter: nodemailer.Transporter | null;
    fromEmail: string;
  } {
    const host = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const port = parseInt(this.configService.get<string>('SMTP_PORT') || '465', 10);
    const secure =
      this.configService.get<string>('SMTP_SECURE') === 'true' || port === 465;
    const user = (this.configService.get<string>('SMTP_USER') || '').trim();
    const pass = (this.configService.get<string>('SMTP_PASS') || '').trim();
    const fromEmail =
      this.configService.get<string>('SMTP_FROM') ||
      (user ? `"Revora Alerts" <${user}>` : '"Revora Alerts" <alerts@revora.com>');

    if (!user || !pass) {
      return { transporter: null, fromEmail };
    }

    const currentKey = `${host}:${port}:${secure}:${user}:${pass}`;
    if (!this.transporter || this.cachedTransportKey !== currentKey) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      });
      this.cachedTransportKey = currentKey;
    }

    return { transporter: this.transporter, fromEmail };
  }

  /**
   * Dispatches an instant real-time alert via SMTP to the business owner when 1-3 star feedback is submitted.
   * If SMTP credentials are not yet configured, prints a detailed dev simulation banner to the terminal.
   */
  async sendNegativeFeedbackAlert(options: NegativeFeedbackAlertOptions): Promise<boolean> {
    const {
      businessName,
      ownerEmail,
      ownerName,
      rating,
      selectedTags,
      message,
      contactInfo,
    } = options;

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const dashboardUrl = `${frontendUrl}/dashboard`;

    const escapeHtml = (str: string): string =>
      str.replace(/[&<>"']/g, (c) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      }[c] || c));

    const starsDisplay = '⭐'.repeat(Math.max(1, Math.min(5, rating)));
    // Strip CR/LF to prevent SMTP subject header injection
    const subject = `${rating}-Star Customer Feedback for ${businessName}`.replace(/[\r\n]+/g, ' ').trim();

    const tagsList =
      selectedTags && selectedTags.length > 0
        ? selectedTags.join(', ')
        : 'None specified';

    const customerMessage = message?.trim() || 'No additional written message provided.';
    const customerContact = contactInfo?.trim() || 'No contact details provided';

    // Strict validation for contact links (prevents attribute breakout / javascript / mailto injection)
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/;

    let safeContactHtml = '<span style="color:#94a3b8; font-weight:400;">Not provided</span>';
    if (contactInfo && contactInfo.trim()) {
      const trimmedContact = contactInfo.trim();
      const escapedContact = escapeHtml(trimmedContact);
      if (EMAIL_REGEX.test(trimmedContact)) {
        safeContactHtml = `<a href="mailto:${encodeURIComponent(trimmedContact)}" style="color:#0d9488; text-decoration:none; font-weight:650;">${escapedContact}</a>`;
      } else if (PHONE_REGEX.test(trimmedContact)) {
        const cleanPhone = trimmedContact.replace(/[^0-9+]/g, '');
        safeContactHtml = `<a href="tel:${cleanPhone}" style="color:#0d9488; text-decoration:none; font-weight:650;">${escapedContact}</a>`;
      } else {
        safeContactHtml = `<span style="color:#334155; font-weight:500;">${escapedContact}</span>`;
      }
    }

    const { transporter, fromEmail } = this.getTransporter();

    // Plain-text content fallback
    const textContent = `
[REVORA REAL-TIME ALERT]
Urgent: A customer just left a ${rating}-star rating for ${businessName}.

- Rating: ${starsDisplay} (${rating}/5 Stars)
- Tags / Services: ${tagsList}
- Customer Note: ${customerMessage}
- Customer Contact: ${customerContact}

Resolve this issue quickly in your dashboard:
${dashboardUrl}
`;

    // Modern HTML email template with strict entity escaping
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>

<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#1e293b;">

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9; padding:36px 16px;">
    <tr>
      <td align="center">

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; background-color:#ffffff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden;">

          <!-- Brand Header -->
          <tr>
            <td style="background-color:#102a43; padding:26px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="left" valign="middle">
                    <span style="font-size:24px; font-weight:800; color:#ffffff; letter-spacing:-0.8px;">Revora</span>
                    <span style="display:inline-block; margin-left:10px; padding:5px 9px; background-color:#3b2430; border:1px solid #754052; border-radius:6px; color:#fecdd3; font-size:10px; font-weight:700; letter-spacing:0.8px; text-transform:uppercase;">Action Required</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:8px; font-size:12px; color:#cbd5e1; letter-spacing:0.2px;">
                    Customer Experience &amp; Reputation Management
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Accent Strip -->
          <tr>
            <td style="height:4px; background-color:#14b8a6; font-size:0; line-height:0;">&nbsp;</td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:36px 32px 32px;">

              <p style="margin:0 0 12px; font-size:11px; line-height:1.5; font-weight:700; letter-spacing:1.3px; text-transform:uppercase; color:#0d9488;">
                PRIVATE FEEDBACK ALERT
              </p>

              <h1 style="margin:0 0 14px; font-size:25px; line-height:1.3; font-weight:750; letter-spacing:-0.7px; color:#102a43;">
                A customer needs your attention
              </h1>

              <p style="margin:0 0 28px; font-size:14px; line-height:1.8; color:#64748b;">
                Hello ${escapeHtml(ownerName || 'Business Owner')}, a customer has shared feedback about their experience at
                <strong style="color:#102a43;">${escapeHtml(businessName)}</strong> and given a rating below 4 stars.
                Review their feedback and follow up where appropriate.
              </p>

              <!-- Rating Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px; background-color:#f0fdfa; border:1px solid #99f6e4; border-radius:12px;">
                <tr>
                  <td style="padding:22px 24px;">
                    <p style="margin:0 0 10px; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#0f766e;">
                      CUSTOMER RATING
                    </p>

                    <p style="margin:0; font-size:27px; line-height:1.4; font-weight:800; color:#0f766e;">
                      ${starsDisplay}
                      <span style="font-size:15px; font-weight:600; color:#115e59;">${rating} / 5</span>
                    </p>

                    <p style="margin:8px 0 0; font-size:13px; line-height:1.6; color:#475569;">
                      Private feedback received — review the details below.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Feedback Details -->
              <h2 style="margin:0 0 14px; font-size:15px; font-weight:750; color:#102a43;">
                Feedback details
              </h2>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px; border-top:1px solid #e2e8f0;">

                <tr>
                  <td width="36%" valign="top" style="padding:15px 10px 15px 0; border-bottom:1px solid #e2e8f0; font-size:13px; line-height:1.6; font-weight:600; color:#64748b;">
                    Tags selected
                  </td>
                  <td valign="top" style="padding:15px 0; border-bottom:1px solid #e2e8f0; font-size:14px; line-height:1.7; font-weight:500; color:#334155; overflow-wrap:anywhere;">
                    ${escapeHtml(tagsList)}
                  </td>
                </tr>

                <tr>
                  <td width="36%" valign="top" style="padding:15px 10px 15px 0; border-bottom:1px solid #e2e8f0; font-size:13px; line-height:1.6; font-weight:600; color:#64748b;">
                    Customer contact
                  </td>
                  <td valign="top" style="padding:15px 0; border-bottom:1px solid #e2e8f0; font-size:14px; line-height:1.7; font-weight:500; overflow-wrap:anywhere;">
                    ${safeContactHtml}
                  </td>
                </tr>

              </table>

              <!-- Customer Comment -->
              <h2 style="margin:0 0 12px; font-size:15px; font-weight:750; color:#102a43;">
                Customer's comment
              </h2>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:30px; background-color:#f8fafc; border:1px solid #e2e8f0; border-left:4px solid #14b8a6; border-radius:10px;">
                <tr>
                  <td style="padding:20px 18px; font-size:14px; line-height:1.8; color:#334155; overflow-wrap:anywhere;">
                    <span style="color:#0d9488; font-size:22px; font-weight:800;">&ldquo;</span>${escapeHtml(customerMessage)}<span style="color:#0d9488; font-size:22px; font-weight:800;">&rdquo;</span>
                  </td>
                </tr>
              </table>

              <!-- Recommended Next Step -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px; background-color:#f8fafc; border-radius:10px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0 0 5px; font-size:13px; font-weight:700; color:#102a43;">
                      Recommended next step
                    </p>
                    <p style="margin:0; font-size:13px; line-height:1.7; color:#64748b;">
                      Review the customer's concerns, reach out if contact details are available, and use their feedback to improve their experience.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:14px;">
                    <a href="${dashboardUrl}" style="display:inline-block; background-color:#0d9488; border:1px solid #0d9488; border-radius:8px; padding:15px 28px; color:#ffffff; text-decoration:none; font-size:14px; line-height:1.4; font-weight:700;">
                      View Feedback in Revora &nbsp; &#8594;
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size:12px; line-height:1.7; color:#94a3b8;">
                    Sign in to your Revora dashboard to review the full details.
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc; border-top:1px solid #e2e8f0; padding:24px 32px; text-align:center;">

              <p style="margin:0 0 8px; font-size:14px; font-weight:800; color:#102a43;">
                Revora
              </p>

              <p style="margin:0 0 12px; font-size:12px; line-height:1.8; color:#64748b;">
                Helping businesses understand customer feedback and deliver better experiences.
              </p>

              <p style="margin:0; font-size:11px; line-height:1.7; color:#94a3b8;">
                This is an automated notification from Revora. It contains privately submitted customer feedback.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html> 
`;

    // 1. If SMTP transporter is configured with credentials, send via Nodemailer
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: fromEmail,
          to: ownerEmail,
          subject,
          text: textContent,
          html: htmlContent,
        });

        this.logger.log(
          `[SMTP] Real-time negative feedback alert successfully dispatched from ${fromEmail} to ${ownerEmail} (messageId: ${info.messageId})`,
        );
        return true;
      } catch (err: any) {
        this.logger.error(`Error sending email alert via SMTP: ${err.message}`);
        return false;
      }
    }

    // 2. Development Mode Simulation Banner (when SMTP credentials are not set)
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      this.logger.warn(
        `[Notifications] SMTP is not configured in production. Feedback alert for business [${businessName}] could not be dispatched.`,
      );
      return false;
    }

    const maskedContact =
      customerContact.length > 5
        ? `${customerContact.slice(0, 3)}***`
        : '***';

    this.logger.log(`
================================================================================
[REVORA SMTP REAL-TIME ALERT SIMULATION] (Dev Mode: Set SMTP_PASS in backend/.env)
--------------------------------------------------------------------------------
From:        ${fromEmail}
To:          ${ownerEmail} (${ownerName || 'Business Owner'})
Business:    ${businessName}
Subject:     ${subject}
Rating:      ${starsDisplay} (${rating}/5 Stars)
Tags:        ${tagsList}
Contact:     ${maskedContact}
Dashboard:   ${dashboardUrl}
================================================================================
`);

    return true;
  }
}
