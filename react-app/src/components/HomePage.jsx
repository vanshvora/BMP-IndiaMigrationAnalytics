import { useEffect, useMemo, useState } from 'react';
import './HomePage.css';

const DEMO_STEPS = [
    {
        id: 'select',
        label: 'Step 1',
        title: 'Select Geography',
        description: 'Pick a state or district to focus analysis on a specific migration context.',
    },
    {
        id: 'explore',
        label: 'Step 2',
        title: 'Explore Metrics',
        description: 'Inspect corridors, gender splits, rural-urban composition, and reason profiles.',
    },
    {
        id: 'insight',
        label: 'Step 3',
        title: 'Ask AI Assistant',
        description: 'Use AI chat to extract ranked insights, clarifications, and quick quantitative summaries.',
    },
];

const FEATURE_CARDS = [
    {
        title: 'State-Level Corridor Analysis',
        detail: 'Visualize inflow and outflow patterns across India with interactive threshold controls.',
        icon: 'pi pi-chart-line',
    },
    {
        title: 'District-Level Granularity',
        detail: 'Move beyond state aggregates and study district-specific migration structures.',
        icon: 'pi pi-map',
    },
    {
        title: 'Comparative Analytics',
        detail: 'Compare migration indicators between two states or districts using shared metrics.',
        icon: 'pi pi-sliders-h',
    },
    {
        title: 'AI Insight Assistant',
        detail: 'Ask natural-language questions and receive SQL-backed summaries from available tables.',
        icon: 'pi pi-comments',
    },
];

const FAQ_PREVIEW = [
    {
        question: 'Which states receive the highest migrant inflows?',
        answer: 'Use State Explorer and ask for top destination states by total persons to view ranked high-volume inflow geographies.',
    },
    {
        question: 'What are the top origin states for a selected district?',
        answer: 'Select the state and district first, then inspect district corridor rankings or use AI Chat for a top-origin summary.',
    },
    {
        question: 'How does gender composition vary across migration corridors?',
        answer: 'Gender split is available across major panels through male/female totals and percentage shares for selected contexts.',
    },
    {
        question: 'How should threshold filters be interpreted?',
        answer: 'Higher thresholds remove smaller corridors and emphasize major flows; lower thresholds reveal broader network structure.',
    },
];

