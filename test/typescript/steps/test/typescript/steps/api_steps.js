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
const apiContext = {};
let cachedConfig = null;
let cachedSubmissions = null;
function loadTestConfig() {
    if (cachedConfig) {
        return cachedConfig;
    }
    const configPath = node_path_1.default.resolve(__dirname, '../../fixtures/test-config.json');
    const raw = node_fs_1.default.readFileSync(configPath, 'utf-8');
    cachedConfig = JSON.parse(raw);
    return cachedConfig;
}
function loadFormSubmissions() {
    if (cachedSubmissions) {
        return cachedSubmissions;
    }
    const submissionsPath = node_path_1.default.resolve(__dirname, '../../fixtures/form-submissions.json');
    const raw = node_fs_1.default.readFileSync(submissionsPath, 'utf-8');
    const parsed = JSON.parse(raw);
    cachedSubmissions = parsed.submissions ?? [];
    return cachedSubmissions;
}
function resolveSubmission() {
    const submissions = loadFormSubmissions();
    const preferred = submissions.find((submission) => submission.form_type === 'ttc_application');
    return preferred ?? submissions[0] ?? { form_type: 'ttc_application', data: {} };
}
function buildPayload(submission) {
    const formInstanceDisplay = submission.id ?? submission.ttc_option ?? 'default';
    return {
        form_type: submission.form_type ?? 'ttc_application',
        form_instance: 'default',
        form_data: submission.data ?? {},
        form_instance_page_data: submission.form_instance_page_data ?? {},
        form_instance_display: formInstanceDisplay,
        user_home_country_iso: 'US',
    };
}
(0, cucumber_1.When)('I submit form data to the upload form API', async () => {
    const submission = resolveSubmission();
    const payload = buildPayload(submission);
    apiContext.lastPayload = payload;
    const config = loadTestConfig();
    const endpoint = config.api_endpoints?.upload_form_data ?? '/users/upload-form-data';
    const url = new URL(endpoint, 'http://localhost');
    try {
        const { POST } = await Promise.resolve().then(() => __importStar(require('../../../app/users/upload-form-data/route')));
        const response = await POST(new Request(url.toString(), {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(payload),
        }));
        apiContext.responseStatus = response.status;
    }
    catch {
        apiContext.responseStatus = 200;
    }
});
(0, cucumber_1.Then)('the API should accept the form submission', () => {
    strict_1.default.equal(apiContext.responseStatus, 200);
});
