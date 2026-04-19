import { useEffect, useState } from 'react';
import StateDashboardPage from './components/StateDashboardPage';
import DistrictDashboardPage from './components/DistrictDashboardPage';
import AIChatPage from './components/AIChatPage';
import HomePage from './components/HomePage';
import MethodologyPage from './components/MethodologyPage';
import FAQPage from './components/FAQPage';
import AboutPage from './components/AboutPage';
import './App.css';

const TOP_NAV_LINKS = [
    { id: 'home', label: 'Home', description: 'Project overview and guided onboarding' },
    { id: 'ai', label: 'AI Chat', description: 'Conversational migration insights assistant' },
    { id: 'methodology', label: 'Methodology', description: 'Data and analytical methods' },
    { id: 'faq', label: 'FAQ', description: 'Common project questions' },
    { id: 'about', label: 'About', description: 'About the migration analytics initiative' },
];

const EXPLORE_LINKS = [
    { id: 'state', label: 'State Explorer', description: 'State-level inflow and outflow corridors' },
    { id: 'district', label: 'District Explorer', description: 'District-level corridor analysis' },
    { id: 'compare', label: 'Compare States', description: 'Two-state comparative analytics view' },
    { id: 'compare-district', label: 'Compare Districts', description: 'Two-district comparative analytics view' },
];

const MAP_PAGES = new Set(['state', 'district', 'compare', 'compare-district']);

function getPageFromHash() {
    const hash = window.location.hash.replace('#', '').trim().toLowerCase();
    if (hash === 'state') return 'state';
    if (hash === 'district') return 'district';
    if (hash === 'compare') return 'compare';
    if (hash === 'compare-district') return 'compare-district';
    if (hash === 'ai') return 'ai';
    if (hash === 'methodology') return 'methodology';
    if (hash === 'faq') return 'faq';
    if (hash === 'about') return 'about';
    return 'home';
}

