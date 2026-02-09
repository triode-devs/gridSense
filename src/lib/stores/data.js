export const dashboardData = {
    totalLoad: 450, // MW
    gridFrequency: 50.02, // Hz
    activeFaults: 3,
    scheduledShutdowns: 2
};

export const liveFaults = [
    { id: 'F-102', location: 'Anna Nagar Main Line', type: 'Line Break', severity: 'Critical', time: '10:23 AM', status: 'Pending' },
    { id: 'F-103', location: 'Kumbakonam East', type: 'Voltage Fluctuation', severity: 'Warning', time: '11:45 AM', status: 'Investigating' },
    { id: 'F-104', location: 'Salem Ind. Estate', type: 'Transformer Overload', severity: 'Critical', time: '01:10 PM', status: 'Pending' },
    { id: 'F-105', location: 'Trichy Road', type: 'Feeder Trip', severity: 'Low', time: '09:00 AM', status: 'Resolved' },
];

export const shutdowns = [
    { id: 1, area: 'Gandhi Puram Zone A', time: '10:00 AM - 02:00 PM', reason: 'Maintenance' },
    { id: 2, area: 'West Mambalam', time: '04:00 PM - 06:00 PM', reason: 'Line Upgradation' }
];

export const areaUsage = [
    { name: 'North Circle', units: 12540, load: 85, status: 'High' },
    { name: 'South Circle', units: 8400, load: 45, status: 'Normal' },
    { name: 'Industrial Hub', units: 45200, load: 92, status: 'Overload' },
    { name: 'Tech Park', units: 21000, load: 60, status: 'Normal' },
    { name: 'Rural Belt', units: 5300, load: 30, status: 'Low' },
];

export const faultsList = [
    {
        id: 'T-102',
        location: 'Anna Nagar Main Line',
        type: 'Line Break',
        severity: 'Critical',
        time: '10:23 AM',
        status: 'Pending',
        transformerId: 'TF-AN-01',
        description: 'Main transmission line snap detected near Sector 4 junction.',
        affectedConsumers: 450,
        assignedTo: 'Unassigned'
    },
    {
        id: 'T-103',
        location: 'Kumbakonam East',
        type: 'Voltage Fluctuation',
        severity: 'Warning',
        time: '11:45 AM',
        status: 'Investigating',
        transformerId: 'TF-KB-05',
        description: 'Reported voltage surges causing appliance damage.',
        affectedConsumers: 120,
        assignedTo: 'Rajesh Kumar'
    },
    {
        id: 'T-104',
        location: 'Salem Ind. Estate',
        type: 'Transformer Overload',
        severity: 'Critical',
        time: '01:10 PM',
        status: 'Pending',
        transformerId: 'TF-SL-99',
        description: 'Oil temperature exceeds safe limits. Risk of explosion.',
        affectedConsumers: 15,
        assignedTo: 'Unassigned'
    },
    {
        id: 'T-105',
        location: 'Trichy Road',
        type: 'Feeder Trip',
        severity: 'Low',
        time: '09:00 AM',
        status: 'Resolved',
        transformerId: 'TF-TR-12',
        description: 'Minor feeder trip due to bird contact.',
        affectedConsumers: 0,
        assignedTo: 'System Auto-Reset'
    },
];

