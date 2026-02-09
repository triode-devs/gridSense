export const gridLines = [
  {
    id: 'L101',
    name: 'Sector 4 Feeder',
    status: 'ok',
    voltage: '11kV',
    load: '45%',
    path: [
      { lat: 12.9716, lng: 77.5946 }, // Substation
      { lat: 12.9725, lng: 77.5960 }, // Pole 1
      { lat: 12.9734, lng: 77.5974 }, // Pole 2
      { lat: 12.9743, lng: 77.5988 }, // Pole 3
      { lat: 12.9750, lng: 77.6000 }, // Junction Pole
      { lat: 12.9766, lng: 77.6033 }, // Pole 4
      { lat: 12.9783, lng: 77.6066 }, // Pole 5
      { lat: 12.9800, lng: 77.6100 }  // End Transformer
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
      { lat: 12.9680, lng: 77.5930 },
      { lat: 12.9650, lng: 77.5900 }, // Break Point
      { lat: 12.9625, lng: 77.5850 },
      { lat: 12.9600, lng: 77.5800 },
      { lat: 12.9550, lng: 77.5750 },
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
      { lat: 12.9740, lng: 77.5930 },
      { lat: 12.9770, lng: 77.5915 },
      { lat: 12.9800, lng: 77.5900 },
      { lat: 12.9825, lng: 77.5875 },
      { lat: 12.9850, lng: 77.5850 },
      { lat: 12.9875, lng: 77.5825 },
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
      { lat: 12.9816, lng: 77.6133 },
      { lat: 12.9833, lng: 77.6166 },
      { lat: 12.9850, lng: 77.6200 },
      { lat: 12.9840, lng: 77.6233 },
      { lat: 12.9830, lng: 77.6266 },
      { lat: 12.9820, lng: 77.6300 }
    ]
  }
];
