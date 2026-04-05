import { MOCK_INTEGRITY_DATA } from '../../../mock-data';

export async function GET() {
  return new Response(JSON.stringify(MOCK_INTEGRITY_DATA), {
    headers: { 'content-type': 'text/plain' },
  });
}
