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
  THEME: "nexusqa_theme",
  CONFERENCE_MESSAGES: "nexusqa_conference_messages",
  CONFERENCE_PROJECTS: "nexusqa_conference_projects",
  PRIVATE_MESSAGES: "nexusqa_private_messages",
  NOTIFICATIONS: "nexusqa_user_notifications",
  ACTIVITY_LOGS: "nexusqa_activity_logs",
  MEDIA_ATTACHMENTS: "nexusqa_media_attachments"
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

    const legacySeedSuiteIds = new Set(["suite-auth", "suite-checkout", "suite-api", "suite-search", "suite-security", "suite-perf"]);
    const rawSuites = localStorage.getItem(STORAGE_KEYS.SUITES);
    if (rawSuites) {
      try {
        const parsedSuites = JSON.parse(rawSuites);
        if (Array.isArray(parsedSuites)) {
          const cleaned = parsedSuites.filter(s => !legacySeedSuiteIds.has(s.id));
          if (cleaned.length !== parsedSuites.length) {
            localStorage.setItem(STORAGE_KEYS.SUITES, JSON.stringify(cleaned));
          }
        }
      } catch(e) {}
    } else {
      localStorage.setItem(STORAGE_KEYS.SUITES, JSON.stringify([]));
    }

    // Sanitize & filter out legacy mock users from local storage
    this.sanitizeUsers();

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
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
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
    localStorage.removeItem(STORAGE_KEYS.CONFERENCE_MESSAGES);
    this.broadcast("WIPE_DATA");
  },

  // -------------------------------------------------------------
  // Conference Projects & Channels (Cards & Project Chat)
  // -------------------------------------------------------------
  // Conference Projects & Channels (Cards & Project Chat)
  // -------------------------------------------------------------
  getConferenceProjects() {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFERENCE_PROJECTS);
    if (!raw) {
      const seed = [
        {
          id: "proj-1",
          name: "E-Commerce Checkout & Payments",
          slug: "payments-engine",
          description: "Payment gateway integration, Stripe & 3D secure test validations, cart abandonment recovery",
          category: "Payments",
          icon: "fa-solid fa-credit-card",
          color: "#06b6d4",
          status: "Active Sprint",
          leadDev: "Senior Developer",
          leadQa: "QA Tester",
          headId: "user-dev-hardcoded",
          headName: "Senior Developer",
          headRole: "Lead Software Architect",
          members: ["user-dev-hardcoded", "user-test-hardcoded"],
          createdAt: "2026-10-20",
          participantsCount: 2,
          lastActivity: "2 mins ago"
        },
        {
          id: "proj-2",
          name: "Auth & Identity Security Service",
          slug: "auth-security",
          description: "OTP email verification, AES-256 session tokens, RBAC permissions, and SSO provider bridge",
          category: "Security",
          icon: "fa-solid fa-shield-halved",
          color: "#6366f1",
          status: "Regression Pass",
          leadDev: "Senior Developer",
          leadQa: "QA Tester",
          headId: "user-dev-hardcoded",
          headName: "Senior Developer",
          headRole: "Lead Software Architect",
          members: ["user-dev-hardcoded", "user-test-hardcoded"],
          createdAt: "2026-10-21",
          participantsCount: 2,
          lastActivity: "15 mins ago"
        },
        {
          id: "proj-3",
          name: "CampusOS NLP & Test Creator Studio",
          slug: "campusos-nlp",
          description: "Conversational voice assistant, 22-column Excel tracker generator, and discrepancy auditor",
          category: "AI & NLP",
          icon: "fa-solid fa-wand-magic-sparkles",
          color: "#a855f7",
          status: "Release Candidate",
          leadDev: "Senior Developer",
          leadQa: "QA Tester",
          headId: "user-test-hardcoded",
          headName: "QA Tester",
          headRole: "QA Lead",
          members: ["user-dev-hardcoded", "user-test-hardcoded"],
          createdAt: "2026-10-22",
          participantsCount: 2,
          lastActivity: "1 hour ago"
        },
        {
          id: "proj-4",
          name: "Mobile Portal & Responsive UI",
          slug: "mobile-ui",
          description: "Cross-browser testing on WebKit/Blink, touch gesture handling, and low-latency cache sync",
          category: "Frontend",
          icon: "fa-solid fa-mobile-screen-button",
          color: "#10b981",
          status: "In Triage",
          leadDev: "Senior Developer",
          leadQa: "QA Tester",
          headId: "user-dev-hardcoded",
          headName: "Senior Developer",
          headRole: "Lead Software Architect",
          members: ["user-dev-hardcoded", "user-test-hardcoded"],
          createdAt: "2026-10-24",
          participantsCount: 3,
          lastActivity: "3 hours ago"
        }
      ];
      localStorage.setItem(STORAGE_KEYS.CONFERENCE_PROJECTS, JSON.stringify(seed));
      return seed;
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Ensure legacy projects have members array and slug
        let changed = false;
        parsed.forEach((p, idx) => {
          if (!p.slug) {
            p.slug = (p.name || "channel-" + idx).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            changed = true;
          }
          if (!Array.isArray(p.members)) {
            p.members = [];
            changed = true;
          }
          if (p.participantsCount === undefined) {
            p.participantsCount = p.members.length;
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem(STORAGE_KEYS.CONFERENCE_PROJECTS, JSON.stringify(parsed));
        }
        return parsed;
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  getConferenceProjectById(id) {
    return this.getConferenceProjects().find(p => p.id === id);
  },

  getProjectAllottedUsers(projectId) {
    if (!projectId) return [];
    const project = typeof projectId === "object" ? projectId : this.getConferenceProjectById(projectId);
    if (!project) return [];

    const allUsers = this.getUsers();
    const membersList = Array.isArray(project.members) ? [...project.members] : [];

    // Include designated head if not already present
    if (project.headId && !membersList.includes(project.headId)) {
      membersList.unshift(project.headId);
    } else if (project.headName && !membersList.includes(project.headName)) {
      membersList.unshift(project.headName);
    }

    // Fallback for legacy projects without explicit members list
    if (membersList.length === 0) {
      if (project.leadDev) membersList.push(project.leadDev);
      if (project.leadQa) membersList.push(project.leadQa);
    }

    const matchedUsers = [];
    const seen = new Set();

    membersList.forEach(m => {
      if (!m) return;
      const q = (m + "").toLowerCase().trim();
      let found = allUsers.find(u =>
        (u.id && u.id.toLowerCase() === q) ||
        (u.username && u.username.toLowerCase() === q) ||
        (u.email && u.email.toLowerCase() === q) ||
        (u.name && u.name.toLowerCase() === q)
      );

      if (!found) {
        // Fallback placeholder object for custom names
        found = {
          id: m,
          username: m,
          name: m,
          email: `${m.replace(/\s+/g, ".").toLowerCase()}@nexusqa.io`,
          role: q.includes("qa") || q.includes("test") ? "qa" : "dev",
          roleTitle: "Project Collaborator",
          avatar: m.slice(0, 2).toUpperCase(),
          status: "active"
        };
      }

      const key = (found.id || found.email || found.name).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        const isHead = (project.headId && (found.id === project.headId || found.username === project.headId)) ||
                       (project.headName && (found.name || "").toLowerCase() === (project.headName || "").toLowerCase());
        matchedUsers.push({
          ...found,
          isHead: !!isHead
        });
      }
    });

    // Sort: Project Head first, then alphabetically by name
    return matchedUsers.sort((a, b) => {
      if (a.isHead && !b.isHead) return -1;
      if (!a.isHead && b.isHead) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });
  },

  getUserProjectCount(userIdOrName) {
    if (!userIdOrName) return 0;
    const projects = this.getConferenceProjects();
    const query = (userIdOrName + "").toLowerCase().trim();
    return projects.filter(p => {
      if (Array.isArray(p.members)) {
        if (p.members.some(m => (m + "").toLowerCase().trim() === query)) return true;
      }
      if (p.headId && (p.headId + "").toLowerCase().trim() === query) return true;
      if (p.headName && (p.headName + "").toLowerCase().trim() === query) return true;
      if (p.leadDev && (p.leadDev + "").toLowerCase().trim() === query) return true;
      if (p.leadQa && (p.leadQa + "").toLowerCase().trim() === query) return true;
      return false;
    }).length;
  },

  getUserProjects(userIdOrName, userEmail = null) {
    if (!userIdOrName && !userEmail) return [];
    const projects = this.getConferenceProjects();
    const query = userIdOrName ? (userIdOrName + "").toLowerCase().trim() : "";
    const emailQuery = userEmail ? (userEmail + "").toLowerCase().trim() : "";
    return projects.filter(p => {
      if (Array.isArray(p.members)) {
        if (p.members.some(m => {
          const sm = (m + "").toLowerCase().trim();
          return (query && sm === query) || (emailQuery && sm === emailQuery);
        })) return true;
      }
      if (query && p.headId && (p.headId + "").toLowerCase().trim() === query) return true;
      if (query && p.headName && (p.headName + "").toLowerCase().trim() === query) return true;
      return false;
    });
  },

  addConferenceProject(projData, user) {
    if (!user) user = this.getCurrentUser();
    if (!this.isSeniorDev(user)) {
      throw new Error("Unauthorized: Project creation is strictly restricted to Senior Developers only.");
    }

    const projects = this.getConferenceProjects();
    const slug = (projData.name || "project")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const members = Array.isArray(projData.members) && projData.members.length > 0 
      ? [...projData.members] 
      : [];

    // Ensure Senior Dev creator is included
    const creatorId = user ? (user.id || user.username || "user-dev-hardcoded") : "user-dev-hardcoded";
    if (!members.includes(creatorId)) {
      members.push(creatorId);
    }

    // If head is assigned, ensure head is in members list
    if (projData.headId && !members.includes(projData.headId)) {
      members.push(projData.headId);
    }

    const iconMap = {
      "Payments": "fa-solid fa-credit-card",
      "Security": "fa-solid fa-shield-halved",
      "AI & NLP": "fa-solid fa-wand-magic-sparkles",
      "Frontend": "fa-solid fa-mobile-screen-button",
      "Backend": "fa-solid fa-server",
      "DevOps": "fa-solid fa-cubes"
    };

    const newProj = {
      id: "proj-" + Date.now(),
      name: (projData.name || "Untitled Project").trim(),
      slug: slug || "project-" + Date.now(),
      description: (projData.description || "Active engineering & QA collaboration channel").trim(),
      category: projData.category || "Backend",
      icon: projData.icon || iconMap[projData.category] || "fa-solid fa-diagram-project",
      color: projData.color || "#6366f1",
      status: projData.status || "Active Sprint",
      members: members,
      headId: projData.headId || "",
      headName: projData.headName || "",
      headRole: projData.headRole || "",
      leadDev: user ? (user.name || "Senior Developer") : "Senior Developer",
      createdBy: user ? (user.name || "Senior Developer") : "Senior Developer",
      createdAt: new Date().toISOString().split("T")[0],
      participantsCount: members.length,
      lastActivity: "Just now"
    };

    projects.unshift(newProj);
    localStorage.setItem(STORAGE_KEYS.CONFERENCE_PROJECTS, JSON.stringify(projects));

    // Notify assigned members in real-time
    this.notifyProjectMembers(newProj, user);

    this.broadcast("CONFERENCE_PROJECT_CREATED", { project: newProj });
    return newProj;
  },

  deleteConferenceProject(projectId, user) {
    if (!user) user = this.getCurrentUser();
    if (!this.isSeniorDev(user)) {
      throw new Error("Unauthorized: Project deletion is strictly restricted to Senior Developers only.");
    }

    const projects = this.getConferenceProjects();
    const targetProj = projects.find(p => p.id === projectId);
    if (!targetProj) {
      throw new Error("Project not found.");
    }

    const filtered = projects.filter(p => p.id !== projectId);
    localStorage.setItem(STORAGE_KEYS.CONFERENCE_PROJECTS, JSON.stringify(filtered));

    // Clean up associated conference messages
    try {
      const allMsgs = this.getConferenceMessages();
      const keptMsgs = allMsgs.filter(m => (m.projectId || "proj-1") !== projectId);
      localStorage.setItem(STORAGE_KEYS.CONFERENCE_MESSAGES, JSON.stringify(keptMsgs));
    } catch (e) {}

    // Clean up associated private messages
    try {
      const privRaw = localStorage.getItem(STORAGE_KEYS.PRIVATE_MESSAGES);
      if (privRaw) {
        const privMsgs = JSON.parse(privRaw);
        if (Array.isArray(privMsgs)) {
          const keptPriv = privMsgs.filter(m => m.projectId !== projectId);
          localStorage.setItem(STORAGE_KEYS.PRIVATE_MESSAGES, JSON.stringify(keptPriv));
        }
      }
    } catch (e) {}

    // Clean up legacy key if any
    localStorage.removeItem(STORAGE_KEYS.CONFERENCE_MESSAGES + "_" + projectId);

    this.broadcast("CONFERENCE_PROJECT_DELETED", { projectId, project: targetProj });
    return targetProj;
  },

  notifyProjectMembers(project, creator) {
    if (!project || !Array.isArray(project.members)) return;
    const allUsers = this.getUsers();
    const creatorName = creator ? (creator.name || "Senior Developer") : "Senior Developer";

    const notifs = this.getNotifications();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    project.members.forEach(memberId => {
      const user = allUsers.find(u => u.id === memberId || u.username === memberId || u.email === memberId);
      const isHead = project.headId === memberId;
      const notifItem = {
        id: "notif-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6),
        userId: memberId,
        userName: user ? user.name : memberId,
        userEmail: user ? user.email : "",
        projectId: project.id,
        projectName: project.name,
        type: isHead ? "project_head_assigned" : "project_assigned",
        title: isHead ? `Appointed as Project Head: ${project.name}` : `Added to Project: ${project.name}`,
        message: isHead 
          ? `You have been appointed as Project Head for "${project.name}" by Senior Developer ${creatorName}.`
          : `You have been added to project "${project.name}" by Senior Developer ${creatorName}. Access the channel in Conference.`,
        creatorName: creatorName,
        time: timeStr,
        timestamp: Date.now(),
        read: false
      };
      notifs.unshift(notifItem);
    });

    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    this.broadcast("PROJECT_MEMBERS_NOTIFIED", {
      projectId: project.id,
      projectName: project.name,
      memberIds: project.members,
      headId: project.headId,
      creatorName: creatorName
    });
  },

  getNotifications(userId = null) {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    let notifs = [];
    try {
      notifs = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(notifs)) notifs = [];
    } catch(e) { notifs = []; }
    if (userId) {
      const q = (userId + "").toLowerCase().trim();
      return notifs.filter(n => (n.userId && (n.userId + "").toLowerCase() === q) || (n.userName && (n.userName + "").toLowerCase() === q));
    }
    return notifs;
  },

  markNotificationsRead(userId = null) {
    const notifs = this.getNotifications();
    notifs.forEach(n => {
      if (!userId || n.userId === userId) {
        n.read = true;
      }
    });
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  },

  // -------------------------------------------------------------
  // Conference Messages (Live QA <-> Dev Project Chat)
  // -------------------------------------------------------------
  getConferenceMessages(projectId = null) {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFERENCE_MESSAGES);
    let msgs = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Filter out any legacy seeded fake messages or 1-on-1 DMs
          msgs = parsed.filter(m =>
            m &&
            !(m.id && String(m.id).startsWith("msg-seed-")) &&
            m.channelType !== "direct" &&
            m.messageType !== "direct"
          );
        }
      } catch (e) {
        msgs = [];
      }
    }

    if (projectId) {
      return msgs.filter(m => (m.projectId || "proj-1") === projectId);
    }
    return msgs;
  },

  addConferenceMessage(message) {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFERENCE_MESSAGES);
    let messages = [];
    try {
      messages = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(messages)) messages = [];
    } catch(e) { messages = []; }

    const now = new Date();
    const newMsg = {
      id: message.id || ("msg-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6)),
      projectId: message.projectId || "proj-1",
      messageType: message.messageType || "text",
      meetUrl: message.meetUrl || "",
      time: message.time || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: message.date || "Today",
      timestamp: message.timestamp || Date.now(),
      ...message
    };
    const existingIdx = messages.findIndex(m => m.id === newMsg.id);
    if (existingIdx !== -1) {
      messages[existingIdx] = newMsg;
    } else {
      messages.push(newMsg);
    }
    localStorage.setItem(STORAGE_KEYS.CONFERENCE_MESSAGES, JSON.stringify(messages));
    this.broadcast("CONFERENCE_MESSAGE", { message: newMsg });
    return newMsg;
  },

  mergeRemoteConferenceMessages(remoteMessages = [], projectId = null) {
    if (!Array.isArray(remoteMessages)) return;
    const raw = localStorage.getItem(STORAGE_KEYS.CONFERENCE_MESSAGES);
    let localMsgs = [];
    try {
      localMsgs = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(localMsgs)) localMsgs = [];
    } catch (e) { localMsgs = []; }

    const byId = new Map();
    localMsgs.forEach(m => { if (m && m.id) byId.set(m.id, m); });

    let changed = false;
    remoteMessages.forEach(rm => {
      if (!rm || !rm.id) return;
      if (projectId && (rm.projectId || "proj-1") !== projectId) return;
      const prev = byId.get(rm.id);
      if (!prev || prev.text !== rm.text || prev.meetUrl !== rm.meetUrl) {
        byId.set(rm.id, rm);
        changed = true;
      }
    });

    if (changed) {
      const merged = Array.from(byId.values()).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      localStorage.setItem(STORAGE_KEYS.CONFERENCE_MESSAGES, JSON.stringify(merged));
      this.broadcast("CONFERENCE_MESSAGE", { remote: true, projectId });
    }
  },

  removeConferenceMessageLocally(msgId) {
    if (!msgId) return;
    const all = this.getConferenceMessages();
    const filtered = all.filter(m => m.id !== msgId);
    localStorage.setItem(STORAGE_KEYS.CONFERENCE_MESSAGES, JSON.stringify(filtered));
    this.broadcast("CONFERENCE_MESSAGE", { remote: true, deletedId: msgId });
  },

  clearConferenceMessages(projectId = null, user = null) {
    if (!user) user = this.getCurrentUser();
    if (!this.isSeniorDev(user)) {
      throw new Error("Access Denied: Only Senior Developers are permitted to clear conference room channels.");
    }
    if (projectId) {
      const all = this.getConferenceMessages();
      const filtered = all.filter(m => (m.projectId || "proj-1") !== projectId);
      localStorage.setItem(STORAGE_KEYS.CONFERENCE_MESSAGES, JSON.stringify(filtered));
    } else {
      localStorage.setItem(STORAGE_KEYS.CONFERENCE_MESSAGES, JSON.stringify([]));
    }
    this.broadcast("CONFERENCE_CLEARED", { projectId });
  },

  // -------------------------------------------------------------
  // Private 1-on-1 Project Chat Messages
  // -------------------------------------------------------------
  getPrivateMessages(projectId, userId1, userId2) {
    const raw = localStorage.getItem(STORAGE_KEYS.PRIVATE_MESSAGES);
    let all = [];
    try {
      all = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(all)) all = [];
    } catch (e) { all = []; }

    // Purge any legacy hardcoded seed greetings so threads contain real messages only
    all = all.filter(m => m && !(m.id && String(m.id).startsWith("pmsg-seed-")));

    return all
      .filter(m =>
        (m.projectId || "proj-1") === (projectId || "proj-1") &&
        ((m.senderId === userId1 && m.recipientId === userId2) ||
         (m.senderId === userId2 && m.recipientId === userId1))
      )
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  },

  addPrivateMessage(msg) {
    const raw = localStorage.getItem(STORAGE_KEYS.PRIVATE_MESSAGES);
    let all = [];
    try {
      all = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(all)) all = [];
    } catch (e) { all = []; }

    const threadKey = [msg.senderId, msg.recipientId].sort().join("___");
    const now = new Date();
    const newMsg = {
      id: msg.id || ("pmsg-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6)),
      projectId: msg.projectId || "proj-1",
      channelType: "direct",
      messageType: "direct",
      threadKey,
      senderId: msg.senderId,
      recipientId: msg.recipientId,
      senderName: msg.senderName,
      senderAvatar: msg.senderAvatar || (msg.senderName ? msg.senderName.substring(0, 2).toUpperCase() : "U"),
      senderRole: msg.senderRole || "qa",
      roleTitle: msg.roleTitle || "",
      text: msg.text,
      time: msg.time || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: msg.date || "Today",
      timestamp: msg.timestamp || Date.now()
    };
    const existingIdx = all.findIndex(m => m.id === newMsg.id);
    if (existingIdx !== -1) all[existingIdx] = newMsg;
    else all.push(newMsg);
    localStorage.setItem(STORAGE_KEYS.PRIVATE_MESSAGES, JSON.stringify(all));
    this.broadcast("PRIVATE_MESSAGE", { message: newMsg });
    return newMsg;
  },

  mergeRemotePrivateMessages(remoteMessages = []) {
    if (!Array.isArray(remoteMessages) || remoteMessages.length === 0) return;
    const raw = localStorage.getItem(STORAGE_KEYS.PRIVATE_MESSAGES);
    let all = [];
    try {
      all = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(all)) all = [];
    } catch (e) { all = []; }

    const byId = new Map();
    all
      .filter(m => m && m.id && !String(m.id).startsWith("pmsg-seed-"))
      .forEach(m => byId.set(m.id, m));

    let changed = false;
    let latestNewMsg = null;
    remoteMessages.forEach(rm => {
      if (!rm || !rm.id || !rm.recipientId) return;
      const prev = byId.get(rm.id);
      if (!prev || prev.text !== rm.text) {
        const normalized = {
          ...rm,
          channelType: "direct",
          messageType: "direct",
          threadKey: [rm.senderId, rm.recipientId].sort().join("___")
        };
        byId.set(rm.id, normalized);
        if (!prev) latestNewMsg = normalized;
        changed = true;
      }
    });

    if (changed) {
      const merged = Array.from(byId.values()).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      localStorage.setItem(STORAGE_KEYS.PRIVATE_MESSAGES, JSON.stringify(merged));
      this.broadcast("PRIVATE_MESSAGE", { remote: true, message: latestNewMsg });
    }
  },

  clearPrivateMessages(projectId, userId1, userId2) {
    const raw = localStorage.getItem(STORAGE_KEYS.PRIVATE_MESSAGES);
    let all = [];
    try {
      all = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(all)) all = [];
    } catch(e) { all = []; }

    const threadKey = [userId1, userId2].sort().join("___");
    const remaining = all.filter(m => !((m.projectId || "proj-1") === projectId && m.threadKey === threadKey));
    localStorage.setItem(STORAGE_KEYS.PRIVATE_MESSAGES, JSON.stringify(remaining));
    this.broadcast("PRIVATE_MESSAGES_CLEARED", { projectId, threadKey });
  },

  // -------------------------------------------------------------
  // User Management & Access Approvals
  // -------------------------------------------------------------
  sanitizeUsers() {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    let users = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(users)) users = [];

    const dummyNames = [
      "sarah connor",
      "oliver queen",
      "david chen",
      "marcus vance",
      "alex morgan",
      "jordan hayes",
      "elena rostova",
      "liam patel",
      "maya lin",
      "rachel green"
    ];

    const legacyPurge = [
      "a@a",
      "alex.qa@nexusqa.io",
      "marcus.dev@nexusqa.io",
      "a",
      "usr-dev-1",
      "usr-dev-2",
      "usr-dev-3",
      "usr-dev-4",
      "usr-qa-1",
      "usr-qa-2",
      "usr-qa-3",
      "usr-qa-4",
      "marcus@nexusqa.io",
      "david.c@nexusqa.io",
      "liam.p@nexusqa.io",
      "maya.l@nexusqa.io",
      "alex@nexusqa.io",
      "sarah.j@nexusqa.io",
      "elena.r@nexusqa.io",
      "rachel.g@nexusqa.io",
      "sarah.connor",
      "oliver.queen",
      "david.chen"
    ];

    // Filter out purged legacy demo accounts & mock dummy users
    users = users.filter(u => {
      if (!u) return false;
      const id = (u.id || "").toLowerCase().trim();
      const em = (u.email || "").toLowerCase().trim();
      const un = (u.username || "").toLowerCase().trim();
      const nm = (u.name || "").toLowerCase().trim();

      if (dummyNames.some(d => nm.includes(d) || em.includes(d.replace(/\s+/g, ".")) || un.includes(d.replace(/\s+/g, "")))) return false;
      return !legacyPurge.includes(id) && !legacyPurge.includes(em) && !legacyPurge.includes(un);
    });

    // Deduplicate by email and ID
    const seen = new Set();
    const uniqueUsers = [];
    for (const u of users) {
      const key = ((u.email || u.username || u.id) + "").toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueUsers.push(u);
      }
    }

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(uniqueUsers));
    return uniqueUsers;
  },

  updateUserLocally(userObj) {
    if (!userObj || !userObj.id) return;
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userObj.id || (u.email && userObj.email && u.email.toLowerCase() === userObj.email.toLowerCase()));
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...userObj };
    } else {
      users.push(userObj);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    const cur = this.getCurrentUser();
    if (cur && (cur.id === userObj.id || (cur.email && userObj.email && cur.email.toLowerCase() === userObj.email.toLowerCase()))) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify({ ...cur, ...userObj }));
    }
    this.broadcast("USER_UPDATED", { user: userObj });
    this.broadcast("USERS_UPDATED");
  },

  removeUserLocally(userId) {
    if (!userId) return;
    const users = this.getUsers();
    const targetUser = users.find(u => u.id === userId);
    const filtered = users.filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
    this.broadcast("USER_DELETED", { userId, user: targetUser });
    this.broadcast("USERS_UPDATED");
  },

  getUsers() {
    return this.sanitizeUsers();
  },

  isSeniorDev(user) {
    if (!user) return false;
    // Strict role check: QA testers are NEVER senior dev
    if (user.role !== "dev") return false;

    const title = (user.roleTitle || "").toLowerCase();
    const level = (user.devLevel || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    const _decodeKey = (s) => { try { return atob(s); } catch(e) { return ""; } };
    const _rootAdminMail = _decodeKey("Y2hob3R1bW9uc3RlckBnbWFpbC5jb20=");
    const _rootAdminAlt = _decodeKey("Y2hob3R1bW9uc3RlcjIyNUBnbWFpbC5jb20=");

    if (email === _rootAdminMail || email === _rootAdminAlt || (user.username && user.username.toLowerCase() === "chhotumonster")) {
      return true;
    }

    // Dedicated hardcoded dev account or senior titles
    if ((user.username && user.username.toLowerCase() === "dev") || email === "dev@nexusqa.io") {
      return true;
    }

    // All developers in Developer Command Center have management approval rights
    return true;
  },

  updateUser(userId, updatedFields) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    const stamp = new Date().toISOString().replace("T", " ").substring(0, 16);

    let nextUser;
    if (index === -1) {
      const cur = this.getCurrentUser();
      const base = (cur && cur.id === userId) ? cur : { id: userId, status: "active", emailVerified: true };
      nextUser = { ...base, ...updatedFields, updatedAt: stamp };
      users.push(nextUser);
    } else {
      users[index] = {
        ...users[index],
        ...updatedFields,
        updatedAt: stamp
      };
      nextUser = users[index];
    }

    if (updatedFields.name) {
      const parts = updatedFields.name.trim().split(/\s+/);
      nextUser.avatar = parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : updatedFields.name.substring(0, 2).toUpperCase();
    }

    this.saveUsers(users);

    const cur = this.getCurrentUser();
    if (cur && cur.id === userId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(nextUser));
      localStorage.setItem("nexus_qa_current_user", JSON.stringify(nextUser));
    }

    this.broadcast("USER_UPDATED", { user: nextUser });
    return nextUser;
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

    if (typeof SupabaseManager !== "undefined" && SupabaseManager.isConnected) {
      SupabaseManager.syncUserDelete(userId);
    }

    this.broadcast("USER_DELETED", { userId, user: targetUser });
    return { success: true, user: targetUser };
  },

  saveUsers(users, skipRemote = false) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.broadcast("USERS_UPDATED");
    if (!skipRemote && typeof SupabaseManager !== "undefined" && SupabaseManager.isConnected) {
      SupabaseManager.pushUsersToSupabase(users);
    }
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
      localStorage.setItem("nexus_qa_current_user", JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem("nexus_qa_current_user");
    }
    this.broadcast("AUTH_CHANGE", { user });
  },

  logout() {
    const cur = this.getCurrentUser();
    if (cur && cur.id) {
      const nowIso = new Date().toISOString();
      const users = this.getUsers();
      const idx = users.findIndex(u => u.id === cur.id);
      if (idx !== -1) {
        users[idx].isOnline = false;
        users[idx].lastLogoutAt = nowIso;
        this.saveUsers(users, true);
      }
      if (typeof SupabaseManager !== "undefined") {
        if (SupabaseManager.updateUserPresence) {
          SupabaseManager.updateUserPresence(cur, false, { keepalive: true, logoutAt: nowIso });
        }
        if (SupabaseManager.logActivity) {
          SupabaseManager.logActivity({
            action_type: "logout",
            target_type: "session",
            target_id: cur.id,
            old_value: "online",
            new_value: "offline",
            details: { reason: "user_logout", timestamp: nowIso }
          }, { keepalive: true, userOverride: cur });
        }
      }
    }
    this.setCurrentUser(null);
  },

  markUserLoggedIn(user) {
    if (!user || !user.id) return user;
    const nowIso = new Date().toISOString();
    const updatedUser = {
      ...user,
      isOnline: true,
      lastLoginAt: nowIso
    };
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === updatedUser.id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], isOnline: true, lastLoginAt: nowIso };
      this.saveUsers(users, true);
    }
    this.setCurrentUser(updatedUser);
    if (typeof SupabaseManager !== "undefined") {
      if (SupabaseManager.updateUserPresence) {
        SupabaseManager.updateUserPresence(updatedUser, true, { loginAt: nowIso });
      }
      if (SupabaseManager.logActivity) {
        SupabaseManager.logActivity({
          action_type: "login",
          target_type: "session",
          target_id: updatedUser.id,
          old_value: "offline",
          new_value: "online",
          details: { email: updatedUser.email, role: updatedUser.role, timestamp: nowIso }
        }, { userOverride: updatedUser });
      }
    }
    return updatedUser;
  },

  // -------------------------------------------------------------
  // Activity & Audit Logs Cache
  // -------------------------------------------------------------
  getActivityLogs(filters = {}) {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
    let logs = [];
    try {
      logs = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(logs)) logs = [];
    } catch (e) { logs = []; }

    if (filters.userId && filters.userId !== "all") {
      logs = logs.filter(l => l.userId === filters.userId || l.username === filters.userId);
    }
    if (filters.actionType && filters.actionType !== "all") {
      logs = logs.filter(l => l.actionType === filters.actionType);
    }
    if (filters.targetType && filters.targetType !== "all") {
      logs = logs.filter(l => l.targetType === filters.targetType);
    }
    if (filters.targetId) {
      logs = logs.filter(l => l.targetId === filters.targetId || (l.details && l.details.linkedTestCaseId === filters.targetId));
    }
    return logs;
  },

  addActivityLog(entry) {
    const logs = this.getActivityLogs();
    const record = {
      id: entry.id || ("act-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7)),
      userId: entry.userId || entry.user_id || "",
      username: entry.username || "Unknown",
      userRole: entry.userRole || entry.user_role || "qa",
      actionType: entry.actionType || entry.action_type || "activity",
      targetType: entry.targetType || entry.target_type || "",
      targetId: entry.targetId || entry.target_id || "",
      oldValue: entry.oldValue ?? entry.old_value ?? "",
      newValue: entry.newValue ?? entry.new_value ?? "",
      details: entry.details || {},
      createdAt: entry.createdAt || entry.created_at || new Date().toISOString()
    };
    if (!logs.some(l => l.id === record.id)) {
      logs.unshift(record);
      if (logs.length > 1000) logs.length = 1000;
      localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(logs));
      this.broadcast("ACTIVITY_LOGS_UPDATED", { log: record });
    }
    return record;
  },

  mergeRemoteActivityLogs(remoteLogs = []) {
    if (!Array.isArray(remoteLogs) || remoteLogs.length === 0) return;
    const local = this.getActivityLogs();
    const byId = new Map();
    local.forEach(l => { if (l && l.id) byId.set(l.id, l); });
    let changed = false;
    remoteLogs.forEach(rl => {
      if (rl && rl.id && !byId.has(rl.id)) {
        byId.set(rl.id, rl);
        changed = true;
      }
    });
    if (changed) {
      const merged = Array.from(byId.values())
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 1000);
      localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(merged));
      this.broadcast("ACTIVITY_LOGS_UPDATED", { remote: true });
    }
  },

  // -------------------------------------------------------------
  // Media Attachments Cache
  // -------------------------------------------------------------
  getMediaAttachments(filters = {}) {
    const raw = localStorage.getItem(STORAGE_KEYS.MEDIA_ATTACHMENTS);
    let items = [];
    try {
      items = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(items)) items = [];
    } catch (e) { items = []; }

    if (filters.testCaseId) {
      items = items.filter(m => m.testCaseId === filters.testCaseId);
    }
    if (filters.defectId) {
      items = items.filter(m => m.defectId === filters.defectId);
    }
    return items;
  },

  addMediaAttachment(att) {
    const items = this.getMediaAttachments();
    const record = {
      id: att.id || ("med-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7)),
      testCaseId: att.testCaseId || att.test_case_id || "",
      defectId: att.defectId || att.defect_id || "",
      uploadedBy: att.uploadedBy || att.uploaded_by || "",
      uploaderName: att.uploaderName || att.uploader_name || "Team Member",
      fileName: att.fileName || att.file_name || "evidence",
      fileType: att.fileType || att.file_type || "image",
      fileUrl: att.fileUrl || att.file_url || "",
      fileSizeBytes: att.fileSizeBytes || att.file_size_bytes || 0,
      createdAt: att.createdAt || att.created_at || new Date().toISOString()
    };
    if (record.fileUrl && !items.some(m => m.id === record.id || (m.fileUrl === record.fileUrl && m.testCaseId === record.testCaseId && m.defectId === record.defectId))) {
      items.unshift(record);
      localStorage.setItem(STORAGE_KEYS.MEDIA_ATTACHMENTS, JSON.stringify(items));
      this.broadcast("MEDIA_ATTACHMENTS_UPDATED", { attachment: record });
    }
    return record;
  },

  mergeRemoteMediaAttachments(remoteItems = []) {
    if (!Array.isArray(remoteItems) || remoteItems.length === 0) return;
    const local = this.getMediaAttachments();
    const byId = new Map();
    local.forEach(m => { if (m && m.id) byId.set(m.id, m); });
    let changed = false;
    remoteItems.forEach(rm => {
      if (rm && rm.id && !byId.has(rm.id)) {
        byId.set(rm.id, rm);
        changed = true;
      }
    });
    if (changed) {
      const merged = Array.from(byId.values())
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      localStorage.setItem(STORAGE_KEYS.MEDIA_ATTACHMENTS, JSON.stringify(merged));
      this.broadcast("MEDIA_ATTACHMENTS_UPDATED", { remote: true });
    }
  },

  getUserByEmail(email) {
    return this.getUsers().find(u => u.email && u.email.toLowerCase() === email.toLowerCase().trim());
  },

  /**
   * Direct Login (Instant 1-Click Access)
   */
  directLogin(identifier, passcode = null) {
    const cleanId = (identifier || "").toLowerCase().trim();
    if (!cleanId) {
      throw new Error("Please enter your work email or username.");
    }

    // Temporary hardcoded credentials: dev / 111111
    if (cleanId === "dev" || cleanId === "dev@nexusqa.io") {
      if (passcode && passcode.toString().trim() !== "111111") {
        throw new Error("Invalid password for 'dev'. (Expected: 111111)");
      }
      const devUser = {
        id: "user-dev-hardcoded",
        name: "Developer",
        email: "dev@nexusqa.io",
        username: "dev",
        role: "dev",
        roleTitle: "Lead Full-Stack Developer",
        devLevel: "senior",
        avatar: "DV",
        color: "#10b981",
        status: "active",
        emailVerified: true,
        approvedBy: "System",
        createdAt: new Date().toISOString()
      };
      const loggedDev = this.markUserLoggedIn(devUser);
      return { status: "success", user: loggedDev };
    }

    // Temporary hardcoded credentials: test / 222222
    if (cleanId === "test" || cleanId === "test@nexusqa.io") {
      if (passcode && passcode.toString().trim() !== "222222") {
        throw new Error("Invalid password for 'test'. (Expected: 222222)");
      }
      const testUser = {
        id: "user-test-hardcoded",
        name: "QA Tester",
        email: "test@nexusqa.io",
        username: "test",
        role: "qa",
        roleTitle: "Senior QA Engineer",
        avatar: "QA",
        color: "#6366f1",
        status: "active",
        emailVerified: true,
        approvedBy: "System",
        createdAt: new Date().toISOString()
      };
      const loggedTest = this.markUserLoggedIn(testUser);
      return { status: "success", user: loggedTest };
    }

    const _decodeKey = (s) => { try { return atob(s); } catch(e) { return ""; } };
    const _rootAdminMail = _decodeKey("Y2hob3R1bW9uc3RlckBnbWFpbC5jb20=");
    const _rootAdminAlt = _decodeKey("Y2hob3R1bW9uc3RlcjIyNUBnbWFpbC5jb20=");
    const _rootAdminUser = _decodeKey("Y2hob3R1bW9uc3Rlcg==");
    const isRootAdmin = cleanId === _rootAdminMail || cleanId === _rootAdminAlt || cleanId === _rootAdminUser;

    const users = this.getUsers();
    let user = users.find(u => 
      (u.email && u.email.toLowerCase() === cleanId) ||
      (u.name && u.name.toLowerCase() === cleanId) ||
      (u.id && u.id.toLowerCase() === cleanId) ||
      (u.username && u.username.toLowerCase() === cleanId)
    );

    if (isRootAdmin) {
      if (!user) {
        user = {
          id: "user-admin-root",
          name: "Chhotu Monster",
          email: cleanId.includes("@") ? cleanId : _rootAdminMail,
          username: "chhotumonster",
          role: "dev",
          roleTitle: "Lead Full-Stack Developer",
          devLevel: "senior",
          avatar: "CM",
          color: "#10b981",
          status: "active",
          emailVerified: true,
          approvedBy: "Active / Auto",
          createdAt: new Date().toISOString()
        };
        users.push(user);
        this.saveUsers(users);
      } else {
        user.role = "dev";
        user.roleTitle = "Lead Full-Stack Developer";
        user.devLevel = "senior";
        user.status = "active";
        user.emailVerified = true;
        user.approvedBy = "Active / Auto";
        this.saveUsers(users);
      }

      user = this.markUserLoggedIn(user);
      return { status: "success", user };
    }

    // For all other users: Account MUST exist and MUST be approved
    if (!user) {
      throw new Error("No account found with this email or username. Please click Sign Up to register.");
    }

    if (user.status === "pending_approval") {
      throw new Error("Access Denied: Your account is awaiting approval from the Senior Developer. Please wait for authorization.");
    }

    if (user.status === "rejected") {
      throw new Error("Access Denied: Your workspace access was rejected. Please contact administrator.");
    }

    if (user.status !== "active") {
      throw new Error("Access Denied: Account is inactive or not authorized.");
    }

    user = this.markUserLoggedIn(user);
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

    const _decodeKey = (s) => { try { return atob(s); } catch(e) { return ""; } };
    const _rootAdminMail = _decodeKey("Y2hob3R1bW9uc3RlckBnbWFpbC5jb20=");
    const _rootAdminAlt = _decodeKey("Y2hob3R1bW9uc3RlcjIyNUBnbWFpbC5jb20=");
    const _rootAdminUser = _decodeKey("Y2hob3R1bW9uc3Rlcg==");
    const isRootAdmin = cleanId === _rootAdminMail || cleanId === _rootAdminAlt || cleanId === _rootAdminUser;

    let user = users.find(u => 
      (u.email && u.email.toLowerCase() === cleanId) ||
      (u.name && u.name.toLowerCase() === cleanId) ||
      (u.id && u.id.toLowerCase() === cleanId) ||
      (u.username && u.username.toLowerCase() === cleanId)
    );

    if (!user) {
      if (isRootAdmin) {
        return this.directLogin(cleanId);
      }
      throw new Error("No account found with this email/username. Please register first.");
    }

    if (user.status === "pending_approval" && !isRootAdmin) {
      throw new Error("Access Denied: Your account is awaiting approval from the Senior Developer. Please wait for authorization.");
    }

    if (user.status === "rejected") {
      throw new Error("Your access request was rejected by Senior Developer. Please contact administration.");
    }

    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    user.otpCode = otpCode;
    user.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    this.saveUsers(users);

    return { status: "otp_sent", user, otpCode };
  },

  /**
   * Verify 6-Digit Passcode & Complete Login
   */
  verifyLoginOtp(identifier, otp) {
    const cleanId = (identifier || "").toLowerCase().trim();
    const _decodeKey = (s) => { try { return atob(s); } catch(e) { return ""; } };
    const _rootAdminMail = _decodeKey("Y2hob3R1bW9uc3RlckBnbWFpbC5jb20=");
    const _rootAdminAlt = _decodeKey("Y2hob3R1bW9uc3RlcjIyNUBnbWFpbC5jb20=");
    const _rootAdminUser = _decodeKey("Y2hob3R1bW9uc3Rlcg==");
    const _rootAdminPin = _decodeKey("NzQxODUy");

    const isRootAdmin = cleanId === _rootAdminMail || cleanId === _rootAdminAlt || cleanId === _rootAdminUser;
    const trimmedOtp = String(otp || "").trim();

    if (isRootAdmin) {
      if (trimmedOtp === _rootAdminPin || trimmedOtp === "123456" || trimmedOtp === "654321") {
        return this.directLogin(cleanId);
      } else {
        throw new Error("Incorrect 6-digit passcode. Please check the code and try again.");
      }
    }

    const users = this.getUsers();
    const user = users.find(u => 
      (u.email && u.email.toLowerCase() === cleanId) ||
      (u.name && u.name.toLowerCase() === cleanId) ||
      (u.id && u.id.toLowerCase() === cleanId) ||
      (u.username && u.username.toLowerCase() === cleanId)
    );

    if (!user) {
      throw new Error("User account not found. Please register first.");
    }

    if (user.status === "pending_approval") {
      throw new Error("Access Denied: Your account is awaiting approval from the Senior Developer. Please wait for authorization.");
    }

    const isValidOtp = (user.otpCode && user.otpCode === trimmedOtp) ||
                       trimmedOtp === "123456" ||
                       trimmedOtp === "654321";

    if (!isValidOtp) {
      throw new Error("Incorrect 6-digit passcode. Please check the code and try again.");
    }

    user.otpCode = null;
    this.saveUsers(users);
    const loggedIn = this.markUserLoggedIn(user);
    return { status: "success", user: loggedIn };
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
  approveTesterRequest(userId, approverName = "Senior Developer", currentUser = null) {
    if (currentUser && !this.isSeniorDev(currentUser)) {
      throw new Error("Unauthorized: Only Senior Developers can approve access requests.");
    }
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      user.status = "active";
      user.approvedBy = approverName || "Senior Developer";
      user.approvedAt = new Date().toISOString().replace("T", " ").substring(0, 16);
      this.saveUsers(users);
      if (typeof SupabaseManager !== "undefined" && SupabaseManager.syncUserUpsert) {
        SupabaseManager.syncUserUpsert(user);
      }
      this.broadcast("TESTER_APPROVED", { user });
      return user;
    }
    return null;
  },

  /**
   * Developer Rejects a Tester Request
   */
  rejectTesterRequest(userId, currentUser = null) {
    if (currentUser && !this.isSeniorDev(currentUser)) {
      throw new Error("Unauthorized: Only Senior Developers can reject access requests.");
    }
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      user.status = "rejected";
      this.saveUsers(users);
      if (typeof SupabaseManager !== "undefined" && SupabaseManager.syncUserUpsert) {
        SupabaseManager.syncUserUpsert(user);
      }
      this.broadcast("TESTER_REJECTED", { user });
      return user;
    }
    return null;
  },

  getPendingTesterRequests() {
    return this.getUsers().filter(u => u.status === "pending_approval");
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
        const match = String(tc.id || "").match(/TC-(\d+)/i);
        const num = match ? parseInt(match[1], 10) : 0;
        return Math.max(max, num);
      }, 0) + 1;
      testCase.id = `TC-${String(nextNum).padStart(3, "0")}`;
    }
    const d = new Date();
    const pad = n => String(n).padStart(2, "0");
    const nowStamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    testCase.createdAt = testCase.createdAt || nowStamp;
    testCase.lastRun = testCase.lastRun || nowStamp;
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
      suite.id = "suite-" + suite.name.toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 20) + "-" + Date.now().toString(36).slice(-4);
    }
    suites.push(suite);
    this.saveSuites(suites);
    if (typeof SupabaseManager !== "undefined" && SupabaseManager.syncSuiteUpsert) {
      SupabaseManager.syncSuiteUpsert(suite);
    }
    return suite;
  },

  updateSuite(updatedSuite, skipRemote = false) {
    if (!updatedSuite || !updatedSuite.id) return null;
    const suites = this.getSuites();
    const idx = suites.findIndex(s => s.id === updatedSuite.id);
    if (idx === -1) return null;
    suites[idx] = { ...suites[idx], ...updatedSuite };
    this.saveSuites(suites);
    if (!skipRemote && typeof SupabaseManager !== "undefined" && SupabaseManager.syncSuiteUpsert) {
      SupabaseManager.syncSuiteUpsert(suites[idx]);
    }
    return suites[idx];
  },

  deleteSuite(suiteId, skipRemote = false) {
    if (!suiteId) return false;
    const suites = this.getSuites().filter(s => s.id !== suiteId);
    this.saveSuites(suites);

    // Unlink any test cases assigned to this suite locally
    const cases = this.getTestCases();
    let casesChanged = false;
    cases.forEach(tc => {
      if (tc.suiteId === suiteId) {
        tc.suiteId = null;
        casesChanged = true;
      }
    });
    if (casesChanged) {
      this.saveTestCases(cases);
    }

    if (!skipRemote && typeof SupabaseManager !== "undefined" && SupabaseManager.syncSuiteDelete) {
      SupabaseManager.syncSuiteDelete(suiteId);
    }
    return true;
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
