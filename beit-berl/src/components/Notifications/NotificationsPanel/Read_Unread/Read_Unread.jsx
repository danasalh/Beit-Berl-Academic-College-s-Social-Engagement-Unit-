import React from "react";
import { HiMailOpen, HiMail } from "react-icons/hi";
import "./Read_Unread.css";

const Read_Unread = React.forwardRef(
  (
    {
      position = { top: 0, left: 0 },
      onClose,
      onMarkRead,
      onMarkUnread,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className="read-unread-dropdown"
        style={{
          position: "absolute",
          top: position?.top ?? 0,
          left: position?.left ?? 0,
        }}
      >
        <div
          className="option"
          onClick={() => {
            onMarkRead && onMarkRead();
            onClose && onClose();
          }}
          style={{ cursor: "pointer" }}
        >
          <HiMailOpen className="icon" />
          <span className="text">סמן כנקרא</span>
        </div>
        <div
          className="option"
          onClick={() => {
            onMarkUnread && onMarkUnread();
            onClose && onClose();
          }}
          style={{ cursor: "pointer" }}
        >
          <HiMail className="icon" />
          <span className="text">סמן כלא נקרא</span>
        </div>
      </div>
    );
  }
);

export default Read_Unread;
