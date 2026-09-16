import {
  NERState,
  StateDistrictMetadata,
  MonitoredLocation,
  RoadSegment,
  ShelterFacility,
  FieldReport,
  EmergencyBulletin,
  InfrastructureItem
} from '../types';

export const NER_DEFAULT_BOUNDS: [[number, number], [number, number]] = [
  [23.0, 90.0], // South-West (Southern Tripura/Mizoram/Meghalaya cluster)
  [28.8, 96.5]  // North-East (Arunachal Pradesh / Eastern border)
];

export const NER_STATES_META: Record<NERState, StateDistrictMetadata> = {
  'Nagaland': {
    state: 'Nagaland',
    capital: 'Kohima',
    center: [25.6751, 94.1086],
    bounds: [[25.10, 93.30], [27.05, 95.30]],
    zoom: 9,
    districts: [
      { name: 'Kohima', center: [25.6751, 94.1086], highRiskZoneCount: 4 },
      { name: 'Dimapur', center: [25.9090, 93.7266], highRiskZoneCount: 1 },
      { name: 'Phek', center: [25.6698, 94.4988], highRiskZoneCount: 3 },
      { name: 'Mokokchung', center: [26.3248, 94.5155], highRiskZoneCount: 2 },
      { name: 'Wokha', center: [26.0984, 94.2604], highRiskZoneCount: 2 }
    ]
  },
  'Meghalaya': {
    state: 'Meghalaya',
    capital: 'Shillong',
    center: [25.5788, 91.8933],
    bounds: [[25.00, 89.80], [26.15, 92.85]],
    zoom: 9,
    districts: [
      { name: 'East Khasi Hills', center: [25.5788, 91.8933], highRiskZoneCount: 5 },
      { name: 'West Khasi Hills', center: [25.5412, 91.2486], highRiskZoneCount: 3 },
      { name: 'Ri-Bhoi', center: [25.9048, 91.8797], highRiskZoneCount: 2 },
      { name: 'West Garo Hills', center: [25.5141, 90.2033], highRiskZoneCount: 2 },
      { name: 'East Jaintia Hills', center: [25.3218, 92.4285], highRiskZoneCount: 3 }
    ]
  },
  'Sikkim': {
    state: 'Sikkim',
    capital: 'Gangtok',
    center: [27.3389, 88.6065],
    bounds: [[27.05, 88.05], [28.15, 88.95]],
    zoom: 9,
    districts: [
      { name: 'Gangtok', center: [27.3389, 88.6065], highRiskZoneCount: 5 },
      { name: 'Mangan', center: [27.5042, 88.5323], highRiskZoneCount: 6 },
      { name: 'Namchi', center: [27.1656, 88.3544], highRiskZoneCount: 3 },
      { name: 'Gyalshing', center: [27.2831, 88.2392], highRiskZoneCount: 2 },
      { name: 'Pakyong', center: [27.2372, 88.5902], highRiskZoneCount: 4 }
    ]
  },
  'Assam': {
    state: 'Assam',
    capital: 'Dispur',
    center: [26.1445, 91.7362],
    bounds: [[24.15, 89.70], [28.00, 96.00]],
    zoom: 8,
    districts: [
      { name: 'Dima Hasao', center: [25.1764, 93.0232], highRiskZoneCount: 6 },
      { name: 'Karbi Anglong', center: [26.0125, 93.4382], highRiskZoneCount: 3 },
      { name: 'Kamrup Metro', center: [26.1856, 91.7476], highRiskZoneCount: 2 },
      { name: 'Cachar', center: [24.8333, 92.7789], highRiskZoneCount: 2 },
      { name: 'Hailakandi', center: [24.6836, 92.5647], highRiskZoneCount: 1 }
    ]
  },
  'Arunachal Pradesh': {
    state: 'Arunachal Pradesh',
    capital: 'Itanagar',
    center: [27.0844, 93.6053],
    bounds: [[26.65, 91.50], [29.50, 97.40]],
    zoom: 8,
    districts: [
      { name: 'Papum Pare', center: [27.0844, 93.6053], highRiskZoneCount: 4 },
      { name: 'West Kameng', center: [27.3000, 92.4000], highRiskZoneCount: 4 },
      { name: 'Tawang', center: [27.5861, 91.8594], highRiskZoneCount: 3 },
      { name: 'Lower Subansiri', center: [27.5500, 93.8333], highRiskZoneCount: 3 },
      { name: 'East Siang', center: [28.0667, 95.3333], highRiskZoneCount: 2 }
    ]
  },
  'Mizoram': {
    state: 'Mizoram',
    capital: 'Aizawl',
    center: [23.7271, 92.7176],
    bounds: [[21.90, 92.20], [24.50, 93.50]],
    zoom: 8,
    districts: [
      { name: 'Aizawl', center: [23.7271, 92.7176], highRiskZoneCount: 5 },
      { name: 'Lunglei', center: [22.8671, 92.7656], highRiskZoneCount: 3 },
      { name: 'Champhai', center: [23.4744, 93.3278], highRiskZoneCount: 2 },
      { name: 'Kolasib', center: [24.2244, 92.6789], highRiskZoneCount: 3 },
      { name: 'Serchhip', center: [23.3411, 92.8500], highRiskZoneCount: 1 }
    ]
  },
  'Manipur': {
    state: 'Manipur',
    capital: 'Imphal',
    center: [24.8170, 93.9368],
    bounds: [[23.80, 93.00], [25.70, 94.80]],
    zoom: 9,
    districts: [
      { name: 'Tamenglong', center: [24.9861, 93.4947], highRiskZoneCount: 4 },
      { name: 'Senapati', center: [25.2678, 94.0178], highRiskZoneCount: 4 },
      { name: 'Churachandpur', center: [24.3333, 93.6667], highRiskZoneCount: 3 },
      { name: 'Kangpokpi', center: [25.1500, 93.9667], highRiskZoneCount: 2 },
      { name: 'Imphal West', center: [24.8170, 93.9368], highRiskZoneCount: 1 }
    ]
  },
  'Tripura': {
    state: 'Tripura',
    capital: 'Agartala',
    center: [23.8315, 91.2868],
    bounds: [[22.90, 91.10], [24.55, 92.40]],
    zoom: 9,
    districts: [
      { name: 'Dhalai', center: [23.8667, 91.8667], highRiskZoneCount: 3 },
      { name: 'North Tripura', center: [24.2833, 92.1667], highRiskZoneCount: 2 },
      { name: 'Gomati', center: [23.5333, 91.4833], highRiskZoneCount: 1 },
      { name: 'West Tripura', center: [23.8315, 91.2868], highRiskZoneCount: 1 }
    ]
  }
};