export default function HomePage({ onNavigate }) {
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [openFaqIndex, setOpenFaqIndex] = useState(0);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setActiveStepIndex((prev) => (prev + 1) % DEMO_STEPS.length);
        }, 4000);

        return () => window.clearInterval(timer);
    }, []);

    const activeStep = useMemo(() => DEMO_STEPS[activeStepIndex], [activeStepIndex]);

    return (
        <div className="home-page">
            <div className="home-shell">
                <section className="home-hero home-surface">
                    <div className="home-hero-content">
                        <p className="home-kicker">India Migration Analytics</p>
                        <h1>Explore Census 2011 migration patterns through interactive dashboards.</h1>
                        <p>
                            Study state and district migration flows with maps, charts, tables, and an AI assistant
                            that answers questions from the available Census D-series data.
                        </p>
                        <div className="home-hero-actions">
                            <button type="button" className="home-btn home-btn-primary" onClick={() => onNavigate('state')}>
                                Start With State Explorer
                            </button>
                            <button type="button" className="home-btn home-btn-secondary" onClick={() => onNavigate('ai')}>
                                Open AI Chat
                            </button>
                            <button type="button" className="home-btn home-btn-tertiary" onClick={() => onNavigate('methodology')}>
                                Read Methodology
                            </button>
                        </div>
                    </div>

                    <div className="home-hero-visual">
                        <div className="hero-preview-card">
                            <div className="hero-preview-head">
                                <h3>Analytics Preview</h3>
                                <span>Live-style snapshot</span>
                            </div>

                            <div className="hero-preview-grid">
                                <article className="preview-tile">
                                    <p className="tile-label">Top Destination (Example)</p>
                                    <strong>Maharashtra</strong>
                                    <span>High-volume interstate inflow profile</span>
                                </article>
                                <article className="preview-tile">
                                    <p className="tile-label">Dual Resolution</p>
                                    <strong>State + District</strong>
                                    <span>Macro patterns with local granularity</span>
                                </article>
                            </div>

                            <div className="hero-ai-preview">
                                <p className="tile-label">AI Assistant Query</p>
                                <p className="hero-ai-query">"Show top 5 origin states for selected district and gender split."</p>
                                <p className="hero-ai-result">Returns ranked numbers, SQL-backed preview, and follow-up prompts.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="home-stats">
                    <article className="home-stat-card home-surface">
                        <strong>36</strong>
                        <span>States / UTs Covered</span>
                        <p>National geography baseline for corridor analysis.</p>
                    </article>
                    <article className="home-stat-card home-surface">
                        <strong>13</strong>
                        <span>Integrated Data Tables</span>
                        <p>Structured cross-table indicators for deeper interpretation.</p>
                    </article>
                    <article className="home-stat-card home-surface">
                        <strong>2011</strong>
                        <span>Census D-Series Base</span>
                        <p>Consistent reference frame for comparable exploration.</p>
                    </article>
                    <article className="home-stat-card home-surface">
                        <strong>State + District</strong>
                        <span>Dual Resolution Analytics</span>
                        <p>Macro and micro analysis in one workflow.</p>
                    </article>
                </section>

                <section className="home-section home-surface">
                    <div className="home-section-head">
                        <h2>Core Dashboard Capabilities</h2>
                        <p>Built for exploring cleaned Census migration tables through clear visual summaries.</p>
                    </div>
                    <div className="home-features-grid">
                        {FEATURE_CARDS.map((feature, index) => (
                            <article key={feature.title} className={`home-feature-card ${index === 0 ? 'is-emphasis' : ''}`}>
                                <div className="feature-icon-wrap">
                                    <i className={feature.icon} aria-hidden="true" />
                                </div>
                                <h3>{feature.title}</h3>
                                <p>{feature.detail}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="home-section home-guided home-surface">
                    <div className="home-section-head">
                        <h2>How To Use The Dashboard</h2>
                        <p>Three-step analytical workflow for first-time and repeat users.</p>
                    </div>

                    <div className="home-guided-layout">
                        <div className="home-step-list">
                            {DEMO_STEPS.map((step, index) => {
                                const active = index === activeStepIndex;
                                return (
                                    <button
                                        type="button"
                                        key={step.id}
                                        className={`home-step-item ${active ? 'active' : ''}`}
                                        onClick={() => setActiveStepIndex(index)}
                                    >
                                        <span>{step.label}</span>
                                        <strong>{step.title}</strong>
                                        <p>{step.description}</p>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="home-demo-board">
                            <div className="demo-toolbar">
                                <span>Dashboard Walkthrough</span>
                                <span className="demo-pill">{activeStep.label}</span>
                            </div>
                            <div className="demo-canvas">
                                <div className="demo-left">
                                    <div className={`demo-panel ${activeStep.id === 'select' ? 'on' : ''}`}>
                                        <h4>Selection Controls</h4>
                                        <p>State, district, flow mode, and threshold selection.</p>
                                    </div>
                                    <div className={`demo-panel ${activeStep.id === 'explore' ? 'on' : ''}`}>
                                        <h4>Analytical Charts</h4>
                                        <p>Distribution, comparisons, and demographic decomposition.</p>
                                    </div>
                                    <div className={`demo-panel ${activeStep.id === 'insight' ? 'on' : ''}`}>
                                        <h4>AI Query Panel</h4>
                                        <p>Natural-language query with SQL-backed outputs.</p>
                                    </div>
                                </div>
                                <div className="demo-right">
                                    <h3>{activeStep.title}</h3>
                                    <p>{activeStep.description}</p>
                                    <button
                                        type="button"
                                        className="home-btn home-btn-secondary home-btn-small"
                                        onClick={() =>
                                            onNavigate(activeStep.id === 'insight' ? 'ai' : activeStep.id === 'explore' ? 'district' : 'state')
                                        }
                                    >
                                        Open Related Page
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </section>

                <section className="home-section home-surface">
                    <div className="home-section-head">
                        <h2>Who This Is For</h2>
                    </div>
                    <div className="home-audience-grid">
                        <article className="home-audience-card">
                            <h3>Project Reviewers</h3>
                            <p>Understand the dataset, analysis flow, and major migration patterns in one place.</p>
                        </article>
                        <article className="home-audience-card">
                            <h3>Academic Researchers</h3>
                            <p>Use structured migration indicators to frame comparative analysis.</p>
                        </article>
                        <article className="home-audience-card">
                            <h3>Students and Analysts</h3>
                            <p>Learn data interpretation through guided dashboards and explanatory AI responses.</p>
                        </article>
                        <article className="home-audience-card">
                            <h3>Media and Public Communication</h3>
                            <p>Turn complex migration tables into clearer visual explanations.</p>
                        </article>
                    </div>
                </section>

                <section className="home-section home-trust home-surface">
                    <div className="home-section-head">
                        <h2>Data Integrity and Transparency</h2>
                    </div>
                    <ul>
                        <li>Primary source: Census of India 2011 migration D-series tables.</li>
                        <li>State and district datasets are cleaned and normalized for cross-table consistency.</li>
                        <li>AI answers are scoped to available tables and display sources/queries where applicable.</li>
                    </ul>
                </section>

                <section className="home-section home-faq-preview home-surface">
                    <div className="home-section-head">
                        <h2>Frequent Questions</h2>
                    </div>
                    <div className="home-faq-accordion">
                        {FAQ_PREVIEW.map((item, index) => {
                            const expanded = openFaqIndex === index;
                            return (
                                <article key={item.question} className={`faq-accordion-item ${expanded ? 'expanded' : ''}`}>
                                    <button
                                        type="button"
                                        className="faq-accordion-trigger"
                                        onClick={() => setOpenFaqIndex(expanded ? -1 : index)}
                                        aria-expanded={expanded}
                                    >
                                        <span>{item.question}</span>
                                        <i className={`pi ${expanded ? 'pi-minus' : 'pi-plus'}`} aria-hidden="true" />
                                    </button>
                                    {expanded ? <p className="faq-accordion-body">{item.answer}</p> : null}
                                </article>
                            );
                        })}
                    </div>
                    <button type="button" className="home-btn home-btn-tertiary" onClick={() => onNavigate('faq')}>
                        View Full FAQ
                    </button>
                </section>
            </div>
        </div>
    );
}
