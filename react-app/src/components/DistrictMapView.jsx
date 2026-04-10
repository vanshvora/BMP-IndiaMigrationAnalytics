import { useEffect, useMemo, useRef, useState } from 'react';
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { COORDINATES, getBezierPoints, normalizeDistrictName, normalizeName } from '../utils/coordinates';
import '../utils/leafletCurve';

const DISTRICT_GEOJSON_URL = 'https://raw.githubusercontent.com/geohacker/india/master/district/india_district.geojson';
const STATE_GEOJSON_URL = 'https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson';
const DISTRICT_COLORS = { base: '#0f766e', compareA: '#0f766e', compareB: '#f97316' };
const TELANGANA_DISTRICTS = new Set([
    'ADILABAD', 'NIZAMABAD', 'KARIMNAGAR', 'MEDAK', 'WARANGAL',
    'RANGAREDDI', 'RANGAREDDY', 'HYDERABAD', 'NALGONDA', 'KHAMMAM', 'MAHBUBNAGAR'
]);

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

function getRingCentroid(ring) {
    if (!Array.isArray(ring) || ring.length < 3) return null;

    let area = 0;
    let centroidLng = 0;
    let centroidLat = 0;

    for (let i = 0; i < ring.length - 1; i++) {
        const current = ring[i];
        const next = ring[i + 1];
        if (!current || !next) continue;

        const currentLng = Number(current[0]);
        const currentLat = Number(current[1]);
        const nextLng = Number(next[0]);
        const nextLat = Number(next[1]);
        const cross = (currentLng * nextLat) - (nextLng * currentLat);

        area += cross;
        centroidLng += (currentLng + nextLng) * cross;
        centroidLat += (currentLat + nextLat) * cross;
    }

    if (Math.abs(area) < 1e-9) return null;

    return {
        area: area / 2,
        lng: centroidLng / (3 * area),
        lat: centroidLat / (3 * area)
    };
}

function getGeometryCentroid(geometry) {
    if (!geometry?.type || !geometry?.coordinates) return null;

    if (geometry.type === 'Polygon') {
        return getRingCentroid(geometry.coordinates[0]);
    }

    if (geometry.type === 'MultiPolygon') {
        let weightedLat = 0;
        let weightedLng = 0;
        let totalArea = 0;

        for (let i = 0; i < geometry.coordinates.length; i++) {
            const polygon = geometry.coordinates[i];
            const centroid = getRingCentroid(polygon?.[0]);
            if (!centroid) continue;

            const weight = Math.abs(centroid.area);
            weightedLat += centroid.lat * weight;
            weightedLng += centroid.lng * weight;
            totalArea += weight;
        }

        if (totalArea > 0) {
            return {
                lat: weightedLat / totalArea,
                lng: weightedLng / totalArea
            };
        }
    }

    return null;
}

function getFeatureCenter(feature) {
    const geometryCenter = getGeometryCentroid(feature?.geometry);
    if (geometryCenter) return geometryCenter;

    const layer = L.geoJSON(feature);
    return layer.getBounds().getCenter();
}

function getDistrictCentroidKey(stateName, districtName) {
    return `${stateName || ''}::${normalizeDistrictName(districtName)}`;
}

function DistrictMapActionController({ mapAction, selectedState, selectedDistrict, districtCentroids, filteredGeoData }) {
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
            const center = districtCentroids[getDistrictCentroidKey(selectedState, selectedDistrict)];
            if (center) {
                map.flyTo([center.lat, center.lng], 8, { duration: 0.7 });
            }
        }
    }, [districtCentroids, filteredGeoData, map, mapAction, selectedDistrict, selectedState]);

    useEffect(() => {
        if (!filteredGeoData?.features?.length) return;
        const bounds = L.geoJSON(filteredGeoData).getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds.pad(0.12));
        }
    }, [filteredGeoData, map]);

    return null;
}

function DistrictFlowLines({ flows, threshold, selectedState, selectedDistrict, districtCentroids, color = DISTRICT_COLORS.base, markerColor = '#2dd4bf', markerStroke = '#134e4a', labelPrefix = '' }) {
    const map = useMap();
    const linesLayerRef = useRef(L.layerGroup());

    useEffect(() => {
        const linesLayer = linesLayerRef.current;
        linesLayer.clearLayers();

        if (!selectedDistrict) return;

        const districtCenter = districtCentroids[getDistrictCentroidKey(selectedState, selectedDistrict)];
        if (!districtCenter) return;

        const filtered = [];
        for (let i = 0; i < flows.length; i++) {
            const flow = flows[i];
            if (flow.count < threshold) continue;
            if (selectedState && flow.state !== selectedState) continue;
            if (normalizeDistrictName(flow.district) !== normalizeDistrictName(selectedDistrict)) continue;
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
                color,
                weight: lineWeight,
                opacity: lineOpacity,
                fill: false
            });
            curve.bindTooltip(`${labelPrefix}${flow.origin} -> ${selectedDistrict}: ${flow.count.toLocaleString()}`);
            linesLayer.addLayer(curve);
        }

        if (districtCenter) {
            linesLayer.addLayer(
                L.circleMarker([districtCenter.lat, districtCenter.lng], {
                    radius: 7,
                    weight: 2,
                    color: markerStroke,
                    fillColor: markerColor,
                    fillOpacity: 0.95
                }).bindTooltip(`${labelPrefix}${selectedDistrict}`)
            );
        }

        linesLayer.addTo(map);

        return () => {
            linesLayer.clearLayers();
        };
    }, [color, districtCentroids, flows, labelPrefix, map, markerColor, markerStroke, selectedDistrict, selectedState, threshold]);

    return null;
}

