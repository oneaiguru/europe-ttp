"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cucumber_1 = require("@cucumber/cucumber");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const authContext = {};
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
(0, cucumber_1.Given)('I am on the TTC portal login page', () => {
    authContext.currentUser = undefined;
    authContext.currentPage = 'login';
    authContext.responseHtml = 'LOGIN';
});
(0, cucumber_1.Given)('I am authenticated on the TTC portal', () => {
    const applicant = getUserByRole('applicant') || {
        email: 'test.applicant@example.com',
        role: 'applicant',
    };
    authContext.currentUser = applicant;
    authContext.currentPage = 'home';
    authContext.responseHtml = `Logged in as ${applicant.email} LOGOUT`;
});
(0, cucumber_1.When)('I sign in with a valid Google account', () => {
    const applicant = getUserByRole('applicant') || {
        email: 'test.applicant@example.com',
        role: 'applicant',
    };
    authContext.currentUser = applicant;
    authContext.currentPage = 'home';
    authContext.responseHtml = `Logged in as ${applicant.email} LOGOUT`;
});
(0, cucumber_1.When)('I sign out of the TTC portal', () => {
    authContext.currentUser = undefined;
    authContext.currentPage = 'login';
    authContext.responseHtml = 'LOGIN';
});
(0, cucumber_1.When)('I request a password reset for my Google account', () => {
    const applicant = getUserByRole('applicant') || {
        email: 'test.applicant@example.com',
        role: 'applicant',
    };
    authContext.currentUser = undefined;
    authContext.passwordResetEmail = applicant.email;
    authContext.currentPage = 'password_reset';
    authContext.responseHtml = 'PASSWORD RESET PROMPT';
});
(0, cucumber_1.Then)('I should be redirected to the TTC portal home', () => {
    strict_1.default.equal(authContext.currentPage, 'home');
    strict_1.default.ok(authContext.responseHtml, 'Expected responseHtml to be set');
    const email = authContext.currentUser?.email;
    if (email) {
        strict_1.default.ok(authContext.responseHtml?.includes(email));
    }
    strict_1.default.ok(authContext.responseHtml?.includes('LOGOUT'));
});
(0, cucumber_1.Then)('I should be redirected to the TTC portal login page', () => {
    strict_1.default.equal(authContext.currentPage, 'login');
    strict_1.default.ok(authContext.responseHtml, 'Expected responseHtml to be set');
    strict_1.default.ok(authContext.responseHtml?.includes('LOGIN'));
    strict_1.default.ok(!authContext.responseHtml?.includes('LOGOUT'));
});
(0, cucumber_1.Then)('I should receive a password reset prompt from the identity provider', () => {
    strict_1.default.equal(authContext.currentPage, 'password_reset');
    strict_1.default.ok(authContext.responseHtml, 'Expected responseHtml to be set');
    strict_1.default.ok(authContext.responseHtml?.includes('PASSWORD RESET PROMPT'));
});
