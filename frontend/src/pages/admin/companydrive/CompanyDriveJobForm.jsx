import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout, PageContainer, Section } from '../../../components/layout';
import { Card, Button, LoadingOverlay, RichTextEditor } from '../../../components/ui';
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

export default function CompanyDriveJobForm() {
  const navigate = useNavigate();
  const { id: driveId } = useParams();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [programs, setPrograms] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);

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
  const [jobs, setJobs] = useState([
    {
      id: Date.now(),
      title: '',
      job_desc: { type: 'doc', content: [{ type: 'paragraph' }] },
      description_ug: '',
      description_pg: '',
      job_pdf: null,
      job_pdf_name: '',
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
    }
  ]);

  const [errors, setErrors] = useState({});

  // Prevent arrow keys from changing number input values
  const handleNumberKeyDown = (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
    }
  };

  useEffect(() => {
    fetchPrograms();
    
    // Check if we're in edit mode (adding jobs to existing drive) or create mode
    if (driveId) {
      setIsEditMode(true);
    }
  }, [driveId]);

  const fetchPrograms = async () => {
    try {
      setLoadingPrograms(true);
      const response = await lookupService.getPrograms();
      const programsList = response?.data || response?.results || response || [];
      setPrograms(Array.isArray(programsList) ? programsList : []);
    } catch (err) {
      console.error('Error fetching programs:', err);
    } finally {
      setLoadingPrograms(false);
    }
  };

  const addJob = () => {
    const newJob = {
      id: Date.now(),
      title: '',
      job_desc: { type: 'doc', content: [{ type: 'paragraph' }] },
      description_ug: '',
      description_pg: '',
      job_pdf: null,
      job_pdf_name: '',
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
    };
    setJobs([...jobs, newJob]);
  };

  const removeJob = (jobId) => {
    if (jobs.length > 1) {
      setJobs(jobs.filter(job => job.id !== jobId));
      const newErrors = { ...errors };
      Object.keys(newErrors).forEach(key => {
        if (key.endsWith(`-${jobId}`)) {
          delete newErrors[key];
        }
      });
      setErrors(newErrors);
    }
  };

  const updateJob = (jobId, field, value) => {
    setJobs(jobs.map(job => 
      job.id === jobId ? { ...job, [field]: value } : job
    ));
    
    if (errors[`${field}-${jobId}`]) {
      const newErrors = { ...errors };
      delete newErrors[`${field}-${jobId}`];
      setErrors(newErrors);
    }
  };

  const handleFileChange = (jobId, file) => {
    if (file) {
      // Validate file type (PDF only)
      if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file only');
        return;
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        return;
      }

      setJobs(jobs.map(job => 
        job.id === jobId 
          ? { ...job, job_pdf: file, job_pdf_name: file.name } 
          : job
      ));
    }
  };

  const removeFile = (jobId) => {
    setJobs(jobs.map(job => 
      job.id === jobId 
        ? { ...job, job_pdf: null, job_pdf_name: '' } 
        : job
    ));
  };

  const handleProgramToggle = (jobId, programId) => {
    setJobs(jobs.map(job => {
      if (job.id === jobId) {
        const currentPrograms = job.eligible_programs || [];
        const programIdNum = parseInt(programId);
        
        if (currentPrograms.includes(programIdNum)) {
          return {
            ...job,
            eligible_programs: currentPrograms.filter(id => id !== programIdNum)
          };
        } else {
          return {
            ...job,
            eligible_programs: [...currentPrograms, programIdNum]
          };
        }
      }
      return job;
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    jobs.forEach(job => {
      if (!job.title.trim()) {
        newErrors[`title-${job.id}`] = 'Job title is required';
      }
      if (!job.eligible_programs || job.eligible_programs.length === 0) {
        newErrors[`programs-${job.id}`] = 'At least one eligible program is required';
      }

      // Validate CGPA (0-10 range)
      if (job.min_ug_cgpa && (parseFloat(job.min_ug_cgpa) < 0 || parseFloat(job.min_ug_cgpa) > 10)) {
        newErrors[`min_ug_cgpa-${job.id}`] = 'CGPA must be between 0 and 10';
      }
      if (job.min_pg_cgpa && (parseFloat(job.min_pg_cgpa) < 0 || parseFloat(job.min_pg_cgpa) > 10)) {
        newErrors[`min_pg_cgpa-${job.id}`] = 'CGPA must be between 0 and 10';
      }

      // Validate percentages (0-100 range)
      if (job.min_tenth_percentage && (parseFloat(job.min_tenth_percentage) < 0 || parseFloat(job.min_tenth_percentage) > 100)) {
        newErrors[`min_tenth_percentage-${job.id}`] = 'Percentage must be between 0 and 100';
      }
      if (job.min_twelfth_percentage && (parseFloat(job.min_twelfth_percentage) < 0 || parseFloat(job.min_twelfth_percentage) > 100)) {
        newErrors[`min_twelfth_percentage-${job.id}`] = 'Percentage must be between 0 and 100';
      }

      // Validate backlogs (non-negative)
      if (job.max_active_backlogs && parseInt(job.max_active_backlogs) < 0) {
        newErrors[`max_active_backlogs-${job.id}`] = 'Backlogs cannot be negative';
      }

      // Validate packages (non-negative)
      if (job.ug_package_min && parseFloat(job.ug_package_min) < 0) {
        newErrors[`ug_package_min-${job.id}`] = 'Package cannot be negative';
      }
      if (job.ug_package_max && parseFloat(job.ug_package_max) < 0) {
        newErrors[`ug_package_max-${job.id}`] = 'Package cannot be negative';
      }
      if (job.pg_package_min && parseFloat(job.pg_package_min) < 0) {
        newErrors[`pg_package_min-${job.id}`] = 'Package cannot be negative';
      }
      if (job.pg_package_max && parseFloat(job.pg_package_max) < 0) {
        newErrors[`pg_package_max-${job.id}`] = 'Package cannot be negative';
      }
      if (job.ug_stipend && parseFloat(job.ug_stipend) < 0) {
        newErrors[`ug_stipend-${job.id}`] = 'Stipend cannot be negative';
      }
      if (job.pg_stipend && parseFloat(job.pg_stipend) < 0) {
        newErrors[`pg_stipend-${job.id}`] = 'Stipend cannot be negative';
      }

      // Validate package ranges
      if (job.ug_package_min && job.ug_package_max && parseFloat(job.ug_package_min) > parseFloat(job.ug_package_max)) {
        newErrors[`ug_package_max-${job.id}`] = 'Max package must be greater than min package';
      }
      if (job.pg_package_min && job.pg_package_max && parseFloat(job.pg_package_min) > parseFloat(job.pg_package_max)) {
        newErrors[`pg_package_max-${job.id}`] = 'Max package must be greater than min package';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Check if we're in edit mode (adding jobs to existing drive)
      if (isEditMode && driveId) {
        // Adding jobs to existing drive
        const jobsData = jobs.map(job => ({
          company_drive: parseInt(driveId),
          title: job.title.trim(),
          job_desc: processJobDesc(job.job_desc),
          description_ug: job.description_ug.trim() || null,
          description_pg: job.description_pg.trim() || null,
          job_pdf: job.job_pdf || null,
          min_ug_cgpa: job.min_ug_cgpa ? parseFloat(job.min_ug_cgpa) : null,
          min_pg_cgpa: job.min_pg_cgpa ? parseFloat(job.min_pg_cgpa) : null,
          min_tenth_percentage: job.min_tenth_percentage ? parseFloat(job.min_tenth_percentage) : null,
          min_twelfth_percentage: job.min_twelfth_percentage ? parseFloat(job.min_twelfth_percentage) : null,
          max_active_backlogs: job.max_active_backlogs ? parseInt(job.max_active_backlogs) : null,
          ug_package_min: job.ug_package_min ? parseFloat(job.ug_package_min) : null,
          ug_package_max: job.ug_package_max ? parseFloat(job.ug_package_max) : null,
          pg_package_min: job.pg_package_min ? parseFloat(job.pg_package_min) : null,
          pg_package_max: job.pg_package_max ? parseFloat(job.pg_package_max) : null,
          ug_stipend: job.ug_stipend ? parseFloat(job.ug_stipend) : null,
          pg_stipend: job.pg_stipend ? parseFloat(job.pg_stipend) : null,
          eligible_programs: job.eligible_programs || []
        }));

        console.log('Adding jobs to existing drive:', driveId, jobsData);

        // Create each job individually
        for (const jobData of jobsData) {
          await companyDriveService.createJob(jobData);
        }
        
        console.log('Jobs added successfully');

        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
        }`;
        successMsg.textContent = 'Jobs added successfully!';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);

        // Navigate to drive details page
        setTimeout(() => navigate(`/admin/drives/${driveId}`), 1000);
      } else {
        // Creating new drive with jobs (original flow)
        const basicDetails = JSON.parse(localStorage.getItem('companyDriveBasicDetails') || '{}');
        
        if (!basicDetails.company || !basicDetails.placement_drive) {
          alert('Missing basic drive details. Please start from the beginning.');
          navigate('/admin/drives/new');
          return;
        }

        // Check if any job has a PDF file
        const hasFiles = jobs.some(job => job.job_pdf);

        if (hasFiles) {
          // If there are files, create drive first without jobs, then add jobs with files individually
          const driveData = {
            ...basicDetails,
            jobs: [] // Empty jobs array initially
          };

          console.log('Creating company drive (files present, will add jobs separately):', driveData);
          
          const response = await companyDriveService.createDrive(driveData);
          const createdDrive = response?.data || response;
          const driveId = createdDrive?.id;
          
          console.log('Company drive created:', createdDrive);

          // Now add each job individually with file support
          for (const job of jobs) {
            const jobData = {
              company_drive: driveId,
              title: job.title.trim(),
              job_desc: processJobDesc(job.job_desc),
              description_ug: job.description_ug.trim() || null,
              description_pg: job.description_pg.trim() || null,
              job_pdf: job.job_pdf || null,
              min_ug_cgpa: job.min_ug_cgpa ? parseFloat(job.min_ug_cgpa) : null,
              min_pg_cgpa: job.min_pg_cgpa ? parseFloat(job.min_pg_cgpa) : null,
              min_tenth_percentage: job.min_tenth_percentage ? parseFloat(job.min_tenth_percentage) : null,
              min_twelfth_percentage: job.min_twelfth_percentage ? parseFloat(job.min_twelfth_percentage) : null,
              max_active_backlogs: job.max_active_backlogs ? parseInt(job.max_active_backlogs) : null,
              ug_package_min: job.ug_package_min ? parseFloat(job.ug_package_min) : null,
              ug_package_max: job.ug_package_max ? parseFloat(job.ug_package_max) : null,
              pg_package_min: job.pg_package_min ? parseFloat(job.pg_package_min) : null,
              pg_package_max: job.pg_package_max ? parseFloat(job.pg_package_max) : null,
              ug_stipend: job.ug_stipend ? parseFloat(job.ug_stipend) : null,
              pg_stipend: job.pg_stipend ? parseFloat(job.pg_stipend) : null,
              eligible_programs: job.eligible_programs || []
            };
            await companyDriveService.createJob(jobData);
          }
        } else {
          // No files, use the original approach (send jobs with drive creation)
          const jobsData = jobs.map(job => ({
            title: job.title.trim(),
            job_desc: processJobDesc(job.job_desc),
            description_ug: job.description_ug.trim() || null,
            description_pg: job.description_pg.trim() || null,
            min_ug_cgpa: job.min_ug_cgpa ? parseFloat(job.min_ug_cgpa) : null,
            min_pg_cgpa: job.min_pg_cgpa ? parseFloat(job.min_pg_cgpa) : null,
            min_tenth_percentage: job.min_tenth_percentage ? parseFloat(job.min_tenth_percentage) : null,
            min_twelfth_percentage: job.min_twelfth_percentage ? parseFloat(job.min_twelfth_percentage) : null,
            max_active_backlogs: job.max_active_backlogs ? parseInt(job.max_active_backlogs) : null,
            ug_package_min: job.ug_package_min ? parseFloat(job.ug_package_min) : null,
            ug_package_max: job.ug_package_max ? parseFloat(job.ug_package_max) : null,
            pg_package_min: job.pg_package_min ? parseFloat(job.pg_package_min) : null,
            pg_package_max: job.pg_package_max ? parseFloat(job.pg_package_max) : null,
            ug_stipend: job.ug_stipend ? parseFloat(job.ug_stipend) : null,
            pg_stipend: job.pg_stipend ? parseFloat(job.pg_stipend) : null,
            eligible_programs: job.eligible_programs || []
          }));

          const driveData = {
            ...basicDetails,
            jobs: jobsData
          };

          console.log('Creating company drive:', driveData);

          const response = await companyDriveService.createDrive(driveData);
          const createdDrive = response?.data || response;
          
          console.log('Company drive created:', createdDrive);
        }

        // Clear localStorage
        localStorage.removeItem('companyDriveBasicDetails');

        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
        }`;
        successMsg.textContent = 'Company drive created successfully!';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);

        // Navigate to drives list
        setTimeout(() => navigate('/admin/drives'), 1000);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.message || error.message || 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (isEditMode && driveId) {
      navigate(`/admin/drives/${driveId}`);
    } else {
      navigate('/admin/drives/new');
    }
  };

  if (loadingPrograms) {
    return (
      <DashboardLayout title="Add Job Details">
        <PageContainer>
          <LoadingOverlay message="Loading programs..." />
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Add Job Details">
      <style>{numberInputStyle}</style>
      <PageContainer>
        {/* Back Button */}
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={loading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Basic Details
          </Button>
        </div>

        {loading && <LoadingOverlay message="Creating company drive..." />}

        <Section>
          <Card className="p-6">
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm mb-6`}>
              Add job positions for this company drive. Each job can have different eligibility criteria and packages.
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
              {jobs.map((job, index) => (
                <Card key={job.id} className={`p-4 border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold`}>
                      Job #{index + 1}
                    </h3>
                    {jobs.length > 1 && (
                      <Button 
                        type="button"
                        variant="danger" 
                        size="sm" 
                        onClick={() => removeJob(job.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {/* Job Title */}
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        Job Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={job.title}
                        onChange={(e) => updateJob(job.id, 'title', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          errors[`title-${job.id}`] 
                            ? 'border-red-500' 
                            : isDark 
                            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                        placeholder="e.g., Software Engineer, Data Analyst"
                      />
                      {errors[`title-${job.id}`] && (
                        <span className="text-xs text-red-500">{errors[`title-${job.id}`]}</span>
                      )}
                    </div>

                    {/* Job Description */}
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        Job Description
                      </label>
                      <RichTextEditor
                        value={job.job_desc}
                        onChange={(value) => updateJob(job.id, 'job_desc', value)}
                        placeholder="Enter detailed job description, responsibilities, requirements, etc."
                      />
                    </div>

                    {/* Job PDF Upload */}
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        Job Description PDF (Optional)
                      </label>
                      {job.job_pdf ? (
                        <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                          isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
                        }`}>
                          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                          <span className={`flex-1 text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                            {job.job_pdf_name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFile(job.id)}
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
                            onChange={(e) => handleFileChange(job.id, e.target.files[0])}
                            className="hidden"
                            id={`job-pdf-${job.id}`}
                          />
                          <label
                            htmlFor={`job-pdf-${job.id}`}
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
                            value={job.min_ug_cgpa}
                            onChange={(e) => updateJob(job.id, 'min_ug_cgpa', e.target.value)}
                            onKeyDown={handleNumberKeyDown}
                            className={`w-full px-2 py-1 text-sm rounded border ${
                              errors[`min_ug_cgpa-${job.id}`]
                                ? 'border-red-500'
                                : isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                            }`}
                            placeholder="7.0"
                          />
                          {errors[`min_ug_cgpa-${job.id}`] && (
                            <span className="text-xs text-red-500">{errors[`min_ug_cgpa-${job.id}`]}</span>
                          )}
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
                            value={job.min_pg_cgpa}
                            onChange={(e) => updateJob(job.id, 'min_pg_cgpa', e.target.value)}
                            onKeyDown={handleNumberKeyDown}
                            className={`w-full px-2 py-1 text-sm rounded border ${
                              errors[`min_pg_cgpa-${job.id}`]
                                ? 'border-red-500'
                                : isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                            }`}
                            placeholder="7.5"
                          />
                          {errors[`min_pg_cgpa-${job.id}`] && (
                            <span className="text-xs text-red-500">{errors[`min_pg_cgpa-${job.id}`]}</span>
                          )}
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
                            value={job.min_tenth_percentage}
                            onChange={(e) => updateJob(job.id, 'min_tenth_percentage', e.target.value)}
                            onKeyDown={handleNumberKeyDown}
                            className={`w-full px-2 py-1 text-sm rounded border ${
                              errors[`min_tenth_percentage-${job.id}`]
                                ? 'border-red-500'
                                : isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                            }`}
                            placeholder="60"
                          />
                          {errors[`min_tenth_percentage-${job.id}`] && (
                            <span className="text-xs text-red-500">{errors[`min_tenth_percentage-${job.id}`]}</span>
                          )}
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
                            value={job.min_twelfth_percentage}
                            onChange={(e) => updateJob(job.id, 'min_twelfth_percentage', e.target.value)}
                            onKeyDown={handleNumberKeyDown}
                            className={`w-full px-2 py-1 text-sm rounded border ${
                              errors[`min_twelfth_percentage-${job.id}`]
                                ? 'border-red-500'
                                : isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                            }`}
                            placeholder="60"
                          />
                          {errors[`min_twelfth_percentage-${job.id}`] && (
                            <span className="text-xs text-red-500">{errors[`min_twelfth_percentage-${job.id}`]}</span>
                          )}
                        </div>
                        <div>
                          <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Max Backlogs
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={job.max_active_backlogs}
                            onChange={(e) => updateJob(job.id, 'max_active_backlogs', e.target.value)}
                            onKeyDown={handleNumberKeyDown}
                            className={`w-full px-2 py-1 text-sm rounded border ${
                              errors[`max_active_backlogs-${job.id}`]
                                ? 'border-red-500'
                                : isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                            }`}
                            placeholder="0"
                          />
                          {errors[`max_active_backlogs-${job.id}`] && (
                            <span className="text-xs text-red-500">{errors[`max_active_backlogs-${job.id}`]}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Package Details */}
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
                            value={job.ug_package_min}
                            onChange={(e) => updateJob(job.id, 'ug_package_min', e.target.value)}
                            onKeyDown={handleNumberKeyDown}
                            className={`w-full px-2 py-1 text-sm rounded border ${
                              errors[`ug_package_min-${job.id}`]
                                ? 'border-red-500'
                                : isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                            }`}
                            placeholder="6.0"
                          />
                          {errors[`ug_package_min-${job.id}`] && (
                            <span className="text-xs text-red-500">{errors[`ug_package_min-${job.id}`]}</span>
                          )}
                        </div>
                        <div>
                          <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Package Max
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={job.ug_package_max}
                            onChange={(e) => updateJob(job.id, 'ug_package_max', e.target.value)}
                            onKeyDown={handleNumberKeyDown}
                            className={`w-full px-2 py-1 text-sm rounded border ${
                              errors[`ug_package_max-${job.id}`]
                                ? 'border-red-500'
                                : isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                            }`}
                            placeholder="8.0"
                          />
                          {errors[`ug_package_max-${job.id}`] && (
                            <span className="text-xs text-red-500">{errors[`ug_package_max-${job.id}`]}</span>
                          )}
                        </div>
                        <div>
                          <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Stipend
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={job.ug_stipend}
                            onChange={(e) => updateJob(job.id, 'ug_stipend', e.target.value)}
                            onKeyDown={handleNumberKeyDown}
                            className={`w-full px-2 py-1 text-sm rounded border ${
                              errors[`ug_stipend-${job.id}`]
                                ? 'border-red-500'
                                : isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                            }`}
                            placeholder="30000"
                          />
                          {errors[`ug_stipend-${job.id}`] && (
                            <span className="text-xs text-red-500">{errors[`ug_stipend-${job.id}`]}</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2">
                        <textarea
                          value={job.description_ug}
                          onChange={(e) => updateJob(job.id, 'description_ug', e.target.value)}
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
                            value={job.pg_package_min}
                            onChange={(e) => updateJob(job.id, 'pg_package_min', e.target.value)}
                            onKeyDown={handleNumberKeyDown}
                            className={`w-full px-2 py-1 text-sm rounded border ${
                              errors[`pg_package_min-${job.id}`]
                                ? 'border-red-500'
                                : isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                            }`}
                            placeholder="8.0"
                          />
                          {errors[`pg_package_min-${job.id}`] && (
                            <span className="text-xs text-red-500">{errors[`pg_package_min-${job.id}`]}</span>
                          )}
                        </div>
                        <div>
                          <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Package Max
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={job.pg_package_max}
                            onChange={(e) => updateJob(job.id, 'pg_package_max', e.target.value)}
                            onKeyDown={handleNumberKeyDown}
                            className={`w-full px-2 py-1 text-sm rounded border ${
                              errors[`pg_package_max-${job.id}`]
                                ? 'border-red-500'
                                : isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                            }`}
                            placeholder="12.0"
                          />
                          {errors[`pg_package_max-${job.id}`] && (
                            <span className="text-xs text-red-500">{errors[`pg_package_max-${job.id}`]}</span>
                          )}
                        </div>
                        <div>
                          <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Stipend
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={job.pg_stipend}
                            onChange={(e) => updateJob(job.id, 'pg_stipend', e.target.value)}
                            onKeyDown={handleNumberKeyDown}
                            className={`w-full px-2 py-1 text-sm rounded border ${
                              errors[`pg_stipend-${job.id}`]
                                ? 'border-red-500'
                                : isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                            }`}
                            placeholder="50000"
                          />
                          {errors[`pg_stipend-${job.id}`] && (
                            <span className="text-xs text-red-500">{errors[`pg_stipend-${job.id}`]}</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2">
                        <textarea
                          value={job.description_pg}
                          onChange={(e) => updateJob(job.id, 'description_pg', e.target.value)}
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
                            const isChecked = (job.eligible_programs || []).includes(program.id);
                            
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
                                  onChange={() => handleProgramToggle(job.id, program.id)}
                                  className="rounded"
                                />
                                <span className={isDark ? 'text-gray-200' : 'text-gray-900'}>
                                  {program.name} ({program.abbreviation})
                                  {program.degree && ` - ${program.degree.name}`}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>
                      {errors[`programs-${job.id}`] && (
                        <span className="text-xs text-red-500">{errors[`programs-${job.id}`]}</span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              <div className="flex items-center justify-between">
                <Button type="button" variant="outline" onClick={addJob} disabled={loading}>
                  + Add Another Job
                </Button>
                <div className="flex gap-3">
                  <Button type="button" variant="secondary" onClick={handleBack} disabled={loading}>
                    Back
                  </Button>
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading 
                      ? (isEditMode ? 'Adding Jobs...' : 'Creating Drive...') 
                      : (isEditMode ? 'Add Jobs' : 'Create Company Drive')
                    }
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </Section>
      </PageContainer>
    </DashboardLayout>
  );
}
