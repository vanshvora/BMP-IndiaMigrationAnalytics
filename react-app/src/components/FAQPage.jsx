import './InfoPages.css';

const FAQ_ITEMS = [
    {
        q: 'What does this portal help me analyze?',
        a: 'It helps analyze migration corridors across Indian states and districts, including composition by gender, reason, education, activity profile, and rural-urban distribution.',
    },
    {
        q: 'How should I use threshold filters?',
        a: 'Threshold values remove smaller corridors from active visuals. Lower thresholds provide broader coverage; higher thresholds emphasize high-volume corridors.',
    },
    {
        q: 'What is the difference between inflow and outflow?',
        a: 'Inflow views who moved into the selected geography. Outflow views where migrants from the selected geography moved to.',
    },
    {
        q: 'How is district analysis different from state analysis?',
        a: 'District pages allow finer corridor inspection and district-level socio-demographic decomposition, while state pages show macro movement structure.',
    },
    {
        q: 'Can I compare two states directly?',
        a: 'Yes. Use the Compare view in the Explore menu to evaluate two states with aligned metrics and shared visual references.',
    },
    {
        q: 'How reliable are AI chatbot outputs?',
        a: 'The assistant is designed to rely on backend table queries. You should still validate critical outputs by checking cited tables and data previews.',
    },
    {
        q: 'Why might two charts seem inconsistent?',
        a: 'Different tables represent different dimensions (e.g., reason vs activity). Also, threshold and context selections can alter included records.',
    },
    {
        q: 'Does this portal show causes of migration?',
        a: 'It shows reported distributions and associations. It is not a causal inference tool and should not be interpreted as proving causation.',
    },
    {
        q: 'Can I use this for policy reporting?',
        a: 'Yes for exploratory and descriptive reporting. For formal policy submissions, cite original source tables and mention methodological constraints.',
    },
    {
        q: 'What is the best workflow for first-time users?',
        a: 'Start with Home walkthrough, move to State Explorer, inspect District view for depth, then use AI Chat for targeted query refinement.',
    },
];

export default function FAQPage() {
    return (
        <div className="info-page">
            <div className="info-shell">
                <section className="info-hero">
                    <span className="info-pill">Support</span>
                    <h1>Frequently Asked Questions</h1>
                    <p>
                        This FAQ is designed for policy analysts, students, and researchers using the portal for
                        structured migration analysis.
                    </p>
                </section>

                <section className="info-card">
                    <h2 className="info-section-title">Common Queries</h2>
                    <p className="info-subtitle">Click any question to view details.</p>
                    <div style={{ marginTop: '12px', display: 'grid', gap: '10px' }}>
                        {FAQ_ITEMS.map((item) => (
                            <details key={item.q} className="faq-item">
                                <summary>{item.q}</summary>
                                <p>{item.a}</p>
                            </details>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

