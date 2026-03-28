import { ADMIN_REPORTS_LIST_LINKS } from './admin/reports_list/render';

const EXTRA_ADMIN_LINKS = [
  { href: '/api/admin/permissions', label: 'Permissions' },
  { href: '/api/admin/ttc_applicants_summary', label: 'TTC Applicants Summary' },
];

const FORM_LINKS = [
  { href: '/api/forms/ttc_application_us', label: 'TTC Application (US)' },
  { href: '/api/forms/ttc_application_non_us', label: 'TTC Application (Non-US)' },
  { href: '/api/forms/ttc_evaluation', label: 'TTC Evaluation' },
  { href: '/api/forms/ttc_applicant_profile', label: 'Applicant Profile' },
  { href: '/api/forms/ttc_evaluator_profile', label: 'Evaluator Profile' },
  { href: '/api/forms/dsn_application', label: 'DSN Application' },
  { href: '/api/forms/post_ttc_self_evaluation', label: 'Post-TTC Self Evaluation' },
  { href: '/api/forms/post_ttc_feedback', label: 'Post-TTC Feedback' },
  { href: '/api/forms/post_sahaj_ttc_self_evaluation', label: 'Post-Sahaj Self Evaluation' },
  { href: '/api/forms/post_sahaj_ttc_feedback', label: 'Post-Sahaj Feedback' },
  { href: '/api/forms/ttc_portal_settings', label: 'Portal Settings' },
];

export default function HomePage() {
  const adminLinks = [...ADMIN_REPORTS_LIST_LINKS, ...EXTRA_ADMIN_LINKS];

  return (
    <div style={{ fontFamily: 'Ubuntu, sans-serif', fontWeight: 300, maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h1 style={{ fontWeight: 300, fontSize: '1.8em' }}>Europe TTP</h1>
      <p style={{ color: '#666' }}>Teacher Training Program — application portal and admin dashboard.</p>

      <h2 style={{ fontWeight: 300, fontSize: '1.3em', marginTop: 30, borderBottom: '1px solid #ddd', paddingBottom: 8 }}>
        Admin Pages
      </h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {adminLinks.map((link) => (
          <li key={link.href} style={{ padding: '6px 0' }}>
            <a href={link.href} style={{ color: '#1565c0', textDecoration: 'none' }}>
              {link.label}
            </a>
            <span style={{ color: '#999', fontSize: '0.85em', marginLeft: 10 }}>{link.href}</span>
          </li>
        ))}
      </ul>

      <h2 style={{ fontWeight: 300, fontSize: '1.3em', marginTop: 30, borderBottom: '1px solid #ddd', paddingBottom: 8 }}>
        Form Pages
      </h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {FORM_LINKS.map((link) => (
          <li key={link.href} style={{ padding: '6px 0' }}>
            <a href={link.href} style={{ color: '#1565c0', textDecoration: 'none' }}>
              {link.label}
            </a>
            <span style={{ color: '#999', fontSize: '0.85em', marginLeft: 10 }}>{link.href}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
