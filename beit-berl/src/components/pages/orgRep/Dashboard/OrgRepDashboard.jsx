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
      <div className="orgrep-welcome-title">
        ברוך הבא
      </div>
      <h3 className="sub-title-orgs">הארגון שלי במספרים:</h3>
      <ThreeButtonDushOrgRep onSectionsClick={scrollToOrganizations} />
      <div className="organizations-list-orgRep" ref={organizationsListRef}>
        <OrganizationsList/>
      </div>
    </div>
  );
}