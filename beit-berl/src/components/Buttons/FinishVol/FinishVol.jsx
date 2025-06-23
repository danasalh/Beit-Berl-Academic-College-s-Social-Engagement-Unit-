import "./FinishVol.css";

const FinishVol = ({ onClick, label = "סיום התנדבות" }) => {
  return (
    <button className="finish-vol-button" onClick={onClick}>
      {label}
    </button>
  );
};

export default FinishVol;
