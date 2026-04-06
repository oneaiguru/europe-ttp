import { readJson, GCS_PATHS } from './gcs';

/**
 * Port of admin.py:82-138 get_ttc_list_html().
 * @param userHomeCountry - ISO country code for filtering (optional). Legacy uses display_countries
 *   field on each option to filter by user's home country (admin.py:102-105).
 */
export async function getTtcListHtml(userHomeCountry?: string): Promise<{ html: string; json: string }> {
  const allOptions = await readJson(GCS_PATHS.TTC_COUNTRY_AND_DATES) as Array<Record<string, unknown>>;

  // Filter options by display_countries (matching admin.py:102-105)
  const options = allOptions.filter(option => {
    if (userHomeCountry && Array.isArray(option.display_countries)) {
      return (option.display_countries as string[]).includes(userHomeCountry);
    }
    return true; // no filtering if no country or no display_countries field
  });

  let optionsHtml = '';
  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    const selected = i === options.length - 1 ? 'selected' : '';
    optionsHtml += `<option value="${option.value}" ${selected}>${option.display}</option>`;
  }
  // Wrap in the same div structure as legacy admin.py:116-131
  const html = `<div class="mt-[15px] mb-[23px]">
    <div class="tablebody"><div name="ttc_list" class="tablerow">
      <div class="tablecell"><label for="ttc_list">TTC</label>
        <span class="smallertext">Select the TTC from the dropdown</span></div>
      <div class="tablecell">
        <select class="textbox" id="ttc_list" name="ttc_list" onchange="load_table_data()">
          ${optionsHtml}
        </select></div>
    </div></div></div>`;
  return { html, json: JSON.stringify(allOptions) }; // json uses ALL options (unfiltered, for client-side use)
}
