/**
 * NexusQA - Seed Data & Mock Dataset
 * Preloaded with realistic enterprise QA, Developer data, and access requests.
 */

const SEED_USERS = [
  {
    id: "user-dev-chhotu",
    name: "Senior Developer",
    email: "chhotumonster225@gmail.com",
    phone: "9876543210",
    role: "dev",
    roleTitle: "Lead Full-Stack Developer",
    devLevel: "senior",
    avatar: "SD",
    color: "#10b981",
    status: "active",
    emailVerified: true,
    createdAt: "2026-10-06 12:00"
  },
  {
    id: "user-qa-a",
    name: "QA Tester",
    email: "a@a",
    phone: "9876543211",
    role: "qa",
    roleTitle: "QA Tester",
    avatar: "QA",
    color: "#6366f1",
    status: "active",
    emailVerified: true,
    createdAt: "2026-10-06 12:00"
  }
];

const SEED_SUITES = [
  {
    id: "suite-auth",
    name: "Authentication & Authorization",
    description: "Login, Registration, OAuth SSO, MFA, Session management and password recovery flows.",
    icon: "fa-solid fa-lock"
  },
  {
    id: "suite-checkout",
    name: "Checkout, Cart & Payments",
    description: "Shopping cart persistence, Stripe/PayPal payment gateway integrations, coupon codes, and tax calculation.",
    icon: "fa-solid fa-credit-card"
  },
  {
    id: "suite-api",
    name: "REST API & Microservices",
    description: "Backend endpoints, rate limiting, JWT token verification, status codes, and GraphQL schema tests.",
    icon: "fa-solid fa-code"
  },
  {
    id: "suite-search",
    name: "Search, Catalog & Filtering",
    description: "Elasticsearch querying, faceted filtering, pagination, sorting algorithms, and product detail rendering.",
    icon: "fa-solid fa-cart-shopping"
  },
  {
    id: "suite-security",
    name: "Security & Vulnerability",
    description: "SQL Injection mitigation, XSS prevention, CSRF token validation, and rate limiter stress tests.",
    icon: "fa-solid fa-shield-halved"
  },
  {
    id: "suite-perf",
    name: "Performance & Scalability",
    description: "Lighthouse core web vitals, concurrent load handling, database response latency, and CDN caching.",
    icon: "fa-solid fa-gauge-high"
  }
];

// Controlled Dropdowns Configuration (Strict Controlled Values Architecture)
const CONTROLLED_DROPDOWNS = {
  test_case_type: [
    "Bug",
    "Enhancement"
  ],
  test_result: [
    "Pass",
    "Fail",
    "Not Run",
    "Blocked",
    "Not Applicable"
  ],
  reproducibility: [
    "Yes",
    "No",
    "Not Tested",
    "Intermittent"
  ],
  bug_status: [
    "Passed",
    "Completed",
    "Closed",
    "Open",
    "Not Run",
    "Passes",
    "Testing",
    "Check",
    "Fixed",
    "Retest"
  ],
  side: [
    "Trainer",
    "Student"
  ],
  severity: [
    "Critical",
    "Major",
    "Medium",
    "Minor",
    "Trivial"
  ],
  bug_type: [
    "Functional",
    "Content",
    "Configuration",
    "Scoring",
    "Content Quality",
    "UI Improvement"
  ],
  test_module: [
    "Tasks",
    "Assessments",
    "Courses",
    "Authentication",
    "Dashboard",
    "Reports",
    "Settings",
    "Student Portal"
  ]
};

