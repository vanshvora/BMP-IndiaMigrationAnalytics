import { useEffect, useRef, useState } from 'react';
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
    const [requestError, setRequestError] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages, loading]);

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
                    context: { page: 'ai' },
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
        <div className="ai-page ai-page-full">
            <section className="ai-chat-panel">
                <div className="ai-chat-head">
                    <h1>AI Migration Chat</h1>
                    <p>Ask about migration corridors, gender splits, district insights, and more.</p>
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

                    {loading && (
                        <article className="ai-message ai-message-assistant">
                            <div className="ai-message-role">AI</div>
                            <div className="ai-typing-indicator">
                                <span />
                                <span />
                                <span />
                            </div>
                        </article>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                <div className="ai-composer">
                    <textarea
                        className="ai-textarea"
                        value={inputValue}
                        onChange={(event) => setInputValue(event.target.value)}
                        placeholder="Ask about top corridors, gender splits, district insights, or migration reasons..."
                        rows={3}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' && !event.shiftKey) {
                                event.preventDefault();
                                sendMessage(inputValue);
                            }
                        }}
                    />
                    {loading ? (
                        <button
                            type="button"
                            className="ai-stop-btn"
                            title="Stop generating"
                        >
                            <span className="ai-stop-icon" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="ai-send-btn"
                            onClick={() => sendMessage(inputValue)}
                            disabled={!inputValue.trim()}
                        >
                            Send
                        </button>
                    )}
                </div>

                {requestError ? <p className="ai-error-text">{requestError}</p> : null}
            </section>
        </div>
    );
}
