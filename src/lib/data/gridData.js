export const gridLines = [
  {
    id: 'L101',
    name: 'Sector 4 Feeder',
    status: 'ok',
    voltage: '11kV',
    load: '45%',
    path: [
      { lat: 12.9716, lng: 77.5946 },
      { lat: 12.9750, lng: 77.6000 },
      { lat: 12.9800, lng: 77.6100 }
    ]
  },
  {
    id: 'L102',
    name: 'Industrial Zone Main',
    status: 'damaged',
    voltage: '33kV',
    load: '0%',
    damageType: 'Line Break',
    damageLocation: { lat: 12.9650, lng: 77.5900 },
    path: [
      { lat: 12.9716, lng: 77.5946 },
      { lat: 12.9600, lng: 77.5800 },
      { lat: 12.9500, lng: 77.5700 }
    ]
  },
  {
    id: 'L103',
    name: 'Residential Loop A',
    status: 'ok',
    voltage: '11kV',
    load: '78%',
    path: [
      { lat: 12.9716, lng: 77.5946 },
      { lat: 12.9800, lng: 77.5900 },
      { lat: 12.9850, lng: 77.5850 },
      { lat: 12.9900, lng: 77.5800 }
    ]
  },
  {
    id: 'L104',
    name: 'Eastern Backup',
    status: 'warning',
    voltage: '11kV',
    load: '92%',
    path: [
      { lat: 12.9800, lng: 77.6100 },
      { lat: 12.9850, lng: 77.6200 },
      { lat: 12.9820, lng: 77.6300 }
    ]
  }
];
