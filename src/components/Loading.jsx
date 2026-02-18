import React from 'react';

const Loading = () => {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column' }}>
            <div className="loader"></div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Loading CareBridge...</p>
        </div>
    );
};

export default Loading;