export const INITIAL_MONITORED_LOCATIONS: MonitoredLocation[] = [
  {
    id: 'LOC-NL-01',
    name: 'NH-29 Dzüdza River S-Bend Slopes',
    state: 'Nagaland',
    district: 'Kohima',
    lat: 25.7022,
    lng: 94.0418,
    slopeAngleDeg: 42,
    elevationM: 1460,
    soilMoisturePct: 88,
    soilMoistureTrend: 'INCREASING',
    rainfallCurrentMm: 24.5,
    rainfall24hMm: 112.4,
    rainfall72hMm: 238.0,
    rainfallDecayMemoryMm: 184.2,
    riskScore: 92,
    riskLevel: 'CRITICAL',
    riskTrend: 'RISING',
    confidenceScore: 94,
    thresholdValue: 74,
    drainageDisrupted: true,
    cascadingHazard: 'Debris flow threatens to dam Dzüdza River culvert, potential flash flood to downstream settlement.',
    keyContributingFactors: [
      { factor: 'Accumulated 72h Rainfall Memory', contributionPct: 38, description: 'Sustained antecedent moisture leading to hydraulic head pressure.' },
      { factor: 'Steep Escarpment Angle (42°)', contributionPct: 28, description: 'Over-steepened road cut along NH-29 with sheared shale formation.' },
      { factor: 'Clogged Natural Hill Streamlet', contributionPct: 18, description: 'Runoff diverting across unstable colluvium mantle.' },
      { factor: 'Historical Slip Activity', contributionPct: 16, description: 'Active creep recorded during 2023 and 2024 monsoon seasons.' }
    ],
    nearbyInfrastructure: ['NH-29 Trans-Nagaland Arterial Highway', 'Dzüdza Power Substation', 'Kohima Water Pipeline'],
    vulnerablePopulationEst: 3450,
    lastUpdated: '10 mins ago',
    dataProvenance: 'AI PREDICTION'
  },
  {
    id: 'LOC-ML-02',
    name: 'Shillong Bypass Mawkdok Chasm Verge',
    state: 'Meghalaya',
    district: 'East Khasi Hills',
    lat: 25.4382,
    lng: 91.8021,
    slopeAngleDeg: 46,
    elevationM: 1680,
    soilMoisturePct: 82,
    soilMoistureTrend: 'INCREASING',
    rainfallCurrentMm: 18.2,
    rainfall24hMm: 94.0,
    rainfall72hMm: 182.5,
    rainfallDecayMemoryMm: 142.1,
    riskScore: 84,
    riskLevel: 'HIGH',
    riskTrend: 'RISING',
    confidenceScore: 91,
    thresholdValue: 70,
    drainageDisrupted: true,
    cascadingHazard: 'Siltation into gorge stream, potential road bench detachment across 140m span.',
    keyContributingFactors: [
      { factor: 'Rainfall Infiltration Pulse', contributionPct: 34, description: 'Intense orographic downpour over Sohra-Shillong plateau.' },
      { factor: 'Weathered Sandstone-Quartzite Interface', contributionPct: 30, description: 'Weak bedding plane dipping daylighting toward highway.' },
      { factor: 'Slope Gradient (46°)', contributionPct: 24, description: 'Near-vertical natural gorge flank.' },
      { factor: 'Traffic Dynamic Load', contributionPct: 12, description: 'Heavy inter-state freight trucks vibrating slope base.' }
    ],
    nearbyInfrastructure: ['Shillong–Cherrapunji Highway (NH-106)', 'Mawkdok Tourist Observation Bridge'],
    vulnerablePopulationEst: 1850,
    lastUpdated: '22 mins ago',
    dataProvenance: 'AI PREDICTION'
  },
  {
    id: 'LOC-SK-03',
    name: 'Dikchu–Singtam River Highway Sector',
    state: 'Sikkim',
    district: 'Mangan',
    lat: 27.4120,
    lng: 88.5284,
    slopeAngleDeg: 39,
    elevationM: 780,
    soilMoisturePct: 76,
    soilMoistureTrend: 'STABLE',
    rainfallCurrentMm: 8.5,
    rainfall24hMm: 62.0,
    rainfall72hMm: 135.0,
    rainfallDecayMemoryMm: 104.0,
    riskScore: 68,
    riskLevel: 'MODERATE',
    riskTrend: 'STABLE',
    confidenceScore: 89,
    thresholdValue: 65,
    drainageDisrupted: false,
    cascadingHazard: null,
    keyContributingFactors: [
      { factor: 'Teesta River Toe Erosion', contributionPct: 36, description: 'Fast river current undermining base of talus cone.' },
      { factor: 'Past Glacier Outburst Disturbance', contributionPct: 28, description: 'Residual unconsolidated sediment deposits from 2023 flood.' },
      { factor: 'Recent 24h Showers', contributionPct: 22, description: 'Moderate localized precipitation.' },
      { factor: 'Geological Shearing', contributionPct: 14, description: 'Main Central Thrust tectonic boundary proximity.' }
    ],
    nearbyInfrastructure: ['NH-10 Link Corridor', 'Dikchu Hydroelectric Barrage Intake'],
    vulnerablePopulationEst: 2100,
    lastUpdated: '35 mins ago',
    dataProvenance: 'AI PREDICTION'
  },
  {
    id: 'LOC-AS-04',
    name: 'Jatinga Valley Rail-Road Hill Pass',
    state: 'Assam',
    district: 'Dima Hasao',
    lat: 25.1215,
    lng: 93.0310,
    slopeAngleDeg: 38,
    elevationM: 610,
    soilMoisturePct: 86,
    soilMoistureTrend: 'INCREASING',
    rainfallCurrentMm: 21.0,
    rainfall24hMm: 108.5,
    rainfall72hMm: 215.0,
    rainfallDecayMemoryMm: 172.5,
    riskScore: 89,
    riskLevel: 'CRITICAL',
    riskTrend: 'RISING',
    confidenceScore: 93,
    thresholdValue: 72,
    drainageDisrupted: true,
    cascadingHazard: 'Rail track embankment foundation destabilization risking multi-week lifeline disconnect to Barak Valley & Tripura.',
    keyContributingFactors: [
      { factor: 'Hydrological Saturation', contributionPct: 42, description: 'Soil matrix approaching liquid limit in clay-rich shale.' },
      { factor: 'Deep Colluvium Layer (6.5m)', contributionPct: 26, description: 'Loose overburden prone to translational slide.' },
      { factor: 'Drainage Culvert Overflow', contributionPct: 20, description: 'Debris jammed in highway culvert #14.' },
      { factor: 'Hill Cutting Angle', contributionPct: 12, description: 'Steep railway track excavation.' }
    ],
    nearbyInfrastructure: ['Lumding–Badarpur Railway Line', 'NH-27 East-West Corridor (Silchar Highway)'],
    vulnerablePopulationEst: 5400,
    lastUpdated: '15 mins ago',
    dataProvenance: 'AI PREDICTION'
  },
  {
    id: 'LOC-MZ-05',
    name: 'Bawngkawn–Durtlang Structural Ridge',
    state: 'Mizoram',
    district: 'Aizawl',
    lat: 23.7588,
    lng: 92.7360,
    slopeAngleDeg: 44,
    elevationM: 1090,
    soilMoisturePct: 69,
    soilMoistureTrend: 'STABLE',
    rainfallCurrentMm: 6.0,
    rainfall24hMm: 45.0,
    rainfall72hMm: 98.0,
    rainfallDecayMemoryMm: 72.0,
    riskScore: 54,
    riskLevel: 'MODERATE',
    riskTrend: 'DECREASING',
    confidenceScore: 87,
    thresholdValue: 60,
    drainageDisrupted: false,
    cascadingHazard: null,
    keyContributingFactors: [
      { factor: 'Urban Surcharge & Building Density', contributionPct: 35, description: 'Unregulated masonry loads on ridge shoulder.' },
      { factor: 'Siltstone-Shale Joint Dip', contributionPct: 32, description: 'Bedding strata inclined steeply westward.' },
      { factor: 'Surface Runoff Concentration', contributionPct: 18, description: 'Municipal road drains discharging onto slope face.' },
      { factor: 'Moderate Rainfall', contributionPct: 15, description: 'Intermittent morning drizzle.' }
    ],
    nearbyInfrastructure: ['Durtlang Main Road', 'Presbyterian Hospital Water Reservoirs'],
    vulnerablePopulationEst: 4200,
    lastUpdated: '40 mins ago',
    dataProvenance: 'AI PREDICTION'
  },
  {
    id: 'LOC-AR-06',
    name: 'Itanagar Zoo Road Escarpment',
    state: 'Arunachal Pradesh',
    district: 'Papum Pare',
    lat: 27.0988,
    lng: 93.6310,
    slopeAngleDeg: 40,
    elevationM: 420,
    soilMoisturePct: 58,
    soilMoistureTrend: 'STABLE',
    rainfallCurrentMm: 3.0,
    rainfall24hMm: 22.0,
    rainfall72hMm: 48.0,
    rainfallDecayMemoryMm: 36.0,
    riskScore: 32,
    riskLevel: 'LOW',
    riskTrend: 'STABLE',
    confidenceScore: 92,
    thresholdValue: 55,
    drainageDisrupted: false,
    cascadingHazard: null,
    keyContributingFactors: [
      { factor: 'Recent Retaining Wall Construction', contributionPct: 38, description: 'Stabilized bench with weeping-hole drainage channels.' },
      { factor: 'Low Cumulative Rainfall', contributionPct: 32, description: 'Rainfall remains well under localized initiation threshold.' },
      { factor: 'Vegetative Bamboo Root Binding', contributionPct: 20, description: 'Dense topsoil stabilization by native species.' },
      { factor: 'Terrain Gradient', contributionPct: 10, description: 'Engineered step terraces.' }
    ],
    nearbyInfrastructure: ['NH-415 Arterial Road', 'Itanagar Civil Hospital Access Route'],
    vulnerablePopulationEst: 950,
    lastUpdated: '1 hour ago',
    dataProvenance: 'AI PREDICTION'
  },
  {
    id: 'LOC-MN-07',
    name: 'NH-37 Tamenglong Hill Range Sector',
    state: 'Manipur',
    district: 'Tamenglong',
    lat: 24.9650,
    lng: 93.4880,
    slopeAngleDeg: 43,
    elevationM: 1150,
    soilMoisturePct: 83,
    soilMoistureTrend: 'INCREASING',
    rainfallCurrentMm: 16.0,
    rainfall24hMm: 86.0,
    rainfall72hMm: 178.0,
    rainfallDecayMemoryMm: 139.0,
    riskScore: 81,
    riskLevel: 'HIGH',
    riskTrend: 'RISING',
    confidenceScore: 90,
    thresholdValue: 68,
    drainageDisrupted: true,
    cascadingHazard: 'Irang River tributary blockage, culvert undermining along NH-37.',
    keyContributingFactors: [
      { factor: 'Barak Basin Monsoonal Swell', contributionPct: 36, description: 'Heavy moisture surge over Patkai hill range.' },
      { factor: 'Disung Flysch Formation', contributionPct: 30, description: 'Extremely weathered splintery shale liable to mudflow.' },
      { factor: 'Slope Slope (43°)', contributionPct: 22, description: 'Natural steep hillside cut for single-lane road.' },
      { factor: 'Drainage Channel Choking', contributionPct: 12, description: 'Vegetation and timber debris obstructing flow.' }
    ],
    nearbyInfrastructure: ['NH-37 Imphal–Jiribam Lifeline', 'Irang Bailey Bridge Approach'],
    vulnerablePopulationEst: 2800,
    lastUpdated: '28 mins ago',
    dataProvenance: 'AI PREDICTION'
  },
  {
    id: 'LOC-TR-08',
    name: 'Longtharai Valley Ridge Road Pass',
    state: 'Tripura',
    district: 'Dhalai',
    lat: 23.8920,
    lng: 91.9120,
    slopeAngleDeg: 34,
    elevationM: 380,
    soilMoisturePct: 62,
    soilMoistureTrend: 'STABLE',
    rainfallCurrentMm: 5.0,
    rainfall24hMm: 31.0,
    rainfall72hMm: 64.0,
    rainfallDecayMemoryMm: 48.0,
    riskScore: 41,
    riskLevel: 'LOW',
    riskTrend: 'STABLE',
    confidenceScore: 88,
    thresholdValue: 58,
    drainageDisrupted: false,
    cascadingHazard: null,
    keyContributingFactors: [
      { factor: 'Moderate Slope Inclination', contributionPct: 40, description: 'Moderate rolling terrain with clayey soil.' },
      { factor: 'Controlled Drainage Channels', contributionPct: 30, description: 'PWD concrete drains operating normally.' },
      { factor: 'Precipitation Under Threshold', contributionPct: 20, description: 'No acute cloudburst recorded.' },
      { factor: 'Dense Rubber Plantation Forest Cover', contributionPct: 10, description: 'Foliage canopy intercepting rain energy.' }
    ],
    nearbyInfrastructure: ['NH-8 Agartala–Silchar National Highway'],
    vulnerablePopulationEst: 1100,
    lastUpdated: '1 hour ago',
    dataProvenance: 'AI PREDICTION'
  }
];

