import { useEffect, useState } from 'react';
import './StateMapPopup.css';
import { getStateMapCandidates } from '../utils/mapFilenames';

function SingleMapCard({ stateName, label }) {
    const [status, setStatus] = useState('loading');
    const [candidateIndex, setCandidateIndex] = useState(0);
    const [expanded, setExpanded] = useState(false);
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

    return (
        <div className={`smp-card ${expanded ? 'smp-card--expanded' : ''}`}>
            <p className="smp-label">{label || stateName}</p>
            <div className="smp-img-wrap">
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
            </div>
          <button
                className="smp-expand-btn"
                onClick={() => setExpanded(!expanded)}
                >
                <i className={`pi ${expanded ? 'pi-arrow-up-right' : 'pi-arrow-down-left'}`} />
        </button>
        </div>
    );
}

export default function StateMapPopup({ selectedState, compareMode, stateA, stateB }) {
    const [visible, setVisible] = useState(false);

    const showSingle = !compareMode && Boolean(selectedState);
    const showCompare = compareMode && (Boolean(stateA) || Boolean(stateB));
    const shouldRender = showSingle || showCompare;

    useEffect(() => {
        if (shouldRender) {
            const t = setTimeout(() => setVisible(true), 20);
            return () => clearTimeout(t);
        }

        setVisible(false);
    }, [shouldRender]);

    if (!shouldRender) return null;

    return (
        <div className={`state-map-popup ${visible ? 'state-map-popup--visible' : ''} ${showCompare ? 'state-map-popup--compare' : ''}`}>
            <div className="smp-inner">
                {showSingle && <SingleMapCard stateName={selectedState} label={selectedState} />}
                {showCompare && stateA && <SingleMapCard stateName={stateA} label={`A - ${stateA}`} />}
                {showCompare && stateB && <SingleMapCard stateName={stateB} label={`B - ${stateB}`} />}
            </div>
        </div>
    );
}
