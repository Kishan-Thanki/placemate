import React, { useState } from "react";
import { Section } from "./layout";
import { Card, Button } from "./ui";
import { useTheme } from "../contexts/ThemeContext";

export default function RegisterCellMember() {
  const { isDark } = useTheme();
  const [form, setForm] = useState({
    email: "",
    phone: "",
    role: "",
    branch: "",
    joinDate: "",
    endDate: "",
    notes: "",
  });

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-6">
      <Section title="Personal Information">
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Email Address" required type="email" value={form.email} onChange={(v) => update("email", v)} placeholder="student117@example.com" />
            <Input label="Phone Number" required type="tel" value={form.phone} onChange={(v) => update("phone", v)} placeholder="1234567812" />
          </div>
        </Card>
      </Section>

      <Section title="Cell Information" description="Leave end date blank if not applicable.">
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select label="Role in Cell" required value={form.role} onChange={(v) => update("role", v)} options={["Student Member", "Coordinator", "Lead"]} />
            <Select label="Branch" required value={form.branch} onChange={(v) => update("branch", v)} options={["Information Technology", "Computer Science", "Electronics", "Electrical"]} />
            <Input label="Join Date" required type="date" value={form.joinDate} onChange={(v) => update("joinDate", v)} />
            <div className="md:col-span-2">
              <Input label="End Date" type="text" value={form.endDate} onChange={(v) => update("endDate", v)} placeholder="dd/mm/yyyy" />
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Additional Information">
        <Card className="p-6">
          <Textarea label="Description / Notes" value={form.notes} onChange={(v) => update("notes", v)} placeholder="Enter any additional information about the member" />
        </Card>
      </Section>

      <div className="flex justify-end gap-3">
        <Button variant="secondary">Cancel</Button>
        <Button variant="primary">Add Member</Button>
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

function Textarea({ label, value, onChange, placeholder }) {
  const { isDark } = useTheme();
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <textarea
        rows={3}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
      />
    </div>
  );
}
