import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, ZoomControl } from "react-leaflet";
import { Link } from "react-router-dom";
import L from "leaflet";
import API from "../services/api";

const initialPosition = [22.7196, 75.8577];

const compactPrice = (value) => {
  const price = Number(value) || 0;
  if (price >= 100000) {
    const lakhs = price / 100000;
    return `Rs ${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1)}L`;
  }
  if (price >= 1000) return `Rs ${Math.round(price / 1000)}k`;
  return `Rs ${price.toLocaleString("en-IN")}`;
};

const createPriceIcon = (label) =>
  L.divIcon({
    className: "rentora-price-marker-wrap",
    html: `
      <div class="rentora-price-marker">
        <div class="rentora-price-marker__pill">${label}</div>
        <div class="rentora-price-marker__dot"></div>
      </div>
    `,
    iconSize: [84, 46],
    iconAnchor: [42, 42],
    popupAnchor: [0, -40],
  });

const imageFor = (property) => {
  const image = property.images?.[0];
  if (!image) return "/default-property.jpg";
  if (/^https?:\/\//i.test(image) || image.startsWith("/")) return image;

  const assetBase = (API.defaults.baseURL || "").replace(/\/api\/?$/, "");
  return `${assetBase}/uploads/${image}`;
};

const normalizeProperty = (property) => {
  const coords = property.location?.coordinates || property.location?.point?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;

  const lng = Number(coords[0]);
  const lat = Number(coords[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    ...property,
    lat,
    lng,
    locationLabel: [property.location?.locality, property.location?.city].filter(Boolean).join(", ") || "Indore",
  };
};

export default function PropertiesMap({ properties: providedProperties, className = "" }) {
  const [fetchedProperties, setFetchedProperties] = useState([]);

  useEffect(() => {
    if (providedProperties) return;

    const fetchPropertiesForMap = async () => {
      try {
        const res = await API.get("/properties/map-locations");
        setFetchedProperties(res.data);
      } catch (error) {
        console.error("Failed to fetch properties for map:", error);
      }
    };

    fetchPropertiesForMap();
  }, [providedProperties]);

  const mapProperties = useMemo(() => {
    const source = providedProperties || fetchedProperties;
    return (source || [])
      .map(normalizeProperty)
      .filter(Boolean)
      .map((property) => ({
        ...property,
        icon: createPriceIcon(compactPrice(property.price)),
      }));
  }, [providedProperties, fetchedProperties]);

  return (
    <MapContainer
      center={initialPosition}
      zoom={12}
      minZoom={11}
      maxZoom={17}
      zoomControl={false}
      scrollWheelZoom={false}
      className={`rentora-map ${className}`}
      style={{ height: "100%", width: "100%" }}
    >
      <ZoomControl position="bottomright" />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />

      {mapProperties.map((property) => (
        <Marker
          key={property._id}
          position={[property.lat, property.lng]}
          icon={property.icon}
          riseOnHover
        >
          <Popup className="rentora-map-popup" maxWidth={260}>
            <div className="rentora-popup-card">
              <img src={imageFor(property)} alt={property.title} className="rentora-popup-card__image" />
              <div className="rentora-popup-card__body">
                <div className="rentora-popup-card__meta">{property.locationLabel}</div>
                <h4 className="rentora-popup-card__title">{property.title}</h4>
                <div className="rentora-popup-card__footer">
                  <span className="rentora-popup-card__price">{compactPrice(property.price)}/mo</span>
                  <Link to={`/properties/${property._id}`} className="rentora-popup-card__link">
                    View
                  </Link>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
