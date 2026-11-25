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
      .on("postgres_changes", { event: "*", schema: "public", table: "nexus_conference_messages" }, (payload) => {
        this.handleRemoteConferenceMessageChange(payload);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "nexus_activity_logs" }, (payload) => {
        this.handleRemoteActivityLogChange(payload);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "nexus_media_attachments" }, (payload) => {
        this.handleRemoteMediaAttachmentChange(payload);
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

  handleRemoteConferenceMessageChange(payload) {
    if (typeof StorageManager === "undefined") return;
    if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
      const mapped = this.mapConferenceMessageFromDB(payload.new);
      if (StorageManager.mergeRemoteConferenceMessages) {
        StorageManager.mergeRemoteConferenceMessages([mapped], mapped.projectId);
      }
    } else if (payload.eventType === "DELETE" && payload.old && payload.old.id) {
      if (StorageManager.removeConferenceMessageLocally) {
        StorageManager.removeConferenceMessageLocally(payload.old.id);
      }
    }
  },

  mapConferenceMessageToDB(msg) {
    return {
      id: msg.id,
      project_id: msg.projectId || "proj-1",
      project_slug: msg.projectSlug || "",
      sender_id: msg.senderId || "",
      sender_name: msg.senderName || "Team Member",
      sender_role: msg.senderRole || "qa",
      role_title: msg.roleTitle || "",
      sender_avatar: msg.senderAvatar || "QA",
      message_type: msg.messageType || "text",
      meet_url: msg.meetUrl || "",
      text: msg.text || "",
      time_label: msg.time || "",
      date_label: msg.date || "Today"
    };
  },

  mapConferenceMessageFromDB(row) {
    const createdMs = row.created_at ? new Date(row.created_at).getTime() : Date.now();
    const fallbackTime = row.created_at
      ? new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";
    return {
      id: row.id,
      projectId: row.project_id || "proj-1",
      projectSlug: row.project_slug || "",
      senderId: row.sender_id || "",
      senderName: row.sender_name || "Team Member",
      senderRole: row.sender_role || "qa",
      roleTitle: row.role_title || "",
      senderAvatar: row.sender_avatar || "QA",
      messageType: row.message_type || (row.meet_url ? "google_meet_invite" : "text"),
      meetUrl: row.meet_url || "",
      text: row.text || "",
      time: row.time_label || fallbackTime,
      date: row.date_label || "Today",
      timestamp: isNaN(createdMs) ? Date.now() : createdMs
    };
  },

  // -------------------------------------------------------------
  // Data Mappers & Schema-Resilient Helpers (DB <-> Client)
  // -------------------------------------------------------------
  _missingTables: new Set(),
  _baseOnlyTables: new Set(),
  _missingStorageBuckets: new Set(),

  isSchemaError(error) {
    if (!error) return false;
    const code = String(error.code || "");
    const msg = String(error.message || "");
    return code === "PGRST204" || code === "PGRST205" || msg.includes("schema cache") || msg.includes("column");
  },

  markTableStateFromError(tableName, error) {
    if (!error) return;
    const code = String(error.code || "");
    const msg = String(error.message || "");
    if (code === "PGRST205" || msg.includes(`public.${tableName}`) || msg.includes(`'${tableName}'`)) {
      this._missingTables.add(tableName);
    } else if (code === "PGRST204" || msg.includes("column")) {
      this._baseOnlyTables.add(tableName);
    }
  },

  async upsertWithSchemaFallback(tableName, extendedPayload, basePayload = null) {
    const client = this.getClient();
    if (!client) return { ok: false, error: "Supabase client unavailable" };
    if (this._missingTables.has(tableName)) return { ok: false, missingTable: true };
    try {
      if (this._baseOnlyTables.has(tableName) && basePayload) {
        const retry = await client.from(tableName).upsert(basePayload);
        return retry.error ? { ok: false, error: retry.error } : { ok: true, usedBaseFallback: true };
      }
      const { error } = await client.from(tableName).upsert(extendedPayload);
      if (!error) return { ok: true };
      this.markTableStateFromError(tableName, error);
      if (basePayload && this.isSchemaError(error)) {
        const retry = await client.from(tableName).upsert(basePayload);
        if (!retry.error) return { ok: true, usedBaseFallback: true };
        return { ok: false, error: retry.error };
      }
      return { ok: false, error };
    } catch (e) {
      return { ok: false, error: e };
    }
  },

  handleRemoteActivityLogChange(payload) {
    if (typeof StorageManager === "undefined" || !StorageManager.mergeRemoteActivityLogs) return;
    if (payload.eventType === "INSERT" && payload.new) {
      StorageManager.mergeRemoteActivityLogs([this.mapActivityLogFromDB(payload.new)]);
    }
  },

  handleRemoteMediaAttachmentChange(payload) {
    if (typeof StorageManager === "undefined" || !StorageManager.mergeRemoteMediaAttachments) return;
    if ((payload.eventType === "INSERT" || payload.eventType === "UPDATE") && payload.new) {
      StorageManager.mergeRemoteMediaAttachments([this.mapMediaAttachmentFromDB(payload.new)]);
    }
  },

  mapActivityLogFromDB(row) {
    return {
      id: row.id,
      userId: row.user_id || "",
      username: row.username || "Unknown",
      userRole: row.user_role || "qa",
      actionType: row.action_type || "activity",
      targetType: row.target_type || "",
      targetId: row.target_id || "",
      oldValue: row.old_value ?? "",
      newValue: row.new_value ?? "",
      details: row.details || {},
      createdAt: row.created_at || new Date().toISOString()
    };
  },

  mapMediaAttachmentFromDB(row) {
    return {
      id: row.id,
      testCaseId: row.test_case_id || "",
      defectId: row.defect_id || "",
      uploadedBy: row.uploaded_by || "",
      uploaderName: row.uploader_name || "Team Member",
      fileName: row.file_name || "evidence",
      fileType: row.file_type || "image",
      fileUrl: row.file_url || "",
      fileSizeBytes: row.file_size_bytes || 0,
      createdAt: row.created_at || new Date().toISOString()
    };
  },

  mapUserToBaseDB(u) {
    return {
      id: u.id,
      name: u.fullName || u.name,
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

  mapUserToDB(u) {
    const base = this.mapUserToBaseDB(u);
    return {
      ...base,
      full_name: u.fullName || u.name || "",
      avatar_url: u.avatarUrl || u.photo || "",
      phone: u.phone || "",
      department: u.department || "",
      bio: u.bio || "",
      last_login_at: u.lastLoginAt || null,
      last_logout_at: u.lastLogoutAt || null,
      is_online: Boolean(u.isOnline)
    };
  },

  mapUserFromDB(row, existingLocal = null) {
    const displayName = row.full_name || row.name;
    const avatarUrl = row.avatar_url !== undefined ? row.avatar_url : (existingLocal?.avatarUrl || existingLocal?.photo || "");
    const hasExtendedPresence = row.is_online !== undefined;
    return {
      id: row.id,
      name: displayName,
      fullName: displayName,
      email: row.email,
      username: row.username || row.email,
      role: row.role || "qa",
      roleTitle: row.role_title || (row.role === "dev" ? "Senior Developer" : "QA Tester"),
      avatar: row.avatar || (displayName ? displayName.slice(0, 2).toUpperCase() : "QA"),
      avatarUrl: avatarUrl,
      photo: avatarUrl || row.photo || "",
      color: row.color || (row.role === "dev" ? "#10b981" : "#6366f1"),
      phone: row.phone !== undefined ? (row.phone || "") : (existingLocal?.phone || ""),
      department: row.department !== undefined ? (row.department || "") : (existingLocal?.department || ""),
      bio: row.bio !== undefined ? (row.bio || "") : (existingLocal?.bio || ""),
      status: row.status || "active",
      emailVerified: row.email_verified !== false,
      isOnline: hasExtendedPresence ? Boolean(row.is_online) : Boolean(existingLocal?.isOnline),
      lastLoginAt: row.last_login_at !== undefined ? (row.last_login_at || "") : (existingLocal?.lastLoginAt || ""),
      lastLogoutAt: row.last_logout_at !== undefined ? (row.last_logout_at || "") : (existingLocal?.lastLogoutAt || ""),
      createdAt: row.created_at || new Date().toISOString()
    };
  },

  mapTestCaseToBaseDB(tc) {
    const stepsArray = Array.isArray(tc.steps) ? tc.steps : [];
    const mediaUrls = Array.isArray(tc.mediaUrls) && tc.mediaUrls.length > 0
      ? tc.mediaUrls
      : ((tc.mediaUrl || tc.image) ? [tc.mediaUrl || tc.image] : []);
    const hasMeta = Boolean(
      tc.assignedDev || tc.assignedTo || tc.mediaUrl || tc.image || tc.mediaType || tc.mediaName ||
      tc.explanation || tc.createdAt || tc.createdBy || tc.lastViewedByDevId || tc.fixedByDevId || tc.verifiedByTesterId ||
      mediaUrls.length > 0
    );
    const stepsPayload = hasMeta
      ? {
          items: stepsArray,
          _meta: {
            explanation: tc.explanation || tc.preconditions || "",
            assignedDev: tc.assignedDev || tc.assignedTo || "",
            mediaUrl: tc.mediaUrl || tc.image || mediaUrls[0] || "",
            mediaUrls,
            mediaType: tc.mediaType || (tc.image ? "image" : ""),
            mediaName: tc.mediaName || "",
            createdAt: tc.createdAt || tc.lastRun || "",
            createdBy: tc.createdBy || tc.author || "",
            lastViewedByDevId: tc.lastViewedByDevId || "",
            lastViewedByDevAt: tc.lastViewedByDevAt || "",
            fixedByDevId: tc.fixedByDevId || "",
            fixedAt: tc.fixedAt || "",
            verifiedByTesterId: tc.verifiedByTesterId || "",
            verifiedAt: tc.verifiedAt || ""
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

  mapTestCaseToDB(tc) {
    const base = this.mapTestCaseToBaseDB(tc);
    const stepsArray = Array.isArray(tc.steps) ? tc.steps : [];
    const reproText = tc.stepsToReproduce || stepsArray.map(s => `${s.step}. ${s.action}${s.expected ? ` -> ${s.expected}` : ""}`).join("\n");
    const mediaUrls = Array.isArray(tc.mediaUrls) && tc.mediaUrls.length > 0
      ? tc.mediaUrls
      : ((tc.mediaUrl || tc.image) ? [tc.mediaUrl || tc.image] : []);

    return {
      ...base,
      created_by: tc.createdBy || tc.author || "",
      assigned_to: tc.assignedTo || tc.assignedDev || "",
      steps_to_reproduce: reproText,
      media_urls: mediaUrls,
      last_viewed_by_dev_id: tc.lastViewedByDevId || null,
      last_viewed_by_dev_at: tc.lastViewedByDevAt || null,
      fixed_by_dev_id: tc.fixedByDevId || null,
      fixed_at: tc.fixedAt || null,
      verified_by_tester_id: tc.verifiedByTesterId || null,
      verified_at: tc.verifiedAt || null
    };
  },

  mapTestCaseFromDB(row) {
    const rawSteps = row.steps;
    const isWrapped = rawSteps && !Array.isArray(rawSteps) && Array.isArray(rawSteps.items);
    const stepsArr = isWrapped ? rawSteps.items : (Array.isArray(rawSteps) ? rawSteps : []);
    const meta = (isWrapped && rawSteps._meta) ? rawSteps._meta : {};
    const mediaUrls = Array.isArray(row.media_urls) && row.media_urls.length > 0
      ? row.media_urls
      : (Array.isArray(meta.mediaUrls) ? meta.mediaUrls : []);
    const mediaUrl = meta.mediaUrl || mediaUrls[0] || "";
    const mediaType = meta.mediaType || "";

    return {
      id: row.id,
      title: row.title,
      suiteId: row.suite_id,
      priority: row.priority,
      type: row.type || "Manual",
      status: row.status || "Untested",
      author: row.author,
      createdBy: row.created_by || meta.createdBy || row.author || "",
      assignedDev: row.assigned_to || meta.assignedDev || "",
      assignedTo: row.assigned_to || meta.assignedDev || "",
      stepsToReproduce: row.steps_to_reproduce || "",
      lastRun: row.last_run,
      createdAt: meta.createdAt || (row.created_at ? row.created_at.substring(0, 16).replace("T", " ") : ""),
      preconditions: row.preconditions || meta.explanation || "",
      explanation: meta.explanation || row.preconditions || "",
      mediaUrl,
      mediaUrls,
      mediaType,
      mediaName: meta.mediaName || "",
      image: mediaType === "video" ? "" : mediaUrl,
      lastViewedByDevId: row.last_viewed_by_dev_id || meta.lastViewedByDevId || "",
      lastViewedByDevAt: row.last_viewed_by_dev_at || meta.lastViewedByDevAt || "",
      fixedByDevId: row.fixed_by_dev_id || meta.fixedByDevId || "",
      fixedAt: row.fixed_at || meta.fixedAt || "",
      verifiedByTesterId: row.verified_by_tester_id || meta.verifiedByTesterId || "",
      verifiedAt: row.verified_at || meta.verifiedAt || "",
      tags: row.tags || [],
      steps: stepsArr
    };
  },

  mapDefectToBaseDB(d) {
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

  mapDefectToDB(d) {
    const base = this.mapDefectToBaseDB(d);
    const mediaUrls = Array.isArray(d.mediaUrls) && d.mediaUrls.length > 0
      ? d.mediaUrls
      : (d.mediaUrl ? [d.mediaUrl] : []);
    return {
      ...base,
      suite_id: d.suiteId || null,
      created_by: d.createdBy || d.reportedBy || d.reporter || "",
      assigned_to: d.assignedTo || d.assignee || null,
      steps_to_reproduce: d.stepsToReproduce || d.reproSteps || d.repro_steps || null,
      media_urls: mediaUrls,
      last_viewed_by_dev_id: d.lastViewedByDevId || null,
      last_viewed_by_dev_at: d.lastViewedByDevAt || null,
      fixed_by_dev_id: d.fixedByDevId || null,
      fixed_at: d.fixedAt || null,
      verified_by_tester_id: d.verifiedByTesterId || null,
      verified_at: d.verifiedAt || null
    };
  },

  mapDefectFromDB(row) {
    const mediaUrls = Array.isArray(row.media_urls) ? row.media_urls : [];
    return {
      id: row.id,
      title: row.title,
      summary: row.title || row.summary || "Defect",
      linkedTestCaseId: row.linked_test_id || row.linked_test_case_id,
      suiteId: row.suite_id || null,
      severity: row.severity,
      priority: row.priority,
      assignee: row.assignee || row.assigned_to,
      assignedTo: row.assigned_to || row.assignee,
      reportedBy: row.reporter || row.reported_by,
      createdBy: row.created_by || row.reporter || "",
      status: row.status,
      description: row.description,
      reproSteps: row.repro_steps || row.steps_to_reproduce || "",
      stepsToReproduce: row.steps_to_reproduce || row.repro_steps || "",
      mediaUrls,
      mediaUrl: mediaUrls[0] || "",
      devNotes: row.notes || row.dev_notes,
      prLink: row.dev_pr || row.pr_link,
      gitBranch: row.dev_branch || row.git_branch,
      lastViewedByDevId: row.last_viewed_by_dev_id || "",
      lastViewedByDevAt: row.last_viewed_by_dev_at || "",
      fixedByDevId: row.fixed_by_dev_id || "",
      fixedAt: row.fixed_at || "",
      verifiedByTesterId: row.verified_by_tester_id || "",
      verifiedAt: row.verified_at || "",
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
        const existingLocal = typeof StorageManager !== "undefined" ? StorageManager.getUsers() : [];
        const localById = new Map(existingLocal.map(u => [u.id, u]));
        const mapped = usersRes.data.map(u => this.mapUserFromDB(u, localById.get(u.id)));
        // Exclusively save Supabase database users - DO NOT merge, fallback, or seed dummy users
        StorageManager.saveUsers(mapped, true);
      }

      // Also pull conference channel messages, activity logs, and media attachments if tables exist
      await Promise.all([
        this.fetchConferenceMessagesFromSupabase().catch(() => []),
        this.fetchActivityLogsFromSupabase({ limit: 300 }).catch(() => []),
        this.fetchMediaAttachmentsFromSupabase().catch(() => [])
      ]);

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
      const basePayload = usersList.map(u => this.mapUserToBaseDB(u));
      await this.upsertWithSchemaFallback("nexus_users", payload, basePayload);
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

      const existingLocal = typeof StorageManager !== "undefined" ? StorageManager.getUsers() : [];
      const localById = new Map(existingLocal.map(u => [u.id, u]));
      const mapped = (data || []).map(u => this.mapUserFromDB(u, localById.get(u.id)));
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
    const corePayload = {
      updated_at: dbPayload.updated_at
    };
    if (updates.name !== undefined || updates.fullName !== undefined) {
      const cleanName = (updates.fullName || updates.name || "").trim();
      if (cleanName) {
        dbPayload.name = cleanName;
        dbPayload.full_name = cleanName;
        corePayload.name = cleanName;
        const parts = cleanName.split(/\s+/);
        const av = parts.length > 1
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : cleanName.substring(0, 2).toUpperCase();
        dbPayload.avatar = av;
        corePayload.avatar = av;
      }
    }
    if (updates.email !== undefined) { dbPayload.email = updates.email.trim(); corePayload.email = dbPayload.email; }
    if (updates.username !== undefined) { dbPayload.username = updates.username.trim(); corePayload.username = dbPayload.username; }
    if (updates.role !== undefined) { dbPayload.role = updates.role; corePayload.role = updates.role; }
    if (updates.roleTitle !== undefined) { dbPayload.role_title = updates.roleTitle; corePayload.role_title = updates.roleTitle; }
    if (updates.role_title !== undefined) { dbPayload.role_title = updates.role_title; corePayload.role_title = updates.role_title; }
    if (updates.avatar !== undefined) { dbPayload.avatar = updates.avatar; corePayload.avatar = updates.avatar; }
    if (updates.color !== undefined) { dbPayload.color = updates.color; corePayload.color = updates.color; }
    if (updates.status !== undefined) { dbPayload.status = updates.status; corePayload.status = updates.status; }
    if (updates.emailVerified !== undefined) { dbPayload.email_verified = updates.emailVerified !== false; corePayload.email_verified = dbPayload.email_verified; }
    if (updates.email_verified !== undefined) { dbPayload.email_verified = updates.email_verified !== false; corePayload.email_verified = dbPayload.email_verified; }
    if (updates.avatarUrl !== undefined || updates.avatar_url !== undefined || updates.photo !== undefined) {
      dbPayload.avatar_url = updates.avatarUrl ?? updates.avatar_url ?? updates.photo ?? "";
    }
    if (updates.phone !== undefined) dbPayload.phone = String(updates.phone || "").trim();
    if (updates.department !== undefined) dbPayload.department = String(updates.department || "").trim();
    if (updates.bio !== undefined) dbPayload.bio = String(updates.bio || "").trim();
    if (updates.lastLoginAt !== undefined || updates.last_login_at !== undefined) {
      dbPayload.last_login_at = updates.lastLoginAt ?? updates.last_login_at;
    }
    if (updates.lastLogoutAt !== undefined || updates.last_logout_at !== undefined) {
      dbPayload.last_logout_at = updates.lastLogoutAt ?? updates.last_logout_at;
    }
    if (updates.isOnline !== undefined || updates.is_online !== undefined) {
      dbPayload.is_online = Boolean(updates.isOnline ?? updates.is_online);
    }

    let res;
    if (this._baseOnlyTables.has("nexus_users")) {
      res = Object.keys(corePayload).length > 1
        ? await client.from("nexus_users").update(corePayload).eq("id", userId).select()
        : { data: [], error: null };
    } else {
      res = await client
        .from("nexus_users")
        .update(dbPayload)
        .eq("id", userId)
        .select();

      if (res.error && this.isSchemaError(res.error)) {
        this.markTableStateFromError("nexus_users", res.error);
        if (Object.keys(corePayload).length > 1) {
          res = await client
            .from("nexus_users")
            .update(corePayload)
            .eq("id", userId)
            .select();
        }
      }
    }

    if (res.error) {
      console.error("Supabase user update error:", res.error);
      throw res.error;
    }

    const updated = res.data && res.data[0] ? this.mapUserFromDB(res.data[0]) : null;
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
        await this.upsertWithSchemaFallback("nexus_users", this.mapUserToDB(user), this.mapUserToBaseDB(user));
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

  async uploadEvidenceMedia(file, testCaseId = "TC-001", defectId = "", folder = "test-cases") {
    if (!file) return null;
    const isVideo = (file.type || "").startsWith("video/");
    const mediaType = isVideo ? "video" : "image";
    const fileName = file.name || (isVideo ? `${testCaseId || defectId || "evidence"}-recording.webm` : `${testCaseId || defectId || "evidence"}-screenshot.png`);
    const safeName = `${testCaseId || defectId || "media"}-${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const objectPath = `${folder}/${safeName}`;
    const fileSizeBytes = Number(file.size || 0);

    let result = null;
    const client = this.getClient();
    if (client) {
      try {
        const candidateBuckets = ["nexus-evidence"];
        try {
          const { data: buckets } = await client.storage.listBuckets();
          if (Array.isArray(buckets)) {
            buckets.forEach(b => {
              if (b && b.name && !candidateBuckets.includes(b.name)) {
                candidateBuckets.push(b.name);
              }
            });
          }
        } catch (e) {}

        for (const bucketName of candidateBuckets) {
          if (this._missingStorageBuckets.has(bucketName)) continue;
          const { data, error } = await client.storage
            .from(bucketName)
            .upload(objectPath, file, { contentType: file.type || undefined, upsert: true });

          if (error) {
            if (String(error.message || "").toLowerCase().includes("not found")) {
              this._missingStorageBuckets.add(bucketName);
            }
          } else if (data) {
            const { data: pub } = client.storage.from(bucketName).getPublicUrl(data.path);
            if (pub && pub.publicUrl) {
              result = {
                url: pub.publicUrl,
                storage: "supabase",
                bucket: bucketName,
                mediaType,
                mediaName: fileName,
                fileSizeBytes
              };
              break;
            }
          }
        }
      } catch (e) {
        console.warn("Supabase Storage upload fallback:", e);
      }
    }

    if (!result) {
      result = await new Promise((resolve, reject) => {
        if (isVideo && file.size > 4 * 1024 * 1024) {
          resolve({
            url: URL.createObjectURL(file),
            storage: "session-preview",
            mediaType: "video",
            mediaName: fileName,
            fileSizeBytes
          });
          return;
        }
        const reader = new FileReader();
        reader.onload = (evt) => {
          resolve({
            url: evt.target.result,
            storage: "embedded",
            mediaType,
            mediaName: fileName,
            fileSizeBytes
          });
        };
        reader.onerror = () => reject(new Error("Failed to read media file"));
        reader.readAsDataURL(file);
      });
    }

    if (result && result.url && folder !== "avatars") {
      await this.saveMediaAttachmentRecord({
        testCaseId: testCaseId || "",
        defectId: defectId || "",
        fileName: result.mediaName,
        fileType: result.mediaType,
        fileUrl: result.url,
        fileSizeBytes: result.fileSizeBytes
      }).catch(() => {});
    }

    return result;
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
        const res = await this.upsertWithSchemaFallback(
          "nexus_test_cases",
          this.mapTestCaseToDB(testCase),
          this.mapTestCaseToBaseDB(testCase)
        );
        if (!res.ok) {
          console.warn("Supabase testcase upsert error:", res.error);
        }
        return res;
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
    const client = this.getClient();
    if (client && defect) {
      try {
        const res = await this.upsertWithSchemaFallback(
          "nexus_defects",
          this.mapDefectToDB(defect),
          this.mapDefectToBaseDB(defect)
        );
        if (!res.ok) console.warn("Supabase defect upsert error:", res.error);
        return res;
      } catch (e) { console.warn("Supabase defect upsert error:", e); }
    }
    return { ok: false };
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
  },

  async fetchConferenceMessagesFromSupabase(projectId = null) {
    const client = this.getClient();
    if (!client || this._missingTables.has("nexus_conference_messages")) return [];
    try {
      let query = client
        .from("nexus_conference_messages")
        .select("*")
        .order("created_at", { ascending: true });
      if (projectId) {
        query = query.eq("project_id", projectId);
      }
      const { data, error } = await query;
      if (error) {
        this.markTableStateFromError("nexus_conference_messages", error);
        return [];
      }
      const mapped = (data || []).map(row => this.mapConferenceMessageFromDB(row));
      if (typeof StorageManager !== "undefined" && StorageManager.mergeRemoteConferenceMessages) {
        StorageManager.mergeRemoteConferenceMessages(mapped, projectId);
      }
      return mapped;
    } catch (e) {
      console.warn("Supabase fetch conference messages warning:", e);
      return [];
    }
  },

  async syncConferenceMessageInsert(message) {
    const client = this.getClient();
    if (!client || !message) return { ok: false, error: "Supabase client unavailable" };
    try {
      const payload = this.mapConferenceMessageToDB(message);
      const { data, error } = await client
        .from("nexus_conference_messages")
        .upsert(payload)
        .select();
      if (error) {
        const missingTable = error.code === "PGRST205" || String(error.message || "").includes("nexus_conference_messages");
        console.warn("Supabase conference message insert warning:", error.message);
        return { ok: false, missingTable, error };
      }
      return { ok: true, data: data && data[0] ? this.mapConferenceMessageFromDB(data[0]) : message };
    } catch (e) {
      console.warn("Supabase conference message insert error:", e);
      return { ok: false, error: e };
    }
  },

  async syncConferenceMessagesClear(projectId) {
    const client = this.getClient();
    if (!client || !projectId) return false;
    try {
      const { error } = await client
        .from("nexus_conference_messages")
        .delete()
        .eq("project_id", projectId);
      if (error && error.code !== "PGRST205") {
        console.warn("Supabase clear conference messages warning:", error.message);
      }
      return !error;
    } catch (e) {
      console.warn("Supabase clear conference messages warning:", e);
      return false;
    }
  },

  // -------------------------------------------------------------
  // User Presence, Activity Audit Logs & Media Attachments Registry
  // -------------------------------------------------------------
  async updateUserPresence(user, isOnline, { keepalive = false, loginAt = null, logoutAt = null } = {}) {
    if (!user || !user.id || this._baseOnlyTables.has("nexus_users")) return;
    const nowIso = new Date().toISOString();
    const payload = {
      is_online: Boolean(isOnline),
      updated_at: nowIso
    };
    if (isOnline) {
      payload.last_login_at = loginAt || nowIso;
    } else {
      payload.last_logout_at = logoutAt || nowIso;
    }

    if (keepalive && typeof fetch === "function") {
      try {
        const cfg = this.getConfig();
        if (cfg.url && cfg.anonKey) {
          fetch(`${cfg.url}/rest/v1/nexus_users?id=eq.${encodeURIComponent(user.id)}`, {
            method: "PATCH",
            keepalive: true,
            headers: {
              "Content-Type": "application/json",
              apikey: cfg.anonKey,
              Authorization: `Bearer ${cfg.anonKey}`,
              Prefer: "return=minimal"
            },
            body: JSON.stringify(payload)
          }).catch(() => {});
        }
        return;
      } catch (e) {}
    }

    const client = this.getClient();
    if (!client) return;
    try {
      const { error } = await client.from("nexus_users").update(payload).eq("id", user.id);
      if (error) this.markTableStateFromError("nexus_users", error);
    } catch (e) {}
  },

  async logActivity({ action_type, target_type = "", target_id = "", old_value = "", new_value = "", details = {} } = {}, options = {}) {
    const curUser = options.userOverride || (typeof StorageManager !== "undefined" ? StorageManager.getCurrentUser() : null);
    const userId = curUser ? (curUser.id || curUser.username || "") : "anonymous";
    const username = curUser ? (curUser.name || curUser.username || curUser.email || "Unknown") : "Anonymous";
    const userRole = curUser ? (curUser.role || "qa") : "guest";
    const nowIso = new Date().toISOString();

    const localEntry = {
      userId,
      username,
      userRole,
      actionType: action_type || "activity",
      targetType: target_type || "",
      targetId: target_id || "",
      oldValue: old_value !== undefined && old_value !== null ? String(old_value) : "",
      newValue: new_value !== undefined && new_value !== null ? String(new_value) : "",
      details: details || {},
      createdAt: nowIso
    };

    if (typeof StorageManager !== "undefined" && StorageManager.addActivityLog) {
      StorageManager.addActivityLog(localEntry);
    }

    if (this._missingTables.has("nexus_activity_logs")) {
      return { ok: false, missingTable: true, local: localEntry };
    }

    const dbPayload = {
      user_id: localEntry.userId,
      username: localEntry.username,
      user_role: localEntry.userRole,
      action_type: localEntry.actionType,
      target_type: localEntry.targetType,
      target_id: localEntry.targetId,
      old_value: localEntry.oldValue,
      new_value: localEntry.newValue,
      details: localEntry.details
    };

    if (options.keepalive && typeof fetch === "function") {
      try {
        const cfg = this.getConfig();
        if (cfg.url && cfg.anonKey) {
          fetch(`${cfg.url}/rest/v1/nexus_activity_logs`, {
            method: "POST",
            keepalive: true,
            headers: {
              "Content-Type": "application/json",
              apikey: cfg.anonKey,
              Authorization: `Bearer ${cfg.anonKey}`,
              Prefer: "return=minimal"
            },
            body: JSON.stringify(dbPayload)
          }).catch(() => {});
        }
        return { ok: true, local: localEntry };
      } catch (e) {}
    }

    const client = this.getClient();
    if (!client) return { ok: false, local: localEntry };
    try {
      const { error } = await client.from("nexus_activity_logs").insert(dbPayload);
      if (error) {
        this.markTableStateFromError("nexus_activity_logs", error);
        return { ok: false, missingTable: this.isSchemaError(error), error, local: localEntry };
      }
      return { ok: true, local: localEntry };
    } catch (e) {
      return { ok: false, error: e, local: localEntry };
    }
  },

  async fetchActivityLogsFromSupabase({ userId = null, actionType = null, targetId = null, limit = 250 } = {}) {
    const client = this.getClient();
    if (!client || this._missingTables.has("nexus_activity_logs")) return [];
    try {
      let query = client
        .from("nexus_activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (userId && userId !== "all") query = query.eq("user_id", userId);
      if (actionType && actionType !== "all") query = query.eq("action_type", actionType);
      if (targetId) query = query.eq("target_id", targetId);

      const { data, error } = await query;
      if (error) {
        this.markTableStateFromError("nexus_activity_logs", error);
        return [];
      }
      const mapped = (data || []).map(row => this.mapActivityLogFromDB(row));
      if (typeof StorageManager !== "undefined" && StorageManager.mergeRemoteActivityLogs) {
        StorageManager.mergeRemoteActivityLogs(mapped);
      }
      return mapped;
    } catch (e) {
      return [];
    }
  },

  async saveMediaAttachmentRecord({ testCaseId = "", defectId = "", fileName = "", fileType = "image", fileUrl = "", fileSizeBytes = 0 } = {}) {
    if (!fileUrl) return null;
    const curUser = typeof StorageManager !== "undefined" ? StorageManager.getCurrentUser() : null;
    const uploadedBy = curUser ? (curUser.id || curUser.username || "") : "anonymous";
    const uploaderName = curUser ? (curUser.name || curUser.username || "Team Member") : "Team Member";

    let savedLocal = null;
    if (typeof StorageManager !== "undefined" && StorageManager.addMediaAttachment) {
      savedLocal = StorageManager.addMediaAttachment({
        testCaseId,
        defectId,
        uploadedBy,
        uploaderName,
        fileName,
        fileType,
        fileUrl,
        fileSizeBytes
      });
    }

    const client = this.getClient();
    if (client && !this._missingTables.has("nexus_media_attachments")) {
      try {
        const { error } = await client.from("nexus_media_attachments").insert({
          test_case_id: testCaseId || null,
          defect_id: defectId || null,
          uploaded_by: uploadedBy,
          uploader_name: uploaderName,
          file_name: fileName || "evidence",
          file_type: fileType || "image",
          file_url: fileUrl,
          file_size_bytes: Number(fileSizeBytes || 0)
        });
        if (error) {
          this.markTableStateFromError("nexus_media_attachments", error);
          if (!this.isSchemaError(error)) {
            console.warn("Supabase media attachment insert warning:", error.message);
          }
        }
      } catch (e) {}
    }

    return savedLocal;
  },

  async fetchMediaAttachmentsFromSupabase({ testCaseId = null, defectId = null } = {}) {
    const client = this.getClient();
    if (!client || this._missingTables.has("nexus_media_attachments")) return [];
    try {
      let query = client
        .from("nexus_media_attachments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      if (testCaseId) query = query.eq("test_case_id", testCaseId);
      if (defectId) query = query.eq("defect_id", defectId);
      const { data, error } = await query;
      if (error) {
        this.markTableStateFromError("nexus_media_attachments", error);
        return [];
      }
      const mapped = (data || []).map(row => this.mapMediaAttachmentFromDB(row));
      if (typeof StorageManager !== "undefined" && StorageManager.mergeRemoteMediaAttachments) {
        StorageManager.mergeRemoteMediaAttachments(mapped);
      }
      return mapped;
    } catch (e) {
      return [];
    }
  }
};

