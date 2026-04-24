import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend,
  Filler
);

function calcMA(closes, period) {
  return closes.map((_, i) => {
    if (i < period - 1) return null;
    const slice = closes.slice(i - period + 1, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / period;
    return parseFloat(avg.toFixed(2));
  });
}

export default function StockChart({ candles }) {
  const rawData = candles?.data ?? candles?.candles ?? [];
  if (!rawData.length) return null;

  const sorted = [...rawData].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  // Show last 90 data points for clarity
  const data = sorted.slice(-90);
  const labels = data.map((d) => d.date);
  const closes = data.map((d) => d.close);
  const volumes = data.map((d) => d.volume);

  // Compute MAs over full sorted array, then slice the tail
  const allCloses = sorted.map((d) => d.close);
  const ma5Full = calcMA(allCloses, 5);
  const ma20Full = calcMA(allCloses, 20);
  const ma60Full = calcMA(allCloses, 60);
  const offset = sorted.length - 90;
  const ma5 = ma5Full.slice(offset >= 0 ? offset : 0);
  const ma20 = ma20Full.slice(offset >= 0 ? offset : 0);
  const ma60 = ma60Full.slice(offset >= 0 ? offset : 0);

  const priceData = {
    labels,
    datasets: [
      {
        type: 'line',
        label: 'Close',
        data: closes,
        borderColor: '#334155',
        backgroundColor: 'rgba(51,65,85,0.06)',
        borderWidth: 1.8,
        pointRadius: 0,
        fill: true,
        tension: 0.2,
        order: 4,
      },
      {
        type: 'line',
        label: 'MA5',
        data: ma5,
        borderColor: '#f59e0b',
        borderWidth: 1.6,
        pointRadius: 0,
        fill: false,
        tension: 0.2,
        order: 3,
      },
      {
        type: 'line',
        label: 'MA20',
        data: ma20,
        borderColor: '#3b82f6',
        borderWidth: 1.6,
        pointRadius: 0,
        fill: false,
        tension: 0.2,
        order: 2,
      },
      {
        type: 'line',
        label: 'MA60',
        data: ma60,
        borderColor: '#a855f7',
        borderWidth: 1.6,
        pointRadius: 0,
        fill: false,
        tension: 0.2,
        order: 1,
      },
    ],
  };

  const volumeData = {
    labels,
    datasets: [
      {
        type: 'bar',
        label: 'Volume (lots)',
        data: volumes,
        backgroundColor: 'rgba(59,130,246,0.35)',
        borderColor: 'rgba(59,130,246,0.6)',
        borderWidth: 1,
      },
    ],
  };

  const commonScaleX = {
    grid: { display: false },
    ticks: {
      maxTicksLimit: 8,
      maxRotation: 0,
      font: { size: 11 },
      color: '#94a3b8',
    },
  };

  const priceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 18,
          font: { size: 12 },
          color: '#475569',
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255,255,255,0.95)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 10,
      },
    },
    scales: {
      x: commonScaleX,
      y: {
        position: 'right',
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { font: { size: 11 }, color: '#94a3b8' },
      },
    },
  };

  const volumeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 8,
        callbacks: {
          label: (ctx) => ` ${ctx.parsed.y.toLocaleString()} lots`,
        },
      },
    },
    scales: {
      x: { ...commonScaleX, ticks: { ...commonScaleX.ticks, maxTicksLimit: 6 } },
      y: {
        position: 'right',
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: {
          font: { size: 11 },
          color: '#94a3b8',
          callback: (v) =>
            v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v,
        },
      },
    },
  };

  return (
    <div>
      <div style={{ height: 320, marginBottom: 16 }}>
        <Chart type="line" data={priceData} options={priceOptions} />
      </div>
      <div style={{ height: 110 }}>
        <Chart type="bar" data={volumeData} options={volumeOptions} />
      </div>
    </div>
  );
}
