/**
 * Mock data for admin pages — enables visual verification without a backend.
 *
 * These data shapes match what the original Python backend returns.
 * Each admin page's client-side JS makes AJAX calls that resolve to
 * Next.js API routes serving this data.
 */

// --- Summary page: reporting/user-summary/get-by-form-type ---

export const MOCK_SUMMARY_DATA = {
  ttc_application: {
    default: {
      "maria.garcia@example.com": {
        data: {
          i_fname: "Maria",
          i_lname: "Garcia",
          i_cellphone: "+1-555-0101",
          i_homephone: "+1-555-0201",
          i_address_city: "Barcelona",
          i_address_state: "Catalonia",
        },
        reporting_status: "complete",
        evaluations_reporting_status: "complete",
        evaluations: [
          {
            data: {
              i_name: "Jean Dupont",
              i_email_aol: "jean.dupont@example.com",
              i_volunteer_name: "Maria Garcia",
              i_volunteer_email: "maria.garcia@example.com",
            },
            reporting_status: "complete",
            email: "jean.dupont@example.com",
            form_instance: "eval-001",
          },
          {
            data: {
              i_name: "Anna Müller",
              i_email_aol: "anna.muller@example.com",
              i_volunteer_name: "Maria Garcia",
              i_volunteer_email: "maria.garcia@example.com",
            },
            reporting_status: "submitted",
            email: "anna.muller@example.com",
            form_instance: "eval-002",
          },
        ],
        lifetime_evaluations: [
          {
            data: {
              i_name: "Jean Dupont",
              i_email_aol: "jean.dupont@example.com",
              i_volunteer_name: "Maria Garcia",
              i_volunteer_email: "maria.garcia@example.com",
            },
            reporting_status: "complete",
            email: "jean.dupont@example.com",
            form_instance: "eval-001",
            ttc_metadata: { display: "Europe TTC (Jan 2026)" },
          },
        ],
        form_instance: "app-001",
        last_update_datetime_est: "03/28/2026 14:30",
      },
      "peter.schmidt@example.com": {
        data: {
          i_fname: "Peter",
          i_lname: "Schmidt",
          i_cellphone: "+49-555-0102",
          i_homephone: "+49-555-0202",
          i_address_city: "Munich",
          i_address_state: "Bavaria",
        },
        reporting_status: "submitted",
        evaluations_reporting_status: "pending",
        evaluations: [
          {
            data: {
              i_name: "Sofia Rossi",
              i_email_aol: "sofia.rossi@example.com",
              i_volunteer_name: "Peter Schmidt",
              i_volunteer_email: "peter.schmidt@example.com",
            },
            reporting_status: "pending",
            email: "sofia.rossi@example.com",
            form_instance: "eval-003",
          },
        ],
        lifetime_evaluations: [],
        form_instance: "app-002",
        last_update_datetime_est: "04/01/2026 09:15",
      },
      "elena.popov@example.com": {
        data: {
          i_fname: "Elena",
          i_lname: "Popov",
          i_cellphone: "+33-555-0103",
          i_homephone: "",
          i_address_city: "Paris",
          i_address_state: "Île-de-France",
        },
        reporting_status: "in progress",
        evaluations_reporting_status: "not started",
        evaluations: [],
        lifetime_evaluations: [],
        form_instance: "app-003",
        last_update_datetime_est: "04/03/2026 16:45",
      },
      "james.wilson@example.com": {
        data: {
          i_fname: "James",
          i_lname: "Wilson",
          i_cellphone: "+44-555-0104",
          i_homephone: "+44-555-0204",
          i_address_city: "London",
          i_address_state: "England",
        },
        reporting_status: "complete",
        evaluations_reporting_status: "submitted",
        evaluations: [
          {
            data: {
              i_name: "Lars Eriksson",
              i_email_aol: "lars.eriksson@example.com",
              i_volunteer_name: "James Wilson",
              i_volunteer_email: "james.wilson@example.com",
            },
            reporting_status: "submitted",
            email: "lars.eriksson@example.com",
            form_instance: "eval-004",
          },
        ],
        lifetime_evaluations: [],
        form_instance: "app-004",
        last_update_datetime_est: "03/30/2026 11:20",
      },
      "katarina.novak@example.com": {
        data: {
          i_fname: "Katarina",
          i_lname: "Novak",
          i_cellphone: "+386-555-0105",
          i_homephone: "+386-555-0205",
          i_address_city: "Ljubljana",
          i_address_state: "Central Slovenia",
        },
        reporting_status: "pending",
        evaluations_reporting_status: "",
        evaluations: [],
        lifetime_evaluations: [],
        form_instance: "app-005",
        last_update_datetime_est: "04/04/2026 08:00",
      },
    },
  },
  ttc_evaluation: {
    default: {},
  },
};

