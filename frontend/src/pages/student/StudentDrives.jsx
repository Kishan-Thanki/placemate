import React, { useState, useEffect } from "react";
import { StudentLayout } from "../../components/layout/StudentLayout";
import { PageContainer, Section } from "../../components/layout";
import { useTheme } from "../../contexts/ThemeContext";
import { Search } from "lucide-react";
import { DriveCard } from "../../components//ui/DriveCard"; 
import { companyDriveService } from "../../services/companyDriveService";
import { fetchJSON } from "../../lib/api";

export function StudentDrives() {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");

  const [drives, setDrives] = useState([]);
  const [studentProgramId, setStudentProgramId] = useState(null);
  const [loadingDrives, setLoadingDrives] = useState(true);

  // Load drives from API and student profile to compute eligibility
  useEffect(() => {
    let mounted = true;

    const loadAll = async () => {
      setLoadingDrives(true);
      try {
        const drivesResp = await companyDriveService.getAllDrives({ status: 'Open' });
        // normalize wrapper: data may be { results: [...] } or array
        const allDrives = Array.isArray(drivesResp)
          ? drivesResp
          : drivesResp.results || drivesResp.data || [];

        // fetch student profile (program) if available
        const { ok, data } = await fetchJSON('/api/v1/students/me/', { method: 'GET', credentials: 'include' });
        let programId = null;
        if (ok && data && data.data) {
          // StudentProfileSerializer returns program as string in some endpoints; StudentDetail returns program_details
          const profile = data.data;
          if (profile.program && typeof profile.program === 'object' && profile.program.id) {
            programId = profile.program.id;
          } else if (profile.program_id) {
            programId = profile.program_id;
          } else if (profile.program) {
            // program might be string; leave null
            programId = null;
          }
        }

        if (mounted) {
          // Try to enrich each drive with jobs (to determine eligible programs)
          const enriched = await Promise.all(
            allDrives.map(async (d) => {
              try {
                const jobsResp = await companyDriveService.getDriveJobs(d.id);
                const jobsList = Array.isArray(jobsResp)
                  ? jobsResp
                  : jobsResp.results || jobsResp.data || [];
                return { ...d, jobs: jobsList };
              } catch {
                // If fetching jobs fails, return drive without jobs
                return { ...d, jobs: [] };
              }
            })
          );

          setDrives(enriched);
          setStudentProgramId(programId);
        }
      } catch (err) {
        console.error('Failed to load drives or profile', err);
      } finally {
        if (mounted) setLoadingDrives(false);
      }
    };

    loadAll();
    return () => { mounted = false; };
  }, []);

  const filteredDrives = drives.filter((drive) => {
    const matchesFilter = filter === "All" || drive.drive_type === filter || drive.type === filter;
    const searchable = (drive.company?.toLowerCase() || '') + ' ' + (drive.placement_drive?.title || '') + ' ' + (drive.jobs_count || '');
    const matchesSearch = searchable.includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const isEligibleForDrive = (drive) => {
    // drive may not include job details in list view; we will treat eligibility permissively if unknown
    if (!studentProgramId) return false;
    // if drive has jobs embedded (some APIs may include), check eligible_programs
    if (Array.isArray(drive.jobs) && drive.jobs.length > 0) {
      return drive.jobs.some((job) =>
        Array.isArray(job.eligible_programs) && job.eligible_programs.some((p) => p.id === studentProgramId || p === studentProgramId)
      );
    }
    // otherwise, try to fetch jobs when rendering or assume not eligible
    return false;
  };

  return (
    <StudentLayout title="Placement Drives">
      <PageContainer>
        <Section>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="relative w-full sm:w-1/2">
              <Search
                className={`absolute left-3 top-2.5 w-5 h-5 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              />
              <input
                type="text"
                placeholder="Search by Company or Drive Name"
                className={`w-full rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? "bg-gray-800 text-gray-200 border border-gray-700 placeholder-gray-400"
                    : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className={`rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? "bg-gray-800 border-gray-700 text-gray-200"
                    : "bg-white border border-gray-300 text-gray-900"
                }`}
              >
                <option value="All">All</option>
                <option value="Full-time">Full-time</option>
                <option value="Internship">Internship</option>
              </select>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilter("All");
                }}
                className={`text-sm px-3 py-2 rounded-lg ${
                  isDark
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Drives Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {loadingDrives ? (
              <div className="col-span-3 text-center py-6">Loading drives...</div>
            ) : (
              filteredDrives.map((drive) => (
                <DriveCard key={drive.id} drive={drive} canApply={isEligibleForDrive(drive)} />
              ))
            )}
          </div>

          {filteredDrives.length === 0 && (
            <div
              className={`text-center py-10 rounded-lg border mt-6 ${
                isDark
                  ? "border-gray-700 text-gray-400"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              No drives found matching your criteria.
            </div>
          )}
        </Section>

        <p
          className={`text-xs text-center mt-8 ${
            isDark ? "text-gray-500" : "text-gray-500"
          }`}
        >
          Drives shown based on student eligibility, filters, and registration status.
        </p>
      </PageContainer>
    </StudentLayout>
  );
}
