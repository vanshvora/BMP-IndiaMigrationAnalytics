import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { COORDINATES, INTERNATIONAL_COORDINATES, getBezierPoints, normalizeName } from '../utils/coordinates';
import styles from './MapView.module.css';

// get coords from either domestic or international
function getCoords(name) {
    return COORDINATES[name] || INTERNATIONAL_COORDINATES[name] || null;
}

const INDIA_GEOJSON_URL = "https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson";

// Leaflet curve plugin - needed for bezier curves on map
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
    L.curve = function (path, options) { return new L.Curve(path, options); };

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

function MapControls({ onClear, hasSelection }) {
    const map = useMap();
    const handleReset = () => map.setView([22.5937, 82.9629], 5);

    return (
        <div className={styles.controls}>
            {hasSelection && (
                <button
                    onClick={onClear}
                    className={styles.controlBtn}
                >
                    <span className={styles.dangerIcon}>✕</span> Clear Selection
                </button>
            )}
            <button
                onClick={handleReset}
                className={styles.controlBtn}
            >
                <span>↺</span> Reset Map View
            </button>
        </div>
    );
}

function FlowLines({ flows, flowType, selectedState, threshold }) {
    const map = useMap();
    const linesLayerRef = useRef(L.layerGroup());

    useEffect(() => {
        const linesLayer = linesLayerRef.current;
        linesLayer.clearLayers();

        if (!selectedState || flows.length === 0) return;

        // filter based on settings
        const filtered = flows.filter(f => {
            if (f.count < threshold) return false;
            if (flowType === 'inflow') {
                return f.destination === selectedState;
            } else {
                return f.origin === selectedState;
            }
        }).filter(f => getCoords(f.origin) && getCoords(f.destination));

        // draw the curves
        filtered.forEach(f => {
            const start = getCoords(f.origin);
            const end = getCoords(f.destination);
            const color = flowType === 'inflow' ? '#3b82f6' : '#f97316';
            const { control } = getBezierPoints(start, end);

            const curve = L.curve(
                ['M', start, 'Q', control, end],
                {
                    color,
                    weight: Math.max(1, Math.log10(f.count) * 1.5),
                    opacity: 0.6,
                    fill: false
                }
            );
            curve.bindTooltip(`${f.origin} → ${f.destination}: ${f.count.toLocaleString()}`);
            linesLayer.addLayer(curve);
        });

        linesLayer.addTo(map);

        return () => {
            linesLayer.clearLayers();
        };
    }, [flows, flowType, selectedState, threshold, map]);

    return null;
}

function IndiaGeoJSON({ onStateClick, selectedState }) {
    const [geoData, setGeoData] = useState(null);

    useEffect(() => {
        fetch(INDIA_GEOJSON_URL)
            .then(res => res.json())
            .then(data => setGeoData(data))
            .catch(err => console.error("Failed to load GeoJSON:", err));
    }, []);

    if (!geoData) return null;

    const style = (feature) => {
        const stateName = normalizeName(feature.properties.NAME_1);
        const isSelected = stateName === selectedState;
        return {
            color: isSelected ? '#2563eb' : '#6b7280',
            weight: isSelected ? 3 : 1,
            fillColor: isSelected ? '#bfdbfe' : '#ffffff',
            fillOpacity: isSelected ? 0.4 : 0.1
        };
    };

    const onEachFeature = (feature, layer) => {
        const stateName = normalizeName(feature.properties.NAME_1);
        layer.bindTooltip(stateName, { sticky: true });
        layer.on({
            click: () => onStateClick(stateName),
            mouseover: (e) => {
                if (normalizeName(feature.properties.NAME_1) !== selectedState) {
                    e.target.setStyle({ fillOpacity: 0.3, weight: 2 });
                }
            },
            mouseout: (e) => {
                if (normalizeName(feature.properties.NAME_1) !== selectedState) {
                    e.target.setStyle({ fillOpacity: 0.1, weight: 1 });
                }
            }
        });
    };

    return <GeoJSON data={geoData} style={style} onEachFeature={onEachFeature} key={selectedState} />;
}

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
            <IndiaGeoJSON onStateClick={onStateClick} selectedState={selectedState} />
            <FlowLines
                flows={flows}
                flowType={flowType}
                selectedState={selectedState}
                threshold={threshold}
            />
        </MapContainer>
    );
}
