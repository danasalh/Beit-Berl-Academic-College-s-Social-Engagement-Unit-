import './VcDashboard.css';
import HoursList from '../../../HoursList/HoursList';
import OrganizationsList from '../../../Organizations/OrganizationsList';
export default function VcDashboard() {
  return (
    <div className="vc-dashboard">
      <div className="vc-welcome-title">
        ברוך הבא
      </div>

      <div className="vc-dashboard-header">
        <div className="org-preview">
          <OrganizationsList/>
        </div>
      </div>

      <div className="vc-hours-list">
        <HoursList />
      </div>
    </div>
  );
}
