import React from "react";
import { HiOutlineUserGroup, HiOutlineUser } from "react-icons/hi";
import "./ThreeButtonDushOrgRep.css";

const ThreeButtonDushOrgRep = () => {
  return (
    <div className="three-button-dush">
      <button className="dush-button">
        <HiOutlineUser className="dush-icon" />
        <span>מתנדבים x</span>
      </button>
      <button className="dush-button">
        <HiOutlineUserGroup className="dush-icon" />
        <span>רכזים y</span>
      </button>
    </div>
  );
};

export default ThreeButtonDushOrgRep;
