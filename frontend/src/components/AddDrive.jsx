import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AddDrive() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    company: '',
    driveName: '',
    jobType: '',
    jobMode: '',
    minCGPA: '',
    eligibleCourses: '',
    requiredSkills: '',
    postingLocations: '',
    min10thPercentage: '',
    min12thPercentage: '',
    minDiplomaPercentage: '',
    minUGCGPA: ''
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.company.trim()) newErrors.company = 'Company is required';
    if (!formData.driveName.trim()) newErrors.driveName = 'Drive name is required';
    if (!formData.jobType.trim()) newErrors.jobType = 'Job type is required';
    if (!formData.jobMode.trim()) newErrors.jobMode = 'Job mode is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      localStorage.setItem('driveBasicDetails', JSON.stringify(formData));
      navigate('/add-drive/job-details');
    }
  };

  const handleCancel = () => {
    navigate('/registered-students');
  };

  return (
    <div className="add-drive-page">
      <div className="header">
        <h2>Add Drive</h2>
        <p>Add company drive in placemate.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <section className="form-card">
            <h3 className="section-title">Basic Drive Details</h3>
            <div className="form-grid">
              <Select 
                label="Company" 
                required 
                options={["Google", "Microsoft", "TCS", "Infosys"]} 
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                error={errors.company}
              />
              <Input 
                label="Drive Name" 
                required 
                placeholder="e.g., Software Development Internship 2024" 
                value={formData.driveName}
                onChange={(e) => handleInputChange('driveName', e.target.value)}
                error={errors.driveName}
              />
              <Select 
                label="Job Type" 
                required 
                options={["Internship", "Full-time", "Contract"]} 
                value={formData.jobType}
                onChange={(e) => handleInputChange('jobType', e.target.value)}
                error={errors.jobType}
              />
              <Select 
                label="Job Mode" 
                required 
                options={["On-site", "Hybrid", "Remote"]} 
                value={formData.jobMode}
                onChange={(e) => handleInputChange('jobMode', e.target.value)}
                error={errors.jobMode}
              />
              <Input 
                label="Minimum CGPA" 
                placeholder="e.g., 7.5" 
                value={formData.minCGPA}
                onChange={(e) => handleInputChange('minCGPA', e.target.value)}
              />
              <Input 
                label="Eligible Courses" 
                placeholder="Type to filter courses and select eligible courses" 
                value={formData.eligibleCourses}
                onChange={(e) => handleInputChange('eligibleCourses', e.target.value)}
              />
              <Input 
                label="Required Skills" 
                placeholder="Type to filter skills and select required skills" 
                value={formData.requiredSkills}
                onChange={(e) => handleInputChange('requiredSkills', e.target.value)}
              />
              <Input 
                label="Posting Locations" 
                placeholder="Type to filter cities and select posting locations" 
                value={formData.postingLocations}
                onChange={(e) => handleInputChange('postingLocations', e.target.value)}
              />
            </div>
          </section>

          <section className="form-card">
            <h3 className="section-title">Academic Eligibility Criteria</h3>
            <div className="form-grid">
              <Input 
                label="Minimum 10th Percentage" 
                placeholder="e.g., 60" 
                value={formData.min10thPercentage}
                onChange={(e) => handleInputChange('min10thPercentage', e.target.value)}
              />
              <Input 
                label="Minimum 12th Percentage" 
                placeholder="e.g., 60" 
                value={formData.min12thPercentage}
                onChange={(e) => handleInputChange('min12thPercentage', e.target.value)}
              />
              <Input 
                label="Minimum Diploma Percentage" 
                placeholder="e.g., 60" 
                value={formData.minDiplomaPercentage}
                onChange={(e) => handleInputChange('minDiplomaPercentage', e.target.value)}
              />
              <Input 
                label="Minimum UG CGPA" 
                placeholder="e.g., 7.5 or 75" 
                value={formData.minUGCGPA}
                onChange={(e) => handleInputChange('minUGCGPA', e.target.value)}
              />
            </div>
          </section>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={handleCancel}>Cancel</button>
            <button type="submit" className="next-btn">Next</button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Input({ label, placeholder, required, type = "text", value, onChange, error }) {
  return (
    <div className="form-field">
      <label>
        {label} {required && <span className="required">*</span>}
      </label>
      <input 
        type={type} 
        placeholder={placeholder} 
        value={value}
        onChange={onChange}
        className={error ? 'error' : ''}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  );
}

function Select({ label, required, options, value, onChange, error }) {
  return (
    <div className="form-field">
      <label>
        {label} {required && <span className="required">*</span>}
      </label>
      <select 
        value={value}
        onChange={onChange}
        className={error ? 'error' : ''}
      >
        <option value="">Select {label}</option>
        {options.map((opt, i) => (
          <option key={i} value={opt}>{opt}</option>
        ))}
      </select>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
}
