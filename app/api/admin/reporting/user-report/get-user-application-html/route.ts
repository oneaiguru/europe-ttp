import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const email = searchParams.get('email') || 'unknown';
  const formType = searchParams.get('form_type') || 'unknown';

  // Return a simple HTML preview for the "View Application" modal
  const html = `
    <div style="padding: 20px; font-family: Ubuntu, sans-serif;">
      <h2 style="color: #333; margin-bottom: 16px;">Application Preview</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Form Type</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${formType}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Status</td>
          <td style="padding: 8px; border: 1px solid #ddd; color: #2e7d32;">Mock Data — Application Complete</td>
        </tr>
      </table>
      <p style="color: #666; margin-top: 16px; font-size: 14px;">
        This is mock preview data. In production, this shows the full application form.
      </p>
    </div>
  `;

  return new Response(html, {
    headers: { 'content-type': 'text/html' },
  });
}
