import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { StudentLayout } from "../../components/layout/StudentLayout";
import { PageContainer, Section } from "../../components/layout";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { applicationService } from "../../services/applicationService";
import { CardSkeleton, Button } from "../../components/ui";
import { Modal } from "../../components/ui/Modal";
import { ToastContainer } from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ExternalLink,
  Award,
  AlertCircle,
} from "lucide-react";

const STATUS_CONFIG = {
  Applied: {
    label: "Applied",
    color: "blue",
    icon: Clock,
    bgClass: "bg-blue-500/10",
    textClass: "text-blue-600 dark:text-blue-400",
    borderClass: "border-blue-500/20",
  },
  Offered: {
    label: "Offered",
    color: "green",
    icon: Award,
    bgClass: "bg-green-500/10",
    textClass: "text-green-600 dark:text-green-400",
    borderClass: "border-green-500/20",
  },
  Accepted: {
    label: "Accepted",
    color: "emerald",
    icon: CheckCircle2,
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-600 dark:text-emerald-400",
    borderClass: "border-emerald-500/20",
  },
  Declined: {
    label: "Declined",
    color: "red",
    icon: XCircle,
    bgClass: "bg-red-500/10",
    textClass: "text-red-600 dark:text-red-400",
    borderClass: "border-red-500/20",
  },
  Rejected: {
    label: "Rejected",
    color: "gray",
    icon: XCircle,
    bgClass: "bg-gray-500/10",
    textClass: "text-gray-600 dark:text-gray-400",
    borderClass: "border-gray-500/20",
  },
  Shortlisted: {
    label: "Shortlisted",
    color: "purple",
    icon: FileText,
    bgClass: "bg-purple-500/10",
    textClass: "text-purple-600 dark:text-purple-400",
    borderClass: "border-purple-500/20",
  },
};

