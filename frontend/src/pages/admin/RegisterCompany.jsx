import React, { useState } from 'react';
import { DashboardLayout, PageContainer, Section } from '../../components/layout';
import { Card, Button } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';

export default function RegisterCompany() {
  const { isDark } = useTheme();
  const [logo, setLogo] = useState(null);
  const [form, setForm] = useState({
    companyName: '',
    website: '',
    foundedYear: '',
    industry: '',
    companySize: '',
    companyType: '',
    companyCategory: 'Software Development',
    description: '',
    contactName: '',
    contactEmail: '',
    contactPosition: '',
    addressLine: '',
    country: '',
    state: '',
    city: '',
  });

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const onLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setLogo(URL.createObjectURL(file));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    // TODO: connect to backend API
    console.log('Register company payload:', { ...form, logo });
    alert('Company registered (mock)!');
  };

  return (
    <DashboardLayout title="Register New Company">
      <PageContainer>
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Company Information */}
          <Section title="Company Information">
            <Card className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-28 h-28 rounded-lg flex items-center justify-center overflow-hidden border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    {logo ? (
                      <img src={logo} alt="logo preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs text-center px-2`}>PNG, JPG, or GIF up to 5MB</span>
                    )}
                  </div>
                  <label className={`cursor-pointer ${isDark ? 'text-blue-400' : 'text-blue-600'} text-sm`}>
                    Upload Logo
                    <input type="file" accept="image/*" onChange={onLogoChange} className="hidden" />
                  </label>
                </div>

                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Company Name" required value={form.companyName} onChange={(v) => update('companyName', v)} />
                  <Input label="Company Website" value={form.website} onChange={(v) => update('website', v)} placeholder="https://example.com" />
                  <Input label="Founded Year" value={form.foundedYear} onChange={(v) => update('foundedYear', v)} placeholder="e.g., 2020" />
                  <Select label="Industry" options={["Technology","Finance","Healthcare","Education"]} value={form.industry} onChange={(v) => update('industry', v)} />
                  <Select label="Company Size" options={["1-10","11-50","51-200","201-500","500+"]} value={form.companySize} onChange={(v) => update('companySize', v)} />
                  <Select label="Company Type" options={["Private Limited","Public Limited","LLP","Startup"]} value={form.companyType} onChange={(v) => update('companyType', v)} />
                  <Select label="Company Category" options={["Software Development","Consulting","Product","Services"]} value={form.companyCategory} onChange={(v) => update('companyCategory', v)} />
                  <div className="md:col-span-2">
                    <Textarea label="Company Description" value={form.description} onChange={(v) => update('description', v)} placeholder="Describe the company, products, and mission" rows={4} />
                  </div>
                </div>
              </div>
            </Card>
          </Section>

          {/* Contact Information */}
          <Section title="Contact Information">
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Contact Person Name" value={form.contactName} onChange={(v) => update('contactName', v)} />
                <Input label="Contact Person Email" type="email" value={form.contactEmail} onChange={(v) => update('contactEmail', v)} placeholder="name@company.com" />
                <Input label="Contact Person Position" value={form.contactPosition} onChange={(v) => update('contactPosition', v)} />
              </div>
            </Card>
          </Section>

          {/* Address Information */}
          <Section title="Address Information">
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <Input label="Address Line" value={form.addressLine} onChange={(v) => update('addressLine', v)} placeholder="Building, Street, Area" />
                </div>
                <Select label="Country" value={form.country} onChange={(v) => update('country', v)} options={["India","USA","UK","Canada"]} />
                <Select label="State" value={form.state} onChange={(v) => update('state', v)} options={["Gujarat","Maharashtra","Delhi","Karnataka"]} />
                <Select label="Headquarter City" value={form.city} onChange={(v) => update('city', v)} options={["Ahmedabad","Gandhinagar","Mumbai","Bengaluru"]} />
              </div>
            </Card>
          </Section>

          <div className="flex justify-end">
            <Button variant="primary" type="submit">Register company</Button>
          </div>
        </form>
      </PageContainer>
    </DashboardLayout>
  );
}

function FieldLabel({ children, required }) {
  return (
    <label className="block text-sm font-medium mb-1">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

function Input({ label, required, type = 'text', value, onChange, placeholder }) {
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

function Textarea({ label, value, onChange, placeholder, rows = 3 }) {
  const { isDark } = useTheme();
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <textarea
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
      ></textarea>
    </div>
  );
}
