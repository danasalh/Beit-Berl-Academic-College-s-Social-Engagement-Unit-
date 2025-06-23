import './VcDashboard.css';
import HoursList from '../../../HoursList/HoursList';
import OrganizationsList from '../../../Organizations/OrganizationsList';
import {HiCheckCircle} from "react-icons/hi";

export default function VcDashboard() {
  return (
    <div className="vc-dashboard">
      <div className="vc-welcome-title">
        ברוך הבא
      </div>
      <div className='vc-dashboard-content'>
        <div className="vc-dashboard-header">
          <div className='org-info-card'>
            <h2>כרטיס הארגון שלך</h2>
            <p> <HiCheckCircle/> דרך כרטיס הארגון שלך ניתן לצפות בפרטי הארגון</p>
            <p> <HiCheckCircle/> יש להוסיף ולעדכן את פרטי יצירת הקשר כדי שמועמדים שיתעניינו בהתנדבות יוכלו ליצור עימך קשר </p>
          </div>
          <div className="org-preview">
            <OrganizationsList />
          </div>
        </div>
        <div className="vc-hours-list">
          <HoursList />
        </div>
      </div>
    </div>
  );
}