// Exact 22-Column Excel / TSV Schema Definition
const EXACT_22_COLUMNS = [
  { key: "test_module", label: "Test Module", num: 1 },
  { key: "test_case_id", label: "Test Case ID", num: 2 },
  { key: "test_case_type", label: "Test Case Type", num: 3 },
  { key: "bug_id", label: "Bug ID", num: 4 },
  { key: "date", label: "Date", num: 5 },
  { key: "module", label: "Module", num: 6 },
  { key: "feature", label: "Feature", num: 7 },
  { key: "bug_type", label: "Bug Type", num: 8 },
  { key: "severity", label: "Severity", num: 9 },
  { key: "title", label: "Title", num: 10 },
  { key: "preconditions", label: "Preconditions", num: 11 },
  { key: "steps_to_reproduce", label: "Steps to Reproduce", num: 12 },
  { key: "expected_result", label: "Expected Result", num: 13 },
  { key: "actual_result", label: "Actual Result", num: 14 },
  { key: "test_result", label: "Test Result", num: 15 },
  { key: "ai_response", label: "AI Response", num: 16 },
  { key: "reference_answer", label: "Reference Answer", num: 17 },
  { key: "reproducibility", label: "Reproducibility", num: 18 },
  { key: "screenshot_evidence", label: "Screenshot / Evidence", num: 19 },
  { key: "notes", label: "Notes", num: 20 },
  { key: "bug_status", label: "Bug Status", num: 21 },
  { key: "side", label: "Side", num: 22 }
];

// CampusOS Preloaded Task References (20-Field Task Reference Table)
const SEED_TASK_REFERENCES = [
  {
    task_name: "Test 5",
    description: "Fill in the Blanks task for Python fundamentals with slicing and collections",
    task_type: "Fill in the Blanks",
    difficulty: "Medium",
    language: "Python",
    xp: 20,
    time_limit: 30,
    question_count: 5,
    question_source: "Trainer Created",
    topic: "Python Lists, Dicts & Slicing",
    skills_tags: ["python", "collections", "slicing"],
    generation_time: "0.5s",
    task_content: "5 Fill in the blank exercises covering list comprehensions and dict indexing.",
    ai_quality_check: "Passed",
    hints_support: "Enabled (2 hints)",
    batch_selected: "Batch A-2026",
    published: true,
    student_attempt: "Assigned",
    navigation_flow: "Login as Student -> Dashboard -> Tasks -> My Tasks -> Today's Task -> Test 5",
    status_notes: "Active CampusOS Task Reference"
  },
  {
    task_name: "Test 4",
    description: "Bug Fix challenge for Python string parsing and boundary conditions",
    task_type: "Bug Fix",
    difficulty: "Medium",
    language: "Python",
    xp: 20,
    time_limit: 30,
    question_count: 3,
    question_source: "Trainer Created",
    topic: "String Parsing & Boundary Validation",
    skills_tags: ["python", "bug-fix", "debugging"],
    generation_time: "0.6s",
    task_content: "3 code repair scenarios for string tokenization and regex sanitization.",
    ai_quality_check: "Passed",
    hints_support: "Enabled",
    batch_selected: "Batch A-2026",
    published: true,
    student_attempt: "Assigned",
    navigation_flow: "Login as Student -> Dashboard -> Tasks -> My Tasks -> Today's Task -> Test 4",
    status_notes: "Active CampusOS Task Reference"
  },
  {
    task_name: "Test 1",
    description: "Practical Coding Challenge for Array Manipulation in Java",
    task_type: "Practical Coding Challenge",
    difficulty: "Easy",
    language: "Java",
    xp: 15,
    time_limit: 25,
    question_count: 2,
    question_source: "Trainer Created",
    topic: "Java Arrays & Loops",
    skills_tags: ["java", "arrays", "loops"],
    generation_time: "0.4s",
    task_content: "2 array sorting and subarray summing challenges.",
    ai_quality_check: "Passed",
    hints_support: "Enabled",
    batch_selected: "Batch B-2026",
    published: true,
    student_attempt: "Completed",
    navigation_flow: "Dashboard -> Tasks -> Test 1",
    status_notes: "Active CampusOS Task Reference"
  }
];

const SEED_TEST_CASES = [];

const SEED_DEFECTS = [
  {
    id: "BUG-037",
    summary: "Python selected but Java boilerplate displayed in code editor",
    title: "Python selected but Java boilerplate displayed",
    description: "When task programming language is set to Python, the student code compiler loads Java class boilerplate instead.",
    severity: "Major",
    priority: "P1 - High",
    status: "Open",
    linkedTestCaseId: "",
    assignee: "Senior Developer",
    reportedBy: "QA Tester",
    createdAt: "2026-10-07 14:30",
    module: "Student Task Attempt",
    feature: "Compiler / Language Selector",
    bug_type: "Configuration",
    side: "Student"
  }
];

const SEED_TEST_RUNS = [];
