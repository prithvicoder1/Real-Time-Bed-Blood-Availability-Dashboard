import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { ShieldCheck } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const HeatmapLayer = ({ points }) => {
    const map = useMap();

    useEffect(() => {
        if (!points || points.length === 0) return;

        const heat = L.heatLayer(points, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
        }).addTo(map);

        return () => {
            map.removeLayer(heat);
        };
    }, [points, map]);

    return null;
};

const MapComponent = ({ hospitals }) => {
    const [showHeatmap, setShowHeatmap] = useState(false);

    // Generate heatmap points based on occupancy (higher occupancy = more intensity)
    const heatPoints = hospitals.map(h => [
        h.lat,
        h.lng,
        h.beds.occupied / h.beds.total // Intensity 0-1
    ]);

    return (
        <div style={{ position: 'relative', height: '500px', width: '100%' }} data-aos="fade-up">
            <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className="btn"
                style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 1000,
                    background: showHeatmap ? '#ef4444' : 'var(--primary-color)',
                    color: 'white',
                    padding: '8px 16px',
                    fontSize: '0.8rem',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                }}
            >
                {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
            </button>

            <MapContainer center={[26.9124, 75.7873]} zoom={12} style={{ height: '100%', width: '100%', borderRadius: '12px' }}>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {showHeatmap ? (
                    <HeatmapLayer points={heatPoints} />
                ) : (
                    hospitals.map(hospital => (
                        hospital.lat && hospital.lng && (
                            <Marker key={hospital.id} position={[hospital.lat, hospital.lng]}>
                                <Popup>
                                    <div style={{ minWidth: '200px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                                            <h3 style={{ margin: 0, fontSize: '1rem', color: '#333' }}>{hospital.name}</h3>
                                            {hospital.certificates && hospital.certificates.length > 0 && (
                                                <ShieldCheck size={16} color="#22c55e" fill="#dcfce7" />
                                            )}
                                        </div>
                                        <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#666' }}>{hospital.location}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>ICU: {hospital.beds.icu}</span>
                                            <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>O2: {hospital.beds.oxygen}</span>
                                        </div>
                                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ display: 'block', marginTop: '10px', textAlign: 'center', background: '#3b82f6', color: 'white', textDecoration: 'none', padding: '5px', borderRadius: '4px' }}>
                                            Navigate
                                        </a>
                                    </div>
                                </Popup>
                            </Marker>
                        )
                    ))
                )}
            </MapContainer>
        </div>
    );
};

export default MapComponent;
