
import { createHmac } from 'crypto';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const secret = process.env.SOLI_SECRET;
  if (!secret) return res.status(500).end();

  // Timestamp dibulatkan per 30 detik → satu token valid maks 30 detik
  const window = Math.floor(Date.now() / 30000).toString();
  const token  = createHmac('sha256', secret).update(window).digest('hex');

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ t: token });
}
