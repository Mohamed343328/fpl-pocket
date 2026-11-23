const { fpl, sendError } = require('../../lib/fpl');
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const id = String(req.query.id || '');
  if (!/^\d+$/.test(id)) return res.status(400).json({ error: 'رقم الفريق غير صحيح' });
  try {
    const [entry, bootstrap] = await Promise.all([
      fpl(`/entry/${id}/`),
      fpl('/bootstrap-static/')
    ]);
    const eventId = entry.current_event || bootstrap.events.find(e => e.is_current)?.id || bootstrap.events.find(e => e.is_next)?.id;
    let picks = [];
    if (eventId) {
      const picksData = await fpl(`/entry/${id}/event/${eventId}/picks/`);
      picks = picksData.picks || [];
    }
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    return res.status(200).json({ ...entry, current_event: eventId || null, picks });
  } catch (error) { return sendError(res, error); }
};
