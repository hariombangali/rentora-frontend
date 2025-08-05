import { useEffect, useState } from "react";
import API from "../../services/api";

export default function AllProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [processingIds, setProcessingIds] = useState(new Set());

  const BACKEND_URL = API.defaults.baseURL.replace("/api", "");

  useEffect(() => {
    fetchAllProps();
  }, []);

  async function fetchAllProps() {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/admin/all-properties", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProperties(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load properties");
    } finally {
      setLoading(false);
    }
  }

  const updateProcessing = (id, isProcessing) => {
    setProcessingIds((prev) => {
      const newSet = new Set(prev);
      if (isProcessing) newSet.add(id);
      else newSet.delete(id);
      return newSet;
    });
  };

  // Handlers with placeholders — you may expand these with modals or confirmation as needed
  async function approveProperty(id) {
    if (!window.confirm("Approve this property?")) return;
    updateProcessing(id, true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      await API.put(`/admin/approve-property/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProperties((props) =>
        props.map((p) =>
          p._id === id ? { ...p, approved: true, rejected: false, rejectionReason: "" } : p
        )
      );
    } catch (e) {
      setError(e.response?.data?.message || "Failed to approve property");
    } finally {
      updateProcessing(id, false);
    }
  }

  async function rejectProperty(id) {
    const reason = prompt("Enter reason for rejection:", "");
    if (reason === null || reason.trim() === "") {
      alert("Rejection reason is required.");
      return;
    }
    updateProcessing(id, true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      await API.post(
        `/admin/reject-property/${id}`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProperties((props) =>
        props.map((p) =>
          p._id === id ? { ...p, approved: false, rejected: true, rejectionReason: reason } : p
        )
      );
      // If modal open for this property, close it
      if (selectedProperty?._id === id) setSelectedProperty(null);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to reject property");
    } finally {
      updateProcessing(id, false);
    }
  }

  async function deleteProperty(id) {
    if (!window.confirm("Are you sure you want to delete this property?")) return;
    updateProcessing(id, true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      await API.delete(`/admin/delete-property/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProperties((props) => props.filter((p) => p._id !== id));
      if (selectedProperty?._id === id) setSelectedProperty(null);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to delete property");
    } finally {
      updateProcessing(id, false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">All Properties (Admin)</h2>

      {loading && <div>Loading properties...</div>}
      {error && <div className="text-red-600 mb-4">{error}</div>}

      {!loading && properties.length === 0 && <div>No properties found.</div>}

      {!loading && properties.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-gray-200">
            <thead>
              <tr className="bg-blue-100 text-blue-900">
                <th className="py-2 px-3 border border-gray-300 text-left">Title</th>
                <th className="py-2 px-3 border border-gray-300 text-left">Owner</th>
                <th className="py-2 px-3 border border-gray-300 text-left">Type</th>
                <th className="py-2 px-3 border border-gray-300 text-left">Status</th>
                <th className="py-2 px-3 border border-gray-300 text-left">City</th>
                <th className="py-2 px-3 border border-gray-300 text-left">Price</th>
                <th className="py-2 px-3 border border-gray-300 text-left">Created</th>
                <th className="py-2 px-3 border border-gray-300 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => {
                const isProcessing = processingIds.has(p._id);
                let statusBadge, statusTitle;
                if (p.approved) {
                  statusBadge = "bg-green-200 text-green-800";
                  statusTitle = "Approved";
                } else if (p.rejected) {
                  statusBadge = "bg-red-200 text-red-800 cursor-help";
                  statusTitle = `Rejected: ${p.rejectionReason || "No reason provided"}`;
                } else {
                  statusBadge = "bg-yellow-100 text-yellow-700";
                  statusTitle = "Pending";
                }
                return (
                  <tr
                    key={p._id}
                    className="border-b border-gray-200 hover:bg-blue-50 transition"
                    title={p.rejected ? statusTitle : undefined}
                  >
                    <td className="py-2 px-3 border border-gray-300">{p.title}</td>
                    <td className="py-2 px-3 border border-gray-300">{p.ownerKYC?.ownerName || "N/A"}</td>
                    <td className="py-2 px-3 border border-gray-300">{p.type}</td>
                    <td className="py-2 px-3 border border-gray-300">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge}`}
                        title={p.rejected ? statusTitle : undefined}
                      >
                        {p.approved ? "Approved" : p.rejected ? "Rejected" : "Pending"}
                      </span>
                    </td>
                    <td className="py-2 px-3 border border-gray-300">{p.location?.city || "N/A"}</td>
                    <td className="py-2 px-3 border border-gray-300">₹{p.price}</td>
                    <td className="py-2 px-3 border border-gray-300">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="py-2 px-3 border border-gray-300 flex flex-wrap gap-1">
                      {!p.approved && !p.rejected && (
                        <>
                          <button
                            disabled={isProcessing}
                            onClick={() => approveProperty(p._id)}
                            className="bg-green-600 text-white text-xs px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                            title="Approve Property"
                          >
                            Approve
                          </button>
                          <button
                            disabled={isProcessing}
                            onClick={() => rejectProperty(p._id)}
                            className="bg-red-600 text-white text-xs px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                            title="Reject Property"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setSelectedProperty(p)}
                        className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700"
                        title="View Details"
                      >
                        View
                      </button>
                      <button
                        disabled={isProcessing}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Are you sure you want to delete property "${p.title}"?`
                            )
                          ) {
                            deleteProperty(p._id);
                          }
                        }}
                        className="bg-gray-600 text-white text-xs px-2 py-1 rounded hover:bg-gray-700 disabled:opacity-50"
                        title="Delete Property"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for property details */}
{selectedProperty && (
  <div
    onClick={() => setSelectedProperty(null)}
    className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center overflow-auto p-4"
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="relative bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-gray-200"
    >
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <h2 className="text-3xl font-extrabold text-gray-900 truncate max-w-[80%]">
          {selectedProperty.title || "Property Details"}
        </h2>
        <button
          onClick={() => setSelectedProperty(null)}
          className="text-gray-400 hover:text-gray-700 transition"
          aria-label="Close modal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-8">
        {/* Summary Info */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Property Overview</h3>
            <ul className="text-gray-700 space-y-1">
              <li><span className="font-semibold">Type:</span> {selectedProperty.type || "-"}</li>
              <li><span className="font-semibold">Furnishing:</span> {selectedProperty.furnishing || "-"}</li>
              <li><span className="font-semibold">Tenants:</span> {selectedProperty.tenants || "-"}</li>
              <li><span className="font-semibold">Monthly Rent:</span> ₹{selectedProperty.price?.toLocaleString() || "-"}</li>
              <li><span className="font-semibold">Deposit:</span> ₹{selectedProperty.deposit?.toLocaleString() || "N/A"}</li>
              <li><span className="font-semibold">Available From:</span> {selectedProperty.availableFrom ? new Date(selectedProperty.availableFrom).toLocaleDateString() : "-"}</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Location</h3>
            <ul className="text-gray-700 space-y-1">
              <li><span className="font-semibold">City:</span> {selectedProperty.location?.city || "-"}</li>
              <li><span className="font-semibold">Locality:</span> {selectedProperty.location?.locality || "-"}</li>
              <li><span className="font-semibold">Address:</span> {selectedProperty.location?.address || "-"}</li>
              <li><span className="font-semibold">Pincode:</span> {selectedProperty.location?.pincode || "-"}</li>
            </ul>
          </div>
        </section>

        {/* Description */}
        <section>
          <h3 className="text-xl font-semibold mb-3 text-gray-800">Description</h3>
          <p className="whitespace-pre-line text-gray-700">{selectedProperty.description || "-"}</p>
        </section>

        {/* Amenities */}
        <section>
          <h3 className="text-xl font-semibold mb-3 text-gray-800">Amenities</h3>
          {selectedProperty.amenities && selectedProperty.amenities.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {selectedProperty.amenities.map((amenity, idx) => (
                <li key={idx} className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full shadow-sm">
                  {amenity}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No amenities listed.</p>
          )}
        </section>

        {/* Images gallery */}
        <section>
          <h3 className="text-xl font-semibold mb-3 text-gray-800">Property Images</h3>
          {selectedProperty.images && selectedProperty.images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {selectedProperty.images.map((img, idx) => (
                <img
                  key={idx}
                  src={`${BACKEND_URL}/uploads/${encodeURIComponent(img)}`}
                  alt={`Property Image ${idx + 1}`}
                  className="w-full h-36 object-cover rounded-lg shadow-md"
                  loading="lazy"
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No images available.</p>
          )}
        </section>

        {/* Owner Details */}
        <section>
          <h3 className="text-xl font-semibold mb-3 text-gray-800">Owner Information</h3>
          <ul className="text-gray-700 space-y-1">
            <li><span className="font-semibold">Name:</span> {selectedProperty.user?.ownerKYC?.ownerName || selectedProperty.user?.name || "-"}</li>
            <li><span className="font-semibold">Email:</span> {selectedProperty.user?.ownerKYC?.ownerEmail || selectedProperty.user?.email || "-"}</li>
            <li><span className="font-semibold">Phone:</span> {selectedProperty.user?.ownerKYC?.ownerPhone || selectedProperty.user?.contact || "-"}</li>
            <li><span className="font-semibold">ID Type:</span> {selectedProperty.user?.ownerKYC?.ownerIdType || "-"}</li>
            <li><span className="font-semibold">ID Number:</span> {selectedProperty.user?.ownerKYC?.ownerIdNumber || "-"}</li>
          </ul>

          {/* Owner KYC Document */}
          {selectedProperty.user?.ownerKYC?.ownerIdFile && (
            <div className="mt-4">
              <h4 className="font-semibold mb-1">ID Document</h4>
              <img
                src={`${BACKEND_URL}/uploads/${encodeURIComponent(selectedProperty.user.ownerKYC.ownerIdFile)}`}
                alt="Owner ID Document"
                className="max-w-xs rounded-lg shadow-md"
                loading="lazy"
              />
            </div>
          )}

          {/* Ownership Proof */}
          {selectedProperty.user?.ownershipProof?.ownershipProofFile && (
            <div className="mt-6">
              <h4 className="font-semibold mb-1">Ownership Proof</h4>
              <p className="mb-2"><span className="font-semibold">Type:</span> {selectedProperty.user.ownershipProof.ownershipProofType || "-"}</p>
              <p className="mb-2"><span className="font-semibold">Document No:</span> {selectedProperty.user.ownershipProof.ownershipDocNumber || "-"}</p>
              <img
                src={`${BACKEND_URL}/uploads/${encodeURIComponent(selectedProperty.user.ownershipProof.ownershipProofFile)}`}
                alt="Ownership Proof Document"
                className="max-w-xs rounded-lg shadow-md"
                loading="lazy"
              />
            </div>
          )}
        </section>

        {/* Status & Admin Notes */}
        <section>
          <h3 className="text-xl font-semibold mb-3 text-gray-800">Status</h3>
          <div>
            {selectedProperty.approved ? (
              <span className="inline-block bg-green-100 text-green-800 px-4 py-1 rounded-full font-semibold shadow-sm">Approved</span>
            ) : selectedProperty.rejected ? (
              <span
                className="inline-block bg-red-100 text-red-800 px-4 py-1 rounded-full font-semibold shadow-sm cursor-help"
                title={selectedProperty.rejectionReason || "No rejection reason provided"}
              >
                Rejected
              </span>
            ) : (
              <span className="inline-block bg-yellow-100 text-yellow-800 px-4 py-1 rounded-full font-semibold shadow-sm">Pending</span>
            )}
          </div>
          {selectedProperty.rejectionReason && !selectedProperty.approved && (
            <p className="mt-2 text-red-600 italic">Rejection Reason: {selectedProperty.rejectionReason}</p>
          )}
        </section>
      </div>

    </div>
    </div>
)}

    </div>
  );
}


