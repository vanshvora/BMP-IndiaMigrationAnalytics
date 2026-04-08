import './InfoPages.css';

export default function AboutPage() {
    return (
        <div className="info-page">
            <div className="info-shell">
                <section className="info-hero">
                    <span className="info-pill">About The Portal</span>
                    <h1>India Migration Analytics Initiative</h1>
                    <p>
                        A structured academic-institutional portal for studying internal migration patterns in India.
                        The platform combines map-based interaction, analytical charts, and AI-assisted exploration.
                    </p>
                </section>

                <section className="info-grid-3">
                    <article className="info-metric-card">
                        <h3>Purpose</h3>
                        <p>Make migration analysis accessible, interpretable, and evidence-linked for diverse users.</p>
                    </article>
                    <article className="info-metric-card">
                        <h3>Primary Source</h3>
                        <p>Census of India 2011 migration D-series tables with cleaned and normalized derivatives.</p>
                    </article>
                    <article className="info-metric-card">
                        <h3>Core Modes</h3>
                        <p>State explorer, district explorer, comparative mode, and AI conversational analysis.</p>
                    </article>
                </section>

                <section className="info-card">
                    <h2 className="info-section-title">Intended User Groups</h2>
                    <ul className="info-list">
                        <li>Government and planning institutions requiring spatial migration summaries.</li>
                        <li>Academic researchers and students studying demographic mobility structures.</li>
                        <li>Civil society and media users interpreting migration distribution narratives.</li>
                    </ul>
                </section>

                <section className="info-grid-2">
                    <article className="info-card">
                        <h2 className="info-section-title">Design Principles</h2>
                        <ul className="info-list">
                            <li>Transparency in source and transformation logic.</li>
                            <li>Interpretability-first visual hierarchy.</li>
                            <li>Human-readable summaries backed by tabular evidence.</li>
                            <li>Progressive depth from macro to micro geography.</li>
                        </ul>
                    </article>
                    <article className="info-card">
                        <h2 className="info-section-title">Responsible Use</h2>
                        <ul className="info-list">
                            <li>Use findings as descriptive indicators, not causal proof.</li>
                            <li>Cross-check AI outputs when preparing formal publications.</li>
                            <li>Mention the census period to avoid temporal misinterpretation.</li>
                            <li>Where needed, corroborate with updated datasets for recent policy use.</li>
                        </ul>
                    </article>
                </section>
            </div>
        </div>
    );
}

