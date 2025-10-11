import React, { useState } from "react";

export default function StudentRegistration() {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    enrollmentNo: '',
    address: '',
    joiningYear: '',
    currentCGPA: '',
    course: '',
    placementStatus: '',
    graduationStatus: '',
    companyPlacedIn: '',
    jobRole: '',
    package: ''
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
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.enrollmentNo.trim()) newErrors.enrollmentNo = 'Enrollment number is required';
    if (!formData.joiningYear.trim()) newErrors.joiningYear = 'Joining year is required';
    if (!formData.course) newErrors.course = 'Course is required';
    if (!formData.placementStatus) newErrors.placementStatus = 'Placement status is required';
    if (!formData.graduationStatus) newErrors.graduationStatus = 'Graduation status is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setFormData({
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        enrollmentNo: '',
        address: '',
        joiningYear: '',
        currentCGPA: '',
        course: '',
        placementStatus: '',
        graduationStatus: '',
        companyPlacedIn: '',
        jobRole: '',
        package: ''
      });
    }
  };
  return (
    <div className="registration-form">
      <h2>Student Manual Registrations</h2>
      <p>Add student details</p>

      <div className="form-section">
        <h3>Student Information</h3>
        <p>
          Enter student details to register them in the portal.
        </p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <Input 
            label="First Name" 
            required 
            placeholder="Enter first name" 
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            error={errors.firstName}
          />
          <Input 
            label="Middle Name" 
            placeholder="Enter middle name" 
            value={formData.middleName}
            onChange={(e) => handleInputChange('middleName', e.target.value)}
          />
          <Input 
            label="Last Name" 
            required 
            placeholder="Enter last name" 
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            error={errors.lastName}
          />
          <Input 
            label="Email" 
            required 
            placeholder="example@college.com" 
            type="email" 
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={errors.email}
          />
          <Input 
            label="Phone Number" 
            required 
            placeholder="+1 (555) 123-4567" 
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            error={errors.phone}
          />
          <Input 
            label="Date of Birth" 
            required 
            type="date" 
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
            error={errors.dateOfBirth}
          />
          <Select 
            label="Gender" 
            required 
            options={["Male", "Female", "Other"]} 
            value={formData.gender}
            onChange={(e) => handleInputChange('gender', e.target.value)}
            error={errors.gender}
          />
          <Input 
            label="Enrollment No." 
            required 
            placeholder="2021BTECHCSE001" 
            value={formData.enrollmentNo}
            onChange={(e) => handleInputChange('enrollmentNo', e.target.value)}
            error={errors.enrollmentNo}
          />
          <Textarea 
            label="Address" 
            placeholder="Enter full address" 
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
          />
          <Input 
            label="Joining Year" 
            required 
            placeholder="e.g., 2021" 
            value={formData.joiningYear}
            onChange={(e) => handleInputChange('joiningYear', e.target.value)}
            error={errors.joiningYear}
          />
          <Input 
            label="Current CGPA" 
            placeholder="e.g., 8.5" 
            value={formData.currentCGPA}
            onChange={(e) => handleInputChange('currentCGPA', e.target.value)}
          />
          <Select 
            label="Course" 
            required 
            options={["B.Tech", "M.Tech", "MBA"]} 
            value={formData.course}
            onChange={(e) => handleInputChange('course', e.target.value)}
            error={errors.course}
          />
          <Select 
            label="Placement Status" 
            required 
            options={["Placed", "Not Placed"]} 
            value={formData.placementStatus}
            onChange={(e) => handleInputChange('placementStatus', e.target.value)}
            error={errors.placementStatus}
          />
          <Select 
            label="Graduation Status" 
            required 
            options={["Graduated", "Ongoing"]} 
            value={formData.graduationStatus}
            onChange={(e) => handleInputChange('graduationStatus', e.target.value)}
            error={errors.graduationStatus}
          />
          <Input 
            label="Company Placed In" 
            placeholder="e.g., Google" 
            value={formData.companyPlacedIn}
            onChange={(e) => handleInputChange('companyPlacedIn', e.target.value)}
          />
          <Input 
            label="Job Role" 
            placeholder="e.g., Software Engineer" 
            value={formData.jobRole}
            onChange={(e) => handleInputChange('jobRole', e.target.value)}
          />
          <Input 
            label="Package (LPA)" 
            placeholder="e.g., 12.5" 
            value={formData.package}
            onChange={(e) => handleInputChange('package', e.target.value)}
          />
          
          <div style={{ textAlign: 'center', marginTop: '2.5rem', gridColumn: 'span 3' }}>
            <button type="submit">
              Register Student
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({ label, placeholder, required, type = "text", value, onChange, error }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{ 
          borderColor: error ? '#ef4444' : '#d1d5db',
          borderWidth: '1px',
          borderStyle: 'solid'
        }}
      />
      {error && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{error}</span>}
    </div>
  );
}

function Textarea({ label, placeholder, value, onChange }) {
  return (
    <div className="textarea-full">
      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>{label}</label>
      <textarea
        rows={2}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      ></textarea>
    </div>
  );
}

function Select({ label, required, options, value, onChange, error }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <select
        value={value}
        onChange={onChange}
        style={{ 
          borderColor: error ? '#ef4444' : '#d1d5db',
          borderWidth: '1px',
          borderStyle: 'solid'
        }}
      >
        <option value="">Select {label}</option>
        {options.map((opt, i) => (
          <option key={i} value={opt}>{opt}</option>
        ))}
      </select>
      {error && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{error}</span>}
    </div>
  );
}
