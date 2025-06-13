import React from 'react';
import { HiLocationMarker, HiUsers } from 'react-icons/hi';
import './OrganizationCard.css';

const OrganizationCard = ({ organization, onPreview }) => {
  return (
    <div className="organization-card">
      <div className="card-header">
        <div className="card-content">
          <h3 className="organization-name">{organization.name}</h3>
          <div className="location-info">
            <HiLocationMarker className="location-icon" />
            <span className="city-name">{organization.city}</span>
          </div>
        </div>
        <div className="organization-avatar">
          {organization.name.charAt(0)}
        </div>
      </div>
      
      <p className="organization-description">
        {organization.description}
      </p>
      
      <div className="card-footer">
        <div className="member-count">
          <HiUsers className="users-icon" />
          <span>{organization.memberCount} מתנדבים</span>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const sampleOrg = {
    name: "עמותת יד לחיוך",
    city: "תל אביב",
    description: "     העמותה יד לחיוך פועלת להעלאת איכות החיים של ילדים   ",
    memberCount: 1240
  };

  return (
    <div className="app-container">
      <div className="card-wrapper">
        <OrganizationCard organization={sampleOrg} />
      </div>
    </div>
  );
};

export default App;