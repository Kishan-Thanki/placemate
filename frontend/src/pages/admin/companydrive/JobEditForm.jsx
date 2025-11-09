import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout, PageContainer, Section } from '../../../components/layout';
import { Button, LoadingOverlay, RichTextEditor } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { ArrowLeft } from 'lucide-react';
import { companyDriveService, lookupService } from '../../../services';

// CSS to hide number input spin buttons
const numberInputStyle = `
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type="number"] {
    -moz-appearance: textfield;
  }
`;

export default function JobEditForm() {
  const navigate = useNavigate();
  const { driveId, jobId } = useParams();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [programs, setPrograms] = useState([]);
  const [error, setError] = useState('');

  // Helper function to process job_desc - returns null if empty
  const processJobDesc = (jobDesc) => {
    if (!jobDesc || typeof jobDesc !== 'object') {
      return null;
    }
    
    // Check if it's an empty document with just one empty paragraph
    if (jobDesc.type === 'doc' && 
        jobDesc.content && 
        jobDesc.content.length === 1 && 
        jobDesc.content[0].type === 'paragraph' &&
        (!jobDesc.content[0].content || jobDesc.content[0].content.length === 0)) {
      return null;
    }
    
    return jobDesc;
  };

  const [formData, setFormData] = useState({
    title: '',
    job_desc: { type: 'doc', content: [{ type: 'paragraph' }] },
    description_ug: '',
    description_pg: '',
    job_pdf: null,
    job_pdf_name: '',
    existing_job_pdf: '',
    min_ug_cgpa: '',
    min_pg_cgpa: '',
    min_tenth_percentage: '',
    min_twelfth_percentage: '',
    max_active_backlogs: '',
    ug_package_min: '',
    ug_package_max: '',
    pg_package_min: '',
    pg_package_max: '',
    ug_stipend: '',
    pg_stipend: '',
    eligible_programs: []
  });

  // Prevent arrow keys from changing number input values
  const handleNumberKeyDown = (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
    }
  };

  const handleFileChange = (file) => {
    if (file) {
      // Validate file type (PDF only)
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file only');
        return;
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('File size must be less than 5MB');
        return;
      }

      setFormData(prev => ({ 
        ...prev, 
        job_pdf: file, 
        job_pdf_name: file.name 
      }));
      setError('');
    }
  };

  const removeFile = () => {
    setFormData(prev => ({ 
      ...prev, 
      job_pdf: null, 
      job_pdf_name: '',
      existing_job_pdf: '' // Also clear existing file reference
    }));
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchPrograms(), fetchJobData()]);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const fetchPrograms = async () => {
    try {
      const response = await lookupService.getPrograms();
      const programsList = response?.data || response?.results || response || [];
      setPrograms(Array.isArray(programsList) ? programsList : []);
    } catch (err) {
      console.error('Error fetching programs:', err);
    }
  };

  const fetchJobData = async () => {
    try {
      setLoadingData(true);
      
      // Fetch jobs for the drive and find the specific job
      const response = await companyDriveService.getDriveJobs(driveId);
      const jobsData = response?.data || response || [];
      const job = jobsData.find(j => j.id === parseInt(jobId));

      if (!job) {
        setError('Job not found');
        setLoadingData(false);
        return;
      }

      // Extract program IDs from the job's eligible_programs
      const programIds = job.eligible_programs?.map(p => p.id) || [];

      setFormData({
        title: job.title || '',
        job_desc: job.job_desc || { type: 'doc', content: [{ type: 'paragraph' }] },
        description_ug: job.description_ug || '',
        description_pg: job.description_pg || '',
        job_pdf: null,
        job_pdf_name: '',
        existing_job_pdf: job.job_pdf || '',
        min_ug_cgpa: job.min_ug_cgpa || '',
        min_pg_cgpa: job.min_pg_cgpa || '',
        min_tenth_percentage: job.min_tenth_percentage || '',
        min_twelfth_percentage: job.min_twelfth_percentage || '',
        max_active_backlogs: job.max_active_backlogs || '',
        ug_package_min: job.ug_package_min || '',
        ug_package_max: job.ug_package_max || '',
        pg_package_min: job.pg_package_min || '',
        pg_package_max: job.pg_package_max || '',
        ug_stipend: job.ug_stipend || '',
        pg_stipend: job.pg_stipend || '',
        eligible_programs: programIds
      });
    } catch (err) {
      console.error('Error fetching job data:', err);
      setError('Failed to load job data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProgramToggle = (programId) => {
    const programIdNum = parseInt(programId);
    setFormData(prev => {
      const currentPrograms = prev.eligible_programs || [];
      if (currentPrograms.includes(programIdNum)) {
        return {
          ...prev,
          eligible_programs: currentPrograms.filter(id => id !== programIdNum)
        };
      } else {
        return {
          ...prev,
          eligible_programs: [...currentPrograms, programIdNum]
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Job title is required');
      return;
    }

    if (!formData.eligible_programs || formData.eligible_programs.length === 0) {
      setError('At least one eligible program is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const updateData = {
        company_drive: parseInt(driveId),
        title: formData.title.trim(),
        job_desc: processJobDesc(formData.job_desc),
        description_ug: formData.description_ug.trim() || null,
        description_pg: formData.description_pg.trim() || null,
        job_pdf: formData.job_pdf || null,
        min_ug_cgpa: formData.min_ug_cgpa ? parseFloat(formData.min_ug_cgpa) : null,
        min_pg_cgpa: formData.min_pg_cgpa ? parseFloat(formData.min_pg_cgpa) : null,
        min_tenth_percentage: formData.min_tenth_percentage ? parseFloat(formData.min_tenth_percentage) : null,
        min_twelfth_percentage: formData.min_twelfth_percentage ? parseFloat(formData.min_twelfth_percentage) : null,
        max_active_backlogs: formData.max_active_backlogs ? parseInt(formData.max_active_backlogs) : null,
        ug_package_min: formData.ug_package_min ? parseFloat(formData.ug_package_min) : null,
        ug_package_max: formData.ug_package_max ? parseFloat(formData.ug_package_max) : null,
        pg_package_min: formData.pg_package_min ? parseFloat(formData.pg_package_min) : null,
        pg_package_max: formData.pg_package_max ? parseFloat(formData.pg_package_max) : null,
        ug_stipend: formData.ug_stipend ? parseFloat(formData.ug_stipend) : null,
        pg_stipend: formData.pg_stipend ? parseFloat(formData.pg_stipend) : null,
        eligible_programs: formData.eligible_programs
      };

      console.log('Updating job:', jobId, updateData);

      await companyDriveService.updateJob(jobId, updateData);

      // Show success message
      const successMsg = document.createElement('div');
      successMsg.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
      }`;
      successMsg.textContent = 'Job updated successfully!';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);

      // Navigate back to drive details
      setTimeout(() => navigate(`/admin/drives/${driveId}`), 1000);
    } catch (err) {
      console.error('Error updating job:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update job');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <DashboardLayout title="Edit Job">
        <PageContainer>
          <LoadingOverlay message="Loading job data..." />
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit Job">
      <style>{numberInputStyle}</style>
      <PageContainer>
        <div className="mb-4">
          <Button onClick={() => navigate(`/admin/drives/${driveId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Drive Details
          </Button>
        </div>

        {error && (
          <div className={`mb-6 p-4 rounded-lg border ${
            isDark ? 'bg-red-900/20 border-red-900 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            <p className="font-medium">⚠️ {error}</p>
          </div>
        )}

        <Section>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Title */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="e.g., Software Engineer, Data Analyst"
              />
            </div>

            {/* Job Description */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                Job Description
              </label>
              <RichTextEditor
                value={formData.job_desc}
                onChange={(value) => handleChange('job_desc', value)}
                placeholder="Enter detailed job description, responsibilities, requirements, etc."
              />
            </div>

            {/* Job PDF Upload */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                Job Description PDF (Optional)
              </label>
              {formData.existing_job_pdf && !formData.job_pdf ? (
                <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
                }`}>
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <span className={`flex-1 text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                    Current: {formData.existing_job_pdf.split('/').pop()}
                  </span>
                  <a
                    href={formData.existing_job_pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                  >
                    View
                  </a>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ) : formData.job_pdf ? (
                <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
                }`}>
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <span className={`flex-1 text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                    {formData.job_pdf_name}
                  </span>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange(e.target.files[0])}
                    className="hidden"
                    id="job-pdf-upload"
                  />
                  <label
                    htmlFor="job-pdf-upload"
                    className={`flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      isDark 
                        ? 'border-gray-600 hover:border-gray-500 bg-gray-800 text-gray-300' 
                        : 'border-gray-300 hover:border-gray-400 bg-white text-gray-700'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Click to upload PDF</span>
                    <span className="text-xs opacity-70">(Max 5MB)</span>
                  </label>
                </div>
              )}
            </div>

            {/* Eligibility Criteria */}
            <div className="border-t pt-4">
              <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                Eligibility Criteria
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Min UG CGPA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={formData.min_ug_cgpa}
                    onChange={(e) => handleChange('min_ug_cgpa', e.target.value)}
                    onKeyDown={handleNumberKeyDown}
                    className={`w-full px-2 py-1 text-sm rounded border ${
                      isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                    }`}
                    placeholder="7.0"
                  />
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Min PG CGPA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={formData.min_pg_cgpa}
                    onChange={(e) => handleChange('min_pg_cgpa', e.target.value)}
                    onKeyDown={handleNumberKeyDown}
                    className={`w-full px-2 py-1 text-sm rounded border ${
                      isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                    }`}
                    placeholder="7.5"
                  />
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Min 10th %
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.min_tenth_percentage}
                    onChange={(e) => handleChange('min_tenth_percentage', e.target.value)}
                    onKeyDown={handleNumberKeyDown}
                    className={`w-full px-2 py-1 text-sm rounded border ${
                      isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                    }`}
                    placeholder="60"
                  />
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Min 12th %
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.min_twelfth_percentage}
                    onChange={(e) => handleChange('min_twelfth_percentage', e.target.value)}
                    onKeyDown={handleNumberKeyDown}
                    className={`w-full px-2 py-1 text-sm rounded border ${
                      isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                    }`}
                    placeholder="60"
                  />
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Max Backlogs
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.max_active_backlogs}
                    onChange={(e) => handleChange('max_active_backlogs', e.target.value)}
                    onKeyDown={handleNumberKeyDown}
                    className={`w-full px-2 py-1 text-sm rounded border ${
                      isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                    }`}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* UG Package Details */}
            <div className="border-t pt-4">
              <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                UG Package Details (in LPA)
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Package Min
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.ug_package_min}
                    onChange={(e) => handleChange('ug_package_min', e.target.value)}
                    onKeyDown={handleNumberKeyDown}
                    className={`w-full px-2 py-1 text-sm rounded border ${
                      isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                    }`}
                    placeholder="6.0"
                  />
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Package Max
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.ug_package_max}
                    onChange={(e) => handleChange('ug_package_max', e.target.value)}
                    onKeyDown={handleNumberKeyDown}
                    className={`w-full px-2 py-1 text-sm rounded border ${
                      isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                    }`}
                    placeholder="8.0"
                  />
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Stipend
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.ug_stipend}
                    onChange={(e) => handleChange('ug_stipend', e.target.value)}
                    onKeyDown={handleNumberKeyDown}
                    className={`w-full px-2 py-1 text-sm rounded border ${
                      isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                    }`}
                    placeholder="30000"
                  />
                </div>
              </div>
              <div className="mt-2">
                <textarea
                  value={formData.description_ug}
                  onChange={(e) => handleChange('description_ug', e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  rows="2"
                  placeholder="Additional details (e.g., benefits, bonuses, variable pay, etc.)"
                />
              </div>
            </div>

            {/* PG Package Details */}
            <div className="border-t pt-4">
              <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                PG Package Details (in LPA)
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Package Min
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pg_package_min}
                    onChange={(e) => handleChange('pg_package_min', e.target.value)}
                    onKeyDown={handleNumberKeyDown}
                    className={`w-full px-2 py-1 text-sm rounded border ${
                      isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                    }`}
                    placeholder="8.0"
                  />
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Package Max
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pg_package_max}
                    onChange={(e) => handleChange('pg_package_max', e.target.value)}
                    onKeyDown={handleNumberKeyDown}
                    className={`w-full px-2 py-1 text-sm rounded border ${
                      isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                    }`}
                    placeholder="12.0"
                  />
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Stipend
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pg_stipend}
                    onChange={(e) => handleChange('pg_stipend', e.target.value)}
                    onKeyDown={handleNumberKeyDown}
                    className={`w-full px-2 py-1 text-sm rounded border ${
                      isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                    }`}
                    placeholder="50000"
                  />
                </div>
              </div>
              <div className="mt-2">
                <textarea
                  value={formData.description_pg}
                  onChange={(e) => handleChange('description_pg', e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  rows="2"
                  placeholder="Additional details (e.g., benefits, bonuses, variable pay, etc.)"
                />
              </div>
            </div>

            {/* Eligible Programs */}
            <div className="border-t pt-4">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                Eligible Programs <span className="text-red-500">*</span>
              </label>
              <div className={`p-3 rounded-lg border max-h-48 overflow-y-auto ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
              }`}>
                {programs.length === 0 ? (
                  <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                    No programs available
                  </p>
                ) : (
                  programs.map((program) => {
                    const isChecked = formData.eligible_programs.includes(program.id);
                    
                    return (
                      <label 
                        key={program.id}
                        className={`flex items-center gap-2 py-1 cursor-pointer hover:${
                          isDark ? 'bg-gray-700' : 'bg-gray-50'
                        } px-2 rounded`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleProgramToggle(program.id)}
                          className="rounded"
                        />
                        <span className={isDark ? 'text-gray-200' : 'text-gray-900'}>
                          {program.name} ({program.abbreviation})
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => navigate(`/admin/drives/${driveId}`)}
                variant="secondary"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Updating...' : 'Update Job'}
              </Button>
            </div>
          </form>
        </Section>
      </PageContainer>
    </DashboardLayout>
  );
}
