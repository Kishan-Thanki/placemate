import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout, PageContainer, Section } from '../../components/layout';
import { Card, Button } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';

const JobDriveForm = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [jobs, setJobs] = useState([
    {
      id: 1,
      title: '',
      description: ''
    }
  ]);

  const [errors, setErrors] = useState({});

  const addJob = () => {
    const newJob = {
      id: Date.now(),
      title: '',
      description: ''
    };
    setJobs([...jobs, newJob]);
  };

  const removeJob = (jobId) => {
    if (jobs.length > 1) {
      setJobs(jobs.filter(job => job.id !== jobId));
      const newErrors = { ...errors };
      delete newErrors[`title-${jobId}`];
      delete newErrors[`description-${jobId}`];
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

  const validateForm = () => {
    const newErrors = {};
    
    jobs.forEach(job => {
      if (!job.title.trim()) {
        newErrors[`title-${job.id}`] = 'Job title is required';
      }
      if (!job.description.trim()) {
        newErrors[`description-${job.id}`] = 'Job description is required';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      const basicDetails = JSON.parse(localStorage.getItem('driveBasicDetails') || '{}');
      
      // Drive data prepared for submission
      // TODO: Submit driveData to backend API
      console.log('Drive data:', { ...basicDetails, jobs });
      
      // Drive created successfully
      
      localStorage.removeItem('driveBasicDetails');
      navigate('/admin/students');
    }
  };

  const handleBack = () => {
    navigate('/admin/drives/new');
  };

  return (
    <DashboardLayout title="Add Drive - Job Details">
      <PageContainer>
        <Section>
          <Card className="p-6">
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm mb-6`}>Add company drive in placement.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
              {jobs.map((job, index) => (
                <Card key={job.id} className={`p-4 ${index < jobs.length - 1 ? 'mb-2' : ''}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold`}>Job #{index + 1}</h3>
                    {jobs.length > 1 && (
                      <Button variant="danger" size="sm" onClick={() => removeJob(job.id)} title="Remove this job">Remove</Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor={`job-title-${job.id}`} className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Job Title <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        id={`job-title-${job.id}`}
                        value={job.title}
                        onChange={(e) => updateJob(job.id, 'title', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${errors[`title-${job.id}`] ? 'border-red-500' : isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                        placeholder="Enter job title"
                      />
                      {errors[`title-${job.id}`] && (
                        <span className="text-xs text-red-500">{errors[`title-${job.id}`]}</span>
                      )}
                    </div>
                    <div>
                      <label htmlFor={`job-description-${job.id}`} className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Job Description <span className="text-red-500">*</span></label>
                      <textarea
                        id={`job-description-${job.id}`}
                        value={job.description}
                        onChange={(e) => updateJob(job.id, 'description', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${errors[`description-${job.id}`] ? 'border-red-500' : isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                        rows="4"
                        placeholder="Enter job description"
                      />
                      {errors[`description-${job.id}`] && (
                        <span className="text-xs text-red-500">{errors[`description-${job.id}`]}</span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={addJob}>+ Add Another Job</Button>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={handleBack}>Back</Button>
                  <Button variant="primary" type="submit">Create Drive</Button>
                </div>
              </div>
            </form>
          </Card>
        </Section>
      </PageContainer>
    </DashboardLayout>
  );
};

export default JobDriveForm;