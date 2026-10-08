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

const SEED_TEST_CASES = [];

const SEED_DEFECTS = [];

const SEED_TEST_RUNS = [];
