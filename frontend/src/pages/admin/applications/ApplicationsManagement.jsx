import React, { useEffect, useState, useCallback } from "react";
import { DashboardLayout, PageContainer, Section } from "../../../components/layout";
import { useTheme } from "../../../contexts/ThemeContext";
import { applicationService } from "../../../services/applicationService";
import { companyDriveService } from "../../../services/companyDriveService";
import { CardSkeleton, Button } from "../../../components/ui";
import { Modal } from "../../../components/ui/Modal";
import { ToastContainer } from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";
import {
  Building2,
  User,
  Calendar,
  FileText,
  ExternalLink,
  CheckCircle,
  XCircle,
  Award,
  Filter,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

const STATUS_CONFIG = {
  Applied: {
    label: "Applied",
    bgClass: "bg-blue-500/10",
    textClass: "text-blue-600 dark:text-blue-400",
    borderClass: "border-blue-500/20",
  },
  Offered: {
    label: "Offered",
    bgClass: "bg-green-500/10",
    textClass: "text-green-600 dark:text-green-400",
    borderClass: "border-green-500/20",
  },
  Accepted: {
    label: "Accepted",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-600 dark:text-emerald-400",
    borderClass: "border-emerald-500/20",
  },
  Declined: {
    label: "Declined",
    bgClass: "bg-red-500/10",
    textClass: "text-red-600 dark:text-red-400",
    borderClass: "border-red-500/20",
  },
  Rejected: {
    label: "Rejected",
    bgClass: "bg-gray-500/10",
    textClass: "text-gray-600 dark:text-gray-400",
    borderClass: "border-gray-500/20",
  },
};

// Application Card Component
function ApplicationCard({
  application,
  isDark,
  getStatusBadge,
  formatDate,
  onOfferJob,
  onReject,
}) {
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
            <User size={20} className={isDark ? "text-gray-400" : "text-gray-500"} />
            <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
              {application.student_name}
            </h3>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={16} className={isDark ? "text-gray-400" : "text-gray-500"} />
            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              {application.company_name} - {application.drive_title}
            </p>
          </div>
        </div>
        <div>{getStatusBadge(application.status)}</div>
      </div>

      {/* Details */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 rounded-lg ${
          isDark ? "bg-gray-700/50" : "bg-gray-50"
        }`}
      >
        <div className="flex items-center gap-2">
          <Calendar size={16} className={isDark ? "text-gray-400" : "text-gray-500"} />
          <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
            Applied: {formatDate(application.applied_at)}
          </span>
        </div>
        {application.resume && (
          <div className="flex items-center gap-2">
            <FileText size={16} className={isDark ? "text-gray-400" : "text-gray-500"} />
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

      {/* Actions */}
      {(application.status === "Applied" || application.status === "Offered") && (
        <div className={`flex gap-3 pt-4 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}>
          {application.status === "Applied" && (
            <>
              <Button variant="primary" onClick={onOfferJob} className="flex-1">
                <CheckCircle size={18} className="mr-2" />
                Offer Job
              </Button>
              <Button variant="danger" onClick={onReject} className="flex-1">
                <XCircle size={18} className="mr-2" />
                Reject
              </Button>
            </>
          )}
          {application.status === "Offered" && (
            <Button variant="danger" onClick={onReject} className="flex-1">
              <XCircle size={18} className="mr-2" />
              Reject
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ApplicationsManagement() {
  const { isDark } = useTheme();
  const { toasts, removeToast, success, error: showError } = useToast();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDrive, setFilterDrive] = useState("all");
  const [drives, setDrives] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Modal states
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [availableJobs, setAvailableJobs] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      console.log("🔄 Fetching applications and drives...");
      setLoading(true);
      
      // Fetch all applications
      const appsResponse = await applicationService.getMyApplications();
      console.log("📋 Applications response:", appsResponse);
      
      const appsData = Array.isArray(appsResponse) 
        ? appsResponse 
        : appsResponse?.data || appsResponse?.results || [];
      
      console.log("✅ Applications data:", appsData, "Count:", appsData.length);
      setApplications(appsData);

      // Fetch all drives for filter
      const drivesResponse = await companyDriveService.getAllDrives();
      console.log("🚗 Drives response:", drivesResponse);
      
      const drivesData = Array.isArray(drivesResponse)
        ? drivesResponse
        : drivesResponse?.data || drivesResponse?.results || [];
      
      console.log("✅ Drives data:", drivesData, "Count:", drivesData.length);
      setDrives(drivesData);
    } catch (err) {
      console.error("❌ Error fetching data:", err);
      showError(err.message || "Failed to load applications");
    } finally {
      setLoading(false);
      console.log("✅ Loading complete");
    }
  }, [showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOfferJob = async () => {
    if (!selectedApplication?.id || !selectedJobId) {
      showError("Please select a job to offer");
      return;
    }

    try {
      setIsProcessing(true);
      await applicationService.offerJob(selectedApplication.id, parseInt(selectedJobId));
      success("Job offer sent successfully!");
      setShowOfferModal(false);
      setSelectedApplication(null);
      setSelectedJobId("");
      await fetchData();
    } catch (err) {
      console.error("Error offering job:", err);
      showError(err.message || "Failed to offer job");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectApplication = async () => {
    if (!selectedApplication?.id) return;

    try {
      setIsProcessing(true);
      await applicationService.rejectApplication(selectedApplication.id);
      success("Application rejected successfully");
      setShowRejectModal(false);
      setSelectedApplication(null);
      await fetchData();
    } catch (err) {
      console.error("Error rejecting application:", err);
      showError(err.message || "Failed to reject application");
    } finally {
      setIsProcessing(false);
    }
  };

  const openOfferModal = async (application) => {
    setSelectedApplication(application);
    
    // Fetch jobs for this company drive
    try {
      const jobsResponse = await companyDriveService.getDriveJobs(application.company_drive);
      const jobsData = Array.isArray(jobsResponse)
        ? jobsResponse
        : jobsResponse?.data || jobsResponse?.results || [];
      
      setAvailableJobs(jobsData);
      setShowOfferModal(true);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      showError("Failed to load available jobs");
    }
  };

  const openRejectModal = (application) => {
    setSelectedApplication(application);
    setShowRejectModal(true);
  };

  const closeModals = () => {
    setShowOfferModal(false);
    setShowRejectModal(false);
    setSelectedApplication(null);
    setSelectedJobId("");
  };

  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.Applied;
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.bgClass} ${config.textClass} ${config.borderClass}`}
      >
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

  const filteredApplications = applications.filter((app) => {
    const statusMatch = filterStatus === "all" || app.status === filterStatus;
    const driveMatch = filterDrive === "all" || app.company_drive === parseInt(filterDrive);
    const searchMatch = !searchQuery || 
      app.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.drive_title?.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && driveMatch && searchMatch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedApplications = filteredApplications.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterDrive, searchQuery]);

  if (loading) {
    return (
      <DashboardLayout title="Manage Applications">
        <PageContainer>
          <Section
           >
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </Section>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Manage Applications">
      <PageContainer>
        <ToastContainer toasts={toasts} removeToast={removeToast} />

        <Section
          
        >
          {/* Search and Filters */}
          <div
            className={`p-4 rounded-lg border mb-6 ${
              isDark ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter size={18} className={isDark ? "text-gray-400" : "text-gray-600"} />
                <h3 className={`font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Search & Filters
                </h3>
              </div>
              <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                {filteredApplications.length} result{filteredApplications.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search 
                  size={18} 
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`} 
                />
                <input
                  type="text"
                  placeholder="Search by student name, company, or drive..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                >
                  <option value="all">All Status</option>
                  <option value="Applied">Applied</option>
                  <option value="Offered">Offered</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Declined">Declined</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Drive Filter */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Company Drive
                </label>
                <select
                  value={filterDrive}
                  onChange={(e) => setFilterDrive(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                >
                  <option value="all">All Drives</option>
                  {drives.map((drive) => (
                    <option key={drive.id} value={drive.id}>
                      {drive.company?.name || drive.title || `Drive ${drive.id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Items Per Page */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Per Page
                </label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Refresh Button */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={fetchData}
                  className="w-full"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Applications Table */}
          {filteredApplications.length === 0 ? (
            <div
              className={`p-12 rounded-lg border text-center ${
                isDark ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"
              }`}
            >
              <FileText
                size={48}
                className={`mx-auto mb-3 ${isDark ? "text-gray-600" : "text-gray-400"}`}
              />
              <p className={`text-lg font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                No Applications Found
              </p>
              <p className={`text-sm mt-2 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                {applications.length === 0 
                  ? "There are no applications yet." 
                  : "No applications match the selected filters."}
              </p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className={`rounded-lg border overflow-hidden ${
                isDark ? "border-gray-700" : "border-gray-200"
              }`}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={isDark ? "bg-gray-800/50" : "bg-gray-50"}>
                      <tr>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDark ? "text-gray-400" : "text-gray-700"
                        }`}>
                          Student
                        </th>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDark ? "text-gray-400" : "text-gray-700"
                        }`}>
                          Company & Drive
                        </th>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDark ? "text-gray-400" : "text-gray-700"
                        }`}>
                          Status
                        </th>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDark ? "text-gray-400" : "text-gray-700"
                        }`}>
                          Applied Date
                        </th>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDark ? "text-gray-400" : "text-gray-700"
                        }`}>
                          Resume
                        </th>
                        <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                          isDark ? "text-gray-400" : "text-gray-700"
                        }`}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-200"}`}>
                      {paginatedApplications.map((application) => (
                        <tr 
                          key={application.id}
                          className={`transition-colors ${
                            isDark 
                              ? "bg-gray-800 hover:bg-gray-700/50" 
                              : "bg-white hover:bg-gray-50"
                          }`}
                        >
                          {/* Student */}
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${
                                isDark ? "bg-gray-700" : "bg-gray-100"
                              }`}>
                                <User size={16} className={isDark ? "text-gray-400" : "text-gray-600"} />
                              </div>
                              <span className={`font-medium ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}>
                                {application.student_name || "N/A"}
                              </span>
                            </div>
                          </td>

                          {/* Company & Drive */}
                          <td className="px-4 py-4">
                            <div>
                              <div className={`font-medium text-sm ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}>
                                {application.company_name || "N/A"}
                              </div>
                              <div className={`text-xs mt-1 ${
                                isDark ? "text-gray-400" : "text-gray-500"
                              }`}>
                                {application.drive_title || "N/A"}
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4">
                            {getStatusBadge(application.status)}
                          </td>

                          {/* Applied Date */}
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className={isDark ? "text-gray-400" : "text-gray-500"} />
                              <span className={`text-sm ${
                                isDark ? "text-gray-300" : "text-gray-600"
                              }`}>
                                {formatDate(application.applied_at)}
                              </span>
                            </div>
                          </td>

                          {/* Resume */}
                          <td className="px-4 py-4">
                            {application.resume ? (
                              <a
                                href={application.resume}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1 text-sm hover:underline ${
                                  isDark ? "text-blue-400" : "text-blue-600"
                                }`}
                              >
                                <FileText size={14} />
                                View
                                <ExternalLink size={12} />
                              </a>
                            ) : (
                              <span className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                N/A
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-4">
                            {(application.status === "Applied" || application.status === "Offered") && (
                              <div className="flex justify-end gap-2">
                                {application.status === "Applied" && (
                                  <button
                                    onClick={() => openOfferModal(application)}
                                    className={`p-2 rounded-lg transition-colors ${
                                      isDark
                                        ? "hover:bg-green-500/10 text-green-400"
                                        : "hover:bg-green-50 text-green-600"
                                    }`}
                                    title="Offer Job"
                                  >
                                    <CheckCircle size={18} />
                                  </button>
                                )}
                                <button
                                  onClick={() => openRejectModal(application)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    isDark
                                      ? "hover:bg-red-500/10 text-red-400"
                                      : "hover:bg-red-50 text-red-600"
                                  }`}
                                  title="Reject Application"
                                >
                                  <XCircle size={18} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={`flex items-center justify-between px-4 py-3 mt-4 rounded-lg border ${
                  isDark ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"
                }`}>
                  <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredApplications.length)} of {filteredApplications.length} results
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-lg transition-colors ${
                        currentPage === 1
                          ? isDark ? "text-gray-600 cursor-not-allowed" : "text-gray-400 cursor-not-allowed"
                          : isDark ? "text-gray-400 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-200"
                      }`}
                      title="First page"
                    >
                      <ChevronsLeft size={18} />
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-lg transition-colors ${
                        currentPage === 1
                          ? isDark ? "text-gray-600 cursor-not-allowed" : "text-gray-400 cursor-not-allowed"
                          : isDark ? "text-gray-400 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-200"
                      }`}
                      title="Previous page"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className={`px-4 py-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-lg transition-colors ${
                        currentPage === totalPages
                          ? isDark ? "text-gray-600 cursor-not-allowed" : "text-gray-400 cursor-not-allowed"
                          : isDark ? "text-gray-400 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-200"
                      }`}
                      title="Next page"
                    >
                      <ChevronRight size={18} />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-lg transition-colors ${
                        currentPage === totalPages
                          ? isDark ? "text-gray-600 cursor-not-allowed" : "text-gray-400 cursor-not-allowed"
                          : isDark ? "text-gray-400 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-200"
                      }`}
                      title="Last page"
                    >
                      <ChevronsRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </Section>

        {/* Offer Job Modal */}
        {showOfferModal && selectedApplication && (
          <Modal
            isOpen={showOfferModal}
            onClose={closeModals}
            title="Offer Job Position"
            isDark={isDark}
          >
            <div className="space-y-4">
              <div
                className={`p-4 rounded-lg border ${
                  isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
                }`}
              >
                <p className={`text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Student: {selectedApplication.student_name}
                </p>
                <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  Company: {selectedApplication.company_name}
                </p>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Select Job Position *
                </label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                >
                  <option value="">-- Select a job --</option>
                  {availableJobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title}
                      {job.ug_package_min && job.ug_package_max &&
                        ` (₹${job.ug_package_min}-${job.ug_package_max} LPA)`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={closeModals} className="flex-1">
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleOfferJob}
                  disabled={isProcessing || !selectedJobId}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Offering...
                    </>
                  ) : (
                    <>
                      <Award size={18} className="mr-2" />
                      Offer Job
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Reject Confirmation Modal */}
        {showRejectModal && selectedApplication && (
          <Modal
            isOpen={showRejectModal}
            onClose={closeModals}
            title="Reject Application"
            isDark={isDark}
          >
            <div className="space-y-4">
              <div
                className={`p-4 rounded-lg border ${
                  isDark
                    ? "bg-red-900/20 border-red-700"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <p className={`text-sm ${isDark ? "text-red-300" : "text-red-700"}`}>
                  Are you sure you want to reject this application?
                </p>
              </div>

              <div
                className={`p-4 rounded-lg border ${
                  isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
                }`}
              >
                <p className={`text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Student: {selectedApplication.student_name}
                </p>
                <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  Company: {selectedApplication.company_name}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={closeModals} className="flex-1">
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleRejectApplication}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle size={18} className="mr-2" />
                      Reject Application
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}
