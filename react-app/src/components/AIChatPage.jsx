import { useEffect, useMemo, useRef, useState } from 'react';
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

function formatColumnLabel(key) {
    return String(key)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatCellValue(value, key) {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'number') {
        if (/percentage|percent|share/i.test(key)) return `${value.toFixed(2)}%`;
        if (Math.abs(value) >= 1000) return value.toLocaleString('en-IN');
        return Number.isInteger(value) ? String(value) : value.toFixed(2);
    }
    return String(value);
}

export default function AIChatPage() {
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
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
    const [requestError, setRequestError] = useState('');
    const messagesEndRef = useRef(null);

    const quickQuestions = useMemo(() => {
        if (selectedDistrict) {
            return [
                `Show the top migration reasons for ${selectedDistrict}.`,
                `Show the top 5 origin regions for ${selectedDistrict}.`,
                `Give male vs female share in percentage terms.`,
                `Show the rural vs urban split for ${selectedDistrict}.`,
                `Summarize one key insight for ${selectedDistrict}.`,
            ];
        }

        if (selectedState) {
            return [
                `Show the top 5 districts in ${selectedState} by total migrants.`,
                `Compare ${selectedState} with national average.`,
                `Give male vs female share in percentage terms.`,
                `Show the rural vs urban split for ${selectedState}.`,
                `What are the most important migration insights for ${selectedState}?`,
            ];
        }

        return [
            'Which states have the highest in-migration corridors?',
            'Show the top 5 origin states by total migrants.',
            'Give male vs female share in percentage terms.',
            'What is the national rural vs urban migration split?',
            'Which states have the highest out-migration corridors?',
        ];
    }, [selectedDistrict, selectedState]);

    useEffect(() => {
        fetch(`${API_BASE}/api/context/options`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                console.log('Context loaded:', data?.states?.length, 'states');
                setStates(Array.isArray(data?.states) ? data.states : []);
                setDistrictsByState(data?.districtsByState || {});
            })
            .catch((error) => {
                console.error('Failed to load context:', error);
                setStates([]);
                setDistrictsByState({});
            });
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

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages, loading]);

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
                    <h2 className="ai-card-title">Quick Questions</h2>
                    <div className="ai-quick-list">
                        {quickQuestions.map((prompt) => (
                            <button
                                key={prompt}
                                type="button"
                                className="ai-quick-btn"
                                onClick={() => sendMessage(prompt)}
                                disabled={loading}
                            >
                                {prompt}
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

                            {message.role === 'assistant' && Array.isArray(message.meta?.dataPreview) && message.meta.dataPreview.length >= 4 ? (
                                <div className="ai-result-table-wrap">
                                    <table className="ai-result-table">
                                        <thead>
                                            <tr>
                                                {Object.keys(message.meta.dataPreview[0]).map((key) => (
                                                    <th key={`${message.id}-head-${key}`}>{formatColumnLabel(key)}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {message.meta.dataPreview.map((row, rowIndex) => (
                                                <tr key={`${message.id}-row-${rowIndex}`}>
                                                    {Object.entries(row).map(([key, value]) => (
                                                        <td key={`${message.id}-cell-${rowIndex}-${key}`}>
                                                            {formatCellValue(value, key)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : null}
                        </article>
                    ))}
                    <div ref={messagesEndRef} />
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
