
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const path = req.query.path || '';

  const allowed =
    /^(bootstrap-static\/|entry\/\d+\/?|entry\/\d+\/event\/\d+\/picks\/?|event\/\d+\/live\/?)$/;

  if (!allowed.test(path)) {
    return res.status(400).json({ error: 'Invalid FPL API path' });
  }

  try {
    const response = await fetch(
      'https://fantasy.premierleague.com/api/' + path,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'FPL-Pocket/1.0'
        }
      }
    );

    const data = await response.text();

    res.setHeader(
      'Content-Type',
      response.headers.get('content-type') || 'application/json'
    );
    res.setHeader(
      'Cache-Control',
      's-maxage=15, stale-while-revalidate=30'
    );

    return res.status(response.status).send(data);
  } catch (error) {
    return res.status(502).json({
      error: 'Could not connect to Fantasy Premier League',
      details: error.message
    });
  }
};
