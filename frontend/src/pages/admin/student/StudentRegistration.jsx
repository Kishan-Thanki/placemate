import React, { useState } from 'react';
import { DashboardLayout, PageContainer, Section } from '../../../components/layout';
import { Button, Card } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';

export function StudentRegistration() {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    firstName: '', middleName: '', lastName: '', email: '', phone: '', dateOfBirth: '', gender: '',
    enrollmentNo: '', address: '', joiningYear: '', currentCGPA: '', course: '', placementStatus: '',
    graduationStatus: '', companyPlacedIn: '', jobRole: '', package: ''
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
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
    if (!validateForm()) return;
    console.log('Form submitted:', formData);
    alert('Student registered successfully!');
    setFormData({
      firstName: '', middleName: '', lastName: '', email: '', phone: '', dateOfBirth: '', gender: '',
      enrollmentNo: '', address: '', joiningYear: '', currentCGPA: '', course: '', placementStatus: '',
      graduationStatus: '', companyPlacedIn: '', jobRole: '', package: ''
    });
  };

  return (
    <DashboardLayout title="Student Manual Registrations">
      <PageContainer>
        <Section description="Add student details">
          <Card className="p-6">
            <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={handleSubmit}>
              <Input label="First Name" required value={formData.firstName} onChange={(v) => handleInputChange('firstName', v)} error={errors.firstName} />
              <Input label="Middle Name" value={formData.middleName} onChange={(v) => handleInputChange('middleName', v)} />
              <Input label="Last Name" required value={formData.lastName} onChange={(v) => handleInputChange('lastName', v)} error={errors.lastName} />

              <Input label="Email" type="email" required value={formData.email} onChange={(v) => handleInputChange('email', v)} error={errors.email} />
              <Input label="Phone Number" required value={formData.phone} onChange={(v) => handleInputChange('phone', v)} error={errors.phone} />
              <Input label="Date of Birth" type="date" required value={formData.dateOfBirth} onChange={(v) => handleInputChange('dateOfBirth', v)} error={errors.dateOfBirth} />

              <Select label="Gender" required options={["Male", "Female", "Other"]} value={formData.gender} onChange={(v) => handleInputChange('gender', v)} error={errors.gender} />
              <Input label="Enrollment No." required value={formData.enrollmentNo} onChange={(v) => handleInputChange('enrollmentNo', v)} error={errors.enrollmentNo} />
              <div className="md:col-span-3">
                <Textarea label="Address" value={formData.address} onChange={(v) => handleInputChange('address', v)} />
              </div>

              <Input label="Joining Year" required value={formData.joiningYear} onChange={(v) => handleInputChange('joiningYear', v)} error={errors.joiningYear} />
              <Input label="Current CGPA" value={formData.currentCGPA} onChange={(v) => handleInputChange('currentCGPA', v)} />
              <Select label="Course" required options={["B.Tech", "M.Tech", "MBA"]} value={formData.course} onChange={(v) => handleInputChange('course', v)} error={errors.course} />

              <Select label="Placement Status" required options={["Placed", "Not Placed"]} value={formData.placementStatus} onChange={(v) => handleInputChange('placementStatus', v)} error={errors.placementStatus} />
              <Select label="Graduation Status" required options={["Graduated", "Ongoing"]} value={formData.graduationStatus} onChange={(v) => handleInputChange('graduationStatus', v)} error={errors.graduationStatus} />
              <div />

              <Input label="Company Placed In" value={formData.companyPlacedIn} onChange={(v) => handleInputChange('companyPlacedIn', v)} />
              <Input label="Job Role" value={formData.jobRole} onChange={(v) => handleInputChange('jobRole', v)} />
              <Input label="Package (LPA)" value={formData.package} onChange={(v) => handleInputChange('package', v)} />

              <div className="md:col-span-3 flex justify-center mt-6">
                <Button type="submit" variant="primary">Register Student</Button>
              </div>
            </form>
          </Card>
        </Section>
      </PageContainer>
    </DashboardLayout>
  );
}

function Label({ children, required }) {
  return (
    <label className="block text-sm font-medium mb-1">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

function Input({ label, required, type = 'text', value, onChange, error }) {
  const { isDark } = useTheme();
  return (
    <div>
      <Label required={required}>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} ${error ? 'border-red-500' : ''}`}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

function Textarea({ label, value, onChange }) {
  const { isDark } = useTheme();
  return (
    <div>
      <Label>{label}</Label>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
      />
    </div>
  );
}

function Select({ label, required, options, value, onChange, error }) {
  const { isDark } = useTheme();
  return (
    <div>
      <Label required={required}>{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} ${error ? 'border-red-500' : ''}`}
      >
        <option value="">Select {label}</option>
        {options.map((opt, i) => (
          <option key={i} value={opt}>{opt}</option>
        ))}
      </select>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
