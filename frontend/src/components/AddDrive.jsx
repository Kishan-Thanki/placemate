import React from "react";

export default function AddDrive() {
  return (
    <div className="add-drive-page">
      <div className="header">
        <h2>Add Drive</h2>
        <p>Add company drive in placemate.</p>
      </div>

      <div className="form-section">
        <section className="form-card">
          <h3 className="section-title">Basic Drive Details</h3>
          <div className="form-grid">
            <Select label="Company" required options={["Google", "Microsoft", "TCS", "Infosys"]} />
            <Input label="Drive Name" required placeholder="e.g., Software Development Internship 2024" />
            <Select label="Job Type" required options={["Internship", "Full-time", "Contract"]} />
            <Select label="Job Mode" required options={["On-site", "Hybrid", "Remote"]} />
            <Input label="Minimum CGPA" placeholder="e.g., 7.5" />
            <Input label="Eligible Courses" placeholder="Type to filter courses and select eligible courses" />
            <Input label="Required Skills" placeholder="Type to filter skills and select required skills" />
            <Input label="Posting Locations" placeholder="Type to filter cities and select posting locations" />
          </div>
        </section>

        <section className="form-card">
          <h3 className="section-title">Academic Eligibility Criteria</h3>
          <div className="form-grid">
            <Input label="Minimum 10th Percentage" placeholder="e.g., 60" />
            <Input label="Minimum 12th Percentage" placeholder="e.g., 60" />
            <Input label="Minimum Diploma Percentage" placeholder="e.g., 60" />
            <Input label="Minimum UG CGPA" placeholder="e.g., 7.5 or 75" />
          </div>
        </section>

        <div className="form-actions">
          <button className="cancel-btn">Cancel</button>
          <button className="next-btn">Add</button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, placeholder, required, type = "text" }) {
  return (
    <div className="form-field">
      <label>
        {label} {required && <span className="required">*</span>}
      </label>
      <input type={type} placeholder={placeholder} />
    </div>
  );
}

function Select({ label, required, options }) {
  return (
    <div className="form-field">
      <label>
        {label} {required && <span className="required">*</span>}
      </label>
      <select>
        <option value="">Select {label}</option>
        {options.map((opt, i) => (
          <option key={i}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
