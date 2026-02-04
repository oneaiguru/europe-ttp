"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_DASHBOARD_TABLE_ID = exports.ADMIN_DASHBOARD_TITLE = void 0;
exports.renderAdminDashboard = renderAdminDashboard;
exports.ADMIN_DASHBOARD_TITLE = 'Admin';
exports.ADMIN_DASHBOARD_TABLE_ID = 'ttc_applicants_summary';
function renderAdminDashboard() {
    return `<h1>${exports.ADMIN_DASHBOARD_TITLE}</h1><table id="${exports.ADMIN_DASHBOARD_TABLE_ID}"></table>`;
}
