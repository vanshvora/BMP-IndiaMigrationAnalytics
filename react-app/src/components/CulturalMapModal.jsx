import { useEffect, useMemo, useState } from 'react';
import './CulturalMapModal.css';
import { lockPageScroll } from './mapPopupScrollLock';
import { CULTURAL_CATEGORIES, getCulturalImageCandidates } from '../utils/culturalAssets';
import { getCulturalContentForState } from '../data/culturalContent';

function CulturalImage({ candidates, alt, className = '', onOpen }) {
    const [candidateIndex, setCandidateIndex] = useState(0);
    const [status, setStatus] = useState(candidates.length ? 'loading' : 'error');
    const src = candidates[candidateIndex] || null;
    const canOpen = Boolean(src) && status === 'ready' && typeof onOpen === 'function';

    function handleError() {
        if (candidateIndex < candidates.length - 1) {
            setCandidateIndex(candidateIndex + 1);
            setStatus('loading');
            return;
        }
        setStatus('error');
    }

    return (
        <button
            type="button"
            className={`cml-image-frame ${className} ${canOpen ? 'cml-image-frame--interactive' : ''}`}
            onClick={() => {
                if (canOpen) onOpen({ src, alt });
            }}
            disabled={!canOpen}
            aria-label={`Open ${alt}`}
        >
            {status !== 'ready' ? (
                <div className="cml-image-placeholder">
                    {status === 'loading' ? <span className="cml-spinner" /> : <span>Photo unavailable</span>}
                </div>
            ) : null}
            {src ? (
                <img
                    src={src}
                    alt={alt}
                    className={`cml-image ${status === 'ready' ? 'cml-image--visible' : ''}`}
                    onLoad={() => setStatus('ready')}
                    onError={handleError}
                />
            ) : null}
        </button>
    );
}

function CulturalSection({ category, categoryContent, stateDisplayName, candidates, reverse, onOpenLightbox }) {
    return (
        <section className={`cml-section cml-section--${category.id}`}>
            <div className={`cml-section-grid ${reverse ? 'cml-section-grid--reverse' : ''}`}>
                <CulturalImage
                    key={`${stateDisplayName}-${category.id}`}
                    candidates={candidates}
                    alt={`${stateDisplayName} ${category.title.toLowerCase()}`}
                    className={`cml-visual cml-visual--${category.id}`}
                    onOpen={onOpenLightbox}
                />

                <div className="cml-content-column">
                    <article className="cml-copy-card">
                        <p className="cml-section-kicker">{category.title}</p>
                        <h3 className="cml-section-title">{categoryContent.title}</h3>
                        <p className="cml-section-text">{categoryContent.description}</p>
                    </article>

                    {categoryContent.highlight ? (
                        <article className="cml-note-card">
                            <p className="cml-note-label">{categoryContent.highlightLabel}</p>
                            <p className="cml-note-text">{categoryContent.highlight}</p>
                        </article>
                    ) : null}
                </div>
            </div>
        </section>
    );
}

export default function CulturalMapModal({ isOpen, stateName, mapPreviewSrc, onClose }) {
    const [lightbox, setLightbox] = useState(null);

    const stateContent = useMemo(function buildCulturalContent() {
        return getCulturalContentForState(stateName);
    }, [stateName]);

    const stateDisplayName = stateContent.stateDisplayName || String(stateName || '').trim() || 'Selected State';

    const imagesByCategory = useMemo(function getImagesByCategory() {
        const imageIndex = {};
        for (let i = 0; i < CULTURAL_CATEGORIES.length; i++) {
            const category = CULTURAL_CATEGORIES[i];
            imageIndex[category.id] = getCulturalImageCandidates(
                stateName,
                category.id,
                stateContent.categories?.[category.id]?.image
            );
        }
        return imageIndex;
    }, [stateName, stateContent.categories]);

    useEffect(() => {
        if (!isOpen) return undefined;
        return lockPageScroll();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return undefined;

        function handleEscape(event) {
            if (event.key !== 'Escape') return;
            if (lightbox) {
                setLightbox(null);
                return;
            }
            onClose();
        }

        window.addEventListener('keydown', handleEscape);
        return function cleanupEscapeListener() {
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, lightbox, onClose]);

    useEffect(() => {
        if (!isOpen) return;
        setLightbox(null);
    }, [isOpen, stateName]);

    if (!isOpen || !stateName) return null;

    return (
        <div
            className="cml-overlay"
            onClick={onClose}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
                if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
                    onClose();
                }
            }}
            aria-label={`Close cultural map modal for ${stateDisplayName}`}
        >
            <div
                className="cml-panel"
                role="dialog"
                aria-modal="true"
                aria-label={`${stateDisplayName} cultural landscape`}
                onClick={(event) => event.stopPropagation()}
            >
                <button
                    type="button"
                    className="cml-close-btn"
                    onClick={onClose}
                    aria-label={`Close cultural map modal for ${stateDisplayName}`}
                >
                    <i className="pi pi-times" aria-hidden="true" />
                </button>

                <div className="cml-scroll-body">
                    <header className="cml-hero">
                        <p className="cml-eyebrow">{stateDisplayName}</p>
                        <h2 className="cml-title">Cultural Landscape</h2>
                        <p className="cml-intro">{stateContent.intro}</p>
                    </header>

                    <section className="cml-map-anchor">
                        <p className="cml-map-anchor-label">Geographic Context</p>
                        <div className="cml-map-anchor-card">
                            {mapPreviewSrc ? (
                                <div className="cml-map-anchor-frame">
                                    <img src={mapPreviewSrc} alt={`District map of ${stateDisplayName}`} />
                                </div>
                            ) : (
                                <div className="cml-map-anchor-empty">Map unavailable</div>
                            )}
                        </div>
                    </section>

                    <div className="cml-category-row" aria-label="Cultural dimensions">
                        {CULTURAL_CATEGORIES.map(function renderCategoryChip(category) {
                            return (
                                <span key={category.id} className="cml-chip">
                                    {category.title}
                                </span>
                            );
                        })}
                    </div>

                    {CULTURAL_CATEGORIES.map(function renderSection(category, index) {
                        return (
                            <CulturalSection
                                key={category.id}
                                category={category}
                                categoryContent={stateContent.categories[category.id]}
                                stateDisplayName={stateDisplayName}
                                candidates={imagesByCategory[category.id]}
                                reverse={index % 2 === 1}
                                onOpenLightbox={setLightbox}
                            />
                        );
                    })}
                </div>
            </div>

            {lightbox ? (
                <div
                    className="cml-lightbox"
                    onClick={() => setLightbox(null)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                        if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
                            setLightbox(null);
                        }
                    }}
                    aria-label={`Close image preview for ${stateDisplayName}`}
                >
                    <div className="cml-lightbox-card" onClick={(event) => event.stopPropagation()}>
                        <button
                            type="button"
                            className="cml-lightbox-close"
                            onClick={() => setLightbox(null)}
                            aria-label="Close image preview"
                        >
                            <i className="pi pi-times" aria-hidden="true" />
                        </button>
                        <img src={lightbox.src} alt={lightbox.alt} className="cml-lightbox-image" />
                    </div>
                </div>
            ) : null}
        </div>
    );
}
