// components/common/CloseBtn.jsx
import { HiX } from 'react-icons/hi';
import './CloseButton.css'; 

const CloseButton = ({ onClick, className = '' }) => {
  return (
    <button className={`close-btn ${className}`} onClick={onClick} aria-label="Close">
      <HiX size={24} />
    </button>
  );
};

export default CloseButton;
