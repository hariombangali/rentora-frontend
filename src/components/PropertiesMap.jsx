import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import API from '../services/api';

// --- FIX FOR BROKEN MARKER ICONS ---
// This code manually re-imports the default marker icons from the 'leaflet' package.
// This is the standard fix for the issue where default markers don't appear
// when using a bundler like Vite or Webpack.
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});



export default function PropertiesMap() {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const fetchPropertiesForMap = async () => {
      try {
        const res = await API.get('/properties/map-locations');
        setProperties(res.data);
      } catch (error) {
        console.error("Failed to fetch properties for map:", error);
      }
    };
    fetchPropertiesForMap();
  }, []);

  

  // Set the initial map position (e.g., center of Indore)
  const initialPosition = [22.7196, 75.8577];

  return (
    <MapContainer center={initialPosition} zoom={12} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
{properties.map((property) => {
  const coords = property.location?.coordinates;
  if (!coords || coords.length < 2) return null; // Skip if invalid

  const lat = coords[1];
  const lng = coords[0];

  // Extra safety: ensure they are numbers
  if (typeof lat !== "number" || typeof lng !== "number") return null;

  return (
    <Marker
      key={property._id}
      position={[lat, lng]}
    >
      <Popup>
        <div className="w-48">
          <img 
            src={property.images?.[0] 
              ? `${API.defaults.baseURL.replace('/api', '')}/uploads/${property.images[0]}`
              : '/default-property.jpg'
            }
            alt={property.title}
            className="w-full h-24 object-cover rounded-md mb-2"
          />
          <h4 className="font-bold text-md mb-1 line-clamp-1">{property.title}</h4>
          <p className="text-sm text-gray-700 mb-2">
            {`₹${property.price.toLocaleString('en-IN')}/mo`}
          </p>
          <Link to={`/properties/${property._id}`} className="text-blue-600 font-semibold hover:underline">
            View Details →
          </Link>
        </div>
      </Popup>
    </Marker>
  );
})}

    </MapContainer>
  );
}
