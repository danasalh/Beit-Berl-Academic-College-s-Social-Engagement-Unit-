// src/components/pages/orgRep/Dashboard/OrgRepDashboard.jsx

import React from 'react';
import OrgCard from '../../../Organizations/OrganizationsComp/OrgCard';
import ThreeButtonDushOrgRep from '../../../Buttons/ThreeButtonDushOrgRep/ThreeButtonDushOrgRep';
import './OrgRepDashboard.css';

const exampleOrg = {
  id: "org1",
  name: "ארגון לדוגמה",
  description: "תיאור קצר של הארגון לדוגמה. כאן אפשר להוסיף מידע על מטרות, פעילויות ועוד.",
  city: "תל אביב"
};

export default function OrgRepDashboard() {
  return (
    <div className="orgrep-dashboard-center">
      <div
        className="orgrep-welcome-title"
        style={{
          fontSize: '2.2rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          color: '#0077c2',
          textAlign: 'center',
          width: '100%',
          maxWidth: 600,
          textShadow: '0 0 16px #90caf9, 0 0 8px #90caf9',
          animation: 'glow 2s ease-in-out infinite alternate',
        }}
      >
        ברוך הבא
      </div>
      <style>
        {`
          @keyframes glow {
            from {
              text-shadow: 0 0 4px #90caf9, 0 0 2px #90caf9;
            }
            to {
              text-shadow: 0 0 24px #42a5f5, 0 0 12px #42a5f5;
            }
          }
        `}
      </style>
      <OrgCard org={exampleOrg} onShowDetails={() => {}} allUsers={[]} />
      <ThreeButtonDushOrgRep />
    </div>
  );
}