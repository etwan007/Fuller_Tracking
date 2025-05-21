import { google } from 'googleapis';

export default async function handler(req, res) {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    if (!sheetId || !key) {
      return res.status(500).json({ error: 'Missing environment variables' });
    }

    const credentials = JSON.parse(key);
    const scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      scopes
    );

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A1:D1000', // Adjust as needed
    });

    const rows = response.data.values || [];
    res.status(200).json({ values: rows });
  } catch (error) {
    console.error('Error fetching form data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
