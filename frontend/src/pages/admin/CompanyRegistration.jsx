import React, { useState, useEffect } from 'react';
import { DashboardLayout, PageContainer, Section } from '../../components/layout';
import { Card, Button } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { fetchJSON } from '../../lib/api';

// Assuming Input, Select, Textarea, and FieldLabel are defined as in your original code
// ... (Your original helper component definitions here)

const COMPANY_REGISTRATION_URL = '/api/v1/companies/';
const CITIES_LOOKUP_URL = '/api/v1/core/lookup/?type=cities';

export default function CompanyRegistration() {
  const { isDark } = useTheme();
  const [logo, setLogo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]); // State to hold fetched city data
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

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const { ok, data } = await fetchJSON(CITIES_LOOKUP_URL);
        if (ok && data && data.success && data.data) {
          // Map to an array of { label: name, value: id } for the Select component
          const cityOptions = data.data.map((city) => ({
            label: city.name,
            value: city.id.toString(), // Store ID as string for select value
          }));
          setCities(cityOptions);
        } else {
          console.error('Failed to fetch cities:', (data && data.message) || 'unknown');
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
      }
    };
    fetchCities();
  }, []);

  // 2. Implement the submission logic
  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 3. Map frontend form state to backend payload
    const payload = {
      name: form.companyName,
      email: form.contactEmail,
      // NOTE: phone_number is required by backend but missing in frontend form. Assuming a mock value for now.
      phone_number: '9999999999', 
      website_url: form.website,
      description: form.description,
      // Convert year to a number
      year_founded: parseInt(form.foundedYear) || 2000, 
      // Convert size string (e.g., "11-50") to a numerical code. 
      // NOTE: Assuming 0 for now as the size mapping isn't provided.
      company_size: 0, 
      headquarters_address: form.addressLine,
      // Convert city ID back to a number
      headquarters_city: parseInt(form.city) || 0,
      // TODO: Handle logo upload separately (e.g., to an S3 bucket) and send the URL, or use a FormData object.
      // For this example, we'll omit the logo to keep the JSON body simple.
    };

    try {
      const { ok, data: result, res } = await fetchJSON(COMPANY_REGISTRATION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // NOTE: You'll likely need an Authorization header here (e.g., Bearer Token)
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (ok) {
        console.log('Company registration successful:', result);
        alert('Company registered successfully!');
        // Optionally reset form here
      } else {
        console.error('Company registration failed:', result || res.statusText);
        alert(`Registration failed: ${(result && result.message) || res.statusText}`);
      }
    } catch (error) {
      console.error('Network or API error:', error);
      alert('An unexpected error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  
  

  return (
    <DashboardLayout title="Register New Company">
      <PageContainer>
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Company Information Section */}
          <Section title="Company Information">
            <Card className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="flex flex-col items-center gap-3">
                  {/* ... Logo Upload UI ... */}
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

          {/* Contact Information Section */}
          <Section title="Contact Information">
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Contact Person Name" value={form.contactName} onChange={(v) => update('contactName', v)} />
                <Input label="Contact Person Email" type="email" value={form.contactEmail} onChange={(v) => update('contactEmail', v)} placeholder="name@company.com" />
                <Input label="Contact Person Position" value={form.contactPosition} onChange={(v) => update('contactPosition', v)} />
              </div>
            </Card>
          </Section>

          {/* Address Information Section */}
          <Section title="Address Information">
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <Input label="Address Line" value={form.addressLine} onChange={(v) => update('addressLine', v)} placeholder="Building, Street, Area" />
                </div>
                <Select label="Country" value={form.country} onChange={(v) => update('country', v)} options={["India","USA","UK","Canada"]} />
                {/* NOTE: You would normally filter states based on the selected country, but we use the mock array for simplicity. */}
                <Select label="State" value={form.state} onChange={(v) => update('state', v)} options={["Gujarat","Maharashtra","Delhi","Karnataka"]} />
                {/* Use the fetched and formatted 'cities' state for the options */}
                <Select 
                  label="Headquarter City" 
                  value={form.city} 
                  onChange={(v) => update('city', v)} 
                  // Pass the fetched city names as options
                  options={cities.map(c => c.label)} 
                  // Pass the full city data to the Select component to handle ID mapping
                  cityData={cities}
                  // Let's create a custom Select to handle ID/Name mapping
                  // Or, simplify: just use the city names for display and the ID for value
                />
              </div>
            </Card>
          </Section>

          <div className="flex justify-end">
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Registering...' : 'Register Company'}
            </Button>
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