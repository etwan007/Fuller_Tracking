import fetch from 'node-fetch';

export default async function handler(req, res) {
  const token = req.cookies?.google_access_token;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated with Google' });
  }

  const driveRes = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,mimeType)', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!driveRes.ok) {
    return res.status(driveRes.status).json(await driveRes.json());
  }

  const data = await driveRes.json();
  res.status(200).json({ files: data.files });
}
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const token = req.cookies?.google_access_token;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated with Google' });
  }

  const driveRes = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,mimeType)', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!driveRes.ok) {
    return res.status(driveRes.status).json(await driveRes.json());
  }

  const data = await driveRes.json();
  res.status(200).json({ files: data.files });
}
