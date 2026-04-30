import { BOOTHS } from '../lib/supabase.js';

export default function handler(req, res) {
  res.json({ booths: BOOTHS });
}