// --- Reports page: reporting/user-summary/get-by-user ---

export const MOCK_REPORTS_DATA: Record<string, Record<string, Record<string, unknown>>> = {
  "maria.garcia@example.com": {
    ttc_application: {
      // Top-level reporting for lifetime data (sibling of TTC keys)
      reporting: {
        lifetime_evaluations: {},
        lifetime_eval_teaching_readiness: {},
        lifetime_evaluator_ratings_below_3: 0,
        lifetime_eval_teaching_readiness_not_ready_now_count: 0,
      } as unknown as Record<string, unknown>,
      default: {
        data: {
          i_fname: "Maria",
          i_lname: "Garcia",
          i_gender: "Female",
          i_cellphone: "+1-555-0101",
          i_homephone: "+1-555-0201",
          i_address_city: "Barcelona",
          i_address_state: "Catalonia",
          i_date_of_birth: "1988-06-15",
          i_enrollment: 45,
          i_last1year_introtalks: 12,
          i_prettc_date: "Jan26",
          i_prettc_teacher: "Dr. Kumar",
          i_prettc_location: "Barcelona Centre",
          i_youthteacher: "No",
          i_course_wishlist_yp: true,
          i_course_wishlist_hp: true,
          i_course_wishlist_yes: false,
          i_course_wishlist_artexcel: false,
          i_course_organized_count: 8,
          i_course_assisted_count: 15,
        },
        form_instance_page_data: {
          i_ttc_country_and_dates: JSON.stringify([
            { value: "default", display: "Europe (Jan 2026 - Feb 2026)", display_until: "2026-03-01" },
          ]),
        },
        last_update_datetime_est: "03/28/2026 14:30",
        form_instance: "app-001",
        reporting: {
          reporting_status: "complete",
          enrolled_people_count: 45,
          prereq_no_count: 0,
          eval_teaching_readiness_not_ready_now_count: 0,
          evaluator_ratings_below_3: 0,
          org_courses_count: 8,
          prettc_date_to_deadline_days: 30,
          evaluations: {},
        },
      },
    },
  },
  "peter.schmidt@example.com": {
    ttc_application: {
      reporting: {
        lifetime_evaluations: {},
        lifetime_eval_teaching_readiness: {},
        lifetime_evaluator_ratings_below_3: 0,
        lifetime_eval_teaching_readiness_not_ready_now_count: 0,
      } as unknown as Record<string, unknown>,
      default: {
        data: {
          i_fname: "Peter",
          i_lname: "Schmidt",
          i_gender: "Male",
          i_cellphone: "+49-555-0102",
          i_homephone: "+49-555-0202",
          i_address_city: "Munich",
          i_address_state: "Bavaria",
          i_date_of_birth: "1992-03-22",
          i_enrollment: 30,
          i_last1year_introtalks: 6,
          i_prettc_date: "Feb26",
          i_prettc_teacher: "Ms. Patel",
          i_prettc_location: "Munich Center",
          i_youthteacher: "Yes",
          i_course_wishlist_yp: false,
          i_course_wishlist_hp: true,
          i_course_wishlist_yes: true,
          i_course_wishlist_artexcel: false,
          i_course_organized_count: 3,
          i_course_assisted_count: 7,
        },
        form_instance_page_data: {
          i_ttc_country_and_dates: JSON.stringify([
            { value: "default", display: "Europe (Jan 2026 - Feb 2026)", display_until: "2026-03-01" },
          ]),
        },
        last_update_datetime_est: "04/01/2026 09:15",
        form_instance: "app-002",
        reporting: {
          reporting_status: "submitted",
          enrolled_people_count: 30,
          prereq_no_count: 2,
          eval_teaching_readiness_not_ready_now_count: 0,
          evaluator_ratings_below_3: 1,
          org_courses_count: 3,
          prettc_date_to_deadline_days: 60,
          evaluations: {},
        },
      },
    },
  },
  "elena.popov@example.com": {
    ttc_application: {
      reporting: {
        lifetime_evaluations: {},
        lifetime_eval_teaching_readiness: {},
        lifetime_evaluator_ratings_below_3: 0,
        lifetime_eval_teaching_readiness_not_ready_now_count: 0,
      } as unknown as Record<string, unknown>,
      default: {
        data: {
          i_fname: "Elena",
          i_lname: "Popov",
          i_gender: "Female",
          i_cellphone: "+33-555-0103",
          i_homephone: "",
          i_address_city: "Paris",
          i_address_state: "Île-de-France",
          i_date_of_birth: "1995-11-08",
          i_enrollment: 20,
          i_last1year_introtalks: 3,
          i_prettc_date: "Mar26",
          i_prettc_teacher: "Sri Ravi",
          i_prettc_location: "Paris Ashram",
          i_youthteacher: "No",
          i_course_wishlist_yp: true,
          i_course_wishlist_hp: false,
          i_course_wishlist_yes: false,
          i_course_wishlist_artexcel: true,
          i_course_organized_count: 1,
          i_course_assisted_count: 4,
        },
        form_instance_page_data: {
          i_ttc_country_and_dates: JSON.stringify([
            { value: "default", display: "Europe (Jan 2026 - Feb 2026)", display_until: "2026-03-01" },
          ]),
        },
        last_update_datetime_est: "04/03/2026 16:45",
        form_instance: "app-003",
        reporting: {
          reporting_status: "in progress",
          enrolled_people_count: 20,
          prereq_no_count: 1,
          eval_teaching_readiness_not_ready_now_count: 1,
          evaluator_ratings_below_3: 0,
          org_courses_count: 1,
          prettc_date_to_deadline_days: 90,
          evaluations: {},
        },
      },
    },
  },
};

