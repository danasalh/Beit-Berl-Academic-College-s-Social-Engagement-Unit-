import { useNavigate } from "react-router-dom";
import { HiCheck, HiLibrary , HiCheckCircle} from "react-icons/hi";
import "./ThreeButtonDush.css";

const ThreeButtonDush = ({ onMarkHoursClick }) => {
  const navigate = useNavigate();

  const handleOrgSearchClick = () => {
    navigate("/volunteer/organizations");
  };

  return (
    <div className="three-button-dush-v">
      <button className="dush-button-v" onClick={onMarkHoursClick}>
        <HiCheck className="dush-icon-v" />
        <span>הזנת שעות התנדבות</span>
      </button>
      <button className="dush-button-v" onClick={handleOrgSearchClick}>
        <HiLibrary className="dush-icon-v" />
        <span>חיפוש ארגון להתנדבות</span>
      </button>
    <div className="dush-info-v">
        <h6>על מנת לקבל זכאות בגין ההתנדבות </h6>
        <p> <HiCheckCircle/> יש להקפיד להזין שעות התנדבות עם תום ההתנדבות.</p>
        <p> <HiCheckCircle/> תאריך הזנת השעות נשמר אוטומטית כמועד ביצוע ההתנדבות.</p>
        <p> <HiCheckCircle/> יש לבצע בסה"כ 60 שעות.</p>
        <p> <HiCheckCircle/> ניתן לבצע את השעות בארגון אחד או יותר, מקסימום 3 ארגונים.</p>
      </div>
    </div>
  );
};
export default ThreeButtonDush;