import { useEffect, useMemo, useRef, useState } from 'react';
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { COORDINATES, getBezierPoints, normalizeDistrictName, normalizeName } from '../utils/coordinates';

const DISTRICT_GEOJSON_URL = 'https://raw.githubusercontent.com/geohacker/india/master/district/india_district.geojson';
const STATE_GEOJSON_URL = 'https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson';
const DISTRICT_COLORS = { base: '#0f766e' };
const TELANGANA_DISTRICTS = new Set([
    'ADILABAD', 'NIZAMABAD', 'KARIMNAGAR', 'MEDAK', 'WARANGAL',
    'RANGAREDDI', 'RANGAREDDY', 'HYDERABAD', 'NALGONDA', 'KHAMMAM', 'MAHBUBNAGAR'
]);

(function () {
    if (L.Curve) return;

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

function getDistrictName(feature) {
    return feature?.properties?.NAME_2 || feature?.properties?.district || feature?.properties?.DISTRICT || '';
}

function getStateName(feature) {
    const rawState = normalizeName(feature?.properties?.NAME_1 || feature?.properties?.state || feature?.properties?.STATE || '');
    const districtName = normalizeDistrictName(getDistrictName(feature));

    if (rawState === 'ANDHRA PRADESH' && TELANGANA_DISTRICTS.has(districtName)) {
        return 'TELANGANA';
    }

    return rawState;
}

function getFeatureCenter(feature) {
    const layer = L.geoJSON(feature);
    return layer.getBounds().getCenter();
}

function DistrictMapActionController({ mapAction, selectedDistrict, districtCentroids, filteredGeoData }) {
    const map = useMap();

    useEffect(() => {
        if (!mapAction?.type) return;

        if (mapAction.type === 'reset-view') {
            if (filteredGeoData?.features?.length) {
                const bounds = L.geoJSON(filteredGeoData).getBounds();
                if (bounds.isValid()) map.fitBounds(bounds.pad(0.15), { duration: 0.7 });
                return;
            }
            map.flyTo([22.5937, 82.9629], 5, { duration: 0.7 });
            return;
        }

        if (mapAction.type === 'focus-selected' && selectedDistrict) {
            const center = districtCentroids[normalizeDistrictName(selectedDistrict)];
            if (center) {
                map.flyTo([center.lat, center.lng], 8, { duration: 0.7 });
            }
        }
    }, [districtCentroids, filteredGeoData, map, mapAction, selectedDistrict]);

    useEffect(() => {
        if (!filteredGeoData?.features?.length) return;
        const bounds = L.geoJSON(filteredGeoData).getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds.pad(0.12));
        }
    }, [filteredGeoData, map]);

    return null;
}

function DistrictFlowLines({ flows, threshold, selectedDistrict, districtCentroids }) {
    const map = useMap();
    const linesLayerRef = useRef(L.layerGroup());

    useEffect(() => {
        const linesLayer = linesLayerRef.current;
        linesLayer.clearLayers();

        if (!selectedDistrict) return;

        const districtCenter = districtCentroids[normalizeDistrictName(selectedDistrict)];
        if (!districtCenter) return;

        const filtered = [];
        for (let i = 0; i < flows.length; i++) {
            const flow = flows[i];
            if (flow.count < threshold) continue;
            const originCoords = COORDINATES[flow.origin];
            if (!originCoords) continue;
            filtered.push(flow);
        }

        filtered.sort(function (a, b) { return b.count - a.count; });

        for (let i = 0; i < filtered.length; i++) {
            const flow = filtered[i];
            const start = COORDINATES[flow.origin];
            const end = [districtCenter.lat, districtCenter.lng];
            const { control } = getBezierPoints(start, end);
            const baseWeight = Math.max(1.5, Math.log10(flow.count + 1) * 1.55);
            const lineWeight = baseWeight;
            const lineOpacity = 0.62;

            const curve = L.curve(['M', start, 'Q', control, end], {
                color: DISTRICT_COLORS.base,
                weight: lineWeight,
                opacity: lineOpacity,
                fill: false
            });
            curve.bindTooltip(`${flow.origin} -> ${selectedDistrict}: ${flow.count.toLocaleString()}`);
            linesLayer.addLayer(curve);
        }

        if (districtCenter) {
            linesLayer.addLayer(
                L.circleMarker([districtCenter.lat, districtCenter.lng], {
                    radius: 7,
                    weight: 2,
                    color: '#134e4a',
                    fillColor: '#2dd4bf',
                    fillOpacity: 0.95
                }).bindTooltip(selectedDistrict)
            );
        }

        linesLayer.addTo(map);

        return () => {
            linesLayer.clearLayers();
        };
    }, [districtCentroids, flows, map, selectedDistrict, threshold]);

    return null;
}