export const INITIAL_ROAD_SEGMENTS: RoadSegment[] = [
  {
    id: 'ROAD-01',
    code: 'NH-29',
    name: 'Kohima–Dimapur Arterial Corridor',
    state: 'Nagaland',
    district: 'Kohima',
    coordinates: [
      [25.8600, 93.8200],
      [25.7800, 93.9200],
      [25.7022, 94.0418],
      [25.6751, 94.1086]
    ],
    status: 'BLOCKED',
    blockageProbabilityPct: 94,
    cause: 'Active rockfall & debris slide at Dzüdza Km 42+300. Clearance machines mobilizing.',
    bypassAvailable: true,
    bypassRouteName: 'Peducha–Tsiesema 10-Ton Bypass Road',
    bypassAdditionalKm: 18,
    connectedCommunities: ['Kohima City', 'Sechü Zubza', 'Chiephobozou', 'Pfutsero'],
    criticalForEmergency: true
  },
  {
    id: 'ROAD-02',
    code: 'NH-106',
    name: 'Shillong–Mawkdok–Sohra Highway',
    state: 'Meghalaya',
    district: 'East Khasi Hills',
    coordinates: [
      [25.5788, 91.8933],
      [25.4950, 91.8450],
      [25.4382, 91.8021],
      [25.2800, 91.7300]
    ],
    status: 'CAUTION',
    blockageProbabilityPct: 78,
    cause: 'Single-lane movement only due to tension cracks and minor scree deposit.',
    bypassAvailable: true,
    bypassRouteName: 'Laitmawsiang Rural PWD Link',
    bypassAdditionalKm: 12,
    connectedCommunities: ['Mawkdok', 'Cherrapunji', 'Shella', 'Pynursla'],
    criticalForEmergency: true
  },
  {
    id: 'ROAD-03',
    code: 'NH-27',
    name: 'Haflong–Jatinga Hill Pass',
    state: 'Assam',
    district: 'Dima Hasao',
    coordinates: [
      [25.1950, 93.0150],
      [25.1215, 93.0310],
      [25.0450, 92.9800]
    ],
    status: 'BLOCKED',
    blockageProbabilityPct: 88,
    cause: 'Slope failure across both carriage lanes near Jatinga tunnel portal.',
    bypassAvailable: false,
    connectedCommunities: ['Haflong', 'Mahur', 'Harangajao', 'Silchar Supply Route'],
    criticalForEmergency: true
  },
  {
    id: 'ROAD-04',
    code: 'NH-10',
    name: 'Siliguri–Singtam–Gangtok National Highway',
    state: 'Sikkim',
    district: 'Mangan',
    coordinates: [
      [27.1800, 88.5100],
      [27.2400, 88.5000],
      [27.3389, 88.6065],
      [27.4120, 88.5284]
    ],
    status: 'PASSABLE',
    blockageProbabilityPct: 35,
    bypassAvailable: true,
    bypassRouteName: 'Melli–Namchi–Gyalshing State Highway',
    bypassAdditionalKm: 24,
    connectedCommunities: ['Gangtok', 'Singtam', 'Dikchu', 'Mangan'],
    criticalForEmergency: true
  },
  {
    id: 'ROAD-05',
    code: 'NH-37',
    name: 'Imphal–Noney–Tamenglong Link',
    state: 'Manipur',
    district: 'Tamenglong',
    coordinates: [
      [24.8170, 93.9368],
      [24.8900, 93.7200],
      [24.9650, 93.4880]
    ],
    status: 'CAUTION',
    blockageProbabilityPct: 75,
    cause: 'Heavy mud and water runoff crossing pavement at Km 68.',
    bypassAvailable: true,
    bypassRouteName: 'Old Cachar Road (Light 4x4 vehicles only)',
    bypassAdditionalKm: 32,
    connectedCommunities: ['Tamenglong Town', 'Khongsang', 'Noney'],
    criticalForEmergency: true
  }
];

