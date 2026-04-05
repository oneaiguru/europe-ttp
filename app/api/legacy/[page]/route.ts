import fs from 'node:fs';
import path from 'node:path';

const LEGACY_DIR = path.resolve(process.cwd(), 'admin');

const ALLOWED_PAGES = new Set([
  'admin_settings',
  'ttc_applicants_reports',
  'ttc_applicants_summary',
  'ttc_applicants_integrity',
  'post_ttc_course_feedback_summary',
  'post_sahaj_ttc_course_feedback_summary',
]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ page: string }> },
) {
  const { page } = await params;

  if (!ALLOWED_PAGES.has(page)) {
    return new Response('Not Found', { status: 404 });
  }

  const filePath = path.join(LEGACY_DIR, `${page}.html`);

  // Guard against path traversal
  if (!filePath.startsWith(LEGACY_DIR + path.sep)) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const html = fs.readFileSync(filePath, 'utf-8');
    return new Response(html, {
      headers: { 'content-type': 'text/html' },
    });
  } catch {
    return new Response('Not Found', { status: 404 });
  }
}
