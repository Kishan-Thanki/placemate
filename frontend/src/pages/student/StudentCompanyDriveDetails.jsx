import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StudentLayout } from "../../components/layout/StudentLayout";
import { PageContainer, Section } from "../../components/layout";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { companyDriveService } from "../../services/companyDriveService";
import { CardSkeleton, Button } from "../../components/ui";
import { Modal } from "../../components/ui/Modal";
import { ToastContainer } from "../../components/ui/Toast";
import { DriveCard } from "../../components/ui/DriveCard";
import { useToast } from "../../hooks/useToast";
import { applicationService } from "../../services/applicationService";
import { ArrowLeft, Send, X } from "lucide-react";

function extractProgramFromProfile(profile) {
  if (!profile) return null;
  // Return program name directly (it's a string from the backend)
  if (profile.program && typeof profile.program === "string") return profile.program;
  // If it's an object, get the name
  if (profile.program && typeof profile.program === "object") return profile.program.name || profile.program.abbreviation;
  return null;
}

function jobIncludesProgram(job, programName) {
  if (!programName || !job) return false;
  const programs = job.eligible_programs || [];
  if (!Array.isArray(programs)) return false;
  return programs.some((p) => {
    if (p === null || p === undefined) return false;
    // Compare by name or abbreviation
    if (typeof p === "string") return p === programName;
    if (typeof p === "object") return p.name === programName || p.abbreviation === programName;
    return false;
  });
}

function extractTextFromNode(node) {
  if (!node) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractTextFromNode).join(" ").trim();
  if (typeof node === "object") {
    if (node.text) return node.text;
    if (node.content) return extractTextFromNode(node.content);
  }
  return "";
}

function getJobDescription(job) {
  const fallback = job?.short_description || job?.description_ug || job?.description_pg || job?.job_desc;
  if (!fallback) return "";
  if (typeof fallback === "string") return fallback;
  if (typeof fallback === "object") return extractTextFromNode(fallback);
  return String(fallback);
}

