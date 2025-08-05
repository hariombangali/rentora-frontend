import { useEffect, useState } from "react";
import API from "../../services/api";

export default function PendingApproval() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingIds, setProcessingIds] = useState(new Set());
  const [selectedProperty, setSelectedProperty] = useState(null); // For detail modal
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectReason, setShowRejectReason] = useState(false);

  useEffect(() => {
    fetchPendingProperties();
  }, []);

  const fetchPendingProperties = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/admin/pending-properties", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPending(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load pending properties");
    } finally {
      setLoading(false);
    }
  };

  const updateProcessing = (id, processing) => {
    setProcessingIds((prev) => {
      const newSet = new Set(prev);
      if (processing) newSet.add(id);
      else newSet.delete(id);
      return newSet;
    });
  };

  const approveProperty = async (propertyId) => {
    updateProcessing(propertyId, true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      await API.put(`/admin/approve-property/${propertyId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPending((prev) => prev.filter((p) => p._id !== propertyId));
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve property");
    } finally {
      updateProcessing(propertyId, false);
    }
  };

  const rejectProperty = async () => {
    if (!rejectReason.trim()) {
      alert("Please enter a reason for rejection.");
      return;
    }
    if (!selectedProperty) return;

    updateProcessing(selectedProperty._id, true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      // Assuming your backend supports reject reason in request body
      await API.post(
        `/admin/reject-property/${selectedProperty._id}`,
        { reason: rejectReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPending((prev) => prev.filter((p) => p._id !== selectedProperty._id));
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject property");
    } finally {
      updateProcessing(selectedProperty._id, false);
      setRejectReason("");
      setShowRejectReason(false);
    }
  };

  const openModal = (property) => {
    setSelectedProperty(property);
    setRejectReason("");
    setShowRejectReason(false);
  };

  const closeModal = () => {
    setSelectedProperty(null);
    setRejectReason("");
    setShowRejectReason(false);
  };

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 32, background: "#fff", borderRadius: 10 }}>
      <h1 style={{ fontSize: "2rem", marginBottom: 20 }}>Pending Property Approvals</h1>

      {loading && <p>Loading pending properties...</p>}

      {error && (
        <div style={{ backgroundColor: "#fee2e2", color: "#b71c1c", padding: 10, borderRadius: 6, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {!loading && pending.length === 0 && <p>No pending properties for approval</p>}

      {!loading && pending.length > 0 && (
        <div>
          {pending.map((p) => {
            const isProcessing = processingIds.has(p._id);
            return (
              <div
                key={p._id}
                style={{
                  border: "1px solid #ddd",
                  padding: 16,
                  borderRadius: 6,
                  marginBottom: 12,
                  boxShadow: "0 0 5px rgba(0,0,0,0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h3 style={{ margin: 0 }}>{p.title}</h3>
                  <p style={{ margin: "6px 0" }}>
                    Owner: {p.ownerKYC?.ownerName || "N/A"} | Type: {p.type} | City: {p.location?.city || "N/A"} | Price: ₹{p.price}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => openModal(p)}
                    style={{
                      padding: "8px 20px",
                      backgroundColor: "#6b7280",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    View Details
                  </button>

                  <button
                    onClick={() => approveProperty(p._id)}
                    disabled={isProcessing}
                    style={{
                      padding: "8px 20px",
                      backgroundColor: "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      cursor: isProcessing ? "not-allowed" : "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    {isProcessing ? "Processing..." : "Approve"}
                  </button>
                  <button
                    onClick={() => {
                      openModal(p);
                      setShowRejectReason(true);
                    }}
                    disabled={isProcessing}
                    style={{
                      padding: "8px 20px",
                      backgroundColor: "#dc2626",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      cursor: isProcessing ? "not-allowed" : "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for showing details and optionally reject reason */}
      {selectedProperty && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#fff",
              borderRadius: 8,
              maxWidth: "90vw",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 24,
              boxSizing: "border-box",
              width: 700,
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 16 }}>{selectedProperty.title}</h2>

            {/* Owner KYC Details */}
            <section style={{ marginBottom: 20 }}>
              <h3>Owner KYC Information</h3>
              <p><b>Name:</b> {selectedProperty.ownerKYC?.ownerName}</p>
              <p><b>Email:</b> {selectedProperty.ownerKYC?.ownerEmail}</p>
              <p><b>Phone:</b> {selectedProperty.ownerKYC?.ownerPhone}</p>
              <p><b>ID Type:</b> {selectedProperty.ownerKYC?.ownerIdType}</p>
              <p><b>ID Number:</b> {selectedProperty.ownerKYC?.ownerIdNumber}</p>
              {selectedProperty.ownerKYC?.ownerIdFile && (
                <img
            
                src={`${API.defaults.baseURL.replace('/api', '')}/uploads/${selectedProperty.ownerKYC.ownerIdFile}`}
                alt="Owner ID Document"
                  style={{ maxWidth: "100%", borderRadius: 8, marginTop: 8 }}
                />
              )}
            </section>

            {/* Ownership Proof Details */}
            <section style={{ marginBottom: 20 }}>
              <h3>Ownership Proof</h3>
              <p><b>Type:</b> {selectedProperty.ownershipProof?.ownershipProofType}</p>
              <p><b>Document Number:</b> {selectedProperty.ownershipProof?.ownershipProofDocNumber || "N/A"}</p>
              {selectedProperty.ownershipProof?.ownershipProofFile && (
                <img
                
                  src={`${API.defaults.baseURL.replace('/api', '')}/uploads/${selectedProperty.ownershipProof.ownershipProofFile}`}
                  alt="Ownership Proof Document"
                  style={{ maxWidth: "100%", borderRadius: 8, marginTop: 8 }}
                />
              )}
            </section>

            {/* Property Images */}
            <section style={{ marginBottom: 20 }}>
              <h3>Property Images</h3>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {selectedProperty.images?.map((img, i) => (
                  <img
                    key={i}
                     src={`${API.defaults.baseURL.replace('/api', '')}/uploads/${img}`}
                    alt={`Property image ${i + 1}`}
                    style={{ maxWidth: 150, borderRadius: 8 }}
                    loading="lazy"
                  />
                ))}
              </div>
            </section>

            {/* Description */}
            <section style={{ marginBottom: 20 }}>
              <h3>Description</h3>
              <p style={{ whiteSpace: "pre-line" }}>{selectedProperty.description}</p>
            </section>

            {/* Reject Reason Input if reject button clicked */}
            {showRejectReason && (
              <section>
                <h3>Reject Reason</h3>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Write reason for rejection here..."
                  style={{ width: "100%", borderRadius: 6, border: "1px solid #ccc", padding: 8, fontSize: 14 }}
                />
                <div style={{ marginTop: 12, textAlign: "right" }}>
                  <button
                    onClick={() => {
                      rejectProperty();
                    }}
                    disabled={processingIds.has(selectedProperty._id)}
                    style={{
                      padding: "8px 20px",
                      backgroundColor: "#dc2626",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      fontWeight: "bold",
                      cursor: "pointer",
                      marginRight: 8,
                    }}
                  >
                    {processingIds.has(selectedProperty._id) ? "Processing..." : "Confirm Reject"}
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectReason(false);
                      setRejectReason("");
                    }}
                    style={{
                      padding: "8px 20px",
                      backgroundColor: "#aaa",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </section>
            )}

            {/* Close button */}
            {!showRejectReason && (
              <button
                onClick={closeModal}
                style={{
                  marginTop: 16,
                  padding: "8px 20px",
                  backgroundColor: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
