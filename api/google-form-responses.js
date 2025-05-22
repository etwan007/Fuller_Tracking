import { google } from 'googleapis';

export default async function handler(req, res) {
  console.log('API /api/form-responses called');

  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const keyString = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    console.log('Sheet ID:', sheetId ? 'Found' : 'Missing');
    console.log('Service account key:', keyString ? 'Found' : 'Missing');

    if (!sheetId || !keyString) {
      return res.status(500).json({ error: 'Missing environment variables' });
    }

    const credentials = JSON.parse(keyString);
    // Convert escaped `\n` into real newlines for private_key
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');

    console.log('Parsed service account key successfully');
    console.log('Attempting to authenticate...');

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
      range: 'A1:D1000',
    });

    const rows = response.data.values || [];

    console.log('Successfully fetched rows:', rows.length);

    res.status(200).json({ values: rows });
  } catch (error) {
    console.error('Error fetching form data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
