const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

const BOOTH_IDS = ['1', '2', '3', '4', '5', '6', '7'];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h' }));

let state = { counters: {}, queue: [] };
let saveTimer = null;

function load() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      state = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch {
      // keep defaults
    }
  }
  if (!state.counters) state.counters = {};
  if (!state.queue) state.queue = [];
  for (const id of BOOTH_IDS) {
    if (!state.counters[id]) state.counters[id] = 1;
  }
}

function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    fs.writeFile(DATA_FILE, JSON.stringify(state), () => {});
  }, 200);
}

function normalizePhone(raw) {
  return String(raw || '').replace(/[^0-9]/g, '');
}

function normalizeBooth(raw) {
  const b = String(raw || '').trim();
  return BOOTH_IDS.includes(b) ? b : null;
}

app.post('/api/register', (req, res) => {
  const phone = normalizePhone(req.body && req.body.phone);
  const people = parseInt(req.body && req.body.people, 10);
  const booth = normalizeBooth(req.body && req.body.booth);

  if (!booth) {
    return res.status(400).json({ error: '잘못된 부스입니다. QR을 다시 확인해주세요.' });
  }
  if (!phone || phone.length < 9 || phone.length > 11) {
    return res.status(400).json({ error: '전화번호를 다시 확인해주세요.' });
  }
  if (!people || people < 1 || people > 50) {
    return res.status(400).json({ error: '인원수는 1~50명 사이로 입력해주세요.' });
  }

  const existing = state.queue.find(
    (e) => e.phone === phone && e.booth === booth && !e.done,
  );
  if (existing) {
    return res.json({ number: existing.number, alreadyRegistered: true });
  }

  const entry = {
    booth,
    number: state.counters[booth]++,
    phone,
    people,
    createdAt: Date.now(),
    done: false,
  };
  state.queue.push(entry);
  scheduleSave();
  res.json({ number: entry.number });
});

app.get('/api/status', (req, res) => {
  const phone = normalizePhone(req.query.phone);
  const booth = normalizeBooth(req.query.booth);
  if (!booth) return res.status(400).json({ error: '잘못된 부스입니다.' });

  const entry = state.queue.find(
    (e) => e.phone === phone && e.booth === booth && !e.done,
  );
  if (!entry) {
    return res.status(404).json({ error: '대기 정보를 찾을 수 없습니다.' });
  }

  let aheadGroups = 0;
  let aheadPeople = 0;
  for (const e of state.queue) {
    if (!e.done && e.booth === booth && e.number < entry.number) {
      aheadGroups += 1;
      aheadPeople += e.people;
    }
  }
  res.json({
    booth,
    number: entry.number,
    people: entry.people,
    aheadGroups,
    aheadPeople,
  });
});

app.get('/api/list', (req, res) => {
  const booth = normalizeBooth(req.query.booth);
  if (!booth) return res.status(400).json({ error: '잘못된 부스입니다.' });
  const waiting = state.queue
    .filter((e) => !e.done && e.booth === booth)
    .sort((a, b) => a.number - b.number)
    .map((e) => ({ number: e.number, people: e.people }));
  res.json({ booth, waiting, total: waiting.length });
});

app.post('/api/done/:booth/:number', (req, res) => {
  const booth = normalizeBooth(req.params.booth);
  const num = parseInt(req.params.number, 10);
  if (!booth) return res.status(400).json({ error: '잘못된 부스입니다.' });
  const entry = state.queue.find(
    (e) => e.booth === booth && e.number === num && !e.done,
  );
  if (!entry) {
    return res.status(404).json({ error: '해당 번호를 찾을 수 없습니다.' });
  }
  entry.done = true;
  entry.doneAt = Date.now();
  scheduleSave();
  res.json({ ok: true });
});

app.get('/api/booths', (req, res) => {
  res.json({ booths: BOOTH_IDS });
});

load();
app.listen(PORT, () => {
  console.log(`대기 시스템 실행 중: http://localhost:${PORT}`);
});
