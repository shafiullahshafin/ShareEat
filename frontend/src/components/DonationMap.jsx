import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fixes default marker icon issue in React-Leaflet.
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const DonationMap = ({ donor, recipient }) => {
  // Sets default center to Dhaka if no coordinates provided.
  const defaultCenter = [23.8103, 90.4125];
  
  const donorCoords = donor?.latitude && donor?.longitude 
    ? [parseFloat(donor.latitude), parseFloat(donor.longitude)] 
    : null;
    
  const recipientCoords = recipient?.latitude && recipient?.longitude 
    ? [parseFloat(recipient.latitude), parseFloat(recipient.longitude)] 
    : null;

  // Calculates map center to fit both points.
  let center = defaultCenter;
  let zoom = 13;

  if (donorCoords && recipientCoords) {
    center = [
      (donorCoords[0] + recipientCoords[0]) / 2,
      (donorCoords[1] + recipientCoords[1]) / 2
    ];
  } else if (donorCoords) {
    center = donorCoords;
  } else if (recipientCoords) {
    center = recipientCoords;
  }

  return (
    <div className="h-96 w-full rounded-xl overflow-hidden shadow-lg border border-dark-700 z-0">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {donorCoords && (
          <Marker position={donorCoords}>
            <Popup>
              <div className="text-sm font-semibold">Pickup: {donor.business_name}</div>
              <div className="text-xs">{donor.address}</div>
            </Popup>
          </Marker>
        )}

        {recipientCoords && (
          <Marker position={recipientCoords}>
             <Popup>
              <div className="text-sm font-semibold">Deliver: {recipient.organization_name}</div>
              <div className="text-xs">{recipient.address}</div>
            </Popup>
          </Marker>
        )}

        {donorCoords && recipientCoords && (
          <Polyline 
            positions={[donorCoords, recipientCoords]} 
            color="#10B981" // Brand green
            dashArray="10, 10" 
            weight={3} 
          />
        )}
      </MapContainer>
    </div>
  );
};

export default DonationMap;
