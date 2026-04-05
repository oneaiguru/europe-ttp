export const ADMIN_UNAUTHORIZED_HTML = '<b>UN-AUTHORIZED</b>';

export function renderAdminUnauthorized(): string {
  return `<div class="min-h-screen w-full flex items-center justify-center bg-gray-50">
  <div class="rounded-xl border border-gray-200 bg-white shadow-sm p-8 max-w-md">
    <div class="text-3xl font-semibold text-red-700">${ADMIN_UNAUTHORIZED_HTML}</div>
    <p class="text-sm text-gray-500 mt-2">You do not have permission to access this page.</p>
  </div>
</div>`;
}
