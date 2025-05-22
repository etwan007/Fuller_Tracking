export default async function handler(req, res) {
  const token = req.query.access_token; // or get from cookie if you used cookies
  if (!token) return res.status(401).json({ error: 'Missing access_token' });

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: token });

  const calendar = google.calendar({ version: 'v3', auth });

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    res.status(200).json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
}
