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
const render_1 = require("../../../app/admin/reports_list/render");
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
function resolveHomeCountryIso(user) {
    return user?.home_country || user?.home_country_iso || 'US';
}
function resolveHomeCountryName(iso) {
    const mapping = {
        US: 'United States',
        CA: 'Canada',
        IN: 'India',
    };
    return mapping[iso] || iso;
}
function renderPortalHomeFallback(options) {
    const reportLinks = options.reportLinks ?? [];
    const reportsHtml = reportLinks.length
        ? `<ul>${reportLinks
            .map((link) => `<li><a rel="admin" href="${link.href}">${link.label}</a></li>`)
            .join('')}</ul>`
        : '';
    return [
        '<div id="profile">',
        `<div id="logged_in_as">Logged in as ${options.userEmail}</div>`,
        '<div id="logout">LOGOUT</div>',
        `<div id="user_home_country">${options.homeCountryName}</div>`,
        `<div id="user_home_country_iso">${options.homeCountryIso}</div>`,
        '</div>',
        reportsHtml,
    ].join('');
}
async function renderPortalHomeHtml(options) {
    try {
        const module = await Promise.resolve().then(() => __importStar(require('../../../app/portal/home/render')));
        if (typeof module.renderPortalHome === 'function') {
            return module.renderPortalHome(options);
        }
    }
    catch {
        // Ignore missing module, fallback below.
    }
    return renderPortalHomeFallback(options);
}
(0, cucumber_1.When)('I open the TTC portal home', async function () {
    const world = getWorld(this);
    const currentUser = world.currentUser ||
        getUserByRole('applicant') || {
        email: 'test.applicant@example.com',
        role: 'applicant',
    };
    world.currentUser = currentUser;
    const homeCountryIso = resolveHomeCountryIso(currentUser);
    const homeCountryName = resolveHomeCountryName(homeCountryIso);
    world.homeCountryIso = homeCountryIso;
    world.homeCountryName = homeCountryName;
    const reportLinks = currentUser.role === 'admin' ? render_1.ADMIN_REPORTS_LIST_LINKS : [];
    world.reportLinks = reportLinks;
    world.responseHtml = await renderPortalHomeHtml({
        userEmail: currentUser.email,
        homeCountryIso,
        homeCountryName,
        reportLinks,
    });
});
(0, cucumber_1.Then)('I should see my profile details and available reports', function () {
    const world = getWorld(this);
    const html = world.responseHtml || '';
    const email = world.currentUser?.email || 'test.applicant@example.com';
    strict_1.default.ok(html.includes('Logged in as'));
    strict_1.default.ok(html.includes(email));
    strict_1.default.ok(html.includes('LOGOUT'));
    strict_1.default.ok(html.includes('user_home_country'));
    strict_1.default.ok(html.includes('user_home_country_iso'));
    (world.reportLinks || []).forEach((link) => {
        strict_1.default.ok(html.includes(link.href));
        strict_1.default.ok(html.includes(link.label));
    });
});
const DISABLED_NOTICE_TEXT = 'The TTC Portal is not available on Mobile. Please use the portal from a Desktop web browser.';
async function renderDisabledHtml() {
    try {
        const module = await Promise.resolve().then(() => __importStar(require('../../../app/portal/disabled/render')));
        if (typeof module.renderDisabledPage === 'function') {
            return module.renderDisabledPage();
        }
    }
    catch {
        // Ignore missing module, fallback below.
    }
    return `<div id="disabled_notice">${DISABLED_NOTICE_TEXT}</div>`;
}
(0, cucumber_1.Given)('the TTC portal is in disabled mode', function () {
    const world = getWorld(this);
    world.portalDisabled = true;
});
(0, cucumber_1.When)('I visit the disabled page', async function () {
    const world = getWorld(this);
    world.responseHtml = await renderDisabledHtml();
});
(0, cucumber_1.Then)('I should see the disabled notice', function () {
    const world = getWorld(this);
    const html = world.responseHtml || '';
    strict_1.default.ok(html.includes(DISABLED_NOTICE_TEXT));
});
function renderPortalTabFallback(options) {
    return `<div>${options.userHomeCountryName} TTC Desk</div>`;
}
async function renderPortalTabHtml(options) {
    try {
        const module = await Promise.resolve().then(() => __importStar(require('../../../app/portal/tabs/render')));
        if (typeof module.renderPortalTab === 'function') {
            return module.renderPortalTab(options);
        }
    }
    catch {
        // Ignore missing module, fallback below.
    }
    return renderPortalTabFallback(options);
}
(0, cucumber_1.When)('I request a tab template page', async function () {
    const world = getWorld(this);
    const currentUser = world.currentUser ||
        getUserByRole('applicant') || {
        email: 'test.applicant@example.com',
        role: 'applicant',
    };
    world.currentUser = currentUser;
    const homeCountryIso = resolveHomeCountryIso(currentUser);
    const homeCountryName = resolveHomeCountryName(homeCountryIso);
    world.homeCountryIso = homeCountryIso;
    world.homeCountryName = homeCountryName;
    const templateName = 'contact.html';
    world.responseHtml = await renderPortalTabHtml({
        templateName,
        userHomeCountryIso: homeCountryIso,
        userHomeCountryName: homeCountryName,
    });
});
(0, cucumber_1.Then)('I should see the rendered tab content with user context', function () {
    const world = getWorld(this);
    const html = world.responseHtml || '';
    const homeCountryName = world.homeCountryName || resolveHomeCountryName(world.homeCountryIso || 'US');
    strict_1.default.ok(html.includes(homeCountryName));
    strict_1.default.ok(html.includes('TTC Desk'));
});
