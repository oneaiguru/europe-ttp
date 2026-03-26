/**
 * Client-side JS: parse date strings into Date objects.
 * Replaces the legacy `javascript/date.js` dependency.
 */
export const STRING2DATE_JS = `function string2date(s) {
  if (!s) return null;
  var d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}`;

/**
 * Client-side JS: format a Date as MM/dd/yyyy.
 * The legacy code used a Date.prototype.format() polyfill; we inline it instead.
 */
export const FORMAT_DATE_JS = `function formatDate(d) {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return '';
  var mm = ('0' + (d.getMonth() + 1)).slice(-2);
  var dd = ('0' + d.getDate()).slice(-2);
  return mm + '/' + dd + '/' + d.getFullYear();
}`;
