export const ADMIN_UNAUTHORIZED_HTML = '<b>UN-AUTHORIZED</b>';

export function renderAdminUnauthorized(): string {
  return `<div style="font-family:Ubuntu,sans-serif;text-align:center;padding:60px 20px;">
  <div style="font-size:1.4em;color:#c62828;">${ADMIN_UNAUTHORIZED_HTML}</div>
  <p style="color:#666;margin-top:12px;">You do not have permission to access this page.</p>
</div>`;
}