function IndiaStateGeoJSON({ geoData, selectedState, onStateClick }) {
    if (!geoData) return null;

    function getStateStyle(feature) {
        const stateName = normalizeName(feature.properties.NAME_1);
        const isSelected = stateName === selectedState;

        return {
            color: isSelected ? '#0f766e' : '#6b7280',
            weight: isSelected ? 3 : 1,
            fillColor: isSelected ? 'rgba(20, 184, 166, 0.24)' : '#ffffff',
            fillOpacity: isSelected ? 0.42 : 0.1
        };
    }

    function onEachFeature(feature, layer) {
        const stateName = normalizeName(feature.properties.NAME_1);
        layer.bindTooltip(stateName, { sticky: true });
        layer.on({
            click: function () { onStateClick(stateName); },
            mouseover: function (e) {
                if (stateName !== selectedState) {
                    e.target.setStyle({ fillOpacity: 0.3, weight: 2 });
                }
            },
            mouseout: function (e) {
                if (stateName !== selectedState) {
                    e.target.setStyle({ fillOpacity: 0.1, weight: 1 });
                }
            }
        });
    }

    return <GeoJSON data={geoData} style={getStateStyle} onEachFeature={onEachFeature} key={`state-${selectedState || 'none'}`} />;
}

function DistrictGeoJSON({ filteredGeoData, selectedDistrict, onDistrictClick }) {
    if (!filteredGeoData?.features?.length) return null;

    function getDistrictStyle(feature) {
        const districtName = getDistrictName(feature);
        const isSelected = normalizeDistrictName(districtName) === normalizeDistrictName(selectedDistrict);

        return {
            color: isSelected ? '#0f766e' : '#64748b',
            weight: isSelected ? 2.8 : 1.2,
            fillColor: isSelected ? 'rgba(20, 184, 166, 0.35)' : '#ffffff',
            fillOpacity: isSelected ? 0.55 : 0.18
        };
    }

    function onEachFeature(feature, layer) {
        const districtName = getDistrictName(feature);
        layer.bindTooltip(districtName, { sticky: true });
        layer.on({
            click: function () { onDistrictClick(districtName); },
            mouseover: function (e) {
                if (normalizeDistrictName(districtName) !== normalizeDistrictName(selectedDistrict)) {
                    e.target.setStyle({ fillOpacity: 0.32, weight: 2 });
                }
            },
            mouseout: function (e) {
                if (normalizeDistrictName(districtName) !== normalizeDistrictName(selectedDistrict)) {
                    e.target.setStyle({ fillOpacity: 0.18, weight: 1.2 });
                }
            }
        });
    }

    return (
        <GeoJSON
            data={filteredGeoData}
            style={getDistrictStyle}
            onEachFeature={onEachFeature}
            key={`${selectedDistrict || 'none'}-${filteredGeoData.features.length}`}
        />
    );
}

export default function DistrictMapView({
    selectedState,
    onStateClick,
    selectedDistrict,
    onDistrictClick,
    flows,
    threshold,
    mapAction,
}) {
    const [districtGeoData, setDistrictGeoData] = useState(null);
    const [stateGeoData, setStateGeoData] = useState(null);

    useEffect(() => {
        fetch(DISTRICT_GEOJSON_URL)
            .then(function (res) { return res.json(); })
            .then(function (data) { setDistrictGeoData(data); })
            .catch(function (err) { console.error('Failed to load district GeoJSON:', err); });
    }, []);

    useEffect(() => {
        fetch(STATE_GEOJSON_URL)
            .then(function (res) { return res.json(); })
            .then(function (data) { setStateGeoData(data); })
            .catch(function (err) { console.error('Failed to load state GeoJSON:', err); });
    }, []);

    const filteredGeoData = useMemo(function () {
        if (!districtGeoData?.features?.length || !selectedState) return null;

        const features = districtGeoData.features.filter(function (feature) {
            return getStateName(feature) === selectedState;
        });

        return {
            type: 'FeatureCollection',
            features,
        };
    }, [districtGeoData, selectedState]);

    const districtCentroids = useMemo(function () {
        const centroids = {};
        if (!filteredGeoData?.features?.length) return centroids;

        for (let i = 0; i < filteredGeoData.features.length; i++) {
            const feature = filteredGeoData.features[i];
            const districtName = getDistrictName(feature);
            const normalized = normalizeDistrictName(districtName);
            if (!normalized || centroids[normalized]) continue;

            const center = getFeatureCenter(feature);
            centroids[normalized] = { lat: center.lat, lng: center.lng };
        }

        return centroids;
    }, [filteredGeoData]);

    const selectedDistrictFlows = useMemo(function () {
        if (!selectedDistrict) return [];
        return flows.filter(function (flow) {
            return normalizeDistrictName(flow.district) === normalizeDistrictName(selectedDistrict);
        });
    }, [flows, selectedDistrict]);

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

            <DistrictMapActionController
                mapAction={mapAction}
                selectedDistrict={selectedDistrict}
                districtCentroids={districtCentroids}
                filteredGeoData={filteredGeoData}
            />
            <IndiaStateGeoJSON
                geoData={stateGeoData}
                selectedState={selectedState}
                onStateClick={onStateClick}
            />
            <DistrictGeoJSON
                filteredGeoData={filteredGeoData}
                selectedDistrict={selectedDistrict}
                onDistrictClick={onDistrictClick}
            />
            <DistrictFlowLines
                flows={selectedDistrictFlows}
                threshold={threshold}
                selectedDistrict={selectedDistrict}
                districtCentroids={districtCentroids}
            />
        </MapContainer>
    );
}
