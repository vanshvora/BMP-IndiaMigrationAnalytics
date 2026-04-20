import './InfoPages.css';

export default function AboutPage() {
    return (
        <div className="info-page">
            <div className="info-shell">
                <section className="info-hero">
                    <span className="info-pill">About The Project</span>
                    <h1>India Migration Analytics</h1>
                    <p>
                        A student-built web dashboard for studying internal migration patterns in India using Census
                        2011 migration tables. The platform combines map-based interaction, analytical charts, and
                        AI-assisted exploration.
                    </p>
                </section>

                <section className="info-grid-3">
                    <article className="info-metric-card">
                        <h3>Purpose</h3>
                        <p>Make migration analysis accessible, interpretable, and evidence-linked for diverse users.</p>
                    </article>
                    <article className="info-metric-card">
                        <h3>Primary Source</h3>
                        <p>
                            Census of India 2011 migration D-series tables with cleaned and normalized derivatives.
                            <br />
                            <small>
                                This is our primary data source, and we are working on datasets from the D series.{' '}
                                <a
                                    href="https://censusindia.gov.in/census.website/data/census-tables"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Census of India Data Tables
                                </a>
                                .
                            </small>
                        </p>
                    </article>
                    <article className="info-metric-card">
                        <h3>Core Modes</h3>
                        <p>State explorer, district explorer, comparative mode, and AI conversational analysis.</p>
                    </article>
                </section>

                <section className="info-card">
                    <h2 className="info-section-title">Intended User Groups</h2>
                    <ul className="info-list">
                        <li>Students learning how to interpret migration datasets.</li>
                        <li>Researchers exploring state and district migration patterns.</li>
                        <li>Reviewers or readers who need a clear visual summary of Census migration tables.</li>
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
                            <li>Use updated datasets for any recent migration analysis beyond Census 2011.</li>
                        </ul>
                    </article>
                </section>
            </div>
        </div>
    );
}

