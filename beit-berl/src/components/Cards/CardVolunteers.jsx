import React, { useEffect, useState } from 'react';
import './Card.css';
import { HiUserGroup } from "react-icons/hi";

const CardVolunteers = () => {
  const [volunteerCount, setVolunteerCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const q = query(collection(db, 'users'), where('role', '==', 'volunteer'));
      const snapshot = await getDocs(q);
      setVolunteerCount(snapshot.size);
    };

    fetchData();
  }, []);

  return (
    <div className="card">
      <div className="icon"><HiUserGroup /></div>
      <div className="value">{volunteerCount}</div>
      <div className="label">מתנדבים</div>
    </div>
  );
};

export default CardVolunteers;