export const INITIAL_SHELTERS: ShelterFacility[] = [
  {
    id: 'SHL-01',
    name: 'Sechü Zubza Community Safe Shelter',
    state: 'Nagaland',
    district: 'Kohima',
    lat: 25.6890,
    lng: 94.0280,
    capacity: 450,
    currentOccupancy: 180,
    status: 'AVAILABLE',
    hasMedicalPost: true,
    hasPowerBackup: true,
    hasFoodWaterSupply: true,
    hasSanitation: true,
    officerInCharge: 'K. Angami, EAC Kohima',
    contactNumber: '+91-94360-12844'
  },
  {
    id: 'SHL-02',
    name: 'Kohima Government High School Complex',
    state: 'Nagaland',
    district: 'Kohima',
    lat: 25.6670,
    lng: 94.1120,
    capacity: 700,
    currentOccupancy: 310,
    status: 'AVAILABLE',
    hasMedicalPost: true,
    hasPowerBackup: true,
    hasFoodWaterSupply: true,
    hasSanitation: true,
    officerInCharge: 'T. Jamir, SDO Civil',
    contactNumber: '+91-94362-77192'
  },
  {
    id: 'SHL-03',
    name: 'Mawkdok Rural Emergency Center',
    state: 'Meghalaya',
    district: 'East Khasi Hills',
    lat: 25.4410,
    lng: 91.8150,
    capacity: 300,
    currentOccupancy: 240,
    status: 'NEAR_CAPACITY',
    hasMedicalPost: true,
    hasPowerBackup: true,
    hasFoodWaterSupply: true,
    hasSanitation: true,
    officerInCharge: 'Dr. P. Lyngdoh, Medical Officer',
    contactNumber: '+91-98620-44910'
  },
  {
    id: 'SHL-04',
    name: 'Haflong Multi-Purpose Indoor Stadium',
    state: 'Assam',
    district: 'Dima Hasao',
    lat: 25.1780,
    lng: 93.0180,
    capacity: 1200,
    currentOccupancy: 650,
    status: 'AVAILABLE',
    hasMedicalPost: true,
    hasPowerBackup: true,
    hasFoodWaterSupply: true,
    hasSanitation: true,
    officerInCharge: 'R. Thaosen, DDMA Project Officer',
    contactNumber: '+91-94350-88321'
  },
  {
    id: 'SHL-05',
    name: 'Dikchu Secondary School Shelter',
    state: 'Sikkim',
    district: 'Mangan',
    lat: 27.4180,
    lng: 88.5350,
    capacity: 350,
    currentOccupancy: 95,
    status: 'AVAILABLE',
    hasMedicalPost: true,
    hasPowerBackup: true,
    hasFoodWaterSupply: true,
    hasSanitation: true,
    officerInCharge: 'S. Bhutia, Revenue Officer',
    contactNumber: '+91-97330-55120'
  }
];

