/**
 * NexusQA - Local Storage, State & Real-Time Sync Manager
 * Supports multi-role authentication, OTP Email Verification, Dev Access Approvals, and Supabase Cloud DB.
 */

const STORAGE_KEYS = {
  USERS: "nexusqa_users",
  CURRENT_USER: "nexusqa_current_user",
  TEST_CASES: "nexusqa_test_cases",
  SUITES: "nexusqa_suites",
  DEFECTS: "nexusqa_defects",
  TEST_RUNS: "nexusqa_test_runs",
  ACTIVE_RUN_ID: "nexusqa_active_run_id",
  THEME: "nexusqa_theme"
};

const syncChannel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("nexusqa_sync_channel") : null;

const StorageManager = {
  listeners: [],

  /**
   * Initialize local store with seed data if empty & connect to Supabase
   */
  async init() {
    if (!localStorage.getItem(STORAGE_KEYS.TEST_CASES)) {
      this.resetToSeedData();
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    }

    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      const urlParams = new URLSearchParams(window.location.search);
      const pathname = window.location.pathname.toLowerCase();
      
      let initialRole = "qa";
      if (urlParams.get("role") === "dev" || pathname.includes("/dev")) {
        initialRole = "dev";
      }

      const users = this.getUsers();
      const defaultUser = users.find(u => u.role === initialRole && u.status === "active") || users[0];
      this.setCurrentUser(defaultUser);
    }

    window.addEventListener("storage", (e) => {
      this.notifyListeners({ type: "STORAGE_CHANGE", key: e.key });
    });

    if (syncChannel) {
      syncChannel.onmessage = (event) => {
        this.notifyListeners(event.data);
      };
    }

    // Initialize Supabase if configured
    if (typeof SupabaseManager !== "undefined") {
      const connected = await SupabaseManager.init();
      if (connected) {
        await SupabaseManager.fetchAllFromSupabase();
        this.broadcast("SUPABASE_CONNECTED");
      }
    }
  },

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  },

  notifyListeners(data) {
    this.listeners.forEach(cb => {
      try { cb(data); } catch(err) { console.error("Sync listener error:", err); }
    });
  },

  broadcast(type, payload = {}) {
    const msg = { type, payload, timestamp: Date.now() };
    if (syncChannel) syncChannel.postMessage(msg);
    this.notifyListeners(msg);
  },

  resetToSeedData() {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    localStorage.setItem(STORAGE_KEYS.SUITES, JSON.stringify(SEED_SUITES));
    localStorage.setItem(STORAGE_KEYS.TEST_CASES, JSON.stringify(SEED_TEST_CASES));
    localStorage.setItem(STORAGE_KEYS.DEFECTS, JSON.stringify(SEED_DEFECTS));
    localStorage.setItem(STORAGE_KEYS.TEST_RUNS, JSON.stringify(SEED_TEST_RUNS));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_RUN_ID, "RUN-801");
    this.broadcast("RESET_DATA");

    if (typeof SupabaseManager !== "undefined" && SupabaseManager.isConnected) {
      SupabaseManager.pushAllLocalToSupabase();
    }
  },

  wipeAll() {
    localStorage.removeItem(STORAGE_KEYS.TEST_CASES);
    localStorage.removeItem(STORAGE_KEYS.SUITES);
    localStorage.removeItem(STORAGE_KEYS.DEFECTS);
    localStorage.removeItem(STORAGE_KEYS.TEST_RUNS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_RUN_ID);
    this.broadcast("WIPE_DATA");
  },

  // -------------------------------------------------------------
  // User Management & Access Approvals
  // -------------------------------------------------------------
  getUsers() {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : SEED_USERS;
  },

  saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.broadcast("USERS_UPDATED");
    if (typeof SupabaseManager !== "undefined" && SupabaseManager.isConnected) {
      SupabaseManager.pushAllLocalToSupabase();
    }
  },

  getCurrentUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : this.getUsers()[0];
  },

  setCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    this.broadcast("AUTH_CHANGE", { user });
  },

  getUserByEmail(email) {
    return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  },

  /**
  /**
   * Everyday Passwordless Login (Step 1: Request 6-digit Email OTP)
   */
  requestLoginOtp(email, role = null) {
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

    if (!user) {
      throw new Error("No user registered with this email. Please create a new account first.");
    }

    if (role && user.role !== role) {
      const targetRole = role === "dev" ? "Developer Lead" : "QA Tester";
      const userRole = user.role === "dev" ? "Developer" : "QA Tester";
      throw new Error(`This email is registered as a ${userRole}. Please select ${userRole} to authenticate.`);
    }

    if (user.status === "rejected") {
      throw new Error("Your access request was rejected by Senior Dev Lead. Please contact engineering.");
    }

    if (user.role === "qa" && user.status === "pending_approval") {
      return { status: "pending_approval", user };
    }

    // Generate unique 6-digit OTP
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    user.otpCode = otpCode;
    user.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    this.saveUsers(users);

    return { status: "otp_sent", user, otpCode };
  },

  /**
   * Everyday Passwordless Login (Step 2: Verify OTP & Enter Portal)
   */
  verifyLoginOtp(email, otp) {
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

    if (!user) {
      throw new Error("User account not found. Please register first.");
    }

    if (!user.otpCode || user.otpCode !== otp.trim()) {
      throw new Error("Invalid verification code. Please check your email and try again.");
    }

    user.otpCode = null;
    this.saveUsers(users);
    this.setCurrentUser(user);
    return { status: "success", user };
  },

  /**
   * Tester/Dev Registration (Step 1: Sign up & Generate Initial Email Verification OTP)
   */
  registerTester({ name, email, roleTitle }) {
    const users = this.getUsers();
    let existing = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    const isDev = (roleTitle || "").toLowerCase().includes("dev");
    const roleKey = isDev ? "dev" : "qa";
    const displayRole = isDev ? "Dev" : "Tester";

    // Generate unique 6-digit verification code
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    if (existing) {
      if (existing.status === "active") {
        throw new Error("An active account already exists with this email. Please sign in.");
      }
      // Update existing pending user with new OTP
      existing.name = name || existing.name;
      existing.role = roleKey;
      existing.roleTitle = displayRole;
      existing.otpCode = otpCode;
      existing.otpExpiresAt = otpExpiresAt;
      this.saveUsers(users);
      return { user: existing, otpCode };
    }

    const newUser = {
      id: `user-${roleKey}-${Date.now()}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: roleKey,
      roleTitle: displayRole,
      avatar: name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || (isDev ? "DEV" : "QA"),
      color: isDev ? "#10b981" : "#6366f1",
      status: "pending_approval",
      emailVerified: false,
      otpCode: otpCode,
      otpExpiresAt: otpExpiresAt,
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16)
    };

    users.push(newUser);
    this.saveUsers(users);
    return { user: newUser, otpCode };
  },

  /**
   * Tester Email Verification (Step 2: Check OTP -> Submit to Dev for Approval)
   */
  verifyTesterOtp(email, otp) {
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

    if (!user) {
      throw new Error("Account not found. Please register first.");
    }

    if (!user.otpCode || user.otpCode !== otp.trim()) {
      throw new Error("Invalid verification code. Please check your email and try again.");
    }

    user.emailVerified = true;
    user.otpCode = null;
    user.status = "pending_approval";
    this.saveUsers(users);

    // Notify Senior Developers in real time
    this.broadcast("TESTER_APPROVAL_REQUESTED", { user });
    return user;
  },

  /**
   * Senior Developer Approves a Tester (Step 3: Dev Approval -> Stored in DB permanently)
   */
  approveTesterRequest(userId, approverName = "Marcus Vance (Dev Lead)") {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      user.status = "active";
      user.approvedBy = approverName;
      user.approvedAt = new Date().toISOString().replace("T", " ").substring(0, 16);
      this.saveUsers(users);
      this.broadcast("TESTER_APPROVED", { user });
      return user;
    }
    return null;
  },

  /**
   * Developer Rejects a Tester Request
   */
  rejectTesterRequest(userId) {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      user.status = "rejected";
      this.saveUsers(users);
      this.broadcast("TESTER_REJECTED", { user });
      return user;
    }
    return null;
  },

  getPendingTesterRequests() {
    return this.getUsers().filter(u => u.role === "qa" && u.status === "pending_approval" && u.emailVerified);
  },

  login(email, role) {
    const users = this.getUsers();
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      user = {
        id: `user-${Date.now()}`,
        name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        email: email,
        role: role || "qa",
        roleTitle: role === "dev" ? "Software Engineer" : "QA Engineer",
        avatar: email.substring(0, 2).toUpperCase(),
        color: role === "dev" ? "#10b981" : "#6366f1",
        status: "active",
        emailVerified: true
      };
      users.push(user);
      this.saveUsers(users);
    }
    this.setCurrentUser(user);
    return user;
  },

  loginTester(email, password) {
    return this.requestLoginOtp(email, "qa");
  },

  loginDev(email, password) {
    return this.requestLoginOtp(email, "dev");
  },

  // -------------------------------------------------------------
  // Test Cases CRUD
  // -------------------------------------------------------------
  getTestCases() {
    const raw = localStorage.getItem(STORAGE_KEYS.TEST_CASES);
    return raw ? JSON.parse(raw) : [];
  },

  saveTestCases(cases, shouldBroadcast = true) {
    localStorage.setItem(STORAGE_KEYS.TEST_CASES, JSON.stringify(cases));
    if (shouldBroadcast) this.broadcast("TEST_CASES_UPDATED");
  },

  getTestCaseById(id) {
    return this.getTestCases().find(tc => tc.id === id);
  },

  addTestCase(testCase) {
    const cases = this.getTestCases();
    if (!testCase.id) {
      const nextNum = cases.reduce((max, tc) => {
        const num = parseInt(tc.id.replace("TC-", ""), 10) || 0;
        return Math.max(max, num);
      }, 100) + 1;
      testCase.id = `TC-${nextNum}`;
    }
    testCase.lastRun = testCase.lastRun || "Never";
    testCase.author = testCase.author || this.getCurrentUser().name;
    cases.unshift(testCase);
    this.saveTestCases(cases);

    if (typeof SupabaseManager !== "undefined") {
      SupabaseManager.syncTestCaseUpsert(testCase);
    }
    return testCase;
  },

  updateTestCase(updatedTestCase) {
    const cases = this.getTestCases();
    const index = cases.findIndex(tc => tc.id === updatedTestCase.id);
    if (index !== -1) {
      cases[index] = { ...cases[index], ...updatedTestCase };
      this.saveTestCases(cases);

      if (typeof SupabaseManager !== "undefined") {
        SupabaseManager.syncTestCaseUpsert(cases[index]);
      }
      return cases[index];
    }
    return null;
  },

  deleteTestCase(id) {
    let cases = this.getTestCases();
    cases = cases.filter(tc => tc.id !== id);
    this.saveTestCases(cases);

    if (typeof SupabaseManager !== "undefined") {
      SupabaseManager.syncTestCaseDelete(id);
    }
  },

  deleteMultipleTestCases(ids) {
    let cases = this.getTestCases();
    const idSet = new Set(ids);
    cases = cases.filter(tc => !idSet.has(tc.id));
    this.saveTestCases(cases);

    if (typeof SupabaseManager !== "undefined") {
      ids.forEach(id => SupabaseManager.syncTestCaseDelete(id));
    }
  },

  updateMultipleTestCaseStatuses(ids, newStatus) {
    const cases = this.getTestCases();
    const idSet = new Set(ids);
    cases.forEach(tc => {
      if (idSet.has(tc.id)) {
        tc.status = newStatus;
        tc.lastRun = new Date().toISOString().replace("T", " ").substring(0, 16);
        if (typeof SupabaseManager !== "undefined") {
          SupabaseManager.syncTestCaseUpsert(tc);
        }
      }
    });
    this.saveTestCases(cases);
  },

  // -------------------------------------------------------------
  // Suites CRUD
  // -------------------------------------------------------------
  getSuites() {
    const raw = localStorage.getItem(STORAGE_KEYS.SUITES);
    return raw ? JSON.parse(raw) : [];
  },

  saveSuites(suites, shouldBroadcast = true) {
    localStorage.setItem(STORAGE_KEYS.SUITES, JSON.stringify(suites));
    if (shouldBroadcast) this.broadcast("SUITES_UPDATED");
  },

  addSuite(suite) {
    const suites = this.getSuites();
    if (!suite.id) {
      suite.id = "suite-" + suite.name.toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 20);
    }
    suites.push(suite);
    this.saveSuites(suites);
    return suite;
  },

  // -------------------------------------------------------------
  // Defects CRUD & Dev Resolution Workflow
  // -------------------------------------------------------------
  getDefects() {
    const raw = localStorage.getItem(STORAGE_KEYS.DEFECTS);
    return raw ? JSON.parse(raw) : [];
  },

  saveDefects(defects, shouldBroadcast = true) {
    localStorage.setItem(STORAGE_KEYS.DEFECTS, JSON.stringify(defects));
    if (shouldBroadcast) this.broadcast("DEFECTS_UPDATED");
  },

  getDefectById(id) {
    return this.getDefects().find(d => d.id === id);
  },

  addDefect(defect) {
    const defects = this.getDefects();
    if (!defect.id) {
      const nextNum = defects.reduce((max, d) => {
        const num = parseInt(d.id.replace("BUG-", ""), 10) || 0;
        return Math.max(max, num);
      }, 200) + 1;
      defect.id = `BUG-${nextNum}`;
    }
    defect.createdAt = defect.createdAt || new Date().toISOString().replace("T", " ").substring(0, 16);
    defect.updatedAt = defect.createdAt;
    defect.status = defect.status || "Open";
    defect.reportedBy = defect.reportedBy || this.getCurrentUser().name;
    defects.unshift(defect);
    this.saveDefects(defects);

    if (typeof SupabaseManager !== "undefined") {
      SupabaseManager.syncDefectUpsert(defect);
    }
    return defect;
  },

  updateDefect(updatedDefect) {
    const defects = this.getDefects();
    const index = defects.findIndex(d => d.id === updatedDefect.id);
    if (index !== -1) {
      updatedDefect.updatedAt = new Date().toISOString().replace("T", " ").substring(0, 16);
      defects[index] = { ...defects[index], ...updatedDefect };
      this.saveDefects(defects);

      if (typeof SupabaseManager !== "undefined") {
        SupabaseManager.syncDefectUpsert(defects[index]);
      }
      return defects[index];
    }
    return null;
  },

  updateDefectDevFix(defectId, { devNotes, prLink, gitBranch, status, assignee }) {
    const defect = this.getDefectById(defectId);
    if (defect) {
      if (devNotes !== undefined) defect.devNotes = devNotes;
      if (prLink !== undefined) defect.prLink = prLink;
      if (gitBranch !== undefined) defect.gitBranch = gitBranch;
      if (status !== undefined) defect.status = status;
      if (assignee !== undefined) defect.assignee = assignee;
      return this.updateDefect(defect);
    }
    return null;
  },

  deleteDefect(id) {
    let defects = this.getDefects();
    defects = defects.filter(d => d.id !== id);
    this.saveDefects(defects);

    if (typeof SupabaseManager !== "undefined") {
      SupabaseManager.syncDefectDelete(id);
    }
  },

  // -------------------------------------------------------------
  // Test Runs CRUD
  // -------------------------------------------------------------
  getTestRuns() {
    const raw = localStorage.getItem(STORAGE_KEYS.TEST_RUNS);
    return raw ? JSON.parse(raw) : [];
  },

  saveTestRuns(runs, shouldBroadcast = true) {
    localStorage.setItem(STORAGE_KEYS.TEST_RUNS, JSON.stringify(runs));
    if (shouldBroadcast) this.broadcast("TEST_RUNS_UPDATED");
  },

  getActiveRunId() {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_RUN_ID) || "RUN-801";
  },

  setActiveRunId(id) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_RUN_ID, id);
    this.broadcast("ACTIVE_RUN_CHANGED", { id });
  },

  getActiveRun() {
    const runs = this.getTestRuns();
    const activeId = this.getActiveRunId();
    return runs.find(r => r.id === activeId) || runs[0] || null;
  },

  createTestRun(name, environment, testCaseIds) {
    const runs = this.getTestRuns();
    const nextNum = runs.reduce((max, r) => {
      const num = parseInt(r.id.replace("RUN-", ""), 10) || 0;
      return Math.max(max, num);
    }, 800) + 1;

    const newRun = {
      id: `RUN-${nextNum}`,
      name: name || `Sprint Test Execution Run #${nextNum}`,
      environment: environment || "Staging",
      author: this.getCurrentUser().name,
      date: new Date().toISOString().replace("T", " ").substring(0, 16),
      duration: "00m 00s",
      status: "In Progress",
      testCaseIds: testCaseIds || this.getTestCases().map(t => t.id),
      results: {}
    };

    newRun.testCaseIds.forEach(tcId => {
      newRun.results[tcId] = { status: "Untested", notes: "" };
    });

    runs.unshift(newRun);
    this.saveTestRuns(runs);
    this.setActiveRunId(newRun.id);

    if (typeof SupabaseManager !== "undefined") {
      SupabaseManager.syncTestRunUpsert(newRun);
    }
    return newRun;
  },

  recordTestResult(runId, testCaseId, status, notes) {
    const runs = this.getTestRuns();
    const run = runs.find(r => r.id === runId);
    if (run) {
      if (!run.results) run.results = {};
      run.results[testCaseId] = { status, notes };
      this.saveTestRuns(runs);

      const tc = this.getTestCaseById(testCaseId);
      if (tc) {
        tc.status = status;
        tc.lastRun = new Date().toISOString().replace("T", " ").substring(0, 16);
        this.updateTestCase(tc);
      }

      if (typeof SupabaseManager !== "undefined") {
        SupabaseManager.syncTestRunUpsert(run);
      }
    }
  },

  // -------------------------------------------------------------
  // Export & Import Handlers
  // -------------------------------------------------------------
  getFullSnapshot() {
    return {
      version: "2.6.0",
      exportDate: new Date().toISOString(),
      users: this.getUsers(),
      suites: this.getSuites(),
      testCases: this.getTestCases(),
      defects: this.getDefects(),
      testRuns: this.getTestRuns()
    };
  },

  importSnapshot(jsonObj) {
    if (jsonObj.users && Array.isArray(jsonObj.users)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(jsonObj.users));
    }
    if (jsonObj.suites && Array.isArray(jsonObj.suites)) {
      this.saveSuites(jsonObj.suites, false);
    }
    if (jsonObj.testCases && Array.isArray(jsonObj.testCases)) {
      this.saveTestCases(jsonObj.testCases, false);
    }
    if (jsonObj.defects && Array.isArray(jsonObj.defects)) {
      this.saveDefects(jsonObj.defects, false);
    }
    if (jsonObj.testRuns && Array.isArray(jsonObj.testRuns)) {
      this.saveTestRuns(jsonObj.testRuns, false);
    }
    this.broadcast("SNAPSHOT_IMPORTED");

    if (typeof SupabaseManager !== "undefined" && SupabaseManager.isConnected) {
      SupabaseManager.pushAllLocalToSupabase();
    }
  }
};
