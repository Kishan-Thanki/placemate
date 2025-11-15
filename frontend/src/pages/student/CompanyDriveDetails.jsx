import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { StudentLayout } from "../../components/layout/StudentLayout";
import { PageContainer, Section } from "../../components/layout";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { companyDriveService } from "../../services/companyDriveService";
import { CardSkeleton } from "../../components/ui";
import { DriveCard } from "../../components/ui/DriveCard";
import { fetchJSON } from "../../lib/api";

function extractProgramIdFromProfile(profile) {
  if (!profile) return null;
  if (profile.program && typeof profile.program === "object" && profile.program.id) return profile.program.id;
  if (profile.program_id) return profile.program_id;
  if (profile.programId) return profile.programId; // our stored normalised key
  return null;
}

function jobIncludesProgram(job, programId) {
  if (!programId || !job) return false;
  const programs = job.eligible_programs || job.eligible_programs_ids || [];
  if (!Array.isArray(programs)) return false;
  return programs.some((p) => {
    if (p === null || p === undefined) return false;
    if (typeof p === "number") return p === programId;
    if (typeof p === "string") return String(p) === String(programId);
    if (typeof p === "object") return p.id === programId || String(p.id) === String(programId);
    return false;
  });
}

export default function CompanyDriveDetails() {
  const { id } = useParams();
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [drive, setDrive] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canApply, setCanApply] = useState(false);
  const [error, setError] = useState(null);

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

        // Determine student's program id from stored user profile first
        let programId = null;
        if (user && user.studentProfile) {
          programId = extractProgramIdFromProfile(user.studentProfile);
        }

        // Fallback: try fetching /students/me/ if programId still missing
        if (!programId) {
          try {
            const { ok: studentOk, data: studentResp } = await fetchJSON("/api/v1/students/me/", { method: "GET", credentials: "include" });
            if (studentOk && studentResp?.data) {
              programId = extractProgramIdFromProfile(studentResp.data);
            }
          } catch (e) {
              // ignore student profile fallback failure, log for debugging
              console.warn("Could not fetch student profile fallback:", e);
            }
        }

        // Compute eligibility: any job that includes the student's program
        const eligible = jobsData.some((job) => jobIncludesProgram(job, programId));
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

  return (
    <StudentLayout title={drive?.placement_drive?.title || "Company Drive"}>
      <PageContainer>
        <Section>
          {loading ? (
            <div className="space-y-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : error ? (
            <div className={`p-6 rounded ${isDark ? "bg-gray-800" : "bg-gray-50"}`}>{error}</div>
          ) : (
            <div className="space-y-6">
              {/* DriveCard shows the main info and the Apply button when showApply=true */}
              <DriveCard drive={drive} showApply={true} canApply={canApply} />

              {/* Jobs listing */}
              <div className={`p-4 rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                <h4 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Roles / Jobs</h4>
                <div className="mt-3 space-y-3">
                  {jobs.length === 0 ? (
                    <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>No jobs listed for this drive.</div>
                  ) : (
                    jobs.map((job) => (
                      <div key={job.id} className={`p-3 rounded ${isDark ? "bg-gray-900/40" : "bg-gray-50"}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className={`font-medium ${isDark ? "text-gray-100" : "text-gray-900"}`}>{job.title || job.position || "Job"}</div>
                            <div className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{job.short_description || job.job_desc || ""}</div>
                            <div className="text-xs mt-2 text-gray-500">Eligible programs: {Array.isArray(job.eligible_programs) && job.eligible_programs.length > 0 ? job.eligible_programs.map(p => (p.name || p.title || p)).join(", ") : "All students"}</div>
                          </div>
                          <div className="text-right">
                            {jobIncludesProgram(job, extractProgramIdFromProfile(user?.studentProfile)) ? (
                              <div className="text-sm font-semibold text-green-700">You are eligible</div>
                            ) : (
                              <div className="text-sm text-gray-500">Not eligible</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </Section>
      </PageContainer>
    </StudentLayout>
  );
}
