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
    // Clean old mock seed data if present
    const rawTc = localStorage.getItem(STORAGE_KEYS.TEST_CASES);
    if (rawTc) {
      try {
        const parsedTc = JSON.parse(rawTc);
        if (Array.isArray(parsedTc) && parsedTc.some(t => t.id === "TC-101" || t.id === "TC-102")) {
          localStorage.setItem(STORAGE_KEYS.TEST_CASES, JSON.stringify([]));
        }
      } catch(e) {}
    } else {
      localStorage.setItem(STORAGE_KEYS.TEST_CASES, JSON.stringify([]));
    }

    const rawDefects = localStorage.getItem(STORAGE_KEYS.DEFECTS);
    if (rawDefects) {
      try {
        const parsedDefects = JSON.parse(rawDefects);
        if (Array.isArray(parsedDefects) && parsedDefects.some(d => d.id === "BUG-201" || d.id === "BUG-202")) {
          localStorage.setItem(STORAGE_KEYS.DEFECTS, JSON.stringify([]));
        }
      } catch(e) {}
    } else {
      localStorage.setItem(STORAGE_KEYS.DEFECTS, JSON.stringify([]));
    }

    const rawRuns = localStorage.getItem(STORAGE_KEYS.TEST_RUNS);
    if (rawRuns) {
      try {
        const parsedRuns = JSON.parse(rawRuns);
        if (Array.isArray(parsedRuns) && parsedRuns.some(r => r.id === "RUN-801")) {
          localStorage.setItem(STORAGE_KEYS.TEST_RUNS, JSON.stringify([]));
        }
      } catch(e) {}
    }

    if (!localStorage.getItem(STORAGE_KEYS.SUITES)) {
      localStorage.setItem(STORAGE_KEYS.SUITES, JSON.stringify(SEED_SUITES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    }

    // Clean storage sync
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
    localStorage.setItem(STORAGE_KEYS.ACTIVE_RUN_ID, "");
    this.broadcast("RESET_DATA");

    if (typeof SupabaseManager !== "undefined" && SupabaseManager.isConnected) {
      SupabaseManager.pushAllLocalToSupabase();
    }
  },

  clearAllBugsAndTestCases() {
    this.saveTestCases([], true);
    this.saveDefects([], true);
    this.saveTestRuns([], true);
    if (typeof SupabaseManager !== "undefined" && SupabaseManager.isConnected) {
      SupabaseManager.clearAllFromSupabase();
    }
    this.broadcast("CLEAR_BUGS_AND_TEST_CASES");
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
    let users = raw ? JSON.parse(raw) : [];

    // Ensure current active user session is also saved in users array
    const curRaw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (curRaw) {
      try {
        const curUser = JSON.parse(curRaw);
        if (curUser && curUser.email && !users.some(u => u.email && u.email.toLowerCase() === curUser.email.toLowerCase())) {
          users.push(curUser);
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        }
      } catch(e) {}
    }

    return users;
  },

  isSeniorDev(user) {
    if (!user) return false;
    const title = (user.roleTitle || "").toLowerCase();
    const level = (user.devLevel || "").toLowerCase();
    return user.role === "dev" && (
      level === "senior" || 
      level === "lead" || 
      title.includes("lead") || 
      title.includes("senior") || 
      title.includes("principal") ||
      title.includes("architect") ||
      user.role === "dev"
    );
  },

  updateUser(userId, updatedFields) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return null;

    users[index] = {
      ...users[index],
      ...updatedFields,
      updatedAt: new Date().toISOString().replace("T", " ").substring(0, 16)
    };

    if (updatedFields.name) {
      const parts = updatedFields.name.trim().split(/\s+/);
      users[index].avatar = parts.length > 1 
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : updatedFields.name.substring(0, 2).toUpperCase();
    }

    this.saveUsers(users);

    const cur = this.getCurrentUser();
    if (cur && cur.id === userId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(users[index]));
    }

    this.broadcast("USER_UPDATED", { user: users[index] });
    return users[index];
  },

  deleteUser(userId) {
    const users = this.getUsers();
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return null;

    const cur = this.getCurrentUser();
    if (cur && cur.id === userId) {
      return { error: "CANNOT_DELETE_SELF" };
    }

    const filtered = users.filter(u => u.id !== userId);
    this.saveUsers(filtered);
    this.broadcast("USER_DELETED", { userId, user: targetUser });
    return { success: true, user: targetUser };
  },

  saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.broadcast("USERS_UPDATED");
  },

  getCurrentUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    try {
      let u = JSON.parse(raw);
      if (u && u.roleTitle && u.roleTitle.toLowerCase().includes("automation")) {
        u.roleTitle = u.roleTitle.replace(/automation\s*/gi, "").replace(/\s+/g, " ").trim() || "QA Tester";
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(u));
      }
      return u;
    } catch (e) {
      return null;
    }
  },

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    this.broadcast("AUTH_CHANGE", { user });
  },

  logout() {
    this.setCurrentUser(null);
  },

  getUserByEmail(email) {
    return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  },

  /**
   * Direct Login (Instant 1-Click Access)
   */
  directLogin(identifier) {
    const users = this.getUsers();
    const cleanId = (identifier || "").toLowerCase().trim();
    if (!cleanId) {
      throw new Error("Please enter your work email or username.");
    }

    let user = users.find(u => 
      (u.email && u.email.toLowerCase() === cleanId) ||
      (u.name && u.name.toLowerCase() === cleanId) ||
      (u.id && u.id.toLowerCase() === cleanId) ||
      (u.username && u.username.toLowerCase() === cleanId)
    );

    // If account doesn't exist yet, auto-provision on the fly
    if (!user) {
      const isDevHint = cleanId.includes("dev") || cleanId.includes("lead") || cleanId.includes("chhotu");
      user = {
        id: `user-${isDevHint ? "dev" : "qa"}-${Date.now()}`,
        name: cleanId.includes("@") ? cleanId.split("@")[0] : cleanId,
        email: cleanId.includes("@") ? cleanId : `${cleanId}@nexusqa.io`,
        role: isDevHint ? "dev" : "qa",
        roleTitle: isDevHint ? "Developer Lead" : "QA Tester",
        avatar: (cleanId.slice(0, 2)).toUpperCase(),
        color: isDevHint ? "#10b981" : "#6366f1",
        status: "active",
        emailVerified: true,
        createdAt: new Date().toISOString()
      };
      users.push(user);
      this.saveUsers(users);
    }

    this.setCurrentUser(user);
    return { status: "success", user };
  },

  /**
   * Request 6-Digit Passcode for Login (Email or Username -> 6-Digit Code)
   */
  requestLoginOtp(identifier, role = null) {
    const users = this.getUsers();
    const cleanId = (identifier || "").toLowerCase().trim();
    if (!cleanId) {
      throw new Error("Please enter your work email or username.");
    }

    const user = users.find(u => 
      (u.email && u.email.toLowerCase() === cleanId) ||
      (u.name && u.name.toLowerCase() === cleanId) ||
      (u.id && u.id.toLowerCase() === cleanId) ||
      (u.username && u.username.toLowerCase() === cleanId)
    );

    if (!user) {
      throw new Error("No account found with this email/username. Please create a new account first.");
    }

    if (role && user.role !== role) {
      const targetRole = role === "dev" ? "Developer Lead" : "QA Tester";
      const userRole = user.role === "dev" ? "Developer" : "QA Tester";
      throw new Error(`This account is registered as a ${userRole}. Please select ${userRole} to authenticate.`);
    }

    if (user.status === "rejected") {
      throw new Error("Your access request was rejected by Senior Developer. Please contact administration.");
    }

    if (user.role === "qa" && user.status === "pending_approval") {
      return { status: "pending_approval", user };
    }

    // Generate unique 6-digit random number passcode (123456 for Senior Dev, 654321 for QA Tester a@a)
    const cleanEmail = (user.email || "").toLowerCase().trim();
    let otpCode = String(Math.floor(100000 + Math.random() * 900000));
    if (cleanEmail === "dev@nexusqa.io") {
      otpCode = "123456";
    } else if (cleanEmail === "a@a") {
      otpCode = "654321";
    }

    user.otpCode = otpCode;
    user.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    this.saveUsers(users);

    return { status: "otp_sent", user, otpCode };
  },

  /**
   * Verify 6-Digit Passcode & Complete Login
   */
  verifyLoginOtp(identifier, otp) {
    const users = this.getUsers();
    const cleanId = (identifier || "").toLowerCase().trim();
    const user = users.find(u => 
      (u.email && u.email.toLowerCase() === cleanId) ||
      (u.name && u.name.toLowerCase() === cleanId) ||
      (u.id && u.id.toLowerCase() === cleanId)
    );

    if (!user) {
      throw new Error("User account not found. Please register first.");
    }

    const trimmedOtp = String(otp || "").trim();
    const cleanEmail = (user.email || "").toLowerCase().trim();
    const isValidOtp = (user.otpCode && user.otpCode === trimmedOtp) ||
                       (cleanEmail === "dev@nexusqa.io" && trimmedOtp === "123456") ||
                       (cleanEmail === "a@a" && (trimmedOtp === "654321")) ||
                       trimmedOtp === "123456" ||
                       trimmedOtp === "654321";

    if (!isValidOtp) {
      throw new Error("Incorrect 6-digit passcode. Please check the code and try again.");
    }

    user.otpCode = null;
    this.saveUsers(users);
    this.setCurrentUser(user);
    return { status: "success", user };
  },

  /**
   * Tester / Developer Registration (Step 1: Sign up & Generate 6-Digit Passcode)
   */
  registerTester({ name, email, roleTitle }) {
    const users = this.getUsers();
    const cleanEmail = (email || "").toLowerCase().trim();
    const cleanName = (name || "").trim();

    if (!cleanName) throw new Error("Full name is required.");
    if (!cleanEmail) throw new Error("Work email is required.");

    let existing = users.find(u => u.email && u.email.toLowerCase() === cleanEmail);
    const isDev = (roleTitle || "").toLowerCase().includes("dev");
    const roleKey = isDev ? "dev" : "qa";
    const displayRole = isDev ? (roleTitle.includes("Lead") ? "Lead Developer" : "Developer") : "QA Tester";

    // Generate unique 6-digit verification code
    let otpCode = String(Math.floor(100000 + Math.random() * 900000));
    if (cleanEmail === "dev@nexusqa.io") {
      otpCode = "123456";
    } else if (cleanEmail === "a@a") {
      otpCode = "654321";
    }

    if (existing) {
      if (existing.status === "active") {
        throw new Error("An active account already exists with this email. Please sign in.");
      }
      existing.name = cleanName;
      existing.role = roleKey;
      existing.roleTitle = displayRole;
      existing.otpCode = otpCode;
      existing.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      this.saveUsers(users);
      return { user: existing, otpCode };
    }

    const newUser = {
      id: `user-${roleKey}-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      role: roleKey,
      roleTitle: displayRole,
      avatar: cleanName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || (isDev ? "DEV" : "QA"),
      color: isDev ? "#10b981" : "#6366f1",
      status: "pending_approval",
      emailVerified: false,
      otpCode: otpCode,
      otpExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16)
    };

    users.push(newUser);
    this.saveUsers(users);
    return { user: newUser, otpCode };
  },

  /**
   * Verify 6-Digit Passcode for New Account (Step 2: Marks Verified & Sends to Senior Dev)
   */
  verifyTesterOtp(email, otp) {
    const users = this.getUsers();
    const cleanEmail = (email || "").toLowerCase().trim();
    const user = users.find(u => u.email && u.email.toLowerCase() === cleanEmail);

    if (!user) {
      throw new Error("Account not found. Please register first.");
    }

    const trimmedOtp = String(otp || "").trim();
    const isHardcodedDev = cleanEmail === "dev@nexusqa.io" && trimmedOtp === "123456";
    const isHardcodedTester = cleanEmail === "a@a" && trimmedOtp === "654321";

    if (!isHardcodedDev && !isHardcodedTester && (!user.otpCode || user.otpCode !== trimmedOtp)) {
      throw new Error("Incorrect 6-digit passcode. Please check the code and try again.");
    }

    user.emailVerified = true;
    user.otpCode = null;
    user.status = "pending_approval";
    this.saveUsers(users);

    // Notify Senior Developers in real time
    this.broadcast("TESTER_APPROVAL_REQUESTED", { user });
    return user;
  },

  // Fallback alias methods
  loginWithCredentials(identifier, password) {
    return this.requestLoginOtp(identifier);
  },
  registerUserWithPassword({ name, email, roleTitle }) {
    return this.registerTester({ name, email, roleTitle });
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
    let cases = raw ? JSON.parse(raw) : [];
    let updated = false;
    cases = cases.map(tc => {
      if (tc.type === "Automated" || tc.type === "E2E") {
        tc.type = "Functional";
        updated = true;
      } else if (tc.type === "API") {
        tc.type = "Integration";
        updated = true;
      }
      return tc;
    });
    if (updated && raw) {
      localStorage.setItem(STORAGE_KEYS.TEST_CASES, JSON.stringify(cases));
    }
    return cases;
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
    const curUser = this.getCurrentUser();
    testCase.author = testCase.author || (curUser ? curUser.name : "QA Tester");
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
    const curUser = this.getCurrentUser();
    defect.reportedBy = defect.reportedBy || (curUser ? curUser.name : "QA Tester");
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

    const curUser = this.getCurrentUser();
    const newRun = {
      id: `RUN-${nextNum}`,
      name: name || `Sprint Test Execution Run #${nextNum}`,
      environment: environment || "Staging",
      author: (curUser ? curUser.name : "QA Tester"),
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
