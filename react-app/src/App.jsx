import { useState, useEffect } from 'react';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import DataSection from './components/DataSection';
import { normalizeName, INDIAN_STATES_NORM } from './utils/coordinates';
import styles from './App.module.css';

const DATA_URL = '/Final_Cleaned_Data.csv';

// process the CSV data into the format we need
function processData(rawData) {
  const csvData = [];

  rawData.forEach(row => {
    const destRaw = row['Area Name'] || '';
    const originRaw = row['Birth place'] || '';

    const dest = normalizeName(destRaw);
    const origin = normalizeName(originRaw);
    const count = parseInt(row['Total'] || '0');
    const male = parseInt(row['Male'] || '0');
    const female = parseInt(row['Female'] || '0');
    const rural = parseInt(row['Rural_Total'] || '0');
    const urban = parseInt(row['Urban_Total'] || '0');

    // skip invalid rows
    if (isNaN(count) || count === 0) return;
    if (origin === dest) return;

    // only keep domestic flows (both origin and destination are indian states)
    const isDomesticOrigin = INDIAN_STATES_NORM.includes(origin);
    const isDomesticDest = INDIAN_STATES_NORM.includes(dest);
    if (!isDomesticOrigin || !isDomesticDest) return;

    csvData.push({ origin, destination: dest, count, male, female, rural, urban });
  });

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

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch(DATA_URL);
        const csvText = await response.text();
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

  const handleStateClick = (state) => {
    setSelectedState(state);
    setTimeout(() => {
      document.getElementById('data-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingInner}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Loading migration data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      {/* Navbar */}
      <header className={styles.navbar}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={styles.menuButton}
        >
          <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className={styles.brandTitle}>India Migration Analytics</h1>
        <span className={styles.brandSubtitle}>Census 2011 D-Series</span>

        {menuOpen && (
          <div className={styles.menuDropdown}>
            <h3 className={styles.menuHeading}>Navigation</h3>
            <p className={styles.menuHint}>No other pages available yet.</p>
            <button
              onClick={() => setMenuOpen(false)}
              className={styles.menuClose}
            >
              Close Menu
            </button>
          </div>
        )}
      </header>

      <div className={styles.content}>
        {/* Map Section */}
        <div className={styles.mapSection}>
          <aside
            className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarCollapsed}`}
          >
            {sidebarOpen ? (
              <div className={styles.sidebarScroll}>
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
                className={styles.sidebarExpandButton}
                title="Expand sidebar"
              >
                <span className={styles.sidebarExpandChevron}>»</span>
              </button>
            )}
          </aside>

          <main className={styles.mapMain}>
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

        {/* Analytics Section */}
        <div id="data-section" className={styles.analyticsSection}>
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
