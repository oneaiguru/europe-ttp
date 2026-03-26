/**
 * Shared client-side JS and CSS fragments for admin DataTables pages.
 * These are string constants intended for interpolation into <script>/<style> tags.
 */

/**
 * CSS for the child-row expand/collapse arrow control column.
 */
export const DETAILS_CONTROL_CSS = `td.details-control {
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><path d="M4 6l4 4 4-4" stroke="%23333" fill="none" stroke-width="2"/></svg>') no-repeat center center;
    cursor: pointer;
    width: 18px;
  }
  tr.shown td.details-control {
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><path d="M4 10l4-4 4 4" stroke="%23333" fill="none" stroke-width="2"/></svg>') no-repeat center center;
  }`;

/**
 * CSS for the simple button style used in export buttons and action links.
 */
export const BUTTON_CSS = `.an-simple-button {
    display: inline-block; padding: 4px 12px; border: 1px solid #ccc;
    border-radius: 3px; cursor: pointer; font-size: 12px; background: #f8f8f8;
    text-decoration: none; color: #333;
  }
  .an-simple-button:hover { background: #eee; }`;

/**
 * CSS for DataTable header/footer borders and margin reset.
 */
export const DATATABLE_CSS = `table.dataTable thead th { border-bottom: 2px solid #ccc; }
  table.dataTable tfoot th { border-top: 2px solid #ccc; }
  table.dataTable { margin: unset; }`;

/**
 * Client-side JS: returns a color string based on application/evaluation status.
 * Used in DataTable rowCallback to color status columns.
 */
export const STATUS_COLOR_JS = `function getStatusColor(status) {
  if (!status) return '#333';
  var s = status.toLowerCase();
  if (s.indexOf('complete') === 0) return '#2e7d32';
  if (s === 'submitted') return '#1565c0';
  if (s === 'pending' || s === 'not started') return '#e65100';
  if (s === 'in progress') return '#f9a825';
  return '#333';
}`;

/**
 * Client-side JS: shows HTML content in a modal overlay.
 * Used to display form previews inline.
 */
export const FULLSCREEN_MESSAGE_JS = `function postFullscreenMessage(html) {
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;overflow:auto;padding:20px;';
  overlay.innerHTML = '<div style="background:white;max-width:900px;margin:20px auto;padding:20px;border-radius:4px;position:relative;">' +
    '<a style="position:absolute;top:10px;right:15px;font-size:24px;cursor:pointer;text-decoration:none;color:#333;" onclick="this.parentElement.parentElement.remove();">&times;</a>' +
    html + '</div>';
  document.body.appendChild(overlay);
}`;

/**
 * Client-side JS: shows an error message in the #step_post_submit_message element.
 */
export const ERROR_MESSAGE_JS = `function postErrorMessage(msg) {
  var el = document.getElementById('step_post_submit_message');
  if (el) el.innerHTML = '<div style="color:red;padding:10px;">' + msg + '</div>';
}`;

/**
 * DataTables export buttons configuration (JS array literal).
 * Intended for use in the `buttons` option of DataTable init.
 */
export const EXPORT_BUTTONS_JS = `[
        {extend:'copy', className:'an-simple-button'},
        {extend:'excel', className:'an-simple-button'},
        {extend:'pdf', className:'an-simple-button'},
        {extend:'print', className:'an-simple-button'}
      ]`;

/**
 * Generate the child row toggle click handler JS for a DataTable.
 * Assumes `table` variable holds the DataTable instance and `format` function
 * renders child row HTML — both conventions match all legacy admin pages.
 *
 * @param tableId - The DOM id of the <table> element
 */
export function childRowClickHandlerJS(tableId: string): string {
  return `$('#${tableId} tbody').on('click', 'td.details-control', function() {
      var tr = $(this).closest('tr');
      var row = table.row(tr);
      if (row.child.isShown()) {
        row.child.hide();
        tr.removeClass('shown');
      } else {
        row.child(format(row.data())).show();
        tr.addClass('shown');
      }
    });`;
}
