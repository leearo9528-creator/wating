import { supabase, isValidBooth } from '../lib/supabase.js';

export default async function handler(req, res) {
  const booth = String(req.query.booth || '');
  const number = parseInt(req.query.number, 10);

  if (!isValidBooth(booth)) {
    return res.status(400).json({ error: '잘못된 부스입니다.' });
  }
  if (!number) {
    return res.status(400).json({ error: '잘못된 번호입니다.' });
  }

  const { data: entry, error: entryErr } = await supabase
    .from('queue')
    .select('booth, number, name, people')
    .eq('booth', booth)
    .eq('number', number)
    .eq('done', false)
    .maybeSingle();

  if (entryErr) return res.status(500).json({ error: '조회 실패' });
  if (!entry) return res.status(404).json({ error: '대기 정보를 찾을 수 없습니다.' });

  const { data: ahead, error: aheadErr } = await supabase
    .from('queue')
    .select('people')
    .eq('booth', booth)
    .eq('done', false)
    .lt('number', number);

  if (aheadErr) return res.status(500).json({ error: '조회 실패' });

  res.json({
    booth: entry.booth,
    number: entry.number,
    name: entry.name,
    people: entry.people,
    aheadGroups: ahead.length,
    aheadPeople: ahead.reduce((s, e) => s + e.people, 0),
  });
}
