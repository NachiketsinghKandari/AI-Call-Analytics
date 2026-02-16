import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

async function ensureHeaders(spreadsheetId: string): Promise<void> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Sheet1!A1:B1',
  });

  const firstRow = res.data.values?.[0];
  if (!firstRow || firstRow[0] !== 'Username') {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1:B1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['Username', 'Timestamp']],
      },
    });
  }
}

let headersEnsured = false;

export async function logVisit(username: string): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  if (!spreadsheetId) {
    throw new Error('GOOGLE_SPREADSHEET_ID is not configured');
  }

  if (!headersEnsured) {
    await ensureHeaders(spreadsheetId);
    headersEnsured = true;
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Sheet1!A:B',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[username, new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })]],
    },
  });
}
