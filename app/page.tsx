import { ADMIN_REPORTS_LIST_LINKS } from './admin/reports_list/render';

type LinkItem = {
  href: string;
  label: string;
};

const ADMIN_LINKS: LinkItem[] = [
  { href: '/api/admin/reports_list', label: 'Reports List' },
  { href: '/api/admin/permissions', label: 'Permissions' },
  { href: '/api/admin/ttc_applicants_summary', label: 'TTC Applicants Summary' },
  ...ADMIN_REPORTS_LIST_LINKS,
];

const FORM_LINKS: LinkItem[] = [
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

function LinkGrid({ links, emptyText }: { links: LinkItem[]; emptyText: string }) {
  if (links.length === 0) {
    return <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">{emptyText}</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <p className="text-base font-medium text-slate-900 group-hover:text-blue-600">{link.label}</p>
          <p className="mt-1 truncate text-sm text-slate-500">{link.href}</p>
        </a>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-light text-slate-900">Europe TTP</h1>
        <p className="text-sm text-slate-600">
          Teacher Training Program — application portal and admin dashboard.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="border-b border-slate-200 pb-2 text-xl font-light text-slate-800">Admin Pages</h2>
        <LinkGrid links={ADMIN_LINKS} emptyText="No admin links are available." />
      </section>

      <section className="space-y-4">
        <h2 className="border-b border-slate-200 pb-2 text-xl font-light text-slate-800">Form Pages</h2>
        <LinkGrid links={FORM_LINKS} emptyText="No form links are available." />
      </section>
    </div>
  );
}
