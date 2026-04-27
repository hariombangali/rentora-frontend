import { useEffect, useState } from "react";
import API from "../../services/api";
import { toast } from "../../utils/toast";
import { ArrowLeft, ShieldCheck, X, Check, Inbox } from "lucide-react";

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
    } finally { setLoading(false); }
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
    } catch { toast.error("Failed to fetch owner details"); }
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
    } finally { setProcessing(false); }
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
    } finally { setProcessing(false); }
  };

  const statusBadge = (o) => {
    if (o.ownerVerified) return <span className="inline-flex items-center rounded-full bg-[#e8f5e9] px-2.5 py-0.5 text-[11px] font-medium text-[#2e7d32]">Verified</span>;
    if (o.ownerRejected) return <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-red-700">Rejected</span>;
    return <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">Pending</span>;
  };

  const tabCount = (key) => owners.filter((o) =>
    key === "pending" ? !o.ownerVerified && !o.ownerRejected :
    key === "verified" ? o.ownerVerified :
    key === "rejected" ? o.ownerRejected : true
  ).length;

  const initials = (n) => (n || "U").trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="mb-8">
        <p className="font-eyebrow text-[11px] text-[color:var(--muted)]">KYC</p>
        <h1 className="font-display text-[36px] md:text-[42px] leading-tight mt-1 text-ink">Owner verification</h1>
        <p className="mt-2 text-[14px] text-[color:var(--muted)]">Review owner KYC and approve or reject submissions.</p>
      </div>

      {/* Tabs */}
      <div className="inline-flex bg-card border border-rule rounded-full p-1 gap-0.5 mb-6 overflow-x-auto max-w-full">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setFilter(key); setSelectedOwner(null); setShowRejectReason(false); setRejectReason(""); setMobileDetailOpen(false); }}
            className={`px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition ${
              filter === key ? "bg-ink text-paper" : "text-[color:var(--muted)] hover:text-ink"
            }`}
          >
            {label}{key !== "all" ? ` · ${tabCount(key)}` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-3xl border border-rule bg-card p-5 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-[#e8e2d3]" />
              <div className="h-4 w-40 rounded-full bg-[#e8e2d3]" />
              <div className="h-5 w-16 rounded-full bg-[#e8e2d3] ml-auto" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-5">
          {/* List panel */}
          <div className={`${mobileDetailOpen ? "hidden md:block" : "block"} rounded-3xl border border-rule bg-card p-3`}>
            <p className="text-[12px] text-[color:var(--muted)] px-2 py-2">
              {filteredOwners.length} owner{filteredOwners.length !== 1 ? "s" : ""}
            </p>
            <ul className="space-y-1 max-h-[65vh] overflow-y-auto scrollbar-hide">
              {filteredOwners.length === 0 ? (
                <li className="text-[13px] text-[color:var(--muted)] py-8 text-center">No owners in this category.</li>
              ) : filteredOwners.map((owner) => {
                const name = owner.name || owner.ownerKYC?.ownerName || "Unnamed";
                const isActive = selectedOwner?._id === owner._id;
                return (
                  <li key={owner._id}>
                    <button
                      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition ${
                        isActive ? "bg-paper" : "hover:bg-paper"
                      }`}
                      onClick={() => fetchOwnerDetails(owner._id)}
                    >
                      <div className="w-8 h-8 rounded-full bg-paper border border-rule text-ink flex items-center justify-center font-medium text-[11px] uppercase shrink-0">
                        {initials(name)}
                      </div>
                      <span className="truncate flex-1 text-ink font-medium">{name}</span>
                      <span className="ml-auto shrink-0">{statusBadge(owner)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Detail panel */}
          {(mobileDetailOpen || selectedOwner) ? (
            <div className="rounded-3xl border border-rule bg-card p-6 md:p-8">
              <button
                className="md:hidden mb-4 text-[13px] text-ink flex items-center gap-1.5 hover:text-accent transition"
                onClick={() => { setMobileDetailOpen(false); setSelectedOwner(null); }}
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to list
              </button>

              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-paper border border-rule text-ink flex items-center justify-center font-medium uppercase shrink-0">
                  {initials(selectedOwner.ownerKYC?.ownerName || selectedOwner.name)}
                </div>
                <div className="min-w-0">
                  <p className="font-eyebrow text-[10px] text-[color:var(--muted)]">Owner profile</p>
                  <h2 className="font-display text-[24px] text-ink mt-0.5 truncate">
                    {selectedOwner.ownerKYC?.ownerName || selectedOwner.name || "Owner details"}
                  </h2>
                </div>
              </div>

              <div className="rounded-2xl bg-paper border border-rule p-4 mb-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-4 text-[13px]">
                  <Row k="Email" v={selectedOwner.ownerKYC?.ownerEmail} />
                  <Row k="Phone" v={selectedOwner.ownerKYC?.ownerPhone} />
                  <Row k="ID type" v={selectedOwner.ownerKYC?.ownerIdType} />
                  <Row k="ID number" v={selectedOwner.ownerKYC?.ownerIdNumber} />
                </div>
              </div>

              {selectedOwner.ownerKYC?.ownerIdFile && (
                <div className="mb-5">
                  <p className="font-eyebrow text-[10px] text-[color:var(--muted)] mb-2">ID document</p>
                  <img src={selectedOwner.ownerKYC.ownerIdFile} alt="Owner ID" className="max-w-xs rounded-2xl border border-rule" />
                </div>
              )}

              {selectedOwner.ownershipProof?.ownershipProofFile && (
                <div className="mb-5">
                  <p className="font-eyebrow text-[10px] text-[color:var(--muted)] mb-2">
                    Ownership proof — {selectedOwner.ownershipProof.ownershipProofType}
                  </p>
                  <img src={selectedOwner.ownershipProof.ownershipProofFile} alt="Ownership proof" className="max-w-xs rounded-2xl border border-rule" />
                </div>
              )}

              {selectedOwner.ownerVerified ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-[#e8f5e9] px-4 py-2 text-[13px] font-medium text-[#2e7d32]">
                  <ShieldCheck className="w-4 h-4" /> Owner verified
                </div>
              ) : selectedOwner.ownerRejected ? (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-[13px] text-red-700">
                    <p className="font-medium">Rejected</p>
                    <p className="text-[12px] mt-1">{selectedOwner.ownerRejectionReason || "No reason provided"}</p>
                  </div>
                  <button
                    disabled={processing}
                    onClick={approveOwner}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" /> {processing ? "Processing…" : "Approve owner"}
                  </button>
                </div>
              ) : (
                <div>
                  {!showRejectReason ? (
                    <div className="flex gap-2 flex-wrap">
                      <button
                        disabled={processing}
                        onClick={approveOwner}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" /> {processing ? "Processing…" : "Approve"}
                      </button>
                      <button
                        disabled={processing}
                        onClick={() => setShowRejectReason(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-card border border-rule text-red-600 text-sm font-medium hover:border-red-600 transition disabled:opacity-50"
                      >
                        <X className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="block font-eyebrow text-[11px] text-[color:var(--muted)]">Rejection reason</label>
                      <textarea
                        rows={3}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Enter rejection reason…"
                        className="w-full rounded-xl border border-rule bg-card px-3 py-2.5 text-[14px] focus:outline-none focus:border-ink resize-none"
                        disabled={processing}
                      />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => { setShowRejectReason(false); setRejectReason(""); }} className="inline-flex items-center px-5 py-2.5 rounded-full bg-card border border-rule text-ink text-sm hover:border-ink transition">
                          Cancel
                        </button>
                        <button
                          onClick={rejectOwner}
                          disabled={processing}
                          className="inline-flex items-center px-5 py-2.5 rounded-full bg-red-600 text-paper text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
                        >
                          {processing ? "Processing…" : "Confirm reject"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-rule bg-card p-12 hidden md:flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-paper flex items-center justify-center mb-4">
                <Inbox className="w-5 h-5 text-[color:var(--muted)]" />
              </div>
              <h3 className="font-display text-[18px] text-ink">Select an owner</h3>
              <p className="text-[13px] text-[color:var(--muted)] mt-1">Pick someone from the list to review their KYC.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex gap-2 min-w-0">
      <span className="text-[color:var(--muted)] w-20 shrink-0">{k}</span>
      <span className="text-ink truncate">{v || "—"}</span>
    </div>
  );
}
