import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DashboardLayout,
  PageContainer,
  Section,
} from "../../../components/layout";
import { Button, Card } from "../../../components/ui";
import { LoadingOverlay } from "../../../components/ui/Spinner";
import { useTheme } from "../../../contexts/ThemeContext";
import { studentService, lookupService } from "../../../services";
import { CheckCircle, XCircle, AlertCircle, ArrowLeft } from "lucide-react";

export function StudentRegistration() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    enrollment_number: "",
    joining_year: "",
    program: "",
    additional_roles: [],
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoadingPrograms(true);
      const data = await lookupService.getPrograms();
      setPrograms(data || []);
    } catch (error) {
      console.error("Error fetching programs:", error);
      showNotification("error", "Failed to load programs");
    } finally {
      setLoadingPrograms(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone_number)) {
      newErrors.phone_number = "Phone number must be 10 digits";
    }

    if (!formData.enrollment_number.trim()) {
      newErrors.enrollment_number = "Enrollment number is required";
    }

    if (!formData.joining_year) {
      newErrors.joining_year = "Joining year is required";
    } else {
      const year = parseInt(formData.joining_year);
      const currentYear = new Date().getFullYear();
      if (year < 2000 || year > currentYear + 1) {
        newErrors.joining_year = `Year must be between 2000 and ${
          currentYear + 1
        }`;
      }
    }

    if (!formData.program) {
      newErrors.program = "Program is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showNotification("error", "Please fix the form errors");
      return;
    }

    setLoading(true);

    try {
      // Prepare the data for API
      const apiData = {
        email: formData.email,
        phone_number: formData.phone_number,
        first_name: formData.first_name,
        last_name: formData.last_name,
        enrollment_number: formData.enrollment_number,
        joining_year: parseInt(formData.joining_year),
        program: parseInt(formData.program),
      };

      // Add optional fields
      if (formData.middle_name?.trim()) {
        apiData.middle_name = formData.middle_name;
      }

      if (formData.additional_roles && formData.additional_roles.length > 0) {
        apiData.additional_roles = formData.additional_roles;
      }

      console.log("Submitting student data:", apiData);

      const response = await studentService.registerStudent(apiData);

      console.log("Registration response:", response);

      // Show success notification
      showNotification(
        "success",
        "Student registered successfully! Welcome email has been sent to the student."
      );

      // Reset form
      setFormData({
        first_name: "",
        middle_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        enrollment_number: "",
        joining_year: "",
        program: "",
        additional_roles: [],
      });

      // Navigate to students list after a short delay
      setTimeout(() => {
        navigate("/admin/students");
      }, 2000);
    } catch (error) {
      console.error("Error registering student:", error);
      showNotification(
        "error",
        error.message || "Failed to register student. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Register Student">
      <PageContainer>
        {/* Back Button */}
        <div className="mb-4">
          <Button variant="outline" onClick={() => navigate("/admin/students")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Students
          </Button>
        </div>

        {/* Loading Overlay */}
        {loading && <LoadingOverlay message="Registering student..." />}

        {/* Notification */}
        {notification && (
          <div className="mb-4">
            <NotificationBanner
              type={notification.type}
              message={notification.message}
              onClose={() => setNotification(null)}
            />
          </div>
        )}

        <Section>
          <Card className="p-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Personal Information Section */}
              <div>
                <h3
                  className={`text-lg font-semibold mb-4 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="First Name"
                    required
                    value={formData.first_name}
                    onChange={(v) => handleInputChange("first_name", v)}
                    error={errors.first_name}
                    placeholder="Enter first name"
                  />
                  <Input
                    label="Middle Name"
                    value={formData.middle_name}
                    onChange={(v) => handleInputChange("middle_name", v)}
                    placeholder="Enter middle name (optional)"
                  />
                  <Input
                    label="Last Name"
                    required
                    value={formData.last_name}
                    onChange={(v) => handleInputChange("last_name", v)}
                    error={errors.last_name}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              {/* Contact Information Section */}
              <div>
                <h3
                  className={`text-lg font-semibold mb-4 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(v) => handleInputChange("email", v)}
                    error={errors.email}
                    placeholder="student@example.com"
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    required
                    value={formData.phone_number}
                    onChange={(v) => handleInputChange("phone_number", v)}
                    error={errors.phone_number}
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>

              {/* Academic Information Section */}
              <div>
                <h3
                  className={`text-lg font-semibold mb-4 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Academic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Enrollment Number"
                    required
                    value={formData.enrollment_number}
                    onChange={(v) => handleInputChange("enrollment_number", v)}
                    error={errors.enrollment_number}
                    placeholder="Enter enrollment number"
                  />
                  <Input
                    label="Joining Year"
                    type="number"
                    required
                    value={formData.joining_year}
                    onChange={(v) => handleInputChange("joining_year", v)}
                    error={errors.joining_year}
                    placeholder="e.g., 2024"
                    min="2000"
                    max={new Date().getFullYear() + 1}
                  />
                  <Select
                    label="Program"
                    required
                    options={programs}
                    value={formData.program}
                    onChange={(v) => handleInputChange("program", v)}
                    error={errors.program}
                    loading={loadingPrograms}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || loadingPrograms}
                  className="min-w-[200px]"
                >
                  Register Student
                </Button>
              </div>
            </form>
          </Card>
        </Section>
      </PageContainer>
    </DashboardLayout>
  );
}

// Helper Components
function NotificationBanner({ type, message, onClose }) {
  const { isDark } = useTheme();

  const config = {
    success: {
      icon: <CheckCircle className="w-5 h-5" />,
      bg: isDark
        ? "bg-green-900/20 border-green-800"
        : "bg-green-50 border-green-200",
      text: isDark ? "text-green-400" : "text-green-800",
      iconColor: "text-green-500",
    },
    error: {
      icon: <XCircle className="w-5 h-5" />,
      bg: isDark ? "bg-red-900/20 border-red-800" : "bg-red-50 border-red-200",
      text: isDark ? "text-red-400" : "text-red-800",
      iconColor: "text-red-500",
    },
    warning: {
      icon: <AlertCircle className="w-5 h-5" />,
      bg: isDark
        ? "bg-yellow-900/20 border-yellow-800"
        : "bg-yellow-50 border-yellow-200",
      text: isDark ? "text-yellow-400" : "text-yellow-800",
      iconColor: "text-yellow-500",
    },
  };

  const style = config[type] || config.error;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${style.bg}`}>
      <span className={style.iconColor}>{style.icon}</span>
      <p className={`flex-1 text-sm ${style.text}`}>{message}</p>
      <button
        onClick={onClose}
        className={`${style.text} hover:opacity-70 transition-opacity`}
      >
        ×
      </button>
    </div>
  );
}

function Label({ children, required }) {
  const { isDark } = useTheme();
  return (
    <label
      className={`block text-sm font-medium mb-1.5 ${
        isDark ? "text-gray-300" : "text-gray-700"
      }`}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function Input({
  label,
  required,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  min,
  max,
}) {
  const { isDark } = useTheme();
  return (
    <div>
      <Label required={required}>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        className={`w-full px-3 py-2.5 rounded-lg border transition-colors ${
          isDark
            ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        } ${
          error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
        }`}
      />
      {error && (
        <span className="text-xs text-red-500 mt-1 block">{error}</span>
      )}
    </div>
  );
}

function Select({ label, required, options, value, onChange, error, loading }) {
  const { isDark } = useTheme();
  return (
    <div>
      <Label required={required}>{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className={`w-full px-3 py-2.5 rounded-lg border transition-colors ${
          isDark
            ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        } ${
          error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
        } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <option value="">{loading ? "Loading..." : `Select ${label}`}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.abbreviation || opt.name} -{" "}
            {typeof opt.degree === "object"
              ? opt.degree.abbreviation
              : opt.degree_name || ""}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-xs text-red-500 mt-1 block">{error}</span>
      )}
    </div>
  );
}
