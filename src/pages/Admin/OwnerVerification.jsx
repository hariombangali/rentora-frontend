import { useEffect, useState } from "react";
import API from "../../services/api";
import { toast } from "../../utils/toast";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "verified", label: "Verified" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

export default function OwnerVerification() {
  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const token = localStorage.getItem("token");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => { fetchOwners(); }, []);

  const fetchOwners = async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/owners", authHeader);
      setOwners(res.data?.owners || res.data || []);
      setSelectedOwner(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load owners");
    } finally {
      setLoading(false);
    }
  };

  const filteredOwners = owners.filter((o) => {
    if (filter === "verified") return o.ownerVerified === true;
    if (filter === "rejected") return o.ownerRejected === true;
    if (filter === "pending") return !o.ownerVerified && !o.ownerRejected;
    return true;
  });

  const fetchOwnerDetails = async (ownerId) => {
    try {
      const res = await API.get(`/admin/owner/${ownerId}`, authHeader);
      setSelectedOwner(res.data);
      setShowRejectReason(false);
      setRejectReason("");
      setMobileDetailOpen(true);
    } catch {
      toast.error("Failed to fetch owner details");
    }
  };

  const approveOwner = async () => {
    if (!selectedOwner) return;
    setProcessing(true);
    try {
      await API.put(`/admin/owner/approve/${selectedOwner._id}`, {}, authHeader);
      toast.success("Owner approved");
      await fetchOwners();
      setSelectedOwner(null);
      setMobileDetailOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve owner");
    } finally {
      setProcessing(false);
    }
  };

  const rejectOwner = async () => {
    if (!rejectReason.trim()) { toast.error("Please enter a reason for rejection."); return; }
    if (!selectedOwner) return;
    setProcessing(true);
    try {
      await API.put(`/admin/owner/reject/${selectedOwner._id}`, { reason: rejectReason }, authHeader);
      toast.success("Owner rejected");
      await fetchOwners();
      setSelectedOwner(null);
      setShowRejectReason(false);
      setRejectReason("");
      setMobileDetailOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject owner");
    } finally {
      setProcessing(false);
    }
  };

  const statusBadge = (o) => {
    if (o.ownerVerified) return { label: "Verified", cls: "bg-green-100 text-green-800" };
    if (o.ownerRejected) return { label: "Rejected", cls: "bg-red-100 text-red-800" };
    return { label: "Pending", cls: "bg-yellow-100 text-yellow-700" };
  };

  const DetailPanel = () =>
    selectedOwner ? (
      <div className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6">
        {/* Mobile close */}
        <button
          className="md:hidden mb-4 text-sm text-blue-600 flex items-center gap-1"
          onClick={() => { setMobileDetailOpen(false); setSelectedOwner(null); }}
        >
          ← Back to list
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {selectedOwner.ownerKYC?.ownerName || selectedOwner.name || "Owner Details"}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 mb-5">
          <div><span className="font-medium">Email:</span> {selectedOwner.ownerKYC?.ownerEmail || "N/A"}</div>
          <div><span className="font-medium">Phone:</span> {selectedOwner.ownerKYC?.ownerPhone || "N/A"}</div>
          <div><span className="font-medium">ID Type:</span> {selectedOwner.ownerKYC?.ownerIdType || "N/A"}</div>
          <div><span className="font-medium">ID Number:</span> {selectedOwner.ownerKYC?.ownerIdNumber || "N/A"}</div>
        </div>

        {selectedOwner.ownerKYC?.ownerIdFile && (
          <div className="mb-5">
            <p className="text-sm font-medium text-gray-700 mb-1">ID Document</p>
            <img
              src={selectedOwner.ownerKYC.ownerIdFile}
              alt="Owner ID"
              className="max-w-xs rounded-xl border shadow"
            />
          </div>
        )}

        {selectedOwner.ownershipProof?.ownershipProofFile && (
          <div className="mb-5">
            <p className="text-sm font-medium text-gray-700 mb-1">
              Ownership Proof — {selectedOwner.ownershipProof.ownershipProofType}
            </p>
            <img
              src={selectedOwner.ownershipProof.ownershipProofFile}
              alt="Ownership proof"
              className="max-w-xs rounded-xl border shadow"
            />
          </div>
        )}

        {selectedOwner.ownerVerified ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 text-green-700 font-medium text-sm">
            ✓ Owner Verified
          </div>
        ) : selectedOwner.ownerRejected ? (
          <div className="space-y-3">
            <div className="px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm">
              <p className="font-medium">Rejected</p>
              <p className="text-xs mt-1">{selectedOwner.ownerRejectionReason || "No reason provided"}</p>
            </div>
            <button
              disabled={processing}
              onClick={approveOwner}
              className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {processing ? "Processing…" : "Approve Owner"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {!showRejectReason ? (
              <div className="flex gap-2 flex-wrap">
                <button
                  disabled={processing}
                  onClick={approveOwner}
                  className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                >
                  {processing ? "Processing…" : "Approve"}
                </button>
                <button
                  disabled={processing}
                  onClick={() => setShowRejectReason(true)}
                  className="px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm font-semibold hover:bg-red-100 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            ) : (
              <div>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter rejection reason…"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:ring-2 focus:ring-red-200"
                  disabled={processing}
                />
                <div className="mt-2 flex gap-2 justify-end">
                  <button onClick={() => { setShowRejectReason(false); setRejectReason(""); }} className="px-4 py-2 rounded-xl border text-sm">Cancel</button>
                  <button
                    onClick={rejectOwner}
                    disabled={processing}
                    className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    {processing ? "Processing…" : "Confirm Reject"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    ) : (
      <div className="flex-1 hidden md:flex items-center justify-center text-gray-400 text-sm">
        Select an owner to view their verification details
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-5">Owner Verification</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setFilter(key); setSelectedOwner(null); setShowRejectReason(false); setRejectReason(""); setMobileDetailOpen(false); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              filter === key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {label}
            {key !== "all" && (
              <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5">
                {owners.filter((o) => key === "pending" ? !o.ownerVerified && !o.ownerRejected : key === "verified" ? o.ownerVerified : o.ownerRejected).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="animate-pulse h-10 rounded-lg bg-gray-100" />)}
        </div>
      ) : (
        /* Responsive layout: side-by-side on md+, stacked on mobile */
        <div className="flex flex-col md:flex-row gap-0 md:gap-6">
          {/* List panel — hidden on mobile when detail is open */}
          <div className={`${mobileDetailOpen ? "hidden md:block" : "block"} md:w-72 border-b md:border-b-0 md:border-r border-gray-200 md:pr-6 pb-4 md:pb-0 flex-shrink-0`}>
            <p className="text-sm text-gray-500 mb-3">
              {filteredOwners.length} owner{filteredOwners.length !== 1 ? "s" : ""}
            </p>
            <ul className="space-y-1 max-h-[65vh] overflow-y-auto">
              {filteredOwners.length === 0 ? (
                <li className="text-sm text-gray-400 py-4 text-center">No owners in this category.</li>
              ) : (
                filteredOwners.map((owner) => {
                  const { label, cls } = statusBadge(owner);
                  return (
                    <li key={owner._id}>
                      <button
                        className={`w-full text-left flex justify-between items-center px-3 py-2.5 rounded-xl text-sm transition ${
                          selectedOwner?._id === owner._id ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-50"
                        }`}
                        onClick={() => fetchOwnerDetails(owner._id)}
                      >
                        <span className="truncate">{owner.name || owner.ownerKYC?.ownerName || "Unnamed"}</span>
                        <span className={`ml-2 flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>

          {/* Detail panel */}
          {mobileDetailOpen || selectedOwner ? <DetailPanel /> : (
            <div className="flex-1 hidden md:flex items-center justify-center text-gray-400 text-sm">
              Select an owner to view their verification details
            </div>
          )}
        </div>
      )}
    </div>
  );
}
