import React, { useEffect, useState } from 'react';
import './Card.css';
import { HiOfficeBuilding } from "react-icons/hi";
const CardOrgs = () => {
  const [orgsCount, setOrgsCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const q = query(collection(db, 'users'), where('role', '==', 'organization'));
      const snapshot = await getDocs(q);
      setOrgsrCount(snapshot.size);
    };

    fetchData();
  }, []);

  return (
    <div className="card">
      <div className="icon"><HiOfficeBuilding /></div>
      <div className="value">{orgsCount}</div>
      <div className="label">ארגונים </div>
    </div>
  );
};

export default CardOrgs;
