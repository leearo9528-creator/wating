import { supabase, isValidBooth } from '../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const body = req.body || {};
  const booth = String(body.booth || '');
  const number = parseInt(body.number, 10);

  if (!isValidBooth(booth)) {
    return res.status(400).json({ error: '잘못된 부스입니다.' });
  }
  if (!number) {
    return res.status(400).json({ error: '잘못된 번호입니다.' });
  }

  const { data, error } = await supabase
    .from('queue')
    .update({ done: true, done_at: new Date().toISOString() })
    .eq('booth', booth)
    .eq('number', number)
    .eq('done', false)
    .select();

  if (error) return res.status(500).json({ error: '처리 실패' });
  if (!data || data.length === 0) {
    return res.status(404).json({ error: '해당 번호를 찾을 수 없습니다.' });
  }

  res.json({ ok: true });
}
