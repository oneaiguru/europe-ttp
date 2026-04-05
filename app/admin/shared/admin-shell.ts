import { escapeHtml } from '../../utils/html';

/**
 * CDN CSS: DataTables 1.13 + Buttons + ColReorder, Select2 4.1
 */
export const ADMIN_CDN_CSS = `<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/v/dt/jq-3.7.0/jszip-3.10.1/dt-1.13.8/b-2.4.2/b-colvis-2.4.2/b-html5-2.4.2/b-print-2.4.2/cr-1.7.0/datatables.min.css"/>
<link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet"/>`;

/**
 * CDN JS: jQuery 3.7 + DataTables 1.13 + Buttons + ColReorder + JSZip, Select2 4.1
 */
export const ADMIN_CDN_JS = `<script type="text/javascript" src="https://cdn.datatables.net/v/dt/jq-3.7.0/jszip-3.10.1/dt-1.13.8/b-2.4.2/b-colvis-2.4.2/b-html5-2.4.2/b-print-2.4.2/cr-1.7.0/datatables.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>`;

/**
 * Base CSS shared by all admin pages.
 */
export const ADMIN_BASE_CSS = `<style>
  body { font-family: Ubuntu, sans-serif; font-weight: 300; margin: 0; padding: 15px; }
  .site-container { margin: 0 auto; max-width: 1400px; padding: 0 15px; }
  .smallertext { font-size: 0.85em; color: #666; }
  .form-header-block { font-size: 1.4em; font-weight: 300; }
</style>`;

export type AdminShellOptions = {
  title: string;
  bodyHtml: string;
  extraHeadHtml?: string;
  extraCdnJs?: string;
};

/**
 * Wrap admin page body content in a full HTML document with CDN dependencies in <head>.
 * CSS goes in head, JS at end of body (after page content so DOM is ready).
 */
export function wrapAdminShell(options: AdminShellOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(options.title)}</title>
  ${ADMIN_CDN_CSS}
  ${ADMIN_BASE_CSS}
  ${options.extraHeadHtml ?? ''}
</head>
<body>
  ${ADMIN_CDN_JS}
  ${options.extraCdnJs ?? ''}
  ${options.bodyHtml}
</body>
</html>`;
}
