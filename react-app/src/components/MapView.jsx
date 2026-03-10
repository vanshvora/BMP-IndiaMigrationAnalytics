import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { COORDINATES, INTERNATIONAL_COORDINATES, getBezierPoints, normalizeName } from '../utils/coordinates';
import './MapView.css';

const STATE_A_COLORS = { base: '#2563eb', highlight: '#1d4ed8' };
const STATE_B_COLORS = { base: '#f97316', highlight: '#ea580c' };

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

function MapActionController({ mapAction, selectedState }) {
    const map = useMap();

    useEffect(() => {
        if (!mapAction || !mapAction.type) return;

        if (mapAction.type === 'reset-view') {
            map.flyTo([22.5937, 82.9629], 5, { duration: 0.7 });
            return;
        }

        if (mapAction.type === 'focus-selected') {
            if (!selectedState) return;
            const coords = getCoords(selectedState);
            if (!coords) return;
            map.flyTo(coords, 6, { duration: 0.7 });
            return;
        }

    }, [mapAction, map, selectedState]);

    return null;
}

// draws the curved flow lines between states on the map
function FlowLines({ flows, flowType, selectedState, threshold, topFlowLimit, highlightTopCorridors, compareMode, stateA, stateB }) {
    const map = useMap();
    const linesLayerRef = useRef(L.layerGroup());

    useEffect(() => {
        const linesLayer = linesLayerRef.current;
        linesLayer.clearLayers();

        if (flows.length === 0) return;

        function drawFlowSet(targetState, palette, groupLabel, dashArray) {
            if (!targetState) return;

            const eligible = [];
            for (let i = 0; i < flows.length; i++) {
                const f = flows[i];
                if (f.count < threshold) continue;

                if (flowType === 'inflow' && f.destination !== targetState) continue;
                if (flowType === 'outflow' && f.origin !== targetState) continue;
                if (!getCoords(f.origin) || !getCoords(f.destination)) continue;

                eligible.push(f);
            }

            eligible.sort(function (a, b) { return b.count - a.count; });
            const maxCount = topFlowLimit === 'all' ? eligible.length : Number(topFlowLimit);
            const safeMax = Number.isFinite(maxCount) ? maxCount : eligible.length;
            const filtered = eligible.slice(0, Math.max(0, safeMax));

            for (let i = 0; i < filtered.length; i++) {
                const f = filtered[i];
                const start = getCoords(f.origin);
                const end = getCoords(f.destination);
                const color = highlightTopCorridors ? palette.highlight : palette.base;
                const { control } = getBezierPoints(start, end);

                const baseWeight = Math.max(1, Math.log10(f.count) * 1.5);
                const lineWeight = highlightTopCorridors ? Math.max(2.2, baseWeight * 1.45) : baseWeight;
                const lineOpacity = highlightTopCorridors ? 0.92 : 0.62;

                if (highlightTopCorridors) {
                    const halo = L.curve(
                        ['M', start, 'Q', control, end],
                        { color: '#0f172a', weight: lineWeight + 2.2, opacity: 0.24, fill: false }
                    );
                    linesLayer.addLayer(halo);
                }

                const curve = L.curve(
                    ['M', start, 'Q', control, end],
                    { color: color, weight: lineWeight, opacity: lineOpacity, fill: false, dashArray: dashArray || null }
                );
                curve.bindTooltip(`${groupLabel} | ${f.origin} -> ${f.destination}: ${f.count.toLocaleString()}`);
                linesLayer.addLayer(curve);
            }
        }

        if (compareMode) {
            if (!stateA && !stateB) return;
            drawFlowSet(stateA, STATE_A_COLORS, 'State A', null);
            drawFlowSet(stateB, STATE_B_COLORS, 'State B', '6 4');
        } else {
            if (!selectedState) return;
            const defaultPalette = flowType === 'inflow' ? STATE_A_COLORS : STATE_B_COLORS;
            drawFlowSet(selectedState, defaultPalette, 'Selected', null);
        }

        linesLayer.addTo(map);

        return () => {
            linesLayer.clearLayers();
        };
    }, [flows, flowType, selectedState, threshold, topFlowLimit, highlightTopCorridors, map, compareMode, stateA, stateB]);

    return null;
}

// loads and renders the india geojson map with state boundaries
function IndiaGeoJSON({ onStateClick, selectedState, flowType, compareMode, stateA, stateB }) {
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
        const isStateA = compareMode && stateName === stateA;
        const isStateB = compareMode && stateName === stateB;
        const isSelected = compareMode ? (isStateA || isStateB) : stateName === selectedState;

        const borderColor = isStateA
            ? STATE_A_COLORS.base
            : isStateB
                ? STATE_B_COLORS.base
                : (flowType === 'inflow' ? '#3b82f6' : 'rgba(249, 115, 22, 0.6)');

        const fillColor = isStateA
            ? 'rgba(37, 99, 235, 0.24)'
            : isStateB
                ? 'rgba(249, 115, 22, 0.24)'
                : (flowType === 'inflow' ? '#bfdbfe' : 'rgba(249, 115, 22, 0.22)');

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
        const isPickedState = function (name) {
            if (compareMode) return name === stateA || name === stateB;
            return name === selectedState;
        };

        layer.bindTooltip(stateName, { sticky: true });
        layer.on({
            click: function () { onStateClick(stateName); },
            mouseover: function (e) {
                if (!isPickedState(normalizeName(feature.properties.NAME_1))) {
                    e.target.setStyle({ fillOpacity: 0.3, weight: 2 });
                }
            },
            mouseout: function (e) {
                if (!isPickedState(normalizeName(feature.properties.NAME_1))) {
                    e.target.setStyle({ fillOpacity: 0.1, weight: 1 });
                }
            }
        });
    }

    return <GeoJSON data={geoData} style={getStateStyle} onEachFeature={onEachFeature} key={`${selectedState}-${stateA}-${stateB}-${compareMode ? 'compare' : 'single'}-${flowType}`} />;
}

// main map component
export default function MapView({
    flows,
    flowType,
    selectedState,
    onStateClick,
    threshold,
    mapAction,
    topFlowLimit,
    highlightTopCorridors,
    compareMode,
    stateA,
    stateB
}) {
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

            <MapActionController mapAction={mapAction} selectedState={selectedState} />
            <IndiaGeoJSON
                onStateClick={onStateClick}
                selectedState={selectedState}
                flowType={flowType}
                compareMode={compareMode}
                stateA={stateA}
                stateB={stateB}
            />
            <FlowLines
                flows={flows}
                flowType={flowType}
                selectedState={selectedState}
                threshold={threshold}
                topFlowLimit={topFlowLimit}
                highlightTopCorridors={highlightTopCorridors}
                compareMode={compareMode}
                stateA={stateA}
                stateB={stateB}
            />
        </MapContainer>
    );
}

