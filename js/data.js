/**
 * NexusQA - Seed Data & Mock Dataset
 * Preloaded with realistic enterprise QA, Developer data, and access requests.
 */

const SEED_USERS = [
  {
    id: "user-qa-a",
    name: "QA Tester",
    email: "a@a",
    phone: "9876543210",
    role: "qa",
    roleTitle: "QA Tester",
    avatar: "QA",
    color: "#6366f1",
    status: "active",
    emailVerified: true,
    createdAt: "2026-10-06 12:00"
  },
  {
    id: "user-qa-1",
    name: "Alex Morgan",
    email: "alex.qa@nexusqa.io",
    phone: "9876543211",
    role: "qa",
    roleTitle: "QA Lead",
    avatar: "AM",
    color: "#6366f1",
    status: "active",
    emailVerified: true,
    createdAt: "2026-10-01 08:00"
  },
  {
    id: "user-qa-2",
    name: "Elena Rostova",
    email: "elena.qa@nexusqa.io",
    phone: "9876543212",
    role: "qa",
    roleTitle: "Senior QA Analyst",
    avatar: "ER",
    color: "#06b6d4",
    status: "active",
    emailVerified: true,
    createdAt: "2026-10-02 09:30"
  },
  {
    id: "user-qa-3",
    name: "Liam Davis",
    email: "liam.tester@company.com",
    phone: "9876543213",
    role: "qa",
    roleTitle: "Security & API Tester",
    avatar: "LD",
    color: "#a855f7",
    status: "pending_approval",
    emailVerified: true,
    createdAt: "2026-10-06 09:55"
  },
  {
    id: "user-dev-1",
    name: "Marcus Vance",
    email: "marcus.dev@nexusqa.io",
    phone: "9876543214",
    role: "dev",
    roleTitle: "Lead Full-Stack Developer",
    devLevel: "senior",
    avatar: "MV",
    color: "#10b981",
    status: "active",
    emailVerified: true,
    createdAt: "2026-10-01 08:00"
  },
  {
    id: "user-dev-chhotu",
    name: "Chhotu Monster",
    email: "chhotumonster225@gmail.com",
    phone: "9876543215",
    role: "dev",
    roleTitle: "Lead Full-Stack Developer",
    devLevel: "senior",
    avatar: "CM",
    color: "#10b981",
    status: "active",
    emailVerified: true,
    createdAt: "2026-10-06 12:00"
  },
  {
    id: "user-dev-2",
    name: "Sarah Lin",
    email: "sarah.dev@nexusqa.io",
    phone: "9876543216",
    role: "dev",
    roleTitle: "Senior Backend Engineer",
    devLevel: "senior",
    avatar: "SL",
    color: "#f59e0b",
    status: "active",
    emailVerified: true,
    createdAt: "2026-10-01 08:00"
  },
  {
    id: "user-dev-junior-1",
    name: "Toby Parker",
    email: "toby.dev@nexusqa.io",
    phone: "9876543217",
    role: "dev",
    roleTitle: "Junior Frontend Developer",
    devLevel: "junior",
    avatar: "TP",
    color: "#3b82f6",
    status: "active",
    emailVerified: true,
    createdAt: "2026-10-04 11:20",
    approvedBy: "Marcus Vance"
  },
  {
    id: "user-dev-junior-2",
    name: "Maya Chen",
    email: "maya.dev@nexusqa.io",
    phone: "9876543218",
    role: "dev",
    roleTitle: "Junior Full-Stack Developer",
    devLevel: "junior",
    avatar: "MC",
    color: "#06b6d4",
    status: "active",
    emailVerified: true,
    createdAt: "2026-10-05 14:15",
    approvedBy: "Marcus Vance"
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

const SEED_TEST_CASES = [
  {
    id: "TC-101",
    title: "Verify user login with valid email and password credentials",
    suiteId: "suite-auth",
    priority: "P0 - Critical",
    type: "Functional",
    status: "Passed",
    author: "Alex Morgan",
    lastRun: "2026-10-05 14:22",
    preconditions: "User account exists in database with verified email status.",
    tags: ["auth", "smoke", "p0", "login"],
    steps: [
      { step: 1, action: "Navigate to /login URL in browser", expected: "Login page loads with email and password fields visible." },
      { step: 2, action: "Enter registered email 'qa.tester@nexusqa.io' and valid password", expected: "Credentials entered correctly into inputs." },
      { step: 3, action: "Click 'Sign In' button", expected: "HTTP 200 OK received; JWT token set in secure cookie." },
      { step: 4, action: "Observe navigation target", expected: "User redirected to /dashboard; user avatar and name displayed in topbar." }
    ],
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='360' viewBox='0 0 600 360'><rect width='600' height='360' rx='12' fill='%230f172a'/><rect x='20' y='20' width='560' height='40' rx='8' fill='%231e293b'/><circle cx='45' cy='40' r='6' fill='%23f43f5e'/><circle cx='65' cy='40' r='6' fill='%23f59e0b'/><circle cx='85' cy='40' r='6' fill='%2310b981'/><text x='110' y='45' font-family='sans-serif' font-size='12' fill='%2394a3b8'>https://app.nexusqa.io/login - Auth Verification Mock</text><rect x='150' y='85' width='300' height='240' rx='10' fill='%231e293b' stroke='%23334155'/><text x='300' y='125' text-anchor='middle' font-family='sans-serif' font-size='16' font-weight='bold' fill='%23ffffff'>NexusQA Sign In</text><text x='300' y='145' text-anchor='middle' font-family='sans-serif' font-size='11' fill='%2394a3b8'>Enter credentials to access workspace</text><rect x='180' y='165' width='240' height='32' rx='6' fill='%230f172a' stroke='%23475569'/><text x='195' y='185' font-family='monospace' font-size='11' fill='%2364748b'>qa.tester@nexusqa.io</text><rect x='180' y='210' width='240' height='32' rx='6' fill='%230f172a' stroke='%23475569'/><text x='195' y='230' font-family='monospace' font-size='11' fill='%2364748b'>••••••••••••••••</text><rect x='180' y='255' width='240' height='34' rx='6' fill='%236366f1'/><text x='300' y='277' text-anchor='middle' font-family='sans-serif' font-size='12' font-weight='bold' fill='%23ffffff'>Sign In</text></svg>"
  },
  {
    id: "TC-102",
    title: "Verify password reset token expiration after 15 minutes of inactivity",
    suiteId: "suite-auth",
    priority: "P1 - High",
    type: "Security",
    status: "Passed",
    author: "Alex Morgan",
    lastRun: "2026-10-05 14:24",
    preconditions: "User has requested a password reset email.",
    tags: ["auth", "security", "token"],
    steps: [
      { step: 1, action: "Trigger forgot password request for test user", expected: "Reset email delivered with secure HMAC token link." },
      { step: 2, action: "Wait 16 minutes (or mock server clock +16m)", expected: "Token timestamp exceeds 15-minute TTL." },
      { step: 3, action: "Click reset password link in email", expected: "Page displays 'Reset link has expired. Please request a new link.'" }
    ]
  },
  {
    id: "TC-103",
    title: "Verify Google OAuth SSO flow handles canceled consent gracefully",
    suiteId: "suite-auth",
    priority: "P2 - Medium",
    type: "Functional",
    status: "Passed",
    author: "Elena Rostova",
    lastRun: "2026-10-04 11:15",
    preconditions: "Google OAuth client credentials configured in staging.",
    tags: ["oauth", "sso", "google"],
    steps: [
      { step: 1, action: "Click 'Continue with Google' button on login screen", expected: "Popup opens with Google account selection dialog." },
      { step: 2, action: "Click 'Cancel' or close popup without granting permissions", expected: "Popup closes cleanly without unhandled JavaScript exceptions." },
      { step: 3, action: "Observe parent login page state", expected: "Toast notification: 'Google authentication was cancelled by user.'" }
    ]
  },
  {
    id: "TC-104",
    title: "Verify percentage discount coupon (SAVE20) applies to cart subtotal above $50",
    suiteId: "suite-checkout",
    priority: "P0 - Critical",
    type: "Functional",
    status: "Failed",
    author: "David Chen",
    lastRun: "2026-10-06 09:15",
    preconditions: "Cart contains items with subtotal equal to or greater than $50.00.",
    tags: ["checkout", "discounts", "p0", "regression"],
    steps: [
      { step: 1, action: "Add 2 items ($30 each) to cart (Subtotal: $60.00)", expected: "Cart displays Subtotal: $60.00." },
      { step: 2, action: "Enter promo code 'SAVE20' in discount field and click Apply", expected: "Promo accepted badge shown; Discount calculated as -$12.00 (20%)." },
      { step: 3, action: "Inspect updated Total summary", expected: "New total equals $48.00 + applicable taxes. (ACTUAL: 500 Server error on tax recalculation)." }
    ]
  },
  {
    id: "TC-105",
    title: "Verify Stripe 3D-Secure credit card payment simulation",
    suiteId: "suite-checkout",
    priority: "P0 - Critical",
    type: "Functional",
    status: "Passed",
    author: "David Chen",
    lastRun: "2026-10-05 17:30",
    preconditions: "Stripe test mode API keys active; cart populated.",
    tags: ["checkout", "stripe", "payments", "3ds"],
    steps: [
      { step: 1, action: "Enter test 3DS card (4000 0027 6000 3184) at checkout", expected: "Card details validated." },
      { step: 2, action: "Click 'Pay Now'", expected: "Stripe 3DS modal challenge iframe pops up." },
      { step: 3, action: "Click 'Complete Authentication' in modal simulator", expected: "PaymentIntent succeeded; order confirmation page displayed with Order #." }
    ]
  },
  {
    id: "TC-106",
    title: "Verify shopping cart items persist after user logs out and logs back in",
    suiteId: "suite-checkout",
    priority: "P1 - High",
    type: "Regression",
    status: "Passed",
    author: "David Chen",
    lastRun: "2026-10-05 16:10",
    preconditions: "Authenticated user with 3 items in cart.",
    tags: ["cart", "session", "persistence"],
    steps: [
      { step: 1, action: "Log out from account", expected: "Session terminated; guest session assigned." },
      { step: 2, action: "Log back into the same account", expected: "Cart database sync merges previous items." },
      { step: 3, action: "Open cart drawer", expected: "All 3 previously added items are present with exact quantities." }
    ]
  },
  {
    id: "TC-107",
    title: "POST /api/v1/orders returns 422 Unprocessable Entity when shipping address is missing zip code",
    suiteId: "suite-api",
    priority: "P1 - High",
    type: "Integration",
    status: "Passed",
    author: "Elena Rostova",
    lastRun: "2026-10-06 08:45",
    preconditions: "Valid Bearer authorization token.",
    tags: ["api", "validation", "orders"],
    steps: [
      { step: 1, action: "Send POST payload with shippingAddress missing 'postalCode' field", expected: "Backend schema validation intercepts request." },
      { step: 2, action: "Verify HTTP response status code", expected: "Status is 422 Unprocessable Entity." },
      { step: 3, action: "Validate JSON error response body format", expected: "Returns error: { code: 'INVALID_POSTAL_CODE', field: 'shippingAddress.postalCode' }." }
    ]
  },
  {
    id: "TC-108",
    title: "GET /api/v1/products rate limiter blocks requests exceeding 100 req/min per IP",
    suiteId: "suite-api",
    priority: "P2 - Medium",
    type: "Security",
    status: "Passed",
    author: "Elena Rostova",
    lastRun: "2026-10-05 12:00",
    preconditions: "Redis rate limiter service active.",
    tags: ["api", "security", "rate-limit"],
    steps: [
      { step: 1, action: "Send 100 rapid GET requests from single client IP", expected: "All 100 requests return HTTP 200 OK with Retry-After header countdown." },
      { step: 2, action: "Send 101st GET request within same minute", expected: "Request rejected with HTTP 429 Too Many Requests." }
    ]
  },
  {
    id: "TC-109",
    title: "Verify search bar handles SQL injection payloads (e.g. `' OR '1'='1`) without exposing raw SQL errors",
    suiteId: "suite-security",
    priority: "P0 - Critical",
    type: "Security",
    status: "Passed",
    author: "Alex Morgan",
    lastRun: "2026-10-05 18:20",
    preconditions: "Search input component active on catalog page.",
    tags: ["security", "sqli", "owasp"],
    steps: [
      { step: 1, action: "Input `' OR '1'='1'; DROP TABLE users; --` into catalog search box", expected: "Input passed through parameterized query sanitizer." },
      { step: 2, action: "Press Enter / Submit Search", expected: "No syntax error thrown; displays 'No products found matching your search'." }
    ]
  },
  {
    id: "TC-110",
    title: "Verify multi-facet category filter updates product list without full page reload",
    suiteId: "suite-search",
    priority: "P2 - Medium",
    type: "UI / UX",
    status: "Passed",
    author: "Elena Rostova",
    lastRun: "2026-10-04 15:40",
    preconditions: "Catalog contains products across multiple categories & price ranges.",
    tags: ["search", "catalog", "filters"],
    steps: [
      { step: 1, action: "Select 'Electronics' checkbox and 'Under $100' radio button", expected: "AJAX request fetches filtered results." },
      { step: 2, action: "Verify product count and items displayed", expected: "Only electronics priced < $100 are rendered; URL query params reflect ?cat=electronics&max=100." }
    ]
  },
  {
    id: "TC-111",
    title: "Verify product inventory decrements atomically when simultaneous checkout occurs",
    suiteId: "suite-checkout",
    priority: "P0 - Critical",
    type: "Regression",
    status: "Blocked",
    author: "Alex Morgan",
    lastRun: "2026-10-06 09:30",
    preconditions: "Product stock is exactly 1 unit.",
    tags: ["concurrency", "inventory", "p0"],
    steps: [
      { step: 1, action: "Simulate two concurrent checkout sessions clicking 'Pay' at millisecond t0", expected: "Database row-level lock or distributed lock executes." },
      { step: 2, action: "Verify User A result", expected: "User A receives order confirmation." },
      { step: 3, action: "Verify User B result", expected: "User B is notified 'Item went out of stock during checkout; card was not charged'." }
    ]
  },
  {
    id: "TC-112",
    title: "Verify Lighthouse Performance score is >= 90 on mobile viewport for product detail page",
    suiteId: "suite-perf",
    priority: "P2 - Medium",
    type: "Performance",
    status: "Untested",
    author: "David Chen",
    lastRun: "Never",
    preconditions: "Production-ready build deployed to staging with CDN assets.",
    tags: ["lighthouse", "web-vitals", "perf"],
    steps: [
      { step: 1, action: "Run Lighthouse mobile audit in DevTools on /products/sample-item", expected: "Audit completes." },
      { step: 2, action: "Inspect LCP (Largest Contentful Paint)", expected: "LCP is under 2.2 seconds." },
      { step: 3, action: "Inspect Cumulative Layout Shift (CLS)", expected: "CLS is less than 0.05." }
    ]
  }
];

const SEED_DEFECTS = [
  {
    id: "BUG-201",
    summary: "Server 500 error when applying percentage coupon 'SAVE20' on orders over $50",
    linkedTestCaseId: "TC-104",
    severity: "Critical",
    priority: "P0 - Urgent",
    assignee: "Marcus Vance",
    reportedBy: "Alex Morgan (QA Lead)",
    status: "In Progress",
    description: "During TC-104 execution, when clicking apply discount for 'SAVE20', the tax calculation service crashes with NullPointerException because discountAmount is serialized as string instead of float.",
    devNotes: "Identified issue in TaxCalculatorService.java line 142. String parsing error during float cast. Patch created in feature/fix-coupon-tax branch.",
    prLink: "https://github.com/org/checkout-service/pull/412",
    gitBranch: "feature/fix-coupon-tax",
    createdAt: "2026-10-06 09:20",
    updatedAt: "2026-10-06 09:45"
  },
  {
    id: "BUG-202",
    summary: "Database deadlock during high-concurrency inventory decrement test",
    linkedTestCaseId: "TC-111",
    severity: "Critical",
    priority: "P0 - Urgent",
    assignee: "Sarah Lin",
    reportedBy: "Alex Morgan (QA Lead)",
    status: "Open",
    description: "Postgres transaction isolation level causes 40P01 deadlock when 10 simultaneous workers attempt UPDATE inventory WHERE product_id = 492.",
    devNotes: "Requires pessimistic row locking (`SELECT FOR UPDATE NOWAIT`) with retry backoff queue.",
    prLink: "",
    gitBranch: "",
    createdAt: "2026-10-06 09:35",
    updatedAt: "2026-10-06 09:35"
  },
  {
    id: "BUG-203",
    summary: "Safari iOS 17 layout shift on checkout payment button sticky bar",
    linkedTestCaseId: "TC-105",
    severity: "Medium",
    priority: "P2 - Medium",
    assignee: "Marcus Vance",
    reportedBy: "Elena Rostova (QA)",
    status: "Fixed - Ready for QA",
    description: "When virtual keyboard appears in Safari mobile, bottom fixed action bar shifts up 120px covering the CVV input field.",
    devNotes: "Added `env(safe-area-inset-bottom)` and `visualViewport` resize listener to prevent keyboard push in iOS WebKit.",
    prLink: "https://github.com/org/frontend-web/pull/884",
    gitBranch: "fix/safari-keyboard-inset",
    createdAt: "2026-10-05 16:45",
    updatedAt: "2026-10-06 08:30"
  },
  {
    id: "BUG-204",
    summary: "Missing aria-label on category filter checkboxes in catalog screen",
    linkedTestCaseId: "TC-110",
    severity: "Minor",
    priority: "P3 - Low",
    assignee: "Marcus Vance",
    reportedBy: "Elena Rostova (QA)",
    status: "Open",
    description: "Screen reader announces 'Checkbox unticked' without category name context in Chrome/NVDA.",
    devNotes: "",
    prLink: "",
    gitBranch: "",
    createdAt: "2026-10-04 16:00",
    updatedAt: "2026-10-04 16:00"
  },
  {
    id: "BUG-205",
    summary: "Expired token message displays unescaped raw HTML snippet",
    linkedTestCaseId: "TC-102",
    severity: "Major",
    priority: "P1 - High",
    assignee: "Sarah Lin",
    reportedBy: "Alex Morgan (QA Lead)",
    status: "Resolved & Verified",
    description: "Resolved by sanitizing server error payload in auth modal toast parser.",
    devNotes: "Applied DOMPurify sanitize step in NotificationService.ts",
    prLink: "https://github.com/org/frontend-web/pull/880",
    gitBranch: "fix/auth-xss-sanitize",
    createdAt: "2026-10-03 14:10",
    updatedAt: "2026-10-04 10:20"
  }
];

const SEED_TEST_RUNS = [
  {
    id: "RUN-801",
    name: "Sprint 24 Full Regression Validation Run",
    environment: "Staging (us-east-1)",
    author: "Alex Morgan (QA Lead)",
    date: "2026-10-06 09:00",
    duration: "24m 18s",
    status: "In Progress",
    testCaseIds: ["TC-101", "TC-102", "TC-103", "TC-104", "TC-105", "TC-106", "TC-107", "TC-108", "TC-109", "TC-110", "TC-111", "TC-112"],
    results: {
      "TC-101": { status: "Passed", notes: "Manual login test verified successfully" },
      "TC-102": { status: "Passed", notes: "Token TTL validated" },
      "TC-103": { status: "Passed", notes: "Manual OAuth test OK" },
      "TC-104": { status: "Failed", notes: "Failed with 500 error on discount tax API. Bug filed: BUG-201" },
      "TC-105": { status: "Passed", notes: "Stripe test webhook confirmed" },
      "TC-106": { status: "Passed", notes: "Session merge OK" },
      "TC-107": { status: "Passed", notes: "422 schema returned" },
      "TC-108": { status: "Passed", notes: "429 rate limit triggered at 101 reqs" },
      "TC-109": { status: "Passed", notes: "SQL sanitizer sanitized payload" },
      "TC-110": { status: "Passed", notes: "Faceted search OK" },
      "TC-111": { status: "Blocked", notes: "Blocked due to deadlock bug BUG-202" },
      "TC-112": { status: "Untested", notes: "" }
    }
  },
  {
    id: "RUN-800",
    name: "Release v3.7.9 Hotfix Smoke Verification",
    environment: "Production Smoke",
    author: "CI Pipeline",
    date: "2026-10-03 18:30",
    duration: "08m 42s",
    status: "Completed",
    testCaseIds: ["TC-101", "TC-105", "TC-107", "TC-109"],
    results: {
      "TC-101": { status: "Passed", notes: "Pass" },
      "TC-105": { status: "Passed", notes: "Pass" },
      "TC-107": { status: "Passed", notes: "Pass" },
      "TC-109": { status: "Passed", notes: "Pass" }
    }
  }
];