function IndiaStateGeoJSON({ geoData, selectedState, onStateClick }) {
    if (!geoData) return null;

    function getStateStyle(feature) {
        const stateName = normalizeName(feature.properties.NAME_1);
        const isSelected = stateName === selectedState;
        const hasActiveSelection = Boolean(selectedState);

        return {
            color: isSelected ? '#0f766e' : '#6b7280',
            weight: isSelected ? 3 : 1,
            fillColor: isSelected ? 'rgba(20, 184, 166, 0.24)' : '#ffffff',
            fillOpacity: isSelected ? 0.42 : (hasActiveSelection ? 0.04 : 0.1)
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

function DistrictGeoJSON({ filteredGeoData, selectedDistrict, selectedState, onDistrictClick, compareMode, districtA, districtB }) {
    if (!filteredGeoData?.features?.length) return null;

    function getDistrictStyle(feature) {
        const districtName = getDistrictName(feature);
        const featureState = getStateName(feature);
        const isSelected = featureState === selectedState && normalizeDistrictName(districtName) === normalizeDistrictName(selectedDistrict);
        const isDistrictA = compareMode && districtA?.district && featureState === districtA.state && normalizeDistrictName(districtName) === normalizeDistrictName(districtA.district);
        const isDistrictB = compareMode && districtB?.district && featureState === districtB.state && normalizeDistrictName(districtName) === normalizeDistrictName(districtB.district);
        const isCompared = isDistrictA || isDistrictB;
        const compareColor = isDistrictA ? '#0f766e' : '#f97316';

        return {
            color: isCompared ? compareColor : (isSelected ? '#0f766e' : '#64748b'),
            weight: isCompared || isSelected ? 2.8 : 1.2,
            fillColor: isCompared ? (isDistrictA ? 'rgba(20, 184, 166, 0.36)' : 'rgba(249, 115, 22, 0.35)') : (isSelected ? 'rgba(20, 184, 166, 0.35)' : '#ffffff'),
            fillOpacity: isCompared || isSelected ? 0.55 : 0.18
        };
    }

    function onEachFeature(feature, layer) {
        const districtName = getDistrictName(feature);
        const featureState = getStateName(feature);
        layer.bindTooltip(`${districtName}, ${featureState}`, { sticky: true });
        layer.on({
            click: function () { onDistrictClick(districtName, featureState); },
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
    selectedStates = [],
    onStateClick,
    selectedDistrict,
    onDistrictClick,
    flows,
    threshold,
    mapAction,
    compareMode = false,
    districtA = null,
    districtB = null,
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
        if (!districtGeoData?.features?.length) return null;
        const stateFilter = selectedStates.length > 0 ? selectedStates : (selectedState ? [selectedState] : []);
        if (stateFilter.length === 0) return null;
        const selectedStateSet = new Set(stateFilter);

        const features = districtGeoData.features.filter(function (feature) {
            return selectedStateSet.has(getStateName(feature));
        });

        return {
            type: 'FeatureCollection',
            features,
        };
    }, [districtGeoData, selectedState, selectedStates]);

    const districtCentroids = useMemo(function () {
        const centroids = {};
        if (!filteredGeoData?.features?.length) return centroids;

        for (let i = 0; i < filteredGeoData.features.length; i++) {
            const feature = filteredGeoData.features[i];
            const districtName = getDistrictName(feature);
            const stateName = getStateName(feature);
            const normalized = getDistrictCentroidKey(stateName, districtName);
            if (!normalizeDistrictName(districtName) || centroids[normalized]) continue;

            const center = getFeatureCenter(feature);
            centroids[normalized] = { lat: center.lat, lng: center.lng };
        }

        return centroids;
    }, [filteredGeoData]);

    const selectedDistrictFlows = useMemo(function () {
        if (!selectedState || !selectedDistrict) return [];
        return flows.filter(function (flow) {
            return flow.state === selectedState && normalizeDistrictName(flow.district) === normalizeDistrictName(selectedDistrict);
        });
    }, [flows, selectedDistrict, selectedState]);

    const comparisonFlowTargets = useMemo(function () {
        if (!compareMode) return [];
        const targets = [];
        if (districtA?.state && districtA?.district) {
            targets.push({
                key: 'A',
                state: districtA.state,
                district: districtA.district,
                color: DISTRICT_COLORS.compareA,
                markerColor: '#2dd4bf',
                markerStroke: '#134e4a',
            });
        }
        if (districtB?.state && districtB?.district) {
            targets.push({
                key: 'B',
                state: districtB.state,
                district: districtB.district,
                color: DISTRICT_COLORS.compareB,
                markerColor: '#fdba74',
                markerStroke: '#c2410c',
            });
        }
        return targets;
    }, [compareMode, districtA, districtB]);

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
                selectedState={selectedState}
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
                selectedState={selectedState}
                selectedDistrict={selectedDistrict}
                onDistrictClick={onDistrictClick}
                compareMode={compareMode}
                districtA={districtA}
                districtB={districtB}
            />
            {compareMode ? (
                comparisonFlowTargets.map(function (target) {
                    return (
                        <DistrictFlowLines
                            key={`${target.key}-${target.state}-${target.district}`}
                            flows={flows}
                            threshold={threshold}
                            selectedState={target.state}
                            selectedDistrict={target.district}
                            districtCentroids={districtCentroids}
                            color={target.color}
                            markerColor={target.markerColor}
                            markerStroke={target.markerStroke}
                            labelPrefix={`${target.key}: `}
                        />
                    );
                })
            ) : (
                <DistrictFlowLines
                    flows={selectedDistrictFlows}
                    threshold={threshold}
                    selectedState={selectedState}
                    selectedDistrict={selectedDistrict}
                    districtCentroids={districtCentroids}
                />
            )}
        </MapContainer>
    );
}
