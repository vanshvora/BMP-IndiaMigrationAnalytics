import { useState, useEffect } from 'react';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import DataSection from './components/DataSection';
import ComparisonDashboard from './components/ComparisonDashboard';
import { normalizeName, INDIAN_STATES_NORM } from './utils/coordinates';
import './App.css';

const DATA_URL = '/D01_cleaned.csv';

// cleaning and processing the csv data
function processData(rawData) {
  const csvData = [];

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];

    // get the destination and origin state names
    const destRaw = row['AreaName'] || row['Area Name'] || '';
    const originRaw = row['BirthPlace'] || row['Birth place'] || '';

    const dest = normalizeName(destRaw);
    const origin = normalizeName(originRaw);

    // get the migration numbers
    const count = Number(row['Total_Persons'] || row['Total'] || 0) || 0;
    const male = Number(row['Total_Males'] || row['Male'] || 0) || 0;
    const female = Number(row['Total_Females'] || row['Female'] || 0) || 0;

    // for rural/urban we sometimes need to add males+females
    let rural = Number(row['Rural_Persons'] || row['Rural_Total'] || 0) || 0;
    if (rural === 0) {
      rural = (Number(row['Rural_Males'] || 0) || 0) + (Number(row['Rural_Females'] || 0) || 0);
    }

    let urban = Number(row['Urban_Persons'] || row['Urban_Total'] || 0) || 0;
    if (urban === 0) {
      urban = (Number(row['Urban_Males'] || 0) || 0) + (Number(row['Urban_Females'] || 0) || 0);
    }

    // skip if no migration count or if origin == destination
    if (count <= 0) continue;
    if (origin === dest) continue;

    // only keep domestic flows (both should be indian states)
    if (!INDIAN_STATES_NORM.includes(origin)) continue;
    if (!INDIAN_STATES_NORM.includes(dest)) continue;

    csvData.push({ origin, destination: dest, count, male, female, rural, urban });
  }

  console.log(`Loaded ${csvData.length} migration records`);
  return csvData;
}

function App() {
  const [flows, setFlows] = useState([]);
  const [flowType, setFlowType] = useState('inflow');
  const [selectedState, setSelectedState] = useState(null);
  const [threshold, setThreshold] = useState(1000);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mapAction, setMapAction] = useState(null);
  const [topFlowLimit, setTopFlowLimit] = useState('10');
  const [highlightTopCorridors, setHighlightTopCorridors] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [stateA, setStateA] = useState(null);
  const [stateB, setStateB] = useState(null);

  // load the csv file when page loads
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch(DATA_URL);
        const csvText = await response.text();

        // using papaparse to read csv
        const Papa = await import('papaparse');
        Papa.default.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const processed = processData(results.data);
            setFlows(processed);
            setLoading(false);
          }
        });
      } catch (err) {
        console.error('Error loading data:', err);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // when a state is clicked, scroll down to the data section
  const handleCompareStateSelect = (state, slot) => {
    const nextState = state || null;

    if (slot === 'A') {
      if (!nextState) {
        if (stateB) {
          setStateA(stateB);
          setStateB(null);
          return;
        }
        setStateA(null);
        return;
      }
      setStateA(nextState);
      if (nextState === stateB) setStateB(null);
      return;
    }

    if (slot === 'B') {
      if (!nextState || nextState === stateA) {
        setStateB(null);
        return;
      }
      setStateB(nextState);
      return;
    }

    if (!nextState) return;

    if (!stateA) {
      setStateA(nextState);
      return;
    }

    if (stateA === nextState) return;

    if (!stateB) {
      setStateB(nextState);
      return;
    }

    if (stateB === nextState) return;
    setStateB(nextState);
  };

  const handleStateClick = (state) => {
    if (compareMode) {
      handleCompareStateSelect(state);
    } else {
      setSelectedState(state);
    }
    setTimeout(() => {
      document.getElementById('data-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleClearSelection = () => {
    if (compareMode) {
      setStateA(null);
      setStateB(null);
      return;
    }
    setSelectedState(null);
  };

  const handleMapAction = (type) => {
    setMapAction({ type, timestamp: Date.now() });
  };

  const handleToggleCompareMode = () => {
    if (!compareMode) {
      setCompareMode(true);
      if (selectedState && !stateA) setStateA(selectedState);
      return;
    }

    setCompareMode(false);
    setSelectedState(stateA || stateB || selectedState || null);
  };

  // loading screen
  if (loading) {
    return (
      <div className="loading">
        <div className="loading-box">
          <div className="spinner" />
          <p className="loading-msg">Loading migration data...</p>
        </div>
      </div>
    );
  }

  // change color based on inflow/outflow
  const accent = flowType === 'inflow' ? '#3b82f6' : 'rgba(249, 115, 22, 0.78)';
  const activeSelectedState = compareMode ? (stateA || stateB || null) : selectedState;
  const showComparisonDashboard = compareMode && Boolean(stateA) && Boolean(stateB);

  return (
    <div className="app" style={{ '--flow-accent': accent }}>
      {/* Top navigation bar */}
      <header className="navbar">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="hamburger"
        >
          <svg className="hamburger-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="logo">India Migration Analytics</h1>
        <span className="badge">Census 2011 D-Series</span>

        {menuOpen && (
          <div className="dropdown">
            <h3 className="dropdown-title">Navigation</h3>
            <p className="dropdown-text">No other pages available yet.</p>
            <button
              onClick={() => setMenuOpen(false)}
              className="close-btn"
            >
              Close Menu
            </button>
          </div>
        )}
      </header>

      <div className="content">
        {/* Map with sidebar */}
        <div className="map-section">
          <aside
            className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}
          >
            {sidebarOpen ? (
              <div className="scroll-area">
                <Sidebar
                  flows={flows}
                  flowType={flowType}
                  setFlowType={setFlowType}
                  selectedState={activeSelectedState}
                  threshold={threshold}
                  setThreshold={setThreshold}
                  onCollapse={() => setSidebarOpen(false)}
                  onClearSelection={handleClearSelection}
                  onMapAction={handleMapAction}
                  topFlowLimit={topFlowLimit}
                  setTopFlowLimit={setTopFlowLimit}
                  highlightTopCorridors={highlightTopCorridors}
                  setHighlightTopCorridors={setHighlightTopCorridors}
                  compareMode={compareMode}
                  onToggleCompareMode={handleToggleCompareMode}
                  stateA={stateA}
                  stateB={stateB}
                  onCompareStateSelect={handleCompareStateSelect}
                />
              </div>
            ) : (
              <button
                onClick={() => setSidebarOpen(true)}
                className="expand-btn"
                title="Expand sidebar"
              >
                <span className="chevron">{">>"}</span>
              </button>
            )}
          </aside>

          <main className="map-area">
            <MapView
              flows={flows}
              flowType={flowType}
              selectedState={activeSelectedState}
              onStateClick={handleStateClick}
              threshold={threshold}
              mapAction={mapAction}
              topFlowLimit={topFlowLimit}
              highlightTopCorridors={highlightTopCorridors}
              compareMode={compareMode}
              stateA={stateA}
              stateB={stateB}
            />
          </main>
        </div>

        {/* Data analytics section below the map */}
        <div id="data-section" className="data-area">
          {showComparisonDashboard ? (
            <ComparisonDashboard
              flows={flows}
              flowType={flowType}
              threshold={threshold}
              stateA={stateA}
              stateB={stateB}
            />
          ) : (
            <DataSection
              flows={flows}
              flowType={flowType}
              selectedState={activeSelectedState}
              threshold={threshold}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

