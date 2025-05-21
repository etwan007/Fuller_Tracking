import { google } from 'googleapis';

export default async function handler(req, res) {
  console.log('API /api/form-responses called');

  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    console.log('Sheet ID:', sheetId ? 'Found' : 'Missing');
    console.log('Service account key:', key ? 'Found' : 'Missing');

    if (!sheetId || !key) {
      console.error('Missing environment variables');
      return res.status(500).json({ error: 'Missing environment variables' });
    }

    let credentials;
    try {
      credentials = JSON.parse(key);
      console.log('Parsed service account key successfully');
    } catch (parseError) {
      console.error('Failed to parse service account key:', parseError);
      return res.status(500).json({ error: 'Invalid service account key format' });
    }

    const scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      scopes
    );

    console.log('Attempting to authenticate...');
    await auth.authorize();
    console.log('Authentication successful');

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('Fetching spreadsheet data...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A1:D1000', // Adjust as needed
    });

    const rows = response.data.values || [];
    console.log(`Fetched ${rows.length} rows from the sheet`);

    res.status(200).json({ values: rows });
  } catch (error) {
    console.error('Error fetching form data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
