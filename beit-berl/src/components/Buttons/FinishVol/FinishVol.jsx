import React from "react";
import "./FinishVol.css";

const FinishVol = ({ onClick }) => {
  return (
    <button className="finish-vol-button" onClick={onClick}>
      סיום התנדבות
    </button>
  );
};

export default FinishVol;