export const INITIAL_FIELD_REPORTS: FieldReport[] = [
  {
    id: 'REP-01',
    timestamp: '18 minutes ago',
    lat: 25.7040,
    lng: 94.0435,
    locationName: 'Dzüdza Highway Slope Ch. 42+150',
    state: 'Nagaland',
    district: 'Kohima',
    category: 'SLOPE_CRACK',
    severity: 'CRITICAL',
    reporterType: 'FIELD_SURVEYOR',
    description: 'Fresh 12-meter transverse tension crack opened above retaining wall #4. Width 8-15cm with visible downward displacement.',
    verifiedByAuthority: true,
    elevationM: 1475
  },
  {
    id: 'REP-02',
    timestamp: '32 minutes ago',
    lat: 25.4360,
    lng: 91.8040,
    locationName: 'Mawkdok Viewpoint Cut-Slope',
    state: 'Meghalaya',
    district: 'East Khasi Hills',
    category: 'ROCKFALL',
    severity: 'HIGH',
    reporterType: 'CITIZEN',
    description: 'Boulders (approx 0.5-1m diameter) rolling down onto outer shoulder. Trees leaning at 25-degree angle.',
    verifiedByAuthority: true,
    elevationM: 1670
  },
  {
    id: 'REP-03',
    timestamp: '47 minutes ago',
    lat: 25.1230,
    lng: 93.0290,
    locationName: 'Jatinga Rail Tunnel North Approach',
    state: 'Assam',
    district: 'Dima Hasao',
    category: 'BLOCKED_CULVERT',
    severity: 'CRITICAL',
    reporterType: 'RESCUE_PERSONNEL',
    description: 'Culvert clogged with mud slurry and logs. Water washing over rail embankment foundation.',
    verifiedByAuthority: true,
    elevationM: 615
  },
  {
    id: 'REP-04',
    timestamp: '1 hour ago',
    lat: 24.9680,
    lng: 93.4860,
    locationName: 'Tamenglong NH-37 Km 69',
    state: 'Manipur',
    district: 'Tamenglong',
    category: 'WATER_SEEPAGE',
    severity: 'MODERATE',
    reporterType: 'FIELD_SURVEYOR',
    description: 'Muddy brown spring water gushing out from toe of slope, indicating severe internal pore pressure.',
    verifiedByAuthority: true,
    elevationM: 1140
  }
];

