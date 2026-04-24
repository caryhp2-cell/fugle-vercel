export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol } = req.query;
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  try {
    const response = await fetch(
      `https://api.fugle.tw/marketdata/v1.0/stock/intraday/quote/${symbol.toUpperCase()}`,
      {
        headers: {
          'X-API-KEY': process.env.FUGLE_API_KEY,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || data.error || `API error: ${response.status}`,
      });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch quote: ${error.message}` });
  }
}