export default function StudentApplications() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { toasts, removeToast, success, error: showError } = useToast();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchApplications = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await applicationService.getMyApplications(user.id);
      console.log("📋 Applications API Response:", response);
      
      // Extract data from response - try different possible structures
      let data = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response?.data) {
        data = Array.isArray(response.data) ? response.data : [response.data];
      } else if (response?.results) {
        data = Array.isArray(response.results) ? response.results : [];
      }
      
      // Enrich applications with job details if offered_job is just an ID
      const enrichedData = await Promise.all(
        data.map(async (app) => {
          if (app.offered_job && typeof app.offered_job === 'number') {
            try {
              // Fetch job details from the API
              const jobResponse = await fetch(`/api/v1/placements/jobs/${app.offered_job}/`, {
                credentials: "include",
              });
              if (jobResponse.ok) {
                const jobData = await jobResponse.json();
                return {
                  ...app,
                  offered_job_details: jobData.data || jobData,
                };
              }
            } catch (err) {
              console.warn(`Failed to fetch job details for job ${app.offered_job}:`, err);
            }
          }
          return app;
        })
      );
      
      console.log("📋 Enriched applications:", enrichedData);
      setApplications(enrichedData);
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError(err.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleAcceptOffer = async () => {
    if (!selectedApplication?.id) return;

    try {
      setIsProcessing(true);
      await applicationService.acceptOffer(selectedApplication.id);
      success("Offer accepted successfully! 🎉");
      setShowOfferModal(false);
      setSelectedApplication(null);
      await fetchApplications();
    } catch (err) {
      console.error("Error accepting offer:", err);
      showError(err.message || "Failed to accept offer");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineOffer = async () => {
    if (!selectedApplication?.id) return;

    try {
      setIsProcessing(true);
      await applicationService.declineOffer(selectedApplication.id);
      success("Offer declined successfully");
      setShowOfferModal(false);
      setSelectedApplication(null);
      await fetchApplications();
    } catch (err) {
      console.error("Error declining offer:", err);
      showError(err.message || "Failed to decline offer");
    } finally {
      setIsProcessing(false);
    }
  };

  const openOfferModal = (application) => {
    setSelectedApplication(application);
    setShowOfferModal(true);
  };

  const closeOfferModal = () => {
    setShowOfferModal(false);
    setSelectedApplication(null);
  };

  const filteredApplications = applications.filter((app) => {
    if (filterStatus === "all") return true;
    return app.status === filterStatus;
  });

  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.Applied;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.bgClass} ${config.textClass} ${config.borderClass}`}
      >
        <Icon size={14} />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <StudentLayout>
        <PageContainer>
          <Section
            title="My Applications"
            description="Track all your job applications and their status"
          >
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </Section>
        </PageContainer>
      </StudentLayout>
    );
  }

  if (error) {
    return (
      <StudentLayout>
        <PageContainer>
          <Section title="My Applications">
            <div
              className={`p-6 rounded-lg border text-center ${
                isDark
                  ? "bg-red-900/20 border-red-700"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <AlertCircle
                size={48}
                className={`mx-auto mb-3 ${
                  isDark ? "text-red-400" : "text-red-600"
                }`}
              />
              <p
                className={`text-lg font-medium mb-2 ${
                  isDark ? "text-red-400" : "text-red-700"
                }`}
              >
                Failed to Load Applications
              </p>
              <p
                className={`text-sm mb-4 ${
                  isDark ? "text-red-300" : "text-red-600"
                }`}
              >
                {error}
              </p>
              <Button onClick={fetchApplications}>Try Again</Button>
            </div>
          </Section>
        </PageContainer>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <PageContainer>
        <ToastContainer toasts={toasts} removeToast={removeToast} />

        <Section
          title="My Applications"
          description="Track all your job applications and their status"
        >
          {/* Filter Tabs */}
          <div
            className={`flex flex-wrap gap-2 mb-6 p-3 rounded-lg border ${
              isDark
                ? "bg-gray-800/50 border-gray-700"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            {["all", "Applied", "Offered", "Accepted", "Declined", "Rejected", "Shortlisted"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === status
                    ? isDark
                      ? "bg-blue-600 text-white"
                      : "bg-blue-500 text-white"
                    : isDark
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {status === "all" ? "All" : status}
                {status !== "all" && (
                  <span className="ml-2 opacity-75">
                    ({applications.filter((a) => a.status === status).length})
                  </span>
                )}
                {status === "all" && (
                  <span className="ml-2 opacity-75">({applications.length})</span>
                )}
              </button>
            ))}
          </div>

          {/* Applications List */}
          {filteredApplications.length === 0 ? (
            <div
              className={`p-12 rounded-lg border text-center ${
                isDark
                  ? "bg-gray-800/50 border-gray-700"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <Briefcase
                size={48}
                className={`mx-auto mb-3 ${
                  isDark ? "text-gray-600" : "text-gray-400"
                }`}
              />
              <p
                className={`text-lg font-medium mb-2 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {filterStatus === "all"
                  ? "No Applications Yet"
                  : `No ${filterStatus} Applications`}
              </p>
              <p
                className={`text-sm mb-4 ${
                  isDark ? "text-gray-500" : "text-gray-500"
                }`}
              >
                {filterStatus === "all"
                  ? "Start applying to company drives to see your applications here"
                  : `You don't have any applications with ${filterStatus} status`}
              </p>
              {filterStatus === "all" && (
                <Button onClick={() => navigate("/student/drives")}>
                  Browse Drives
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  isDark={isDark}
                  navigate={navigate}
                  getStatusBadge={getStatusBadge}
                  formatDate={formatDate}
                  onAcceptOffer={() => openOfferModal(application)}
                />
              ))}
            </div>
          )}
        </Section>

        {/* Offer Action Modal */}
        {showOfferModal && selectedApplication && (
          <Modal
            isOpen={showOfferModal}
            onClose={closeOfferModal}
            title="Job Offer Received"
            isDark={isDark}
          >
            <div className="space-y-6">
              {/* Offer Details */}
              <div
                className={`p-4 rounded-lg border ${
                  isDark
                    ? "bg-green-900/20 border-green-700"
                    : "bg-green-50 border-green-200"
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <Award
                    size={24}
                    className={isDark ? "text-green-400" : "text-green-600"}
                  />
                  <div className="flex-1">
                    <h3
                      className={`font-semibold text-lg mb-1 ${
                        isDark ? "text-green-400" : "text-green-700"
                      }`}
                    >
                      {selectedApplication.offered_job_details?.title || "Job Offer"}
                    </h3>
                    <p
                      className={`text-sm ${
                        isDark ? "text-green-300" : "text-green-600"
                      }`}
                    >
                      {selectedApplication.company_name}
                    </p>
                  </div>
                </div>

                {selectedApplication.offered_job_details && (
                  <div className="space-y-2 text-sm">
                    {(selectedApplication.offered_job_details.ug_package_min ||
                      selectedApplication.offered_job_details.ug_package_max) && (
                      <div
                        className={isDark ? "text-green-300" : "text-green-700"}
                      >
                        <strong>Package:</strong> ₹
                        {selectedApplication.offered_job_details.ug_package_min === selectedApplication.offered_job_details.ug_package_max
                          ? selectedApplication.offered_job_details.ug_package_min
                          : `${selectedApplication.offered_job_details.ug_package_min} - ₹${selectedApplication.offered_job_details.ug_package_max}`
                        } LPA
                      </div>
                    )}
                    {selectedApplication.offered_job_details.job_location && (
                      <div
                        className={isDark ? "text-green-300" : "text-green-700"}
                      >
                        <strong>Location:</strong>{" "}
                        {selectedApplication.offered_job_details.job_location}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Warning */}
              <div
                className={`p-4 rounded-lg border ${
                  isDark
                    ? "bg-yellow-900/20 border-yellow-700"
                    : "bg-yellow-50 border-yellow-200"
                }`}
              >
                <p
                  className={`text-sm ${
                    isDark ? "text-yellow-300" : "text-yellow-800"
                  }`}
                >
                  ⚠️ <strong>Important:</strong> Once you accept this offer,
                  you cannot reverse this decision. Please make sure you want to
                  proceed.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={handleAcceptOffer}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} className="mr-2" />
                      Accept Offer
                    </>
                  )}
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDeclineOffer}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <XCircle size={18} className="mr-2" />
                      Decline Offer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </PageContainer>
    </StudentLayout>
  );
}

// Application Card Component
function ApplicationCard({
  application,
  isDark,
  navigate,
  getStatusBadge,
  formatDate,
  onAcceptOffer,
}) {
  // Use flattened fields from API response
  const companyName = application.company_name || "Company Name";
  const driveTitle = application.drive_title || "Placement Drive";
  const appliedAt = application.applied_at || application.created_at;

  return (
    <div
      className={`p-6 rounded-lg border transition-all hover:shadow-lg ${
        isDark
          ? "bg-gray-800 border-gray-700 hover:border-gray-600"
          : "bg-white border-gray-200 hover:border-gray-300"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Building2
              size={20}
              className={isDark ? "text-gray-400" : "text-gray-500"}
            />
            <h3
              className={`text-lg font-semibold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {companyName}
            </h3>
          </div>
          <p
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            {driveTitle}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {getStatusBadge(application.status)}
        </div>
      </div>

      {/* Application Details */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 rounded-lg ${
          isDark ? "bg-gray-700/50" : "bg-gray-50"
        }`}
      >
        <div className="flex items-center gap-2">
          <Calendar
            size={16}
            className={isDark ? "text-gray-400" : "text-gray-500"}
          />
          <span
            className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}
          >
            Applied: {formatDate(appliedAt)}
          </span>
        </div>
        {application.resume && (
          <div className="flex items-center gap-2">
            <FileText
              size={16}
              className={isDark ? "text-gray-400" : "text-gray-500"}
            />
            <a
              href={application.resume}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm hover:underline flex items-center gap-1 ${
                isDark ? "text-blue-400" : "text-blue-600"
              }`}
            >
              View Resume
              <ExternalLink size={12} />
            </a>
          </div>
        )}
      </div>

      {/* Job Preferences - only show if available */}
      {application.job_preferences && application.job_preferences.length > 0 && (
        <div className="mb-4">
          <p
            className={`text-sm font-medium mb-2 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Job Preferences:
          </p>
          <div className="space-y-1">
            {application.job_preferences
              .sort((a, b) => a.preference_order - b.preference_order)
              .map((pref, index) => (
                <div
                  key={pref.id || index}
                  className={`text-sm flex items-center gap-2 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      isDark
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    #{pref.preference_order}
                  </span>
                  {pref.job?.title || pref.job_title || "Job Position"}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Offered Job - only show if offered_job exists */}
      {application.offered_job && (
        <div
          className={`mb-4 p-4 rounded-lg border ${
            isDark
              ? "bg-green-900/20 border-green-700"
              : "bg-green-50 border-green-200"
          }`}
        >
          <div className="flex items-start gap-2 mb-2">
            <Award
              size={18}
              className={isDark ? "text-green-400" : "text-green-600"}
            />
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  isDark ? "text-green-400" : "text-green-700"
                }`}
              >
                Offered Position
              </p>
              <p
                className={`text-base font-semibold ${
                  isDark ? "text-green-300" : "text-green-800"
                }`}
              >
                {application.offered_job_details?.title || "Job Offer"}
              </p>
              {(application.offered_job_details?.ug_package_min || application.offered_job_details?.ug_package_max) && (
                <p
                  className={`text-sm mt-1 ${
                    isDark ? "text-green-300" : "text-green-700"
                  }`}
                >
                  Package: ₹
                  {application.offered_job_details.ug_package_min === application.offered_job_details.ug_package_max
                    ? application.offered_job_details.ug_package_min
                    : `${application.offered_job_details.ug_package_min} - ₹${application.offered_job_details.ug_package_max}`
                  } LPA
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={`flex gap-3 pt-4 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}>
        <Button
          variant="outline"
          onClick={() => navigate(`/student/company-drives/${application.company_drive}`)}
          className="flex-1"
        >
          View Drive Details
        </Button>
        {application.status === "Offered" && (
          <Button
            variant="primary"
            onClick={onAcceptOffer}
            className="flex-1"
          >
            <Award size={18} className="mr-2" />
            Review Offer
          </Button>
        )}
      </div>
    </div>
  );
}
