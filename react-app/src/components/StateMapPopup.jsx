import { useEffect, useState } from 'react';
import './StateMapPopup.css';
import { getStateMapCandidates } from '../utils/mapFilenames';

function SingleMapCard({ stateName, label, onExpand }) {
    const [status, setStatus] = useState('loading');
    const [candidateIndex, setCandidateIndex] = useState(0);
    const candidates = getStateMapCandidates(stateName);
    const src = candidates[candidateIndex] || null;

    useEffect(() => {
        setStatus('loading');
        setCandidateIndex(0);
    }, [stateName]);

    function handleError() {
        if (candidateIndex < candidates.length - 1) {
            setCandidateIndex(candidateIndex + 1);
            setStatus('loading');
            return;
        }

        setStatus('error');
    }

    const canExpand = Boolean(src) && status === 'ready';

    return (
        <div className="smp-card">
            <p className="smp-label">{label || stateName}</p>
            <button
                type="button"
                className={`smp-img-wrap smp-img-button ${canExpand ? 'smp-img-button--interactive' : ''}`}
                onClick={() => {
                    if (canExpand) onExpand({ src, alt: `Map of ${stateName}`, label });
                }}
                disabled={!canExpand}
                aria-label={`Expand map of ${stateName}`}
            >
                {status === 'loading' && (
                    <div className="smp-placeholder">
                        <span className="smp-spinner" />
                    </div>
                )}
                {status === 'error' && (
                    <div className="smp-placeholder smp-error">
                        <span className="smp-error-text">No map</span>
                    </div>
                )}
                {src && (
                    <img
                        src={src}
                        alt={`Map of ${stateName}`}
                        className={`smp-img ${status === 'ready' ? 'smp-img--visible' : ''}`}
                        onLoad={() => setStatus('ready')}
                        onError={handleError}
                    />
                )}
            </button>
        </div>
    );
}

export default function StateMapPopup({ selectedState, compareMode, stateA, stateB }) {
    const [visible, setVisible] = useState(false);
    const [expandedMap, setExpandedMap] = useState(null);

    const showSingle = !compareMode && Boolean(selectedState);
    const showCompare = compareMode && (Boolean(stateA) || Boolean(stateB));
    const shouldRender = showSingle || showCompare;

    useEffect(() => {
        if (shouldRender) {
            const t = setTimeout(() => setVisible(true), 20);
            return () => clearTimeout(t);
        }

        setVisible(false);
        setExpandedMap(null);
    }, [shouldRender]);

    useEffect(() => {
        setExpandedMap(null);
    }, [selectedState, compareMode, stateA, stateB]);

    if (!shouldRender) return null;

    return (
        <div className={`state-map-popup ${visible ? 'state-map-popup--visible' : ''} ${showCompare ? 'state-map-popup--compare' : ''} ${expandedMap ? 'state-map-popup--expanded' : ''}`}>
            <div className="smp-inner">
                {showSingle && <SingleMapCard stateName={selectedState} label={selectedState} onExpand={setExpandedMap} />}
                {showCompare && stateA && <SingleMapCard stateName={stateA} label={`A - ${stateA}`} onExpand={setExpandedMap} />}
                {showCompare && stateB && <SingleMapCard stateName={stateB} label={`B - ${stateB}`} onExpand={setExpandedMap} />}
            </div>

            {expandedMap ? (
                <div
                    className="smp-expanded-overlay"
                    onClick={() => setExpandedMap(null)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                        if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
                            setExpandedMap(null);
                        }
                    }}
                    aria-label={`Close expanded map of ${expandedMap.label}`}
                >
                    <div className="smp-expanded-panel" onClick={(event) => event.stopPropagation()}>
                        <button
                            type="button"
                            className="smp-close-btn"
                            onClick={() => setExpandedMap(null)}
                            aria-label={`Close expanded map of ${expandedMap.label}`}
                        >
                            <i className="pi pi-times" aria-hidden="true" />
                        </button>
                        <p className="smp-label">{expandedMap.label}</p>
                        <div className="smp-expanded-image-wrap">
                            <img src={expandedMap.src} alt={expandedMap.alt} className="smp-expanded-img" />
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
