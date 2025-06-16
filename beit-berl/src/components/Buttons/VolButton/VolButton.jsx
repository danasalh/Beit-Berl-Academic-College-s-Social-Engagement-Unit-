import React from "react";
import { HiOutlineUser, HiOutlineCheckCircle } from "react-icons/hi";
import "./VolButton.css";

function VolButton({ onClick, label = "מתנדבים", count }) {
  return (
    <button className="vol-button" onClick={onClick}>
      <HiOutlineUser className="vol-icon" />
      <span className="vol-label">
        {label} {typeof count === "number" ? count : ""}
      </span>
    </button>
  );
}

function RequestsButton({ onClick, label = "בקשות לאישור שעות התנדבות", count }) {
  return (
    <button className="vol-button" onClick={onClick}>
      <HiOutlineCheckCircle className="vol-icon" />
      <span className="vol-label">
        {label} {typeof count === "number" ? count : ""}
      </span>
    </button>
  );
}

export default VolButton;
export { RequestsButton };