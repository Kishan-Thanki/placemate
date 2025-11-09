import React, { useEffect, useState, useCallback } from "react";
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import HardBreak from '@tiptap/extension-hard-break';
import Typography from '@tiptap/extension-typography';
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

// Custom styles for rendered job descriptions
const jobDescStyles = `
  .job-description h1 {
    font-size: 2em;
    font-weight: bold;
    margin: 0.67em 0;
    line-height: 1.2;
  }
  .job-description h2 {
    font-size: 1.5em;
    font-weight: bold;
    margin: 0.75em 0;
    line-height: 1.3;
  }
  .job-description h3 {
    font-size: 1.25em;
    font-weight: bold;
    margin: 0.83em 0;
    line-height: 1.4;
  }
  .job-description ul {
    list-style-type: disc;
    margin: 1em 0;
    padding-left: 2em;
  }
  .job-description ol {
    list-style-type: decimal;
    margin: 1em 0;
    padding-left: 2em;
  }
  .job-description li {
    margin: 0.5em 0;
  }
  .job-description blockquote {
    border-left: 4px solid #6b7280;
    padding-left: 1em;
    margin: 1em 0;
    font-style: italic;
    color: #6b7280;
  }
  .job-description pre {
    background-color: #f3f4f6;
    padding: 1em;
    border-radius: 0.5em;
    overflow-x: auto;
    margin: 1em 0;
  }
  .job-description code {
    background-color: #f3f4f6;
    padding: 0.2em 0.4em;
    border-radius: 0.25em;
    font-family: monospace;
  }
  .job-description hr {
    border: none;
    border-top: 2px solid #e5e7eb;
    margin: 2em 0;
  }
  .job-description p {
    margin: 0.5em 0;
    line-height: 1.6;
  }
  .job-description strong {
    font-weight: bold;
  }
  .job-description em {
    font-style: italic;
  }
  .job-description u {
    text-decoration: underline;
  }
  .job-description a {
    color: #3b82f6;
    text-decoration: underline;
  }
  .job-description a:hover {
    color: #2563eb;
  }
`;

