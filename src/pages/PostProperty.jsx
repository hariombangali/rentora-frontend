import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function PostProperty() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Step labels depending on role
  const STEPS = user?.role === "owner"
    ? ["Basic", "Location", "Rent & Amenities", "Photos", "Review"]
    : ["Basic", "Location", "Rent & Amenities", "Photos", "Owner Info", "Review"];

  const totalSteps = STEPS.length;

  // Current step
  const [step, setStep] = useState(1);

  // Form data state (including owner KYC + ownership proof)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    deposit: "",
    type: "1BHK",
    furnishing: "Furnished",
    city: "",
    locality: "",
    address: "",
    pincode: "",
    availableFrom: "",
    tenants: "Any",
    amenities: [],
    images: [],

    // Owner KYC fields (only filled if new owner)
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    ownerIdType: "",
    ownerIdNumber: "",
    ownerIdFile: null,

    // Ownership Proof fields
    ownershipProofType: "",
    ownershipProofDocNumber: "",
    ownershipProofFile: null,
  });

  const [uploading, setUploading] = useState(false);

  // Upon mount, autofill owner info if user is already owner
  useEffect(() => {
    if (user?.role === "owner") {
      setFormData((prev) => ({
        ...prev,
        ownerName: user.name || "",
        ownerEmail: user.email || "",
        ownerPhone: user.phone || "",
        // Files can't be prefilled so left as null
      }));
    }
  }, [user]);

  const amenitiesList = [
    "Wi-Fi", "Parking", "Balcony", "Water Supply",
    "AC", "Power Backup", "Lift"
  ];

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));
  const progressPercent = (step * 100) / totalSteps;

  // Universal change handler
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file" && (name === "ownerIdFile" || name === "ownershipProofFile")) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else if (type === "file" && name === "images") {
      setFormData((prev) => ({ ...prev, images: [...files] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Amenities toggle handler
  const handleAmenityChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(value)
        ? prev.amenities.filter((a) => a !== value)
        : [...prev.amenities, value],
    }));
  };

  // Submit handler for the entire form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    const data = new FormData();

    // Append nested location fields
    data.append("location.city", formData.city);
    data.append("location.locality", formData.locality);
    data.append("location.address", formData.address);
    data.append("location.pincode", formData.pincode);

    // Append other property info
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("price", formData.price);
    data.append("deposit", formData.deposit || "0");
    data.append("type", formData.type);
    data.append("furnishing", formData.furnishing);
    data.append("tenants", formData.tenants);
    data.append("availableFrom", formData.availableFrom);

    // Append amenities array
    formData.amenities.forEach((a) => data.append("amenities", a));

    // Append images (multiple files)
    formData.images.forEach((img) => data.append(`propertyImages`, img));

    // Only append owner info if user is NOT yet owner
    if (user?.role !== "owner") {
      data.append("ownerKYC.ownerName", formData.ownerName);
      data.append("ownerKYC.ownerEmail", formData.ownerEmail);
      data.append("ownerKYC.ownerPhone", formData.ownerPhone);
      data.append("ownerKYC.ownerIdType", formData.ownerIdType);
      data.append("ownerKYC.ownerIdNumber", formData.ownerIdNumber);
      if (formData.ownerIdFile) data.append("kycDocument", formData.ownerIdFile);

      data.append("ownershipProof.ownershipProofType", formData.ownershipProofType);
      data.append("ownershipProof.ownershipProofDocNumber", formData.ownershipProofDocNumber);
      if (formData.ownershipProofFile) data.append("ownershipProof", formData.ownershipProofFile);
    }

    try {
      const token = localStorage.getItem("token");
      const res = await API.post("/properties", data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setUploading(false);

      if (res.status === 201) {
        alert("Property Posted Successfully!");
        // Upgrade role if first property
        if (user?.role !== "owner") {
          await API.put("/auth/upgrade-role", { role: "owner" }, { headers: { Authorization: `Bearer ${token}` } });
        }
        navigate("/my-properties");
      } else {
        alert(res.data.message || "Something went wrong!");
      }
    } catch (err) {
      setUploading(false);
      alert("Failed to post property.");
      console.error(err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white/95 rounded-2xl shadow-2xl border border-blue-100">
      <h2 className="text-3xl font-extrabold mb-2 text-center">
        <span className="text-blue-700">List</span> Your Property
      </h2>
      <p className="text-center text-gray-700 mb-8">Get noticed by thousands — just a few easy steps</p>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((label, idx) => (
          <div key={label} className="flex-1 flex flex-col items-center relative">
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-full border-2 font-bold transition
                ${
                  step === idx + 1
                    ? "bg-blue-700 text-white border-blue-700 scale-110 shadow-lg"
                    : "bg-gray-200 text-gray-400 border-gray-300"
                }
                ${step > idx + 1 ? "bg-green-400 border-green-400 text-white" : ""}
              `}
            >
              {idx + 1}
            </div>
            <span
              className={`mt-2 text-xs md:text-sm text-center truncate ${step === idx + 1 ? "text-blue-700 font-semibold" : "text-gray-400"}`}
            >
              {label}
            </span>
            {idx < totalSteps - 1 && (
              <div
                className={`absolute top-1/2 left-full h-1 rounded ${step > idx + 1 ? "bg-green-400" : "bg-gray-300"}`}
                style={{ width: 54, marginLeft: 0, zIndex: -1 }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 mb-8 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-blue-700 to-yellow-400 transition-all" style={{ width: `${progressPercent}%` }} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Basic */}
        {step === 1 && (
          <div className="grid gap-5">
            <label className="font-semibold">
              Title
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., 1BHK in Vijay Nagar"
                required
                className="w-full mt-1 rounded-lg border border-blue-300 px-4 py-3 bg-blue-50 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
              />
            </label>
            <label className="font-semibold">
              Description
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Describe the property"
                required
                className="w-full mt-1 rounded-lg border border-blue-300 px-4 py-3 bg-blue-50 focus:ring-2 focus:ring-yellow-400"
              />
            </label>
            <div className="flex gap-4">
              <label className="flex-1 font-semibold">
                Type
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full mt-1 rounded-lg border border-blue-300 px-3 py-2 bg-white"
                >
                  <option>1BHK</option>
                  <option>2BHK</option>
                  <option>Studio</option>
                  <option>PG</option>
                </select>
              </label>
              <label className="flex-1 font-semibold">
                Furnishing
                <select
                  name="furnishing"
                  value={formData.furnishing}
                  onChange={handleChange}
                  className="w-full mt-1 rounded-lg border border-blue-300 px-3 py-2 bg-white"
                >
                  <option>Furnished</option>
                  <option>Semi-Furnished</option>
                  <option>Unfurnished</option>
                </select>
              </label>
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="grid gap-5">
            <label className="font-semibold">
              City
              <input
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g., Indore"
                required
                className="w-full mt-1 rounded-lg border border-blue-300 px-4 py-3 bg-blue-50"
              />
            </label>
            <label className="font-semibold">
              Locality
              <input
                name="locality"
                value={formData.locality}
                onChange={handleChange}
                placeholder="e.g., Vijay Nagar"
                required
                className="w-full mt-1 rounded-lg border border-blue-300 px-4 py-3 bg-blue-50"
              />
            </label>
            <label className="font-semibold">
              Full Address
              <input
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Building, Street, Landmark"
                required
                className="w-full mt-1 rounded-lg border border-blue-300 px-4 py-3 bg-blue-50"
              />
            </label>
            <label className="font-semibold">
              Pincode
              <input
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                maxLength={6}
                placeholder="452001"
                required
                className="w-full mt-1 rounded-lg border border-blue-300 px-4 py-3 bg-blue-50"
              />
            </label>
          </div>
        )}

        {/* Step 3: Rent & Amenities */}
        {step === 3 && (
          <div className="grid gap-5">
            <div className="flex gap-4">
              <label className="flex-1 font-semibold">
                Monthly Rent (₹)
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Rent per month"
                  required
                  className="w-full mt-1 rounded-lg border border-blue-300 px-4 py-3 bg-blue-50"
                />
              </label>
              <label className="flex-1 font-semibold">
                Security Deposit (₹)
                <input
                  type="number"
                  name="deposit"
                  value={formData.deposit}
                  onChange={handleChange}
                  placeholder="(Optional)"
                  className="w-full mt-1 rounded-lg border border-blue-300 px-4 py-3 bg-blue-50"
                />
              </label>
            </div>
            <label className="font-semibold">
              Preferred Tenants
              <select
                name="tenants"
                value={formData.tenants}
                onChange={handleChange}
                className="w-full mt-1 rounded-lg border border-blue-300 px-3 py-2 bg-white"
              >
                <option>Any</option>
                <option>Students</option>
                <option>Working Professionals</option>
                <option>Family</option>
              </select>
            </label>

            <label className="font-semibold">
              Available From
              <input
                type="date"
                name="availableFrom"
                value={formData.availableFrom}
                onChange={handleChange}
                className="w-full mt-1 rounded-lg border border-blue-300 px-4 py-3 bg-blue-50"
                required
              />
            </label>

            <label className="block font-semibold mb-1">Amenities</label>
            <div className="flex flex-wrap gap-4">
              {amenitiesList.map((am) => (
                <label
                  key={am}
                  className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg shadow-sm cursor-pointer hover:bg-blue-100 transition"
                >
                  <input
                    type="checkbox"
                    value={am}
                    checked={formData.amenities.includes(am)}
                    onChange={handleAmenityChange}
                    className="accent-blue-600 size-4"
                  />
                  <span className="text-blue-900">{am}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Photos */}
        {step === 4 && (
          <div>
            <label className="block font-semibold mb-2">
              Upload Photos (up to 8)
            </label>
            <input
              name="images"
              type="file"
              multiple
              accept="image/*"
              onChange={handleChange}
              className="block w-full border border-blue-300 rounded-lg p-2 mb-2 bg-blue-50"
              disabled={formData.images.length >= 8}
            />
            <div className="grid grid-cols-3 gap-4 mt-4">
              {[...formData.images]
                .slice(0, 8)
                .map((file, idx) => {
                  const url = URL.createObjectURL(file);
                  return (
                    <img
                      key={idx}
                      src={url}
                      alt={`Property image ${idx + 1}`}
                      className="rounded-lg w-full h-28 object-cover border border-gray-200 shadow"
                      onLoad={() => setTimeout(() => URL.revokeObjectURL(url), 1000)}
                    />
                  );
                })}
            </div>
            <div className="mt-2 text-sm text-gray-500">
              You can upload {8 - formData.images.length} more photo(s).
            </div>
          </div>
        )}

        {/* Step 5: Owner Info (only if user isn't owner) */}
        {step === 5 && user?.role !== "owner" && (
          <div className="grid gap-5">
            <h3 className="text-xl font-semibold text-blue-700 mb-3">
              Owner Information
            </h3>
            <input
              name="ownerName"
              type="text"
              value={formData.ownerName}
              onChange={handleChange}
              placeholder="Owner Full Name"
              required
              className="rounded-lg border border-blue-300 px-4 py-3 w-full bg-blue-50"
            />
            <input
              name="ownerEmail"
              type="email"
              value={formData.ownerEmail}
              onChange={handleChange}
              placeholder="Owner Email"
              required
              className="rounded-lg border border-blue-300 px-4 py-3 w-full bg-blue-50"
            />
            <input
              name="ownerPhone"
              type="tel"
              maxLength={10}
              value={formData.ownerPhone}
              onChange={handleChange}
              placeholder="Owner Phone"
              required
              className="rounded-lg border border-blue-300 px-4 py-3 w-full bg-blue-50"
            />
            <select
              name="ownerIdType"
              value={formData.ownerIdType}
              onChange={handleChange}
              required
              className="rounded-lg border border-blue-300 w-full px-3 py-2 bg-white"
            >
              <option value="">Select ID Proof Type</option>
              <option value="aadhaar">Aadhaar Card</option>
              <option value="pan">PAN Card</option>
              <option value="voter">Voter ID</option>
              <option value="driving">Driving License</option>
            </select>
            <input
              name="ownerIdNumber"
              type="text"
              value={formData.ownerIdNumber}
              onChange={handleChange}
              placeholder="ID Number"
              required
              className="rounded-lg border border-blue-300 px-4 py-3 w-full bg-blue-50"
            />
            <label className="block font-semibold mb-2">
              Upload ID Proof (PDF/JPG/PNG)
            </label>
            <input
              name="ownerIdFile"
              type="file"
              accept="image/*,application/pdf"
              onChange={handleChange}
              required
              className="block w-full border border-blue-300 rounded-lg p-2 bg-blue-50"
            />
            {formData.ownerIdFile && (
              <div className="mt-2 text-xs text-blue-800">{formData.ownerIdFile.name}</div>
            )}

            {/* Ownership proof */}
            <label className="block font-semibold mt-6 mb-2">
              Property Ownership Proof Type
            </label>
            <select
              name="ownershipProofType"
              value={formData.ownershipProofType}
              onChange={handleChange}
              required
              className="rounded-lg border border-blue-300 w-full px-3 py-2 bg-white"
            >
              <option value="">Select Property Document</option>
              <option value="saleDeed">Registered Sale Deed / Registry</option>
              <option value="propertyTax">Property Tax Receipt</option>
              <option value="electricityBill">Recent Electricity Bill</option>
              <option value="allotmentLetter">Allotment Letter / Builder Letter</option>
            </select>
            <input
              name="ownershipProofDocNumber"
              type="text"
              value={formData.ownershipProofDocNumber}
              onChange={handleChange}
              placeholder="Document Number / Bill Ref (Optional)"
              className="rounded-lg border border-blue-300 px-4 py-3 w-full bg-blue-50 mt-2"
            />
            <label className="block font-semibold mt-4 mb-2">
              Upload Property Proof (PDF/JPG/PNG)
            </label>
            <input
              name="ownershipProofFile"
              type="file"
              accept="image/*,application/pdf"
              onChange={handleChange}
              required
              className="block w-full border border-blue-300 rounded-lg p-2 bg-blue-50"
            />
            {formData.ownershipProofFile && (
              <div className="mt-2 text-xs text-blue-800">{formData.ownershipProofFile.name}</div>
            )}
          </div>
        )}

        {/* Step 6: Review step for all users */}
        {step === totalSteps && (
          <div className="space-y-5">
            <h3 className="text-2xl font-semibold text-blue-700 text-center mb-4">
              Review Your Listing
            </h3>
            <ul className="divide-y divide-blue-100 bg-blue-50 rounded-lg p-4 shadow">
              {[
                ["Title", formData.title],
                ["Description", formData.description],
                ["Type", formData.type],
                ["Furnishing", formData.furnishing],
                ["Rent", `₹${formData.price}`],
                ["Deposit", formData.deposit ? `₹${formData.deposit}` : "N/A"],
                ["Tenants", formData.tenants],
                ["City", formData.city],
                ["Locality", formData.locality],
                ["Address", formData.address],
                ["Pincode", formData.pincode],
                ["Amenities", formData.amenities.length > 0 ? formData.amenities.join(", ") : "None"],
                ["Photos", `${formData.images.length || 0} uploaded`],
                ...(user?.role !== "owner"
                  ? [
                      ["Owner Name", formData.ownerName],
                      ["Owner Email", formData.ownerEmail],
                      ["Owner Phone", formData.ownerPhone],
                      ["ID Proof", formData.ownerIdType],
                      ["ID Number", formData.ownerIdNumber],
                      ["ID Proof File", formData.ownerIdFile?.name || "❌"],
                      ["Ownership Proof Type", formData.ownershipProofType],
                      ["Ownership Proof Doc Number", formData.ownershipProofDocNumber || "N/A"],
                      ["Ownership Proof File", formData.ownershipProofFile?.name || "❌"],
                    ]
                  : []),
              ].map(([k, v]) => (
                <li key={k} className="py-3 flex flex-col md:flex-row md:items-center gap-2">
                  <span className="font-semibold text-gray-700 md:w-48">{k}</span>
                  <span className="text-gray-800">{v}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center mt-8 justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              disabled={uploading}
              className="rounded-full px-7 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold shadow transition disabled:opacity-60"
            >
              Back
            </button>
          ) : (
            <div />
          )}
          {step < totalSteps ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={uploading}
              className="rounded-full px-7 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold shadow transition disabled:opacity-60 ml-auto"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={uploading}
              className="rounded-full px-9 py-2 bg-gradient-to-r from-blue-700 to-yellow-400 hover:from-yellow-400 hover:to-blue-700 text-blue-900 font-bold shadow-lg transition disabled:opacity-60 ml-auto"
            >
              {uploading ? "Uploading..." : "Post Property"}
            </button>
          )}
        </div>
      </form>
    </div>
  );

  // Helper functions for navigation
  // function prevStep() {
  //   setStep((s) => Math.max(s - 1, 1));
  // }
  // function nextStep() {
  //   setStep((s) => Math.min(s + 1, totalSteps));
  // }
}
