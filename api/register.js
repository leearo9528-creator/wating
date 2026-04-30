import { supabase, isValidBooth } from '../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const body = req.body || {};
  const booth = String(body.booth || '');
  const name = String(body.name || '').trim().slice(0, 20);
  const people = parseInt(body.people, 10);

  if (!isValidBooth(booth)) {
    return res.status(400).json({ error: '잘못된 부스입니다. QR을 다시 확인해주세요.' });
  }
  if (!name) {
    return res.status(400).json({ error: '닉네임을 입력해주세요.' });
  }
  if (!people || people < 1 || people > 50) {
    return res.status(400).json({ error: '인원수는 1~50명 사이로 입력해주세요.' });
  }

  const { data: number, error: numErr } = await supabase.rpc('next_queue_number', {
    p_booth: booth,
  });
  if (numErr || number == null) {
    return res.status(500).json({ error: '번호 발급 실패' });
  }

  const { error: insErr } = await supabase
    .from('queue')
    .insert({ booth, number, name, people });
  if (insErr) {
    return res.status(500).json({ error: '등록 실패' });
  }

  res.json({ number, name });
}
