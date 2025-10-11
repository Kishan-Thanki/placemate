import React, { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  UserCog,
  CalendarPlus,
  UserPlus,
  FileText,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Users,
  UserCheck,
  Briefcase,
  Menu,
  X
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Sidebar() {
  const [expandedItems, setExpandedItems] = useState({
    'add-drive': false,
    'students': false
  });
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleExpanded = (itemKey) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemKey]: !prev[itemKey]
    }));
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <button 
        className="mobile-menu-btn" 
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
      <div className="logo">
        <span>PlaceMate</span>
      </div>

      <nav>
        <SidebarLink
          icon={<LayoutDashboard size={18} />}
          text="Dashboard"
          link="/dashboard"
          onLinkClick={closeMobileMenu}
        />
        <SidebarLink
          icon={<Building2 size={18} />}
          text="Companies"
          link="/companies"
          onLinkClick={closeMobileMenu}
        />
        <SidebarLink
          icon={<UserCog size={18} />}
          text="Cell Member"
          link="/spc"
          onLinkClick={closeMobileMenu}
        />

        <ExpandableSidebarLink
          icon={<CalendarPlus size={18} />}
          text="Drive"
          itemKey="add-drive"
          isExpanded={expandedItems['add-drive']}
          onToggle={toggleExpanded}
          onLinkClick={closeMobileMenu}
          subItems={[
            { icon: <FileText size={16} />, text: "Basic Details", link: "/add-drive/basic-details" },
            { icon: <Briefcase size={16} />, text: "Job Details", link: "/add-drive/job-details" }
          ]}
        />

        <ExpandableSidebarLink
          icon={<UserPlus size={18} />}
          text="Students"
          itemKey="students"
          isExpanded={expandedItems['students']}
          onToggle={toggleExpanded}
          onLinkClick={closeMobileMenu}
          subItems={[
            {
              icon: <UserPlus size={16} />,
              text: "Student Manual Registrations",
              link: "/student-registration" 
            },
            {
              icon: <Users size={16} />,
              text: "Registered Students",
              link: "/registered-students" 
            },
            {
              icon: <UserCheck size={16} />,
              text: "Student Details",
              link: "/student-details" 
            },
            { icon: <Briefcase size={16} />, text: "Applications Status", link: "/applications-status" }
          ]}
        />
      </nav>
    </aside>
    </>
  );
}

function SidebarLink({ icon, text, link, onLinkClick }) {
  if (link) {
    return (
      <Link to={link} className="sidebar-link" onClick={onLinkClick}>
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

function ExpandableSidebarLink({ icon, text, itemKey, isExpanded, onToggle, subItems, onLinkClick }) {
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
              <Link key={index} to={subItem.link} className="sidebar-link sub-item" onClick={onLinkClick}>
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
