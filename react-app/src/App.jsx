import { useState, useEffect } from 'react';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import DataSection from './components/DataSection';
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
  const handleStateClick = (state) => {
    setSelectedState(state);
    setTimeout(() => {
      document.getElementById('data-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
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
                  selectedState={selectedState}
                  threshold={threshold}
                  setThreshold={setThreshold}
                  onCollapse={() => setSidebarOpen(false)}
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
              selectedState={selectedState}
              onStateClick={handleStateClick}
              threshold={threshold}
              onClearSelection={() => setSelectedState(null)}
            />
          </main>
        </div>

        {/* Data analytics section below the map */}
        <div id="data-section" className="data-area">
          <DataSection
            flows={flows}
            flowType={flowType}
            selectedState={selectedState}
            threshold={threshold}
          />
        </div>
      </div>
    </div>
  );
}

export default App;

