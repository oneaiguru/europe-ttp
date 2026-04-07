# Task 2 Plan (P) — TTC Applicants Summary Page (`slug=summary`)

## 1) Scope and constraints
- Scope target: `app/admin/ttc_applicants_summary/render.ts`.
- Follow `summary.research.md` and `ttp-tailwind-reference.md` Task 2 goal.
- Keep admin shell integration and CDN/script flow unchanged.
  - `app/admin/shared/admin-shell.ts:4-13`
  - `app/admin/ttc_applicants_summary/render.ts:24-34`
- Preserve route wrapping and contract.
  - `app/api/admin/ttc_applicants_summary/route.ts:18-22`
- Preserve status coloring behavior while removing inline styles.
  - `app/admin/ttc_applicants_summary/render.ts:157-160`
  - `app/admin/ttc_applicants_summary/render.ts:213,247`

## 2) File to edit
- `/Users/m/ttp-split-experiment/app/admin/ttc_applicants_summary/render.ts`

## 3) Exact implementation steps

### 3.1 Add status-class helper above `renderAdminDashboard`
Insert after the type block and before `export function renderAdminDashboard`:

```ts
function getStatusClass(status: string): string {
  if (!status) return 'text-[#333]';
  var s = status.toLowerCase();
  if (s.indexOf('complete') === 0) return 'text-[#2e7d32]';
  if (s === 'submitted') return 'text-[#1565c0]';
  if (s === 'pending' || s === 'not started') return 'text-[#e65100]';
  if (s === 'in progress') return 'text-[#f9a825]';
  return 'text-[#333]';
}
```

### 3.2 Replace unmapped row inline styles in `format()` (around lines 208-223)
Replace this block:

```ts
'<td style="background-color:white;">Evaluator:</td>' +
'<td style="background-color:white;border-right:1px solid #eee;">' + (_e.data.i_name||'') + '</td>' +
'<td style="background-color:white;">Email:</td>' +
'<td style="background-color:white;border-right:1px solid #eee;">' + (_e.data.i_email_aol||'') + '</td>' +
'<td style="background-color:white;">Status:</td>' +
'<td style="background-color:white;color:' + getStatusColor(_e.reporting_status) + ';">' + (_e.reporting_status||'') + '</td>' +
'<td style="background-color:white;"><a class="an-simple-button" onclick="view_form_standalone(\\'ttc_evaluation\\',\\'' + (_e.email||'') + '\\',\\'' + (_e.form_instance||'') + '\\');">View</a></td>' +
'</tr>' +
'<tr>' +
'<td style="background-color:white;">Volunteer:</td>' +
'<td style="background-color:white;border-right:1px solid #eee;">' + (_e.data.i_volunteer_name||'') + '</td>' +
'<td style="background-color:white;">Email:</td>' +
'<td style="background-color:white;border-right:1px solid #eee;">' + (_e.data.i_volunteer_email||'') + '</td>' +
'<td style="background-color:white;"></td><td style="background-color:white;"></td><td style="background-color:white;"></td>' +
'</tr>'
```

with:

```ts
'<td class="bg-white">Evaluator:</td>' +
'<td class="bg-white border-r border-r-[#eee]">' + (_e.data.i_name||'') + '</td>' +
'<td class="bg-white">Email:</td>' +
'<td class="bg-white border-r border-r-[#eee]">' + (_e.data.i_email_aol||'') + '</td>' +
'<td class="bg-white">Status:</td>' +
'<td class="bg-white ' + getStatusClass(_e.reporting_status) + '">' + (_e.reporting_status||'') + '</td>' +
'<td class="bg-white"><a class="an-simple-button" onclick="view_form_standalone(\\'ttc_evaluation\\',\\'' + (_e.email||'') + '\\',\\'' + (_e.form_instance||'') + '\\");">View</a></td>' +
'</tr>' +
'<tr>' +
'<td class="bg-white">Volunteer:</td>' +
'<td class="bg-white border-r border-r-[#eee]">' + (_e.data.i_volunteer_name||'') + '</td>' +
'<td class="bg-white">Email:</td>' +
'<td class="bg-white border-r border-r-[#eee]">' + (_e.data.i_volunteer_email||'') + '</td>' +
'<td class="bg-white"></td><td class="bg-white"></td><td class="bg-white"></td>' +
'</tr>'
```

### 3.3 Replace unmapped separator row style line
Replace:

```ts
_rows += '<tr><td style="background-color:#fafafa;line-height:5px;" colspan="7"></td></tr>';
```

with:

```ts
_rows += '<tr><td class="bg-[#fafafa] leading-[5px]" colspan="7"></td></tr>';
```

