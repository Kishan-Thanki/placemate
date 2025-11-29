import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DashboardLayout,
  PageContainer,
  Section,
} from "../../../components/layout";
import { Button, LoadingOverlay } from "../../../components/ui";
import { useTheme } from "../../../contexts/ThemeContext";
import { ArrowLeft, Plus, X } from "lucide-react";
import { companyService, placementService, lookupService, companyDriveService } from "../../../services";

export default function CompanyDriveForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");

  // Dropdown data
  const [companies, setCompanies] = useState([]);
  const [placementDrives, setPlacementDrives] = useState([]);
  const [cities, setCities] = useState([]);

  const [formData, setFormData] = useState({
    placement_drive: "",
    company: "",
    drive_type: "",
    job_mode: "",
    multiple_allowed: false,
    application_deadline: "",
    status: "Open",
    rounds: [""], // Array of round strings
    locations: [""], // Array of city IDs (integers)
  });

  const isEditMode = !!id;

  useEffect(() => {
    const loadData = async () => {
      await fetchDropdownData();
      if (isEditMode) {
        await fetchDriveData();
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode]);

  const fetchDriveData = async () => {
    try {
      setLoadingData(true);
      const response = await companyDriveService.getDriveById(id);
      const driveData = response?.data || response;

      // Parse rounds - convert array to array
      let roundsArray = [""];
      if (driveData.rounds) {
        if (typeof driveData.rounds === "string") {
          // In case backend still returns string, split it
          roundsArray = driveData.rounds.split(",").map((r) => r.trim()).filter((r) => r);
        } else if (Array.isArray(driveData.rounds)) {
          roundsArray = driveData.rounds.filter((r) => r);
        }
      }
      if (roundsArray.length === 0) roundsArray = [""];

      // Parse locations - convert array of city IDs to array
      let locationsArray = [""];
      if (driveData.locations && Array.isArray(driveData.locations)) {
        locationsArray = driveData.locations.filter((l) => l);
      }
      if (locationsArray.length === 0) locationsArray = [""];

      setFormData({
        placement_drive: driveData.placement_drive?.id || driveData.placement_drive || "",
        company: driveData.company?.id || driveData.company || "",
        drive_type: driveData.drive_type || "",
        job_mode: driveData.job_mode || "",
        multiple_allowed: driveData.multiple_allowed || false,
        application_deadline: driveData.application_deadline
          ? new Date(driveData.application_deadline).toISOString().slice(0, 16)
          : "",
        status: driveData.status || "Open",
        rounds: roundsArray,
        locations: locationsArray,
      });
    } catch (err) {
      console.error("Error fetching drive data:", err);
      setError("Failed to load drive data");
    } finally {
      setLoadingData(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      setLoadingData(true);

      // Fetch companies
      const companiesRes = await companyService.getAllCompanies();
      const companiesList =
        companiesRes?.data || companiesRes?.results || companiesRes || [];
      setCompanies(Array.isArray(companiesList) ? companiesList : []);

      // Fetch placement drives
      const drivesRes = await placementService.getAllDrives();
      const drivesList =
        drivesRes?.data || drivesRes?.results || drivesRes || [];
      setPlacementDrives(Array.isArray(drivesList) ? drivesList : []);

      // Fetch cities
      const citiesRes = await lookupService.getCities();
      const citiesList =
        citiesRes?.data || citiesRes?.results || citiesRes || [];
      setCities(Array.isArray(citiesList) ? citiesList : []);
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
      setError("Failed to load form data. Please refresh the page.");
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle dynamic rounds array
  const handleRoundChange = (index, value) => {
    const newRounds = [...formData.rounds];
    newRounds[index] = value;
    setFormData((prev) => ({ ...prev, rounds: newRounds }));
  };

  const addRound = () => {
    setFormData((prev) => ({ ...prev, rounds: [...prev.rounds, ""] }));
  };

  const removeRound = (index) => {
    if (formData.rounds.length > 1) {
      const newRounds = formData.rounds.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, rounds: newRounds }));
    }
  };

  // Handle dynamic locations array
  const handleLocationChange = (index, value) => {
    const newLocations = [...formData.locations];
    newLocations[index] = value ? parseInt(value) : ""; // Store city ID as integer
    setFormData((prev) => ({ ...prev, locations: newLocations }));
  };

  const addLocation = () => {
    setFormData((prev) => ({ ...prev, locations: [...prev.locations, ""] }));
  };

  const removeLocation = (index) => {
    if (formData.locations.length > 1) {
      const newLocations = formData.locations.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, locations: newLocations }));
    }
  };

  const validateForm = () => {
    if (!formData.placement_drive) {
      setError("Please select a placement drive");
      return false;
    }
    if (!formData.company) {
      setError("Please select a company");
      return false;
    }
    if (!formData.drive_type) {
      setError("Please select drive type");
      return false;
    }
    if (!formData.job_mode) {
      setError("Please select job mode");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError("");

    if (!validateForm()) {
      return;
    }

    // Convert rounds array to array of strings (filter empty values)
    const roundsArray = formData.rounds
      .filter((r) => r.trim())
      .map((r) => r.trim());

    // Convert locations array to array of city IDs (filter empty values)
    const locationsArray = formData.locations.filter((l) => l !== "");

    // Prepare data for next step
    const dataToSave = {
      placement_drive: parseInt(formData.placement_drive),
      company: parseInt(formData.company),
      drive_type: formData.drive_type,
      job_mode: formData.job_mode,
      multiple_allowed: formData.multiple_allowed,
      application_deadline: formData.application_deadline || null,
      status: formData.status || "Open",
      rounds: roundsArray.length > 0 ? roundsArray : null,
      locations: locationsArray.length > 0 ? locationsArray : null,
    };

    // Save to localStorage for next step (job form)
    localStorage.setItem("companyDriveBasicDetails", JSON.stringify(dataToSave));
    
    // Navigate to job details form
    navigate("/admin/drives/new/jobs");
  };

  const handleSave = async () => {
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Convert rounds array to array of strings (filter empty values)
      const roundsArray = formData.rounds
        .filter((r) => r.trim())
        .map((r) => r.trim());

      // Convert locations array to array of city IDs (filter empty values)
      const locationsArray = formData.locations.filter((l) => l !== "");

      // Prepare data for update
      const updateData = {
        placement_drive: parseInt(formData.placement_drive),
        company: parseInt(formData.company),
        drive_type: formData.drive_type,
        job_mode: formData.job_mode,
        multiple_allowed: formData.multiple_allowed,
        application_deadline: formData.application_deadline || null,
        status: formData.status || "Open",
        rounds: roundsArray.length > 0 ? roundsArray : null,
        locations: locationsArray.length > 0 ? locationsArray : null,
      };

      console.log("Updating company drive:", updateData);

      await companyDriveService.updateDrive(id, updateData);

      // Show success message
      const successMsg = document.createElement("div");
      successMsg.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        isDark ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800"
      }`;
      successMsg.textContent = "Company drive updated successfully!";
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);

      // Navigate back to details page
      setTimeout(() => navigate(`/admin/drives/${id}`), 1000);
    } catch (err) {
      console.error("Error updating company drive:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update company drive"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    localStorage.removeItem("companyDriveBasicDetails");
    if (isEditMode) {
      navigate(`/admin/drives/${id}`);
    } else {
      navigate("/admin/drives");
    }
  };

  if (loadingData) {
    return (
      <DashboardLayout title="Add Company Drive">
        <PageContainer>
          <LoadingOverlay message="Loading form data..." />
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={isEditMode ? "Edit Company Drive" : "Add Company Drive"}>
      <PageContainer>
        {/* Back Button */}
        <div className="mb-4">
          <Button variant="outline" onClick={() => navigate("/admin/drives")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Company Drives
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              isDark
                ? "bg-red-900/20 border-red-900 text-red-400"
                : "bg-red-50 border-red-200 text-red-600"
            }`}
          >
            <p className="font-medium">⚠️ {error}</p>
          </div>
        )}

        <Section>
          <form className="space-y-6">
            {/* Basic Drive Details */}
            <div
              className={`p-6 rounded-lg border ${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                Basic Drive Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Placement Drive */}
                <div>
                  <label
                    htmlFor="placement_drive"
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Placement Drive <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="placement_drive"
                    name="placement_drive"
                    value={formData.placement_drive}
                    onChange={handleChange}
                    required
                    disabled={loadingData}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      loadingData ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <option value="">Select Placement Drive</option>
                    {placementDrives.map((drive) => (
                      <option key={drive.id} value={drive.id}>
                        {drive.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Company */}
                <div>
                  <label
                    htmlFor="company"
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Company <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    required
                    disabled={loadingData}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      loadingData ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <option value="">Select Company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Drive Type */}
                <div>
                  <label
                    htmlFor="drive_type"
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Drive Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="drive_type"
                    name="drive_type"
                    value={formData.drive_type}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="">Select Drive Type</option>
                    <option value="FullTime">Full Time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>

                {/* Job Mode */}
                <div>
                  <label
                    htmlFor="job_mode"
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Job Mode <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="job_mode"
                    name="job_mode"
                    value={formData.job_mode}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="">Select Job Mode</option>
                    <option value="Onsite">On-site</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>

                {/* Application Deadline */}
                <div>
                  <label
                    htmlFor="application_deadline"
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Application Deadline
                  </label>
                  <input
                    type="datetime-local"
                    id="application_deadline"
                    name="application_deadline"
                    value={formData.application_deadline}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                {/* Status */}
                <div>
                  <label
                    htmlFor="status"
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div
              className={`p-6 rounded-lg border ${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                Additional Details
              </h3>
              <div className="space-y-4">
                {/* Interview Rounds */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      className={`block text-sm font-medium ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Interview Rounds
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addRound}
                      className="flex items-center gap-1 text-xs"
                    >
                      <Plus size={14} />
                      Add Round
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.rounds.map((round, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={round}
                          onChange={(e) => handleRoundChange(index, e.target.value)}
                          placeholder={`Round ${index + 1} (e.g., Online Test, Technical Interview)`}
                          className={`flex-1 px-4 py-2 rounded-lg border ${
                            isDark
                              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        {formData.rounds.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRound(index)}
                            className={`p-2 rounded-lg ${
                              isDark
                                ? "text-red-400 hover:bg-red-900/20"
                                : "text-red-600 hover:bg-red-50"
                            }`}
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className={`mt-1 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Add each interview round separately
                  </p>
                </div>

                {/* Posting Locations */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      className={`block text-sm font-medium ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Posting Locations
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addLocation}
                      className="flex items-center gap-1 text-xs"
                    >
                      <Plus size={14} />
                      Add Location
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.locations.map((location, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <select
                          value={location}
                          onChange={(e) => handleLocationChange(index, e.target.value)}
                          disabled={loadingData}
                          className={`flex-1 px-4 py-2 rounded-lg border ${
                            isDark
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          } focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            loadingData ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          <option value="">Select City</option>
                          {cities.map((city) => (
                            <option key={city.id} value={city.id}>
                              {city.name}
                            </option>
                          ))}
                        </select>
                        {formData.locations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLocation(index)}
                            className={`p-2 rounded-lg ${
                              isDark
                                ? "text-red-400 hover:bg-red-900/20"
                                : "text-red-600 hover:bg-red-50"
                            }`}
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className={`mt-1 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Select posting locations from the dropdown
                  </p>
                </div>

                {/* Multiple Role Applications */}
                <div
                  className={`p-4 rounded-lg border-2 ${
                    formData.multiple_allowed
                      ? isDark
                        ? "bg-blue-900/20 border-blue-500"
                        : "bg-blue-50 border-blue-500"
                      : isDark
                      ? "bg-gray-800 border-gray-700"
                      : "bg-gray-50 border-gray-300"
                  } transition-all duration-200`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex items-center h-6">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          id="multiple_allowed"
                          name="multiple_allowed"
                          checked={formData.multiple_allowed}
                          onChange={(e) => setFormData(prev => ({ ...prev, multiple_allowed: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className={`w-11 h-6 rounded-full peer peer-focus:ring-4 ${
                          isDark 
                            ? "bg-gray-700 peer-focus:ring-blue-800 peer-checked:bg-blue-600" 
                            : "bg-gray-300 peer-focus:ring-blue-300 peer-checked:bg-blue-600"
                        } peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                      </label>
                    </div>
                    <div className="flex-1">
                      <label
                        htmlFor="multiple_allowed"
                        className={`block text-sm font-semibold mb-1 cursor-pointer ${
                          isDark ? "text-gray-200" : "text-gray-900"
                        }`}
                      >
                        Multiple Role Applications
                      </label>
                      <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        Allow students to apply for multiple job roles within this company drive
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handleCancel}
                variant="secondary"
                disabled={loading || loadingData}
              >
                Cancel
              </Button>
              {isEditMode ? (
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={loading || loadingData}
                  className="flex-1"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={loading || loadingData}
                  className="flex-1"
                >
                  Next: Add Job Details
                </Button>
              )}
            </div>
          </form>
        </Section>
      </PageContainer>
    </DashboardLayout>
  );
}
