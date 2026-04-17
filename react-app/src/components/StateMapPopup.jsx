import { useEffect, useState } from 'react';
import './StateMapPopup.css';
import { getStateMapCandidates } from '../utils/mapFilenames';
import CulturalMapModal from './CulturalMapModal';

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
                    if (canExpand) onExpand({ src, alt: `Map of ${stateName}`, label, stateName });
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
    const [activeCulturalState, setActiveCulturalState] = useState(null);

    const showSingle = !compareMode && Boolean(selectedState);
    const showCompare = compareMode && (Boolean(stateA) || Boolean(stateB));
    const shouldRender = showSingle || showCompare;

    useEffect(() => {
        if (shouldRender) {
            const t = setTimeout(() => setVisible(true), 20);
            return () => clearTimeout(t);
        }

        setVisible(false);
        setActiveCulturalState(null);
    }, [shouldRender]);

    useEffect(() => {
        setActiveCulturalState(null);
    }, [selectedState, compareMode, stateA, stateB]);

    if (!shouldRender) return null;

    return (
        <div className={`state-map-popup ${visible ? 'state-map-popup--visible' : ''} ${showCompare ? 'state-map-popup--compare' : ''} ${activeCulturalState ? 'state-map-popup--expanded' : ''}`}>
            <div className="smp-inner">
                {showSingle && <SingleMapCard stateName={selectedState} label={selectedState} onExpand={setActiveCulturalState} />}
                {showCompare && stateA && <SingleMapCard stateName={stateA} label={`A - ${stateA}`} onExpand={setActiveCulturalState} />}
                {showCompare && stateB && <SingleMapCard stateName={stateB} label={`B - ${stateB}`} onExpand={setActiveCulturalState} />}
            </div>

            <CulturalMapModal
                isOpen={Boolean(activeCulturalState)}
                stateName={activeCulturalState?.stateName}
                mapPreviewSrc={activeCulturalState?.src}
                onClose={() => setActiveCulturalState(null)}
            />
        </div>
    );
}
