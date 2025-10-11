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

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
        <button style={{ 
          padding: '0.5rem 1.5rem', 
          backgroundColor: '#f3f4f6', 
          color: '#374151', 
          border: '1px solid #d1d5db', 
          borderRadius: '0.5rem',
          cursor: 'pointer'
        }}>Cancel</button>
        <button style={{ 
          padding: '0.5rem 1.5rem', 
          backgroundColor: '#1f2937', 
          color: 'white', 
          border: 'none', 
          borderRadius: '0.5rem',
          cursor: 'pointer'
        }}>Add Member</button>
      </div>
    </div>
  );
}

function Input({ label, placeholder, required, type = "text", defaultValue }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <input 
        type={type} 
        placeholder={placeholder} 
        defaultValue={defaultValue}
        style={{
          width: '100%',
          border: '1px solid #d1d5db',
          borderRadius: '0.5rem',
          padding: '0.5rem 0.75rem',
          fontSize: '0.875rem',
          outline: 'none',
          transition: 'all 0.2s ease'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#9ca3af';
          e.target.style.boxShadow = '0 0 0 3px rgba(209, 213, 219, 0.3)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#d1d5db';
          e.target.style.boxShadow = 'none';
        }}
      />
    </div>
  );
}

function Select({ label, required, options }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <select
        style={{
          width: '100%',
          border: '1px solid #d1d5db',
          borderRadius: '0.5rem',
          padding: '0.5rem 0.75rem',
          fontSize: '0.875rem',
          outline: 'none',
          transition: 'all 0.2s ease'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#9ca3af';
          e.target.style.boxShadow = '0 0 0 3px rgba(209, 213, 219, 0.3)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#d1d5db';
          e.target.style.boxShadow = 'none';
        }}
      >
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
    <div style={{ gridColumn: 'span 3' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
        {label}
      </label>
      <textarea 
        rows={3} 
        placeholder={placeholder}
        style={{
          width: '100%',
          border: '1px solid #d1d5db',
          borderRadius: '0.5rem',
          padding: '0.5rem 0.75rem',
          fontSize: '0.875rem',
          outline: 'none',
          resize: 'none',
          transition: 'all 0.2s ease'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#9ca3af';
          e.target.style.boxShadow = '0 0 0 3px rgba(209, 213, 219, 0.3)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#d1d5db';
          e.target.style.boxShadow = 'none';
        }}
      ></textarea>
    </div>
  );
}