export default function CompanyDriveDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [drive, setDrive] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeJobTab, setActiveJobTab] = useState({}); // Track active tab for each job

  const fetchDriveDetails = useCallback(async () => {
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
        
        // Parse job_desc if it's a string (happens when sent via FormData)
        const processedJobs = (Array.isArray(jobsData) ? jobsData : []).map(job => ({
          ...job,
          job_desc: typeof job.job_desc === 'string' 
            ? (() => {
                try {
                  return JSON.parse(job.job_desc);
                } catch {
                  console.warn('Failed to parse job_desc for job:', job.id);
                  return null;
                }
              })()
            : job.job_desc
        }));
        
        setJobs(processedJobs);
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
  }, [id]);

  useEffect(() => {
    fetchDriveDetails();
  }, [fetchDriveDetails]);

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
                      <div className="flex-1">
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
                      {job.job_pdf && (
                        <a
                          href={job.job_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                            isDark
                              ? "bg-red-900/20 border-red-900 text-red-400 hover:bg-red-900/30"
                              : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                          }`}
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">Job Description Pdf</span>
                        </a>
                      )}
                    </div>

                    {/* Job Description */}
                    {job.job_desc && job.job_desc.content && job.job_desc.content.length > 0 && (
                      <div className={`mb-4 p-4 rounded-lg border ${
                        isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <style>{jobDescStyles}</style>
                        <h5 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Job Description
                        </h5>
                        <div 
                          className={`job-description prose prose-sm max-w-none ${isDark ? 'prose-invert text-gray-200' : 'text-gray-900'}`}
                          style={{
                            wordBreak: 'break-word'
                          }}
                          dangerouslySetInnerHTML={{ 
                            __html: (() => {
                              try {
                                // Parse job_desc if it's a string
                                let jobDesc = job.job_desc;
                                if (typeof jobDesc === 'string') {
                                  try {
                                    jobDesc = JSON.parse(jobDesc);
                                  } catch (parseError) {
                                    console.error('Failed to parse job_desc string:', parseError);
                                    return '<p>Invalid job description format</p>';
                                  }
                                }
                                
                                const safeDoc = jobDesc && jobDesc.type === 'doc' ? jobDesc : { type: 'doc', content: [{ type: 'paragraph' }] };
                                
                                console.log('Generating HTML for job:', job.id, safeDoc);
                                
                                const html = generateHTML(
                                  safeDoc,
                                  [
                                    StarterKit.configure({ 
                                      heading: { levels: [1, 2, 3] },
                                      bulletList: {},
                                      orderedList: {},
                                      listItem: {},
                                      blockquote: {},
                                      codeBlock: {},
                                      horizontalRule: {},
                                    }),
                                    Underline,
                                    Link.configure({ 
                                      HTMLAttributes: { 
                                        class: 'text-blue-500 hover:underline cursor-pointer', 
                                        target: '_blank', 
                                        rel: 'noopener noreferrer' 
                                      } 
                                    }),
                                    TextAlign.configure({ types: ['heading', 'paragraph'] }),
                                    HardBreak.configure({ keepMarks: true }),
                                    Typography,
                                  ]
                                );
                                
                                console.log('Generated HTML:', html);
                                return html;
                              } catch (error) {
                                console.error('Error generating HTML for job', job.id, ':', error, job.job_desc);
                                return '<p class="text-red-500">Error rendering job description. Please check console for details.</p>';
                              }
                            })()
                          }}
                        />
                      </div>
                    )}

                    {/* UG/PG Tabs */}
                    {(() => {
                      // Check if UG data exists
                      const hasUGData = job.description_ug || job.ug_package_min || job.ug_package_max || job.ug_stipend || job.min_ug_cgpa;
                      // Check if PG data exists
                      const hasPGData = job.description_pg || job.pg_package_min || job.pg_package_max || job.pg_stipend || job.min_pg_cgpa;
                      
                      // Only show tabs if both UG and PG data exist
                      const showTabs = hasUGData && hasPGData;
                      
                      // Determine which content to show
                      const showContent = hasUGData || hasPGData;
                      
                      if (!showContent) return null;
                      
                      return (
                        <div className="mb-4">
                          {/* Tab Buttons - Only show if both UG and PG data exist */}
                          {showTabs && (
                            <div className={`flex gap-2 mb-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                              <button
                                onClick={() => setActiveJobTab(prev => ({ ...prev, [job.id]: 'ug' }))}
                                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                                  (activeJobTab[job.id] || 'ug') === 'ug'
                                    ? isDark
                                      ? 'border-blue-500 text-blue-400'
                                      : 'border-blue-600 text-blue-600'
                                    : isDark
                                      ? 'border-transparent text-gray-400 hover:text-gray-300'
                                      : 'border-transparent text-gray-600 hover:text-gray-700'
                                }`}
                              >
                                UG
                              </button>
                              <button
                                onClick={() => setActiveJobTab(prev => ({ ...prev, [job.id]: 'pg' }))}
                                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                                  (activeJobTab[job.id] || 'ug') === 'pg'
                                    ? isDark
                                      ? 'border-blue-500 text-blue-400'
                                      : 'border-blue-600 text-blue-600'
                                    : isDark
                                      ? 'border-transparent text-gray-400 hover:text-gray-300'
                                      : 'border-transparent text-gray-600 hover:text-gray-700'
                                }`}
                              >
                                PG
                              </button>
                            </div>
                          )}

                          {/* Content - Show with or without tabs based on data availability */}
                          <div>
                          {/* Show UG content if: tabs are shown and UG tab is active, OR no tabs and UG data exists */}
                          {((showTabs && (activeJobTab[job.id] || 'ug') === 'ug') || (!showTabs && hasUGData)) && (
                            <div className="space-y-4">
                              {/* UG Eligibility Criteria */}
                              {(job.min_ug_cgpa || job.min_tenth_percentage || job.min_twelfth_percentage || 
                                (job.max_active_backlogs !== null && job.max_active_backlogs !== undefined)) && (
                                <div>
                                  <p
                                    className={`text-sm font-medium mb-2 ${
                                      isDark ? "text-gray-400" : "text-gray-600"
                                    }`}
                                  >
                                    Eligibility Criteria
                                  </p>
                                  <div className="grid grid-cols-2 gap-3">
                                    {job.min_ug_cgpa && (
                                      <div>
                                        <p
                                          className={`text-xs ${
                                            isDark ? "text-gray-500" : "text-gray-500"
                                          }`}
                                        >
                                          Min CGPA
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
                              )}
                              
                              {/* UG Package Details */}
                              {(job.ug_package_min || job.ug_package_max || job.ug_stipend || job.description_ug) && (
                                <div>
                                  <p
                                    className={`text-sm font-medium mb-2 ${
                                      isDark ? "text-gray-400" : "text-gray-600"
                                    }`}
                                  >
                                    Package Details
                                  </p>
                                  <div className="grid grid-cols-2 gap-3">
                                    {(job.ug_package_min || job.ug_package_max) && (
                                      <div>
                                        <p
                                          className={`text-xs ${
                                            isDark ? "text-gray-500" : "text-gray-500"
                                          }`}
                                        >
                                          {job.ug_package_min === job.ug_package_max ? 'Package' : 'Package Range'}
                                        </p>
                                        <p
                                          className={`font-medium ${
                                            isDark ? "text-white" : "text-gray-900"
                                          }`}
                                        >
                                          {job.ug_package_min === job.ug_package_max 
                                            ? `₹${job.ug_package_min || 0} LPA`
                                            : `₹${job.ug_package_min || 0} - ₹${job.ug_package_max || 0} LPA`
                                          }
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
                                          Stipend
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
                                  </div>
                                  {job.description_ug && (
                                    <p
                                      className={`text-xs mt-2 ${
                                        isDark ? "text-gray-400" : "text-gray-600"
                                      }`}
                                    >
                                      {job.description_ug}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Show PG content if: tabs are shown and PG tab is active, OR no tabs and PG data exists */}
                          {((showTabs && (activeJobTab[job.id] || 'ug') === 'pg') || (!showTabs && hasPGData)) && (
                            <div className="space-y-4">
                              {/* PG Eligibility Criteria */}
                              {(job.min_pg_cgpa || job.min_tenth_percentage || job.min_twelfth_percentage || 
                                (job.max_active_backlogs !== null && job.max_active_backlogs !== undefined)) && (
                                <div>
                                  <p
                                    className={`text-sm font-medium mb-2 ${
                                      isDark ? "text-gray-400" : "text-gray-600"
                                    }`}
                                  >
                                    Eligibility Criteria
                                  </p>
                                  <div className="grid grid-cols-2 gap-3">
                                    {job.min_pg_cgpa && (
                                      <div>
                                        <p
                                          className={`text-xs ${
                                            isDark ? "text-gray-500" : "text-gray-500"
                                          }`}
                                        >
                                          Min CGPA
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
                              )}
                              
                              {/* PG Package Details */}
                              {(job.pg_package_min || job.pg_package_max || job.pg_stipend || job.description_pg) && (
                                <div>
                                  <p
                                    className={`text-sm font-medium mb-2 ${
                                      isDark ? "text-gray-400" : "text-gray-600"
                                    }`}
                                  >
                                    Package Details
                                  </p>
                                  <div className="grid grid-cols-2 gap-3">
                                    {(job.pg_package_min || job.pg_package_max) && (
                                      <div>
                                        <p
                                          className={`text-xs ${
                                            isDark ? "text-gray-500" : "text-gray-500"
                                          }`}
                                        >
                                          {job.pg_package_min === job.pg_package_max ? 'Package' : 'Package Range'}
                                        </p>
                                        <p
                                          className={`font-medium ${
                                            isDark ? "text-white" : "text-gray-900"
                                          }`}
                                        >
                                          {job.pg_package_min === job.pg_package_max 
                                            ? `₹${job.pg_package_min || 0} LPA`
                                            : `₹${job.pg_package_min || 0} - ₹${job.pg_package_max || 0} LPA`
                                          }
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
                                          Stipend
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
                                  {job.description_pg && (
                                    <p
                                      className={`text-xs mt-2 ${
                                        isDark ? "text-gray-400" : "text-gray-600"
                                      }`}
                                    >
                                      {job.description_pg}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          </div>
                        </div>
                      );
                    })()}

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
