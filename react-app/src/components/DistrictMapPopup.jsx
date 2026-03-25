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
    }, [shouldRender]);

    if (!shouldRender) return null;

    return (
        <div className={`state-map-popup district-map-popup ${visible ? 'state-map-popup--visible' : ''}`}>
            <div className="smp-inner">
                <div className={`smp-card ${expanded ? 'smp-card--expanded' : ''}`}>
                    <p className="smp-label">{selectedDistrict}</p>
                    <p className="dmp-sublabel">{selectedState}</p>
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
                                key={src}
                                src={src}
                                alt={`Map of ${selectedDistrict}`}
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
            </div>
        </div>
    );
}
