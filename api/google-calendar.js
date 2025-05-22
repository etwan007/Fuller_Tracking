// Example: /api/google-calendar.js
export default async function handler(req, res) {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No access token' });
  }

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  res.status(200).json(data);
}
