import OrganizationsList from '../../../Organizations/OrganizationsComp/OrganizationsList';

export default function AdminOrganizations() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Admin Organizations</h1>
      <p>This is where admin organizations will be displayed.</p>
      <OrganizationsList />
    </div>
  );
}
