import { escapeHtml, escapeHtmlAttr } from '../../utils/html';

export type FieldDef = {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'date' | 'number' | 'select' | 'textarea' | 'radio';
  required?: boolean;
  hint?: string;
  options?: string[];
};

export function renderField(f: FieldDef): string {
  const req = f.required ? ' class="required"' : '';
  const labelHtml = `<label for="${escapeHtmlAttr(f.id)}"${req}>${escapeHtml(f.label)}</label>`;
  const hintHtml = f.hint ? `<div class="hint">${escapeHtml(f.hint)}</div>` : '';
  const reqAttr = f.required ? ' required' : '';

  let inputHtml: string;
  switch (f.type) {
    case 'select':
      inputHtml = `<select id="${escapeHtmlAttr(f.id)}" name="${escapeHtmlAttr(f.id)}" class="form-select"${reqAttr}>` +
        '<option value="">-- Select --</option>' +
        (f.options ?? []).map(o => `<option value="${escapeHtmlAttr(o)}">${escapeHtml(o)}</option>`).join('') +
        '</select>';
      break;
    case 'textarea':
      inputHtml = `<textarea id="${escapeHtmlAttr(f.id)}" name="${escapeHtmlAttr(f.id)}" class="form-textarea"${reqAttr}></textarea>`;
      break;
    case 'radio':
      inputHtml = '<div class="form-radio-group">' +
        (f.options ?? []).map(o =>
          `<input type="radio" id="${escapeHtmlAttr(f.id + '_' + o.toLowerCase().replace(/\s+/g, '_'))}" name="${escapeHtmlAttr(f.id)}" value="${escapeHtmlAttr(o)}"${reqAttr}> ` +
          `<label for="${escapeHtmlAttr(f.id + '_' + o.toLowerCase().replace(/\s+/g, '_'))}">${escapeHtml(o)}</label>`
        ).join(' ') +
        '</div>';
      break;
    default:
      inputHtml = `<input type="${f.type ?? 'text'}" id="${escapeHtmlAttr(f.id)}" name="${escapeHtmlAttr(f.id)}" class="form-input"${reqAttr}>`;
  }

  return `<div class="form-group">${labelHtml}${hintHtml}${inputHtml}</div>`;
}

export function renderFields(fields: FieldDef[]): string {
  return fields.map(renderField).join('\n');
}

export function renderSubmitButton(label = 'Submit'): string {
  return `<div class="form-group"><button type="submit" class="form-submit-btn">${escapeHtml(label)}</button></div>`;
}