### 3.4 Replace mapped rows inline styles in `format()` (around lines 237-249)
Replace:

```ts
_ttc_dates = '<td style="background-color:white;">TTC:</td>' +
  '<td style="background-color:white;border-right:1px solid #eee;">' + _display + '</td>';
```

with:

```ts
_ttc_dates = '<td class="bg-white">TTC:</td>' +
  '<td class="bg-white border-r border-r-[#eee]">' + _display + '</td>';
```

Replace:

```ts
'<td style="background-color:white;">Evaluator:</td>' +
'<td style="background-color:white;border-right:1px solid #eee;">' + (_ev.data.i_name||'') + '</td>' +
'<td style="background-color:white;">Email:</td>' +
'<td style="background-color:white;border-right:1px solid #eee;">' + (_ev.data.i_email_aol||_ev.email||'') + '</td>' +
'<td style="background-color:white;">Status:</td>' +
'<td style="background-color:white;color:' + getStatusColor(_ev.reporting_status) + ';">' + (_ev.reporting_status||'') + '</td>' +
'<td style="background-color:white;"><a class="an-simple-button" onclick="view_form_standalone(\\'ttc_evaluation\\',\\'' + (_ev.email||'') + '\\',\\'' + (_ev.form_instance||'') + '\\");">View</a></td>'
```

with:

```ts
'<td class="bg-white">Evaluator:</td>' +
'<td class="bg-white border-r border-r-[#eee]">' + (_ev.data.i_name||'') + '</td>' +
'<td class="bg-white">Email:</td>' +
'<td class="bg-white border-r border-r-[#eee]">' + (_ev.data.i_email_aol||_ev.email||'') + '</td>' +
'<td class="bg-white">Status:</td>' +
'<td class="bg-white ' + getStatusClass(_ev.reporting_status) + '">' + (_ev.reporting_status||'') + '</td>' +
'<td class="bg-white"><a class="an-simple-button" onclick="view_form_standalone(\\'ttc_evaluation\\',\\'' + (_ev.email||'') + '\\',\\'' + (_ev.form_instance||'') + '\\");">View</a></td>'
```

### 3.5 Replace inline styles on nested detail table and actions wrapper (lines 256-263)
Replace:

```ts
return '<table cellpadding="5" cellspacing="0" border="0" style="padding:0 13px;border:1px solid #eee;background-color:white;">' +
  _rows + '</table>' +
  '<div style="margin-top:13px;margin-bottom:7px;">' +
```

with:

```ts
return '<table class="border border-[#eee] bg-white p-[0_13px] border-separate border-spacing-0">' +
  _rows + '</table>' +
  '<div class="mt-[13px] mb-[7px]">' +
```

### 3.6 Replace top-level layout inline styles (around lines 276-320)
Replace:

```ts
<div class="form-header-block" style="text-align:left;">
  ...
  <div class="smallertext" style="margin-top:7px;">
```

with:

```ts
<div class="form-header-block text-left">
  ...
  <div class="smallertext mt-[7px]">
```

Replace:

```ts
<div style="margin-top:35px;margin-bottom:23px;">
  ...
  <div style="margin-top:8px;">
```

with:

```ts
<div class="mt-[35px] mb-[23px]">
  ...
  <div class="mt-[8px]">
```

Replace:

```ts
<table id="${escapeHtmlAttr(ADMIN_DASHBOARD_TABLE_ID)}" class="display nowrap" style="width:100%;">
  <thead style="font-family:Ubuntu;font-weight:300;text-transform:uppercase;">
```

with:

```ts
<table id="${escapeHtmlAttr(ADMIN_DASHBOARD_TABLE_ID)}" class="display nowrap w-full">
  <thead class="font-light uppercase">
```

Replace:

```ts
<th colspan="11" style="text-align:left;">Total Complete Applications: <i style="font-weight:normal;">loading</i>, Total Submitted Applications: <i style="font-weight:normal;">loading</i></th>
```

with:

```ts
<th colspan="11" class="text-left">Total Complete Applications: <i class="font-normal">loading</i>, Total Submitted Applications: <i class="font-normal">loading</i></th>
```

### 3.7 Out-of-scope decision
- Do not edit `app/api/admin/ttc_applicants_summary/route.ts` in this pass.
- Evidence: route inline styles are outside the explicit render-function scope.

## 4) Implementation order
- 1) Add `getStatusClass(...)` helper.
- 2) Apply all `format(...)` changes.
- 3) Apply top-level layout changes.
- 4) Verify no inline `style` attributes remain in `app/admin/ttc_applicants_summary/render.ts`.