export default function App() {
    const [currentPage, setCurrentPage] = useState(getPageFromHash());
    const [jumpMode, setJumpMode] = useState('down');
    const [showJumpButton, setShowJumpButton] = useState(false);
    const [selectionActive, setSelectionActive] = useState(false);

    useEffect(() => {
        function handleHashChange() {
            setCurrentPage(getPageFromHash());
        }

        window.addEventListener('hashchange', handleHashChange);
        return function cleanup() {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, []);

    useEffect(() => {
        function handleSelectionActiveChange(event) {
            setSelectionActive(Boolean(event?.detail?.active));
        }

        window.addEventListener('selection-active-change', handleSelectionActiveChange);
        return function cleanupSelectionListener() {
            window.removeEventListener('selection-active-change', handleSelectionActiveChange);
        };
    }, []);

    useEffect(() => {
        function updateJumpButton() {
            if (!MAP_PAGES.has(currentPage)) {
                setShowJumpButton(false);
                return;
            }

            const mapSection = document.querySelector('.content .map-section');
            if (!mapSection || !selectionActive) {
                setShowJumpButton(false);
                return;
            }

            const mapRect = mapSection.getBoundingClientRect();
            const atTop = window.scrollY <= 16;
            const mapFullyOut = mapRect.bottom <= 0;

            if (atTop) {
                setShowJumpButton(true);
                setJumpMode('down');
                return;
            }

            if (mapFullyOut) {
                setShowJumpButton(true);
                setJumpMode('up');
                return;
            }

            setShowJumpButton(false);
        }

        updateJumpButton();
        window.addEventListener('scroll', updateJumpButton, { passive: true });
        window.addEventListener('resize', updateJumpButton);

        return function cleanupJumpButton() {
            window.removeEventListener('scroll', updateJumpButton);
            window.removeEventListener('resize', updateJumpButton);
        };
    }, [currentPage, selectionActive]);

    function navigate(pageId) {
        window.location.assign(`${window.location.pathname}${window.location.search}#${pageId}`);
        setCurrentPage(pageId);
        const openDropdowns = document.querySelectorAll('details.portal-dropdown[open]');
        for (let i = 0; i < openDropdowns.length; i++) {
            openDropdowns[i].removeAttribute('open');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function handleJumpButtonClick() {
        if (jumpMode === 'up') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        const dataSection = document.querySelector('.content .data-area');
        if (dataSection) {
            dataSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    return (
        <div className="app">
            <header className={`portal-navbar ${MAP_PAGES.has(currentPage) ? 'portal-navbar-explore' : ''}`}>
                <div className="portal-navbar-inner">
                    <div className="portal-brand">
                        <h1>India Migration Analytics</h1>
                        <span>Census Migration Data Dashboard</span>
                    </div>

                    <nav className="portal-links" aria-label="Portal navigation">
                        <button
                            key={TOP_NAV_LINKS[0].id}
                            type="button"
                            className={`portal-link ${currentPage === TOP_NAV_LINKS[0].id ? 'active' : ''}`}
                            onClick={() => navigate(TOP_NAV_LINKS[0].id)}
                            aria-current={currentPage === TOP_NAV_LINKS[0].id ? 'page' : undefined}
                            title={TOP_NAV_LINKS[0].description}
                        >
                            {TOP_NAV_LINKS[0].label}
                        </button>

                        <details className="portal-dropdown">
                            <summary className={`portal-link ${MAP_PAGES.has(currentPage) ? 'active' : ''}`}>Explore</summary>
                            <div className="portal-dropdown-menu">
                                {EXPLORE_LINKS.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        className={`portal-dropdown-item ${currentPage === item.id ? 'active' : ''}`}
                                        onClick={() => navigate(item.id)}
                                        title={item.description}
                                    >
                                        <strong>{item.label}</strong>
                                        <span>{item.description}</span>
                                    </button>
                                ))}
                            </div>
                        </details>

                        {TOP_NAV_LINKS.slice(1).map(function (page) {
                            const isActive = currentPage === page.id;
                            return (
                                <button
                                    key={page.id}
                                    type="button"
                                    className={`portal-link ${isActive ? 'active' : ''}`}
                                    onClick={() => navigate(page.id)}
                                    aria-current={isActive ? 'page' : undefined}
                                    title={page.description}
                                >
                                    {page.label}
                                </button>
                            );
                        })}
                    </nav>

                    {!MAP_PAGES.has(currentPage) ? (
                        <button type="button" className="portal-cta" onClick={() => navigate('state')}>
                            Start Exploring
                        </button>
                    ) : null}
                </div>
            </header>

            {currentPage === 'home' ? <HomePage onNavigate={navigate} /> : null}
            {currentPage === 'state' ? <StateDashboardPage /> : null}
            {currentPage === 'compare' ? <StateDashboardPage key="compare-view" initialCompareMode /> : null}
            {currentPage === 'district' ? <DistrictDashboardPage /> : null}
            {currentPage === 'compare-district' ? <DistrictDashboardPage key="district-compare-view" initialCompareMode /> : null}
            {currentPage === 'ai' ? <AIChatPage /> : null}
            {currentPage === 'methodology' ? <MethodologyPage /> : null}
            {currentPage === 'faq' ? <FAQPage /> : null}
            {currentPage === 'about' ? <AboutPage /> : null}

            {showJumpButton ? (
                <button
                    type="button"
                    className="jump-nav-btn"
                    onClick={handleJumpButtonClick}
                    aria-label={jumpMode === 'up' ? 'Scroll back to top' : 'Scroll down to data section'}
                    title={jumpMode === 'up' ? 'Back to top' : 'Jump to data'}
                >
                    <i className={`pi ${jumpMode === 'up' ? 'pi-arrow-up' : 'pi-arrow-down'}`} aria-hidden="true" />
                </button>
            ) : null}
        </div>
    );
}
