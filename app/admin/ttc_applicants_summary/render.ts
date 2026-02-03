export const ADMIN_DASHBOARD_TITLE = 'Admin';
export const ADMIN_DASHBOARD_TABLE_ID = 'ttc_applicants_summary';

export function renderAdminDashboard(): string {
  return `<h1>${ADMIN_DASHBOARD_TITLE}</h1><table id="${ADMIN_DASHBOARD_TABLE_ID}"></table>`;
}
