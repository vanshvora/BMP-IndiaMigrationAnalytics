import { useEffect, useState } from 'react';
import './StateMapPopup.css';
import './DistrictMapPopup.css';
import { getDistrictMapCandidates } from '../utils/mapFilenames';

export default function DistrictMapPopup({ selectedState, selectedDistrict }) {
    const [status, setStatus] = useState('loading');
    const [visible, setVisible] = useState(false);
    const [candidateIndex, setCandidateIndex] = useState(0);
    const [expanded, setExpanded] = useState(false);

    const shouldRender = Boolean(selectedState) && Boolean(selectedDistrict);
    const candidates = shouldRender ? getDistrictMapCandidates(selectedState, selectedDistrict) : [];
    const src = candidates[candidateIndex] || null;

    useEffect(() => {
        setStatus('loading');
        setCandidateIndex(0);
        setExpanded(false);
    }, [selectedState, selectedDistrict]);

    function handleError() {
        if (candidateIndex < candidates.length - 1) {
            setCandidateIndex(candidateIndex + 1);
            setStatus('loading');
            return;
        }

        setStatus('error');
    }

    useEffect(() => {
        if (shouldRender) {
            const t = setTimeout(() => setVisible(true), 20);
            return () => clearTimeout(t);
        }

        setVisible(false);
        setExpanded(false);
    }, [shouldRender]);

    if (!shouldRender) return null;

    const canExpand = Boolean(src) && status === 'ready';

    return (
        <div className={`state-map-popup district-map-popup ${visible ? 'state-map-popup--visible' : ''} ${expanded ? 'state-map-popup--expanded' : ''}`}>
            <div className="smp-inner">
                <div className="smp-card">
                    <p className="smp-label">{selectedDistrict}</p>
                    <p className="dmp-sublabel">{selectedState}</p>
                    <button
                        type="button"
                        className={`smp-img-wrap smp-img-button ${canExpand ? 'smp-img-button--interactive' : ''}`}
                        onClick={() => {
                            if (canExpand) setExpanded(true);
                        }}
                        disabled={!canExpand}
                        aria-label={`Expand map of ${selectedDistrict}`}
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
                                key={src}
                                src={src}
                                alt={`Map of ${selectedDistrict}`}
                                className={`smp-img ${status === 'ready' ? 'smp-img--visible' : ''}`}
                                onLoad={() => setStatus('ready')}
                                onError={handleError}
                            />
                        )}
                    </button>
                </div>
            </div>

            {expanded ? (
                <div
                    className="smp-expanded-overlay"
                    onClick={() => setExpanded(false)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                        if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
                            setExpanded(false);
                        }
                    }}
                    aria-label={`Close expanded map of ${selectedDistrict}`}
                >
                    <div className="smp-expanded-panel" onClick={(event) => event.stopPropagation()}>
                        <button
                            type="button"
                            className="smp-close-btn"
                            onClick={() => setExpanded(false)}
                            aria-label={`Close expanded map of ${selectedDistrict}`}
                        >
                            <i className="pi pi-times" aria-hidden="true" />
                        </button>
                        <p className="smp-label">{selectedDistrict}</p>
                        <p className="dmp-sublabel">{selectedState}</p>
                        <div className="smp-expanded-image-wrap">
                            <img src={src} alt={`Map of ${selectedDistrict}`} className="smp-expanded-img" />
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
