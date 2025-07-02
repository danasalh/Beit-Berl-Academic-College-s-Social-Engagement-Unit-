// src/components/pages/orgRep/Dashboard/OrgRepDashboard.jsx
import { useRef } from 'react';
import ThreeButtonDushOrgRep from '../../../Buttons/ThreeButtonDushOrgRep/ThreeButtonDushOrgRep';
import OrganizationsList from '../../../Organizations/OrganizationsList';
import './OrgRepDashboard.css';

export default function OrgRepDashboard() {
  const organizationsListRef = useRef(null);

  const scrollToOrganizations = () => {
    if (organizationsListRef.current) {
      organizationsListRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="orgrep-dashboard-center">
      {/* Background decoration */}
      <div className="background-decoration">
        <div className="floating-circle circle-1"></div>
        <div className="floating-circle circle-2"></div>
        <div className="floating-circle circle-3"></div>
      </div>
      <ThreeButtonDushOrgRep onSectionsClick={scrollToOrganizations} />
      <div className="organizations-list-orgRep" ref={organizationsListRef}>
        <OrganizationsList/>
      </div>
    </div>
  );
}