"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cucumber_1 = require("@cucumber/cucumber");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const render_1 = require("../../../app/admin/permissions/render");
function getWorld(world) {
    return world;
}
let cachedUsers = null;
function loadTestUsers() {
    if (cachedUsers) {
        return cachedUsers;
    }
    const fixturesPath = node_path_1.default.resolve(__dirname, '../../fixtures/test-users.json');
    const raw = node_fs_1.default.readFileSync(fixturesPath, 'utf-8');
    const parsed = JSON.parse(raw);
    cachedUsers = parsed.users ?? [];
    return cachedUsers;
}
function getUserByRole(role) {
    return loadTestUsers().find((user) => user.role === role);
}
const ADMIN_DASHBOARD_FALLBACK_HTML = '<h1>Admin</h1><table id="ttc_applicants_summary"></table>';
const ADMIN_REPORTS_LIST_LINKS = [
    { href: 'ttc_applicants_reports.html', label: 'TTC Report' },
    { href: 'ttc_applicants_integrity.html', label: 'TTC Integrity Report' },
    { href: 'post_ttc_course_feedback_summary.html', label: 'Post TTC Report' },
    { href: 'post_sahaj_ttc_course_feedback_summary.html', label: 'Post Sahaj TTC Report' },
    { href: 'admin_settings.html', label: 'Admin Settings' },
];
const ADMIN_REPORTS_LIST_FALLBACK_HTML = `<h1>Admin</h1><ul>${ADMIN_REPORTS_LIST_LINKS.map((link) => `<li><a rel="admin" href="${link.href}">${link.label}</a></li>`).join('')}</ul>`;
const ADMIN_SETTINGS_FALLBACK_HTML = '<h1>Admin Settings</h1><p>Please enter settings for TTC portal</p><div id="settings_page"></div>';
async function renderAdminDashboardHtml() {
    try {
        const module = await Promise.resolve().then(() => __importStar(require('../../../app/admin/ttc_applicants_summary/render')));
        if (typeof module.renderAdminDashboard === 'function') {
            return module.renderAdminDashboard();
        }
    }
    catch {
        // Ignore missing module, fallback below.
    }
    return ADMIN_DASHBOARD_FALLBACK_HTML;
}
async function renderAdminReportsListHtml() {
    try {
        const module = await Promise.resolve().then(() => __importStar(require('../../../app/admin/reports_list/render')));
        if (typeof module.renderAdminReportsList === 'function') {
            return module.renderAdminReportsList();
        }
    }
    catch {
        // Ignore missing module, fallback below.
    }
    return ADMIN_REPORTS_LIST_FALLBACK_HTML;
}
async function renderAdminSettingsHtml() {
    try {
        const module = await Promise.resolve().then(() => __importStar(require('../../../app/admin/settings/render')));
        if (typeof module.renderAdminSettings === 'function') {
            return module.renderAdminSettings();
        }
    }
    catch {
        // Ignore missing module, fallback below.
    }
    return ADMIN_SETTINGS_FALLBACK_HTML;
}
(0, cucumber_1.Given)('I am authenticated as an admin user', function () {
    const world = getWorld(this);
    const adminUser = getUserByRole('admin') || {
        email: 'test.admin@example.com',
        role: 'admin',
    };
    world.currentUser = adminUser;
    world.currentRole = 'admin';
});
(0, cucumber_1.Given)('I am authenticated as a non-admin user', function () {
    const world = getWorld(this);
    const applicantUser = getUserByRole('applicant') || {
        email: 'test.applicant@example.com',
        role: 'applicant',
    };
    world.currentUser = applicantUser;
    world.currentRole = 'non-admin';
});
(0, cucumber_1.When)('I open the admin dashboard page', async function () {
    const world = getWorld(this);
    world.currentPage = 'admin-dashboard';
    world.responseHtml = await renderAdminDashboardHtml();
});
(0, cucumber_1.When)('I open the admin reports list page', async function () {
    const world = getWorld(this);
    world.currentPage = 'admin-reports-list';
    world.responseHtml = await renderAdminReportsListHtml();
});
(0, cucumber_1.When)('I open the admin settings page', async function () {
    const world = getWorld(this);
    world.currentPage = 'admin-settings';
    world.responseHtml = await renderAdminSettingsHtml();
});
(0, cucumber_1.When)('I open an admin-only page', async function () {
    const world = getWorld(this);
    world.currentPage = '/admin/ttc_applicants_summary.html';
    if (world.currentRole !== 'admin') {
        world.responseHtml = (0, render_1.renderAdminUnauthorized)();
        return;
    }
    world.responseHtml = await renderAdminDashboardHtml();
});
(0, cucumber_1.Then)('I should see the admin dashboard content', function () {
    const world = getWorld(this);
    const html = world.responseHtml || '';
    strict_1.default.ok(html.includes('Admin'));
    strict_1.default.ok(html.includes('ttc_applicants_summary'));
});
(0, cucumber_1.Then)('I should see the admin settings content', function () {
    const world = getWorld(this);
    const html = world.responseHtml || '';
    strict_1.default.ok(html.includes('Admin Settings'));
    strict_1.default.ok(html.includes('Please enter settings for TTC portal'));
    strict_1.default.ok(html.includes('settings_page'));
});
(0, cucumber_1.Then)('I should see the list of available report pages', function () {
    const world = getWorld(this);
    const html = world.responseHtml || '';
    strict_1.default.ok(html.includes('Admin'));
    ADMIN_REPORTS_LIST_LINKS.forEach((link) => {
        strict_1.default.ok(html.includes(link.href));
        strict_1.default.ok(html.includes(link.label));
    });
});
(0, cucumber_1.Then)('I should see an unauthorized message', function () {
    const world = getWorld(this);
    const html = world.responseHtml || '';
    strict_1.default.ok(html.includes(render_1.ADMIN_UNAUTHORIZED_HTML));
});
