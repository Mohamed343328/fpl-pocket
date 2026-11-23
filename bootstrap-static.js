const { fpl, sendError } = require('../lib/fpl');
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const data = await fpl('/bootstrap-static/');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json(data);
  } catch (error) { return sendError(res, error); }
};
