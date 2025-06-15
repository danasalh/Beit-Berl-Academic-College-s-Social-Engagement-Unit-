import { useNavigate } from "react-router-dom";
import { HiCheck, HiLibrary } from "react-icons/hi";
import "./ThreeButtonDush.css";

const ThreeButtonDush = ({ onMarkHoursClick }) => {
  const navigate = useNavigate();

  const handleOrgSearchClick = () => {
    navigate("/volunteer/organizations");
  };

  return (
    <div className="three-button-dush">
      <button className="dush-button" onClick={onMarkHoursClick}>
        <HiCheck className="dush-icon" />
        <span>סימון שעות התנדבות</span>
      </button>
      <button className="dush-button" onClick={handleOrgSearchClick}>
        <HiLibrary className="dush-icon" />
        <span>חיפוש ארגון התנדבות</span>
      </button>
    </div>
  );
};
export default ThreeButtonDush;