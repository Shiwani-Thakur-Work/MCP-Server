import { google } from 'googleapis';
import { getAuthenticatedClient } from '../auth/google-auth';

export interface EmailParams {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
}

export class GmailService {
  private static constructMimeMessage(params: EmailParams): string {
    const to = params.to.join(', ');
    const cc = params.cc && params.cc.length > 0 ? `Cc: ${params.cc.join(', ')}\r\n` : '';
    const bcc = params.bcc && params.bcc.length > 0 ? `Bcc: ${params.bcc.join(', ')}\r\n` : '';
    const subject = params.subject;
    
    // Construct the MIME message
    const messageParts = [
      `To: ${to}`,
      cc.trim(),
      bcc.trim(),
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      '',
      params.body
    ].filter(part => part !== ''); // Remove empty cc/bcc lines

    const message = messageParts.join('\r\n');
    
    // Base64url encode the message
    return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  static async createDraft(params: EmailParams) {
    const auth = await getAuthenticatedClient();
    const gmail = google.gmail({ version: 'v1', auth });

    const raw = this.constructMimeMessage(params);

    const res = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: raw
        }
      }
    });

    return {
      success: true,
      draftId: res.data.id,
      message: 'Email draft created successfully.',
    };
  }

  static async sendEmail(params: EmailParams) {
    const auth = await getAuthenticatedClient();
    const gmail = google.gmail({ version: 'v1', auth });

    const raw = this.constructMimeMessage(params);

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: raw
      }
    });

    return {
      success: true,
      messageId: res.data.id,
      threadId: res.data.threadId,
      message: 'Email sent successfully.',
    };
  }
}
