import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "../utils/toast";

const INITIAL_FORM_DATA = {
  title: "",
  description: "",
  availableFor: "Any",
  preferredTenants: "Any",
  occupancyType: "Single",
  sharingCount: "2",
  bedrooms: 1,
  attachedBathroom: "Yes",
  attachedBalcony: "Yes",
  roomFurnishing: "Unfurnished",
  commonAreaFacilities: [],
  facilitiesInput: "",
  availableFrom: "",
  ageOfProperty: "",
  totalFloors: "",
  propertyOnFloor: "",
  city: "",
  locality: "",
  address: "",
  pincode: "",
  price: "",
  deposit: "",
  maintenance: "",
  maintenanceFreq: "Yearly",
  earlyLeavingCharges: "",
  minContractDuration: "1 Month",
  noticePeriod: "1 Month",
  pgAmenities: [],
  pgAmenitiesInput: "",
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
  ownerIdType: "",
  ownerIdNumber: "",
  ownerIdFile: null,
  ownershipProofType: "",
  ownershipProofDocNumber: "",
  ownershipProofFile: null,
  images: [],
};

const SHARING_OPTIONS = ["2", "3", "4", "5+"];
const FURNISHING_OPTIONS = ["Unfurnished", "Semi-furnished", "Fully furnished"];
const AGE_OPTIONS = ["0 - 1 Year", "1 - 3 Years", "3 - 5 Years", "5+ Years"];
const MAINTENANCE_FREQS = ["Monthly", "Quarterly", "Yearly"];
const CONTRACT_OPTIONS = ["1 Month", "3 Months", "6 Months", "12 Months"];
const NOTICE_OPTIONS = ["15 Days", "1 Month", "2 Months"];
const AMENITIES_LIST = ["Wi-Fi", "Parking", "Balcony", "Water Supply", "AC", "Power Backup", "Lift"];
const PG_AMENITIES_LIST = ["Meal", "Laundry", "Housekeeping", "Common TV", "CCTV", "RO Water", "Refrigerator", "Geyser"];

