import { escapeHtml } from '../../utils/html';

export type FormShellOptions = {
  title: string;
  bodyHtml: string;
};

/**
 * Wrap form body content in a full HTML document.
 * Lighter than admin-shell: no DataTables/Select2, just jQuery for AJAX.
 */
export function wrapFormShell(options: FormShellOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(options.title)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: Ubuntu, sans-serif; font-weight: 300; margin: 0; padding: 15px; }
    .form-container { margin: 0 auto; max-width: 700px; padding: 0 15px; }
    .form-header { font-size: 1.4em; font-weight: 300; margin-bottom: 20px; }
    .form-group { margin-bottom: 15px; }
    .form-group label { display: block; font-weight: 400; margin-bottom: 4px; }
    .form-group .hint { font-size: 0.85em; color: #666; margin-bottom: 4px; }
    .form-input { width: 100%; max-width: 400px; padding: 6px 8px; border: 1px solid #ccc; border-radius: 3px; font-size: 14px; box-sizing: border-box; }
    .form-select { width: 100%; max-width: 420px; padding: 6px 8px; border: 1px solid #ccc; border-radius: 3px; font-size: 14px; }
    .form-textarea { width: 100%; max-width: 400px; padding: 6px 8px; border: 1px solid #ccc; border-radius: 3px; font-size: 14px; min-height: 80px; box-sizing: border-box; }
    .form-radio-group { margin-top: 4px; }
    .form-radio-group label { display: inline; font-weight: 300; margin-right: 15px; }
    .form-submit-btn {
      display: inline-block; padding: 10px 24px; background: #1565c0; color: white;
      border: none; border-radius: 3px; cursor: pointer; font-size: 15px; margin-top: 10px;
    }
    .form-submit-btn:hover { background: #0d47a1; }
    .form-message { margin-top: 15px; }
    .required::after { content: ' *'; color: #c62828; }
  </style>
</head>
<body>
  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
  ${options.bodyHtml}
</body>
</html>`;
}
