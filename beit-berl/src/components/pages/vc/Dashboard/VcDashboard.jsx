// src/components/pages/vc/Dashboard/VcDashboard.jsx

import OrgCard from '../../../Organizations/OrganizationsComp/OrgCard';
import VolButton, { RequestsButton } from '../../../Buttons/VolButton/VolButton';

const exampleOrg = {
  id: "org1",
  name: "ארגון לדוגמה",
  description: "תיאור קצר של הארגון לדוגמה. כאן אפשר להוסיף מידע על מטרות, פעילויות ועוד.",
  city: "תל אביב"
};

export default function VcDashboard() {
  return (
    <div style={{ padding: '2rem' }}>
      <div
        className="vc-welcome-title"
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
          marginRight: 'auto',
          marginLeft: 'auto',
        }}
      >
        ברוך הבא
      </div>
      {/* כאן הקומפוננטה OrgCard */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <OrgCard org={exampleOrg} onShowDetails={() => {}} allUsers={[]} />
      </div>
      {/* כאן הכפתורים */}
      <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center', marginBottom: '2rem' }}>
        <VolButton />
        <RequestsButton />
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
          @media (max-width: 600px) {
            .vc-welcome-title {
              font-size: 1.3rem !important;
              max-width: 98vw !important;
            }
            .vol-button {
              width: 90vw !important;
              min-width: unset !important;
              font-size: 1rem !important;
            }
          }
        `}
      </style>
    </div>
  );
}