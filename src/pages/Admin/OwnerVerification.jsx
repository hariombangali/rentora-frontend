import { useEffect, useState } from "react";
import API from "../../services/api";

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "verified", label: "Verified" },
  { key: "rejected", label: "Rejected" },
];

export default function OwnerVerification() {
  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tabs state for filtering owners
  const [filter, setFilter] = useState("pending");

  // Rejection modal states
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      // Fetch all owners from your API
      // The filtering will be done on frontend for demo simplicity
      const res = await API.get("/admin/owners", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOwners(res.data);
      setSelectedOwner(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load owners");
    } finally {
      setLoading(false);
    }
  };

  // Filter owners based on selected tab
  const filteredOwners = owners.filter((owner) => {
    switch (filter) {
      case "pending":
        return !owner.ownerVerified && !owner.ownerRejected;
      case "verified":
        return owner.ownerVerified === true;
      case "rejected":
        return owner.ownerRejected === true;
      case "all":
      default:
        return true;
    }
  });

  const fetchOwnerDetails = async (ownerId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get(`/admin/owner/${ownerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedOwner(res.data);
      setShowRejectReason(false);
      setRejectReason("");
    } catch {
      alert("Failed to fetch owner details");
    }
  };

  const approveOwner = async () => {
    if (!selectedOwner) return;
    setProcessing(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      await API.put(
        `/admin/owner/approve/${selectedOwner._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Owner approved successfully");
      await fetchOwners();
      setSelectedOwner(null);
      setShowRejectReason(false);
      setRejectReason("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve owner");
    } finally {
      setProcessing(false);
    }
  };

  const rejectOwner = async () => {
    if (!rejectReason.trim()) {
      alert("Please enter a reason for rejection.");
      return;
    }
    if (!selectedOwner) return;
    setProcessing(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      await API.put(
        `/admin/owner/reject/${selectedOwner._id}`,
        { reason: rejectReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Owner rejected successfully");
      await fetchOwners();
      setSelectedOwner(null);
      setShowRejectReason(false);
      setRejectReason("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject owner");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-blue-900">Owner Verification</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-300">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => {
              setFilter(key);
              setSelectedOwner(null);
              setShowRejectReason(false);
              setRejectReason("");
            }}
            className={`px-4 py-2 border-b-2 font-semibold transition ${
              filter === key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-blue-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <p>Loading owners...</p>}

      {error && (
        <p className="text-red-600 font-semibold mb-4">{error}</p>
      )}

      <div className="flex gap-6">
        {/* Owners List */}
        <div className="w-1/3 border-r pr-4">
          <h2 className="font-semibold mb-3">Owners List ({filteredOwners.length})</h2>
          <ul className="space-y-2 max-h-[70vh] overflow-y-auto">
            {filteredOwners.length === 0 && !loading && (
              <p className="text-gray-500">No owners found in this category.</p>
            )}
            {filteredOwners.map((owner) => {
              const isSelected = selectedOwner?._id === owner._id;
              let statusBadge = "";
              if (owner.ownerVerified) {
                statusBadge = "Verified";
              } else if (owner.ownerRejected) {
                statusBadge = "Rejected";
              } else {
                statusBadge = "Pending";
              }
              return (
                <li key={owner._id}>
                  <button
                    className={`w-full text-left flex justify-between items-center px-2 py-1 rounded focus:outline-none ${
                      isSelected ? "bg-blue-100 font-semibold" : "hover:bg-blue-50"
                    }`}
                    onClick={() => fetchOwnerDetails(owner._id)}
                  >
                    <span>{owner.name || owner.ownerKYC?.ownerName || "Unnamed Owner"}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        statusBadge === "Verified"
                          ? "bg-green-200 text-green-800"
                          : statusBadge === "Rejected"
                          ? "bg-red-200 text-red-800"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                      title={statusBadge}
                    >
                      {statusBadge}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Selected Owner Details */}
        <div className="flex-1 pl-6 max-h-[70vh] overflow-y-auto">
          {selectedOwner ? (
            <>
              <h2 className="text-xl font-semibold mb-4 text-blue-800">
                {selectedOwner.ownerKYC?.ownerName || "Owner Details"}
              </h2>

              <section className="mb-6">
                <h3 className="font-semibold mb-2">KYC Details</h3>
                <p><b>Email:</b> {selectedOwner.ownerKYC?.ownerEmail || "N/A"}</p>
                <p><b>Phone:</b> {selectedOwner.ownerKYC?.ownerPhone || "N/A"}</p>
                <p><b>ID Type:</b> {selectedOwner.ownerKYC?.ownerIdType || "N/A"}</p>
                <p><b>ID Number:</b> {selectedOwner.ownerKYC?.ownerIdNumber || "N/A"}</p>
                {selectedOwner.ownerKYC?.ownerIdFile && (
                  <img
                    src={`${API.defaults.baseURL.replace("/api", "")}/uploads/${selectedOwner.ownerKYC.ownerIdFile}`}
                    alt="Owner ID Proof"
                    className="max-w-full rounded-lg shadow mt-2"
                  />
                )}
              </section>

              <section className="mb-6">
                <h3 className="font-semibold mb-2">Ownership Proof</h3>
                <p><b>Type:</b> {selectedOwner.ownershipProof?.ownershipProofType || "N/A"}</p>
                <p><b>Doc Number:</b> {selectedOwner.ownershipProof?.ownershipProofDocNumber || "N/A"}</p>
                {selectedOwner.ownershipProof?.ownershipProofFile && (
                  <img
                    src={`${API.defaults.baseURL.replace("/api", "")}/uploads/${selectedOwner.ownershipProof.ownershipProofFile}`}
                    alt="Ownership Proof"
                    className="max-w-full rounded-lg shadow mt-2"
                  />
                )}
              </section>

              {/* Verification action buttons */}
              {selectedOwner.ownerVerified ? (
                <p className="px-4 py-2 rounded bg-green-100 text-green-700 font-semibold inline-block">
                  Owner is Verified ✅
                </p>
              ) : selectedOwner.ownerRejected ? (
                <>
                  <p className="px-4 py-2 rounded bg-red-100 text-red-700 font-semibold inline-block mb-4">
                    Owner Rejected ❌<br />
                    <em>Reason: {selectedOwner.ownerRejectionReason || "No reason provided"}</em>
                  </p>
                  <button
                    disabled={processing}
                    onClick={approveOwner}
                    className="mr-4 mb-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow font-semibold disabled:opacity-50"
                  >
                    {processing ? "Approving..." : "Approve Owner"}
                  </button>
                </>
              ) : (
                <>
                  {!showRejectReason ? (
                    <>
                      <button
                        disabled={processing}
                        onClick={approveOwner}
                        className="mr-4 mb-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow font-semibold disabled:opacity-50"
                      >
                        {processing ? "Approving..." : "Approve Owner"}
                      </button>
                      <button
                        onClick={() => setShowRejectReason(true)}
                        disabled={processing}
                        className="mb-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow font-semibold disabled:opacity-50"
                      >
                        Reject Owner
                      </button>
                    </>
                  ) : (
                    <div>
                      <textarea
                        rows={3}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Enter rejection reason"
                        className="w-full border border-gray-300 rounded p-2 mb-3"
                        disabled={processing}
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={rejectOwner}
                          disabled={processing}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow font-semibold disabled:opacity-50"
                        >
                          {processing ? "Rejecting..." : "Confirm Reject"}
                        </button>
                        <button
                          onClick={() => {
                            setShowRejectReason(false);
                            setRejectReason("");
                          }}
                          disabled={processing}
                          className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded shadow font-semibold disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <p className="text-gray-500">Select an owner to view their verification details.</p>
          )}
        </div>
      </div>
    </div>
  );
}
