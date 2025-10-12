import React, { useState } from "react";
import { Section } from "./layout";
import { Card, Button } from "./ui";
import { useTheme } from "../contexts/ThemeContext";
import { useNavigate } from 'react-router-dom';

export default function AddDrive() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    company: "",
    name: "",
    jobType: "",
    jobMode: "",
    minCgpa: "",
    courses: "",
    skills: "",
    locations: "",
    min10: "",
    min12: "",
    minDiploma: "",
    minUgCgpa: "",
  });

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-6">
      <Section title="Basic Drive Details">
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select label="Company" required value={form.company} onChange={(v) => update("company", v)} options={["Google", "Microsoft", "TCS", "Infosys"]} />
            <Input label="Drive Name" required value={form.name} onChange={(v) => update("name", v)} placeholder="e.g., Software Development Internship 2024" />
            <Select label="Job Type" required value={form.jobType} onChange={(v) => update("jobType", v)} options={["Internship", "Full-time", "Contract"]} />
            <Select label="Job Mode" required value={form.jobMode} onChange={(v) => update("jobMode", v)} options={["On-site", "Hybrid", "Remote"]} />
            <Input label="Minimum CGPA" value={form.minCgpa} onChange={(v) => update("minCgpa", v)} placeholder="e.g., 7.5" />
            <Input label="Eligible Courses" value={form.courses} onChange={(v) => update("courses", v)} placeholder="Type to filter courses and select eligible courses" />
            <Input label="Required Skills" value={form.skills} onChange={(v) => update("skills", v)} placeholder="Type to filter skills and select required skills" />
            <Input label="Posting Locations" value={form.locations} onChange={(v) => update("locations", v)} placeholder="Type to filter cities and select posting locations" />
          </div>
        </Card>
      </Section>

      <Section title="Academic Eligibility Criteria">
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input label="Minimum 10th Percentage" value={form.min10} onChange={(v) => update("min10", v)} placeholder="e.g., 60" />
            <Input label="Minimum 12th Percentage" value={form.min12} onChange={(v) => update("min12", v)} placeholder="e.g., 60" />
            <Input label="Minimum Diploma Percentage" value={form.minDiploma} onChange={(v) => update("minDiploma", v)} placeholder="e.g., 60" />
            <Input label="Minimum UG CGPA" value={form.minUgCgpa} onChange={(v) => update("minUgCgpa", v)} placeholder="e.g., 7.5 or 75" />
          </div>
        </Card>
      </Section>

      <div className="flex justify-between gap-3">
        <Button variant="secondary">Cancel</Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/admin/students')}>Skip</Button>
          <Button variant="primary" onClick={() => navigate('/admin/drives/new/jobs')}>Next: Job Details</Button>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children, required }) {
  return (
    <label className="block text-sm font-medium mb-1">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

function Input({ label, required, type = "text", value, onChange, placeholder }) {
  const { isDark } = useTheme();
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
      />
    </div>
  );
}

function Select({ label, required, options, value, onChange }) {
  const { isDark } = useTheme();
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
      >
        <option value="">Select {label}</option>
        {options.map((opt, i) => (
          <option key={i} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
