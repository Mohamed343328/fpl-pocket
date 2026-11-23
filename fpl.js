const BASE = 'https://fantasy.premierleague.com/api';

async function fpl(path) {
  const response = await fetch(`${BASE}${path}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 FPL-Pocket/1.0', 'Accept': 'application/json' }
  });
  if (!response.ok) {
    const error = new Error(`FPL API returned ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

function sendError(res, error) {
  const status = error.status || 502;
  res.status(status).json({ error: status === 404 ? 'لم يتم العثور على البيانات' : 'تعذر الاتصال ببيانات FPL', detail: error.message });
}

module.exports = { fpl, sendError };
