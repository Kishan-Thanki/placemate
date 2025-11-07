import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  DashboardLayout,
  PageContainer,
  Section,
} from "../../../components/layout";
import { Button, CardSkeleton } from "../../../components/ui";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Building2,
  Calendar,
  MapPin,
  Briefcase,
  Users,
  DollarSign,
  GraduationCap,
} from "lucide-react";
import { companyDriveService } from "../../../services";

export default function CompanyDriveDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [drive, setDrive] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDriveDetails();
  }, [id]);

  const fetchDriveDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch drive details
      const driveResponse = await companyDriveService.getDriveById(id);
      const driveData = driveResponse?.data || driveResponse;
      setDrive(driveData);

      // Fetch jobs for this drive
      try {
        const jobsResponse = await companyDriveService.getDriveJobs(id);
        const jobsData = jobsResponse?.data || jobsResponse || [];
        setJobs(Array.isArray(jobsData) ? jobsData : []);
      } catch (jobErr) {
        console.error("Error fetching jobs:", jobErr);
        setJobs([]);
      }
    } catch (err) {
      console.error("Error fetching drive details:", err);
      setError(err.message || "Failed to load drive details");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete this company drive? This action cannot be undone.`
      )
    )
      return;

    try {
      await companyDriveService.deleteDrive(id);

      const successMsg = document.createElement("div");
      successMsg.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        isDark ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800"
      }`;
      successMsg.textContent = "Company drive deleted successfully!";
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);

      navigate("/admin/drives");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete company drive. Please try again.");
    }
  };

  const handleDeleteJob = async (jobId, jobTitle) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the job "${jobTitle}"? This action cannot be undone.`
      )
    )
      return;

    try {
      await companyDriveService.deleteJob(jobId);

      const successMsg = document.createElement("div");
      successMsg.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        isDark ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800"
      }`;
      successMsg.textContent = "Job deleted successfully!";
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);

      // Refresh the jobs list
      fetchDriveDetails();
    } catch (err) {
      console.error("Delete job error:", err);
      alert("Failed to delete job. Please try again.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-4 py-2 rounded-full text-sm font-medium";
    if (status === "Open") {
      return `${baseClasses} ${
        isDark
          ? "bg-green-900/30 text-green-400"
          : "bg-green-100 text-green-800"
      }`;
    }
    return `${baseClasses} ${
      isDark ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-600"
    }`;
  };

  if (loading) {
    return (
      <DashboardLayout title="Company Drive Details">
        <PageContainer>
          <div className="mb-4">
            <Button onClick={() => navigate("/admin/drives")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Drives
            </Button>
          </div>
          <CardSkeleton />
          <CardSkeleton />
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (error || !drive) {
    return (
      <DashboardLayout title="Company Drive Details">
        <PageContainer>
          <div className="mb-4">
            <Button onClick={() => navigate("/admin/drives")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Drives
            </Button>
          </div>
          <div
            className={`p-6 rounded-lg border ${
              isDark
                ? "bg-red-900/20 border-red-900 text-red-400"
                : "bg-red-50 border-red-200 text-red-600"
            }`}
          >
            <p className="font-medium">⚠️ {error || "Drive not found"}</p>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={drive.company?.name || "Company Drive"}>
      <PageContainer>
        <Section
          action={
            <div className="flex gap-2">
              <Button onClick={() => navigate("/admin/drives")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => navigate(`/admin/drives/${id}/edit`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Drive
              </Button>
              <Button
                onClick={() => navigate(`/admin/drives/${id}/jobs/add`)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Jobs
              </Button>
              <Button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          }
        >
          {/* Drive Overview */}
          <div
            className={`p-6 rounded-lg border mb-6 ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-start gap-4 mb-4">
              <div
                className={`p-3 rounded-lg ${
                  isDark
                    ? "bg-blue-900/30 text-blue-400"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                <Building2 className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h2
                  className={`text-2xl font-bold mb-2 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {drive.company?.name || "Unknown Company"}
                </h2>
                <p
                  className={`text-lg ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {drive.placement_drive?.title || "No Placement Drive"}
                </p>
              </div>
              <span className={getStatusBadge(drive.status)}>
                {drive.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              <div>
                <div
                  className={`flex items-center gap-2 mb-2 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  <Briefcase className="w-5 h-5" />
                  <span className="font-medium">Drive Type</span>
                </div>
                <p className={isDark ? "text-white" : "text-gray-900"}>
                  {drive.drive_type}
                </p>
              </div>

              <div>
                <div
                  className={`flex items-center gap-2 mb-2 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  <MapPin className="w-5 h-5" />
                  <span className="font-medium">Job Mode</span>
                </div>
                <p className={isDark ? "text-white" : "text-gray-900"}>
                  {drive.job_mode}
                </p>
              </div>

              <div>
                <div
                  className={`flex items-center gap-2 mb-2 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                  <span className="font-medium">Application Deadline</span>
                </div>
                <p className={isDark ? "text-white" : "text-gray-900"}>
                  {formatDate(drive.application_deadline)}
                </p>
              </div>

              {drive.rounds && drive.rounds.length > 0 && (
                <div>
                  <div
                    className={`flex items-center gap-2 mb-2 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    <span className="font-medium">Interview Rounds</span>
                  </div>
                  <p className={isDark ? "text-white" : "text-gray-900"}>
                    {Array.isArray(drive.rounds)
                      ? drive.rounds.join(", ")
                      : drive.rounds}
                  </p>
                </div>
              )}

              {drive.locations && drive.locations.length > 0 && (
                <div>
                  <div
                    className={`flex items-center gap-2 mb-2 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    <MapPin className="w-5 h-5" />
                    <span className="font-medium">Locations</span>
                  </div>
                  <p className={isDark ? "text-white" : "text-gray-900"}>
                    {drive.locations.length} location(s)
                  </p>
                </div>
              )}

              <div>
                <div
                  className={`flex items-center gap-2 mb-2 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                  <span className="font-medium">Created At</span>
                </div>
                <p className={isDark ? "text-white" : "text-gray-900"}>
                  {formatDate(drive.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Jobs Section */}
          <div>
            <h3
              className={`text-xl font-bold mb-4 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Job Positions ({jobs.length})
            </h3>

            {jobs.length === 0 ? (
              <div
                className={`p-6 rounded-lg border text-center ${
                  isDark
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <Briefcase
                  className={`w-12 h-12 mx-auto mb-4 ${
                    isDark ? "text-gray-600" : "text-gray-400"
                  }`}
                />
                <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                  No jobs available for this drive
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job, index) => (
                  <div
                    key={job.id}
                    className={`p-6 rounded-lg border ${
                      isDark
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4
                          className={`text-lg font-semibold mb-1 ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {job.title}
                        </h4>
                        <p
                          className={`text-sm ${
                            isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Job #{index + 1}
                        </p>
                      </div>
                    </div>

                    {/* Job Descriptions */}
                    {(job.description_ug || job.description_pg) && (
                      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {job.description_ug && (
                          <div>
                            <p
                              className={`text-sm font-medium mb-1 ${
                                isDark ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              UG Description
                            </p>
                            <p
                              className={`text-sm ${
                                isDark ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              {job.description_ug}
                            </p>
                          </div>
                        )}
                        {job.description_pg && (
                          <div>
                            <p
                              className={`text-sm font-medium mb-1 ${
                                isDark ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              PG Description
                            </p>
                            <p
                              className={`text-sm ${
                                isDark ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              {job.description_pg}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Eligibility Criteria */}
                    <div className="mb-4">
                      <p
                        className={`text-sm font-medium mb-2 ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Eligibility Criteria
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {job.min_ug_cgpa && (
                          <div>
                            <p
                              className={`text-xs ${
                                isDark ? "text-gray-500" : "text-gray-500"
                              }`}
                            >
                              Min UG CGPA
                            </p>
                            <p
                              className={`font-medium ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {job.min_ug_cgpa}
                            </p>
                          </div>
                        )}
                        {job.min_pg_cgpa && (
                          <div>
                            <p
                              className={`text-xs ${
                                isDark ? "text-gray-500" : "text-gray-500"
                              }`}
                            >
                              Min PG CGPA
                            </p>
                            <p
                              className={`font-medium ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {job.min_pg_cgpa}
                            </p>
                          </div>
                        )}
                        {job.min_tenth_percentage && (
                          <div>
                            <p
                              className={`text-xs ${
                                isDark ? "text-gray-500" : "text-gray-500"
                              }`}
                            >
                              Min 10th %
                            </p>
                            <p
                              className={`font-medium ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {job.min_tenth_percentage}%
                            </p>
                          </div>
                        )}
                        {job.min_twelfth_percentage && (
                          <div>
                            <p
                              className={`text-xs ${
                                isDark ? "text-gray-500" : "text-gray-500"
                              }`}
                            >
                              Min 12th %
                            </p>
                            <p
                              className={`font-medium ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {job.min_twelfth_percentage}%
                            </p>
                          </div>
                        )}
                        {job.max_active_backlogs !== null &&
                          job.max_active_backlogs !== undefined && (
                            <div>
                              <p
                                className={`text-xs ${
                                  isDark ? "text-gray-500" : "text-gray-500"
                                }`}
                              >
                                Max Backlogs
                              </p>
                              <p
                                className={`font-medium ${
                                  isDark ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {job.max_active_backlogs}
                              </p>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Package Details */}
                    <div className="mb-4">
                      <p
                        className={`text-sm font-medium mb-2 flex items-center gap-2 ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        <DollarSign className="w-4 h-4" />
                        Package Details
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {(job.ug_package_min || job.ug_package_max) && (
                          <div>
                            <p
                              className={`text-xs ${
                                isDark ? "text-gray-500" : "text-gray-500"
                              }`}
                            >
                              UG Package
                            </p>
                            <p
                              className={`font-medium ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              ₹{job.ug_package_min || 0} - ₹
                              {job.ug_package_max || 0} LPA
                            </p>
                          </div>
                        )}
                        {(job.pg_package_min || job.pg_package_max) && (
                          <div>
                            <p
                              className={`text-xs ${
                                isDark ? "text-gray-500" : "text-gray-500"
                              }`}
                            >
                              PG Package
                            </p>
                            <p
                              className={`font-medium ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              ₹{job.pg_package_min || 0} - ₹
                              {job.pg_package_max || 0} LPA
                            </p>
                          </div>
                        )}
                        {job.ug_stipend && (
                          <div>
                            <p
                              className={`text-xs ${
                                isDark ? "text-gray-500" : "text-gray-500"
                              }`}
                            >
                              UG Stipend
                            </p>
                            <p
                              className={`font-medium ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              ₹{job.ug_stipend}/month
                            </p>
                          </div>
                        )}
                        {job.pg_stipend && (
                          <div>
                            <p
                              className={`text-xs ${
                                isDark ? "text-gray-500" : "text-gray-500"
                              }`}
                            >
                              PG Stipend
                            </p>
                            <p
                              className={`font-medium ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              ₹{job.pg_stipend}/month
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Eligible Programs */}
                    {job.eligible_programs &&
                      job.eligible_programs.length > 0 && (
                        <div className="mb-4">
                          <p
                            className={`text-sm font-medium mb-2 flex items-center gap-2 ${
                              isDark ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            <GraduationCap className="w-4 h-4" />
                            Eligible Programs
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {job.eligible_programs.map((program) => (
                              <span
                                key={program.id}
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  isDark
                                    ? "bg-blue-900/30 text-blue-400"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {program.name} ({program.abbreviation})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Job Actions */}
                    <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/admin/drives/${id}/jobs/${job.id}/edit`)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit Job
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDeleteJob(job.id, job.title)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete Job
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>
      </PageContainer>
    </DashboardLayout>
  );
}
