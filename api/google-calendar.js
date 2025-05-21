import fetch from 'node-fetch';

export default async function handler(req, res) {
  const token = req.cookies.google_access_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const calendarRes = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&orderBy=startTime&singleEvents=true&timeMin=' + new Date().toISOString(),
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!calendarRes.ok) {
    return res.status(calendarRes.status).json(await calendarRes.json());
  }

  const data = await calendarRes.json();
  res.status(200).json(data);
}
