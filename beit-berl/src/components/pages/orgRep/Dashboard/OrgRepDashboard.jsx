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
      
      {/* Main content container */}
      <div className="dashboard-content">
        {/* Welcome section */}
        <div className="welcome-section">
          <div className="orgrep-welcome-title">
            <span className="welcome-text">ברוך הבא</span>
            <div className="title-underline"></div>
          </div>
          <div className="welcome-subtitle">
          
          </div>
        </div>
        
        {/* Buttons section */}
        <div className="buttons-section">
          <ThreeButtonDushOrgRep onSectionsClick={scrollToOrganizations} />
        </div>
        
        {/* Organizations section */}
        <div className="organizations-section">
          <div className="section-header">
            <h2 className="section-title">הארגונים שלי</h2>
            <div className="section-divider"></div>
          </div>
          <div className="organizations-list-orgRep" ref={organizationsListRef}>
            <OrganizationsList/>
          </div>
        </div>
      </div>
    </div>
  );
}