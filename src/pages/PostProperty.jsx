import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

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
        alert("Please review the form and fix the highlighted errors.");
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
        alert(err.response?.data?.message || (isEdit ? "Failed to update property." : "Failed to post property."));
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
        alert("Failed to load property for editing");
      } finally {
        setLoadingPrefill(false);
      }
    })();
  }, [isEdit, id]);


  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">
          <span className="text-blue-600">{isEdit ? "Edit" : "List"}</span> Your Property
        </h2>
       <p className="text-gray-600 mt-2">
          {isEdit ? "Update your listing details" : "Reach thousands of potential tenants in just a few steps"}
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          {STEPS.map((label, idx) => (
            <div key={label} className="flex flex-col items-center z-10">
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-full border-2 font-medium transition-all duration-300
                  ${step === idx + 1 ? "bg-blue-600 text-white border-blue-600 transform scale-110" :
                    step > idx + 1 ? "bg-green-500 text-white border-green-500" :
                      "bg-white text-gray-400 border-gray-300"}`}
              >
                {idx + 1}
              </div>
              <span className={`mt-2 text-xs font-medium text-center max-w-20 ${step >= idx + 1 ? "text-gray-800" : "text-gray-400"}`}>{label}</span>
            </div>
          ))}
          <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-1">
            <div className="h-1 bg-gradient-to-r from-blue-600 to-green-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Property Details */}
        {STEPS[step - 1] === "Property Details" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Property Information</h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Listing Title*</label>
                  <input name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Spacious 2BHK in Vijay Nagar" className={`w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${formErrors.title ? "border-red-500" : "border-gray-300"}`} />
                  {formErrors.title && <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description*</label>
                  <textarea rows={3} name="description" value={formData.description} onChange={handleChange} placeholder="Describe the property, nearby amenities, rules, etc." className={`w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${formErrors.description ? "border-red-500" : "border-gray-300"}`} />
                  {formErrors.description && <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Available For</label>
                  <div className="flex flex-wrap gap-2">
                    {["Boys", "Girls", "Any"].map(opt => (<button type="button" key={opt} onClick={() => setField("availableFor", opt)} className={`px-4 py-2 rounded-full text-sm font-medium transition ${formData.availableFor === opt ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>{opt}</button>))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Tenants</label>
                  <div className="flex flex-wrap gap-2">
                    {["Students", "Working Professionals", "Any"].map(opt => (<button type="button" key={opt} onClick={() => setField("preferredTenants", opt)} className={`px-4 py-2 rounded-full text-sm font-medium transition ${formData.preferredTenants === opt ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>{opt}</button>))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Room Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Occupancy Type</label>
                  <div className="flex flex-wrap gap-2">
                    {["Single", "Shared", "Both"].map(opt => (<button type="button" key={opt} onClick={() => setField("occupancyType", opt)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${formData.occupancyType === opt ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>{opt}</button>))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sharing per Room</label>
                  <div className="flex flex-wrap gap-2">
                    {SHARING_OPTIONS.map(opt => (<button type="button" key={opt} onClick={() => setField("sharingCount", opt)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${formData.sharingCount === opt ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>{opt} {opt !== "5+" ? "People" : ""}</button>))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms*</label>
                  <input type="number" min={1} max={10} name="bedrooms" value={formData.bedrooms} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Attached Bathroom</label>
                  <div className="flex gap-2">
                    {["Yes", "No"].map(opt => (<button type="button" key={opt} onClick={() => setField("attachedBathroom", opt)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${formData.attachedBathroom === opt ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>{opt}</button>))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Attached Balcony</label>
                  <div className="flex gap-2">
                    {["Yes", "No"].map(opt => (<button type="button" key={opt} onClick={() => setField("attachedBalcony", opt)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${formData.attachedBalcony === opt ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>{opt}</button>))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Furnishing</label>
                  <div className="flex flex-wrap gap-2">
                    {FURNISHING_OPTIONS.map(opt => (<button type="button" key={opt} onClick={() => setFormData(f => ({ ...f, roomFurnishing: opt }))} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${formData.roomFurnishing === opt ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>{opt}</button>))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Floors</label>
                  <input type="number" min={1} name="totalFloors" value={formData.totalFloors} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Floor</label>
                  <input type="number" min={1} name="propertyOnFloor" value={formData.propertyOnFloor} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age of Property</label>
                  <select name="ageOfProperty" value={formData.ageOfProperty} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"><option value="">Select</option>{AGE_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}</select>
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Common Area Facilities</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {AMENITIES_LIST.map(am => (<button type="button" key={am} onClick={() => handleChipArrayToggle("commonAreaFacilities", am)} className={`px-3 py-1 rounded-full text-xs font-medium transition ${formData.commonAreaFacilities.includes(am) ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>{am}</button>))}
                </div>
                <div className="relative">
                  <input type="text" name="facilitiesInput" value={formData.facilitiesInput} onChange={(e) => setField('facilitiesInput', e.target.value)} placeholder="Type facility and press Enter" onKeyDown={(e) => handleCustomAmenity(e, 'commonAreaFacilities', 'facilitiesInput')} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  <span className="absolute right-3 top-2 text-xs text-gray-500">Press Enter</span>
                </div>
                {formData.commonAreaFacilities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.commonAreaFacilities.map((fac, idx) => (<span key={idx} className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs">{fac}<button type="button" onClick={() => handleChipArrayToggle("commonAreaFacilities", fac)} className="ml-2 text-blue-600 hover:text-blue-800">×</button></span>))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Location Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available From*</label>
                  <input type="date" name="availableFrom" value={formData.availableFrom} onChange={handleChange} min={minDate} className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.availableFrom ? "border-red-500" : "border-gray-300"}`} />
                  {formErrors.availableFrom && <p className="mt-1 text-sm text-red-600">{formErrors.availableFrom}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City*</label>
                  <input name="city" value={formData.city} onChange={handleChange} className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.city ? "border-red-500" : "border-gray-300"}`} />
                  {formErrors.city && <p className="mt-1 text-sm text-red-600">{formErrors.city}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Locality*</label>
                  <input name="locality" value={formData.locality} onChange={handleChange} className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.locality ? "border-red-500" : "border-gray-300"}`} />
                  {formErrors.locality && <p className="mt-1 text-sm text-red-600">{formErrors.locality}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode*</label>
                  <input name="pincode" value={formData.pincode} onChange={handleChange} maxLength={6} className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.pincode ? "border-red-500" : "border-gray-300"}`} />
                  {formErrors.pincode && <p className="mt-1 text-sm text-red-600">{formErrors.pincode}</p>}
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Address*</label>
                <textarea name="address" value={formData.address} onChange={handleChange} rows={2} className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.address ? "border-red-500" : "border-gray-300"}`} />
                {formErrors.address && <p className="mt-1 text-sm text-red-600">{formErrors.address}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Pricing */}
        {STEPS[step - 1] === "Pricing" && (
          <div className="bg-gray-50 p-6 rounded-xl animate-fadeIn">
            <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">Pricing & Terms</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent (₹)*</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                  <input type="number" name="price" value={formData.price} onChange={handleChange} className={`w-full pl-8 rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.price ? "border-red-500" : "border-gray-300"}`} />
                </div>
                {formErrors.price && <p className="mt-1 text-sm text-red-600">{formErrors.price}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                  <input type="number" name="deposit" value={formData.deposit} onChange={handleChange} className={`w-full pl-8 rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.deposit ? "border-red-500" : "border-gray-300"}`} />
                </div>
                {formErrors.deposit && <p className="mt-1 text-sm text-red-600">{formErrors.deposit}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                  <input type="number" name="maintenance" value={formData.maintenance} onChange={handleChange} className="w-full pl-8 rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <select name="maintenanceFreq" value={formData.maintenanceFreq} onChange={handleChange} className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300">{MAINTENANCE_FREQS.map(opt => <option key={opt}>{opt}</option>)}</select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Early Leaving Charges (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                  <input type="number" name="earlyLeavingCharges" value={formData.earlyLeavingCharges} onChange={handleChange} className="w-full pl-8 rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Contract Duration</label>
                <select name="minContractDuration" value={formData.minContractDuration} onChange={handleChange} className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300">{CONTRACT_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}</select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notice Period</label>
                <select name="noticePeriod" value={formData.noticePeriod} onChange={handleChange} className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300">{NOTICE_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}</select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Amenities */}
        {STEPS[step - 1] === "Amenities" && (
          <div className="bg-gray-50 p-6 rounded-xl animate-fadeIn">
            <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">Amenities & Facilities</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Select PG Amenities</label>
              <div className="flex flex-wrap gap-3 mb-4">
                {PG_AMENITIES_LIST.map(am => (<button type="button" key={am} onClick={() => handleChipArrayToggle("pgAmenities", am)} className={`px-4 py-2 rounded-lg border font-medium transition ${formData.pgAmenities.includes(am) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}>{am}</button>))}
              </div>
              <div className="relative">
                <input type="text" name="pgAmenitiesInput" value={formData.pgAmenitiesInput} onChange={(e) => setField('pgAmenitiesInput', e.target.value)} placeholder="Type custom amenity and press Enter" onKeyDown={(e) => handleCustomAmenity(e, 'pgAmenities', 'pgAmenitiesInput')} className="w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300" />
                <span className="absolute right-3 top-3.5 text-sm text-gray-500">Press Enter</span>
              </div>
              {formData.pgAmenities.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Selected Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {formData.pgAmenities.map((am, idx) => (<span key={idx} className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm">{am}<button type="button" onClick={() => handleChipArrayToggle("pgAmenities", am)} className="ml-2 text-blue-600 hover:text-blue-800">×</button></span>))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Photos */}
      {STEPS[step - 1] === "Photos" && (
          <div className="bg-gray-50 p-6 rounded-xl animate-fadeIn">
            <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">Upload Photos</h3>

            {isEdit && existingImages.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Existing Photos</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {existingImages.map((name, idx) => {
                    const base = API.defaults.baseURL.replace("/api", "");
                    const url = `${base}/uploads/${name}`;
                    return (
                      <div key={`${name}-${idx}`} className="relative group">
                        <img
                          src={url}
                          alt={`Existing ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          loading="lazy"
                        />
                        <button
                          type="button"
                          onClick={() => setExistingImages((arr) => arr.filter((_, i) => i !== idx))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Upload Property Images (Max 8)
                <span className="text-xs text-gray-500 ml-2">Recommended size: 1200x800px</span>
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition ${
                  formData.images.length >= 8 ? "border-gray-300 bg-gray-100" : "border-blue-400 bg-blue-50 hover:bg-blue-100"
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
                  className={`cursor-pointer flex flex-col items-center justify-center ${
                    formData.images.length >= 8 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <svg className="w-12 h-12 text-blue-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-700 mb-1">
                    {formData.images.length >= 8 ? "Maximum images uploaded" : "Click to browse or drag & drop"}
                  </p>
                  <p className="text-sm text-gray-500">{8 - formData.images.length} images remaining</p>
                </label>
              </div>
              {formErrors.images && <p className="mt-1 text-sm text-red-600">{formErrors.images}</p>}

              {formData.images.length > 0 && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Uploaded Images</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {formData.images.map((file, idx) => {
                      const url = URL.createObjectURL(file);
                      return (
                        <div key={`${file.name}-${idx}`} className="relative group">
                          <img
                            src={url}
                            alt={`Property ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                            onLoad={() => URL.revokeObjectURL(url)}
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
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
          </div>
        )}


        {/* Step 5: Owner Info */}
        {STEPS[step - 1] === "Owner Info" && (
          <div className="bg-gray-50 p-6 rounded-xl animate-fadeIn">
            <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">Owner Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
                <input name="ownerName" value={formData.ownerName} onChange={handleChange} className={`w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.ownerName ? "border-red-500" : "border-gray-300"}`} />
                {formErrors.ownerName && <p className="mt-1 text-sm text-red-600">{formErrors.ownerName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                <input type="email" name="ownerEmail" value={formData.ownerEmail} onChange={handleChange} className={`w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.ownerEmail ? "border-red-500" : "border-gray-300"}`} />
                {formErrors.ownerEmail && <p className="mt-1 text-sm text-red-600">{formErrors.ownerEmail}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number*</label>
                <input type="tel" name="ownerPhone" value={formData.ownerPhone} onChange={handleChange} maxLength={10} className={`w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.ownerPhone ? "border-red-500" : "border-gray-300"}`} />
                {formErrors.ownerPhone && <p className="mt-1 text-sm text-red-600">{formErrors.ownerPhone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof Type*</label>
                <select name="ownerIdType" value={formData.ownerIdType} onChange={handleChange} className={`w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.ownerIdType ? "border-red-500" : "border-gray-300"}`}>
                  <option value="">Select ID Proof</option>
                  <option value="aadhaar">Aadhaar Card</option>
                  <option value="pan">PAN Card</option>
                  <option value="voter">Voter ID</option>
                  <option value="driving">Driving License</option>
                </select>
                {formErrors.ownerIdType && <p className="mt-1 text-sm text-red-600">{formErrors.ownerIdType}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Number*</label>
                <input name="ownerIdNumber" value={formData.ownerIdNumber} onChange={handleChange} className={`w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.ownerIdNumber ? "border-red-500" : "border-gray-300"}`} />
                {formErrors.ownerIdNumber && <p className="mt-1 text-sm text-red-600">{formErrors.ownerIdNumber}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload ID Proof*</label>
                <div className={`border rounded-lg p-3 ${formErrors.ownerIdFile ? "border-red-500" : "border-gray-300"}`}>
                  <input type="file" name="ownerIdFile" accept="image/*,.pdf" onChange={handleChange} className="w-full" />
                </div>
                {formErrors.ownerIdFile && <p className="mt-1 text-sm text-red-600">{formErrors.ownerIdFile}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ownership Proof Type*</label>
                <select name="ownershipProofType" value={formData.ownershipProofType} onChange={handleChange} className={`w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.ownershipProofType ? "border-red-500" : "border-gray-300"}`}>
                  <option value="">Select Proof Type</option>
                  <option value="saleDeed">Sale Deed/Registry</option>
                  <option value="propertyTax">Property Tax Receipt</option>
                  <option value="electricityBill">Electricity Bill</option>
                  <option value="allotmentLetter">Allotment/Builder Letter</option>
                </select>
                {formErrors.ownershipProofType && <p className="mt-1 text-sm text-red-600">{formErrors.ownershipProofType}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Number</label>
                <input name="ownershipProofDocNumber" value={formData.ownershipProofDocNumber} onChange={handleChange} className="w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300" />
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Ownership Proof*</label>
              <div className={`border rounded-lg p-3 ${formErrors.ownershipProofFile ? "border-red-500" : "border-gray-300"}`}>
                <input type="file" name="ownershipProofFile" accept="image/*,.pdf" onChange={handleChange} className="w-full" />
              </div>
              {formErrors.ownershipProofFile && <p className="mt-1 text-sm text-red-600">{formErrors.ownershipProofFile}</p>}
            </div>
          </div>
        )}

        {/* Review Step */}
        {step === totalSteps && (
          <div className="bg-gray-50 p-6 rounded-xl animate-fadeIn">
            <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">Review Your Listing</h3>
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                <h4 className="font-bold text-lg text-blue-600 mb-3">Property Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><p className="text-sm text-gray-500">Title</p><p className="font-medium">{formData.title || "—"}</p></div>
                  <div><p className="text-sm text-gray-500">Description</p><p className="font-medium">{formData.description || "—"}</p></div>
                  <div><p className="text-sm text-gray-500">Available For</p><p className="font-medium">{formData.availableFor || "—"}</p></div>
                  <div><p className="text-sm text-gray-500">Preferred Tenants</p><p className="font-medium">{formData.preferredTenants || "—"}</p></div>
                  <div><p className="text-sm text-gray-500">Occupancy Type</p><p className="font-medium">{formData.occupancyType || "—"}</p></div>
                  <div><p className="text-sm text-gray-500">Sharing per Room</p><p className="font-medium">{formData.sharingCount || "—"}</p></div>
                  <div><p className="text-sm text-gray-500">Bedrooms</p><p className="font-medium">{formData.bedrooms || "—"}</p></div>
                  <div><p className="text-sm text-gray-500">Furnishing</p><p className="font-medium">{formData.roomFurnishing || "—"}</p></div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                <h4 className="font-bold text-lg text-blue-600 mb-3">Location</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><p className="text-sm text-gray-500">Address</p><p className="font-medium">{formData.address || "—"}</p></div>
                  <div><p className="text-sm text-gray-500">Locality</p><p className="font-medium">{formData.locality || "—"}</p></div>
                  <div><p className="text-sm text-gray-500">City</p><p className="font-medium">{formData.city || "—"}</p></div>
                  <div><p className="text-sm text-gray-500">Pincode</p><p className="font-medium">{formData.pincode || "—"}</p></div>
                  <div><p className="text-sm text-gray-500">Available From</p><p className="font-medium">{formData.availableFrom || "—"}</p></div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                <h4 className="font-bold text-lg text-blue-600 mb-3">Pricing</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><p className="text-sm text-gray-500">Monthly Rent</p><p className="font-medium">₹{formData.price || "—"}</p></div>
                  <div><p className="text-sm text-gray-500">Security Deposit</p><p className="font-medium">₹{formData.deposit || "—"}</p></div>
                  <div><p className="text-sm text-gray-500">Maintenance</p><p className="font-medium">₹{formData.maintenance || "—"} {formData.maintenanceFreq ? `(${formData.maintenanceFreq})` : ""}</p></div>
                  <div><p className="text-sm text-gray-500">Contract Duration</p><p className="font-medium">{formData.minContractDuration || "—"}</p></div>
                  <div><p className="text-sm text-gray-500">Notice Period</p><p className="font-medium">{formData.noticePeriod || "—"}</p></div>
                  <div><p className="text-sm text-gray-500">Early Leaving Charges</p><p className="font-medium">₹{formData.earlyLeavingCharges || "—"}</p></div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                <h4 className="font-bold text-lg text-blue-600 mb-3">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.pgAmenities.length > 0 ? formData.pgAmenities.map((am, idx) => (<span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">{am}</span>)) : (<p className="text-gray-500">No amenities selected</p>)}
                </div>
              </div>
              {user?.role !== "owner" && (
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="font-bold text-lg text-blue-600 mb-3">Owner Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><p className="text-sm text-gray-500">Name</p><p className="font-medium">{formData.ownerName || "—"}</p></div>
                    <div><p className="text-sm text-gray-500">Email</p><p className="font-medium">{formData.ownerEmail || "—"}</p></div>
                    <div><p className="text-sm text-gray-500">Phone</p><p className="font-medium">{formData.ownerPhone || "—"}</p></div>
                    <div><p className="text-sm text-gray-500">ID Proof</p><p className="font-medium">{formData.ownerIdType || "—"}: {formData.ownerIdNumber || "—"}</p></div>
                    <div><p className="text-sm text-gray-500">Ownership Proof</p><p className="font-medium">{formData.ownershipProofType || "—"}: {formData.ownershipProofDocNumber || "—"}</p></div>
                  </div>
                </div>
              )}
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                <h4 className="font-bold text-lg text-blue-600 mb-3">Photos</h4>
                {formData.images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {formData.images.map((file, idx) => {
                      const url = URL.createObjectURL(file);
                      return (<img key={idx} src={url} alt={`Property ${idx + 1}`} className="w-full h-24 object-cover rounded-lg border border-gray-200" onLoad={() => URL.revokeObjectURL(url)} />);
                    })}
                  </div>
                ) : (<p className="text-gray-500">No photos uploaded</p>)}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {step > 1 ? (<button type="button" onClick={prevStep} disabled={uploading} className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition disabled:opacity-50">Back</button>) : (<div />)}
          {step < totalSteps ? (<button type="button" onClick={nextStep} disabled={uploading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50 ml-auto">Continue</button>) : (
            <button type="submit" disabled={uploading} className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 text-white font-bold rounded-lg shadow-md transition disabled:opacity-70 ml-auto flex items-center">
              {uploading ? (<><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Posting...</>) : "Post Property"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
