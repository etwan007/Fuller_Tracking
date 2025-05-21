import fetch from 'node-fetch';

export default async function handler(req, res) {
  const token = req.cookies.google_access_token;
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  if (!sheetId) return res.status(500).json({ error: 'Missing sheet ID' });

  // Reading form responses from the first sheet
  const sheetRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A1:Z1000`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!sheetRes.ok) {
    return res.status(sheetRes.status).json(await sheetRes.json());
  }

  const data = await sheetRes.json();
  // data.values is array of rows; first row is headers, rest are responses

  res.status(200).json(data);
}
