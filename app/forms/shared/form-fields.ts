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
  const req = f.required ? ' required' : '';
  const labelHtml = `<label for="${escapeHtmlAttr(f.id)}" class="text-sm font-medium text-gray-700${req}">${escapeHtml(f.label)}</label>`;
  const hintHtml = f.hint ? `<div class="hint">${escapeHtml(f.hint)}</div>` : '';
  const reqAttr = f.required ? ' required' : '';
  const inputClass = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm';

  let inputHtml: string;
  switch (f.type) {
    case 'select':
      inputHtml = `<select id="${escapeHtmlAttr(f.id)}" name="${escapeHtmlAttr(f.id)}" class="form-select ${inputClass}"${reqAttr}>` +
        '<option value="">-- Select --</option>' +
        (f.options ?? []).map(o => `<option value="${escapeHtmlAttr(o)}">${escapeHtml(o)}</option>`).join('') +
        '</select>';
      break;
    case 'textarea':
      inputHtml = `<textarea id="${escapeHtmlAttr(f.id)}" name="${escapeHtmlAttr(f.id)}" class="form-textarea ${inputClass}"${reqAttr}></textarea>`;
      break;
    case 'radio':
      inputHtml = '<div class="form-radio-group">' +
        (f.options ?? []).map(o =>
          `<input type="radio" id="${escapeHtmlAttr(f.id + '_' + o.toLowerCase().replace(/\s+/g, '_'))}" name="${escapeHtmlAttr(f.id)}" value="${escapeHtmlAttr(o)}"${reqAttr} class="rounded border-gray-300 text-blue-600 focus:ring-blue-600"> ` +
          `<label for="${escapeHtmlAttr(f.id + '_' + o.toLowerCase().replace(/\s+/g, '_'))}" class="text-sm font-medium text-gray-700">${escapeHtml(o)}</label>`
        ).join(' ') +
        '</div>';
      break;
    default:
      inputHtml = `<input type="${f.type ?? 'text'}" id="${escapeHtmlAttr(f.id)}" name="${escapeHtmlAttr(f.id)}" class="form-input ${inputClass}"${reqAttr}>`;
  }

  return `<div class="form-group">${labelHtml}${hintHtml}${inputHtml}</div>`;
}

export function renderFields(fields: FieldDef[]): string {
  return fields.map(renderField).join('\n');
}

export function renderSubmitButton(label = 'Submit'): string {
  return `<div class="form-group"><button type="submit" class="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm">${escapeHtml(label)}</button></div>`;
}
