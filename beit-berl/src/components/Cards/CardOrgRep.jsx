import React, { useEffect, useState } from 'react';
import './Card.css';
import { HiUserGroup } from "react-icons/hi";

const CardOrgRep = () => {
  const [orgRepCount, setOrgRepCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const q = query(collection(db, 'users'), where('role', '==', 'organization_representative'));
      const snapshot = await getDocs(q);
      setVolunteerCount(snapshot.size);
    };

    fetchData();
  }, []);

  return (
    <div className="card">
      <div className="icon"><HiUserGroup /></div>
      <div className="value">{orgRepCount}</div>
      <div className="label">רכזי המתנדבים </div>
    </div>
  );
};

export default CardOrgRep;