// --- Integrity page: integrity/user-integrity/get-by-user ---

export const MOCK_INTEGRITY_DATA: Record<string, Record<string, unknown>> = {
  "maria.garcia@example.com": {
    ttc_application: {
      default: {
        data: {
          i_fname: "Maria",
          i_lname: "Garcia",
          i_enrolled_people: { p1: "John", p2: "Sarah", p3: "Mike" },
          i_org_courses: { c1: "HP Barcelona", c2: "YES Paris" },
        },
        last_update_datetime_est: "03/28/2026 14:30",
        form_instance: "app-001",
      },
      integrity: {
        enrolled_matches: {
          "peter.schmidt@example.com": ["John (enrolled by both applicants)"],
        },
        org_course_matches: {},
      },
    },
  },
  "peter.schmidt@example.com": {
    ttc_application: {
      default: {
        data: {
          i_fname: "Peter",
          i_lname: "Schmidt",
          i_enrolled_people: { p1: "John", p2: "Anna" },
          i_org_courses: { c1: "HP Munich" },
        },
        last_update_datetime_est: "04/01/2026 09:15",
        form_instance: "app-002",
      },
      integrity: {
        enrolled_matches: {
          "maria.garcia@example.com": ["John (enrolled by both applicants)"],
        },
        org_course_matches: {},
      },
    },
  },
  "elena.popov@example.com": {
    ttc_application: {
      default: {
        data: {
          i_fname: "Elena",
          i_lname: "Popov",
          i_enrolled_people: { p1: "Claire", p2: "Marc" },
          i_org_courses: { c1: "ArtExcel Paris" },
        },
        last_update_datetime_est: "04/03/2026 16:45",
        form_instance: "app-003",
      },
      integrity: {
        enrolled_matches: {},
        org_course_matches: {},
      },
    },
  },
};

// --- Settings page: admin/get-config ---