export const INITIAL_BULLETINS: EmergencyBulletin[] = [
  {
    id: 'BUL-2026-09-01',
    title: 'RED ALERT: Critical Slope Failure Warning for NH-29 Kohima Corridor',
    severity: 'CRITICAL',
    targetState: 'Nagaland',
    targetDistricts: ['Kohima', 'Dimapur', 'Phek'],
    issuedAt: '2026-09-15 11:15 IST',
    validUntil: '2026-09-16 18:00 IST',
    summary: 'Antecedent rainfall has exceeded 238mm in 72h. AI Slope Deterioration Engine flags 92% failure probability at Dzüdza River S-Bend.',
    instructions: [
      'IMMEDIATE ACTION: Halt all non-essential heavy commercial transit on NH-29 between Sechü Zubza and Kohima.',
      'Divert emergency light vehicles via Peducha–Tsiesema bypass route.',
      'SDRF & Border Roads Organisation (BRO) quick-response excavators stationed at Zubza junction.',
      'Downstream riverside habitations alerted for potential debris damming burst.'
    ],
    issuedBy: 'Nagaland State Disaster Management Authority (NSDMA) & SEOC'
  },
  {
    id: 'BUL-2026-09-02',
    title: 'ORANGE WARNING: High Landslide Vulnerability in Dima Hasao & Jatinga',
    severity: 'HIGH',
    targetState: 'Assam',
    targetDistricts: ['Dima Hasao', 'Cachar'],
    issuedAt: '2026-09-15 10:45 IST',
    validUntil: '2026-09-16 12:00 IST',
    summary: 'Sustained rain across Barail Range has brought soil saturation to 86%. Rail and highway infrastructure under high risk.',
    instructions: [
      'N.F. Railway cautioned on speed restrictions between New Haflong and Jatinga.',
      'PWD quick response clearance team on 24x7 alert at Haflong headquarters.',
      'Villagers near steep hillsides advised to move to identified community shelters.'
    ],
    issuedBy: 'Assam State Disaster Management Authority (ASDMA)'
  }
];

