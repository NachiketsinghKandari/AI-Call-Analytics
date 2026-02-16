import { google } from 'googleapis';
import http from 'http';
import { execSync } from 'child_process';

const CLIENT_ID = '1018498005368-kjr4v52964rgkgbuq97il9l1l9dhm616.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:3001';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/spreadsheets'],
  prompt: 'consent',
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url!, `http://localhost:3001`);
  const code = url.searchParams.get('code');

  if (!code) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end('<h1>Error: No authorization code received</h1>');
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Authorization successful!</h1><p>You can close this tab.</p>');

    console.log('\n=== Setup Complete ===');
    console.log('Add this to your .env.local:\n');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('');
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(`<h1>Error exchanging code</h1><pre>${err}</pre>`);
    console.error('Error exchanging code:', err);
  } finally {
    server.close();
  }
});

server.listen(3001, () => {
  console.log('Opening browser for Google OAuth consent...');
  console.log(`If the browser doesn't open, visit:\n${authUrl}\n`);

  try {
    execSync(`open "${authUrl}"`);
  } catch {
    // Browser open failed; user can use the printed URL
  }
});
