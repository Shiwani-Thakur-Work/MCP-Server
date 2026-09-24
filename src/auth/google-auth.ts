import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

const oauth2Client = new google.auth.OAuth2(
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET,
  config.GOOGLE_REDIRECT_URI
);

export const SCOPES = [
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/documents',
];

export async function getAuthenticatedClient() {
  if (config.GOOGLE_REFRESH_TOKEN) {
    oauth2Client.setCredentials({ refresh_token: config.GOOGLE_REFRESH_TOKEN });
    return oauth2Client;
  }

  const tokenPath = path.resolve(config.GOOGLE_TOKEN_PATH);
  
  if (fs.existsSync(tokenPath)) {
    const token = fs.readFileSync(tokenPath, 'utf8');
    oauth2Client.setCredentials(JSON.parse(token));
  } else {
    throw new Error(`Token file not found at ${tokenPath} and GOOGLE_REFRESH_TOKEN not set. Please authenticate first.`);
  }

  // Handle automatic refresh when a new token is generated
  oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      // We only receive a refresh token the first time we authorize
      const existingTokens = fs.existsSync(tokenPath) ? JSON.parse(fs.readFileSync(tokenPath, 'utf8')) : {};
      existingTokens.refresh_token = tokens.refresh_token;
      fs.writeFileSync(tokenPath, JSON.stringify({ ...existingTokens, ...tokens }));
    } else {
       const existingTokens = fs.existsSync(tokenPath) ? JSON.parse(fs.readFileSync(tokenPath, 'utf8')) : {};
       fs.writeFileSync(tokenPath, JSON.stringify({ ...existingTokens, ...tokens }));
    }
  });

  return oauth2Client;
}

export function generateAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force refresh token generation
  });
}

export async function getAndSaveToken(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  
  const tokenPath = path.resolve(config.GOOGLE_TOKEN_PATH);
  const tokenDir = path.dirname(tokenPath);
  
  if (!fs.existsSync(tokenDir)) {
    fs.mkdirSync(tokenDir, { recursive: true });
  }
  
  fs.writeFileSync(tokenPath, JSON.stringify(tokens));
  return tokens;
}
