import React from "react";

export default function RegisterCellMember() {
  return (
    <div className="registration-form">
      <h2>Register Cell Member</h2>
      <p>Add placement cell member in placemate.</p>

      <div className="form-section">
        <h3>Personal Information</h3>
        <div className="form-grid">
          <Input
            label="Email Address"
            required
            placeholder="student117@example.com"
            type="email"
          />
          <Input
            label="Phone Number"
            required
            placeholder="1234567812"
            type="tel"
          />
        </div>
      </div>

      <div className="form-section">
        <h3>Cell Information</h3>
        <div className="form-grid">
          <Select
            label="Role in Cell"
            required
            options={["Student Member", "Coordinator", "Lead"]}
          />
          <Select
            label="Branch"
            required
            options={[
              "Information Technology",
              "Computer Science",
              "Electronics",
              "Electrical",
            ]}
          />
          <Input
            label="Join Date"
            required
            type="date"
            defaultValue="2024-07-24"
          />
          <Input label="End Date" placeholder="dd/mm/yyyy" type="text" />
        </div>
        <p>Leave blank if no end date</p>
      </div>

      <div className="form-section">
        <h3>Additional Information</h3>
        <Textarea
          label="Description / Notes"
          placeholder="Enter any additional information about the member"
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary">Cancel</button>
        <button type="submit" className="btn btn-primary">Add Member</button>
      </div>
    </div>
  );
}

function Input({ label, placeholder, required, type = "text", defaultValue }) {
  return (
    <div className="form-field">
      <label>
        {label} {required && <span className="required">*</span>}
      </label>
      <input 
        type={type} 
        placeholder={placeholder} 
        defaultValue={defaultValue}
      />
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

function Textarea({ label, placeholder }) {
  return (
    <div className="form-field textarea-full">
      <label>{label}</label>
      <textarea 
        rows={3} 
        placeholder={placeholder}
      ></textarea>
    </div>
  );
}
