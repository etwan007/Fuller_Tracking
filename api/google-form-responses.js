import { google } from 'googleapis';

export default async function handler(req, res) {
  console.log('API /api/form-responses called');

  // --- DESIGN MODE: Return hardcoded responses for UI design ---
  if (process.env.NODE_ENV === 'development' && req.query.mock === '1') {
    return res.status(200).json({
      values: [
        ["Timestamp", "Name", "Project Idea", "Notes"],
        ["2024-05-25 10:00:00", "Alice", "Smart Plant Monitor", "Uses sensors to track soil moisture and sunlight."],
        ["2024-05-25 10:05:00", "Bob", "DIY Weather Station", "Collects temperature, humidity, and wind data."],
        ["2024-05-25 10:10:00", "Charlie", "Automated Pet Feeder", "Dispenses food on a schedule with mobile alerts."]
      ]
    });
  }

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
