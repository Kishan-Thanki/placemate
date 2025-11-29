import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StudentLayout } from "../../components/layout/StudentLayout";
import { PageContainer, Section } from "../../components/layout";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { companyDriveService } from "../../services/companyDriveService";
import { CardSkeleton, Button } from "../../components/ui";
import { DriveCard } from "../../components/ui/DriveCard";
import { fetchJSON } from "../../lib/api";
import { ArrowLeft, Send } from "lucide-react";

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

  const [drive, setDrive] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canApply, setCanApply] = useState(false);
  const [error, setError] = useState(null);
  const [selectedJobIndex, setSelectedJobIndex] = useState(0);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const driveResp = await companyDriveService.getDriveById(id);
        const jobsResp = await companyDriveService.getDriveJobs(id);

        const driveData = driveResp?.data || driveResp || null;
        const jobsData = Array.isArray(jobsResp) ? jobsResp : jobsResp?.results || jobsResp?.data || [];

        if (!mounted) return;
        setDrive(driveData);
        setJobs(jobsData);

        // Determine student's program name from stored user profile first
        let programName = null;
        if (user && user.studentProfile) {
          programName = extractProgramFromProfile(user.studentProfile);
        }

        // Fallback: try fetching /students/me/ if program name still missing
        if (!programName) {
          try {
            const { ok: studentOk, data: studentResp } = await fetchJSON("/api/v1/students/me/", { method: "GET", credentials: "include" });
            if (studentOk && studentResp?.data) {
              programName = extractProgramFromProfile(studentResp.data);
            }
          } catch (e) {
            // ignore student profile fallback failure, log for debugging
            console.warn("Could not fetch student profile fallback:", e);
          }
        }

        // Compute eligibility: any job that includes the student's program
        const eligible = jobsData.some((job) => jobIncludesProgram(job, programName));
        setCanApply(Boolean(eligible));
      } catch (err) {
        console.error("Failed to load company drive detail", err);
        if (mounted) setError(err.message || "Failed to load drive details");
      } finally {
        if (mounted) setLoading(false);
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
            <div className="flex gap-6">
              {/* Left Sidebar - Package Details & Rounds */}
              <div className="w-80 flex-shrink-0 space-y-4">
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
                          ₹ {selectedJob.ug_package_min} - {selectedJob.ug_package_max || selectedJob.ug_package_min} LPA
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
              <div className="flex-1 space-y-4">
                {/* Company Header */}
                <div className={`p-4 rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <div className="flex items-start gap-4">
                    {companyLogo && (
                      <img src={companyLogo} alt={companyName} className="w-16 h-16 object-contain rounded" />
                    )}
                    <div className="flex-1">
                      <h2 className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{selectedJob?.title || "Position"}</h2>
                      <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{companyName}</div>
                      <div className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                        {driveType} • {location}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Apply by:</div>
                      <div className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{deadline}</div>
                      {canApply ? (
                        <Button 
                          variant="primary" 
                          size="md" 
                          className="mt-2"
                        >
                          <Send size={16} className="mr-2" />
                          Apply Now
                        </Button>
                      ) : (
                        <div className={`mt-2 text-xs ${isDark ? "text-gray-500" : "text-gray-600"}`}>Not Eligible</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Job Tabs */}
                {jobs.length > 1 && (
                  <div className={`flex gap-2 p-2 rounded-lg ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
                    {jobs.map((job, idx) => (
                      <button
                        key={job.id}
                        onClick={() => setSelectedJobIndex(idx)}
                        className={`px-4 py-2 text-sm font-medium rounded transition ${
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
    </StudentLayout>
  );
}
