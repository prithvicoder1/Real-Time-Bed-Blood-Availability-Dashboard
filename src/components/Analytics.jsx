import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

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

const labels = ['Now', '2h', '4h', '6h', '8h', '10h', '12h'];

const Analytics = () => {
    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: '#94a3b8' }
            },
            title: {
                display: true,
                text: 'Bed Occupancy Forecast (Next 12 Hours)',
                color: '#f8fafc',
                font: { size: 16 }
            },
        },
        scales: {
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#94a3b8' }
            },
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#94a3b8' }
            }
        }
    };
    const [chartData, setChartData] = React.useState({
        labels,
        datasets: [
            {
                fill: true,
                label: 'Predicted Occupancy',
                data: [85, 88, 92, 90, 85, 80, 75], // Initial mock
                borderColor: 'rgb(14, 165, 233)',
                backgroundColor: 'rgba(14, 165, 233, 0.2)',
                tension: 0.4,
            },
            {
                fill: true,
                label: 'Critical Threshold',
                data: [95, 95, 95, 95, 95, 95, 95],
                borderColor: 'rgb(239, 68, 68)',
                borderDash: [5, 5],
                pointRadius: 0,
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
            },
        ],
    });
    const [insight, setInsight] = React.useState("High probability of ICU shortage at SMS Hospital in next 4 hours due to traffic accident patterns.");
    const [accuracy, setAccuracy] = React.useState(0.87);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/analyze');
                const data = await res.json();

                if (data.occupancy_trend) {
                    setChartData(prev => ({
                        ...prev,
                        datasets: [
                            {
                                ...prev.datasets[0],
                                data: data.occupancy_trend
                            },
                            prev.datasets[1]
                        ]
                    }));
                }
                if (data.insight) setInsight(data.insight);
                if (data.confidence) setAccuracy(data.confidence);
            } catch (err) {
                console.error("Failed to fetch ML predictions", err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000); // Live updates
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="card" data-aos="fade-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>ML Predictions</h3>
                <span style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    border: '1px solid rgba(16, 185, 129, 0.4)'
                }}>
                    ⚡ {Math.round(accuracy * 100)}% Accuracy
                </span>
            </div>
            <Line options={options} data={chartData} />
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
                    <strong>AI Insight:</strong> {insight}
                </p>
            </div>
        </div>
    );
};

export default Analytics;
