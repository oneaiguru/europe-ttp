export const DISABLED_NOTICE_TEXT =
  'The TTC Portal is not available on Mobile. Please use the portal from a Desktop web browser.';

export function renderDisabledPage(): string {
  return [
    '<div class="max-w-4xl mx-auto p-6">',
    '<div class="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">',
    '<h1 class="text-2xl font-semibold text-amber-900">Portal Notice</h1>',
    `<p id="disabled_notice" class="mt-2 text-sm text-amber-800">${DISABLED_NOTICE_TEXT}</p>`,
    '</div>',
    '</div>',
  ].join('');
}
