import { MOCK_SETTINGS_DATA } from '../../mock-data';

export async function GET() {
  return new Response(JSON.stringify(MOCK_SETTINGS_DATA), {
    headers: { 'content-type': 'text/plain' },
  });
}