export default function StudentCompanyDriveDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { user } = useAuth();

  const { toasts, removeToast, success, error: showError } = useToast();
  const [drive, setDrive] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canApply, setCanApply] = useState(false);
  const [error, setError] = useState(null);
  const [selectedJobIndex, setSelectedJobIndex] = useState(0);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeUrl, setResumeUrl] = useState("");
  const [jobPreferences, setJobPreferences] = useState([]);
  const [existingApplication, setExistingApplication] = useState(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleApplyClick = () => {
    // Initialize job preferences based on drive settings
    if (jobs.length === 1) {
      // Single job - no need for preferences
      setJobPreferences([{ job: jobs[0].id, preference_order: 1 }]);
    } else if (drive?.multiple_allowed) {
      // Multiple jobs allowed - let user select
      setJobPreferences([]);
    } else {
      // Multiple jobs but only one allowed - pre-select current job
      setJobPreferences([{ job: jobs[selectedJobIndex]?.id, preference_order: 1 }]);
    }
    setShowApplyModal(true);
  };

  const handleCloseModal = () => {
    setShowApplyModal(false);
    setResumeUrl("");
    setJobPreferences([]);
  };

  const handleAddJobPreference = () => {
    setJobPreferences([...jobPreferences, { job: "", preference_order: jobPreferences.length + 1 }]);
  };

  const handleRemoveJobPreference = (index) => {
    setJobPreferences(jobPreferences.filter((_, i) => i !== index));
  };

  const handleJobPreferenceChange = (index, jobId) => {
    const updated = [...jobPreferences];
    updated[index] = { ...updated[index], job: parseInt(jobId) };
    setJobPreferences(updated);
  };

  const handleWithdraw = async () => {
    if (!existingApplication?.id) return;
    
    setIsWithdrawing(true);
    try {
      await applicationService.withdrawApplication(existingApplication.id);
      success("Application withdrawn successfully");
      setExistingApplication(null);
    } catch (err) {
      console.error("Failed to withdraw application:", err);
      showError(err.message || "Failed to withdraw application");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!resumeUrl.trim()) {
      showError("Please provide a resume URL");
      return;
    }

    if (jobPreferences.length === 0) {
      showError("Please select at least one job preference");
      return;
    }

    // Validate job preferences
    const selectedJobIds = jobPreferences.map(p => p.job).filter(Boolean);
    if (selectedJobIds.length !== jobPreferences.length) {
      showError("Please select a job for all preferences");
      return;
    }

    // Check for duplicates
    if (new Set(selectedJobIds).size !== selectedJobIds.length) {
      showError("Please select different jobs for each preference");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        company_drive: parseInt(id),
        resume: resumeUrl,
        job_preferences: jobPreferences,
      };
      
      // Create new application
      const result = await applicationService.createApplication(payload);
      success("Application submitted successfully!");
      
      setExistingApplication(result?.data || result);
      handleCloseModal();
    } catch (err) {
      console.error("Application error:", err);
      showError(err.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Load drive and jobs data
        const driveResp = await companyDriveService.getDriveById(id);
        const jobsResp = await companyDriveService.getDriveJobs(id);

        const driveData = driveResp?.data || driveResp || null;
        const jobsData = Array.isArray(jobsResp) ? jobsResp : jobsResp?.results || jobsResp?.data || [];

        if (!mounted) return;
        
        setDrive(driveData);
        setJobs(jobsData);

        // Get student ID (user ID) and program from localStorage
        // StudentProfile.user is the primary key, so student ID = user ID
        let programName = null;
        let studentId = user?.id; // User ID is the student ID for filtering
        
        if (user?.studentProfile) {
          programName = extractProgramFromProfile(user.studentProfile);
          console.log("✅ Using user ID as student ID:", studentId, "Program:", programName);
        }

        // Check if user has already applied to THIS specific drive
        if (studentId) {
          try {
            console.log("🔍 Checking applications for drive:", id, "student:", studentId);
            // Use filtered API call with company_drive and student filters
            // student filter uses the user ID (since StudentProfile.user is the PK)
            const myApplications = await applicationService.getMyApplicationsByDrive(parseInt(id), studentId);
            const applicationsArray = Array.isArray(myApplications) ? myApplications : myApplications?.results || myApplications?.data || [];
            
            console.log("✅ Applications response:", applicationsArray);
            
            // Should return only one application (or empty) since we're filtering by both company_drive and student
            if (applicationsArray.length > 0 && mounted) {
              setExistingApplication(applicationsArray[0]);
            }
          } catch (err) {
            console.error("❌ Error checking applications:", err);
          }
        } else {
          console.warn("⚠️ No user ID available, skipping application check");
        }

        // Check eligibility: at least one job must include student's program
        const eligible = jobsData.some((job) => jobIncludesProgram(job, programName));
        if (mounted) {
          setCanApply(Boolean(eligible));
        }
      } catch (err) {
        console.error("Failed to load company drive details:", err);
        if (mounted) {
          setError(err.message || "Failed to load drive details");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [id, user]);

  const selectedJob = jobs[selectedJobIndex] || null;
  const companyName = drive?.company?.name || "Company";
  const companyLogo = drive?.company?.logo;
  const driveType = drive?.drive_type || "Job";
  const location = drive?.locations || drive?.company?.headquarters_city || "India";
  const deadline = drive?.application_deadline ? new Date(drive.application_deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : "";

  // Check if deadline has passed
  const isDeadlinePassed = drive?.application_deadline ? new Date(drive.application_deadline) < new Date() : false;

  // Parse rounds if available
  const rounds = drive?.rounds ? (Array.isArray(drive.rounds) ? drive.rounds : JSON.parse(drive.rounds || '[]')) : [];

  return (
    <StudentLayout title={drive?.placement_drive?.title || "Company Drive"}>
      <PageContainer>
        <Section
          action={
            <button
              onClick={() => navigate("/student/drives")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                isDark
                  ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Drives
            </button>
          }
        >
          {loading ? (
            <div className="space-y-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : error ? (
            <div className={`p-6 rounded ${isDark ? "bg-gray-800" : "bg-gray-50"}`}>{error}</div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Sidebar - Package Details & Rounds */}
              <div className="w-full lg:w-80 flex-shrink-0 space-y-4 order-2 lg:order-1">
                {/* Package Details */}
                <div className={`p-4 rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <div className={`text-xs font-semibold uppercase mb-3 ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                    {selectedJob?.title || "Position"}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Stipend:</div>
                      <div className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                        ₹ {selectedJob?.ug_stipend || selectedJob?.pg_stipend || "22000"} per month
                      </div>
                    </div>
                    {selectedJob?.ug_package_min && (
                      <div>
                        <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Salary</div>
                        <div className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                          ₹ {selectedJob.ug_package_min === selectedJob.ug_package_max
                            ? selectedJob.ug_package_min
                            : `${selectedJob.ug_package_min} - ${selectedJob.ug_package_max || selectedJob.ug_package_min}`
                          } LPA
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Assessments / Rounds */}
                {rounds.length > 0 && (
                  <div className={`p-4 rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                    <h4 className={`text-sm font-semibold mb-3 uppercase ${isDark ? "text-gray-300" : "text-gray-700"}`}>Assessments</h4>
                    <div className="space-y-3">
                      {rounds.map((round, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg font-semibold ${isDark ? "bg-blue-900 text-blue-300" : "bg-blue-100 text-blue-600"}`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{round.name || round.title || `Round ${idx + 1}`}</div>
                            <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>{round.type || round.mode || "Interview"}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Eligible Programs */}
                {selectedJob && Array.isArray(selectedJob.eligible_programs) && selectedJob.eligible_programs.length > 0 && (
                  <div className={`p-4 rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                    <h4 className={`text-sm font-semibold mb-2 uppercase ${isDark ? "text-gray-300" : "text-gray-700"}`}>Eligible Programs</h4>
                    <div className="text-xs space-y-1">
                      {selectedJob.eligible_programs.map((p, idx) => (
                        <div key={idx} className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>• {p.name || p.title || p}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Main Content Area */}
              <div className="flex-1 space-y-4 order-1 lg:order-2">
                {/* Company Header */}
                <div className={`p-4 rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {companyLogo && (
                      <img src={companyLogo} alt={companyName} className="w-16 h-16 object-contain rounded" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h2 className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{selectedJob?.title || "Position"}</h2>
                      <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{companyName}</div>
                      <div className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                        {driveType} • {location}
                      </div>
                    </div>
                    <div className="w-full sm:w-auto sm:text-right">
                      <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Apply by:</div>
                      <div className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{deadline}</div>
                      
                      {/* Logic: Check application status first, then deadline */}
                      {existingApplication ? (
                        // User has an application - check its status
                        (() => {
                          const status = existingApplication.status;
                          
                          if (status === "Offered") {
                            return (
                              <div className={`mt-2 px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center ${
                                isDark ? "bg-green-900/30 text-green-400 border border-green-700/50" : "bg-green-50 text-green-700 border border-green-200"
                              }`}>
                                ✓ Job Offered
                              </div>
                            );
                          } else if (status === "Rejected") {
                            return (
                              <div className={`mt-2 px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center ${
                                isDark ? "bg-red-900/30 text-red-400 border border-red-700/50" : "bg-red-50 text-red-700 border border-red-200"
                              }`}>
                                ✗ Rejected
                              </div>
                            );
                          } else if (status === "Accepted") {
                            return (
                              <div className={`mt-2 px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center ${
                                isDark ? "bg-emerald-900/30 text-emerald-400 border border-emerald-700/50" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}>
                                ✓ Offer Accepted
                              </div>
                            );
                          } else if (status === "Declined") {
                            return (
                              <div className={`mt-2 px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center ${
                                isDark ? "bg-orange-900/30 text-orange-400 border border-orange-700/50" : "bg-orange-50 text-orange-700 border border-orange-200"
                              }`}>
                                ✗ Offer Declined
                              </div>
                            );
                          } else if (status === "Applied") {
                            // Applied status - show withdraw button only if deadline hasn't passed
                            return isDeadlinePassed ? (
                              <div className={`mt-2 text-xs font-medium ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                                ✓ Applied
                              </div>
                            ) : (
                              <Button 
                                variant="danger" 
                                size="md"
                                className="mt-2"
                                onClick={handleWithdraw}
                                disabled={isWithdrawing}
                              >
                                {isWithdrawing ? "Withdrawing..." : "Withdraw Application"}
                              </Button>
                            );
                          } else {
                            // Unknown status - show status text
                            return (
                              <div className={`mt-2 text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                Status: {status}
                              </div>
                            );
                          }
                        })()
                      ) : (
                        // No application exists
                        isDeadlinePassed ? (
                          <div className={`mt-2 text-xs font-medium ${isDark ? "text-red-400" : "text-red-600"}`}>
                            Deadline Passed
                          </div>
                        ) : canApply ? (
                          <Button 
                            variant="primary" 
                            size="md" 
                            className="mt-2"
                            onClick={handleApplyClick}
                          >
                            <Send size={16} className="mr-2" />
                            Apply Now
                          </Button>
                        ) : (
                          <div className={`mt-2 text-xs ${isDark ? "text-gray-500" : "text-gray-600"}`}>
                            Not Eligible
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Job Tabs */}
                {jobs.length > 1 && (
                  <div className={`flex gap-2 p-2 rounded-lg overflow-x-auto ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
                    {jobs.map((job, idx) => (
                      <button
                        key={job.id}
                        onClick={() => setSelectedJobIndex(idx)}
                        className={`px-4 py-2 text-sm font-medium rounded transition whitespace-nowrap flex-shrink-0 ${
                          selectedJobIndex === idx
                            ? isDark
                              ? "bg-blue-600 text-white"
                              : "bg-white text-blue-600 shadow-sm"
                            : isDark
                            ? "text-gray-400 hover:text-gray-200"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {idx + 1}. {job.title || `Job ${idx + 1}`}
                      </button>
                    ))}
                  </div>
                )}

                {/* Job Description */}
                {selectedJob && (
                  <div className={`p-6 rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>JOB DESCRIPTION</h3>
                    <div className={`text-sm leading-relaxed whitespace-pre-wrap ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {getJobDescription(selectedJob)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Section>
      </PageContainer>

      {/* Apply Modal */}
      {showApplyModal && (
        <Modal
          isOpen={showApplyModal}
          onClose={handleCloseModal}
          title="Apply for Position"
        >
          <div className="space-y-6">
            {/* Resume URL Input */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Resume URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500"
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
              <p className={`mt-1 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Provide a link to your resume (Google Drive, Dropbox, etc.)
              </p>
            </div>

            {/* Job Preferences - Only for multiple jobs */}
            {jobs.length > 1 && (
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  Job Preferences
                  {drive?.multiple_allowed && (
                    <span className="text-red-500"> *</span>
                  )}
                </label>

                {drive?.multiple_allowed ? (
                  // Multiple jobs allowed - show preference list
                  <div className="space-y-3">
                    {jobPreferences.map((pref, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <span
                          className={`w-8 text-sm font-medium ${
                            isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {index + 1}.
                        </span>
                        <select
                          value={pref.job}
                          onChange={(e) =>
                            handleJobPreferenceChange(index, parseInt(e.target.value))
                          }
                          className={`flex-1 px-4 py-2 rounded-lg border ${
                            isDark
                              ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                              : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                          } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                        >
                          <option value="">Select a job role</option>
                          {jobs
                            .filter((job) => {
                              // Show the job if it's the current selection or not selected elsewhere
                              const selectedJobs = jobPreferences.map(p => p.job).filter(Boolean);
                              return job.id === pref.job || !selectedJobs.includes(job.id);
                            })
                            .map((job) => (
                              <option key={job.id} value={job.id}>
                                {job.title}
                              </option>
                            ))}
                        </select>
                        {jobPreferences.length > 1 && (
                          <button
                            onClick={() => handleRemoveJobPreference(index)}
                            className={`p-2 rounded-lg ${
                              isDark
                                ? "text-gray-400 hover:text-red-400 hover:bg-gray-700"
                                : "text-gray-500 hover:text-red-600 hover:bg-gray-100"
                            } transition-colors`}
                          >
                            <X size={20} />
                          </button>
                        )}
                      </div>
                    ))}
                    {jobPreferences.length < jobs.length && (
                      <Button
                        onClick={handleAddJobPreference}
                        variant="outline"
                        className="w-full"
                      >
                        {jobPreferences.length === 0 ? "Add Job Preference" : "Add Another Preference"}
                      </Button>
                    )}
                    <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      Select your preferred job roles in order of preference
                    </p>
                  </div>
                ) : (
                  // Single job allowed - show dropdown
                  <div>
                    <select
                      value={jobPreferences[0]?.job || ""}
                      onChange={(e) =>
                        setJobPreferences([
                          { job: parseInt(e.target.value), preference_order: 1 },
                        ])
                      }
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDark
                          ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                          : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    >
                      <option value="">Select a job role</option>
                      {jobs.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.title}
                        </option>
                      ))}
                    </select>
                    <p className={`mt-1 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      You can apply for only one job role
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCloseModal}
                variant="outline"
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitApplication}
                variant="primary"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </StudentLayout>
  );
}
