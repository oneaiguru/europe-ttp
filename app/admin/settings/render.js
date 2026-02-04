export const ADMIN_SETTINGS_TITLE = 'Admin Settings';
export const ADMIN_SETTINGS_HELPER = 'Please enter settings for TTC portal';
export const ADMIN_SETTINGS_CONTAINER_ID = 'settings_page';
export function renderAdminSettings() {
    return `<h1>${ADMIN_SETTINGS_TITLE}</h1><p>${ADMIN_SETTINGS_HELPER}</p><div id="${ADMIN_SETTINGS_CONTAINER_ID}"></div>`;
}
