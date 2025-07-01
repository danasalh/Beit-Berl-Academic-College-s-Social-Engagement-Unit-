import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { HiLocationMarker, HiOutlineUserGroup, HiOutlineUser } from "react-icons/hi";
import { useUsers } from "../../../Contexts/UsersContext";
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import "./ThreeButtonDushOrgRep.css";

const ThreeButtonDushOrgRep = ({ onSectionsClick }) => {
  const navigate = useNavigate();
  const { currentUser } = useUsers();

  const [volunteersCount, setVolunteersCount] = useState(0);
  const [coordinatorsCount, setCoordinatorsCount] = useState(0);
  const [branchesCount, setBranchesCount] = useState(0);

  const handleClick = () => {
    navigate("/orgRep/organization");
  };

  const handleSectionsClick = () => {
    if (onSectionsClick) {
      onSectionsClick();
    }
  };

  useEffect(() => {
    const fetchCounts = async () => {
      if (!currentUser?.orgId) {
        return;
      }

      try {
        // Get current user's organization IDs
        const userOrgIds = Array.isArray(currentUser.orgId)
          ? currentUser.orgId
          : [currentUser.orgId];
        // Direct Firebase query for volunteers
        const volunteersQuery = query(
          collection(db, 'users'),
          where('role', '==', 'volunteer')
        );
        const volunteersSnapshot = await getDocs(volunteersQuery);

        let volunteerCount = 0;
        volunteersSnapshot.forEach(doc => {
          const userData = doc.data();
          if (userData.orgId) {
            const volunteerOrgIds = Array.isArray(userData.orgId)
              ? userData.orgId
              : [userData.orgId];

            const hasMatchingOrg = volunteerOrgIds.some(orgId =>
              userOrgIds.includes(Number(orgId))
            );

            if (hasMatchingOrg) {
              volunteerCount++;
            }
          }
        });

        setVolunteersCount(volunteerCount);

        // Direct Firebase query for coordinators
        const coordinatorsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'vc')
        );
        const coordinatorsSnapshot = await getDocs(coordinatorsQuery);

        let coordinatorCount = 0;
        coordinatorsSnapshot.forEach(doc => {
          const userData = doc.data();
          if (userData.orgId) {
            const coordinatorOrgIds = Array.isArray(userData.orgId)
              ? userData.orgId
              : [userData.orgId];

            const hasMatchingOrg = coordinatorOrgIds.some(orgId =>
              userOrgIds.includes(Number(orgId))
            );

            if (hasMatchingOrg) {
              coordinatorCount++;
            }
          }
        });

        setCoordinatorsCount(coordinatorCount);

        // Set branches count
        setBranchesCount(userOrgIds.length);

      } catch (error) {
      }
    };

    // Only run once when currentUser is available
    if (currentUser?.orgId) {
      fetchCounts();
    }
  }, []); // Empty dependency array - runs only once

  return (
    <div className="three-button-dush">
      <button className="dush-button" onClick={handleSectionsClick}>
        <HiLocationMarker className="dush-icon" />
        <span>סניפים: {branchesCount}</span>
      </button>
      <button className="dush-button" onClick={handleClick}>
        <HiOutlineUserGroup className="dush-icon" />
        <span>רכזים: {coordinatorsCount}</span>
      </button>
      <button className="dush-button" onClick={handleClick}>
        <HiOutlineUser className="dush-icon" />
        <span>מתנדבים:  {volunteersCount}</span>
      </button>
    </div>
  );
};

export default ThreeButtonDushOrgRep;