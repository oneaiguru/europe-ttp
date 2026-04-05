/**
 * Client-side AJAX form submit handler JS.
 * Collects all form inputs and posts as JSON.
 */
export function formSubmitScript(formId: string): string {
  return `
<script type="text/javascript">
$(document).ready(function() {
  $('#${formId}').on('submit', function(e) {
    e.preventDefault();
    var formData = {};
    $(this).find('input, select, textarea').each(function() {
      var id = $(this).attr('id');
      if (!id) return;
      var type = $(this).attr('type');
      if (type === 'radio') {
        if ($(this).is(':checked')) formData[$(this).attr('name')] = $(this).val();
      } else if (type === 'checkbox') {
        formData[id] = $(this).is(':checked');
      } else {
        formData[id] = $(this).val();
      }
    });
    var msgEl = document.getElementById('form-message');
    $.post(window.location.pathname, { data: JSON.stringify(formData) })
      .done(function() {
        if (msgEl) msgEl.innerHTML = '<div class="text-green-700 py-2.5 px-2.5">Your data has been submitted successfully.</div>';
      })
      .fail(function() {
        if (msgEl) msgEl.innerHTML = '<div class="text-red-700 py-2.5 px-2.5">There was an error submitting your data.</div>';
      });
  });
});
</script>`;
}