export const INITIAL_INFRASTRUCTURE: InfrastructureItem[] = [
  // Hospitals / Trauma Centers
  {
    id: 'INF-HOSP-01',
    name: 'Naga Hospital Authority Kohima (NHAK)',
    type: 'HOSPITAL',
    lat: 25.6690,
    lng: 94.1030,
    state: 'Nagaland',
    district: 'Kohima',
    status: 'OPERATIONAL',
    details: 'Regional Level 1 Trauma Center • 350 Beds • Heli-pad equipped'
  },
  {
    id: 'INF-HOSP-02',
    name: 'Haflong Civil District Hospital',
    type: 'HOSPITAL',
    lat: 25.1780,
    lng: 93.0210,
    state: 'Assam',
    district: 'Dima Hasao',
    status: 'WARNING',
    details: 'District Emergency Center • Emergency backup generator active'
  },
  {
    id: 'INF-HOSP-03',
    name: 'Shillong Civil Hospital',
    type: 'HOSPITAL',
    lat: 25.5740,
    lng: 91.8840,
    state: 'Meghalaya',
    district: 'East Khasi Hills',
    status: 'OPERATIONAL',
    details: 'State Referral Hospital • 50 ICU Beds • Dedicated disaster response wing'
  },
  {
    id: 'INF-HOSP-04',
    name: 'STNM Multispeciality Hospital Gangtok',
    type: 'HOSPITAL',
    lat: 27.3250,
    lng: 88.6010,
    state: 'Sikkim',
    district: 'Gangtok',
    status: 'OPERATIONAL',
    details: 'State Apex Hospital • 1000 Beds • High-altitude trauma center'
  },
  // Bridges / Critical Corridors
  {
    id: 'INF-BRG-01',
    name: 'Dzüdza River Bridge (NH-29)',
    type: 'BRIDGE',
    lat: 25.6880,
    lng: 94.0410,
    state: 'Nagaland',
    district: 'Kohima',
    status: 'WARNING',
    details: 'Pre-stressed girder • Debris build-up risk at pier foundation'
  },
  {
    id: 'INF-BRG-02',
    name: 'Umiam River Spillway Bridge',
    type: 'BRIDGE',
    lat: 25.6540,
    lng: 91.9020,
    state: 'Meghalaya',
    district: 'Ri-Bhoi',
    status: 'OPERATIONAL',
    details: 'GS Road NH-6 lifeline connector • Monitored water clearance: 4.8m'
  },
  {
    id: 'INF-BRG-03',
    name: 'Teesta River Steel Suspension Bridge',
    type: 'BRIDGE',
    lat: 27.2450,
    lng: 88.5120,
    state: 'Sikkim',
    district: 'Mangan',
    status: 'WARNING',
    details: 'Singtam-Mangan lifeline bridge • Structural sensor monitoring active'
  },
  // Major River / Waterway Basins
  {
    id: 'INF-RIV-01',
    name: 'Dzüdza River Torrents',
    type: 'RIVER',
    lat: 25.6900,
    lng: 94.0350,
    state: 'Nagaland',
    district: 'Kohima',
    status: 'WARNING',
    details: 'Flash discharge basin • Flow rate: 42 m³/s • High debris transport'
  },
  {
    id: 'INF-RIV-02',
    name: 'Jatinga River Rapids',
    type: 'RIVER',
    lat: 25.1100,
    lng: 93.0450,
    state: 'Assam',
    district: 'Dima Hasao',
    status: 'WARNING',
    details: 'Barail mountain drainage gorge • High erosion risk at river banks'
  },
  {
    id: 'INF-RIV-03',
    name: 'Teesta River Floodway',
    type: 'RIVER',
    lat: 27.2800,
    lng: 88.5200,
    state: 'Sikkim',
    district: 'Mangan',
    status: 'SUBMERGED',
    details: 'Flash flood vulnerability zone • Heavy siltation from upstream glacial runoff'
  },
  // Key Hill Settlements
  {
    id: 'INF-SET-01',
    name: 'Sechü Zubza Hill Town',
    type: 'SETTLEMENT',
    lat: 25.6840,
    lng: 94.0480,
    state: 'Nagaland',
    district: 'Kohima',
    status: 'WARNING',
    details: 'Pop: 4,800 • Hillside settlement along NH-29 • Evacuation staging point'
  },
  {
    id: 'INF-SET-02',
    name: 'Jatinga Village Settlement',
    type: 'SETTLEMENT',
    lat: 25.1167,
    lng: 93.0333,
    state: 'Assam',
    district: 'Dima Hasao',
    status: 'WARNING',
    details: 'Pop: 2,900 • Ridge-top village • Proximity to active rail tunnel slope'
  },
  {
    id: 'INF-SET-03',
    name: 'Chungthang Town Confluence',
    type: 'SETTLEMENT',
    lat: 27.6040,
    lng: 88.6470,
    state: 'Sikkim',
    district: 'Mangan',
    status: 'ISOLATED',
    details: 'Pop: 3,200 • High-altitude confluence town • Hydro power transit hub'
  }
];

