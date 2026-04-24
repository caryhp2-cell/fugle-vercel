export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol } = req.query;
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  // Fetch ~120 trading days to ensure MA60 is computable
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 180); // ~180 calendar days ≈ 120+ trading days

  const fmt = (d) => d.toISOString().split('T')[0];

  try {
    const url =
      `https://api.fugle.tw/marketdata/v1.0/stock/historical/candles/${symbol.toUpperCase()}` +
      `?startDate=${fmt(startDate)}&endDate=${fmt(endDate)}`;

    const response = await fetch(url, {
      headers: {
        'X-API-KEY': process.env.FUGLE_API_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || data.error || `API error: ${response.status}`,
      });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch candles: ${error.message}` });
  }
}
