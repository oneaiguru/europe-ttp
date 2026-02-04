"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_SETTINGS_CONTAINER_ID = exports.ADMIN_SETTINGS_HELPER = exports.ADMIN_SETTINGS_TITLE = void 0;
exports.renderAdminSettings = renderAdminSettings;
exports.ADMIN_SETTINGS_TITLE = 'Admin Settings';
exports.ADMIN_SETTINGS_HELPER = 'Please enter settings for TTC portal';
exports.ADMIN_SETTINGS_CONTAINER_ID = 'settings_page';
function renderAdminSettings() {
    return `<h1>${exports.ADMIN_SETTINGS_TITLE}</h1><p>${exports.ADMIN_SETTINGS_HELPER}</p><div id="${exports.ADMIN_SETTINGS_CONTAINER_ID}"></div>`;
}
