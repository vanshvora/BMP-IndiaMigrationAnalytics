import { useEffect, useState } from 'react';
import StateDashboardPage from './components/StateDashboardPage';
import DistrictDashboardPage from './components/DistrictDashboardPage';
import './App.css';

const PAGES = {
    state: {
        id: 'state',
        label: 'State Flows',
        description: 'National state-to-state migration corridors',
    },
    district: {
        id: 'district',
        label: 'District Flows',
        description: 'Origin-state to district inflow corridors',
    },
};

function getPageFromHash() {
    const hash = window.location.hash.replace('#', '').trim().toLowerCase();
    return hash === 'district' ? 'district' : 'state';
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
        window.location.hash = pageId;
        setCurrentPage(pageId);
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
            <header className="navbar">
                <div className="navbar-brand">
                    <h1 className="logo">India Migration Analytics</h1>
                    <span className="badge">Census 2011 D-Series</span>
                </div>

                <nav className="navbar-tabs" aria-label="Dashboard pages">
                    {Object.values(PAGES).map(function (page) {
                        const isActive = currentPage === page.id;
                        return (
                            <button
                                key={page.id}
                                type="button"
                                className={`navbar-tab ${isActive ? 'is-active' : ''}`}
                                onClick={() => navigate(page.id)}
                                aria-current={isActive ? 'page' : undefined}
                                title={page.description}
                            >
                                {page.label}
                            </button>
                        );
                    })}
                </nav>
            </header>

            {currentPage === 'district' ? <DistrictDashboardPage /> : <StateDashboardPage />}

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
