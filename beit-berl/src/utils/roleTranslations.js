export const roleTranslations = {
  admin: 'מנהל',
  orgRep: 'נציג ארגון',
  vc: 'רכז',
  volunteer: 'מתנדב'
};

// Helper function to get Hebrew label for a role
export const getRoleLabel = (role) => roleTranslations[role] || role;

// Helper function to get all roles with their Hebrew labels
export const getRolesWithLabels = () => {
  return Object.entries(roleTranslations).map(([value, label]) => ({
    value,
    label
  }));
};
