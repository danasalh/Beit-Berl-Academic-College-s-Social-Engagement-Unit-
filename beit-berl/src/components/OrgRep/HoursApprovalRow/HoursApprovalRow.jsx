import React from "react";
import "./HoursApprovalRow.css";

const HoursApprovalRow = () => {
  return (
    <div className="approval-row">
      <div className="box-text">
        <div className="box-line">שם המתנדב</div>
        <div className="box-line">תאריך:</div>
        <div className="box-line">שעה:</div>
        <div className="box-line">כמות:</div>
      </div>
      <div className="button-group">
        <button className="approve-button">אישור</button>
        <button className="reject-button">ביטול</button>
      </div>
    </div>
  );
};

export default HoursApprovalRow;
