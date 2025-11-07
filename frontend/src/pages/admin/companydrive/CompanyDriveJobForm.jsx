import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout, PageContainer, Section } from '../../../components/layout';
import { Card, Button, LoadingOverlay } from '../../../components/ui';
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
  const [jobs, setJobs] = useState([
    {
      id: Date.now(),
      title: '',
      description_ug: '',
      description_pg: '',
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
      description_ug: '',
      description_pg: '',
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

        // Prepare jobs data
        const jobsData = jobs.map(job => ({
          title: job.title.trim(),
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

        // Combine with basic details
        const driveData = {
          ...basicDetails,
          jobs: jobsData
        };

        console.log('Creating company drive:', driveData);

        const response = await companyDriveService.createDrive(driveData);
        const createdDrive = response?.data || response;
        
        console.log('Company drive created:', createdDrive);

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

                    {/* Job Descriptions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          UG Description
                        </label>
                        <textarea
                          value={job.description_ug}
                          onChange={(e) => updateJob(job.id, 'description_ug', e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDark 
                              ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                          rows="3"
                          placeholder="Job description for UG students"
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          PG Description
                        </label>
                        <textarea
                          value={job.description_pg}
                          onChange={(e) => updateJob(job.id, 'description_pg', e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDark 
                              ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                          rows="3"
                          placeholder="Job description for PG students"
                        />
                      </div>
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
                            value={job.min_ug_cgpa}
                            onChange={(e) => updateJob(job.id, 'min_ug_cgpa', e.target.value)}
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
                            value={job.min_pg_cgpa}
                            onChange={(e) => updateJob(job.id, 'min_pg_cgpa', e.target.value)}
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
                            value={job.min_tenth_percentage}
                            onChange={(e) => updateJob(job.id, 'min_tenth_percentage', e.target.value)}
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
                            value={job.min_twelfth_percentage}
                            onChange={(e) => updateJob(job.id, 'min_twelfth_percentage', e.target.value)}
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
                            value={job.max_active_backlogs}
                            onChange={(e) => updateJob(job.id, 'max_active_backlogs', e.target.value)}
                            onKeyDown={handleNumberKeyDown}
                            className={`w-full px-2 py-1 text-sm rounded border ${
                              isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                            }`}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Package Details */}
                    <div className="border-t pt-4">
                      <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        Package Details (in LPA)
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            UG Package Min
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={job.ug_package_min}
                            onChange={(e) => updateJob(job.id, 'ug_package_min', e.target.value)}
                            onKeyDown={handleNumberKeyDown}
                            className={`w-full px-2 py-1 text-sm rounded border ${
                              isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                            }`}
                            placeholder="6.0"
                          />
                        </div>
                        <div>
                          <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            UG Package Max
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={job.ug_package_max}
                            onChange={(e) => updateJob(job.id, 'ug_package_max', e.target.value)}
                            onKeyDown={handleNumberKeyDown}
                            className={`w-full px-2 py-1 text-sm rounded border ${
                              isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                            }`}
                            placeholder="8.0"
                          />
                        </div>
                        <div>
                          <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            UG Stipend
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={job.ug_stipend}
                            onChange={(e) => updateJob(job.id, 'ug_stipend', e.target.value)}
                            onKeyDown={handleNumberKeyDown}
                            className={`w-full px-2 py-1 text-sm rounded border ${
                              isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                            }`}
                            placeholder="30000"
                          />
                        </div>
                        <div>
                          <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            PG Package Min
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={job.pg_package_min}
                            onChange={(e) => updateJob(job.id, 'pg_package_min', e.target.value)}
                            onKeyDown={handleNumberKeyDown}
                            className={`w-full px-2 py-1 text-sm rounded border ${
                              isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                            }`}
                            placeholder="8.0"
                          />
                        </div>
                        <div>
                          <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            PG Package Max
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={job.pg_package_max}
                            onChange={(e) => updateJob(job.id, 'pg_package_max', e.target.value)}
                            onKeyDown={handleNumberKeyDown}
                            className={`w-full px-2 py-1 text-sm rounded border ${
                              isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                            }`}
                            placeholder="12.0"
                          />
                        </div>
                        <div>
                          <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            PG Stipend
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={job.pg_stipend}
                            onChange={(e) => updateJob(job.id, 'pg_stipend', e.target.value)}
                            onKeyDown={handleNumberKeyDown}
                            className={`w-full px-2 py-1 text-sm rounded border ${
                              isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                            }`}
                            placeholder="50000"
                          />
                        </div>
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
                    {loading ? 'Creating Drive...' : 'Create Company Drive'}
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
