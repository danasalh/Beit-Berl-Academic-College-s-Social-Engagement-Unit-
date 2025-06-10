import { useNavigate } from "react-router-dom";
import { HiLocationMarker , HiOutlineUserGroup, HiOutlineUser } from "react-icons/hi";
import "./ThreeButtonDushOrgRep.css";

const ThreeButtonDushOrgRep = ({ onSectionsClick }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/orgRep/organization");
  };

  const handleSectionsClick = () => {
    if (onSectionsClick) {
      onSectionsClick();
    }
  };

  return (
    <div className="three-button-dush">
      <button className="dush-button" onClick={handleSectionsClick}>
        <HiLocationMarker className="dush-icon" />
        <span>סניפים x</span>
      </button>
      <button className="dush-button" onClick={handleClick}>
        <HiOutlineUserGroup className="dush-icon" />
        <span>רכזים y</span>
      </button>
      <button className="dush-button" onClick={handleClick}>
        <HiOutlineUser className="dush-icon"/>
        <span>מתנדבים x</span>
      </button>
    </div>
  );
};

export default ThreeButtonDushOrgRep;