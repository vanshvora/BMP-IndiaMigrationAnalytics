import './InfoPages.css';

export default function MethodologyPage() {
    return (
        <div className="info-page">
            <div className="info-shell">
                <section className="info-hero">
                    <span className="info-pill">Methodological Note</span>
                    <h1>Methodology and Data Framework</h1>
                    <p>
                        This portal uses Census 2011 migration D-series datasets transformed into analysis-ready CSVs.
                        The methodological intent is to provide transparent exploratory analytics across state and district
                        migration contexts, with clear limits on interpretation.
                    </p>
                </section>

                <section className="info-card">
                    <h2 className="info-section-title">Data Inputs</h2>
                    <table className="info-table">
                        <thead>
                            <tr>
                                <th>Dataset</th>
                                <th>Scope</th>
                                <th>Analytical Use</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>D01</td>
                                <td>State-to-state migration totals</td>
                                <td>Inflow / outflow corridor ranking and core movement volumes</td>
                            </tr>
                            <tr>
                                <td>D02</td>
                                <td>Duration of residence</td>
                                <td>Tenure distribution and cohort structure by selected geography</td>
                            </tr>
                            <tr>
                                <td>D03</td>
                                <td>Reason for migration</td>
                                <td>Driver composition (work, business, marriage, education, others)</td>
                            </tr>
                            <tr>
                                <td>D04, D06, D10</td>
                                <td>Education, activity, marital status</td>
                                <td>Demographic and socio-economic profiling of migration groups</td>
                            </tr>
                            <tr>
                                <td>District Flow Tables</td>
                                <td>Origin-state to district corridors</td>
                                <td>District-level corridor prioritization and decomposition</td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                <section className="info-grid-2">
                    <article className="info-card">
                        <h2 className="info-section-title">Processing Pipeline</h2>
                        <ol className="info-list">
                            <li>Raw D-series extracts are cleaned and normalized in preprocessing scripts.</li>
                            <li>Numeric indicators are validated for parsing consistency and empty-row handling.</li>
                            <li>State and district naming are normalized to improve join and mapping reliability.</li>
                            <li>Frontend dashboards consume transformed CSVs for interactive computation.</li>
                            <li>AI layer queries backend DuckDB tables and returns scoped results with citations.</li>
                        </ol>
                    </article>

                    <article className="info-card">
                        <h2 className="info-section-title">Interpretation Discipline</h2>
                        <ul className="info-list">
                            <li>Rankings should be read with denominator context, not in isolation.</li>
                            <li>Threshold filters change corridor visibility and can affect comparative ordering.</li>
                            <li>District-level totals are useful for composition analysis, not causal inference.</li>
                            <li>AI summaries are intended for exploration; final reporting should cite raw tables.</li>
                        </ul>
                    </article>
                </section>

                <section className="info-card">
                    <h2 className="info-section-title">Coverage and Limitations</h2>
                    <p className="info-subtitle">
                        The portal emphasizes transparent exploratory analytics and should be interpreted with
                        methodological caution.
                    </p>
                    <ul className="info-list">
                        <li>Reference period corresponds to Census 2011 D-series structure.</li>
                        <li>Certain categories represent self-reported classifications and may include non-sampling noise.</li>
                        <li>Inter-state and district corridors may be sensitive to administrative naming differences.</li>
                        <li>This portal does not estimate causal effects; it summarizes observed distributions.</li>
                    </ul>
                </section>
            </div>
        </div>
    );
}

