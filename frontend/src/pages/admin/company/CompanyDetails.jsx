import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  DashboardLayout,
  PageContainer,
  Section,
} from "../../../components/layout";
import { Button, LoadingOverlay, useAlert } from "../../../components/ui";
import { useTheme } from "../../../contexts/ThemeContext";
import { useAuth } from "../../../contexts/AuthContext";
import {
  Building2,
  MapPin,
  Globe,
  Users,
  Mail,
  Phone,
  Calendar,
  ArrowLeft,
  Edit,
  Trash2,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { companyService } from "../../../services/companyService";

export default function CompanyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { showAlert, showConfirm, AlertComponent } = useAlert();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCompanyDetails();
  }, [id]);

  const fetchCompanyDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await companyService.getCompanyById(id);

      // Handle API response structure
      if (response.success && response.data) {
        setCompany(response.data);
      } else {
        setCompany(response.data || response);
      }
    } catch (err) {
      console.error("Error fetching company details:", err);
      setError(err.message || "Failed to load company details");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await showConfirm({
      title: "Delete Company",
      message: `Are you sure you want to delete "${company.name}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "confirm",
    });

    if (!confirmed) return;

    try {
      await companyService.deleteCompany(id);
      await showAlert({
        type: "success",
        title: "Success",
        message: "Company deleted successfully!",
      });
      navigate("/admin/companies");
    } catch (err) {
      console.error("Delete error:", err);
      await showAlert({
        type: "error",
        title: "Error",
        message: "Failed to delete company. Please try again.",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Company Details">
        <PageContainer>
          <LoadingOverlay message="Loading company details..." />
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (error || !company) {
    return (
      <DashboardLayout title="Company Details">
        <PageContainer>
          <div
            className={`text-center py-12 rounded-lg border ${
              isDark
                ? "bg-red-900/20 border-red-800 text-red-300"
                : "bg-red-50 border-red-200 text-red-600"
            }`}
          >
            <p className="text-lg font-medium mb-4">
              ❌ {error || "Company not found"}
            </p>
            <Button onClick={() => navigate("/admin/companies")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Companies
            </Button>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={company.name}>
      <PageContainer>
        <Section
          action={
            <div className="flex gap-2">
              <Button onClick={() => navigate("/admin/companies")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              {user?.activeRole === "Admin" && (
                <>
                  <Button onClick={() => navigate(`/admin/companies/${id}/edit`)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    onClick={handleDeleteClick}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          }
        >
          <div className="space-y-6">
            {/* Header Card */}
            <div
              className={`p-6 rounded-xl border ${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Logo */}
                <div className="flex-shrink-0">
                  {company.logo ? (
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="w-24 h-24 rounded-xl object-cover border"
                    />
                  ) : (
                    <div
                      className={`w-24 h-24 flex items-center justify-center rounded-xl border ${
                        isDark
                          ? "bg-gray-700 border-gray-600"
                          : "bg-gray-100 border-gray-300"
                      }`}
                    >
                      <Building2 className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Company Info */}
                <div className="flex-1">
                  <h2
                    className={`text-2xl font-bold mb-2 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {company.name}
                  </h2>
                  {company.description && (
                    <p
                      className={`text-sm mb-4 ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {company.description}
                    </p>
                  )}

                  {/* Quick Stats */}
                  <div className="flex flex-wrap gap-4">
                    {company.company_size_display && (
                      <div className="flex items-center gap-2">
                        <Users
                          className={`w-5 h-5 ${
                            isDark ? "text-blue-400" : "text-blue-600"
                          }`}
                        />
                        <span
                          className={isDark ? "text-gray-300" : "text-gray-700"}
                        >
                          {company.company_size_display}
                        </span>
                      </div>
                    )}
                    {company.year_founded && (
                      <div className="flex items-center gap-2">
                        <Calendar
                          className={`w-5 h-5 ${
                            isDark ? "text-green-400" : "text-green-600"
                          }`}
                        />
                        <span
                          className={isDark ? "text-gray-300" : "text-gray-700"}
                        >
                          Founded {company.year_founded}
                        </span>
                      </div>
                    )}
                    {company.headquarters_city_name && (
                      <div className="flex items-center gap-2">
                        <MapPin
                          className={`w-5 h-5 ${
                            isDark ? "text-purple-400" : "text-purple-600"
                          }`}
                        />
                        <span
                          className={isDark ? "text-gray-300" : "text-gray-700"}
                        >
                          {company.headquarters_city_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            {(company.email ||
              company.phone_number ||
              company.website_url ||
              company.headquarters_address) && (
              <div
                className={`p-6 rounded-xl border ${
                  isDark
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <h3
                  className={`text-lg font-semibold mb-4 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {company.email && (
                    <div className="flex items-start gap-3">
                      <Mail
                        className={`w-5 h-5 mt-0.5 ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      />
                      <div>
                        <div
                          className={`text-sm font-medium mb-1 ${
                            isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Email
                        </div>
                        <a
                          href={`mailto:${company.email}`}
                          className="text-blue-500 hover:underline"
                        >
                          {company.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {company.phone_number &&
                    company.phone_number !== "0000000000" && (
                      <div className="flex items-start gap-3">
                        <Phone
                          className={`w-5 h-5 mt-0.5 ${
                            isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                        />
                        <div>
                          <div
                            className={`text-sm font-medium mb-1 ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Phone
                          </div>
                          <a
                            href={`tel:${company.phone_number}`}
                            className={
                              isDark ? "text-gray-300" : "text-gray-700"
                            }
                          >
                            {company.phone_number}
                          </a>
                        </div>
                      </div>
                    )}

                  {company.website_url && (
                    <div className="flex items-start gap-3">
                      <Globe
                        className={`w-5 h-5 mt-0.5 ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      />
                      <div>
                        <div
                          className={`text-sm font-medium mb-1 ${
                            isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Website
                        </div>
                        <a
                          href={company.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline flex items-center gap-1"
                        >
                          {company.website_url.replace(
                            /^https?:\/\/(www\.)?/,
                            ""
                          )}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  {company.headquarters_address && (
                    <div className="flex items-start gap-3">
                      <MapPin
                        className={`w-5 h-5 mt-0.5 ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      />
                      <div>
                        <div
                          className={`text-sm font-medium mb-1 ${
                            isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Headquarters
                        </div>
                        <p
                          className={isDark ? "text-gray-300" : "text-gray-700"}
                        >
                          {company.headquarters_address}
                          {company.headquarters_city_name &&
                            `, ${company.headquarters_city_name}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div
              className={`p-6 rounded-xl border ${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <h3
                className={`text-lg font-semibold mb-4 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Additional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {company.created_at && (
                  <div>
                    <div
                      className={`text-sm font-medium mb-1 ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Added on
                    </div>
                    <p className={isDark ? "text-gray-300" : "text-gray-700"}>
                      {new Date(company.created_at).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                )}
                {company.updated_at && (
                  <div>
                    <div
                      className={`text-sm font-medium mb-1 ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Last updated
                    </div>
                    <p className={isDark ? "text-gray-300" : "text-gray-700"}>
                      {new Date(company.updated_at).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Section>
      </PageContainer>

      <AlertComponent />
    </DashboardLayout>
  );
}
