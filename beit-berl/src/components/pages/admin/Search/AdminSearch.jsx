// src/components/pages/admin/Search/AdminSearch.jsx

import React from 'react';
import UsersData from '../../../UsersData/UsersData';

export default function AdminSearch() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Admin Search</h1>
      <p>This is where admin search will be displayed.</p>
      <UsersData />
    </div>
  );
}