export const MOCK_SETTINGS_DATA = {
  i_whitelisted_user: [
    {
      i_whitelisted_user_name: "Admin User",
      i_whitelisted_user_email: "admin@example.com",
    },
    {
      i_whitelisted_user_name: "Test Coordinator",
      i_whitelisted_user_email: "coordinator@example.com",
    },
  ],
};

// --- Post TTC Feedback: reporting/user-summary/get-by-user (filtered for post_ttc forms) ---

export const MOCK_POST_TTC_FEEDBACK_DATA: Record<string, Record<string, unknown>> = {
  "maria.garcia@example.com": {
    post_ttc_self_evaluation_form: {
      // reporting key at top level — JS iterates _self_evaluations['reporting']['evaluations']
      reporting: {
        evaluations: {
          jean_dupont: {
            "self-eval-001": {
              "jean.dupont@example.com": true,
            },
          },
        },
      },
      // Form instances as sibling keys
      "self-eval-001": {
        data: {
          i_fname: "Maria",
          i_lname: "Garcia",
          i_ttc_dates: "Jan 2026 - Feb 2026",
          i_ttc_location: "Barcelona Centre",
          i_cellphone: "+1-555-0101",
          i_homephone: "+1-555-0201",
          i_course_start: "2026-01-15",
        },
        reporting: {
          reporting_status: "complete",
        },
      },
    },
  },
  // Evaluator's feedback form data — accessed via user_data[evaluator_type].post_ttc_feedback_form
  "jean_dupont": {
    post_ttc_feedback_form: {
      "self-eval-001": {
        "jean.dupont@example.com": {
          data: {
            i_fname: "Jean",
            i_lname: "Dupont",
            i_email_aol: "jean.dupont@example.com",
            i_ttc_graduate_name: "Maria Garcia",
            i_ttc_graduate_email: "maria.garcia@example.com",
            i_course_start: "2026-01-15",
          },
          email: "jean.dupont@example.com",
          form_instance: "feedback-001",
          reporting: {
            reporting_status: "complete",
            is_reporting_matched: "Y",
          },
        },
      },
    },
  },
  "peter.schmidt@example.com": {
    post_ttc_self_evaluation_form: {
      reporting: {
        evaluations: {},
      },
      "self-eval-002": {
        data: {
          i_fname: "Peter",
          i_lname: "Schmidt",
          i_ttc_dates: "Feb 2026 - Mar 2026",
          i_ttc_location: "Munich Center",
          i_cellphone: "+49-555-0102",
          i_homephone: "+49-555-0202",
          i_course_start: "2026-02-01",
        },
        reporting: {
          reporting_status: "submitted",
        },
      },
    },
  },
};

// --- Post Sahaj Feedback: same shape as Post TTC but with sahaj form keys ---

export const MOCK_POST_SAHAJ_FEEDBACK_DATA: Record<string, Record<string, unknown>> = {
  "james.wilson@example.com": {
    post_sahaj_ttc_self_evaluation_form: {
      reporting: {
        evaluations: {
          anna_muller: {
            "sahaj-self-001": {
              "anna.muller@example.com": true,
            },
          },
        },
      },
      "sahaj-self-001": {
        data: {
          i_fname: "James",
          i_lname: "Wilson",
          i_ttc_dates: "Mar 2026",
          i_ttc_location: "London Ashram",
          i_cellphone: "+44-555-0104",
          i_homephone: "+44-555-0204",
          i_course_start: "2026-03-01",
        },
        reporting: {
          reporting_status: "complete",
        },
      },
    },
  },
  "anna_muller": {
    post_sahaj_ttc_feedback_form: {
      "sahaj-self-001": {
        "anna.muller@example.com": {
          data: {
            i_fname: "Anna",
            i_lname: "Müller",
            i_email_aol: "anna.muller@example.com",
            i_ttc_graduate_name: "James Wilson",
            i_ttc_graduate_email: "james.wilson@example.com",
            i_course_start: "2026-03-01",
          },
          email: "anna.muller@example.com",
          form_instance: "sahaj-feedback-001",
          reporting: {
            reporting_status: "submitted",
            is_reporting_matched: "Y",
          },
        },
      },
    },
  },
};
