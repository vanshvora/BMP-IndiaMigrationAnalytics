import { useEffect, useState } from 'react';
import './StateMapPopup.css';
import './DistrictMapPopup.css';
import { getDistrictMapCandidates } from '../utils/mapFilenames';
import { lockPageScroll } from './mapPopupScrollLock';

function SingleDistrictMapCard({ selectedState, selectedDistrict, label, onExpand }) {
    const [status, setStatus] = useState('loading');
    const [candidateIndex, setCandidateIndex] = useState(0);

    const candidates = getDistrictMapCandidates(selectedState, selectedDistrict);
    const src = candidates[candidateIndex] || null;

    useEffect(() => {
        setStatus('loading');
        setCandidateIndex(0);
    }, [selectedState, selectedDistrict]);

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
            <p className="smp-label">{label || selectedDistrict}</p>
            <p className="dmp-sublabel">{selectedState}</p>
            <button
                type="button"
                className={`smp-img-wrap smp-img-button ${canExpand ? 'smp-img-button--interactive' : ''}`}
                onClick={() => {
                    if (canExpand) onExpand({ src, alt: `Map of ${selectedDistrict}`, label: label || selectedDistrict, selectedState });
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
    );
}

export default function DistrictMapPopup({ selectedState, selectedDistrict, compareMode = false, districtA = null, districtB = null }) {
    const [visible, setVisible] = useState(false);
    const [expandedMap, setExpandedMap] = useState(null);

    const showSingle = !compareMode && Boolean(selectedState) && Boolean(selectedDistrict);
    const showCompare = compareMode && (Boolean(districtA?.district) || Boolean(districtB?.district));
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
    }, [selectedState, selectedDistrict, compareMode, districtA, districtB]);

    useEffect(() => {
        if (!expandedMap) return undefined;
        return lockPageScroll();
    }, [expandedMap]);

    if (!shouldRender) return null;

    return (
        <div className={`state-map-popup district-map-popup ${visible ? 'state-map-popup--visible' : ''} ${showCompare ? 'state-map-popup--compare' : ''} ${expandedMap ? 'state-map-popup--expanded' : ''}`}>
            <div className="smp-inner">
                {showSingle ? (
                    <SingleDistrictMapCard
                        selectedState={selectedState}
                        selectedDistrict={selectedDistrict}
                        label={selectedDistrict}
                        onExpand={setExpandedMap}
                    />
                ) : null}
                {showCompare && districtA?.district ? (
                    <SingleDistrictMapCard
                        selectedState={districtA.state}
                        selectedDistrict={districtA.district}
                        label={`A - ${districtA.district}`}
                        onExpand={setExpandedMap}
                    />
                ) : null}
                {showCompare && districtB?.district ? (
                    <SingleDistrictMapCard
                        selectedState={districtB.state}
                        selectedDistrict={districtB.district}
                        label={`B - ${districtB.district}`}
                        onExpand={setExpandedMap}
                    />
                ) : null}
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
                        <p className="dmp-sublabel">{expandedMap.selectedState}</p>
                        <div className="smp-expanded-image-wrap">
                            <img src={expandedMap.src} alt={expandedMap.alt} className="smp-expanded-img" />
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
