import React, { useEffect, useState } from 'react';
import './Card.css';
import { HiUserGroup } from "react-icons/hi";

const CardCoordinator = () => {
  const [coordinatorCount, setCoordinatorCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const q = query(collection(db, 'users'), where('role', '==', 'coordinator'));
      const snapshot = await getDocs(q);
      setVolunteerCount(snapshot.size);
    };

    fetchData();
  }, []);

  return (
    <div className="card">
      <div className="icon"><HiUserGroup /></div>
      <div className="value">{coordinatorCount}</div>
      <div className="label">נציגי הארגונים</div>
    </div>
  );
};

export default CardCoordinator;
