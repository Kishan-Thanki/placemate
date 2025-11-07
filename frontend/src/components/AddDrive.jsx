import React, { useState, useEffect } from "react";
import { Section } from "./layout";
import { Card, Button } from "./ui";
import { useTheme } from "../contexts/ThemeContext";
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { companyService, placementService, lookupService } from "../services";

export default function AddDrive() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Dropdown data
  const [companies, setCompanies] = useState([]);
  const [placementDrives, setPlacementDrives] = useState([]);
  const [cities, setCities] = useState([]);
  
  const [form, setForm] = useState({
    placement_drive: "",
    company: "",
    drive_type: "",
    job_mode: "",
    application_deadline: "",
    status: "Open",
    rounds: [],
    locations: [],
  });

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      setLoading(true);
      
      // Fetch companies
      const companiesRes = await companyService.getAllCompanies();
      const companiesList = companiesRes?.data || companiesRes?.results || companiesRes || [];
      setCompanies(Array.isArray(companiesList) ? companiesList : []);
      
      // Fetch placement drives
      const drivesRes = await placementService.getAllDrives();
      const drivesList = drivesRes?.data || drivesRes?.results || drivesRes || [];
      setPlacementDrives(Array.isArray(drivesList) ? drivesList : []);
      
      // Fetch cities
      const citiesRes = await lookupService.getCities();
      const citiesList = citiesRes?.data || citiesRes?.results || citiesRes || [];
      setCities(Array.isArray(citiesList) ? citiesList : []);
      
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
      setError("Failed to load form data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleMultiSelect = (key, value) => {
    const currentValues = form[key] || [];
    const valueNum = parseInt(value);
    
    if (currentValues.includes(valueNum)) {
      update(key, currentValues.filter(v => v !== valueNum));
    } else {
      update(key, [...currentValues, valueNum]);
    }
  };

  const handleNext = () => {
    // Validate required fields
    if (!form.placement_drive || !form.company || !form.drive_type || !form.job_mode) {
      setError("Please fill in all required fields");
      return;
    }
    
    // Save to localStorage for next step
    localStorage.setItem('companyDriveBasicDetails', JSON.stringify(form));
    navigate('/admin/drives/new/jobs');
  };

  const handleCancel = () => {
    localStorage.removeItem('companyDriveBasicDetails');
    navigate('/admin/drives');
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="mb-4">
        <Button
          variant="outline"
          onClick={() => navigate("/admin/drives")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Drives
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`p-4 rounded-lg border ${
          isDark
            ? "bg-red-900/20 border-red-900 text-red-400"
            : "bg-red-50 border-red-200 text-red-600"
        }`}>
          <p className="font-medium">⚠️ {error}</p>
        </div>
      )}

      <Section title="Basic Drive Details">
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select 
              label="Placement Drive" 
              required 
              value={form.placement_drive} 
              onChange={(v) => update("placement_drive", v)} 
              options={placementDrives}
              optionValue="id"
              optionLabel="title"
              disabled={loading}
            />
            <Select 
              label="Company" 
              required 
              value={form.company} 
              onChange={(v) => update("company", v)} 
              options={companies}
              optionValue="id"
              optionLabel="name"
              disabled={loading}
            />
            <Select 
              label="Drive Type" 
              required 
              value={form.drive_type} 
              onChange={(v) => update("drive_type", v)} 
              options={[
                { value: "FullTime", label: "Full Time" },
                { value: "Internship", label: "Internship" },
                { value: "Contract", label: "Contract" }
              ]}
              optionValue="value"
              optionLabel="label"
            />
            <Select 
              label="Job Mode" 
              required 
              value={form.job_mode} 
              onChange={(v) => update("job_mode", v)} 
              options={[
                { value: "Onsite", label: "On-site" },
                { value: "Hybrid", label: "Hybrid" },
                { value: "Remote", label: "Remote" }
              ]}
              optionValue="value"
              optionLabel="label"
            />
            <Input 
              label="Application Deadline" 
              type="datetime-local"
              value={form.application_deadline} 
              onChange={(v) => update("application_deadline", v)} 
            />
            <Select 
              label="Status" 
              required 
              value={form.status} 
              onChange={(v) => update("status", v)} 
              options={[
                { value: "Open", label: "Open" },
                { value: "Closed", label: "Closed" }
              ]}
              optionValue="value"
              optionLabel="label"
            />
          </div>
        </Card>
      </Section>

      <Section title="Additional Details">
        <Card className="p-6">
          <div className="grid grid-cols-1 gap-4">
            <MultiSelect
              label="Posting Locations"
              value={form.locations}
              onChange={(v) => handleMultiSelect("locations", v)}
              options={cities}
              optionValue="id"
              optionLabel="name"
              disabled={loading}
            />
            <TextArea
              label="Rounds (Optional)"
              value={form.rounds ? JSON.stringify(form.rounds) : ""}
              onChange={(v) => {
                try {
                  const parsed = v ? JSON.parse(v) : [];
                  update("rounds", parsed);
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              placeholder='e.g., ["Online Test", "Technical Interview", "HR Interview"]'
              rows={3}
            />
          </div>
        </Card>
      </Section>

      <div className="flex justify-between gap-3">
        <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
        <div className="flex gap-3">
          <Button 
            variant="primary" 
            onClick={handleNext}
            disabled={loading}
          >
            Next: Job Details
          </Button>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children, required }) {
  return (
    <label className="block text-sm font-medium mb-1">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

function Input({ label, required, type = "text", value, onChange, placeholder, disabled }) {
  const { isDark } = useTheme();
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-3 py-2 rounded-lg border ${
          isDark 
            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    </div>
  );
}

function Select({ label, required, options, value, onChange, optionValue = "value", optionLabel = "label", disabled }) {
  const { isDark } = useTheme();
  
  // Handle both simple arrays and object arrays
  const getOptionValue = (opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return opt[optionValue];
    }
    return opt;
  };
  
  const getOptionLabel = (opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return opt[optionLabel];
    }
    return opt;
  };
  
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-3 py-2 rounded-lg border ${
          isDark 
            ? 'bg-gray-800 border-gray-700 text-white' 
            : 'bg-white border-gray-300 text-gray-900'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <option value="">Select {label}</option>
        {options.map((opt, i) => (
          <option key={i} value={getOptionValue(opt)}>
            {getOptionLabel(opt)}
          </option>
        ))}
      </select>
    </div>
  );
}

function MultiSelect({ label, value = [], onChange, options, optionValue = "value", optionLabel = "label", disabled }) {
  const { isDark } = useTheme();
  
  const getOptionValue = (opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return opt[optionValue];
    }
    return opt;
  };
  
  const getOptionLabel = (opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return opt[optionLabel];
    }
    return opt;
  };
  
  const handleToggle = (optValue) => {
    onChange(optValue);
  };
  
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className={`p-3 rounded-lg border max-h-48 overflow-y-auto ${
        isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-300'
      }`}>
        {options.length === 0 ? (
          <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
            No options available
          </p>
        ) : (
          options.map((opt, i) => {
            const optValue = getOptionValue(opt);
            const isChecked = value.includes(parseInt(optValue));
            
            return (
              <label 
                key={i}
                className={`flex items-center gap-2 py-1 cursor-pointer hover:${
                  isDark ? 'bg-gray-700' : 'bg-gray-50'
                } px-2 rounded`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggle(optValue)}
                  disabled={disabled}
                  className="rounded"
                />
                <span className={isDark ? 'text-gray-200' : 'text-gray-900'}>
                  {getOptionLabel(opt)}
                </span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}

function TextArea({ label, required, value, onChange, placeholder, rows = 4, disabled }) {
  const { isDark } = useTheme();
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        disabled={disabled}
        className={`w-full px-3 py-2 rounded-lg border ${
          isDark 
            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    </div>
  );
}
