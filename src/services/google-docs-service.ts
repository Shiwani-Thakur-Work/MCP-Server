import { google } from 'googleapis';
import { getAuthenticatedClient } from '../auth/google-auth';

export class GoogleDocsService {
  static async appendContent(documentId: string, content: string) {
    const auth = await getAuthenticatedClient();
    const docs = google.docs({ version: 'v1', auth });

    const formattedContent = content.endsWith('\n') ? content : content + '\n';

    try {
      const res = await docs.documents.batchUpdate({
        documentId: documentId,
        requestBody: {
          requests: [
            {
              insertText: {
                endOfSegmentLocation: {
                  segmentId: '' // The body segment
                },
                text: formattedContent
              }
            }
          ]
        }
      });

      return {
        success: true,
        documentId: documentId,
        message: 'Content appended successfully.'
      };
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error('DOCUMENT_NOT_FOUND: The specified Google Doc could not be accessed.');
      }
      throw error;
    }
  }
}
