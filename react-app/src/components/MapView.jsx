import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { COORDINATES, INTERNATIONAL_COORDINATES, getBezierPoints, normalizeName } from '../utils/coordinates';
import './MapView.css';

// get coordinates for a state - check domestic first, then international
function getCoords(name) {
    if (COORDINATES[name]) return COORDINATES[name];
    if (INTERNATIONAL_COORDINATES[name]) return INTERNATIONAL_COORDINATES[name];
    return null;
}

// geojson url for india map with state boundaries
const INDIA_GEOJSON_URL = "https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson";

// ---- Leaflet Curve Plugin ----
// we need this to draw curved bezier lines on the map
// found this on github and modified it slightly
// it extends the Leaflet Path class to support SVG curves
(function () {
    L.Curve = L.Path.extend({
        options: {},
        initialize: function (path, options) {
            L.setOptions(this, options);
            this._setPath(path);
        },
        getPath: function () { return this._coords; },
        setPath: function (path) { this._setPath(path); return this.redraw(); },
        getBounds: function () { return this._bounds; },
        _setPath: function (path) {
            this._coords = path;
            this._bounds = this._computeBounds();
        },
        _computeBounds: function () {
            var bound = new L.LatLngBounds();
            var coords = this._coords;
            for (var i = 0; i < coords.length; i++) {
                if (typeof coords[i] !== 'string') {
                    bound.extend(coords[i]);
                }
            }
            return bound;
        },
        getCenter: function () { return this._bounds.getCenter(); },
        _update: function () {
            if (!this._map) return;
            this._updatePath();
        },
        _updatePath: function () {
            this._renderer._updateCurve(this);
        },
        _project: function () {
            this._points = [];
            for (var i = 0; i < this._coords.length; i++) {
                if (typeof this._coords[i] !== 'string') {
                    this._points.push(this._map.latLngToLayerPoint(this._coords[i]));
                } else {
                    this._points.push(this._coords[i]);
                }
            }
        }
    });

    // shortcut function
    L.curve = function (path, options) { return new L.Curve(path, options); };

    // this part converts curve points to SVG path string
    L.SVG.include({
        _updateCurve: function (layer) {
            this._setPath(layer, this._curvePointsToPath(layer._points));
        },
        _curvePointsToPath: function (points) {
            var str = '';
            for (var i = 0; i < points.length; i++) {
                if (typeof points[i] === 'string') {
                    str += points[i] + ' ';
                } else {
                    str += points[i].x + ',' + points[i].y + ' ';
                }
            }
            return str.trim();
        }
    });
})();

// buttons to clear selection and reset map view
function MapControls({ onClear, hasSelection }) {
    const map = useMap();

    function handleReset() {
        map.setView([22.5937, 82.9629], 5);
    }

    return (
        <div className="btns">
            {hasSelection && (
                <button onClick={onClear} className="btn">
                    <span className="x-icon">x</span> Clear Selection
                </button>
            )}
            <button onClick={handleReset} className="btn">
                <span>R</span> Reset Map View
            </button>
        </div>
    );
}

// draws the curved flow lines between states on the map
function FlowLines({ flows, flowType, selectedState, threshold }) {
    const map = useMap();
    const linesLayerRef = useRef(L.layerGroup());

    useEffect(() => {
        const linesLayer = linesLayerRef.current;
        linesLayer.clearLayers();

        if (!selectedState || flows.length === 0) return;

        // filter flows based on the selected state and threshold
        const filtered = [];
        for (let i = 0; i < flows.length; i++) {
            const f = flows[i];
            if (f.count < threshold) continue;

            // check if this flow is for our selected state
            if (flowType === 'inflow' && f.destination !== selectedState) continue;
            if (flowType === 'outflow' && f.origin !== selectedState) continue;

            // make sure both origin and destination have coordinates
            if (!getCoords(f.origin) || !getCoords(f.destination)) continue;

            filtered.push(f);
        }

        // draw a curved line for each flow
        for (let i = 0; i < filtered.length; i++) {
            const f = filtered[i];
            const start = getCoords(f.origin);
            const end = getCoords(f.destination);
            const color = flowType === 'inflow' ? '#3b82f6' : '#f97316';
            const { control } = getBezierPoints(start, end);

            // line thickness based on how many migrants (log scale)
            const lineWeight = Math.max(1, Math.log10(f.count) * 1.5);

            const curve = L.curve(
                ['M', start, 'Q', control, end],
                { color: color, weight: lineWeight, opacity: 0.6, fill: false }
            );
            curve.bindTooltip(`${f.origin} -> ${f.destination}: ${f.count.toLocaleString()}`);
            linesLayer.addLayer(curve);
        }

        linesLayer.addTo(map);

        return () => {
            linesLayer.clearLayers();
        };
    }, [flows, flowType, selectedState, threshold, map]);

    return null;
}

// loads and renders the india geojson map with state boundaries
function IndiaGeoJSON({ onStateClick, selectedState, flowType }) {
    const [geoData, setGeoData] = useState(null);

    // load geojson data from github
    useEffect(() => {
        fetch(INDIA_GEOJSON_URL)
            .then(function (res) { return res.json(); })
            .then(function (data) { setGeoData(data); })
            .catch(function (err) { console.error("Failed to load GeoJSON:", err); });
    }, []);

    if (!geoData) return null;

    // style for each state on the map
    function getStateStyle(feature) {
        const stateName = normalizeName(feature.properties.NAME_1);
        const isSelected = stateName === selectedState;

        // different colors for inflow vs outflow
        const borderColor = flowType === 'inflow' ? '#3b82f6' : 'rgba(249, 115, 22, 0.6)';
        const fillColor = flowType === 'inflow' ? '#bfdbfe' : 'rgba(249, 115, 22, 0.22)';

        return {
            color: isSelected ? borderColor : '#6b7280',
            weight: isSelected ? 3 : 1,
            fillColor: isSelected ? fillColor : '#ffffff',
            fillOpacity: isSelected ? 0.4 : 0.1
        };
    }

    // add tooltip and click handler for each state
    function onEachFeature(feature, layer) {
        const stateName = normalizeName(feature.properties.NAME_1);
        layer.bindTooltip(stateName, { sticky: true });
        layer.on({
            click: function () { onStateClick(stateName); },
            mouseover: function (e) {
                if (normalizeName(feature.properties.NAME_1) !== selectedState) {
                    e.target.setStyle({ fillOpacity: 0.3, weight: 2 });
                }
            },
            mouseout: function (e) {
                if (normalizeName(feature.properties.NAME_1) !== selectedState) {
                    e.target.setStyle({ fillOpacity: 0.1, weight: 1 });
                }
            }
        });
    }

    return <GeoJSON data={geoData} style={getStateStyle} onEachFeature={onEachFeature} key={`${selectedState}-${flowType}`} />;
}

// main map component
export default function MapView({ flows, flowType, selectedState, onStateClick, threshold, onClearSelection }) {
    return (
        <MapContainer
            center={[22.5937, 82.9629]}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            maxBounds={[[-90, -180], [90, 180]]}
            maxBoundsViscosity={1.0}
            worldCopyJump={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
                noWrap={true}
            />

            <MapControls onClear={onClearSelection} hasSelection={!!selectedState} />
            <IndiaGeoJSON onStateClick={onStateClick} selectedState={selectedState} flowType={flowType} />
            <FlowLines
                flows={flows}
                flowType={flowType}
                selectedState={selectedState}
                threshold={threshold}
            />
        </MapContainer>
    );
}

