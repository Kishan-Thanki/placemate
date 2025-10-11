import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const JobDriveForm = () => {
  const navigate = useNavigate();
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
      
      const completeDriveData = {
        ...basicDetails,
        jobs: jobs
      };
      
      // Drive created successfully
      
      localStorage.removeItem('driveBasicDetails');
      navigate('/registered-students');
    }
  };

  const handleBack = () => {
    navigate('/add-drive/basic-details');
  };

  return (
    <div className="job-drive-form">
      <h1>Add Drive</h1>
      <p className="subtitle">Add company drive in placement.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="job-details-section">
          <h2>Job Details</h2>
          
          {jobs.map((job, index) => (
            <div key={job.id} className="job-card">
              <div className="job-header">
                <h3 className="job-number">Job #{index + 1}</h3>
                {jobs.length > 1 && (
                  <button 
                    type="button"
                    className="remove-job-btn"
                    onClick={() => removeJob(job.id)}
                    title="Remove this job"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor={`job-title-${job.id}`}>Job Title *</label>
                <input
                  type="text"
                  id={`job-title-${job.id}`}
                  value={job.title}
                  onChange={(e) => updateJob(job.id, 'title', e.target.value)}
                  className={errors[`title-${job.id}`] ? 'error' : ''}
                  placeholder="Enter job title"
                />
                {errors[`title-${job.id}`] && (
                  <span className="error-message">{errors[`title-${job.id}`]}</span>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor={`job-description-${job.id}`}>Job Description *</label>
                <textarea
                  id={`job-description-${job.id}`}
                  value={job.description}
                  onChange={(e) => updateJob(job.id, 'description', e.target.value)}
                  className={errors[`description-${job.id}`] ? 'error' : ''}
                  rows="4"
                  placeholder="Enter job description"
                />
                {errors[`description-${job.id}`] && (
                  <span className="error-message">{errors[`description-${job.id}`]}</span>
                )}
              </div>
              
              {index < jobs.length - 1 && <hr className="divider" />}
            </div>
          ))}
          
          <button type="button" className="add-job-btn" onClick={addJob}>
            + Add Another Job
          </button>
          
          <hr className="section-divider" />
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleBack}>
              Back
            </button>
            <button type="submit" className="btn btn-primary">
              Create Drive
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default JobDriveForm;