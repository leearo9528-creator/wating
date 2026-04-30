import { supabase, isValidBooth } from '../lib/supabase.js';

export default async function handler(req, res) {
  const booth = String(req.query.booth || '');
  if (!isValidBooth(booth)) {
    return res.status(400).json({ error: '잘못된 부스입니다.' });
  }

  const { data: waiting, error } = await supabase
    .from('queue')
    .select('number, name, people')
    .eq('booth', booth)
    .eq('done', false)
    .order('number', { ascending: true });

  if (error) return res.status(500).json({ error: '조회 실패' });

  res.json({ booth, waiting: waiting || [], total: (waiting || []).length });
}
