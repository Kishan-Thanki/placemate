import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DashboardLayout,
  PageContainer,
  Section,
} from "../../components/layout";
import {
  Card,
  Button,
  LoadingButton,
  ShimmerPlaceholder,
  LoadingOverlay,
} from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { companyService } from "../../services/companyService";
import { lookupService } from "../../services/lookupService";

// Assuming Input, Select, Textarea, and FieldLabel are defined as in your original code
// ... (Your original helper component definitions here)

export default function CompanyRegistration() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { id } = useParams(); // Get company ID from URL for edit mode
  const isEditMode = Boolean(id);

  const [logo, setLogo] = useState(null); // Preview URL
  const [logoFile, setLogoFile] = useState(null); // Actual file to upload
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditMode);
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [countries, setCountries] = useState([]);
  const [form, setForm] = useState({
    companyName: "",
    website: "",
    phoneNumber: "",
    foundedYear: "",
    industry: "",
    companySize: "",
    companyType: "",
    companyCategory: "Software Development",
    description: "",
    contactName: "",
    contactEmail: "",
    contactPosition: "",
    addressLine: "",
    country: "",
    state: "",
    city: "",
  });

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const onLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file); // Store actual file
      setLogo(URL.createObjectURL(file)); // Set preview
      console.log("📷 Logo selected:", {
        name: file.name,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        type: file.type,
      });
    }
  };

  // Fetch cities, states, and countries for dropdowns
  useEffect(() => {
    const fetchLookupData = async () => {
      try {
        // Fetch all lookup data in parallel
        const [citiesData, statesData, countriesData] = await Promise.all([
          lookupService.getCities(),
          lookupService.getStates(),
          lookupService.getCountries(),
        ]);

        // Map cities
        const cityOptions = citiesData.map((city) => ({
          label: city.name,
          value: city.id.toString(),
        }));
        setCities(cityOptions);

        // Map states
        const stateOptions = statesData.map((state) => ({
          label: state.name,
          value: state.id.toString(),
        }));
        setStates(stateOptions);

        // Map countries
        const countryOptions = countriesData.map((country) => ({
          label: country.name,
          value: country.id.toString(),
        }));
        setCountries(countryOptions);

        console.log("✅ Lookup data loaded:", {
          cities: cityOptions.length,
          states: stateOptions.length,
          countries: countryOptions.length,
        });
      } catch (error) {
        console.error("❌ Error fetching lookup data:", error);
      }
    };
    fetchLookupData();
  }, []);

  // Fetch company data if in edit mode
  useEffect(() => {
    if (isEditMode && id && cities.length > 0) {
      const fetchCompanyData = async () => {
        setFetchingData(true);
        try {
          const response = await companyService.getCompanyById(id);
          const company = response.success ? response.data : response;

          // Map company size from backend code to form value
          // Backend: 0=Self, 1=1–10, 2=11–50, 3=51–500, 4=500+
          const companySizeReverseMap = {
            0: "Self",
            1: "1–10",
            2: "11–50",
            3: "51–500",
            4: "500+",
          };

          // Find city name from city ID
          const cityObj = cities.find(
            (c) => c.value === company.headquarters_city?.toString()
          );
          const cityName = cityObj ? cityObj.label : "";

          // Populate form with existing data
          setForm({
            companyName: company.name || "",
            website: company.website_url || "",
            phoneNumber: company.phone_number || "",
            foundedYear: company.year_founded?.toString() || "",
            industry: "",
            companySize: companySizeReverseMap[company.company_size] || "",
            companyType: "",
            companyCategory: "Software Development",
            description: company.description || "",
            contactName: "",
            contactEmail: company.email || "",
            contactPosition: "",
            addressLine: company.headquarters_address || "",
            country: "",
            state: "",
            city: cityName,
          });

          if (company.logo) {
            setLogo(company.logo);
          }
        } catch (error) {
          console.error("Error fetching company data:", error);
          alert("Failed to load company data. Redirecting...");
          navigate("/admin/companies");
        } finally {
          setFetchingData(false);
        }
      };
      fetchCompanyData();
    }
  }, [isEditMode, id, navigate, cities]); // Add cities dependency

  // Submit company registration or update
  const onSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!form.companyName.trim()) {
      alert("Company name is required");
      return;
    }

    if (!form.contactEmail.trim()) {
      alert("Contact email is required");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.contactEmail)) {
      alert("Please enter a valid email address");
      return;
    }

    // Validate company size is selected
    if (!form.companySize) {
      alert("Please select a company size");
      return;
    }

    // Validate city is selected
    if (!form.city) {
      alert("Please select a city");
      return;
    }

    setLoading(true);

    // Map company size to backend format
    // Backend: 0=Self, 1=1–10, 2=11–50, 3=51–500, 4=500+
    const companySizeMap = {
      Self: 0,
      "1–10": 1,
      "11–50": 2,
      "51–500": 3,
      "500+": 4,
    };

    // Find the city ID from the selected city name
    const selectedCity = cities.find((c) => c.label === form.city);
    const cityId = selectedCity ? parseInt(selectedCity.value) : 1;

    const payload = {
      name: form.companyName.trim(),
      email: form.contactEmail.trim(),
      phone_number: form.phoneNumber?.trim() || "0000000000",
      website_url: form.website?.trim() || "",
      description: form.description || "",
      year_founded: parseInt(form.foundedYear) || new Date().getFullYear(),
      company_size: companySizeMap[form.companySize] || 0,
      headquarters_address: form.addressLine || "",
      headquarters_city: cityId,
    };

    console.log("City mapping:", {
      selectedLabel: form.city,
      foundCity: selectedCity,
      cityId,
    });

    // If there's a logo file, use FormData for multipart upload
    let submitData;
    if (logoFile) {
      submitData = new FormData();
      Object.keys(payload).forEach((key) => {
        submitData.append(key, payload[key]);
      });
      submitData.append("logo", logoFile);
      console.log("📤 Uploading with FormData (includes logo):", {
        logoName: logoFile.name,
        logoSize: `${(logoFile.size / 1024).toFixed(2)} KB`,
        payloadFields: Object.keys(payload),
      });
    } else {
      submitData = payload;
      console.log("📤 Uploading JSON (no logo):", payload);
    }

    try {
      let result;
      if (isEditMode) {
        result = await companyService.updateCompany(id, submitData);
        console.log("Company update successful:", result);
      } else {
        result = await companyService.createCompany(submitData);
        console.log("Company registration successful:", result);
      }

      // Show success message
      const successMsg = document.createElement("div");
      successMsg.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        isDark ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800"
      }`;
      successMsg.textContent = isEditMode
        ? "Company updated successfully!"
        : "Company registered successfully!";
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);

      // Navigate to companies list after a brief delay
      setTimeout(() => navigate("/admin/companies"), 1000);
    } catch (error) {
      console.error(
        isEditMode ? "Company update failed:" : "Company registration failed:",
        error
      );
      console.error("Error details:", error.response || error);

      // Log detailed validation errors
      if (error.response?.data?.errors) {
        console.error("Validation errors:", error.response.data.errors);
      }

      // Show detailed error message
      const errorMessage = error.response?.data?.errors
        ? `Validation failed:\n${JSON.stringify(
            error.response.data.errors,
            null,
            2
          )}`
        : error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Please check all required fields and try again";
      alert(
        `${isEditMode ? "Update" : "Registration"} failed: ${errorMessage}`
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <DashboardLayout title="Loading...">
        <PageContainer>
          <Section>
            <Card className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className={`w-28 h-28 rounded-lg animate-pulse ${
                        isDark ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    />
                  </div>
                  <div className="lg:col-span-2 space-y-4">
                    <ShimmerPlaceholder lines={6} />
                  </div>
                </div>
                <ShimmerPlaceholder lines={4} />
              </div>
            </Card>
          </Section>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={isEditMode ? "Edit Company" : "Register New Company"}
    >
      <PageContainer>
        {/* Loading Overlay */}
        {loading && (
          <LoadingOverlay
            message={
              isEditMode ? "Updating company..." : "Registering company..."
            }
          />
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Company Information Section */}
          <Section title="Company Information">
            <Card className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="flex flex-col items-center gap-3">
                  {/* ... Logo Upload UI ... */}
                  <div
                    className={`w-28 h-28 rounded-lg flex items-center justify-center overflow-hidden border ${
                      isDark
                        ? "bg-gray-800 border-gray-700"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    {logo ? (
                      <img
                        src={logo}
                        alt="logo preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span
                        className={`${
                          isDark ? "text-gray-400" : "text-gray-500"
                        } text-xs text-center px-2`}
                      >
                        PNG, JPG, or GIF up to 5MB
                      </span>
                    )}
                  </div>
                  <label
                    className={`cursor-pointer ${
                      isDark ? "text-blue-400" : "text-blue-600"
                    } text-sm`}
                  >
                    Upload Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onLogoChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Company Name"
                    required
                    value={form.companyName}
                    onChange={(v) => update("companyName", v)}
                  />
                  <Input
                    label="Company Website"
                    value={form.website}
                    onChange={(v) => update("website", v)}
                    placeholder="https://example.com"
                  />
                  <Input
                    label="Phone Number"
                    value={form.phoneNumber}
                    onChange={(v) => update("phoneNumber", v)}
                    placeholder="+91 1234567890"
                  />
                  <Input
                    label="Founded Year"
                    value={form.foundedYear}
                    onChange={(v) => update("foundedYear", v)}
                    placeholder="e.g., 2020"
                  />
                  <Select
                    label="Industry"
                    options={[
                      "Technology",
                      "Finance",
                      "Healthcare",
                      "Education",
                    ]}
                    value={form.industry}
                    onChange={(v) => update("industry", v)}
                  />
                  <Select
                    label="Company Size *"
                    options={["Self", "1–10", "11–50", "51–500", "500+"]}
                    value={form.companySize}
                    onChange={(v) => update("companySize", v)}
                    placeholder="Select company size"
                  />
                  <Select
                    label="Company Type"
                    options={[
                      "Private Limited",
                      "Public Limited",
                      "LLP",
                      "Startup",
                    ]}
                    value={form.companyType}
                    onChange={(v) => update("companyType", v)}
                  />
                  <Select
                    label="Company Category"
                    options={[
                      "Software Development",
                      "Consulting",
                      "Product",
                      "Services",
                    ]}
                    value={form.companyCategory}
                    onChange={(v) => update("companyCategory", v)}
                  />
                  <div className="md:col-span-2">
                    <Textarea
                      label="Company Description"
                      value={form.description}
                      onChange={(v) => update("description", v)}
                      placeholder="Describe the company, products, and mission"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </Section>

          {/* Contact Information Section */}
          <Section title="Contact Information">
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Contact Person Name"
                  value={form.contactName}
                  onChange={(v) => update("contactName", v)}
                />
                <Input
                  label="Contact Person Email"
                  type="email"
                  value={form.contactEmail}
                  onChange={(v) => update("contactEmail", v)}
                  placeholder="name@company.com"
                />
                <Input
                  label="Contact Person Position"
                  value={form.contactPosition}
                  onChange={(v) => update("contactPosition", v)}
                />
              </div>
            </Card>
          </Section>

          {/* Address Information Section */}
          <Section title="Address Information">
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <Input
                    label="Address Line"
                    value={form.addressLine}
                    onChange={(v) => update("addressLine", v)}
                    placeholder="Building, Street, Area"
                  />
                </div>
                <Select
                  label="Country"
                  value={form.country}
                  onChange={(v) => update("country", v)}
                  options={countries.map((c) => c.label)}
                />
                <Select
                  label="State"
                  value={form.state}
                  onChange={(v) => update("state", v)}
                  options={states.map((s) => s.label)}
                />
                {/* Use the fetched and formatted 'cities' state for the options */}
                <Select
                  label="Headquarter City *"
                  value={form.city}
                  onChange={(v) => update("city", v)}
                  options={cities.map((c) => c.label)}
                  placeholder="Select city"
                />
              </div>
            </Card>
          </Section>

          <div className="flex justify-end">
            <LoadingButton
              variant="primary"
              type="submit"
              loading={loading}
              disabled={loading}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isDark
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {isEditMode ? "Update Company" : "Register Company"}
            </LoadingButton>
          </div>
        </form>
      </PageContainer>
    </DashboardLayout>
  );
}

function FieldLabel({ children, required }) {
  return (
    <label className="block text-sm font-medium mb-1">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

function Input({
  label,
  required,
  type = "text",
  value,
  onChange,
  placeholder,
}) {
  const { isDark } = useTheme();
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 rounded-lg border ${
          isDark
            ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
        }`}
      />
    </div>
  );
}

function Select({ label, required, options, value, onChange }) {
  const { isDark } = useTheme();
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 rounded-lg border ${
          isDark
            ? "bg-gray-800 border-gray-700 text-white"
            : "bg-white border-gray-300 text-gray-900"
        }`}
      >
        <option value="">Select {label}</option>
        {options.map((opt, i) => (
          <option key={i} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, rows = 3 }) {
  const { isDark } = useTheme();
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <textarea
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 rounded-lg border ${
          isDark
            ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
        }`}
      ></textarea>
    </div>
  );
}
