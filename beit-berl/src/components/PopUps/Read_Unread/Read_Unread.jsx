import React from "react";
import { HiMailOpen, HiMail } from "react-icons/hi";
import "./Read_Unread.css";

const Read_Unread = ({ position, onClose }) => {
  return (
    <div
      className="read-unread-dropdown"
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
      }}
    >
      <div className="option" onClick={onClose} style={{ cursor: "pointer" }}>
        <HiMailOpen className="icon" />
        <span className="text">סמן כנקרא</span>
      </div>
      <div className="option" onClick={onClose} style={{ cursor: "pointer" }}>
        <HiMail className="icon" />
        <span className="text">סמן כלא נקרא</span>
      </div>
    </div>
  );
};

export default Read_Unread;
