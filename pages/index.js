import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';

const StockChart = dynamic(() => import('../components/StockChart'), { ssr: false });

// helpers

function fmt(n, dec = 2) {
  if (n == null || isNaN(n)) return '--';
  return Number(n).toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fmtVol(n) {
  if (n == null || isNaN(n)) return '--';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtVal(n) {
  if (n == null || isNaN(n)) return '--';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(2)}M`;
  return String(n);
}

function colorClass(n) {
  if (n > 0) return 'price-up';
  if (n < 0) return 'price-down';
  return 'price-flat';
}

function calcMA(closes, period) {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  return parseFloat((slice.reduce((a, b) => a + b, 0) / period).toFixed(2));
}

function calc52Week(candles) {
  if (!candles?.length) return { high: null, low: null };
  const closes = candles.map((c) => c.close);
  return { high: Math.max(...closes), low: Math.min(...closes) };
}

function avgVolume(candles, n = 20) {
  if (!candles?.length) return null;
  const last = candles.slice(-n);
  return Math.round(last.reduce((a, b) => a + b.volume, 0) / last.length);
}

export default function Home() {
  const [inputVal, setInputVal] = useState('');
  const [quote, setQuote]       = useState(null);
  const [candles, setCandles]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const search = useCallback(async (sym) => {
    if (!sym?.trim()) return;
    const s = sym.trim().toUpperCase();
    setLoading(true);
    setError(null);
    setQuote(null);
    setCandles(null);

    try {
      const [qRes, cRes] = await Promise.all([
        fetch(`/api/quote?symbol=${s}`),
        fetch(`/api/candles?symbol=${s}`),
      ]);
      const qData = await qRes.json();
      const cData = await cRes.json();

      if (!qRes.ok) throw new Error(qData.error || `Quote error ${qRes.status}`);
      if (!cRes.ok) throw new Error(cData.error || `Candles error ${cRes.status}`);

      setQuote(qData);
      setCandles(cData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    search(inputVal);
  };

  const handleChip = (sym) => {
    setInputVal(sym);
    search(sym);
  };

  const lastPrice   = quote?.closePrice ?? quote?.lastPrice ?? null;
  const change      = quote?.change ?? null;
  const changePct   = quote?.changePercent ?? null;
  const openPrice   = quote?.openPrice ?? null;
  const highPrice   = quote?.highPrice ?? null;
  const lowPrice    = quote?.lowPrice ?? null;
  const refPrice    = quote?.referencePrice ?? quote?.previousClose ?? null;
  const tradeVol    = quote?.total?.tradeVolume ?? null;
  const tradeVal    = quote?.total?.tradeValue  ?? null;
  const txCount     = quote?.total?.transaction ?? null;
  const name        = quote?.name ?? '';
  const symbol      = quote?.symbol ?? '';
  const exchange    = quote?.exchange ?? '';
  const market      = quote?.market ?? '';
  const isClose     = quote?.isClose;

  const rawCandleData = candles?.data ?? candles?.candles ?? [];
  const sortedCandles = rawCandleData.length
    ? [...rawCandleData].sort((a, b) => new Date(a.date) - new Date(b.date))
    : [];

  const closes = sortedCandles.map((d) => d.close);
  const maVals = {
    ma5:  calcMA(closes, 5),
    ma20: calcMA(closes, 20),
    ma60: calcMA(closes, 60),
  };
  const week52   = calc52Week(sortedCandles);
  const avgVol20 = avgVolume(sortedCandles, 20);
  const avgVol60 = avgVolume(sortedCandles, 60);

  function maSignal(maVal) {
    if (maVal == null || lastPrice == null) return 'na';
    return lastPrice >= maVal ? 'above' : 'below';
  }

  const maItems = [
    { label: 'MA5',  val: maVals.ma5,  color: '#f59e0b' },
    { label: 'MA20', val: maVals.ma20, color: '#3b82f6' },
    { label: 'MA60', val: maVals.ma60, color: '#a855f7' },
  ];

  const posIn52 =
    week52.high && week52.low && lastPrice
      ? (((lastPrice - week52.low) / (week52.high - week52.low)) * 100).toFixed(1)
      : null;

  return (
    <>
      <Head>
        <title>Fugle Stock Dashboard</title>
        <meta charSet="utf-8" />
        <meta name="description" content="Taiwan stock real-time quote, MA indicators and fundamental analysis powered by Fugle API" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📈</text></svg>" />
      </Head>

      {/* Header */}
      <header className="header">
        <div className="container header-inner">
          <div className="logo">
            <div className="logo-icon">F</div>
            <div className="logo-text">
              <h1>Fugle Stock Analysis</h1>
              <p>Fugle Stock Dashboard</p>
            </div>
          </div>
          <form className="search-form" onSubmit={handleSubmit}>
            <input
              className="search-input"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Enter stock code..."
              autoComplete="off"
              spellCheck={false}
            />
            <button className="search-btn" type="submit" disabled={loading}>
              {loading ? 'Loading...' : 'Search'}
            </button>
          </form>
        </div>
      </header>

      {/* Main */}
      <main className="main">
        <div className="container">

          {error && (
            <div className="error-box">
              <span style={{ fontSize: 18 }}>⚠️</span>
              <div>
                <strong>Error:</strong> {error}
                <div style={{ fontSize: 12, marginTop: 4, opacity: .7 }}>
                  Please verify stock code (e.g. 2330, 0050, AAPL)
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="loading-wrap">
              <div className="spinner" />
              <span>Loading data for <strong>{inputVal.toUpperCase()}</strong>...</span>
            </div>
          )}

          {!loading && !quote && !error && (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h2>Enter a stock code to begin</h2>
              <p>Supports TWSE stocks (e.g. 2330, 0050) and US tickers</p>
              <div className="example-chips">
                {['2330', '0050', '2317', '2454', '2412'].map((s) => (
                  <button key={s} className="chip" onClick={() => handleChip(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {quote && !loading && (
            <>
              {/* Stock header */}
              <div className="stock-header">
                <div className="stock-title">
                  <div className="name">
                    {name || symbol}
                    <span className="symbol-tag">{symbol}</span>
                  </div>
                  <div className="meta">
                    {exchange} · {market}
                    {isClose != null && (
                      <span style={{
                        marginLeft: 8, padding: '1px 7px', borderRadius: 6,
                        background: isClose ? '#f1f5f9' : '#dcfce7',
                        color: isClose ? '#94a3b8' : '#15803d',
                        fontSize: 11, fontWeight: 600,
                      }}>
                        {isClose ? 'Closed' : 'Open'}
                      </span>
                    )}
                  </div>
                </div>
                {quote?.time && (
                  <div className="last-update">
                    Updated: {new Date(quote.time).toLocaleString('en-US')}
                  </div>
                )}
              </div>

              {/* Price card */}
              <div className="price-card">
                <div>
                  <div className="price-main">
                    <span className={`price-value ${colorClass(change)}`}>
                      {fmt(lastPrice)}
                    </span>
                    <span className="price-currency">TWD</span>
                  </div>
                  <div className="price-change-block" style={{ marginTop: 6 }}>
                    <span className={`price-change ${colorClass(change)}`}>
                      {change != null ? (change >= 0 ? '+' : '') + fmt(change) : '--'}
                    </span>
                    <span className={`price-pct ${colorClass(changePct)}`}>
                      {changePct != null
                        ? (changePct >= 0 ? '▲ ' : '▼ ') + Math.abs(changePct).toFixed(2) + '%'
                        : '--'}
                    </span>
                  </div>
                </div>

                <div className="price-divider" />

                <div className="price-meta-grid">
                  <div className="price-meta-item">
                    <label>Prev. Close</label>
                    <span>{fmt(refPrice)}</span>
                  </div>
                  <div className="price-meta-item">
                    <label>Open</label>
                    <span>{fmt(openPrice)}</span>
                  </div>
                  <div className="price-meta-item">
                    <label>High</label>
                    <span style={{ color: '#dc2626' }}>{fmt(highPrice)}</span>
                  </div>
                  <div className="price-meta-item">
                    <label>Low</label>
                    <span style={{ color: '#16a34a' }}>{fmt(lowPrice)}</span>
                  </div>
                  <div className="price-meta-item">
                    <label>Volume (lots)</label>
                    <span>{tradeVol != null ? fmtVol(tradeVol) : '--'}</span>
                  </div>
                  <div className="price-meta-item">
                    <label>Turnover</label>
                    <span>{tradeVal != null ? fmtVal(tradeVal) : '--'}</span>
                  </div>
                </div>
              </div>

              {/* Chart card */}
              {((candles?.data?.length ?? 0) > 0 || (candles?.candles?.length ?? 0) > 0) && (
                <div className="chart-card">
                  <div className="section-title">
                    📈 Price Chart &amp; Moving Averages
                  </div>
                  <div className="ma-legend">
                    {maItems.map((m) => (
                      <div className="ma-badge" key={m.label}>
                        <div className="ma-dot" style={{ background: m.color }} />
                        {m.label}{m.val ? ` ${fmt(m.val)}` : ' --'}
                      </div>
                    ))}
                  </div>
                  <StockChart candles={candles} />
                </div>
              )}

              {/* Fundamentals card */}
              <div className="chart-card" style={{ marginBottom: 20 }}>
                <div className="section-title">🔍 Fundamentals &amp; Technical Analysis</div>

                <div className="fund-grid">
                  <div className="fund-card">
                    <div className="label">52W High</div>
                    <div className="value" style={{ color: '#dc2626' }}>
                      {fmt(week52.high)}
                    </div>
                    <div className="sub">Based on 6-month data</div>
                  </div>
                  <div className="fund-card">
                    <div className="label">52W Low</div>
                    <div className="value" style={{ color: '#16a34a' }}>
                      {fmt(week52.low)}
                    </div>
                    <div className="sub">Based on 6-month data</div>
                  </div>

                  {posIn52 != null && (
                    <div className="fund-card">
                      <div className="label">52W Position</div>
                      <div className="value">{posIn52}%</div>
                      <div style={{ marginTop: 8, background: '#e2e8f0', borderRadius: 999, height: 6 }}>
                        <div style={{
                          width: `${Math.min(100, posIn52)}%`,
                          height: '100%',
                          borderRadius: 999,
                          background: posIn52 > 70 ? '#ef4444' : posIn52 > 40 ? '#f59e0b' : '#22c55e',
                        }} />
                      </div>
                      <div className="sub" style={{ marginTop: 4 }}>0% = 52W Low &nbsp; 100% = 52W High</div>
                    </div>
                  )}

                  <div className="fund-card">
                    <div className="label">20D Avg Volume</div>
                    <div className="value">{avgVol20 ? fmtVol(avgVol20) : '--'}</div>
                    <div className="sub">lots / day</div>
                    {tradeVol != null && avgVol20 != null && (
                      <span className={`badge ${tradeVol > avgVol20 ? 'badge-up' : 'badge-down'}`}>
                        {tradeVol > avgVol20 ? 'Vol Up' : 'Vol Down'}
                        {' '}{Math.abs(((tradeVol - avgVol20) / avgVol20) * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>

                  <div className="fund-card">
                    <div className="label">60D Avg Volume</div>
                    <div className="value">{avgVol60 ? fmtVol(avgVol60) : '--'}</div>
                    <div className="sub">lots / day</div>
                  </div>

                  {quote.amplitude != null && (
                    <div className="fund-card">
                      <div className="label">Daily Range</div>
                      <div className="value">{fmt(quote.amplitude)}%</div>
                      <div className="sub">
                        <span className={`badge ${
                          quote.amplitude > 3 ? 'badge-down' :
                          quote.amplitude > 1 ? 'badge-neutral' : 'badge-up'
                        }`}>
                          {quote.amplitude > 3 ? 'High Vol' : quote.amplitude > 1 ? 'Mid Vol' : 'Low Vol'}
                        </span>
                      </div>
                    </div>
                  )}

                  {txCount != null && (
                    <div className="fund-card">
                      <div className="label">Transactions</div>
                      <div className="value">{txCount.toLocaleString()}</div>
                      <div className="sub">trades</div>
                    </div>
                  )}
                </div>

                {/* MA Signals */}
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 10 }}>
                    MA Signals
                  </div>
                  <div className="ma-status-grid">
                    {maItems.map((m) => {
                      const sig = maSignal(m.val);
                      const diff =
                        lastPrice != null && m.val != null
                          ? ((lastPrice - m.val) / m.val * 100).toFixed(2)
                          : null;
                      return (
                        <div
                          key={m.label}
                          className={`ma-status-card ${
                            sig === 'above' ? 'ma-above' :
                            sig === 'below' ? 'ma-below' : 'ma-na'
                          }`}
                        >
                          <div className="ma-name" style={{ color: m.color }}>{m.label}</div>
                          <div className="ma-value">
                            {m.val != null ? fmt(m.val) : '--'}
                          </div>
                          {sig !== 'na' && diff != null && (
                            <div className={`ma-diff ${sig === 'above' ? 'price-up' : 'price-down'}`}>
                              {sig === 'above' ? '▲' : '▼'} {Math.abs(diff)}%
                            </div>
                          )}
                          <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700 }}>
                            {sig === 'above' ? 'Above MA ✅' :
                             sig === 'below' ? 'Below MA ⚠️' : 'Insufficient data'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bid/Ask */}
                {quote.bids?.length > 0 && quote.asks?.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 10 }}>
                      Live Bid/Ask
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ background: '#fef2f2', borderRadius: 12, padding: '14px 16px' }}>
                        <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 700, marginBottom: 8 }}>
                          Sell (Ask)
                        </div>
                        {[...quote.asks].reverse().slice(0, 5).map((a, i) => (
                          <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between',
                            fontSize: 13, padding: '3px 0', color: '#1e293b',
                          }}>
                            <span style={{ fontWeight: 600 }}>{fmt(a.price)}</span>
                            <span style={{ color: '#64748b' }}>{fmtVol(a.size)} lots</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '14px 16px' }}>
                        <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, marginBottom: 8 }}>
                          Buy (Bid)
                        </div>
                        {quote.bids.slice(0, 5).map((b, i) => (
                          <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between',
                            fontSize: 13, padding: '3px 0', color: '#1e293b',
                          }}>
                            <span style={{ fontWeight: 600 }}>{fmt(b.price)}</span>
                            <span style={{ color: '#64748b' }}>{fmtVol(b.size)} lots</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #e2e8f0', background: '#fff',
        padding: '14px 0', textAlign: 'center',
        fontSize: 12, color: '#94a3b8',
      }}>
        Data source:{' '}
        <a href="https://developer.fugle.tw" target="_blank" rel="noreferrer"
          style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>
          Fugle MarketData API
        </a>
        {' '}·{' '}For reference only, not investment advice
      </footer>
    </>
  );
}
