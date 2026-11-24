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
      try { return JSON.parse(raw); } catch (e) { }
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
   * Get or create Supabase client synchronously
   */
  getClient() {
    if (this.client) return this.client;
    if (typeof window !== "undefined" && typeof window.supabase !== "undefined") {
      const config = this.getConfig();
      if (config.url && config.anonKey) {
        try {
          this.client = window.supabase.createClient(config.url, config.anonKey);
          this.isConnected = true;
        } catch (e) {
          console.warn("Error creating Supabase client:", e);
        }
      }
    }
    return this.client;
  },

  /**
   * Initialize Supabase Client
   */
  async init() {
    const client = this.getClient();
    if (!client) {
      this.isConnected = false;
      return false;
    }

    try {
      // Test basic connection by querying suites table
      const { data, error } = await client.from("nexus_suites").select("id").limit(1);
      if (error && error.code !== "PGRST116") {
        console.warn("Supabase connection check warning:", error.message);
        this.isConnected = false;
        return false;
      }

      this.isConnected = true;
      this.setupRealtimeSubscriptions();
      this.setupAuthListener();
      await this.fetchUsersFromSupabase();
      return true;
    } catch (err) {
      console.error("Failed to connect to Supabase:", err);
      this.isConnected = false;
      return false;
    }
  },

  /**
   * Listen for email sign-in link clicks & redirect to Dev/QA hub
   */
  setupAuthListener() {
    if (!this.client) return;

    const handleSession = (session) => {
      if (session && session.user && session.user.email) {
        const email = session.user.email.toLowerCase().trim();
        console.log(`⚡ Supabase Auth Session active for ${email}`);

        const users = StorageManager.getUsers();
        let user = users.find(u => u.email && u.email.toLowerCase() === email);
        if (!user) {
          const isDev = email === "dev@nexusqa.io" || email.includes("dev") || email.includes("lead");
          user = {
            id: `user-${session.user.id.substring(0, 8)}`,
            name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
            email: email,
            role: isDev ? "dev" : "qa",
            roleTitle: isDev ? "Lead Full-Stack Developer" : "QA Tester",
            avatar: email.substring(0, 2).toUpperCase(),
            color: isDev ? "#10b981" : "#6366f1",
            status: "active",
            emailVerified: true,
            createdAt: new Date().toISOString()
          };
          users.push(user);
          StorageManager.saveUsers(users);
        }

        StorageManager.setCurrentUser(user);

        const pathname = window.location.pathname.toLowerCase();
        if (pathname.endsWith("index.html") || pathname === "/" || pathname === "") {
          if (user.role === "dev") {
            window.location.href = "dev.html";
          } else {
            window.location.href = "tester.html";
          }
        }
      }
    };

    // Check existing / redirected session
    this.client.auth.getSession().then(({ data: { session } }) => {
      if (session) handleSession(session);
    });

    // Listen for incoming sign-in events
    this.client.auth.onAuthStateChange(async (event, session) => {
      if (session) handleSession(session);
    });
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
      .on("postgres_changes", { event: "*", schema: "public", table: "nexus_users" }, (payload) => {
        this.handleRemoteUserChange(payload);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "nexus_test_cases" }, (payload) => {
        this.handleRemoteTestCaseChange(payload);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "nexus_defects" }, (payload) => {
        this.handleRemoteDefectChange(payload);
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
  handleRemoteUserChange(payload) {
    const users = StorageManager.getUsers();
    if (payload.eventType === "INSERT") {
      const exists = users.some(u => u.id === payload.new.id || (u.email && u.email.toLowerCase() === (payload.new.email || "").toLowerCase()));
      if (!exists) {
        const mapped = this.mapUserFromDB(payload.new);
        users.push(mapped);
        StorageManager.saveUsers(users, true);
        if (mapped.status === "pending_approval") {
          StorageManager.broadcast("TESTER_APPROVAL_REQUESTED", { user: mapped });
        }
      }
    } else if (payload.eventType === "UPDATE") {
      const idx = users.findIndex(u => u.id === payload.new.id || (u.email && u.email.toLowerCase() === (payload.new.email || "").toLowerCase()));
      const mapped = this.mapUserFromDB(payload.new);
      if (idx !== -1) {
        users[idx] = mapped;
      } else {
        users.push(mapped);
      }
      StorageManager.saveUsers(users, true);
      if (mapped.status === "pending_approval") {
        StorageManager.broadcast("TESTER_APPROVAL_REQUESTED", { user: mapped });
      }
    } else if (payload.eventType === "DELETE") {
      const filtered = users.filter(u => u.id !== payload.old.id);
      StorageManager.saveUsers(filtered, true);
    }
  },
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
    } else if (payload.eventType === "DELETE") {
      const filtered = suites.filter(s => s.id !== payload.old.id);
      StorageManager.saveSuites(filtered, true);
    }
  },

  // -------------------------------------------------------------
  // Data Mappers (DB <-> Client)
  // -------------------------------------------------------------
  mapUserToDB(u) {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      username: u.username || u.email,
      role: u.role || "qa",
      role_title: u.roleTitle || (u.role === "dev" ? "Senior Developer" : "QA Tester"),
      avatar: u.avatar || (u.name ? u.name.slice(0, 2).toUpperCase() : "QA"),
      color: u.color || (u.role === "dev" ? "#10b981" : "#6366f1"),
      status: u.status || "active",
      email_verified: u.emailVerified !== false,
      updated_at: new Date().toISOString()
    };
  },

  mapUserFromDB(row) {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      username: row.username || row.email,
      role: row.role || "qa",
      roleTitle: row.role_title || (row.role === "dev" ? "Senior Developer" : "QA Tester"),
      avatar: row.avatar || (row.name ? row.name.slice(0, 2).toUpperCase() : "QA"),
      color: row.color || (row.role === "dev" ? "#10b981" : "#6366f1"),
      status: row.status || "active",
      emailVerified: row.email_verified !== false,
      createdAt: row.created_at || new Date().toISOString()
    };
  },

  mapTestCaseToDB(tc) {
    const stepsArray = Array.isArray(tc.steps) ? tc.steps : [];
    const hasMeta = Boolean(tc.assignedDev || tc.mediaUrl || tc.image || tc.mediaType || tc.mediaName || tc.explanation || tc.createdAt);
    const stepsPayload = hasMeta
      ? {
          items: stepsArray,
          _meta: {
            explanation: tc.explanation || tc.preconditions || "",
            assignedDev: tc.assignedDev || "",
            mediaUrl: tc.mediaUrl || tc.image || "",
            mediaType: tc.mediaType || (tc.image ? "image" : ""),
            mediaName: tc.mediaName || "",
            createdAt: tc.createdAt || tc.lastRun || ""
          }
        }
      : stepsArray;

    return {
      id: tc.id,
      title: tc.title,
      suite_id: tc.suiteId || null,
      priority: tc.priority || "P1 - High",
      type: tc.type || "Manual",
      status: tc.status || "Untested",
      author: tc.author || "QA Tester",
      last_run: tc.lastRun || tc.createdAt || new Date().toISOString().replace("T", " ").substring(0, 16),
      preconditions: tc.explanation || tc.preconditions || "",
      tags: tc.tags || [],
      steps: stepsPayload,
      updated_at: new Date().toISOString()
    };
  },

  mapTestCaseFromDB(row) {
    const rawSteps = row.steps;
    const isWrapped = rawSteps && !Array.isArray(rawSteps) && Array.isArray(rawSteps.items);
    const stepsArr = isWrapped ? rawSteps.items : (Array.isArray(rawSteps) ? rawSteps : []);
    const meta = (isWrapped && rawSteps._meta) ? rawSteps._meta : {};
    const mediaUrl = meta.mediaUrl || "";
    const mediaType = meta.mediaType || "";

    return {
      id: row.id,
      title: row.title,
      suiteId: row.suite_id,
      priority: row.priority,
      type: row.type || "Manual",
      status: row.status || "Untested",
      author: row.author,
      lastRun: row.last_run,
      createdAt: meta.createdAt || (row.created_at ? row.created_at.substring(0, 16).replace("T", " ") : ""),
      preconditions: row.preconditions || meta.explanation || "",
      explanation: meta.explanation || row.preconditions || "",
      assignedDev: meta.assignedDev || "",
      mediaUrl,
      mediaType,
      mediaName: meta.mediaName || "",
      image: mediaType === "video" ? "" : mediaUrl,
      tags: row.tags || [],
      steps: stepsArr
    };
  },

  mapDefectToDB(d) {
    return {
      id: d.id,
      title: d.summary || d.title || "Defect",
      linked_test_id: d.linkedTestCaseId || d.linked_test_id || null,
      severity: d.severity || "Medium",
      priority: d.priority || "P1 - High",
      assignee: d.assignee || null,
      reporter: d.reportedBy || d.reporter || "QA Tester",
      status: d.status || "Open",
      description: d.description || null,
      repro_steps: d.reproSteps || d.repro_steps || null,
      notes: d.devNotes || d.notes || null,
      dev_pr: d.prLink || d.dev_pr || null,
      dev_branch: d.gitBranch || d.dev_branch || null,
      updated_at: new Date().toISOString()
    };
  },

  mapDefectFromDB(row) {
    return {
      id: row.id,
      title: row.title,
      summary: row.title || row.summary || "Defect",
      linkedTestCaseId: row.linked_test_id || row.linked_test_case_id,
      severity: row.severity,
      priority: row.priority,
      assignee: row.assignee,
      reportedBy: row.reporter || row.reported_by,
      status: row.status,
      description: row.description,
      reproSteps: row.repro_steps || "",
      devNotes: row.notes || row.dev_notes,
      prLink: row.dev_pr || row.pr_link,
      gitBranch: row.dev_branch || row.git_branch,
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
      const [suitesRes, testCasesRes, defectsRes, usersRes] = await Promise.all([
        this.client.from("nexus_suites").select("*"),
        this.client.from("nexus_test_cases").select("*"),
        this.client.from("nexus_defects").select("*").order("created_at", { ascending: false }),
        this.client.from("nexus_users").select("*")
      ]);

      if (suitesRes.data) {
        StorageManager.saveSuites(suitesRes.data, false);
      }
      if (testCasesRes.data) {
        const mapped = testCasesRes.data.map(tc => this.mapTestCaseFromDB(tc));
        StorageManager.saveTestCases(mapped, false);
      }
      if (defectsRes.data) {
        const mapped = defectsRes.data.map(d => this.mapDefectFromDB(d));
        StorageManager.saveDefects(mapped, false);
      }
      if (usersRes.data) {
        const mapped = usersRes.data.map(u => this.mapUserFromDB(u));
        // Exclusively save Supabase database users - DO NOT merge, fallback, or seed dummy users
        StorageManager.saveUsers(mapped, true);
      }

      return true;
    } catch (err) {
      console.error("Error fetching data from Supabase:", err);
      return false;
    }
  },

  async clearAllFromSupabase() {
    if (!this.client || !this.isConnected) return false;
    try {
      await Promise.all([
        this.client.from("nexus_defects").delete().neq("id", "___dummy___"),
        this.client.from("nexus_test_cases").delete().neq("id", "___dummy___")
      ]);
      console.log("⚡ Cleared all test cases and defects from Supabase.");
      return true;
    } catch (err) {
      console.error("Error clearing Supabase database:", err);
      return false;
    }
  },

  async pushAllLocalToSupabase() {
    if (!this.client || !this.isConnected) return false;

    try {
      const suites = StorageManager.getSuites();
      const testCases = StorageManager.getTestCases().map(tc => this.mapTestCaseToDB(tc));
      const defects = StorageManager.getDefects().map(d => this.mapDefectToDB(d));
      const users = StorageManager.getUsers().map(u => this.mapUserToDB(u));

      if (suites.length > 0) await this.client.from("nexus_suites").upsert(suites);
      if (testCases.length > 0) await this.client.from("nexus_test_cases").upsert(testCases);
      if (defects.length > 0) await this.client.from("nexus_defects").upsert(defects);
      if (users.length > 0) await this.client.from("nexus_users").upsert(users);

      return true;
    } catch (err) {
      console.error("Error pushing local data to Supabase:", err);
      return false;
    }
  },

  async pushUsersToSupabase(usersList) {
    const client = this.getClient();
    if (!client || !usersList || usersList.length === 0) return;
    try {
      const payload = usersList.map(u => this.mapUserToDB(u));
      await client.from("nexus_users").upsert(payload);
    } catch (e) {
      console.warn("Error syncing users to Supabase:", e);
    }
  },

  /**
   * Fetch all users exclusively from live Supabase table
   */
  async fetchUsersFromSupabase() {
    const client = this.getClient();
    if (!client) {
      console.warn("Supabase client not initialized.");
      return null;
    }
    try {
      const { data, error } = await client
        .from("nexus_users")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Supabase fetch users error:", error);
        throw error;
      }

      const mapped = (data || []).map(u => this.mapUserFromDB(u));
      // Exclusively save users from Supabase — do not merge or fallback to dummy users
      if (typeof StorageManager !== "undefined") {
        StorageManager.saveUsers(mapped, true);
      }
      return mapped;
    } catch (err) {
      console.error("Failed to fetch users from Supabase:", err);
      throw err;
    }
  },

  /**
   * Update user details directly in Supabase table
   */
  async updateUserInSupabase(userId, updates) {
    const client = this.getClient();
    if (!client) throw new Error("Supabase is not connected.");

    const dbPayload = {
      updated_at: new Date().toISOString()
    };
    if (updates.name !== undefined) {
      dbPayload.name = updates.name.trim();
      const parts = updates.name.trim().split(/\s+/);
      dbPayload.avatar = parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : updates.name.trim().substring(0, 2).toUpperCase();
    }
    if (updates.email !== undefined) dbPayload.email = updates.email.trim();
    if (updates.username !== undefined) dbPayload.username = updates.username.trim();
    if (updates.role !== undefined) dbPayload.role = updates.role;
    if (updates.roleTitle !== undefined) dbPayload.role_title = updates.roleTitle;
    if (updates.role_title !== undefined) dbPayload.role_title = updates.role_title;
    if (updates.avatar !== undefined) dbPayload.avatar = updates.avatar;
    if (updates.color !== undefined) dbPayload.color = updates.color;
    if (updates.status !== undefined) dbPayload.status = updates.status;
    if (updates.emailVerified !== undefined) dbPayload.email_verified = updates.emailVerified !== false;
    if (updates.email_verified !== undefined) dbPayload.email_verified = updates.email_verified !== false;

    const { data, error } = await client
      .from("nexus_users")
      .update(dbPayload)
      .eq("id", userId)
      .select();

    if (error) {
      console.error("Supabase user update error:", error);
      throw error;
    }

    const updated = data && data[0] ? this.mapUserFromDB(data[0]) : null;
    if (updated && typeof StorageManager !== "undefined" && StorageManager.updateUserLocally) {
      StorageManager.updateUserLocally(updated);
    }
    return updated;
  },

  /**
   * Delete user directly from Supabase table
   */
  async deleteUserFromSupabase(userId) {
    const client = this.getClient();
    if (!client) throw new Error("Supabase is not connected.");

    const { error } = await client
      .from("nexus_users")
      .delete()
      .eq("id", userId);

    if (error) {
      console.error("Supabase user delete error:", error);
      throw error;
    }

    if (typeof StorageManager !== "undefined" && StorageManager.removeUserLocally) {
      StorageManager.removeUserLocally(userId);
    }
    return true;
  },

  /**
   * Senior Developer Approves a Member directly in Supabase
   */
  async approveUserInSupabase(userId, approverName = "Senior Developer") {
    return this.updateUserInSupabase(userId, {
      status: "active"
    });
  },

  /**
   * Senior Developer Rejects a Member directly in Supabase
   */
  async rejectUserInSupabase(userId) {
    return this.updateUserInSupabase(userId, {
      status: "rejected"
    });
  },

  // -------------------------------------------------------------
  // Async Mutations with Supabase Sync
  // -------------------------------------------------------------
  async syncUserUpsert(user) {
    const client = this.getClient();
    if (client && user) {
      try {
        const payload = this.mapUserToDB(user);
        const { error } = await client.from("nexus_users").upsert(payload);
        if (error) console.warn("Supabase user upsert error:", error);
      } catch (e) { console.warn("Supabase user upsert error:", e); }
    }
  },

  async syncUserDelete(userId) {
    if (this.client && this.isConnected) {
      try {
        await this.client.from("nexus_users").delete().eq("id", userId);
      } catch (e) { console.warn("Supabase user delete error:", e); }
    }
  },

  async generateNextTestCaseId() {
    let maxNum = 0;
    if (typeof StorageManager !== "undefined") {
      StorageManager.getTestCases().forEach(tc => {
        const m = String(tc.id || "").match(/TC-(\d+)/i);
        if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
      });
    }
    const client = this.getClient();
    if (client) {
      try {
        const { data, error } = await client.from("nexus_test_cases").select("id");
        if (!error && Array.isArray(data)) {
          data.forEach(row => {
            const m = String(row.id || "").match(/TC-(\d+)/i);
            if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
          });
        }
      } catch (e) {
        console.warn("ID generation Supabase lookup warning:", e);
      }
    }
    return `TC-${String(maxNum + 1).padStart(3, "0")}`;
  },

  async fetchDevelopersFromSupabase() {
    const client = this.getClient();
    const users = typeof StorageManager !== "undefined" ? StorageManager.getUsers() : [];
    if (client) {
      try {
        const { data, error } = await client
          .from("nexus_users")
          .select("*")
          .eq("role", "dev")
          .eq("status", "active")
          .order("name", { ascending: true });
        if (!error && Array.isArray(data)) {
          return data.map(u => this.mapUserFromDB(u));
        }
      } catch (e) {
        console.warn("Supabase fetch developers warning:", e);
      }
    }
    return users.filter(u => u.role === "dev" && u.status === "active");
  },

  async uploadEvidenceMedia(file, testCaseId = "TC-001") {
    if (!file) return null;
    const isVideo = (file.type || "").startsWith("video/");
    const mediaType = isVideo ? "video" : "image";
    const fileName = file.name || (isVideo ? `${testCaseId}-recording.webm` : `${testCaseId}-screenshot.png`);
    const safeName = `${testCaseId}-${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    const client = this.getClient();
    if (client) {
      try {
        const { data: buckets } = await client.storage.listBuckets();
        if (Array.isArray(buckets) && buckets.length > 0) {
          const preferred = buckets.find(b => /evidence|media|attach|nexus/i.test(b.name)) || buckets[0];
          const bucketName = preferred.name;
          const { data, error } = await client.storage
            .from(bucketName)
            .upload(`test-cases/${safeName}`, file, { contentType: file.type || undefined, upsert: true });

          if (!error && data) {
            const { data: pub } = client.storage.from(bucketName).getPublicUrl(data.path);
            if (pub && pub.publicUrl) {
              return { url: pub.publicUrl, storage: "supabase", bucket: bucketName, mediaType, mediaName: fileName };
            }
          }
        }
      } catch (e) {
        console.warn("Supabase Storage upload fallback:", e);
      }
    }

    return new Promise((resolve, reject) => {
      if (isVideo && file.size > 4 * 1024 * 1024) {
        resolve({
          url: URL.createObjectURL(file),
          storage: "session-preview",
          mediaType: "video",
          mediaName: fileName
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        resolve({
          url: evt.target.result,
          storage: "embedded",
          mediaType,
          mediaName: fileName
        });
      };
      reader.onerror = () => reject(new Error("Failed to read media file"));
      reader.readAsDataURL(file);
    });
  },

  async syncSuiteUpsert(suite) {
    const client = this.getClient();
    if (client && suite) {
      try {
        const { error } = await client.from("nexus_suites").upsert({
          id: suite.id,
          name: suite.name,
          description: suite.description || "",
          icon: suite.icon || "fa-solid fa-folder"
        });
        if (error) console.warn("Supabase suite upsert error:", error);
      } catch (e) { console.warn("Supabase suite upsert error:", e); }
    }
  },

  async ensureSuiteInSupabase(suiteId) {
    const client = this.getClient();
    if (!client || !suiteId) return;
    try {
      const suites = typeof StorageManager !== "undefined" ? StorageManager.getSuites() : [];
      const suite = suites.find(s => s.id === suiteId);
      if (suite) {
        await client.from("nexus_suites").upsert({
          id: suite.id,
          name: suite.name,
          description: suite.description || "",
          icon: suite.icon || "fa-solid fa-folder"
        });
      }
    } catch (e) {
      console.warn("Supabase suite ensure warning:", e);
    }
  },

  async syncTestCaseUpsert(testCase) {
    const client = this.getClient();
    if (client) {
      try {
        if (testCase.suiteId) {
          await this.ensureSuiteInSupabase(testCase.suiteId);
        }
        const { error } = await client.from("nexus_test_cases").upsert(this.mapTestCaseToDB(testCase));
        if (error) {
          console.warn("Supabase testcase upsert error:", error);
          return { ok: false, error };
        }
        return { ok: true };
      } catch (e) {
        console.warn("Supabase testcase upsert error:", e);
        return { ok: false, error: e };
      }
    }
    return { ok: false };
  },

  async syncTestCaseDelete(testCaseId) {
    if (this.client && this.isConnected) {
      try {
        await this.client.from("nexus_test_cases").delete().eq("id", testCaseId);
      } catch (e) { console.warn("Supabase testcase delete error:", e); }
    }
  },

  async syncDefectUpsert(defect) {
    if (this.client && this.isConnected) {
      try {
        await this.client.from("nexus_defects").upsert(this.mapDefectToDB(defect));
      } catch (e) { console.warn("Supabase defect upsert error:", e); }
    }
  },

  async syncDefectDelete(defectId) {
    if (this.client && this.isConnected) {
      try {
        await this.client.from("nexus_defects").delete().eq("id", defectId);
      } catch (e) { console.warn("Supabase defect delete error:", e); }
    }
  },

  async syncTestRunUpsert(testRun) {
    if (this.client && this.isConnected) {
      try {
        await this.client.from("nexus_test_runs").upsert(this.mapTestRunToDB(testRun));
      } catch (e) { console.warn("Supabase test run upsert error:", e); }
    }
  }
};