export const transformerDetails = {
    'TF-AN-01': {
        id: 'TF-AN-01',
        capacity: '500 kVA',
        load: '92%',
        temperature: '78°C',
        lastMaintenance: '2023-11-15',
        lines: [
            { id: 'L1', name: 'Sector 4 North', status: 'Offline', load: 0, poles: 12 },
            { id: 'L2', name: 'Sector 4 South', status: 'Online', load: 45, poles: 8 },
            { id: 'L3', name: 'Market Road', status: 'Online', load: 60, poles: 15 },
        ],
        connectedHouses: [
            { id: 'H-101', owner: 'R. Sharma', mobile: '9876543210', address: '12/4 Main St', type: 'Household', status: 'No Power', load: '0 kW' },
            { id: 'H-102', owner: 'K. Venu', mobile: '9876543211', address: '13/4 Main St', type: 'Household', status: 'No Power', load: '0 kW' },
            { id: 'H-103', owner: 'City Bakery', mobile: '9876543212', address: '14/4 Main St', type: 'Commercial', status: 'Partial', load: '2 kW' },
            { id: 'H-104', owner: 'Govt School', mobile: '9876543213', address: '15/4 Main St', type: 'Household', status: 'No Power', load: '0 kW' },
            { id: 'H-105', owner: 'Green Farm', mobile: '9876543214', address: '16/4 Main St', type: 'Agricultural', status: 'No Power', load: '0 kW' },
        ]
    },
    'TF-SL-99': {
        id: 'TF-SL-99',
        capacity: '1000 kVA',
        load: '110%',
        temperature: '95°C',
        lastMaintenance: '2023-01-20',
        lines: [
            { id: 'L1', name: 'Factory Zone A', status: 'Overload', load: 110, poles: 20 },
            { id: 'L2', name: 'Factory Zone B', status: 'Warning', load: 95, poles: 18 },
        ],
        connectedHouses: [
            { id: 'IND-01', owner: 'Steelworks Ltd', mobile: '9876543220', address: 'Plot 44', type: 'Commercial', status: 'Low Voltage', load: '450 kW' },
            { id: 'IND-02', owner: 'Textile Mills', mobile: '9876543221', address: 'Plot 45', type: 'Commercial', status: 'Low Voltage', load: '320 kW' },
            { id: 'IND-03', owner: 'Evergreen Nursery', mobile: '9876543222', address: 'Plot 46', type: 'Agricultural', status: 'Normal', load: '15 kW' },
        ]
    }
};

export const consumersData = [
    {
        id: 'H-101',
        type: 'Household',
        owner: 'R. Sharma',
        mobile: '9876543210',
        address: '12/4 Main St',
        status: 'No Power',
        transformerId: 'TF-AN-01',
        usage: {
            monthly: [120, 115, 130, 125, 140, 160, 155, 130, 120, 110, 115, 125], // Jan-Dec
            yearly: [1450, 1520, 1480] // 2023, 2024, 2025
        },
        bills: [
            { month: 'Jan', amount: 450, status: 'Paid' },
            { month: 'Feb', amount: 420, status: 'Unpaid' }
        ]
    },
    {
        id: 'H-102',
        type: 'Household',
        owner: 'K. Venu',
        mobile: '9876543211',
        address: '13/4 Main St',
        status: 'No Power',
        transformerId: 'TF-AN-01',
        usage: {
            monthly: [90, 85, 95, 100, 110, 120, 115, 100, 95, 90, 85, 90],
            yearly: [1100, 1150, 1200]
        },
        bills: [{ month: 'Jan', amount: 300, status: 'Paid' }]
    },
    {
        id: 'H-103',
        type: 'Commercial',
        owner: 'City Bakery',
        mobile: '9876543212',
        address: '14/4 Main St',
        status: 'Partial',
        transformerId: 'TF-AN-01',
        usage: {
            monthly: [800, 820, 850, 900, 950, 980, 920, 880, 850, 830, 810, 800],
            yearly: [10500, 11000, 11200]
        },
        bills: [{ month: 'Jan', amount: 8500, status: 'Paid' }]
    },
    {
        id: 'H-105',
        type: 'Agricultural',
        owner: 'Green Farm',
        mobile: '9876543214',
        address: '16/4 Main St',
        status: 'No Power',
        transformerId: 'TF-AN-01',
        usage: {
            monthly: [400, 420, 450, 600, 650, 700, 600, 500, 450, 420, 400, 410],
            yearly: [5000, 5500, 6000]
        },
        bills: [{ month: 'Jan', amount: 0, status: 'Free' }] // Agri is free
    },
    {
        id: 'IND-01',
        type: 'Commercial',
        owner: 'Steelworks Ltd',
        mobile: '9876543220',
        address: 'Plot 44',
        status: 'Low Voltage',
        transformerId: 'TF-SL-99',
        usage: {
            monthly: [5000, 5200, 5100, 5300, 5500, 5600, 5400, 5200, 5100, 5000, 5100, 5200],
            yearly: [60000, 62000, 63000]
        },
        bills: [{ month: 'Jan', amount: 55000, status: 'Paid' }]
    },
    // Add a multi-connection owner example
    {
        id: 'H-199',
        type: 'Household',
        owner: 'R. Sharma', // Same owner as H-101
        mobile: '9876543210',
        address: '22/B Lake View',
        status: 'Online',
        transformerId: 'TF-KB-05',
        usage: {
            monthly: [200, 210, 220, 230, 240, 250, 240, 230, 220, 210, 200, 210],
            yearly: [2500, 2600, 2700]
        },
        bills: [{ month: 'Jan', amount: 800, status: 'Paid' }]
    },
];
