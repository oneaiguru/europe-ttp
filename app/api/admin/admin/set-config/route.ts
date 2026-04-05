export async function POST() {
  // Mock: accept any config save and return success
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'content-type': 'text/plain' },
  });
}
