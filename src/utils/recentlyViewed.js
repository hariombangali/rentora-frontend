const KEY = "recently_viewed_v1";
const MAX = 12;

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list;
  } catch (e) {
    return [];
  }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch (e) { /* quota */ }
}

export function trackView(property) {
  if (!property?._id) return;
  const entry = {
    _id: property._id,
    title: property.title,
    price: property.price,
    bedrooms: property.bedrooms,
    furnishing: property.furnishing,
    attachedBathroom: property.attachedBathroom,
    image: property.images?.[0] || null,
    locality: property.location?.locality || property.locality,
    city: property.location?.city || property.city || "Indore",
    viewedAt: Date.now(),
  };
  const existing = read().filter((p) => p._id !== entry._id);
  write([entry, ...existing]);
}

export function getRecentlyViewed() {
  return read();
}

export function clearRecentlyViewed() {
  try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
}
