/**
 * TTC Portal Settings Form Renderer
 *
 * Renders the TTC Portal Settings form for administrators.
 * This form allows TTC admins to configure portal-wide settings.
 */

export function renderTtcPortalSettingsForm(): string {
  return `
    <h1>TTC Portal Settings</h1>
    <div id="ttc-portal-settings-form">
      <form method="POST" action="/admin/ttc-portal-settings">
        <div class="form-group">
          <label for="portal_deadline">TTC Application Deadline</label>
          <input
            type="datetime"
            id="portal_deadline"
            name="portal_deadline"
            placeholder="YYYY-MM-DD HH:MM"
          />
        </div>

        <div class="form-group">
          <label for="display_until">Display Until Date</label>
          <input
            type="datetime"
            id="display_until"
            name="display_until"
            placeholder="YYYY-MM-DD HH:MM"
          />
        </div>

        <div class="form-group">
          <label>
            <input
              type="checkbox"
              id="whitelist_enabled"
              name="whitelist_enabled"
              value="1"
            />
            Enable Whitelist
          </label>
        </div>

        <div class="form-group">
          <label>
            <input
              type="checkbox"
              id="test_mode"
              name="test_mode"
              value="1"
            />
            Test Mode
          </label>
          <small>Bypasses deadline enforcement for testing</small>
        </div>

        <div class="form-group">
          <label for="whitelist_emails">Whitelisted Emails</label>
          <textarea
            id="whitelist_emails"
            name="whitelist_emails"
            rows="5"
            placeholder="One email per line"
          ></textarea>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Save Settings</button>
          <button type="reset" class="btn btn-secondary">Reset</button>
        </div>
      </form>
    </div>
  `;
}
