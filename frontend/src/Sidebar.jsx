import React, { useState } from "react";
import {
  Building2,
  CalendarPlus,
  UserPlus,
  FileText,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Users,
  Briefcase
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Sidebar() {
  const [expandedItems, setExpandedItems] = useState({
    'add-drive': true,
    'students': true
  });

  const toggleExpanded = (itemKey) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemKey]: !prev[itemKey]
    }));
  };

  return (
    <aside className="sidebar">
      <div className="logo">
        <span>🌟 Logo</span>
      </div>

      <nav>
        <SidebarLink
          icon={<Building2 size={18} />}
          text="Companies"
          link="/companies"
        />

        <ExpandableSidebarLink
          icon={<CalendarPlus size={18} />}
          text="Add Drive"
          itemKey="add-drive"
          isExpanded={expandedItems['add-drive']}
          onToggle={toggleExpanded}
          subItems={[
            { icon: <FileText size={16} />, text: "Basic Details", link: "/add-drive/basic-details" },
            { icon: <FileText size={16} />, text: "Job Details", link: "/add-drive/job-details" }
          ]}
        />

        <ExpandableSidebarLink
          icon={<UserPlus size={18} />}
          text="Students"
          itemKey="students"
          isExpanded={expandedItems['students']}
          onToggle={toggleExpanded}
          subItems={[
            {
              icon: <GraduationCap size={16} />,
              text: "Student Manual Registrations",
              link: "/student-registration" 
            },
            {
              icon: <Users size={16} />,
              text: "Registered Students",
              link: "/registered-students" 
            },
            { icon: <Briefcase size={16} />, text: "Applications Status", link: "/applications-status" }
          ]}
        />
      </nav>
    </aside>
  );
}

function SidebarLink({ icon, text, link }) {
  if (link) {
    return (
      <Link to={link} className="sidebar-link">
        {icon}
        <span>{text}</span>
      </Link>
    );
  }
  return (
    <div className="sidebar-link">
      {icon}
      <span>{text}</span>
    </div>
  );
}

function ExpandableSidebarLink({ icon, text, itemKey, isExpanded, onToggle, subItems }) {
  return (
    <div>
      <div
        className="sidebar-link expandable"
        onClick={() => onToggle(itemKey)}
        style={{ cursor: 'pointer' }}
      >
        {icon}
        <span>{text}</span>
        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </div>

      {isExpanded && (
        <div className="sub-items">
          {subItems.map((subItem, index) => (
            subItem.link ? (
              <Link key={index} to={subItem.link} className="sidebar-link sub-item">
                {subItem.icon}
                <span>{subItem.text}</span>
              </Link>
            ) : (
              <div key={index} className="sidebar-link sub-item">
                {subItem.icon}
                <span>{subItem.text}</span>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
