import React from 'react';

export default function MigrationInsightCard({ title, accent, badge, heroValue, heroLabel, summary, items }) {
    return (
        <div className="card feature-card narrative-card" style={{ '--narrative-accent': accent }}>
            <h3 className="card-title">{title}</h3>
            <div className="narrative-badge">{badge}</div>
            <div className="narrative-hero">
                <p className="narrative-value">{heroValue}</p>
                <p className="narrative-label">{heroLabel}</p>
            </div>
            <p className="narrative-detail">{summary}</p>
            <div className="narrative-grid">
                {items.map(function (item) {
                    return (
                        <div className="narrative-stat" key={item.label}>
                            <span className="narrative-stat-label">{item.label}</span>
                            <strong className="narrative-stat-value">{item.value}</strong>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
