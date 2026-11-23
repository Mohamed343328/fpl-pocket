const { fpl, sendError } = require('../../../lib/fpl');
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const id = String(req.query.id || '');
  if (!/^\d+$/.test(id)) return res.status(400).json({ error: 'رقم الجولة غير صحيح' });
  try {
    const data = await fpl(`/event/${id}/live/`);
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');
    return res.status(200).json(data);
  } catch (error) { return sendError(res, error); }
};
