# Europe TTP

Europe Teacher Training Program - application portal and admin dashboard.

## Quick Start (Docker - works on Windows, Mac, Linux)

### Prerequisites

1. **Install Docker Desktop**
   - Windows: Download from https://www.docker.com/products/docker-desktop/
     - Enable **WSL 2** when prompted
     - Restart your computer if prompted
   - Mac: Download the Mac version from the same page
   - Wait until Docker Desktop shows "running" in the system tray

2. **Install Git** (if not already installed)
   - Windows: https://git-scm.com/download/win
   - Mac: `xcode-select --install`

### Setup

1. **Open a terminal**
   - Windows: Press `Win + R`, type `cmd`, press Enter
   - Mac: Open Terminal from Applications

2. **Clone the repository**
   ```
   git clone <REPO_URL> europe-ttp
   cd europe-ttp
   ```

3. **Start the application**
   ```
   docker compose up --build
   ```
   First run takes 2-3 minutes to download Node.js and install dependencies.

4. **Open in your browser**
   - Go to http://localhost:3000

> **Note**: No `.env` file is needed to view the pages. All admin dashboards and
> forms render without API keys. If you need backend features (email, file upload),
> copy `.env.example` to `.env` and fill in the keys.

### Available Pages

#### Admin Pages
| Page | URL |
|------|-----|
| Reports List | http://localhost:3000/api/admin/reports_list |
| Permissions | http://localhost:3000/api/admin/permissions |
| Settings | http://localhost:3000/api/admin/settings |
| TTC Applicants Summary | http://localhost:3000/api/admin/ttc_applicants_summary |
| TTC Integrity Report | http://localhost:3000/api/admin/ttc_applicants_integrity |
| TTC Applicants Reports | http://localhost:3000/api/admin/ttc_applicants_reports |
| Post TTC Feedback | http://localhost:3000/api/admin/post_ttc_course_feedback |
| Post Sahaj TTC Feedback | http://localhost:3000/api/admin/post_sahaj_ttc_course_feedback |

#### Form Pages
| Page | URL |
|------|-----|
| TTC Application (US) | http://localhost:3000/api/forms/ttc_application_us |
| TTC Application (Non-US) | http://localhost:3000/api/forms/ttc_application_non_us |
| TTC Evaluation | http://localhost:3000/api/forms/ttc_evaluation |
| Applicant Profile | http://localhost:3000/api/forms/ttc_applicant_profile |
| Evaluator Profile | http://localhost:3000/api/forms/ttc_evaluator_profile |
| DSN Application | http://localhost:3000/api/forms/dsn_application |
| Post-TTC Self Evaluation | http://localhost:3000/api/forms/post_ttc_self_evaluation |
| Post-TTC Feedback | http://localhost:3000/api/forms/post_ttc_feedback |
| Post-Sahaj Self Evaluation | http://localhost:3000/api/forms/post_sahaj_ttc_self_evaluation |
| Post-Sahaj Feedback | http://localhost:3000/api/forms/post_sahaj_ttc_feedback |
| Portal Settings | http://localhost:3000/api/forms/ttc_portal_settings |

### Daily Use

| Action | Command |
|--------|---------|
| Start the app | `docker compose up` |
| Stop the app | `Ctrl+C` or `docker compose down` |
| Rebuild after code changes | `docker compose up --build` |
| View logs | `docker compose logs -f app` |
| Full reset | `docker compose down --volumes` then `docker compose up --build` |

### Running Without Docker

If you prefer to run without Docker (requires Node.js 20.20.0):

```bash
# Install Node.js 20.20.0 via nvm
nvm install 20.20.0
nvm use 20.20.0

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev

# Open http://localhost:3000
```

### Running Tests

```bash
# TypeScript type checking
npm run typecheck

# BDD tests (requires Node 20.20.0)
npm test

# Lint
npm run lint
```

### Troubleshooting

- **"Docker daemon is not running"** - Open Docker Desktop and wait for it to fully start.
- **Port 3000 in use** - Change `"3000:3000"` to `"3001:3000"` in `docker-compose.yml`, then open http://localhost:3001.
- **Changes not appearing** - Save the file, wait a few seconds. If still stale, restart with `docker compose up`.
- **Full reset** - Run `docker compose down --volumes` then `docker compose up --build`.
- **Node version error (without Docker)** - Install exactly Node.js 20.20.0 using nvm.

### Tech Stack

- Next.js 16.1.6 (App Router)
- React 19
- TypeScript 5.7
- Node.js 20.20.0
- jQuery + DataTables (admin pages)
- Select2 (admin dropdowns)
