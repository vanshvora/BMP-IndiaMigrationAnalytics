import { useEffect, useMemo, useState } from 'react';
import './AIChatPage.css';

const API_BASE = import.meta.env.VITE_AI_API_BASE_URL || 'http://127.0.0.1:8000';

function makeMessage(role, content, meta) {
    return {
        id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        role,
        content,
        meta: meta || null,
    };
}

export default function AIChatPage() {
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [faqItems, setFaqItems] = useState([]);
    const [messages, setMessages] = useState([
        makeMessage(
            'assistant',
            'Ask me anything about state-wise or district-wise migration data. I can return exact numbers and explain insights.'
        ),
    ]);
    const [states, setStates] = useState([]);
    const [districtsByState, setDistrictsByState] = useState({});
    const [selectedState, setSelectedState] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [threshold, setThreshold] = useState('');
    const [backendHealth, setBackendHealth] = useState(null);
    const [requestError, setRequestError] = useState('');

    useEffect(() => {
        fetch(`${API_BASE}/api/faq`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setFaqItems(data);
            })
            .catch(() => {
                setFaqItems([]);
            });

        fetch(`${API_BASE}/api/context/options`)
            .then((res) => res.json())
            .then((data) => {
                setStates(Array.isArray(data?.states) ? data.states : []);
                setDistrictsByState(data?.districtsByState || {});
            })
            .catch(() => {
                setStates([]);
                setDistrictsByState({});
            });

        fetch(`${API_BASE}/api/health`)
            .then((res) => res.json())
            .then((data) => setBackendHealth(data))
            .catch(() => setBackendHealth(null));
    }, []);

    const districtOptions = useMemo(() => {
        if (!selectedState) return [];
        return districtsByState[selectedState] || [];
    }, [districtsByState, selectedState]);

    useEffect(() => {
        if (!selectedDistrict) return;
        if (districtOptions.includes(selectedDistrict)) return;
        setSelectedDistrict('');
    }, [districtOptions, selectedDistrict]);

    function buildContext() {
        return {
            page: 'ai',
            selected_state: selectedState || null,
            selected_district: selectedDistrict || null,
            threshold: threshold ? Number(threshold) || null : null,
        };
    }

    async function sendMessage(rawMessage) {
        const message = String(rawMessage || '').trim();
        if (!message || loading) return;

        setRequestError('');
        const userMessage = makeMessage('user', message);
        const history = messages.map((item) => ({ role: item.role, content: item.content }));

        setMessages((prev) => [...prev, userMessage]);
        setInputValue('');
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    context: buildContext(),
                    history,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Request failed with status ${response.status}`);
            }

            const data = await response.json();
            const assistant = makeMessage('assistant', data.answer || 'No response text returned.', {
                route: data.route || null,
                sql: data.sql || null,
                citations: Array.isArray(data.citations) ? data.citations : [],
                dataPreview: Array.isArray(data.data_preview) ? data.data_preview : [],
                followUps: Array.isArray(data.follow_ups) ? data.follow_ups : [],
                error: data.error || null,
            });
            setMessages((prev) => [...prev, assistant]);
        } catch (error) {
            setRequestError('Failed to reach AI backend. Check backend is running and API key is configured.');
            setMessages((prev) => [
                ...prev,
                makeMessage(
                    'assistant',
                    'I could not process that request because backend connectivity failed. Please verify backend setup.',
                    { error: String(error) }
                ),
            ]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="ai-page">
            <aside className="ai-side-panel">
                <section className="ai-card">
                    <h2 className="ai-card-title">Backend Status</h2>
                    {backendHealth ? (
                        <ul className="ai-health-list">
                            <li>DB: {backendHealth.db_ready ? 'Ready' : 'Not Ready'}</li>
                            <li>LLM: {backendHealth.llm_ready ? `Ready (${backendHealth.llm_provider})` : 'Not Ready'}</li>
                            {backendHealth.llm_error ? <li className="ai-error-text">LLM Error: {backendHealth.llm_error}</li> : null}
                        </ul>
                    ) : (
                        <p className="ai-muted">Backend health unavailable.</p>
                    )}
                </section>

                <section className="ai-card">
                    <h2 className="ai-card-title">Context</h2>
                    <label className="ai-label">State</label>
                    <select
                        className="ai-input"
                        value={selectedState}
                        onChange={(event) => {
                            setSelectedState(event.target.value);
                            setSelectedDistrict('');
                        }}
                    >
                        <option value="">None</option>
                        {states.map((stateName) => (
                            <option key={stateName} value={stateName}>
                                {stateName}
                            </option>
                        ))}
                    </select>

                    <label className="ai-label">District</label>
                    <select
                        className="ai-input"
                        value={selectedDistrict}
                        onChange={(event) => setSelectedDistrict(event.target.value)}
                        disabled={!selectedState}
                    >
                        <option value="">None</option>
                        {districtOptions.map((districtName) => (
                            <option key={districtName} value={districtName}>
                                {districtName}
                            </option>
                        ))}
                    </select>

                    <label className="ai-label">Threshold (optional)</label>
                    <input
                        className="ai-input"
                        type="number"
                        value={threshold}
                        placeholder="e.g. 1000"
                        onChange={(event) => setThreshold(event.target.value)}
                    />
                </section>

                <section className="ai-card">
                    <h2 className="ai-card-title">FAQs</h2>
                    <div className="ai-faq-list">
                        {faqItems.map((item) => (
                            <button
                                key={item.question}
                                type="button"
                                className="ai-faq-item"
                                onClick={() => sendMessage(item.question)}
                                disabled={loading}
                            >
                                {item.question}
                            </button>
                        ))}
                    </div>
                </section>
            </aside>

            <section className="ai-chat-panel">
                <div className="ai-chat-head">
                    <h1>AI Migration Chat</h1>
                    <p>Full-page assistant for data Q&A, insights, and FAQ support.</p>
                </div>

                <div className="ai-messages">
                    {messages.map((message) => (
                        <article key={message.id} className={`ai-message ai-message-${message.role}`}>
                            <div className="ai-message-role">{message.role === 'assistant' ? 'AI' : 'You'}</div>
                            <p className="ai-message-content">{message.content}</p>

                            {message.meta?.error ? (
                                <p className="ai-inline-error">Details: {message.meta.error}</p>
                            ) : null}

                            {message.meta?.sql ? (
                                <details className="ai-details">
                                    <summary>SQL used</summary>
                                    <pre>{message.meta.sql}</pre>
                                </details>
                            ) : null}

                            {Array.isArray(message.meta?.citations) && message.meta.citations.length > 0 ? (
                                <div className="ai-citations">
                                    {message.meta.citations.map((citation, index) => (
                                        <span key={`${citation.label}-${index}`} className="ai-citation-pill">
                                            {citation.label}
                                            {citation.detail ? `: ${citation.detail}` : ''}
                                        </span>
                                    ))}
                                </div>
                            ) : null}

                            {Array.isArray(message.meta?.dataPreview) && message.meta.dataPreview.length > 0 ? (
                                <details className="ai-details">
                                    <summary>Data preview ({message.meta.dataPreview.length} row(s))</summary>
                                    <pre>{JSON.stringify(message.meta.dataPreview, null, 2)}</pre>
                                </details>
                            ) : null}

                            {Array.isArray(message.meta?.followUps) && message.meta.followUps.length > 0 ? (
                                <div className="ai-follow-ups">
                                    {message.meta.followUps.map((question) => (
                                        <button
                                            key={question}
                                            type="button"
                                            className="ai-follow-up-btn"
                                            onClick={() => sendMessage(question)}
                                            disabled={loading}
                                        >
                                            {question}
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </article>
                    ))}
                </div>

                <div className="ai-composer">
                    <textarea
                        className="ai-textarea"
                        value={inputValue}
                        onChange={(event) => setInputValue(event.target.value)}
                        placeholder="Ask for top corridors, gender splits, district insights, or data interpretation."
                        rows={3}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' && !event.shiftKey) {
                                event.preventDefault();
                                sendMessage(inputValue);
                            }
                        }}
                    />
                    <button
                        type="button"
                        className="ai-send-btn"
                        onClick={() => sendMessage(inputValue)}
                        disabled={loading || !inputValue.trim()}
                    >
                        {loading ? 'Sending...' : 'Send'}
                    </button>
                </div>

                {requestError ? <p className="ai-error-text">{requestError}</p> : null}
            </section>
        </div>
    );
}
