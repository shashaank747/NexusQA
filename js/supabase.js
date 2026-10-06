/**
 * NexusQA - Supabase Cloud Database Client & Real-time Sync Engine
 */

const SUPABASE_CONFIG_KEY = "nexusqa_supabase_config";

const SupabaseManager = {
  client: null,
  isConnected: false,
  realtimeChannel: null,

  /**
   * Get stored Supabase credentials
   */
  getConfig() {
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (raw) {
      try { return JSON.parse(raw); } catch(e) {}
    }
    return {
      url: "https://tbwklqcundyvnnrwidmn.supabase.co",
      anonKey: "sb_publishable_YKWeDIVSbs4MZrgcqHwlaw_TbV2BAeE",
      autoSync: true
    };
  },

  /**
   * Save credentials and initialize client
   */
  saveConfig(url, anonKey, autoSync = true) {
    const config = { url: url.trim(), anonKey: anonKey.trim(), autoSync };
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
    return this.init();
  },

  /**
   * Initialize Supabase Client
   */
  async init() {
    const config = this.getConfig();
    if (!config.url || !config.anonKey) {
      this.isConnected = false;
      this.client = null;
      return false;
    }

    if (typeof window.supabase === "undefined") {
      console.warn("Supabase SDK not loaded in window.");
      return false;
    }

    try {
      this.client = window.supabase.createClient(config.url, config.anonKey);
      
      // Test basic connection by querying suites table
      const { data, error } = await this.client.from("nexus_suites").select("id").limit(1);
      if (error && error.code !== "PGRST116") {
        console.warn("Supabase connection check warning:", error.message);
        this.isConnected = false;
        return false;
      }

      this.isConnected = true;
      this.setupRealtimeSubscriptions();
      return true;
    } catch (err) {
      console.error("Failed to connect to Supabase:", err);
      this.isConnected = false;
      return false;
    }
  },

  /**
   * Setup Supabase Real-time Postgres Channel
   */
  setupRealtimeSubscriptions() {
    if (!this.client || !this.isConnected) return;

    if (this.realtimeChannel) {
      this.client.removeChannel(this.realtimeChannel);
    }

    this.realtimeChannel = this.client
      .channel("nexusqa_db_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "nexus_test_cases" }, (payload) => {
        this.handleRemoteTestCaseChange(payload);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "nexus_defects" }, (payload) => {
        this.handleRemoteDefectChange(payload);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "nexus_test_runs" }, (payload) => {
        this.handleRemoteTestRunChange(payload);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "nexus_suites" }, (payload) => {
        this.handleRemoteSuiteChange(payload);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("⚡ Supabase Realtime Channel Connected!");
        }
      });
  },

  // -------------------------------------------------------------
  // Remote Realtime Event Handlers
  // -------------------------------------------------------------
  handleRemoteTestCaseChange(payload) {
    const cases = StorageManager.getTestCases();
    if (payload.eventType === "INSERT") {
      const exists = cases.some(c => c.id === payload.new.id);
      if (!exists) {
        cases.unshift(this.mapTestCaseFromDB(payload.new));
        StorageManager.saveTestCases(cases, true);
      }
    } else if (payload.eventType === "UPDATE") {
      const idx = cases.findIndex(c => c.id === payload.new.id);
      if (idx !== -1) {
        cases[idx] = this.mapTestCaseFromDB(payload.new);
        StorageManager.saveTestCases(cases, true);
      }
    } else if (payload.eventType === "DELETE") {
      const filtered = cases.filter(c => c.id !== payload.old.id);
      StorageManager.saveTestCases(filtered, true);
    }
  },

  handleRemoteDefectChange(payload) {
    const defects = StorageManager.getDefects();
    if (payload.eventType === "INSERT") {
      const exists = defects.some(d => d.id === payload.new.id);
      if (!exists) {
        defects.unshift(this.mapDefectFromDB(payload.new));
        StorageManager.saveDefects(defects, true);
      }
    } else if (payload.eventType === "UPDATE") {
      const idx = defects.findIndex(d => d.id === payload.new.id);
      if (idx !== -1) {
        defects[idx] = this.mapDefectFromDB(payload.new);
        StorageManager.saveDefects(defects, true);
      }
    } else if (payload.eventType === "DELETE") {
      const filtered = defects.filter(d => d.id !== payload.old.id);
      StorageManager.saveDefects(filtered, true);
    }
  },

  handleRemoteTestRunChange(payload) {
    const runs = StorageManager.getTestRuns();
    if (payload.eventType === "INSERT") {
      const exists = runs.some(r => r.id === payload.new.id);
      if (!exists) {
        runs.unshift(this.mapTestRunFromDB(payload.new));
        StorageManager.saveTestRuns(runs, true);
      }
    } else if (payload.eventType === "UPDATE") {
      const idx = runs.findIndex(r => r.id === payload.new.id);
      if (idx !== -1) {
        runs[idx] = this.mapTestRunFromDB(payload.new);
        StorageManager.saveTestRuns(runs, true);
      }
    }
  },

  handleRemoteSuiteChange(payload) {
    const suites = StorageManager.getSuites();
    if (payload.eventType === "INSERT") {
      const exists = suites.some(s => s.id === payload.new.id);
      if (!exists) {
        suites.push(payload.new);
        StorageManager.saveSuites(suites, true);
      }
    } else if (payload.eventType === "UPDATE") {
      const idx = suites.findIndex(s => s.id === payload.new.id);
      if (idx !== -1) {
        suites[idx] = payload.new;
        StorageManager.saveSuites(suites, true);
      }
    }
  },

  // -------------------------------------------------------------
  // Data Mappers (DB <-> Client)
  // -------------------------------------------------------------
  mapTestCaseToDB(tc) {
    return {
      id: tc.id,
      title: tc.title,
      suite_id: tc.suiteId,
      priority: tc.priority,
      type: tc.type,
      status: tc.status,
      author: tc.author,
      last_run: tc.lastRun,
      preconditions: tc.preconditions,
      tags: tc.tags || [],
      steps: tc.steps || [],
      updated_at: new Date().toISOString()
    };
  },

  mapTestCaseFromDB(row) {
    return {
      id: row.id,
      title: row.title,
      suiteId: row.suite_id,
      priority: row.priority,
      type: row.type,
      status: row.status,
      author: row.author,
      lastRun: row.last_run,
      preconditions: row.preconditions,
      tags: row.tags || [],
      steps: row.steps || []
    };
  },

  mapDefectToDB(d) {
    return {
      id: d.id,
      summary: d.summary,
      linked_test_case_id: d.linkedTestCaseId,
      severity: d.severity,
      priority: d.priority,
      assignee: d.assignee,
      reported_by: d.reportedBy,
      status: d.status,
      description: d.description,
      dev_notes: d.devNotes,
      pr_link: d.prLink,
      git_branch: d.gitBranch,
      updated_at: new Date().toISOString()
    };
  },

  mapDefectFromDB(row) {
    return {
      id: row.id,
      summary: row.summary,
      linkedTestCaseId: row.linked_test_case_id,
      severity: row.severity,
      priority: row.priority,
      assignee: row.assignee,
      reportedBy: row.reported_by,
      status: row.status,
      description: row.description,
      devNotes: row.dev_notes,
      prLink: row.pr_link,
      gitBranch: row.git_branch,
      createdAt: row.created_at ? row.created_at.substring(0, 16).replace("T", " ") : "",
      updatedAt: row.updated_at ? row.updated_at.substring(0, 16).replace("T", " ") : ""
    };
  },

  mapTestRunToDB(r) {
    return {
      id: r.id,
      name: r.name,
      environment: r.environment,
      author: r.author,
      date: r.date,
      duration: r.duration,
      status: r.status,
      test_case_ids: r.testCaseIds || [],
      results: r.results || {},
      updated_at: new Date().toISOString()
    };
  },

  mapTestRunFromDB(row) {
    return {
      id: row.id,
      name: row.name,
      environment: row.environment,
      author: row.author,
      date: row.date,
      duration: row.duration,
      status: row.status,
      testCaseIds: row.test_case_ids || [],
      results: row.results || {}
    };
  },

  // -------------------------------------------------------------
  // Full Cloud Sync Operations (Pull & Push)
  // -------------------------------------------------------------
  async fetchAllFromSupabase() {
    if (!this.client || !this.isConnected) return false;

    try {
      const [suitesRes, testCasesRes, defectsRes, runsRes, usersRes] = await Promise.all([
        this.client.from("nexus_suites").select("*"),
        this.client.from("nexus_test_cases").select("*"),
        this.client.from("nexus_defects").select("*").order("created_at", { ascending: false }),
        this.client.from("nexus_test_runs").select("*").order("created_at", { ascending: false }),
        this.client.from("nexus_users").select("*")
      ]);

      if (suitesRes.data && suitesRes.data.length > 0) {
        StorageManager.saveSuites(suitesRes.data, false);
      }
      if (testCasesRes.data && testCasesRes.data.length > 0) {
        const mapped = testCasesRes.data.map(tc => this.mapTestCaseFromDB(tc));
        StorageManager.saveTestCases(mapped, false);
      }
      if (defectsRes.data && defectsRes.data.length > 0) {
        const mapped = defectsRes.data.map(d => this.mapDefectFromDB(d));
        StorageManager.saveDefects(mapped, false);
      }
      if (runsRes.data && runsRes.data.length > 0) {
        const mapped = runsRes.data.map(r => this.mapTestRunFromDB(r));
        StorageManager.saveTestRuns(mapped, false);
      }

      return true;
    } catch (err) {
      console.error("Error fetching data from Supabase:", err);
      return false;
    }
  },

  async pushAllLocalToSupabase() {
    if (!this.client || !this.isConnected) return false;

    try {
      const suites = StorageManager.getSuites();
      const testCases = StorageManager.getTestCases().map(tc => this.mapTestCaseToDB(tc));
      const defects = StorageManager.getDefects().map(d => this.mapDefectToDB(d));
      const runs = StorageManager.getTestRuns().map(r => this.mapTestRunToDB(r));
      const users = StorageManager.getUsers();

      if (suites.length > 0) await this.client.from("nexus_suites").upsert(suites);
      if (testCases.length > 0) await this.client.from("nexus_test_cases").upsert(testCases);
      if (defects.length > 0) await this.client.from("nexus_defects").upsert(defects);
      if (runs.length > 0) await this.client.from("nexus_test_runs").upsert(runs);
      if (users.length > 0) await this.client.from("nexus_users").upsert(users);

      return true;
    } catch (err) {
      console.error("Error pushing local data to Supabase:", err);
      return false;
    }
  },

  // -------------------------------------------------------------
  // Async Mutations with Supabase Sync
  // -------------------------------------------------------------
  async syncTestCaseUpsert(testCase) {
    if (this.client && this.isConnected) {
      try {
        await this.client.from("nexus_test_cases").upsert(this.mapTestCaseToDB(testCase));
      } catch(e) { console.warn("Supabase testcase upsert error:", e); }
    }
  },

  async syncTestCaseDelete(testCaseId) {
    if (this.client && this.isConnected) {
      try {
        await this.client.from("nexus_test_cases").delete().eq("id", testCaseId);
      } catch(e) { console.warn("Supabase testcase delete error:", e); }
    }
  },

  async syncDefectUpsert(defect) {
    if (this.client && this.isConnected) {
      try {
        await this.client.from("nexus_defects").upsert(this.mapDefectToDB(defect));
      } catch(e) { console.warn("Supabase defect upsert error:", e); }
    }
  },

  async syncDefectDelete(defectId) {
    if (this.client && this.isConnected) {
      try {
        await this.client.from("nexus_defects").delete().eq("id", defectId);
      } catch(e) { console.warn("Supabase defect delete error:", e); }
    }
  },

  async syncTestRunUpsert(testRun) {
    if (this.client && this.isConnected) {
      try {
        await this.client.from("nexus_test_runs").upsert(this.mapTestRunToDB(testRun));
      } catch(e) { console.warn("Supabase test run upsert error:", e); }
    }
  },

  /**
   * Send real OTP / Magic Link email to user via Supabase Auth
   */
  async sendRealEmailOtp(email) {
    if (!this.client || !this.isConnected) {
      console.log(`ℹ️ [Supabase Mail] Simulating real email OTP dispatch to ${email}`);
      return { success: true, simulated: true };
    }

    try {
      const { data, error } = await this.client.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: true
        }
      });
      if (error) throw error;
      console.log(`✅ [Supabase Mail] Real OTP email dispatched to ${email}`);
      return { success: true, data };
    } catch (err) {
      console.warn(`⚠️ [Supabase Mail] Could not send via Supabase Auth (${err.message}). Falling back to local token dispatch.`);
      return { success: false, error: err.message };
    }
  }
};