/* ── Reusable chip / pill toggle button ── */
function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
        active
          ? "bg-accent text-white border-accent shadow-sm"
          : "bg-paper text-ink border-rule hover:border-accent hover:text-accent"
      }`}
    >
      {children}
    </button>
  );
}

/* ── Field wrapper with eyebrow label and optional error ── */
function Field({ label, required, error, children, className = "" }) {
  return (
    <div className={className}>
      {label && (
        <label className="block font-eyebrow text-muted mb-1.5">
          {label}
          {required && <span className="text-accent ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

/* ── Card section wrapper ── */
function Section({ eyebrow, children }) {
  return (
    <div className="bg-card rounded-2xl shadow-card border border-rule p-6 space-y-6">
      {eyebrow && (
        <p className="font-eyebrow text-muted border-b border-rule pb-3">{eyebrow}</p>
      )}
      {children}
    </div>
  );
}

export default function PostProperty() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const STEPS = useMemo(
    () =>
      user?.role === "owner"
        ? ["Property Details", "Pricing", "Amenities", "Photos", "Review"]
        : ["Property Details", "Pricing", "Amenities", "Photos", "Owner Info", "Review"],
    [user?.role]
  );
  const totalSteps = STEPS.length;

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [existingImages, setExistingImages] = useState([]); // server filenames
  const [loadingPrefill, setLoadingPrefill] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  // Generate stable preview URLs; revoke when images change or component unmounts
  const previewUrls = useMemo(
    () => formData.images.map((file) => URL.createObjectURL(file)),
    [formData.images]
  );
  useEffect(() => () => previewUrls.forEach((url) => URL.revokeObjectURL(url)), [previewUrls]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  useEffect(() => {
    if (user?.role === "owner") {
      setFormData((prev) => ({
        ...prev,
        ownerName: user.name || "",
        ownerEmail: user.email || "",
        ownerPhone: user.phone || "",
      }));
    }
  }, [user]);

  const setField = useCallback((name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleChange = useCallback(
    (e) => {
      setIsDirty(true);
      const { name, value, type, files } = e.target;
      if (type === "file") {
        if (name === "images") {
          const newFiles = Array.from(files);
          setFormData((prev) => ({ ...prev, images: [...prev.images, ...newFiles].slice(0, 8) }));
        } else {
          setFormData((prev) => ({ ...prev, [name]: files[0] }));
        }
      } else {
        setField(name, value);
      }
    },
    [setField]
  );

  const handleChipArrayToggle = useCallback((name, value) => {
    setIsDirty(true);
    setFormData((prev) => ({
      ...prev,
      [name]: prev[name].includes(value)
        ? prev[name].filter((item) => item !== value)
        : [...prev[name], value],
    }));
  }, []);

  const handleCustomAmenity = useCallback(
    (e, fieldName, inputName) => {
      const value = e.target.value.trim();
      if (e.key === "Enter" && value) {
        e.preventDefault();
        handleChipArrayToggle(fieldName, value);
        setField(inputName, "");
      }
    },
    [handleChipArrayToggle, setField]
  );

  const removeImage = useCallback((indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove),
    }));
  }, []);

  const validateStep = useCallback(
    (currentStep) => {
      const errors = {};
      const stepLabel = STEPS[currentStep - 1];

      if (stepLabel === "Property Details") {
        if (!formData.title.trim()) errors.title = "Title is required";
        if (!formData.description.trim()) errors.description = "Description is required";
        if (!formData.city.trim()) errors.city = "City is required";
        if (!formData.locality.trim()) errors.locality = "Locality is required";
        if (!formData.pincode.trim() || !/^\d{6}$/.test(formData.pincode)) errors.pincode = "Valid 6-digit pincode is required";
        if (!formData.address.trim()) errors.address = "Full address is required";
        if (!formData.availableFrom) errors.availableFrom = "Available date is required";
      }
      if (stepLabel === "Pricing") {
        if (!formData.price || isNaN(formData.price)) errors.price = "A valid rent amount is required";
      }
      if (stepLabel === "Owner Info") {
        if (!formData.ownerName.trim()) errors.ownerName = "Owner name is required";
        if (!formData.ownerEmail.trim() || !/^\S+@\S+\.\S+$/.test(formData.ownerEmail)) errors.ownerEmail = "A valid email is required";
        if (!formData.ownerPhone.trim() || !/^\d{10}$/.test(formData.ownerPhone)) errors.ownerPhone = "A valid 10-digit phone is required";
        if (!formData.ownerIdFile) errors.ownerIdFile = "ID proof file is required";
        if (!formData.ownershipProofFile) errors.ownershipProofFile = "Ownership proof document is required";
      }
      if (stepLabel === "Photos") {
        const totalImgs = (existingImages?.length || 0) + (formData.images?.length || 0);
        if (totalImgs === 0) errors.images = "Please upload at least one image.";
      }
      return errors;
    },
    [formData, STEPS, existingImages]
  );

  const nextStep = useCallback(() => {
    const errors = validateStep(step);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setStep((s) => Math.min(s + 1, totalSteps));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, totalSteps, validateStep]);

  const prevStep = useCallback(() => {
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const progressPercent = useMemo(() => ((step - 1) / (totalSteps - 1)) * 100, [step, totalSteps]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      let allErrors = {};
      for (let i = 1; i <= totalSteps; i++) {
        allErrors = { ...allErrors, ...validateStep(i) };
      }
      if (Object.keys(allErrors).length > 0) {
        setFormErrors(allErrors);
        const firstErrorStepIndex = STEPS.findIndex((_, index) => Object.keys(validateStep(index + 1)).length > 0);
        if (firstErrorStepIndex !== -1) {
          setStep(firstErrorStepIndex + 1);
        }
        toast.error("Please review the form and fix the highlighted errors.");
        return;
      }

      setUploading(true);
      const data = new FormData();

      // Append primitives and arrays (repeat key for arrays)
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "images") return; // handle below
        if (Array.isArray(value)) {
          value.forEach((item) => data.append(key, item));
        } else if (value instanceof File) {
          data.append(key, value);
        } else if (value !== null && value !== undefined && value !== "") {
          data.append(key, String(value));
        }
      });

      // Normalize furnishing key for backend
      data.append("furnishing", formData.roomFurnishing);

      // Keep existing images on edit (no brackets)
      if (isEdit) {
        existingImages.forEach((name) => data.append("retainedImages", name));
      }

      // New image uploads
      (formData.images || []).forEach((file) => data.append("images", file));

      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const res = isEdit
          ? await API.put(`/properties/${id}`, data, { headers })
          : await API.post(`/properties`, data, { headers });

        if (!isEdit && res.status === 201 && user?.role !== "owner") {
          await API.put(`/auth/upgrade-role`, { role: "owner" }, { headers });
        }

        navigate("/my-properties", {
          state: { success: isEdit ? "Property updated successfully!" : "Property posted successfully!" },
        });
      } catch (err) {
        toast.error(err.response?.data?.message || (isEdit ? "Failed to update property." : "Failed to post property."));
        console.error(err);
      } finally {
        setUploading(false);
      }
    },
    [formData, totalSteps, existingImages, isEdit, id, navigate, user?.role, validateStep, STEPS]
  );

  const minDate = useMemo(() => new Date().toISOString().split("T"), []);

  // Prefill on edit
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        setLoadingPrefill(true);
        const token = localStorage.getItem("token");
        const res = await API.get(`/properties/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const p = res.data || {};

        setFormData((prev) => ({
          ...prev,
          title: p.title || "",
          description: p.description || "",
          availableFor: p.availableFor || "Any",
          preferredTenants: p.preferredTenants || "Any",
          occupancyType: p.occupancyType || "Single",
          sharingCount: String(p.sharingCount ?? "2"),
          bedrooms: p.bedrooms ?? 1,
          attachedBathroom: p.attachedBathroom || "Yes",
          attachedBalcony: p.attachedBalcony || "Yes",
          roomFurnishing: p.furnishing || "Unfurnished",
          commonAreaFacilities: p.commonAreaFacilities || [],
          availableFrom: p.availableFrom ? String(p.availableFrom).slice(0, 10) : "",
          ageOfProperty: p.ageOfProperty || "",
          totalFloors: p.totalFloors ?? "",
          propertyOnFloor: p.propertyOnFloor ?? "",
          city: p.location?.city || p.city || "",
          locality: p.location?.locality || p.locality || "",
          address: p.location?.address || p.address || "",
          pincode: p.location?.pincode || p.pincode || "",
          price: p.price ?? "",
          deposit: p.deposit ?? "",
          maintenance: p.maintenance ?? "",
          maintenanceFreq: p.maintenanceFreq || "Yearly",
          earlyLeavingCharges: p.earlyLeavingCharges ?? "",
          minContractDuration: p.minContractDuration || "1 Month",
          noticePeriod: p.noticePeriod || "1 Month",
          pgAmenities: p.pgAmenities || [],
          ownerName: p.owner?.name || prev.ownerName,
          ownerEmail: p.owner?.email || prev.ownerEmail,
          ownerPhone: p.owner?.phone || prev.ownerPhone,
          ownerIdType: p.ownerIdType || "",
          ownerIdNumber: p.ownerIdNumber || "",
          ownershipProofType: p.ownershipProofType || "",
          ownershipProofDocNumber: p.ownershipProofDocNumber || "",
          images: [],
        }));
        setExistingImages(Array.isArray(p.images) ? p.images : []);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load property for editing");
      } finally {
        setLoadingPrefill(false);
      }
    })();
  }, [isEdit, id]);

  /* ── Loading skeleton ── */
  if (loadingPrefill) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto" />
          <p className="font-eyebrow text-muted">Loading property data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-3xl mx-auto px-4 py-10 sm:px-6 lg:px-8">

        {/* ── Page header ── */}
        <div className="mb-10 text-center">
          <p className="font-eyebrow text-muted mb-2">{isEdit ? "Edit listing" : "New listing"}</p>
          <h1 className="font-display text-4xl text-ink leading-tight">
            {isEdit ? "Update your property" : "List your property"}
          </h1>
          <p className="mt-2 text-muted text-sm">
            {isEdit
              ? "Make changes to your existing listing details."
              : "Reach thousands of tenants in just a few steps."}
          </p>
        </div>

        {/* ── Step indicator ── */}
        <div className="mb-10">
          <div className="relative flex items-start justify-between">
            {/* Connecting line behind circles */}
            <div className="absolute top-4 left-0 right-0 h-px bg-rule -z-0" aria-hidden="true">
              <div
                className="h-px bg-accent transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {STEPS.map((label, idx) => {
              const num = idx + 1;
              const isActive = step === num;
              const isDone = step > num;
              return (
                <div key={label} className="flex flex-col items-center gap-1.5 z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all duration-300 ${
                      isActive
                        ? "bg-accent text-white border-accent scale-110"
                        : isDone
                        ? "bg-sage-soft text-sage border-sage"
                        : "bg-rule text-muted border-rule"
                    }`}
                  >
                    {isDone ? (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      num
                    )}
                  </div>
                  <span
                    className={`font-eyebrow text-center leading-tight max-w-[72px] ${
                      isActive ? "text-ink" : isDone ? "text-sage" : "text-muted"
                    }`}
                    style={{ fontSize: "0.6rem" }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} noValidate className="space-y-6">

          {/* ════════════════════ STEP 1 — Property Details ════════════════════ */}
          {STEPS[step - 1] === "Property Details" && (
            <div className="space-y-6">

              {/* Basic info */}
              <Section eyebrow="Property information">
                <Field label="Listing title" required error={formErrors.title}>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Spacious 2BHK in Vijay Nagar"
                    className={`input-warm ${formErrors.title ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}`}
                  />
                </Field>

                <Field label="Description" required error={formErrors.description}>
                  <textarea
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the property, nearby amenities, rules, etc."
                    className={`input-warm resize-none ${formErrors.description ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}`}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Field label="Available for">
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {["Boys", "Girls", "Any"].map((opt) => (
                        <Chip key={opt} active={formData.availableFor === opt} onClick={() => setField("availableFor", opt)}>
                          {opt}
                        </Chip>
                      ))}
                    </div>
                  </Field>

                  <Field label="Preferred tenants">
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {["Students", "Working Professionals", "Any"].map((opt) => (
                        <Chip key={opt} active={formData.preferredTenants === opt} onClick={() => setField("preferredTenants", opt)}>
                          {opt}
                        </Chip>
                      ))}
                    </div>
                  </Field>
                </div>
              </Section>

              {/* Room details */}
              <Section eyebrow="Room details">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <Field label="Occupancy type">
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {["Single", "Shared", "Both"].map((opt) => (
                        <Chip key={opt} active={formData.occupancyType === opt} onClick={() => setField("occupancyType", opt)}>
                          {opt}
                        </Chip>
                      ))}
                    </div>
                  </Field>

                  <Field label="Sharing per room">
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {SHARING_OPTIONS.map((opt) => (
                        <Chip key={opt} active={formData.sharingCount === opt} onClick={() => setField("sharingCount", opt)}>
                          {opt !== "5+" ? `${opt}` : "5+"}
                        </Chip>
                      ))}
                    </div>
                  </Field>

                  <Field label="Bedrooms">
                    <input
                      type="number"
                      min={1}
                      max={10}
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleChange}
                      className="input-warm"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <Field label="Attached bathroom">
                    <div className="flex gap-2 pt-0.5">
                      {["Yes", "No"].map((opt) => (
                        <Chip key={opt} active={formData.attachedBathroom === opt} onClick={() => setField("attachedBathroom", opt)}>
                          {opt}
                        </Chip>
                      ))}
                    </div>
                  </Field>

                  <Field label="Attached balcony">
                    <div className="flex gap-2 pt-0.5">
                      {["Yes", "No"].map((opt) => (
                        <Chip key={opt} active={formData.attachedBalcony === opt} onClick={() => setField("attachedBalcony", opt)}>
                          {opt}
                        </Chip>
                      ))}
                    </div>
                  </Field>

                  <Field label="Furnishing">
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {FURNISHING_OPTIONS.map((opt) => (
                        <Chip
                          key={opt}
                          active={formData.roomFurnishing === opt}
                          onClick={() => setFormData((f) => ({ ...f, roomFurnishing: opt }))}
                        >
                          {opt}
                        </Chip>
                      ))}
                    </div>
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <Field label="Total floors">
                    <input
                      type="number"
                      min={1}
                      name="totalFloors"
                      value={formData.totalFloors}
                      onChange={handleChange}
                      className="input-warm"
                    />
                  </Field>

                  <Field label="Property floor">
                    <input
                      type="number"
                      min={0}
                      name="propertyOnFloor"
                      value={formData.propertyOnFloor}
                      onChange={handleChange}
                      className="input-warm"
                    />
                  </Field>

                  <Field label="Age of property">
                    <select
                      name="ageOfProperty"
                      value={formData.ageOfProperty}
                      onChange={handleChange}
                      className="input-warm"
                    >
                      <option value="">Select</option>
                      {AGE_OPTIONS.map((opt) => (
                        <option key={opt}>{opt}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                {/* Common area facilities */}
                <Field label="Common area facilities">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {AMENITIES_LIST.map((am) => (
                      <Chip
                        key={am}
                        active={formData.commonAreaFacilities.includes(am)}
                        onClick={() => handleChipArrayToggle("commonAreaFacilities", am)}
                      >
                        {am}
                      </Chip>
                    ))}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      name="facilitiesInput"
                      value={formData.facilitiesInput}
                      onChange={(e) => setField("facilitiesInput", e.target.value)}
                      placeholder="Add custom facility and press Enter"
                      onKeyDown={(e) => handleCustomAmenity(e, "commonAreaFacilities", "facilitiesInput")}
                      className="input-warm pr-20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-eyebrow text-muted pointer-events-none">
                      Enter
                    </span>
                  </div>
                  {formData.commonAreaFacilities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.commonAreaFacilities.map((fac, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 bg-accent-soft text-accent px-3 py-1 rounded-full text-xs font-medium"
                        >
                          {fac}
                          <button
                            type="button"
                            onClick={() => handleChipArrayToggle("commonAreaFacilities", fac)}
                            className="hover:text-accent-hover leading-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </Field>
              </Section>

              {/* Location */}
              <Section eyebrow="Location details">
                <Field label="Available from" required error={formErrors.availableFrom}>
                  <input
                    type="date"
                    name="availableFrom"
                    value={formData.availableFrom}
                    onChange={handleChange}
                    min={minDate}
                    className={`input-warm ${formErrors.availableFrom ? "border-red-400" : ""}`}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <Field label="City" required error={formErrors.city}>
                    <input
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Indore"
                      className={`input-warm ${formErrors.city ? "border-red-400" : ""}`}
                    />
                  </Field>

                  <Field label="Locality" required error={formErrors.locality}>
                    <input
                      name="locality"
                      value={formData.locality}
                      onChange={handleChange}
                      placeholder="Vijay Nagar"
                      className={`input-warm ${formErrors.locality ? "border-red-400" : ""}`}
                    />
                  </Field>

                  <Field label="Pincode" required error={formErrors.pincode}>
                    <input
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      maxLength={6}
                      placeholder="452001"
                      className={`input-warm ${formErrors.pincode ? "border-red-400" : ""}`}
                    />
                  </Field>
                </div>

                <Field label="Full address" required error={formErrors.address}>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    placeholder="House no., street, landmark…"
                    className={`input-warm resize-none ${formErrors.address ? "border-red-400" : ""}`}
                  />
                </Field>
              </Section>
            </div>
          )}

          {/* ════════════════════ STEP 2 — Pricing ════════════════════ */}
          {STEPS[step - 1] === "Pricing" && (
            <Section eyebrow="Pricing & terms">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Monthly rent (₹)" required error={formErrors.price}>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted select-none">₹</span>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="0"
                      className={`input-warm pl-8 ${formErrors.price ? "border-red-400" : ""}`}
                    />
                  </div>
                </Field>

                <Field label="Security deposit (₹)" error={formErrors.deposit}>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted select-none">₹</span>
                    <input
                      type="number"
                      name="deposit"
                      value={formData.deposit}
                      onChange={handleChange}
                      placeholder="0"
                      className="input-warm pl-8"
                    />
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Field label="Maintenance (₹)">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted select-none">₹</span>
                    <input
                      type="number"
                      name="maintenance"
                      value={formData.maintenance}
                      onChange={handleChange}
                      placeholder="0"
                      className="input-warm pl-8"
                    />
                  </div>
                </Field>

                <Field label="Frequency">
                  <select
                    name="maintenanceFreq"
                    value={formData.maintenanceFreq}
                    onChange={handleChange}
                    className="input-warm"
                  >
                    {MAINTENANCE_FREQS.map((opt) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Early leaving charges (₹)">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted select-none">₹</span>
                    <input
                      type="number"
                      name="earlyLeavingCharges"
                      value={formData.earlyLeavingCharges}
                      onChange={handleChange}
                      placeholder="0"
                      className="input-warm pl-8"
                    />
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Min. contract duration">
                  <select
                    name="minContractDuration"
                    value={formData.minContractDuration}
                    onChange={handleChange}
                    className="input-warm"
                  >
                    {CONTRACT_OPTIONS.map((opt) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Notice period">
                  <select
                    name="noticePeriod"
                    value={formData.noticePeriod}
                    onChange={handleChange}
                    className="input-warm"
                  >
                    {NOTICE_OPTIONS.map((opt) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </Section>
          )}

          {/* ════════════════════ STEP 3 — Amenities ════════════════════ */}
          {STEPS[step - 1] === "Amenities" && (
            <Section eyebrow="Amenities & facilities">
              <Field label="PG / room amenities">
                <div className="flex flex-wrap gap-2 mb-3">
                  {PG_AMENITIES_LIST.map((am) => (
                    <Chip
                      key={am}
                      active={formData.pgAmenities.includes(am)}
                      onClick={() => handleChipArrayToggle("pgAmenities", am)}
                    >
                      {am}
                    </Chip>
                  ))}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    name="pgAmenitiesInput"
                    value={formData.pgAmenitiesInput}
                    onChange={(e) => setField("pgAmenitiesInput", e.target.value)}
                    placeholder="Add custom amenity and press Enter"
                    onKeyDown={(e) => handleCustomAmenity(e, "pgAmenities", "pgAmenitiesInput")}
                    className="input-warm pr-20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-eyebrow text-muted pointer-events-none">
                    Enter
                  </span>
                </div>
              </Field>

              {formData.pgAmenities.length > 0 && (
                <div>
                  <p className="font-eyebrow text-muted mb-2">Selected amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.pgAmenities.map((am, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 bg-accent-soft text-accent px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {am}
                        <button
                          type="button"
                          onClick={() => handleChipArrayToggle("pgAmenities", am)}
                          className="hover:text-accent-hover leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* ════════════════════ STEP 4 — Photos ════════════════════ */}
          {STEPS[step - 1] === "Photos" && (
            <Section eyebrow="Property photos">

              {/* Existing images (edit mode) */}
              {isEdit && existingImages.length > 0 && (
                <div>
                  <p className="font-eyebrow text-muted mb-3">Existing photos</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {existingImages.map((name, idx) => {
                      const base = API.defaults.baseURL.replace("/api", "");
                      const url = `${base}/uploads/${name}`;
                      return (
                        <div key={`${name}-${idx}`} className="relative group rounded-xl overflow-hidden border border-rule aspect-square">
                          <img
                            src={url}
                            alt={`Existing ${idx + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 transition-all duration-200" />
                          <button
                            type="button"
                            onClick={() => setExistingImages((arr) => arr.filter((_, i) => i !== idx))}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-card text-ink flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-soft hover:bg-accent hover:text-white"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upload zone */}
              <div>
                <p className="font-eyebrow text-muted mb-3">
                  Upload photos
                  <span className="ml-2 normal-case" style={{ fontSize: "0.65rem" }}>
                    (max 8 · 1200×800 recommended)
                  </span>
                </p>

                <div
                  className={`border-2 border-dashed rounded-2xl bg-paper transition-colors ${
                    formData.images.length >= 8
                      ? "border-rule opacity-50"
                      : formErrors.images
                      ? "border-red-300"
                      : "border-rule hover:border-accent"
                  }`}
                >
                  <input
                    name="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleChange}
                    disabled={formData.images.length >= 8}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className={`flex flex-col items-center justify-center py-10 px-6 cursor-pointer ${
                      formData.images.length >= 8 ? "cursor-not-allowed" : ""
                    }`}
                  >
                    {/* Camera icon */}
                    <span className="w-14 h-14 rounded-full bg-accent-soft flex items-center justify-center mb-4">
                      <svg className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                      </svg>
                    </span>
                    <p className="font-medium text-ink text-sm">
                      {formData.images.length >= 8 ? "Maximum images uploaded" : "Click to browse photos"}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {formData.images.length >= 8 ? "" : `${8 - formData.images.length} slots remaining`}
                    </p>
                  </label>
                </div>

                {formErrors.images && (
                  <p className="mt-2 text-xs text-red-500">{formErrors.images}</p>
                )}

                {/* New image previews */}
                {formData.images.length > 0 && (
                  <div className="mt-5">
                    <p className="font-eyebrow text-muted mb-3">New uploads</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {formData.images.map((file, idx) => {
                        const url = URL.createObjectURL(file);
                        return (
                          <div key={`${file.name}-${idx}`} className="relative group rounded-xl overflow-hidden border border-rule aspect-square">
                            <img
                              src={url}
                              alt={`Property ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onLoad={() => URL.revokeObjectURL(url)}
                            />
                            <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 transition-all duration-200" />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-card text-ink flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-soft hover:bg-accent hover:text-white"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* ════════════════════ STEP 5 — Owner Info ════════════════════ */}
          {STEPS[step - 1] === "Owner Info" && (
            <Section eyebrow="Owner information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Full name" required error={formErrors.ownerName}>
                  <input
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className={`input-warm ${formErrors.ownerName ? "border-red-400" : ""}`}
                  />
                </Field>

                <Field label="Email address" required error={formErrors.ownerEmail}>
                  <input
                    type="email"
                    name="ownerEmail"
                    value={formData.ownerEmail}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className={`input-warm ${formErrors.ownerEmail ? "border-red-400" : ""}`}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Phone number" required error={formErrors.ownerPhone}>
                  <input
                    type="tel"
                    name="ownerPhone"
                    value={formData.ownerPhone}
                    onChange={handleChange}
                    maxLength={10}
                    placeholder="10-digit mobile"
                    className={`input-warm ${formErrors.ownerPhone ? "border-red-400" : ""}`}
                  />
                </Field>

                <Field label="ID proof type" error={formErrors.ownerIdType}>
                  <select
                    name="ownerIdType"
                    value={formData.ownerIdType}
                    onChange={handleChange}
                    className={`input-warm ${formErrors.ownerIdType ? "border-red-400" : ""}`}
                  >
                    <option value="">Select ID proof</option>
                    <option value="aadhaar">Aadhaar Card</option>
                    <option value="pan">PAN Card</option>
                    <option value="voter">Voter ID</option>
                    <option value="driving">Driving License</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="ID number" error={formErrors.ownerIdNumber}>
                  <input
                    name="ownerIdNumber"
                    value={formData.ownerIdNumber}
                    onChange={handleChange}
                    placeholder="Document number"
                    className={`input-warm ${formErrors.ownerIdNumber ? "border-red-400" : ""}`}
                  />
                </Field>

                <Field label="Upload ID proof" required error={formErrors.ownerIdFile}>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border bg-white text-ink transition ${
                      formErrors.ownerIdFile ? "border-red-400" : "border-rule"
                    }`}
                  >
                    <svg className="w-5 h-5 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                    </svg>
                    <input
                      type="file"
                      name="ownerIdFile"
                      accept="image/*,.pdf"
                      onChange={handleChange}
                      className="text-sm text-muted file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-accent-soft file:text-accent hover:file:bg-accent hover:file:text-white file:cursor-pointer file:transition"
                    />
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Ownership proof type" error={formErrors.ownershipProofType}>
                  <select
                    name="ownershipProofType"
                    value={formData.ownershipProofType}
                    onChange={handleChange}
                    className={`input-warm ${formErrors.ownershipProofType ? "border-red-400" : ""}`}
                  >
                    <option value="">Select proof type</option>
                    <option value="saleDeed">Sale Deed / Registry</option>
                    <option value="propertyTax">Property Tax Receipt</option>
                    <option value="electricityBill">Electricity Bill</option>
                    <option value="allotmentLetter">Allotment / Builder Letter</option>
                  </select>
                </Field>

                <Field label="Document number">
                  <input
                    name="ownershipProofDocNumber"
                    value={formData.ownershipProofDocNumber}
                    onChange={handleChange}
                    placeholder="Optional"
                    className="input-warm"
                  />
                </Field>
              </div>

              <Field label="Upload ownership proof" required error={formErrors.ownershipProofFile}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border bg-white text-ink transition ${
                    formErrors.ownershipProofFile ? "border-red-400" : "border-rule"
                  }`}
                >
                  <svg className="w-5 h-5 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <input
                    type="file"
                    name="ownershipProofFile"
                    accept="image/*,.pdf"
                    onChange={handleChange}
                    className="text-sm text-muted file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-accent-soft file:text-accent hover:file:bg-accent hover:file:text-white file:cursor-pointer file:transition"
                  />
                </div>
              </Field>
            </Section>
          )}

          {/* ════════════════════ REVIEW STEP ════════════════════ */}
          {step === totalSteps && (
            <div className="space-y-5">
              <Section eyebrow="Property details">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                  {[
                    ["Title", formData.title],
                    ["Available for", formData.availableFor],
                    ["Preferred tenants", formData.preferredTenants],
                    ["Occupancy type", formData.occupancyType],
                    ["Sharing", formData.sharingCount],
                    ["Bedrooms", formData.bedrooms],
                    ["Bathroom", formData.attachedBathroom],
                    ["Balcony", formData.attachedBalcony],
                    ["Furnishing", formData.roomFurnishing],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p className="font-eyebrow text-muted">{label}</p>
                      <p className="text-ink font-medium text-sm mt-0.5">{val || "—"}</p>
                    </div>
                  ))}
                  {formData.description && (
                    <div className="col-span-2 sm:col-span-3">
                      <p className="font-eyebrow text-muted">Description</p>
                      <p className="text-ink text-sm mt-0.5 leading-relaxed">{formData.description}</p>
                    </div>
                  )}
                </div>
              </Section>

              <Section eyebrow="Location">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                  {[
                    ["City", formData.city],
                    ["Locality", formData.locality],
                    ["Pincode", formData.pincode],
                    ["Available from", formData.availableFrom],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p className="font-eyebrow text-muted">{label}</p>
                      <p className="text-ink font-medium text-sm mt-0.5">{val || "—"}</p>
                    </div>
                  ))}
                  <div className="col-span-2 sm:col-span-3">
                    <p className="font-eyebrow text-muted">Address</p>
                    <p className="text-ink text-sm mt-0.5">{formData.address || "—"}</p>
                  </div>
                </div>
              </Section>

              <Section eyebrow="Pricing">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                  {[
                    ["Monthly rent", formData.price ? `₹${formData.price}` : "—"],
                    ["Security deposit", formData.deposit ? `₹${formData.deposit}` : "—"],
                    ["Maintenance", formData.maintenance ? `₹${formData.maintenance} (${formData.maintenanceFreq})` : "—"],
                    ["Contract duration", formData.minContractDuration],
                    ["Notice period", formData.noticePeriod],
                    ["Early leaving charges", formData.earlyLeavingCharges ? `₹${formData.earlyLeavingCharges}` : "—"],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p className="font-eyebrow text-muted">{label}</p>
                      <p className="text-ink font-medium text-sm mt-0.5">{val || "—"}</p>
                    </div>
                  ))}
                </div>
              </Section>

              <Section eyebrow="Amenities">
                {formData.pgAmenities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.pgAmenities.map((am, idx) => (
                      <span key={idx} className="bg-accent-soft text-accent px-3 py-1 rounded-full text-xs font-medium">
                        {am}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-sm">No amenities selected.</p>
                )}
              </Section>

              {user?.role !== "owner" && (
                <Section eyebrow="Owner information">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                    {[
                      ["Name", formData.ownerName],
                      ["Email", formData.ownerEmail],
                      ["Phone", formData.ownerPhone],
                      ["ID proof", formData.ownerIdType ? `${formData.ownerIdType}: ${formData.ownerIdNumber}` : "—"],
                      ["Ownership proof", formData.ownershipProofType ? `${formData.ownershipProofType}: ${formData.ownershipProofDocNumber || "—"}` : "—"],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <p className="font-eyebrow text-muted">{label}</p>
                        <p className="text-ink font-medium text-sm mt-0.5">{val || "—"}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              <Section eyebrow="Photos">
                {previewUrls.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {previewUrls.map((url, idx) => (
                      <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-rule">
                        <img src={url} alt={`Property ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-sm">No new photos added.</p>
                )}
              </Section>
            </div>
          )}

          {/* ════════════════════ Navigation buttons ════════════════════ */}
          <div className="flex items-center justify-between pt-2">
            {step > 1 ? (
              <button type="button" onClick={prevStep} disabled={uploading} className="btn-ghost disabled:opacity-50">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <button type="button" onClick={nextStep} disabled={uploading} className="btn-accent disabled:opacity-50 ml-auto">
                Continue
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button type="submit" disabled={uploading} className="btn-accent disabled:opacity-70 ml-auto min-w-[140px]">
                {uploading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Posting…
                  </>
                ) : (
                  <>
                    {isEdit ? "Save changes" : "Post property"}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
