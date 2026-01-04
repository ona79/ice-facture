import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Enregistrement des modules Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function SalesChart({ invoices }) {
  // 1. On prépare les étiquettes des 7 derniers jours
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toLocaleDateString('fr-FR', { weekday: 'short' });
  }).reverse();

  // 2. On calcule le total des ventes pour chaque jour
  const dailyTotals = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayString = d.toLocaleDateString('fr-FR');
    
    return invoices
      .filter(inv => new Date(inv.createdAt).toLocaleDateString('fr-FR') === dayString)
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
  });

  const data = {
    labels: last7Days,
    datasets: [
      {
        fill: true,
        label: 'Ventes (FCFA)',
        data: dailyTotals,
        borderColor: '#22d3ee', // Couleur Cyan
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#22d3ee',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.raw.toLocaleString('fr-FR')} FCFA`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: 'rgba(255, 255, 255, 0.3)', font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255, 255, 255, 0.3)', font: { size: 10 } }
      }
    }
  };

  return (
    <div className="h-64 w-full">
      <Line data={data} options={options} />
    </div>
  );
}