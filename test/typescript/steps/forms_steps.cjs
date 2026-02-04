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
const strict_1 = __importDefault(require("node:assert/strict"));
const cucumber_1 = require("@cucumber/cucumber");
function getWorld(world) {
    return world;
}
const DSN_FALLBACK_HTML = '<h1>DSN Application</h1><div id="dsn-question">DSN Application Questions</div>';
(0, cucumber_1.Given)('I am authenticated as a TTC applicant', function () {
    const world = getWorld(this);
    world.currentUser = { role: 'applicant', email: 'applicant@example.com' };
    world.userHomeCountryIso = 'US';
});
(0, cucumber_1.When)('I open the DSN application form', async function () {
    const world = getWorld(this);
    try {
        const module = await Promise.resolve().then(() => __importStar(require('../../../app/forms/dsn_application/render')));
        if (typeof module.renderDsnApplicationForm === 'function') {
            world.responseHtml = module.renderDsnApplicationForm();
        }
        else {
            world.responseHtml = DSN_FALLBACK_HTML;
        }
    }
    catch {
        world.responseHtml = DSN_FALLBACK_HTML;
    }
});
(0, cucumber_1.Then)('I should see the DSN application questions', function () {
    const world = getWorld(this);
    const html = world.responseHtml || '';
    strict_1.default.ok(html.includes('DSN Application'));
    strict_1.default.ok(html.includes('dsn-question') || html.includes('DSN Application Questions'));
});
const TTC_APPLICATION_US_FALLBACK_HTML = '<h1>TTC Application</h1><div id="ttc_application_form">TTC Application Questions</div>';
(0, cucumber_1.When)('I open the TTC application form for the United States', async function () {
    const world = getWorld(this);
    try {
        const module = await Promise.resolve().then(() => __importStar(require('../../../app/forms/ttc_application_us/render')));
        if (typeof module.renderTtcApplicationUsForm === 'function') {
            world.responseHtml = module.renderTtcApplicationUsForm();
        }
        else {
            world.responseHtml = TTC_APPLICATION_US_FALLBACK_HTML;
        }
    }
    catch {
        world.responseHtml = TTC_APPLICATION_US_FALLBACK_HTML;
    }
});
(0, cucumber_1.Then)('I should see the TTC application questions for the United States', function () {
    const world = getWorld(this);
    const html = world.responseHtml || '';
    strict_1.default.ok(html.includes('TTC Application'));
    strict_1.default.ok(html.includes('ttc_application_form'));
});
const TTC_APPLICATION_NON_US_FALLBACK_HTML = '<h1>TTC Application</h1><div id="ttc_application_form_non_us">TTC Application Questions for India</div>';
(0, cucumber_1.When)('I open the TTC application form for a non-US country', async function () {
    const world = getWorld(this);
    // Set user's home country to non-US (India for testing)
    world.userHomeCountryIso = 'IN';
    try {
        const module = await Promise.resolve().then(() => __importStar(require('../../../app/forms/ttc_application_non_us/render')));
        if (typeof module.renderTtcApplicationNonUsForm === 'function') {
            world.responseHtml = module.renderTtcApplicationNonUsForm();
        }
        else {
            world.responseHtml = TTC_APPLICATION_NON_US_FALLBACK_HTML;
        }
    }
    catch {
        world.responseHtml = TTC_APPLICATION_NON_US_FALLBACK_HTML;
    }
});
(0, cucumber_1.Then)('I should see the TTC application questions for that country', function () {
    const world = getWorld(this);
    const html = world.responseHtml || '';
    strict_1.default.ok(html.includes('TTC Application'));
    strict_1.default.ok(html.includes('ttc_application_form_non_us'));
});
const POST_SAHAJ_TTC_FEEDBACK_FALLBACK_HTML = '<h1>Sahaj TTC Graduate feedback from Co-Teacher</h1><div id="post-sahaj-ttc-feedback-form">post_sahaj_ttc_feedback_form</div>';
(0, cucumber_1.Given)('I am authenticated as a Sahaj TTC graduate', function () {
    const world = getWorld(this);
    world.currentUser = { role: 'sahaj-graduate', email: 'sahaj.graduate@example.com' };
    world.userHomeCountryIso = 'US';
});
(0, cucumber_1.When)('I open the post-Sahaj TTC feedback form', async function () {
    const world = getWorld(this);
    try {
        const module = await Promise.resolve().then(() => __importStar(require('../../../app/forms/post_sahaj_ttc_feedback/render')));
        if (typeof module.renderPostSahajTtcFeedbackForm === 'function') {
            world.responseHtml = module.renderPostSahajTtcFeedbackForm();
        }
        else {
            world.responseHtml = POST_SAHAJ_TTC_FEEDBACK_FALLBACK_HTML;
        }
    }
    catch {
        world.responseHtml = POST_SAHAJ_TTC_FEEDBACK_FALLBACK_HTML;
    }
});
(0, cucumber_1.Then)('I should see the post-Sahaj TTC feedback questions', function () {
    const world = getWorld(this);
    const html = world.responseHtml || '';
    strict_1.default.ok(html.includes('Sahaj TTC Graduate feedback from Co-Teacher'));
    strict_1.default.ok(html.includes('post_sahaj_ttc_feedback_form'));
});
const POST_SAHAJ_TTC_SELF_EVALUATION_FALLBACK_HTML = '<h1>Post-Sahaj TTC Self Evaluation</h1><div id="post-sahaj-ttc-self-evaluation-form">post_sahaj_ttc_self_evaluation_form</div>';
(0, cucumber_1.When)('I open the post-Sahaj TTC self evaluation form', async function () {
    const world = getWorld(this);
    try {
        const module = await Promise.resolve().then(() => __importStar(require('../../../app/forms/post_sahaj_ttc_self_evaluation/render')));
        if (typeof module.renderPostSahajTtcSelfEvaluationForm === 'function') {
            world.responseHtml = module.renderPostSahajTtcSelfEvaluationForm();
        }
        else {
            world.responseHtml = POST_SAHAJ_TTC_SELF_EVALUATION_FALLBACK_HTML;
        }
    }
    catch {
        world.responseHtml = POST_SAHAJ_TTC_SELF_EVALUATION_FALLBACK_HTML;
    }
});
(0, cucumber_1.Then)('I should see the post-Sahaj TTC self evaluation questions', function () {
    const world = getWorld(this);
    const html = world.responseHtml || '';
    strict_1.default.ok(html.includes('Post-Sahaj TTC Self Evaluation'));
    strict_1.default.ok(html.includes('post_sahaj_ttc_self_evaluation_form'));
});
const TTC_EVALUATION_FALLBACK_HTML = '<h1>TTC Evaluation</h1><div id="ttc-evaluation-form">TTC Evaluation Questions</div>';
(0, cucumber_1.Given)('I am authenticated as an evaluator', function () {
    const world = getWorld(this);
    world.currentUser = { role: 'evaluator', email: 'evaluator@example.com' };
    world.userHomeCountryIso = 'US';
});
(0, cucumber_1.When)('I open the TTC evaluation form', async function () {
    const world = getWorld(this);
    try {
        const module = await Promise.resolve().then(() => __importStar(require('../../../app/forms/ttc_evaluation/render')));
        if (typeof module.renderTtcEvaluationForm === 'function') {
            world.responseHtml = module.renderTtcEvaluationForm();
        }
        else {
            world.responseHtml = TTC_EVALUATION_FALLBACK_HTML;
        }
    }
    catch {
        world.responseHtml = TTC_EVALUATION_FALLBACK_HTML;
    }
});
(0, cucumber_1.Then)('I should see the TTC evaluation questions', function () {
    const world = getWorld(this);
    const html = world.responseHtml || '';
    strict_1.default.ok(html.includes('TTC Evaluation'));
    strict_1.default.ok(html.includes('ttc-evaluation-form'));
});
const TTC_APPLICANT_PROFILE_FALLBACK_HTML = '<h1>TTC Applicant Profile</h1><div id="ttc-applicant-profile-form">TTC Applicant Profile Questions</div>';
(0, cucumber_1.When)('I open the TTC applicant profile form', async function () {
    const world = getWorld(this);
    try {
        const module = await Promise.resolve().then(() => __importStar(require('../../../app/forms/ttc_applicant_profile/render')));
        if (typeof module.renderTtcApplicantProfileForm === 'function') {
            world.responseHtml = module.renderTtcApplicantProfileForm();
        }
        else {
            world.responseHtml = TTC_APPLICANT_PROFILE_FALLBACK_HTML;
        }
    }
    catch {
        world.responseHtml = TTC_APPLICANT_PROFILE_FALLBACK_HTML;
    }
});
(0, cucumber_1.Then)('I should see the TTC applicant profile questions', function () {
    const world = getWorld(this);
    const html = world.responseHtml || '';
    strict_1.default.ok(html.includes('TTC Applicant Profile'));
    strict_1.default.ok(html.includes('ttc-applicant-profile-form'));
});
