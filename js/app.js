/**
 * NexusQA - Main Application Controller
 * Dual-Role Connected Platform: QA Tester Portal & Developer Hub (with Supabase Cloud Backend)
 */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Storage & Sync Channel
  StorageManager.init().then(() => {
    updateSupabaseStatusUI();
  });

  // App State
  const state = {
    currentUser: StorageManager.getCurrentUser(),
    currentPortal: "qa", // "qa" or "dev"
    currentView: "dashboard",
    selectedSuiteId: "all",
    searchQuery: "",
    filterStatus: "all",
    filterPriority: "all",
    filterType: "all",
    sortField: "id",
    sortAsc: true,
    selectedTestCaseIds: new Set(),
    activeRunnerIndex: 0,
    runnerFilter: "all",
    runnerTimerSeconds: 272,
    timerInterval: null,
    generatedAITests: [],
    devOnlyMyBugs: false,
    pendingRegistrationEmail: "",
    currentOtpCode: "",
    otpTimerInterval: null
  };

  // Cache DOM Elements
  const DOM = {
    // Auth Gate & Dedicated Tester Verification
    authGateOverlay: document.getElementById("authGateOverlay"),
    // React Bits Pro Auth 5 Elements
    auth5Card: document.getElementById("auth5Card"),
    auth5Title: document.getElementById("auth5Title"),
    auth5Subtitle: document.getElementById("auth5Subtitle"),
    auth5RoleSwitch: document.getElementById("auth5RoleSwitch"),
    btnRoleTester: document.getElementById("btnRoleTester"),
    btnRoleDev: document.getElementById("btnRoleDev"),
    auth5StateForm: document.getElementById("auth5StateForm"),
    auth5InboxState: document.getElementById("auth5InboxState"),
    auth5ResendCountdown: document.getElementById("auth5ResendCountdown"),
    btnTesterLoginSubmit: document.getElementById("btnTesterLoginSubmit"),
    btnDevLoginSubmit: document.getElementById("btnDevLoginSubmit"),

    authGateSubtitle: document.getElementById("authGateSubtitle"),
    authNavTabs: document.getElementById("authNavTabs"),
    tabBtnTesterAuth: document.getElementById("tabBtnTesterAuth"),
    tabBtnDevAuth: document.getElementById("tabBtnDevAuth"),
    testerAuthSection: document.getElementById("testerAuthSection"),
    devAuthSection: document.getElementById("devAuthSection"),
    testerSubTabs: document.getElementById("testerSubTabs"),
    subTabTesterLogin: document.getElementById("subTabTesterLogin"),
    subTabTesterSignup: document.getElementById("subTabTesterSignup"),

    testerLoginView: document.getElementById("testerLoginView"),
    testerSignupView: document.getElementById("testerSignupView"),
    testerOtpView: document.getElementById("testerOtpView"),
    testerPendingApprovalView: document.getElementById("testerPendingApprovalView"),

    testerLoginForm: document.getElementById("testerLoginForm"),
    testerLoginEmail: document.getElementById("testerLoginEmail"),
    testerLoginPassword: document.getElementById("testerLoginPassword"),

    testerSignupForm: document.getElementById("testerSignupForm"),
    testerSignupName: document.getElementById("testerSignupName"),
    testerSignupEmail: document.getElementById("testerSignupEmail"),
    testerSignupPassword: document.getElementById("testerSignupPassword"),
    testerSignupConfirmPassword: document.getElementById("testerSignupConfirmPassword"),
    testerSignupRoleTitle: document.getElementById("testerSignupRoleTitle"),
    btnTesterSendOtp: document.getElementById("btnTesterSendOtp"),
    authInlineAlert: document.getElementById("authInlineAlert"),
    authInlineAlertText: document.getElementById("authInlineAlertText"),

    testerOtpForm: document.getElementById("testerOtpForm"),
    codeSlots: document.getElementById("otpCodeSlots"),
    codeSlotsRow: document.getElementById("codeSlotsRow"),
    codeSlotsInput: document.getElementById("codeSlotsInput"),
    codeSlotsCaret: document.getElementById("codeSlotsCaret"),
    codeSlotsSrCount: document.getElementById("codeSlotsSrCount"),
    otpInputsGrid: document.getElementById("otpInputsGrid"),
    otpRecipientEmailLabel: document.getElementById("otpRecipientEmailLabel"),
    otpTimerLabel: document.getElementById("otpTimerLabel"),
    btnResendOtp: document.getElementById("btnResendOtp"),
    btnVerifyOtpSubmit: document.getElementById("btnVerifyOtpSubmit"),
    pendingUserEmailLabel: document.getElementById("pendingUserEmailLabel"),

    devLoginForm: document.getElementById("devLoginForm"),
    devLoginEmail: document.getElementById("devLoginEmail"),
    devLoginPassword: document.getElementById("devLoginPassword"),

    // Simulated Email Toast
    simulatedEmailToast: document.getElementById("simulatedEmailToast"),
    simulatedEmailToLabel: document.getElementById("simulatedEmailToLabel"),
    simulatedEmailOtpCode: document.getElementById("simulatedEmailOtpCode"),
    btnAutoFillOtp: document.getElementById("btnAutoFillOtp"),

    // Dev Approvals
    devPendingApprovalsBadge: document.getElementById("devPendingApprovalsBadge"),
    devApprovalAlertBanner: document.getElementById("devApprovalAlertBanner"),
    devApprovalAlertCount: document.getElementById("devApprovalAlertCount"),
    btnGoToApprovals: document.getElementById("btnGoToApprovals"),
    kpiPendingApprovalsCount: document.getElementById("kpiPendingApprovalsCount"),
    kpiActiveTestersCount: document.getElementById("kpiActiveTestersCount"),
    kpiOtpVerifiedCount: document.getElementById("kpiOtpVerifiedCount"),
    pendingApprovalsListContainer: document.getElementById("pendingApprovalsListContainer"),
    authorizedTestersTableBody: document.getElementById("authorizedTestersTableBody"),
    refreshApprovalsBtn: document.getElementById("refreshApprovalsBtn"),

    // Navigation & Shell
    sidebar: document.getElementById("sidebar"),
    sidebarBurgerBtn: document.getElementById("sidebarBurgerBtn"),
    qaNavSection: document.getElementById("qaNavSection"),
    devNavSection: document.getElementById("devNavSection"),
    portalRoleBadge: document.getElementById("portalRoleBadge"),
    portalCrumbRoot: document.getElementById("portalCrumbRoot"),
    currentCrumb: document.getElementById("currentCrumb"),
    globalSearchInput: document.getElementById("globalSearchInput"),
    themeToggleBtn: document.getElementById("themeToggleBtn"),
    themeSwitchCheckbox: document.getElementById("themeSwitchCheckbox"),
    menuToggleBtn: document.getElementById("menuToggleBtn"),
    logoutBtn: document.getElementById("logoutBtn"),
    switchUserQuickBtn: document.getElementById("switchUserQuickBtn"),

    pillQaPortalBtn: document.getElementById("pillQaPortalBtn"),
    pillDevPortalBtn: document.getElementById("pillDevPortalBtn"),
    createQuickBtn: document.getElementById("createQuickBtn"),
    createQuickBtnLabel: document.getElementById("createQuickBtnLabel"),
    quickRunBtn: document.getElementById("quickRunBtn"),

    syncDotIndicator: document.getElementById("syncDotIndicator"),
    syncTextLabel: document.getElementById("syncTextLabel"),

    userAvatarRing: document.getElementById("userAvatarRing"),
    userAvatarInitials: document.getElementById("userAvatarInitials"),
    userNameLabel: document.getElementById("userNameLabel"),
    userRoleLabel: document.getElementById("userRoleLabel"),

    viewPanels: document.querySelectorAll(".view-panel"),

    // QA Dashboard
    kpiTotalTests: document.getElementById("kpiTotalTests"),
    kpiPassRate: document.getElementById("kpiPassRate"),
    kpiPassRateProgress: document.getElementById("kpiPassRateProgress"),
    kpiUntestedCount: document.getElementById("kpiUntestedCount"),
    kpiUntestedSub: document.getElementById("kpiUntestedSub"),
    kpiUntestedProgress: document.getElementById("kpiUntestedProgress"),
    kpiAutomationRate: document.getElementById("kpiAutomationRate"),
    kpiAutoCount: document.getElementById("kpiAutoCount"),
    kpiAutoProgress: document.getElementById("kpiAutoProgress"),
    kpiDefectsCount: document.getElementById("kpiDefectsCount"),
    kpiCriticalDefects: document.getElementById("kpiCriticalDefects"),
    testStatusDonut: document.getElementById("testStatusDonut"),
    donutCenterVal: document.getElementById("donutCenterVal"),
    statusLegend: document.getElementById("statusLegend"),
    moduleHealthList: document.getElementById("moduleHealthList"),
    recentRunsTableBody: document.getElementById("recentRunsTableBody"),
    priorityBreakdown: document.getElementById("priorityBreakdown"),
    refreshMetricsBtn: document.getElementById("refreshMetricsBtn"),
    gotoTestRunsBtn: document.getElementById("gotoTestRunsBtn"),
    exportDashboardReportBtn: document.getElementById("exportDashboardReportBtn"),
    retestAlertBanner: document.getElementById("retestAlertBanner"),
    retestAlertCount: document.getElementById("retestAlertCount"),
    viewRetestBugsBtn: document.getElementById("viewRetestBugsBtn"),

    // QA Repository
    suiteNavList: document.getElementById("suiteNavList"),
    suiteSearchInput: document.getElementById("suiteSearchInput"),
    addNewSuiteBtn: document.getElementById("addNewSuiteBtn"),
    selectedSuiteTestCount: document.getElementById("selectedSuiteTestCount"),
    selectedSuiteAutoCount: document.getElementById("selectedSuiteAutoCount"),
    testCaseSearchInput: document.getElementById("testCaseSearchInput"),
    filterStatus: document.getElementById("filterStatus"),
    filterPriority: document.getElementById("filterPriority"),
    filterType: document.getElementById("filterType"),
    resetFiltersBtn: document.getElementById("resetFiltersBtn"),
    batchActionBar: document.getElementById("batchActionBar"),
    selectedCountBadge: document.getElementById("selectedCountBadge"),
    batchRunBtn: document.getElementById("batchRunBtn"),
    batchPassBtn: document.getElementById("batchPassBtn"),
    batchFailBtn: document.getElementById("batchFailBtn"),
    batchBlockBtn: document.getElementById("batchBlockBtn"),
    batchDeleteBtn: document.getElementById("batchDeleteBtn"),
    testCasesTableBody: document.getElementById("testCasesTableBody"),
    selectAllCheckbox: document.getElementById("selectAllCheckbox"),
    testCaseEmptyState: document.getElementById("testCaseEmptyState"),
    emptyCreateBtn: document.getElementById("emptyCreateBtn"),
    showingCount: document.getElementById("showingCount"),
    totalTestsCount: document.getElementById("totalTestsCount"),
    statPassed: document.getElementById("statPassed"),
    statFailed: document.getElementById("statFailed"),
    statBlocked: document.getElementById("statBlocked"),
    statUntested: document.getElementById("statUntested"),
    createNewTestCaseBtn: document.getElementById("createNewTestCaseBtn"),
    testCaseCountBadge: document.getElementById("testCaseCountBadge"),
    defectCountBadge: document.getElementById("defectCountBadge"),
    exportTestsBtn: document.getElementById("exportTestsBtn"),
    importTestsBtn: document.getElementById("importTestsBtn"),

    // QA Defects
    openBugsCount: document.getElementById("openBugsCount"),
    criticalBugsCount: document.getElementById("criticalBugsCount"),
    readyForRetestCount: document.getElementById("readyForRetestCount"),
    resolvedBugsCount: document.getElementById("resolvedBugsCount"),
    bugSearchInput: document.getElementById("bugSearchInput"),
    filterBugSeverity: document.getElementById("filterBugSeverity"),
    filterBugStatus: document.getElementById("filterBugStatus"),
    defectsTableBody: document.getElementById("defectsTableBody"),
    createNewBugBtn: document.getElementById("createNewBugBtn"),

    // Developer Portal Elements
    devKpiCritical: document.getElementById("devKpiCritical"),
    devKpiAssigned: document.getElementById("devKpiAssigned"),
    devKpiAssignedSub: document.getElementById("devKpiAssignedSub"),
    devKpiReadyRetest: document.getElementById("devKpiReadyRetest"),
    devKpiVerified: document.getElementById("devKpiVerified"),
    devActiveDefectsList: document.getElementById("devActiveDefectsList"),
    devRecentPrFeed: document.getElementById("devRecentPrFeed"),
    refreshDevMetricsBtn: document.getElementById("refreshDevMetricsBtn"),
    gotoDevKanbanBtn: document.getElementById("gotoDevKanbanBtn"),
    filterMyBugsBtn: document.getElementById("filterMyBugsBtn"),
    devAssignedBadge: document.getElementById("devAssignedBadge"),
    devFailedTestsBadge: document.getElementById("devFailedTestsBadge"),

    kanbanOpenCount: document.getElementById("kanbanOpenCount"),
    kanbanProgressCount: document.getElementById("kanbanProgressCount"),
    kanbanRetestCount: document.getElementById("kanbanRetestCount"),
    kanbanVerifiedCount: document.getElementById("kanbanVerifiedCount"),
    kanbanColOpen: document.getElementById("kanbanColOpen"),
    kanbanColProgress: document.getElementById("kanbanColProgress"),
    kanbanColRetest: document.getElementById("kanbanColRetest"),
    kanbanColVerified: document.getElementById("kanbanColVerified"),
    devFailuresContainer: document.getElementById("devFailuresContainer"),

    // Developer Fix Modal
    devFixModal: document.getElementById("devFixModal"),
    devFixModalBugId: document.getElementById("devFixModalBugId"),
    devFixBugId: document.getElementById("devFixBugId"),
    devFixBugSummary: document.getElementById("devFixBugSummary"),
    devFixBugDescription: document.getElementById("devFixBugDescription"),
    devFixBugReporter: document.getElementById("devFixBugReporter"),
    devFixBugSeverity: document.getElementById("devFixBugSeverity"),
    devFixBugLinkedTest: document.getElementById("devFixBugLinkedTest"),
    devFixLinkedTestStepsList: document.getElementById("devFixLinkedTestStepsList"),
    devFixBranchInput: document.getElementById("devFixBranchInput"),
    devFixPrInput: document.getElementById("devFixPrInput"),
    devFixNotesInput: document.getElementById("devFixNotesInput"),
    devFixStatusSelect: document.getElementById("devFixStatusSelect"),
    devFixAssigneeSelect: document.getElementById("devFixAssigneeSelect"),
    closeDevFixModalBtn: document.getElementById("closeDevFixModalBtn"),
    cancelDevFixModalBtn: document.getElementById("cancelDevFixModalBtn"),
    saveDevFixBtn: document.getElementById("saveDevFixBtn"),

    // Edit Team Member Modal (Senior Dev)
    editMemberModal: document.getElementById("editMemberModal"),
    editMemberForm: document.getElementById("editMemberForm"),
    editMemberId: document.getElementById("editMemberId"),
    editMemberName: document.getElementById("editMemberName"),
    editMemberEmail: document.getElementById("editMemberEmail"),
    editMemberRoleType: document.getElementById("editMemberRoleType"),
    editMemberSpecialty: document.getElementById("editMemberSpecialty"),
    editMemberStatus: document.getElementById("editMemberStatus"),
    editMemberApprovedBy: document.getElementById("editMemberApprovedBy"),
    closeEditMemberModalBtn: document.getElementById("closeEditMemberModalBtn"),
    cancelEditMemberModalBtn: document.getElementById("cancelEditMemberModalBtn"),
    saveEditMemberBtn: document.getElementById("saveEditMemberBtn"),
    deleteMemberWrap: document.getElementById("deleteMemberWrap"),
    deleteMemberBtn: document.getElementById("deleteMemberBtn"),
    editMemberIdBadge: document.getElementById("editMemberIdBadge"),
    editMemberAuthBadge: document.getElementById("editMemberAuthBadge"),

    // AI Generator & Voice Studio
    topbarVoiceAiBtn: document.getElementById("topbarVoiceAiBtn"),
    btnClearAiChat: document.getElementById("btnClearAiChat"),
    aiChatHistory: document.getElementById("aiChatHistory"),
    voiceListeningBanner: document.getElementById("voiceListeningBanner"),
    btnStopVoiceRec: document.getElementById("btnStopVoiceRec"),
    btnVoiceMic: document.getElementById("btnVoiceMic"),
    aiTargetSuiteSelect: document.getElementById("aiTargetSuiteSelect"),
    aiStoryPrompt: document.getElementById("aiStoryPrompt"),
    loadSampleStoryBtn: document.getElementById("loadSampleStoryBtn"),
    generateAITestsBtn: document.getElementById("generateAITestsBtn"),
    btnCopyExcelTsv: document.getElementById("btnCopyExcelTsv"),
    importAllAITestsBtn: document.getElementById("importAllAITestsBtn"),
    aiGeneratedCount: document.getElementById("aiGeneratedCount"),
    aiIdlePlaceholder: document.getElementById("aiIdlePlaceholder"),
    aiGeneratingLoader: document.getElementById("aiGeneratingLoader"),
    generatedCardsList: document.getElementById("generatedCardsList"),

    // Suites
    suitesGridCards: document.getElementById("suitesGridCards"),
    createSuiteModalBtn: document.getElementById("createSuiteModalBtn"),
    suiteModal: document.getElementById("suiteModal"),
    closeSuiteModalBtn: document.getElementById("closeSuiteModalBtn"),
    cancelSuiteModalBtn: document.getElementById("cancelSuiteModalBtn"),
    saveSuiteBtn: document.getElementById("saveSuiteBtn"),
    suiteForm: document.getElementById("suiteForm"),
    newSuiteName: document.getElementById("newSuiteName"),
    newSuiteDescription: document.getElementById("newSuiteDescription"),
    newSuiteIcon: document.getElementById("newSuiteIcon"),

    // Modals
    testCaseModal: document.getElementById("testCaseModal"),
    testCaseForm: document.getElementById("testCaseForm"),
    testCaseModalTitle: document.getElementById("testCaseModalTitle"),
    editTestCaseId: document.getElementById("editTestCaseId"),
    tcTitle: document.getElementById("tcTitle"),
    tcSuite: document.getElementById("tcSuite"),
    tcPriority: document.getElementById("tcPriority"),
    tcType: document.getElementById("tcType"),
    tcStatus: document.getElementById("tcStatus"),
    tcPreconditions: document.getElementById("tcPreconditions"),
    tcTags: document.getElementById("tcTags"),
    stepsBuilderList: document.getElementById("stepsBuilderList"),
    addStepBtn: document.getElementById("addStepBtn"),
    saveTestCaseBtn: document.getElementById("saveTestCaseBtn"),
    autoInputTestCaseBtn: document.getElementById("autoInputTestCaseBtn"),
    closeTestCaseModalBtn: document.getElementById("closeTestCaseModalBtn"),
    cancelTestCaseModalBtn: document.getElementById("cancelTestCaseModalBtn"),
    tcImageFileInput: document.getElementById("tcImageFileInput"),
    tcImageUploadBox: document.getElementById("tcImageUploadBox"),
    tcImageDropzone: document.getElementById("tcImageDropzone"),
    tcImagePreviewWrap: document.getElementById("tcImagePreviewWrap"),
    tcImagePreview: document.getElementById("tcImagePreview"),
    tcRemoveImageBtn: document.getElementById("tcRemoveImageBtn"),
    tcViewImageFullBtn: document.getElementById("tcViewImageFullBtn"),
    tcImageFileName: document.getElementById("tcImageFileName"),
    editTestCaseDeleteWrap: document.getElementById("editTestCaseDeleteWrap"),
    deleteTestCaseModalBtn: document.getElementById("deleteTestCaseModalBtn"),

    // Conversational AI QA Assistant & Auto Input Studio Modal
    autoInputModal: document.getElementById("autoInputModal"),
    aiTargetSuite: document.getElementById("aiTargetSuite"),
    aiChatStream: document.getElementById("aiChatStream"),
    aiTestCasePromptInput: document.getElementById("aiTestCasePromptInput"),
    aiExtractSubmitBtn: document.getElementById("aiExtractSubmitBtn"),
    aiStudioStatusText: document.getElementById("aiStudioStatusText"),
    clearAiChatBtn: document.getElementById("clearAiChatBtn"),
    resetSessionBtn: document.getElementById("resetSessionBtn"),
    openTaskRefModalBtn: document.getElementById("openTaskRefModalBtn"),
    closeAutoInputModalBtn: document.getElementById("closeAutoInputModalBtn"),
    cancelAutoInputModalBtn: document.getElementById("cancelAutoInputModalBtn"),
    dashboardAutoInputBtn: document.getElementById("dashboardAutoInputBtn"),
    repoAutoInputBtn: document.getElementById("repoAutoInputBtn"),
    autoInputTestCaseBtn: document.getElementById("autoInputTestCaseBtn"),
    dashboardNewTestCaseBtn: document.getElementById("dashboardNewTestCaseBtn"),

    // Session Status Pills
    valTestRef: document.getElementById("valTestRef"),
    valSide: document.getElementById("valSide"),
    valTrainerCount: document.getElementById("valTrainerCount"),
    valStudentCount: document.getElementById("valStudentCount"),
    pillMismatch: document.getElementById("pillMismatch"),

    // Voice & Media
    voiceRecordingBanner: document.getElementById("voiceRecordingBanner"),
    aiVoiceDictateBtn: document.getElementById("aiVoiceDictateBtn"),
    stopVoiceBtn: document.getElementById("stopVoiceBtn"),
    aiAttachScreenshotLabel: document.getElementById("aiAttachScreenshotLabel"),
    aiScreenshotFileInput: document.getElementById("aiScreenshotFileInput"),
    aiEvidencePreviewBar: document.getElementById("aiEvidencePreviewBar"),
    evidencePreviewImg: document.getElementById("evidencePreviewImg"),
    evidenceFileName: document.getElementById("evidenceFileName"),
    removeEvidenceBtn: document.getElementById("removeEvidenceBtn"),
    chipTrainerSide: document.getElementById("chipTrainerSide"),
    chipStudentSide: document.getElementById("chipStudentSide"),

    // Review & Staged Cards
    aiReviewCardsList: document.getElementById("aiReviewCardsList"),
    stagedRecordsCountBadge: document.getElementById("stagedRecordsCountBadge"),
    emptyReviewPlaceholder: document.getElementById("emptyReviewPlaceholder"),
    copyAllTsvBtn: document.getElementById("copyAllTsvBtn"),
    downloadAllCsvBtn: document.getElementById("downloadAllCsvBtn"),
    aiExportTsvFooterBtn: document.getElementById("aiExportTsvFooterBtn"),
    aiConfirmSaveAllBtn: document.getElementById("aiConfirmSaveAllBtn"),

    // Task Reference Modal
    taskReferenceModal: document.getElementById("taskReferenceModal"),
    closeTaskRefModalBtn: document.getElementById("closeTaskRefModalBtn"),
    closeTaskRefModalFooterBtn: document.getElementById("closeTaskRefModalFooterBtn"),
    taskRefTable: document.getElementById("taskRefTable"),
    taskRefTableBody: document.getElementById("taskRefTableBody"),
    addNewTaskRefBtn: document.getElementById("addNewTaskRefBtn"),

    // 22-Col Full Editor Modal
    qa22ColEditModal: document.getElementById("qa22ColEditModal"),
    closeQaEditModalBtn: document.getElementById("closeQaEditModalBtn"),
    cancelQaEditModalBtn: document.getElementById("cancelQaEditModalBtn"),
    saveQaEditModalBtn: document.getElementById("saveQaEditModalBtn"),

    testCaseDetailModal: document.getElementById("testCaseDetailModal"),
    viewDetailId: document.getElementById("viewDetailId"),
    viewDetailTitle: document.getElementById("viewDetailTitle"),
    viewDetailBody: document.getElementById("viewDetailBody"),
    closeDetailModalBtn: document.getElementById("closeDetailModalBtn"),
    editDetailTestCaseBtn: document.getElementById("editDetailTestCaseBtn"),
    runDetailTestCaseBtn: document.getElementById("runDetailTestCaseBtn"),
    detailPassedTestCaseBtn: document.getElementById("detailPassedTestCaseBtn"),
    detailFailedTestCaseBtn: document.getElementById("detailFailedTestCaseBtn"),
    detailBlockedTestCaseBtn: document.getElementById("detailBlockedTestCaseBtn"),
    deleteDetailTestCaseBtn: document.getElementById("deleteDetailTestCaseBtn"),

    defectModal: document.getElementById("defectModal"),
    closeDefectModalBtn: document.getElementById("closeDefectModalBtn"),
    cancelDefectModalBtn: document.getElementById("cancelDefectModalBtn"),
    saveDefectBtn: document.getElementById("saveDefectBtn"),
    editDefectDeleteWrap: document.getElementById("editDefectDeleteWrap"),
    deleteDefectModalBtn: document.getElementById("deleteDefectModalBtn"),
    defectForm: document.getElementById("defectForm"),
    editDefectId: document.getElementById("editDefectId"),
    bugSummary: document.getElementById("bugSummary"),
    bugSeverity: document.getElementById("bugSeverity"),
    bugPriority: document.getElementById("bugPriority"),
    bugLinkedTest: document.getElementById("bugLinkedTest"),
    bugAssignee: document.getElementById("bugAssignee"),
    bugDescription: document.getElementById("bugDescription"),

    // Settings & Supabase
    supabaseConnectionBadge: document.getElementById("supabaseConnectionBadge"),
    supabaseUrlInput: document.getElementById("supabaseUrlInput"),
    supabaseKeyInput: document.getElementById("supabaseKeyInput"),
    saveSupabaseConfigBtn: document.getElementById("saveSupabaseConfigBtn"),
    pushDataToSupabaseBtn: document.getElementById("pushDataToSupabaseBtn"),
    copySqlSchemaBtn: document.getElementById("copySqlSchemaBtn"),

    broadcastPingBtn: document.getElementById("broadcastPingBtn"),
    exportFullBackupBtn: document.getElementById("exportFullBackupBtn"),
    importJsonFileInput: document.getElementById("importJsonFileInput"),
    exportCsvBtn: document.getElementById("exportCsvBtn"),
    resetSeedDataBtn: document.getElementById("resetSeedDataBtn"),

    toastContainer: document.getElementById("toastContainer"),

    // User Profile & Account Settings
    profileFormAvatarPreview: document.getElementById("profileFormAvatarPreview"),
    profileFormAvatarInitials: document.getElementById("profileFormAvatarInitials"),
    profileFormHeaderName: document.getElementById("profileFormHeaderName"),
    profileRoleBadgeHeader: document.getElementById("profileRoleBadgeHeader"),
    profileLargeAvatar: document.getElementById("profileLargeAvatar"),
    profileLargeInitials: document.getElementById("profileLargeInitials"),
    profileLargeImg: document.getElementById("profileLargeImg"),
    profilePhotoInput: document.getElementById("profilePhotoInput"),
    profileRemovePhotoWrap: document.getElementById("profileRemovePhotoWrap"),
    profileRemovePhotoBtn: document.getElementById("profileRemovePhotoBtn"),
    userProfileForm: document.getElementById("userProfileForm"),
    profileNameInput: document.getElementById("profileNameInput"),
    profileEmailInput: document.getElementById("profileEmailInput"),
    profilePhoneInput: document.getElementById("profilePhoneInput"),
    profilePhoneError: document.getElementById("profilePhoneError"),
    profilePhoneValid: document.getElementById("profilePhoneValid"),
    profilePhoneHint: document.getElementById("profilePhoneHint"),
    profileDesignationSelect: document.getElementById("profileDesignationSelect"),
    saveProfileBtn: document.getElementById("saveProfileBtn"),
    resetProfileFormBtn: document.getElementById("resetProfileFormBtn"),
    previewAccessBadge: document.getElementById("previewAccessBadge"),
    previewCardAvatar: document.getElementById("previewCardAvatar"),
    previewCardInitials: document.getElementById("previewCardInitials"),
    previewCardImg: document.getElementById("previewCardImg"),
    previewCardName: document.getElementById("previewCardName"),
    previewCardDesignationBadge: document.getElementById("previewCardDesignationBadge"),
    previewCardEmail: document.getElementById("previewCardEmail"),
    previewCardPhone: document.getElementById("previewCardPhone"),
    userProfileToggle: document.getElementById("userProfileToggle")
  };

  // Safe Event Listener Helper
  function on(el, event, handler) {
    if (el) el.addEventListener(event, handler);
  }

  // =========================================================================
  // SUPABASE UI HELPERS & LISTENERS
  // =========================================================================
  function updateSupabaseStatusUI() {
    if (typeof SupabaseManager === "undefined") return;

    const config = SupabaseManager.getConfig();
    if (DOM.supabaseUrlInput) DOM.supabaseUrlInput.value = config.url || "";
    if (DOM.supabaseKeyInput) DOM.supabaseKeyInput.value = config.anonKey || "";

    if (SupabaseManager.isConnected) {
      if (DOM.supabaseConnectionBadge) {
        DOM.supabaseConnectionBadge.className = "badge badge-passed";
        DOM.supabaseConnectionBadge.innerHTML = `<i class="fa-solid fa-circle text-emerald" style="font-size:6px;"></i> Supabase Connected`;
      }
      if (DOM.syncTextLabel) DOM.syncTextLabel.textContent = "Supabase Realtime Live";
      if (DOM.syncDotIndicator) DOM.syncDotIndicator.style.background = "var(--emerald)";
    } else {
      if (DOM.supabaseConnectionBadge) {
        DOM.supabaseConnectionBadge.className = "badge badge-untested";
        DOM.supabaseConnectionBadge.innerHTML = `<i class="fa-solid fa-circle" style="font-size:6px;"></i> LocalStorage Mode`;
      }
      if (DOM.syncTextLabel) DOM.syncTextLabel.textContent = "Cross-Tab Broadcast Active";
      if (DOM.syncDotIndicator) DOM.syncDotIndicator.style.background = "var(--cyan)";
    }
  }

  on(DOM.saveSupabaseConfigBtn, "click", async () => {
    const url = DOM.supabaseUrlInput.value.trim();
    const key = DOM.supabaseKeyInput.value.trim();

    if (!url || !key) {
      showToast("Please provide both Supabase URL and anon public key", "error");
      return;
    }

    DOM.saveSupabaseConfigBtn.disabled = true;
    DOM.saveSupabaseConfigBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Connecting...`;

    const success = await SupabaseManager.saveConfig(url, key, true);
    DOM.saveSupabaseConfigBtn.disabled = false;
    DOM.saveSupabaseConfigBtn.innerHTML = `<i class="fa-solid fa-plug"></i> Connect & Sync`;

    if (success) {
      updateSupabaseStatusUI();
      showToast("Connected to Supabase PostgreSQL in Real-time!");
      await SupabaseManager.fetchAllFromSupabase();
      renderActiveView();
    } else {
      showToast("Connection failed. Please verify credentials and tables in Supabase.", "error");
      updateSupabaseStatusUI();
    }
  });

  on(DOM.pushDataToSupabaseBtn, "click", async () => {
    if (!SupabaseManager.isConnected) {
      showToast("Please connect to Supabase first", "error");
      return;
    }
    DOM.pushDataToSupabaseBtn.disabled = true;
    DOM.pushDataToSupabaseBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Uploading...`;

    const ok = await SupabaseManager.pushAllLocalToSupabase();
    DOM.pushDataToSupabaseBtn.disabled = false;
    DOM.pushDataToSupabaseBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Upload Data`;

    if (ok) {
      showToast("Uploaded all test suites, cases, defects, and runs to Supabase!");
    } else {
      showToast("Failed to upload data to Supabase", "error");
    }
  });

  on(DOM.copySqlSchemaBtn, "click", () => {
    const sqlSchema = `-- Run in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS nexus_suites (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, icon TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS nexus_test_cases (id TEXT PRIMARY KEY, title TEXT NOT NULL, suite_id TEXT, priority TEXT, type TEXT, status TEXT, author TEXT, last_run TEXT, preconditions TEXT, tags JSONB, steps JSONB, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS nexus_defects (id TEXT PRIMARY KEY, summary TEXT NOT NULL, linked_test_case_id TEXT, severity TEXT, priority TEXT, assignee TEXT, reported_by TEXT, status TEXT, description TEXT, dev_notes TEXT, pr_link TEXT, git_branch TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
ALTER PUBLICATION supabase_realtime ADD TABLE nexus_suites, nexus_test_cases, nexus_defects;
ALTER TABLE nexus_suites ENABLE ROW LEVEL SECURITY; ALTER TABLE nexus_test_cases ENABLE ROW LEVEL SECURITY; ALTER TABLE nexus_defects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anon all" ON nexus_suites FOR ALL USING (true); CREATE POLICY "Anon all" ON nexus_test_cases FOR ALL USING (true); CREATE POLICY "Anon all" ON nexus_defects FOR ALL USING (true);`;
    
    navigator.clipboard.writeText(sqlSchema).then(() => {
      showToast("Copied Supabase SQL Schema to clipboard! Paste in Supabase SQL Editor.");
    });
  });

  // =========================================================================
  // USER PROFILE & ACCOUNT MANAGEMENT
  // =========================================================================
  state.tempProfilePhoto = "";

  function renderProfilePhotoPreview(photoUrl) {
    if (photoUrl) {
      if (DOM.profileLargeImg) {
        DOM.profileLargeImg.src = photoUrl;
        DOM.profileLargeImg.style.display = "block";
      }
      if (DOM.profileLargeInitials) DOM.profileLargeInitials.style.display = "none";
      if (DOM.previewCardImg) {
        DOM.previewCardImg.src = photoUrl;
        DOM.previewCardImg.style.display = "block";
      }
      if (DOM.previewCardInitials) DOM.previewCardInitials.style.display = "none";
      if (DOM.profileFormAvatarPreview) {
        DOM.profileFormAvatarPreview.style.backgroundImage = `url("${photoUrl}")`;
      }
      if (DOM.profileFormAvatarInitials) DOM.profileFormAvatarInitials.style.display = "none";
      if (DOM.profileRemovePhotoBtn) DOM.profileRemovePhotoBtn.style.display = "inline-flex";
      if (DOM.profileRemovePhotoWrap) DOM.profileRemovePhotoWrap.style.display = "inline-flex";
    } else {
      if (DOM.profileLargeImg) DOM.profileLargeImg.style.display = "none";
      if (DOM.profileLargeInitials) DOM.profileLargeInitials.style.display = "inline";
      if (DOM.previewCardImg) DOM.previewCardImg.style.display = "none";
      if (DOM.previewCardInitials) DOM.previewCardInitials.style.display = "inline";
      if (DOM.profileFormAvatarPreview) {
        DOM.profileFormAvatarPreview.style.backgroundImage = "";
      }
      if (DOM.profileFormAvatarInitials) DOM.profileFormAvatarInitials.style.display = "inline";
      if (DOM.profileRemovePhotoBtn) DOM.profileRemovePhotoBtn.style.display = "none";
      if (DOM.profileRemovePhotoWrap) DOM.profileRemovePhotoWrap.style.display = "none";
    }
  }

  function validateProfilePhone() {
    if (!DOM.profilePhoneInput) return false;
    const val = DOM.profilePhoneInput.value.trim();
    if (val.length === 0) {
      if (DOM.profilePhoneError) DOM.profilePhoneError.style.display = "none";
      if (DOM.profilePhoneValid) DOM.profilePhoneValid.style.display = "none";
      if (DOM.profilePhoneHint) DOM.profilePhoneHint.style.display = "inline";
      DOM.profilePhoneInput.style.borderColor = "var(--border-color)";
      return false;
    }
    if (/^\d{10}$/.test(val)) {
      if (DOM.profilePhoneError) DOM.profilePhoneError.style.display = "none";
      if (DOM.profilePhoneValid) DOM.profilePhoneValid.style.display = "inline";
      if (DOM.profilePhoneHint) DOM.profilePhoneHint.style.display = "none";
      DOM.profilePhoneInput.style.borderColor = "var(--emerald)";
      return true;
    } else {
      if (DOM.profilePhoneError) DOM.profilePhoneError.style.display = "inline";
      if (DOM.profilePhoneValid) DOM.profilePhoneValid.style.display = "none";
      if (DOM.profilePhoneHint) DOM.profilePhoneHint.style.display = "none";
      DOM.profilePhoneInput.style.borderColor = "var(--rose)";
      return false;
    }
  }

  function updateProfilePreviewBadge() {
    const name = DOM.profileNameInput ? DOM.profileNameInput.value.trim() || "User Name" : "User Name";
    const email = DOM.profileEmailInput ? DOM.profileEmailInput.value.trim() || "user@nexusqa.io" : "user@nexusqa.io";
    const phone = DOM.profilePhoneInput ? DOM.profilePhoneInput.value.trim() || "9876543210" : "9876543210";
    const designation = DOM.profileDesignationSelect ? DOM.profileDesignationSelect.value : "Senior Developer";
    const user = state.currentUser || {};

    if (DOM.profileFormHeaderName) DOM.profileFormHeaderName.textContent = name;
    if (DOM.previewCardName) DOM.previewCardName.textContent = name;
    if (DOM.previewCardEmail) DOM.previewCardEmail.textContent = email;
    if (DOM.previewCardPhone) DOM.previewCardPhone.textContent = phone;
    if (DOM.previewCardUserId) DOM.previewCardUserId.textContent = user.id || "user-current";

    // Designation badge styling
    if (DOM.previewCardDesignationBadge) {
      DOM.previewCardDesignationBadge.textContent = designation;
      if (designation === "Senior Developer") {
        DOM.previewCardDesignationBadge.className = "badge badge-passed";
      } else if (designation === "Junior Developer") {
        DOM.previewCardDesignationBadge.className = "badge badge-ai";
      } else if (designation === "Senior Tester") {
        DOM.previewCardDesignationBadge.className = "badge badge-version";
      } else {
        DOM.previewCardDesignationBadge.className = "badge badge-untested";
      }
    }

    // Initials
    const parts = name.trim().split(/\s+/);
    const initials = parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
    if (DOM.profileLargeInitials) DOM.profileLargeInitials.textContent = initials;
    if (DOM.profileFormAvatarInitials) DOM.profileFormAvatarInitials.textContent = initials;
    if (DOM.previewCardInitials) DOM.previewCardInitials.textContent = initials;
  }

  function populateProfileForm() {
    const user = state.currentUser;
    if (!user) return;

    state.tempProfilePhoto = user.photo || "";

    if (DOM.profileNameInput) DOM.profileNameInput.value = user.name || "";
    if (DOM.profileEmailInput) DOM.profileEmailInput.value = user.email || "";
    if (DOM.profilePhoneInput) DOM.profilePhoneInput.value = user.phone || "9876543210";

    if (DOM.profileDesignationSelect) {
      const desig = user.roleTitle || "";
      if (["Senior Developer", "Junior Developer", "Senior Tester", "Junior Tester"].includes(desig)) {
        DOM.profileDesignationSelect.value = desig;
      } else {
        const isDev = user.role === "dev";
        const isSenior = isDev 
          ? StorageManager.isSeniorDev(user) 
          : (desig.toLowerCase().includes("lead") || desig.toLowerCase().includes("senior"));
        if (isDev) {
          DOM.profileDesignationSelect.value = isSenior ? "Senior Developer" : "Junior Developer";
        } else {
          DOM.profileDesignationSelect.value = isSenior ? "Senior Tester" : "Junior Tester";
        }
      }
    }

    renderProfilePhotoPreview(user.photo || "");
    updateProfilePreviewBadge();
    validateProfilePhone();
  }

  // Live input formatting and preview listeners
  if (DOM.profilePhoneInput) {
    DOM.profilePhoneInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
      validateProfilePhone();
      updateProfilePreviewBadge();
    });
  }

  if (DOM.profileNameInput) {
    DOM.profileNameInput.addEventListener("input", () => {
      updateProfilePreviewBadge();
    });
  }

  if (DOM.profileEmailInput) {
    DOM.profileEmailInput.addEventListener("input", () => {
      updateProfilePreviewBadge();
    });
  }

  if (DOM.profileDesignationSelect) {
    DOM.profileDesignationSelect.addEventListener("change", () => {
      updateProfilePreviewBadge();
    });
  }

  // Photo Upload Handler
  if (DOM.profilePhotoInput) {
    DOM.profilePhotoInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        showToast("Image size exceeds 2MB limit. Please upload a smaller photo.", "error");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result;
        state.tempProfilePhoto = base64Data;
        renderProfilePhotoPreview(base64Data);
        showToast("Photo loaded into preview. Click 'Save Profile' to commit.", "info");
      };
      reader.readAsDataURL(file);
    });
  }

  on(DOM.profileRemovePhotoBtn, "click", () => {
    state.tempProfilePhoto = "";
    if (DOM.profilePhotoInput) DOM.profilePhotoInput.value = "";
    renderProfilePhotoPreview("");
    showToast("Photo removed from preview. Click 'Save Profile' to commit.", "info");
  });

  on(DOM.resetProfileFormBtn, "click", () => {
    populateProfileForm();
    showToast("Profile form reset.", "info");
  });

  // Topbar user profile click opens profile view
  if (DOM.userProfileToggle) {
    DOM.userProfileToggle.style.cursor = "pointer";
    on(DOM.userProfileToggle, "click", (e) => {
      if (e.target.closest("#logoutBtn") || e.target.closest("#switchUserQuickBtn")) return;
      switchView("settings");
    });
  }

  // Save Profile Handler with strict 10-digit validation
  on(DOM.saveProfileBtn, "click", () => {
    const user = state.currentUser;
    if (!user) {
      showToast("No active user logged in", "error");
      return;
    }

    const name = DOM.profileNameInput ? DOM.profileNameInput.value.trim() : "";
    const email = DOM.profileEmailInput ? DOM.profileEmailInput.value.trim() : "";
    const phone = DOM.profilePhoneInput ? DOM.profilePhoneInput.value.trim() : "";
    const designation = DOM.profileDesignationSelect ? DOM.profileDesignationSelect.value : "Senior Developer";

    if (!name) {
      showToast("Please enter your full name.", "error");
      if (DOM.profileNameInput) DOM.profileNameInput.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      showToast("Please enter a valid email address.", "error");
      if (DOM.profileEmailInput) DOM.profileEmailInput.focus();
      return;
    }

    // Phone number validation: exactly 10 digits
    const phoneClean = phone.replace(/\D/g, "");
    if (!/^\d{10}$/.test(phoneClean)) {
      showToast("Phone number must contain exactly 10 numbers.", "error");
      if (DOM.profilePhoneInput) {
        DOM.profilePhoneInput.focus();
        DOM.profilePhoneInput.style.borderColor = "var(--rose)";
      }
      return;
    }

    const isDev = designation.includes("Developer");
    const isSenior = designation.includes("Senior");
    const role = isDev ? "dev" : "qa";
    const devLevel = isSenior ? "senior" : "junior";

    const updated = StorageManager.updateUser(user.id, {
      name,
      email,
      phone: phoneClean,
      photo: state.tempProfilePhoto !== undefined ? state.tempProfilePhoto : (user.photo || ""),
      role,
      devLevel,
      roleTitle: designation
    });

    if (updated) {
      state.currentUser = updated;
      StorageManager.setCurrentUser(updated);
      updateUserProfileUI();
      populateProfileForm();
      showToast("Profile details updated successfully!", "success");

      if (typeof renderDevApprovals === "function") {
        renderDevApprovals();
      }
    }
  });

  // =========================================================================
  // KPI Card Proximity Mouse Hover & Magnetic Movement
  // =========================================================================
  function initKpiCardMagneticHover() {
    let mouseX = -9999;
    let mouseY = -9999;
    let isTracking = false;
    let rafId = null;

    // Distance in pixels from card boundary where movement begins
    const PROXIMITY_THRESHOLD = 90;

    function updateCards() {
      rafId = null;
      const cards = document.querySelectorAll(".kpi-card");
      if (!cards.length) return;

      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        
        // Skip hidden or off-screen elements
        if (rect.width === 0 || rect.height === 0 || rect.bottom < -50 || rect.top > window.innerHeight + 50) {
          return;
        }

        // Find nearest point on the card rect to cursor
        const nearestX = Math.max(rect.left, Math.min(mouseX, rect.right));
        const nearestY = Math.max(rect.top, Math.min(mouseY, rect.bottom));
        const distFromEdge = Math.hypot(mouseX - nearestX, mouseY - nearestY);

        if (distFromEdge < PROXIMITY_THRESHOLD) {
          // Proximity factor (1 inside card, decaying smoothly to 0 at edge + threshold)
          const proximity = Math.pow(1 - (distFromEdge / PROXIMITY_THRESHOLD), 1.25);
          
          // Normalized offset from card center (-1 to 1)
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const normX = Math.max(-1.5, Math.min(1.5, (mouseX - centerX) / (rect.width / 2)));
          const normY = Math.max(-1.5, Math.min(1.5, (mouseY - centerY) / (rect.height / 2)));

          // Subtle tilt and magnetic float
          const rotateX = (-normY * 6 * proximity).toFixed(2);
          const rotateY = (normX * 6 * proximity).toFixed(2);
          const transX = (normX * 5.5 * proximity).toFixed(2);
          const transY = (normY * 5.5 * proximity).toFixed(2);
          const transZ = (10 * proximity).toFixed(1);

          card.classList.add("is-near");
          card.style.transform = `perspective(850px) translate3d(${transX}px, ${transY}px, ${transZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
          
          // Radial spotlight reflection coordinates
          card.style.setProperty("--mouse-x", `${(mouseX - rect.left).toFixed(1)}px`);
          card.style.setProperty("--mouse-y", `${(mouseY - rect.top).toFixed(1)}px`);
        } else {
          if (card.classList.contains("is-near")) {
            card.classList.remove("is-near");
            card.style.transform = "";
          }
        }
      });
    }

    function onPointerMove(e) {
      if (e.pointerType === "touch") return; // Touch devices have standard tap/scroll
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isTracking) isTracking = true;
      if (!rafId) {
        rafId = requestAnimationFrame(updateCards);
      }
    }

    function resetAllCards() {
      mouseX = -9999;
      mouseY = -9999;
      isTracking = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      const cards = document.querySelectorAll(".kpi-card");
      cards.forEach(card => {
        card.classList.remove("is-near");
        card.style.transform = "";
      });
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", resetAllCards, { passive: true });
    window.addEventListener("blur", resetAllCards);
  }

  // =========================================================================
  function applyTheme(theme) {
    const isDark = theme === "dark";
    if (isDark) {
      document.body.classList.remove("light-theme");
      document.body.classList.add("dark-theme");
      if (DOM.themeSwitchCheckbox) DOM.themeSwitchCheckbox.checked = true;
      if (DOM.themeToggleBtn && DOM.themeToggleBtn.querySelector("i")) {
        DOM.themeToggleBtn.querySelector("i").className = "fa-solid fa-moon";
      }
    } else {
      document.body.classList.add("light-theme");
      document.body.classList.remove("dark-theme");
      if (DOM.themeSwitchCheckbox) DOM.themeSwitchCheckbox.checked = false;
      if (DOM.themeToggleBtn && DOM.themeToggleBtn.querySelector("i")) {
        DOM.themeToggleBtn.querySelector("i").className = "fa-solid fa-sun";
      }
    }
    localStorage.setItem("nexusqa_theme", isDark ? "dark" : "light");

    // Persist to user profile in database
    const currentUser = StorageManager.getCurrentUser();
    if (currentUser && currentUser.id) {
      currentUser.theme = isDark ? "dark" : "light";
      StorageManager.updateUser(currentUser.id, { theme: isDark ? "dark" : "light" });
    }
  }

  function initTheme() {
    let theme = "light"; // Default bright light theme
    const currentUser = StorageManager.getCurrentUser();
    if (currentUser && currentUser.theme) {
      theme = currentUser.theme;
    } else {
      theme = localStorage.getItem("nexusqa_theme") || "light";
    }

    if (theme === "dark") {
      document.body.classList.remove("light-theme");
      document.body.classList.add("dark-theme");
      if (DOM.themeSwitchCheckbox) DOM.themeSwitchCheckbox.checked = true;
      if (DOM.themeToggleBtn && DOM.themeToggleBtn.querySelector("i")) {
        DOM.themeToggleBtn.querySelector("i").className = "fa-solid fa-moon";
      }
    } else {
      document.body.classList.add("light-theme");
      document.body.classList.remove("dark-theme");
      if (DOM.themeSwitchCheckbox) DOM.themeSwitchCheckbox.checked = false;
      if (DOM.themeToggleBtn && DOM.themeToggleBtn.querySelector("i")) {
        DOM.themeToggleBtn.querySelector("i").className = "fa-solid fa-sun";
      }
    }
    localStorage.setItem("nexusqa_theme", theme);
  }

  function initSidebarState() {
    const isCollapsed = localStorage.getItem("nexusqa_sidebar_collapsed") === "true";
    if (DOM.sidebar && isCollapsed) {
      DOM.sidebar.classList.add("collapsed");
      document.body.classList.add("sidebar-collapsed");
    }
    const checkInput = document.getElementById("sidebar-label-check");
    if (checkInput) checkInput.checked = !isCollapsed;
  }

  function initRouting() {
    initTheme();
    initSidebarState();
    initKpiCardMagneticHover();
    const pathname = window.location.pathname.toLowerCase();
    const isLandingPage = document.body.classList.contains("page-landing-auth") || pathname.endsWith("index.html") || pathname === "/" || pathname.endsWith("/login") || (!document.body.classList.contains("page-tester") && !document.body.classList.contains("page-dev") && !document.getElementById("viewViewport"));

    setupOtpInputs();
    setupAuthListeners();

    if (isLandingPage) {
      // Check if redirected due to auth or role mismatch
      var authErr = sessionStorage.getItem("nexus_auth_error");
      if (authErr) {
        sessionStorage.removeItem("nexus_auth_error");
        setTimeout(() => {
          showToast(authErr, "error");
          if (typeof window.showAuthAlert === "function") window.showAuthAlert(authErr);
        }, 150);
      }
      // Main Landing & Login Gateway (index.html)
      window.switchAuthTab("tester");
      return;
    }

    const currentUser = StorageManager.getCurrentUser();
    if (!currentUser) {
      // Unauthenticated access attempt -> redirect to login gateway
      window.location.replace("index.html");
      return;
    }

    if (currentUser.status === "pending_approval") {
      StorageManager.logout();
      sessionStorage.setItem("nexus_auth_error", "Access Denied: Your account is awaiting approval from Administrator (Chhotu Monster). Please wait for authorization.");
      window.location.replace("index.html");
      return;
    }

    if (currentUser.status === "rejected") {
      StorageManager.logout();
      sessionStorage.setItem("nexus_auth_error", "Access Denied: Your workspace access request was rejected.");
      window.location.replace("index.html");
      return;
    }

    if (document.body.classList.contains("page-dev") || pathname.includes("/dev")) {
      // Developer Portal: requires developer role
      if (currentUser.role !== "dev") {
        StorageManager.logout();
        sessionStorage.setItem("nexus_auth_error", "Access Denied: Developer account required. Please authenticate with a Developer account.");
        window.location.replace("index.html");
        return;
      }
      setPortal("dev", "dev-dashboard");
    } else if (document.body.classList.contains("page-tester") || pathname.includes("/tester") || pathname.includes("/qa")) {
      // Tester Portal: requires QA tester role
      if (currentUser.role === "dev" || (currentUser.role !== "qa" && currentUser.role !== "tester")) {
        StorageManager.logout();
        sessionStorage.setItem("nexus_auth_error", "Access Denied: QA Tester account required. Please authenticate with a QA Tester account.");
        window.location.replace("index.html");
        return;
      }
      if (window.__pendingAuthNotice) {
        showToast(window.__pendingAuthNotice, "error");
        try { delete window.__pendingAuthNotice; } catch (e) {}
      }
      setPortal("qa", "dashboard");
    } else {
      setPortal(currentUser.role === "dev" ? "dev" : "qa", currentUser.role === "dev" ? "dev-dashboard" : "dashboard");
    }
  }

  function setPortal(role, defaultView = null) {
    state.currentPortal = role;
    state.currentUser = StorageManager.getCurrentUser();
    if (!state.currentUser) {
      window.location.replace("index.html");
      return;
    }
    if (DOM.authGateOverlay) DOM.authGateOverlay.style.display = "none";

    if (role === "dev") {
      if (DOM.pillDevPortalBtn) DOM.pillDevPortalBtn.classList.add("active");
      if (DOM.pillQaPortalBtn) DOM.pillQaPortalBtn.classList.remove("active");
      if (DOM.qaNavSection) DOM.qaNavSection.style.display = "none";
      if (DOM.devNavSection) DOM.devNavSection.style.display = "block";
      if (DOM.portalRoleBadge) {
        DOM.portalRoleBadge.textContent = "Dev Portal";
        DOM.portalRoleBadge.className = "badge badge-version badge-dev";
      }
      if (DOM.portalCrumbRoot) DOM.portalCrumbRoot.textContent = "NexusQA Developer";
      if (DOM.createQuickBtnLabel) DOM.createQuickBtnLabel.textContent = "New Bug Ticket";
      if (DOM.quickRunBtn) DOM.quickRunBtn.style.display = "none";
      updateDevApprovalsBadge();
      switchView(defaultView || "dev-dashboard");
    } else {
      if (DOM.pillQaPortalBtn) DOM.pillQaPortalBtn.classList.add("active");
      if (DOM.pillDevPortalBtn) DOM.pillDevPortalBtn.classList.remove("active");
      if (DOM.devNavSection) DOM.devNavSection.style.display = "none";
      if (DOM.qaNavSection) DOM.qaNavSection.style.display = "block";
      if (DOM.portalRoleBadge) {
        DOM.portalRoleBadge.textContent = "QA Portal";
        DOM.portalRoleBadge.className = "badge badge-version";
      }
      if (DOM.portalCrumbRoot) DOM.portalCrumbRoot.textContent = "NexusQA Tester";
      if (DOM.createQuickBtnLabel) DOM.createQuickBtnLabel.textContent = "New Test Case";
      if (DOM.quickRunBtn) DOM.quickRunBtn.style.display = "inline-flex";
      switchView(defaultView || "dashboard");
    }

    updateUserProfileUI();
  }

  function updateUserProfileUI() {
    const user = state.currentUser;
    if (!user) return;

    if (user.photo) {
      if (DOM.userAvatarRing) {
        DOM.userAvatarRing.style.backgroundImage = `url("${user.photo}")`;
        DOM.userAvatarRing.style.backgroundSize = "cover";
        DOM.userAvatarRing.style.backgroundPosition = "center";
      }
      if (DOM.userAvatarInitials) DOM.userAvatarInitials.textContent = "";
    } else {
      if (DOM.userAvatarRing) {
        DOM.userAvatarRing.style.backgroundImage = "";
        DOM.userAvatarRing.style.background = user.color || (user.role === 'dev' ? '#10b981' : '#6366f1');
      }
      if (DOM.userAvatarInitials) DOM.userAvatarInitials.textContent = user.avatar || user.name.substring(0, 2).toUpperCase();
    }

    if (DOM.userNameLabel) DOM.userNameLabel.textContent = user.name;
    if (DOM.userRoleLabel) DOM.userRoleLabel.innerHTML = `<i class="fa-solid fa-circle status-dot-online"></i> ${user.roleTitle || user.role.toUpperCase()}`;
  }

  // --- React Bits Pro Auth 5 State & Controllers ---
  state.auth5Role = "tester"; // 'tester' | 'dev'
  state.auth5Mode = "login";  // 'login' | 'signup'
  state.resendCooldownInterval = null;

  window.showAuthAlert = function(message) {
    const alertEl = DOM.authInlineAlert || document.getElementById("authInlineAlert");
    const textEl = DOM.authInlineAlertText || document.getElementById("authInlineAlertText");
    if (alertEl && textEl) {
      textEl.textContent = message;
      alertEl.style.display = "flex";
      alertEl.classList.remove("authAlertShake");
      void alertEl.offsetWidth; // trigger reflow for animation restart
      alertEl.classList.add("authAlertShake");
    }
  };

  window.hideAuthAlert = function() {
    const alertEl = DOM.authInlineAlert || document.getElementById("authInlineAlert");
    if (alertEl) alertEl.style.display = "none";
  };

  window.togglePasswordVisibility = function(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    const icon = btn.querySelector("i");
    if (icon) {
      icon.className = isPassword ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
    }
  };

  window.switchAuthMode = function(mode) {
    window.hideAuthAlert();
    state.auth5Mode = mode;
    const title = DOM.auth5Title || document.getElementById("auth5Title");
    const subtitle = DOM.auth5Subtitle || document.getElementById("auth5Subtitle");
    const loginForm = DOM.testerLoginForm || document.getElementById("testerLoginForm");
    const signupForm = DOM.testerSignupForm || document.getElementById("testerSignupForm");

    if (mode === "signup") {
      if (loginForm) loginForm.style.display = "none";
      if (signupForm) signupForm.style.display = "block";
      if (title) title.textContent = "Create Workspace Account";
      if (subtitle) subtitle.textContent = "Enter your details to receive a 6-digit verification passcode";
    } else {
      if (signupForm) signupForm.style.display = "none";
      if (loginForm) loginForm.style.display = "block";
      if (title) title.textContent = "Welcome to NexusQA";
      if (subtitle) subtitle.textContent = "Enter your username/email to continue with your 6-digit passcode";
    }
  };

  // Backwards-compatible alias
  window.switchTesterAuthMode = window.switchAuthMode;
  window.setAuth5Role = function() {}; // No-op

  window.backToAuthForm = function() {
    const formState = DOM.auth5StateForm || document.getElementById("auth5StateForm");
    const inboxState = DOM.auth5InboxState || document.getElementById("auth5InboxState");
    const pendingState = DOM.testerPendingApprovalView || document.getElementById("testerPendingApprovalView");

    if (formState) formState.style.display = "block";
    if (inboxState) inboxState.style.display = "none";
    if (pendingState) pendingState.style.display = "none";

    window.switchAuthMode(state.auth5Mode || "login");
  };

  window.showInboxState = function(email, otpCode) {
    const formState = DOM.auth5StateForm || document.getElementById("auth5StateForm");
    const inboxState = DOM.auth5InboxState || document.getElementById("auth5InboxState");
    const pendingState = DOM.testerPendingApprovalView || document.getElementById("testerPendingApprovalView");
    const roleSwitch = DOM.auth5RoleSwitch || document.getElementById("auth5RoleSwitch");

    if (formState) formState.style.display = "none";
    if (inboxState) inboxState.style.display = "block";
    if (pendingState) pendingState.style.display = "none";
    if (roleSwitch) roleSwitch.style.display = "none";

    if (DOM.otpRecipientEmailLabel) DOM.otpRecipientEmailLabel.textContent = email;
    const badgeEl = document.getElementById("simulatedOtpCodeBadge");
    if (badgeEl) badgeEl.textContent = otpCode;
    state.currentOtpCode = otpCode;

    if (window.resetCodeSlots) window.resetCodeSlots();
    setTimeout(() => {
      if (DOM.codeSlotsInput) DOM.codeSlotsInput.focus();
    }, 60);

    startResendCooldown(60);
    startOtpTimer(900);
    showToast(`Verification code sent to ${email}: [ ${otpCode} ]`, "info");
  };

  window.showPendingState = function(email) {
    const formState = DOM.auth5StateForm || document.getElementById("auth5StateForm");
    const inboxState = DOM.auth5InboxState || document.getElementById("auth5InboxState");
    const pendingState = DOM.testerPendingApprovalView || document.getElementById("testerPendingApprovalView");
    const roleSwitch = DOM.auth5RoleSwitch || document.getElementById("auth5RoleSwitch");

    if (formState) formState.style.display = "none";
    if (inboxState) inboxState.style.display = "none";
    if (pendingState) pendingState.style.display = "block";
    if (roleSwitch) roleSwitch.style.display = "none";

    if (DOM.pendingUserEmailLabel) DOM.pendingUserEmailLabel.textContent = email;
  };

  window.handleOAuthSignIn = function(provider) {
    const providerName = provider === "github" ? "GitHub Enterprise" : "Google Workspace";
    showToast(`Connecting to ${providerName} SSO...`, "info");

    setTimeout(() => {
      if (state.auth5Role === "dev") {
        const { user } = StorageManager.directLogin("dev@nexusqa.io");
        showToast(`Authenticated via ${providerName} as Developer Lead: ${user.name}!`);
        setTimeout(() => { window.location.href = "dev.html"; }, 400);
      } else {
        const { user } = StorageManager.directLogin("a@a");
        showToast(`Authenticated via ${providerName} as QA Tester: ${user.name}!`);
        setTimeout(() => { window.location.href = "tester.html"; }, 400);
      }
    }, 450);
  };

  window.quickDemoLogin = function(role) {
    const email = role === "dev" ? "dev@nexusqa.io" : "a@a";
    const emailInput = DOM.testerLoginEmail || document.getElementById("testerLoginEmail");
    if (emailInput) emailInput.value = email;
    
    const submitBtn = DOM.btnTesterLoginSubmit || document.getElementById("btnTesterLoginSubmit");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Entering Workspace...</span>`;
    }

    try {
      const { user } = StorageManager.directLogin(email);
      showToast(`Welcome back, ${user.name}! Accessing ${user.role === 'dev' ? 'Dev Hub' : 'QA Portal'}...`, "success");
      setTimeout(() => {
        window.location.href = user.role === "dev" ? "dev.html" : "tester.html";
      }, 350);
    } catch (err) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Sign In to Workspace</span> <i class="fa-solid fa-arrow-right"></i>`;
      }
      showToast(err.message, "error");
    }
  };

  function startResendCooldown(durationSeconds = 60) {
    if (state.resendCooldownInterval) clearInterval(state.resendCooldownInterval);
    let seconds = durationSeconds;
    const btnResend = DOM.btnResendOtp || document.getElementById("btnResendOtp");
    const countdownEl = DOM.auth5ResendCountdown || document.getElementById("auth5ResendCountdown");

    if (btnResend) {
      btnResend.disabled = true;
    }

    function updateCooldown() {
      if (countdownEl) countdownEl.textContent = `${seconds}s`;
      if (seconds <= 0) {
        clearInterval(state.resendCooldownInterval);
        if (btnResend) {
          btnResend.disabled = false;
          btnResend.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Resend code now`;
        }
      }
      seconds--;
    }

    updateCooldown();
    state.resendCooldownInterval = setInterval(updateCooldown, 1000);
  }

  // Backward compatibility alias methods
  window.switchAuthTab = function(tab) {
    window.setAuth5Role(tab);
  };

  window.switchTesterAuthView = function(view) {
    if (view === "login") window.switchTesterAuthMode("login");
    else if (view === "signup") window.switchTesterAuthMode("signup");
    else if (view === "otp") window.showInboxState(state.pendingRegistrationEmail || "tester@company.com", state.currentOtpCode);
    else if (view === "pending") window.showPendingState(state.pendingRegistrationEmail || "tester@company.com");
  };

  // --- Real Email Client Handlers (Simulated UI popover disabled) ---
  window.showSimulatedEmail = function() {};
  window.dismissSimulatedEmail = function() {};

  // --- React Bits <CodeSlots /> State & Controller ---
  const codeSlotsState = {
    length: 6,
    value: "",
    active: 0,
    focused: false,
    status: "idle", // "idle" | "error" | "success"
    slotSize: 48,
    gap: 10,
    pitch: 58
  };

  function renderCodeSlots() {
    const row = DOM.codeSlotsRow;
    const input = DOM.codeSlotsInput;
    const caret = DOM.codeSlotsCaret;
    const srCount = DOM.codeSlotsSrCount;
    if (!row) return;

    const digits = codeSlotsState.value.split("");
    const slots = row.querySelectorAll(".code-slots__slot");

    slots.forEach((slot, idx) => {
      const digitEl = slot.querySelector(".code-slots__digit");
      const char = digits[idx] || "";
      
      if (char) {
        slot.setAttribute("data-filled", "");
        if (digitEl) digitEl.textContent = char;
      } else {
        slot.removeAttribute("data-filled");
        if (digitEl) digitEl.textContent = "";
      }

      if (codeSlotsState.focused && idx === codeSlotsState.active && codeSlotsState.status !== "success") {
        slot.setAttribute("data-active", "");
      } else {
        slot.removeAttribute("data-active");
      }
    });

    // Blinking Caret positioning
    if (caret) {
      const showCaret = codeSlotsState.focused && 
                        codeSlotsState.status !== "success" && 
                        codeSlotsState.status !== "error" && 
                        !digits[codeSlotsState.active];
      if (showCaret) {
        caret.setAttribute("data-show", "");
        const x = codeSlotsState.active * codeSlotsState.pitch + (codeSlotsState.slotSize / 2) - 1;
        caret.style.transform = `translateX(${x}px)`;
      } else {
        caret.removeAttribute("data-show");
      }
    }

    // Update row status
    row.setAttribute("data-status", codeSlotsState.status);
    if (codeSlotsState.focused) {
      row.setAttribute("data-focused", "");
    } else {
      row.removeAttribute("data-focused");
    }

    // Accessible screen reader announcement
    if (srCount) {
      srCount.textContent = codeSlotsState.status === "success" 
        ? "Code accepted" 
        : `${digits.length} of ${codeSlotsState.length} digits entered`;
    }
  }

  function setCodeSlotsValue(val, triggerComplete = true) {
    const clean = String(val ?? "").replace(/\D/g, "").slice(0, codeSlotsState.length);
    codeSlotsState.value = clean;
    codeSlotsState.active = Math.min(clean.length, codeSlotsState.length - 1);
    if (DOM.codeSlotsInput) DOM.codeSlotsInput.value = clean;
    renderCodeSlots();

    if (triggerComplete && clean.length === codeSlotsState.length) {
      // Auto-trigger OTP verification on complete
      if (DOM.testerOtpForm) {
        DOM.testerOtpForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }
    }
  }

  function setCodeSlotsStatus(newStatus) {
    codeSlotsState.status = newStatus;
    renderCodeSlots();

    if (newStatus === "error") {
      // Cascade drain digits backwards under danger tint
      setTimeout(() => {
        let currentVal = codeSlotsState.value;
        const drainTimer = setInterval(() => {
          if (currentVal.length > 0) {
            currentVal = currentVal.slice(0, -1);
            codeSlotsState.value = currentVal;
            codeSlotsState.active = Math.max(0, currentVal.length - 1);
            if (DOM.codeSlotsInput) DOM.codeSlotsInput.value = currentVal;
            renderCodeSlots();
          } else {
            clearInterval(drainTimer);
            codeSlotsState.status = "idle";
            codeSlotsState.active = 0;
            renderCodeSlots();
          }
        }, 55);
      }, 450);
    }
  }

  window.resetCodeSlots = function() {
    codeSlotsState.value = "";
    codeSlotsState.active = 0;
    codeSlotsState.status = "idle";
    codeSlotsState.focused = false;
    if (DOM.codeSlotsInput) DOM.codeSlotsInput.value = "";
    renderCodeSlots();
  };

  window.autoFillOtp = function(code) {
    const targetCode = String(code || state.currentOtpCode || "").replace(/\D/g, "").slice(0, 6);
    if (!targetCode) return;

    codeSlotsState.status = "idle";
    let cur = "";
    let i = 0;
    
    // Sequential cascade landing animation
    function cascadeFill() {
      if (i < targetCode.length) {
        cur += targetCode[i];
        codeSlotsState.value = cur;
        codeSlotsState.active = Math.min(cur.length, codeSlotsState.length - 1);
        if (DOM.codeSlotsInput) DOM.codeSlotsInput.value = cur;
        renderCodeSlots();
        i++;
        setTimeout(cascadeFill, 35);
      } else {
        if (DOM.codeSlotsInput) DOM.codeSlotsInput.focus();
        showToast("OTP Auto-filled from email with cascade!");
        // Trigger auto submit
        if (DOM.testerOtpForm) {
          DOM.testerOtpForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
        }
      }
    }
    cascadeFill();
  };

  if (DOM.btnAutoFillOtp) {
    DOM.btnAutoFillOtp.addEventListener("click", () => {
      window.autoFillOtp(state.currentOtpCode);
    });
  }

  // Setup React Bits <CodeSlots /> interactions
  function setupOtpInputs() {
    const row = DOM.codeSlotsRow;
    const input = DOM.codeSlotsInput;
    if (!row || !input) return;

    // Row Click / Touch -> focus input & set active slot
    row.addEventListener("mousedown", (e) => {
      if (codeSlotsState.status === "success") return;
      e.preventDefault();
      const rect = row.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickedIdx = Math.floor(clickX / codeSlotsState.pitch);
      const targetIdx = Math.max(0, Math.min(clickedIdx, codeSlotsState.value.length, codeSlotsState.length - 1));
      codeSlotsState.active = targetIdx;
      codeSlotsState.focused = true;
      input.focus();
      renderCodeSlots();
    });

    input.addEventListener("focus", () => {
      codeSlotsState.focused = true;
      renderCodeSlots();
    });

    input.addEventListener("blur", () => {
      codeSlotsState.focused = false;
      renderCodeSlots();
    });

    input.addEventListener("input", (e) => {
      if (codeSlotsState.status === "success") return;
      const raw = e.target.value;
      const digits = String(raw).replace(/\D/g, "").slice(0, codeSlotsState.length);
      codeSlotsState.status = "idle";
      setCodeSlotsValue(digits, true);
    });

    input.addEventListener("keydown", (e) => {
      if (codeSlotsState.status === "success") return;
      const k = e.key;

      if (k === "Backspace") {
        e.preventDefault();
        let cur = codeSlotsState.value;
        if (cur.length > 0) {
          cur = cur.slice(0, -1);
          setCodeSlotsValue(cur, false);
        }
      } else if (k === "ArrowLeft") {
        e.preventDefault();
        codeSlotsState.active = Math.max(0, codeSlotsState.active - 1);
        renderCodeSlots();
      } else if (k === "ArrowRight") {
        e.preventDefault();
        codeSlotsState.active = Math.min(codeSlotsState.length - 1, codeSlotsState.value.length);
        renderCodeSlots();
      } else if (k === "Home") {
        e.preventDefault();
        codeSlotsState.active = 0;
        renderCodeSlots();
      } else if (k === "End") {
        e.preventDefault();
        codeSlotsState.active = Math.min(codeSlotsState.length - 1, codeSlotsState.value.length);
        renderCodeSlots();
      }
    });

    input.addEventListener("paste", (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "").slice(0, 6);
      if (text) {
        window.autoFillOtp(text);
      }
    });
  }

  function startOtpTimer(durationSeconds = 900) {
    if (state.otpTimerInterval) clearInterval(state.otpTimerInterval);
    let secondsLeft = durationSeconds;

    function updateDisplay() {
      const mins = Math.floor(secondsLeft / 60);
      const secs = secondsLeft % 60;
      if (DOM.otpTimerLabel) {
        DOM.otpTimerLabel.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }
      if (secondsLeft <= 0) {
        clearInterval(state.otpTimerInterval);
        if (DOM.otpTimerLabel) DOM.otpTimerLabel.textContent = "Expired";
      }
      secondsLeft--;
    }

    updateDisplay();
    state.otpTimerInterval = setInterval(updateDisplay, 1000);
  }

  // Setup Auth Form Listeners
  function setupAuthListeners() {
    // 1. Unified Username / Email Sign In -> Direct Workspace Login
    if (DOM.testerLoginForm) {
      DOM.testerLoginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        window.hideAuthAlert();
        const identifier = (DOM.testerLoginEmail || document.getElementById("testerLoginEmail")).value.trim();

        if (!identifier) {
          window.showAuthAlert("Please enter your username or work email.");
          return;
        }

        const submitBtn = DOM.btnTesterLoginSubmit || document.getElementById("btnTesterLoginSubmit");
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Entering Workspace...</span>`;
        }

        try {
          const { user } = StorageManager.directLogin(identifier);
          showToast(`Welcome back, ${user.name}! Logging into workspace...`, "success");

          setTimeout(() => {
            if (user.role === "dev") {
              window.location.href = "dev.html";
            } else {
              window.location.href = "tester.html";
            }
          }, 350);
        } catch (err) {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span>Sign In to Workspace</span> <i class="fa-solid fa-arrow-right"></i>`;
          }
          window.showAuthAlert(err.message);
          showToast(err.message, "error");
        }
      });
    }

    // 2. Account Registration Form (Name, Email, Role) -> 6-Digit Squares Verification
    if (DOM.testerSignupForm) {
      DOM.testerSignupForm.addEventListener("submit", (e) => {
        e.preventDefault();
        window.hideAuthAlert();
        const name = (DOM.testerSignupName || document.getElementById("testerSignupName")).value.trim();
        const email = (DOM.testerSignupEmail || document.getElementById("testerSignupEmail")).value.trim();
        const roleTitle = (DOM.testerSignupRoleTitle || document.getElementById("testerSignupRoleTitle")).value;

        try {
          if (DOM.btnTesterSendOtp) {
            DOM.btnTesterSendOtp.disabled = true;
            DOM.btnTesterSendOtp.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generating 6-Digit Passcode...`;
          }

          setTimeout(() => {
            if (DOM.btnTesterSendOtp) {
              DOM.btnTesterSendOtp.disabled = false;
              DOM.btnTesterSendOtp.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Request Access & Send 6-Digit Passcode`;
            }

            const { user, otpCode } = StorageManager.registerTester({ name, email, roleTitle });
            state.pendingRegistrationEmail = user.email;
            state.isRegistrationFlow = true;
            state.currentOtpCode = otpCode;
            window.showInboxState(user.email, otpCode);
            showToast(`6-Digit Passcode sent for ${name}! Please enter the code below.`, "info");
          }, 350);
        } catch (err) {
          if (DOM.btnTesterSendOtp) {
            DOM.btnTesterSendOtp.disabled = false;
            DOM.btnTesterSendOtp.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Request Access & Send 6-Digit Passcode`;
          }
          window.showAuthAlert(err.message);
          showToast(err.message, "error");
        }
      });
    }

    // 3. 6-Digit Squares Passcode Verification Form (<CodeSlots />)
    if (DOM.testerOtpForm) {
      DOM.testerOtpForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const enteredOtp = codeSlotsState.value;

        if (enteredOtp.length !== 6) {
          setCodeSlotsStatus("error");
          showToast("Please enter the complete 6-digit numeric passcode", "error");
          return;
        }

        try {
          if (DOM.btnVerifyOtpSubmit) {
            DOM.btnVerifyOtpSubmit.disabled = true;
            DOM.btnVerifyOtpSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Validating Passcode...`;
          }

          if (state.isRegistrationFlow) {
            // Registration -> Verify 6-digit code & notify Senior Dev
            const user = StorageManager.verifyTesterOtp(state.pendingRegistrationEmail, enteredOtp);
            setCodeSlotsStatus("success");
            if (DOM.btnVerifyOtpSubmit) {
              DOM.btnVerifyOtpSubmit.disabled = false;
              DOM.btnVerifyOtpSubmit.innerHTML = `<i class="fa-solid fa-check"></i> Code Verified!`;
            }

            setTimeout(() => {
              window.showPendingState(user.email);
              showToast("Passcode verified! Access request sent to Senior Developer Lead.");
              if (DOM.btnVerifyOtpSubmit) {
                DOM.btnVerifyOtpSubmit.innerHTML = `<i class="fa-solid fa-shield-check"></i> Verify Code & Enter Workspace`;
              }
            }, 600);
          } else {
            // Everyday Login -> Verify 6-digit code & authenticate
            const { user } = StorageManager.verifyLoginOtp(state.pendingRegistrationEmail, enteredOtp);
            setCodeSlotsStatus("success");
            if (DOM.btnVerifyOtpSubmit) {
              DOM.btnVerifyOtpSubmit.disabled = false;
              DOM.btnVerifyOtpSubmit.innerHTML = `<i class="fa-solid fa-check"></i> Welcome Back, ${user.name}!`;
            }

            setTimeout(() => {
              if (user.role === "dev") {
                showToast(`Authenticated as Developer Lead: ${user.name}. Entering Dev Hub...`);
                window.location.href = "dev.html";
              } else {
                showToast(`Authenticated as QA Tester: ${user.name}. Entering QA Portal...`);
                window.location.href = "tester.html";
              }
            }, 600);
          }
        } catch (err) {
          if (DOM.btnVerifyOtpSubmit) {
            DOM.btnVerifyOtpSubmit.disabled = false;
            DOM.btnVerifyOtpSubmit.innerHTML = `<i class="fa-solid fa-shield-check"></i> Verify Code & Enter Workspace`;
          }
          setCodeSlotsStatus("error");
          showToast(err.message, "error");
        }
      });
    }

    // Resend 6-Digit Passcode
    if (DOM.btnResendOtp) {
      DOM.btnResendOtp.addEventListener("click", () => {
        if (!state.pendingRegistrationEmail) return;
        const users = StorageManager.getUsers();
        const user = users.find(u => u.email.toLowerCase() === state.pendingRegistrationEmail.toLowerCase());
        if (user) {
          const cleanEmail = user.email.toLowerCase().trim();
          let otpCode = String(Math.floor(100000 + Math.random() * 900000));
          if (cleanEmail === "dev@nexusqa.io") {
            otpCode = "123456";
          } else if (cleanEmail === "a@a") {
            otpCode = "654321";
          }
          user.otpCode = otpCode;
          user.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
          StorageManager.saveUsers(users);
          state.currentOtpCode = otpCode;

          const badgeEl = document.getElementById("simulatedOtpCodeBadge");
          if (badgeEl) badgeEl.textContent = otpCode;

          startResendCooldown(60);
          startOtpTimer(900);
          showToast(`New 6-digit passcode sent to ${user.email}: [ ${otpCode} ]`, "info");
        }
      });
    }
  }

  window.quickLoginPersona = function(identifier) {
    const users = StorageManager.getUsers();
    const cleanId = (identifier || "").toLowerCase().trim();
    const user = users.find(u => u.id === identifier || u.email.toLowerCase() === cleanId);
    if (user) {
      StorageManager.setCurrentUser(user);
      if (user.role === "dev") {
        showToast(`Signing in as Developer: ${user.name}...`);
        setTimeout(() => { window.location.href = "dev.html"; }, 300);
      } else {
        showToast(`Signing in as QA Tester: ${user.name}...`);
        setTimeout(() => { window.location.href = "tester.html"; }, 300);
      }
    }
  };

  if (DOM.logoutBtn) {
    DOM.logoutBtn.addEventListener("click", () => {
      StorageManager.logout();
      window.location.replace("index.html");
    });
  }
  
  if (DOM.switchUserQuickBtn) {
    DOM.switchUserQuickBtn.addEventListener("click", () => {
      StorageManager.logout();
      window.location.replace("index.html");
    });
  }

  // Real-time listener
  StorageManager.subscribe((msg) => {
    renderActiveView();
    updateDevApprovalsBadge();

    if (msg.type === "TESTER_APPROVAL_REQUESTED" || msg.type === "USERS_UPDATED") {
      updateDevApprovalsBadge();
      if (typeof renderDevApprovals === "function") {
        renderDevApprovals();
      }
      if (msg.type === "TESTER_APPROVAL_REQUESTED") {
        if (state.currentPortal === "dev" || document.body.classList.contains("page-dev")) {
          const reqRole = msg.payload?.user?.role === "dev" ? "Developer" : "QA Tester";
          showToast(`🔔 New ${reqRole} Access Request from ${msg.payload?.user?.name || 'Member'}!`, "info");
        }
      }
    } else if (msg.type === "TESTER_APPROVED") {
      updateDevApprovalsBadge();
      // If waiting in Pending Approval screen on index.html
      if (DOM.testerPendingApprovalView && DOM.testerPendingApprovalView.style.display !== "none") {
        const approvedUser = msg.payload.user;
        if (approvedUser && (approvedUser.email.toLowerCase() === state.pendingRegistrationEmail.toLowerCase())) {
          StorageManager.setCurrentUser(approvedUser);
          showToast(`🎉 Access Granted! You have been approved by Marcus Vance. Loading QA Workspace...`, "success");
          setTimeout(() => {
            window.location.href = "tester.html";
          }, 800);
        }
      }
    } else if (msg.type === "TESTER_REJECTED") {
      updateDevApprovalsBadge();
      if (DOM.testerPendingApprovalView && DOM.testerPendingApprovalView.style.display !== "none") {
        showToast("Your tester registration request was not approved.", "error");
      }
    } else if (msg.type === "DEFECTS_UPDATED") {
      showToast("Live Defect Sync: Records updated across portals!", "info");
      checkRetestBanner();
    } else if (msg.type === "PING_BROADCAST") {
      showToast(`Cross-Portal Ping received from ${msg.payload.sender || 'peer'}!`, "info");
    } else if (msg.type === "SUPABASE_CONNECTED") {
      updateSupabaseStatusUI();
      showToast("Supabase cloud database synced!");
    }
  });

  // =========================================================================
  // DEVELOPER HUB: TESTER ACCESS APPROVALS
  // =========================================================================
  function updateDevApprovalsBadge() {
    const pending = StorageManager.getPendingTesterRequests();
    if (DOM.devPendingApprovalsBadge) {
      DOM.devPendingApprovalsBadge.textContent = pending.length;
      DOM.devPendingApprovalsBadge.style.display = pending.length > 0 ? "inline-block" : "none";
    }
    if (DOM.devApprovalAlertBanner) {
      DOM.devApprovalAlertBanner.style.display = pending.length > 0 ? "flex" : "none";
      if (DOM.devApprovalAlertCount) {
        DOM.devApprovalAlertCount.textContent = `${pending.length} Tester${pending.length > 1 ? 's' : ''}`;
      }
    }
  }

  if (DOM.btnGoToApprovals) {
    DOM.btnGoToApprovals.addEventListener("click", () => switchView("dev-approvals"));
  }

  if (DOM.refreshApprovalsBtn) {
    DOM.refreshApprovalsBtn.addEventListener("click", () => {
      renderDevApprovals();
      showToast("Approvals list refreshed!");
    });
  }

  function renderDevApprovals() {
    const allUsers = StorageManager.getUsers();
    const pending = allUsers.filter(u => u.status === "pending_approval");
    const activeMembers = allUsers.filter(u => u.status === "active");

    if (DOM.kpiPendingApprovalsCount) DOM.kpiPendingApprovalsCount.textContent = pending.length;
    if (DOM.kpiActiveTestersCount) DOM.kpiActiveTestersCount.textContent = activeMembers.length;
    if (DOM.kpiOtpVerifiedCount) DOM.kpiOtpVerifiedCount.textContent = "100%";

    updateDevApprovalsBadge();

    // Pending Requests Container
    if (DOM.pendingApprovalsListContainer) {
      if (pending.length === 0) {
        DOM.pendingApprovalsListContainer.innerHTML = `
          <div class="empty-state p-4 text-center">
            <div class="empty-icon text-emerald mb-2"><i class="fa-solid fa-circle-check" style="font-size:2.5rem;"></i></div>
            <h4>No Pending Access Requests</h4>
            <p class="text-muted text-xs">All registered members have been reviewed and authorized for the workspace.</p>
          </div>
        `;
      } else {
        DOM.pendingApprovalsListContainer.innerHTML = `
          <div class="pending-approval-cards-grid">
            ${pending.map(user => {
              const isDev = user.role === "dev";
              const avatarClass = isDev ? "avatar-dev" : "avatar-qa";
              const roleTitle = escapeHtml(user.roleTitle || (isDev ? (user.devLevel === 'senior' ? 'Senior Developer' : 'Developer') : 'QA Tester'));
              const roleBadge = isDev
                ? `<span class="badge badge-ai" style="background: rgba(16, 185, 129, 0.15) !important; color: #10b981 !important; border: 1px solid rgba(16, 185, 129, 0.3) !important; font-size:11px;"><i class="fa-solid fa-code"></i> ${roleTitle}</span>`
                : `<span class="badge badge-untested" style="background: rgba(99, 102, 241, 0.15) !important; color: #818cf8 !important; border: 1px solid rgba(99, 102, 241, 0.3) !important; font-size:11px;"><i class="fa-solid fa-vial-circle-check"></i> ${roleTitle}</span>`;

              return `
                <div class="pending-approval-card">
                  <div class="pending-req-header">
                    <div class="avatar-ring ${avatarClass}" style="width:38px; height:38px; font-size:13px; font-weight:700;">${escapeHtml(user.avatar || user.name.substring(0, 2).toUpperCase())}</div>
                    <div class="pending-req-meta">
                      <h4>${escapeHtml(user.name)}</h4>
                      <span class="req-email">${escapeHtml(user.email)}</span>
                      <div class="mt-1">${roleBadge}</div>
                    </div>
                  </div>

                  <div class="pending-req-badges">
                    <span class="badge badge-passed"><i class="fa-solid fa-check"></i> Email OTP Verified</span>
                    <span class="badge badge-blocked"><i class="fa-solid fa-clock"></i> Awaiting Dev Signoff</span>
                  </div>

                  <div class="pending-req-actions">
                    <button class="btn-approve-qa" onclick="window.approveTester('${user.id}')">
                      <i class="fa-solid fa-user-check"></i> Approve Access
                    </button>
                    <button class="btn-reject-qa" onclick="window.rejectTester('${user.id}')">
                      <i class="fa-solid fa-user-xmark"></i> Reject
                    </button>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        `;
      }
    }

    // Team Roster & Access Management (All Workspace Members: Developers & Testers)
    if (DOM.authorizedTestersTableBody) {
      const isSenior = StorageManager.isSeniorDev(state.currentUser);
      const managedUsers = allUsers; // Display all registered workspace members

      DOM.authorizedTestersTableBody.innerHTML = managedUsers.map(u => {
        let statusBadge = '<span class="badge badge-passed"><i class="fa-solid fa-check"></i> Active & Authorized</span>';
        if (u.status === "pending_approval") {
          statusBadge = '<span class="badge badge-blocked"><i class="fa-solid fa-clock"></i> Pending Dev Signoff</span>';
        } else if (u.status === "rejected") {
          statusBadge = '<span class="badge badge-danger"><i class="fa-solid fa-xmark"></i> Rejected</span>';
        }

        const isDev = u.role === "dev";
        const isSeniorMember = StorageManager.isSeniorDev(u);
        const avatarClass = isDev ? "avatar-dev" : "avatar-qa";
        
        let rolePill = '';
        if (isDev) {
          rolePill = `<span class="badge badge-ai" style="background: rgba(16, 185, 129, 0.15) !important; color: #10b981 !important; border: 1px solid rgba(16, 185, 129, 0.3) !important;"><i class="fa-solid fa-code"></i> ${escapeHtml(u.roleTitle || (isSeniorMember ? 'Senior Developer' : 'Developer'))}</span>`;
        } else {
          rolePill = `<span class="badge badge-untested" style="background: rgba(99, 102, 241, 0.15) !important; color: #818cf8 !important; border: 1px solid rgba(99, 102, 241, 0.3) !important;"><i class="fa-solid fa-vial-circle-check"></i> ${escapeHtml(u.roleTitle || 'QA Tester')}</span>`;
        }

        const isSelf = state.currentUser && (state.currentUser.id === u.id || (state.currentUser.email && u.email && state.currentUser.email.toLowerCase() === u.email.toLowerCase()));
        
        const actionCell = isSenior
          ? `<div class="d-flex align-center gap-1">
              <button class="btn btn-secondary btn-xs" onclick="window.openEditMemberModal('${u.id}')" title="Edit member details"><i class="fa-solid fa-user-pen"></i> Edit</button>
              ${isSelf ? '<span class="badge badge-version" style="font-size:10px; opacity:0.85;">You</span>' : createDeleteButtonHtml({ onClick: `window.deleteMember('${u.id}')`, title: 'Delete user from workspace', isCompact: true })}
            </div>`
          : `<span class="badge badge-untested text-xs" title="Only Developers can edit"><i class="fa-solid fa-lock"></i> View Only</span>`;

        return `
          <tr>
            <td>
              <div class="d-flex align-center gap-2">
                <div class="avatar-ring ${avatarClass}" style="width:28px; height:28px; font-size:11px;">${escapeHtml(u.avatar || u.name.substring(0, 2).toUpperCase())}</div>
                <div>
                  <strong>${escapeHtml(u.name)}</strong>
                  ${isSelf ? '<span class="badge badge-version" style="font-size:9px; margin-left:4px; background:rgba(16,185,129,0.2); color:#10b981; border:1px solid #10b981;">You</span>' : ''}
                </div>
              </div>
            </td>
            <td><span class="font-mono text-xs text-muted">${escapeHtml(u.email)}</span></td>
            <td>${rolePill}</td>
            <td><span class="badge badge-passed"><i class="fa-solid fa-check"></i> ${u.emailVerified !== false ? '100% Verified' : 'Pending OTP'}</span></td>
            <td>${statusBadge}</td>
            <td><span class="text-xs text-muted">${escapeHtml(u.approvedBy || (u.status === 'active' ? 'Active / Auto' : 'Pending'))}</span></td>
            <td>${actionCell}</td>
          </tr>
        `;
      }).join("");
    }
  }

  window.openEditMemberModal = function(userId) {
    const user = StorageManager.getUsers().find(u => u.id === userId);
    if (!user) {
      showToast("User not found", "error");
      return;
    }

    const isSenior = StorageManager.isSeniorDev(state.currentUser);
    if (!isSenior) {
      showToast("Access Denied: Only Senior Developers can edit team member credentials.", "error");
      return;
    }

    if (DOM.editMemberId) DOM.editMemberId.value = user.id;
    if (DOM.editMemberName) DOM.editMemberName.value = user.name || "";
    if (DOM.editMemberEmail) DOM.editMemberEmail.value = user.email || "";
    if (DOM.editMemberRoleType) {
      DOM.editMemberRoleType.value = (user.role === "dev" || user.devLevel === "junior") ? "junior-dev" : "qa";
    }
    if (DOM.editMemberSpecialty) DOM.editMemberSpecialty.value = user.roleTitle || "";
    if (DOM.editMemberStatus) DOM.editMemberStatus.value = user.status || "active";
    if (DOM.editMemberApprovedBy) DOM.editMemberApprovedBy.value = user.approvedBy || (state.currentUser ? state.currentUser.name : "Marcus Vance (Dev Lead)");
    if (DOM.editMemberIdBadge) DOM.editMemberIdBadge.textContent = "ID: " + user.id;
    if (DOM.editMemberAuthBadge) {
      DOM.editMemberAuthBadge.innerHTML = `<i class="fa-solid fa-shield-halved"></i> Senior Dev (${escapeHtml(state.currentUser ? state.currentUser.name : "Lead Dev")})`;
    }

    const isSelf = state.currentUser && state.currentUser.id === user.id;
    if (DOM.deleteMemberWrap) {
      DOM.deleteMemberWrap.style.display = isSelf ? "none" : "inline-flex";
    }
    if (DOM.deleteMemberBtn) {
      DOM.deleteMemberBtn.style.display = isSelf ? "none" : "inline-flex";
    }

    if (DOM.editMemberModal) DOM.editMemberModal.style.display = "flex";
  };

  window.deleteMember = function(userId) {
    const isSenior = StorageManager.isSeniorDev(state.currentUser);
    if (!isSenior) {
      showToast("Permission Denied: Only Senior Developers can remove users.", "error");
      return;
    }

    const user = StorageManager.getUsers().find(u => u.id === userId);
    if (!user) {
      showToast("User not found.", "error");
      return;
    }

    if (state.currentUser && state.currentUser.id === userId) {
      showToast("Cannot delete your own active account while logged in.", "error");
      return;
    }

    const confirmMsg = `Are you sure you want to permanently delete user "${user.name}" (${user.email}) from the workspace?\n\nThis will remove their account credentials and access permissions.`;
    if (confirm(confirmMsg)) {
      const result = StorageManager.deleteUser(userId);
      if (result && result.success) {
        if (DOM.editMemberModal) DOM.editMemberModal.style.display = "none";
        showToast(`User "${user.name}" has been removed from workspace.`, "info");
        renderDevApprovals();
      } else if (result && result.error === "CANNOT_DELETE_SELF") {
        showToast("Cannot delete your own active account while logged in.", "error");
      } else {
        showToast("Failed to delete user.", "error");
      }
    }
  };

  on(DOM.closeEditMemberModalBtn, "click", () => {
    if (DOM.editMemberModal) DOM.editMemberModal.style.display = "none";
  });

  on(DOM.cancelEditMemberModalBtn, "click", () => {
    if (DOM.editMemberModal) DOM.editMemberModal.style.display = "none";
  });

  on(DOM.deleteMemberBtn, "click", () => {
    const userId = DOM.editMemberId ? DOM.editMemberId.value : "";
    if (userId) {
      window.deleteMember(userId);
    }
  });

  on(DOM.saveEditMemberBtn, "click", () => {
    const isSenior = StorageManager.isSeniorDev(state.currentUser);
    if (!isSenior) {
      showToast("Permission Denied: Only Senior Developers can modify team members.", "error");
      return;
    }

    const userId = DOM.editMemberId ? DOM.editMemberId.value : "";
    const name = DOM.editMemberName ? DOM.editMemberName.value.trim() : "";
    const email = DOM.editMemberEmail ? DOM.editMemberEmail.value.trim() : "";
    const roleType = DOM.editMemberRoleType ? DOM.editMemberRoleType.value : "qa";
    const roleTitle = DOM.editMemberSpecialty ? DOM.editMemberSpecialty.value.trim() : "";
    const status = DOM.editMemberStatus ? DOM.editMemberStatus.value : "active";
    const approvedBy = DOM.editMemberApprovedBy ? DOM.editMemberApprovedBy.value.trim() : (state.currentUser ? state.currentUser.name : "Marcus Vance (Dev Lead)");

    if (!name || !email) {
      showToast("Please provide both name and email.", "error");
      return;
    }

    const isJuniorDev = roleType === "junior-dev";
    const updated = StorageManager.updateUser(userId, {
      name,
      email,
      role: isJuniorDev ? "dev" : "qa",
      devLevel: isJuniorDev ? "junior" : "",
      roleTitle: roleTitle || (isJuniorDev ? "Junior Developer" : "QA Tester"),
      status,
      approvedBy
    });

    if (updated) {
      if (DOM.editMemberModal) DOM.editMemberModal.style.display = "none";
      showToast(`Updated details for ${updated.name}!`, "success");
      renderDevApprovals();
    }
  });

  window.approveTester = function(userId) {
    const user = StorageManager.approveTesterRequest(userId, (state.currentUser && state.currentUser.name) || "Chhotu Monster");
    if (user) {
      showToast(`Approved workspace access for ${user.name}!`, "success");
      renderDevApprovals();
    }
  };

  window.rejectTester = function(userId) {
    if (confirm("Reject this member's access request?")) {
      const user = StorageManager.rejectTesterRequest(userId);
      if (user) {
        showToast(`Rejected access request for ${user.name}`, "error");
        renderDevApprovals();
      }
    }
  };

  function renderActiveView() {
    if (state.currentPortal === "dev") {
      renderDevDashboard();
      if (state.currentView === "dev-approvals") renderDevApprovals();
      if (state.currentView === "dev-kanban") renderDevKanban();
      if (state.currentView === "dev-failures") renderDevFailures();
    } else {
      if (state.currentView === "dashboard") renderDashboard();
      if (state.currentView === "test-cases") renderRepository();
      if (state.currentView === "defects") renderDefects();
    }
  }

  on(DOM.broadcastPingBtn, "click", () => {
    StorageManager.broadcast("PING_BROADCAST", { sender: state.currentUser.name });
    showToast("Sync ping broadcasted to all connected tabs/portals!");
  });

  // =========================================================================
  // VIEW SWITCHING
  // =========================================================================
  function switchView(viewName) {
    state.currentView = viewName;

    document.querySelectorAll(".sidebar-nav .nav-item").forEach(item => {
      if (item.getAttribute("data-view") === viewName) item.classList.add("active");
      else item.classList.remove("active");
    });

    document.querySelectorAll(".sidebar-primary-rail .rail-nav-item").forEach(item => {
      if (item.getAttribute("data-view") === viewName) item.classList.add("active");
      else item.classList.remove("active");
    });

    const titles = {
      dashboard: "Quality Analytics",
      "test-cases": "Test Repository",
      defects: "Defects & Bug Tracking",
      "ai-generator": "Voice & AI Chat Studio",
      suites: "Suites & Modules",
      conference: "Dev & Tester Conference Room",
      "dev-dashboard": "Dev Defect Command Center",
      "dev-approvals": "Employees & Access Control",
      "dev-kanban": "Bug Triage Kanban",
      "dev-failures": "Failed Test Diagnostics",
      settings: "My Profile & Account",
      "404": "Error 404 - Not Found"
    };

    let hasMatchingPanel = false;
    const allPanels = (DOM.viewPanels && DOM.viewPanels.length > 0) ? DOM.viewPanels : document.querySelectorAll(".view-panel");
    allPanels.forEach(panel => {
      if (panel.id === `view-${viewName}`) {
        panel.classList.add("active-view");
        hasMatchingPanel = true;
      } else {
        panel.classList.remove("active-view");
      }
    });

    let notFoundPanel = document.getElementById("view-404");
    if (!hasMatchingPanel && !titles[viewName]) {
      if (!notFoundPanel) {
        notFoundPanel = document.createElement("section");
        notFoundPanel.id = "view-404";
        notFoundPanel.className = "view-panel active-view";
        const viewport = document.getElementById("viewViewport") || document.querySelector(".main-content");
        if (viewport) viewport.appendChild(notFoundPanel);
      }
      if (notFoundPanel) {
        notFoundPanel.classList.add("active-view");
        notFoundPanel.innerHTML = create404Html({
          title: "Error 404",
          heading: "View Not Found",
          desc: `The view "${viewName}" does not exist in this workspace.`,
          actionText: state.currentPortal === "dev" ? "Go to Dev Command Center" : "Go to Quality Analytics",
          actionHandler: `switchView('${state.currentPortal === "dev" ? "dev-dashboard" : "dashboard"}')`
        });
      }
    } else if (notFoundPanel) {
      notFoundPanel.classList.remove("active-view");
    }

    if (DOM.currentCrumb) DOM.currentCrumb.textContent = titles[viewName] || "Error 404";
    if (DOM.sidebar) DOM.sidebar.classList.remove("mobile-open");

    const vp = document.getElementById("viewViewport");
    if (vp) vp.scrollTop = 0;
    window.scrollTo(0, 0);

    if (viewName === "dashboard") renderDashboard();
    if (viewName === "test-cases") renderRepository();
    if (viewName === "defects") renderDefects();
    if (viewName === "ai-generator") renderAIGeneratorSuiteDropdown();
    if (viewName === "suites") renderSuitesView();
    if (viewName === "conference") renderConference();
    if (viewName === "dev-dashboard") renderDevDashboard();
    if (viewName === "dev-approvals") renderDevApprovals();
    if (viewName === "dev-kanban") renderDevKanban();
    if (viewName === "dev-failures") renderDevFailures();
    if (viewName === "settings") populateProfileForm();
  }

  document.querySelectorAll(".sidebar-nav .nav-item, .sidebar-primary-rail .rail-nav-item").forEach(item => {
    item.addEventListener("click", () => {
      const view = item.getAttribute("data-view");
      if (view) switchView(view);
    });
  });

  on(DOM.gotoTestRunsBtn, "click", () => switchView("test-cases"));
  on(DOM.gotoDevKanbanBtn, "click", () => switchView("dev-kanban"));

  on(DOM.createQuickBtn, "click", () => {
    if (state.currentPortal === "dev") {
      if (DOM.createNewBugBtn) DOM.createNewBugBtn.click();
    } else {
      openCreateTestCaseModal();
    }
  });

  const toggleSidebarCollapse = (e) => {
    if (DOM.sidebar) {
      const isNowCollapsed = DOM.sidebar.classList.toggle("collapsed");
      document.body.classList.toggle("sidebar-collapsed", isNowCollapsed);
      localStorage.setItem("nexusqa_sidebar_collapsed", isNowCollapsed ? "true" : "false");
      const checkInput = document.getElementById("sidebar-label-check");
      if (checkInput) checkInput.checked = !isNowCollapsed;
    }
  };

  on(DOM.sidebarBurgerBtn, "click", toggleSidebarCollapse);
  const secondaryClose = document.getElementById("secondaryCollapseBtn");
  if (secondaryClose) secondaryClose.addEventListener("click", toggleSidebarCollapse);

  on(DOM.menuToggleBtn, "click", () => {
    if (DOM.sidebar) {
      if (window.innerWidth <= 768) {
        DOM.sidebar.classList.toggle("mobile-open");
      } else {
        const isNowCollapsed = DOM.sidebar.classList.toggle("collapsed");
        document.body.classList.toggle("sidebar-collapsed", isNowCollapsed);
        localStorage.setItem("nexusqa_sidebar_collapsed", isNowCollapsed ? "true" : "false");
      }
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== DOM.globalSearchInput && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
      e.preventDefault();
      if (DOM.globalSearchInput) DOM.globalSearchInput.focus();
    }
  });

  on(DOM.globalSearchInput, "input", (e) => {
    const val = e.target.value.trim();
    if (val) {
      if (state.currentPortal === "dev") {
        if (state.currentView !== "dev-kanban") switchView("dev-kanban");
      } else {
        if (state.currentView !== "test-cases") switchView("test-cases");
        if (DOM.testCaseSearchInput) DOM.testCaseSearchInput.value = val;
        state.searchQuery = val.toLowerCase();
        renderTestCaseTable();
      }
    }
  });

  on(DOM.themeToggleBtn, "click", () => {
    const isCurrentlyDark = document.body.classList.contains("dark-theme");
    applyTheme(isCurrentlyDark ? "light" : "dark");
  });

  on(DOM.themeSwitchCheckbox, "change", (e) => {
    applyTheme(e.target.checked ? "dark" : "light");
  });

  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    let icon = type === "error" ? "fa-circle-xmark" : type === "info" ? "fa-circle-info" : "fa-circle-check";
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    if (DOM.toastContainer) DOM.toastContainer.appendChild(toast);
    else document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-24px) scale(0.94)";
      toast.style.transition = "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)";
      setTimeout(() => toast.remove(), 260);
    }, 3400);
  }

  function checkRetestBanner() {
    const defects = StorageManager.getDefects();
    const retestBugs = defects.filter(d => d.status === "Fixed - Ready for QA");
    if (retestBugs.length > 0 && state.currentPortal === "qa") {
      if (DOM.retestAlertBanner) DOM.retestAlertBanner.style.display = "flex";
      if (DOM.retestAlertCount) DOM.retestAlertCount.textContent = `${retestBugs.length} bug${retestBugs.length === 1 ? '' : 's'}`;
    } else {
      if (DOM.retestAlertBanner) DOM.retestAlertBanner.style.display = "none";
    }
  }

  on(DOM.viewRetestBugsBtn, "click", () => {
    switchView("defects");
    if (DOM.filterBugStatus) DOM.filterBugStatus.value = "Fixed - Ready for QA";
    renderDefects();
  });

  // =========================================================================
  // DEVELOPER PORTAL LOGIC
  // =========================================================================
  function renderDevDashboard() {
    const defects = StorageManager.getDefects();
    const currentUser = state.currentUser || { name: "Marcus Vance" };

    const critical = defects.filter(d => (d.severity === "Critical" || d.priority.includes("P0")) && d.status !== "Resolved & Verified" && d.status !== "Closed");
    const assigned = defects.filter(d => d.assignee && d.assignee.toLowerCase().includes(currentUser.name.toLowerCase().split(" ")[0]) && d.status !== "Resolved & Verified" && d.status !== "Closed");
    const readyRetest = defects.filter(d => d.status === "Fixed - Ready for QA");
    const verified = defects.filter(d => d.status === "Resolved & Verified" || d.status === "Closed");

    if (DOM.devKpiCritical) DOM.devKpiCritical.textContent = critical.length;
    if (DOM.devKpiAssigned) DOM.devKpiAssigned.textContent = assigned.length;
    if (DOM.devKpiAssignedSub) DOM.devKpiAssignedSub.textContent = `${assigned.filter(d => d.status === "In Progress").length} actively in progress`;
    if (DOM.devKpiReadyRetest) DOM.devKpiReadyRetest.textContent = readyRetest.length;
    if (DOM.devKpiVerified) DOM.devKpiVerified.textContent = verified.length;

    if (DOM.devAssignedBadge) DOM.devAssignedBadge.textContent = assigned.length;

    const unfixBugs = defects.filter(d => d.status === "Open" || d.status === "In Progress");
    if (DOM.devActiveDefectsList) {
      if (unfixBugs.length === 0) {
        DOM.devActiveDefectsList.innerHTML = `<div class="p-4 text-center text-muted">🎉 No unresolved defects! All bugs fixed.</div>`;
      } else {
        DOM.devActiveDefectsList.innerHTML = unfixBugs.slice(0, 5).map(d => `
          <div class="dev-feed-item">
            <div class="dev-feed-info">
              <div class="d-flex align-center gap-1">
                <span class="test-id-pill" style="color:var(--rose); background:rgba(244,63,94,0.1);">${d.id}</span>
                <span class="badge ${d.severity === 'Critical' ? 'badge-p0' : 'badge-p1'} text-xs">${d.severity}</span>
              </div>
              <div class="dev-feed-title">${escapeHtml(d.summary)}</div>
              <div class="text-xs text-muted">Linked: <strong>${d.linkedTestCaseId || 'None'}</strong> • Assignee: <strong>${escapeHtml(d.assignee || 'Unassigned')}</strong></div>
            </div>
            <button class="btn btn-secondary btn-xs" onclick="window.openDevFixModal('${d.id}')">
              <i class="fa-solid fa-wrench text-emerald"></i> Fix
            </button>
          </div>
        `).join("");
      }
    }

    const prBugs = defects.filter(d => d.prLink || d.devNotes);
    if (DOM.devRecentPrFeed) {
      if (prBugs.length === 0) {
        DOM.devRecentPrFeed.innerHTML = `<div class="p-4 text-center text-muted">No PRs submitted yet.</div>`;
      } else {
        DOM.devRecentPrFeed.innerHTML = prBugs.slice(0, 5).map(d => `
          <div class="dev-feed-item">
            <div class="dev-feed-info">
              <div class="d-flex align-center gap-1">
                <strong class="font-mono text-xs text-cyan">${d.id}</strong>
                <span class="badge badge-passed text-xs">${d.status}</span>
              </div>
              <div class="dev-feed-title">${escapeHtml(d.devNotes || d.summary)}</div>
              <div class="text-xs text-muted">
                ${d.prLink ? `<a href="${d.prLink}" target="_blank" class="text-primary"><i class="fa-solid fa-code-pull-request"></i> ${d.prLink.substring(0, 35)}...</a>` : ''}
                ${d.gitBranch ? `• branch: <code class="text-amber">${d.gitBranch}</code>` : ''}
              </div>
            </div>
            <button class="btn btn-ghost btn-xs" onclick="window.openDevFixModal('${d.id}')"><i class="fa-solid fa-pen"></i></button>
          </div>
        `).join("");
      }
    }
  }

  function renderDevKanban() {
    const defects = StorageManager.getDefects();
    const currentUser = state.currentUser || { name: "Marcus Vance" };

    let filtered = defects;
    if (state.devOnlyMyBugs) {
      filtered = filtered.filter(d => d.assignee && d.assignee.toLowerCase().includes(currentUser.name.toLowerCase().split(" ")[0]));
    }

    const openBugs = filtered.filter(d => d.status === "Open");
    const progressBugs = filtered.filter(d => d.status === "In Progress");
    const retestBugs = filtered.filter(d => d.status === "Fixed - Ready for QA");
    const verifiedBugs = filtered.filter(d => d.status === "Resolved & Verified" || d.status === "Closed");

    if (DOM.kanbanOpenCount) DOM.kanbanOpenCount.textContent = openBugs.length;
    if (DOM.kanbanProgressCount) DOM.kanbanProgressCount.textContent = progressBugs.length;
    if (DOM.kanbanRetestCount) DOM.kanbanRetestCount.textContent = retestBugs.length;
    if (DOM.kanbanVerifiedCount) DOM.kanbanVerifiedCount.textContent = verifiedBugs.length;

    if (DOM.kanbanColOpen) renderKanbanColumn(DOM.kanbanColOpen, openBugs);
    if (DOM.kanbanColProgress) renderKanbanColumn(DOM.kanbanColProgress, progressBugs);
    if (DOM.kanbanColRetest) renderKanbanColumn(DOM.kanbanColRetest, retestBugs);
    if (DOM.kanbanColVerified) renderKanbanColumn(DOM.kanbanColVerified, verifiedBugs);
  }

  function renderKanbanColumn(container, bugs) {
    if (!container) return;
    if (bugs.length === 0) {
      container.innerHTML = `<div class="p-3 text-muted text-xs text-center">No bugs in this stage</div>`;
      return;
    }

    container.innerHTML = bugs.map(b => `
      <div class="kanban-card" onclick="window.openDevFixModal('${b.id}')">
        <div class="kanban-card-top">
          <span class="font-mono font-bold text-xs text-rose">${b.id}</span>
          <span class="badge ${b.severity === 'Critical' ? 'badge-p0' : b.severity === 'Major' ? 'badge-p1' : 'badge-p2'} text-xs">${b.severity}</span>
        </div>
        <div class="kanban-card-title">${escapeHtml(b.summary)}</div>
        <div class="text-xs text-muted">
          ${b.linkedTestCaseId ? `<i class="fa-solid fa-link text-cyan"></i> ${b.linkedTestCaseId}` : ''}
          ${b.gitBranch ? `• <code class="text-amber">${b.gitBranch}</code>` : ''}
        </div>
        <div class="kanban-card-footer">
          <span><i class="fa-solid fa-user-circle"></i> ${escapeHtml(b.assignee || 'Unassigned')}</span>
          <span class="text-primary"><i class="fa-solid fa-arrow-right"></i> Details</span>
        </div>
      </div>
    `).join("");
  }

  on(DOM.filterMyBugsBtn, "click", () => {
    state.devOnlyMyBugs = !state.devOnlyMyBugs;
    if (DOM.filterMyBugsBtn) {
      DOM.filterMyBugsBtn.innerHTML = state.devOnlyMyBugs ? '<i class="fa-solid fa-check text-emerald"></i> Showing My Assigned' : '<i class="fa-solid fa-filter"></i> Show My Assigned Only';
    }
    renderDevKanban();
  });

  on(DOM.refreshDevMetricsBtn, "click", () => {
    renderDevDashboard();
    showToast("Developer feed refreshed!");
  });

  window.openDevFixModal = function(bugId) {
    const defect = StorageManager.getDefectById(bugId);
    if (!defect) return;

    if (DOM.devFixModalBugId) DOM.devFixModalBugId.textContent = defect.id;
    if (DOM.devFixBugId) DOM.devFixBugId.value = defect.id;
    if (DOM.devFixBugSummary) DOM.devFixBugSummary.textContent = defect.summary;
    if (DOM.devFixBugDescription) DOM.devFixBugDescription.textContent = defect.description || "No specific description provided by tester.";
    if (DOM.devFixBugReporter) DOM.devFixBugReporter.textContent = defect.reportedBy || "QA Tester";
    if (DOM.devFixBugSeverity) DOM.devFixBugSeverity.textContent = defect.severity;
    if (DOM.devFixBugLinkedTest) DOM.devFixBugLinkedTest.textContent = defect.linkedTestCaseId || "None";

    if (defect.linkedTestCaseId) {
      const tc = StorageManager.getTestCaseById(defect.linkedTestCaseId);
      if (tc && tc.steps && DOM.devFixLinkedTestStepsList) {
        DOM.devFixLinkedTestStepsList.innerHTML = tc.steps.map(s => `
          <div class="text-xs mb-1">
            <strong>Step ${s.step}:</strong> ${escapeHtml(s.action)} → <span class="text-cyan">${escapeHtml(s.expected)}</span>
          </div>
        `).join("");
      } else if (DOM.devFixLinkedTestStepsList) {
        DOM.devFixLinkedTestStepsList.innerHTML = `<span class="text-xs text-muted">No step-by-step procedure attached.</span>`;
      }
    } else if (DOM.devFixLinkedTestStepsList) {
      DOM.devFixLinkedTestStepsList.innerHTML = `<span class="text-xs text-muted">No linked test case.</span>`;
    }

    if (DOM.devFixBranchInput) DOM.devFixBranchInput.value = defect.gitBranch || "";
    if (DOM.devFixPrInput) DOM.devFixPrInput.value = defect.prLink || "";
    if (DOM.devFixNotesInput) DOM.devFixNotesInput.value = defect.devNotes || "";
    if (DOM.devFixStatusSelect) DOM.devFixStatusSelect.value = defect.status || "Fixed - Ready for QA";
    if (DOM.devFixAssigneeSelect) DOM.devFixAssigneeSelect.value = defect.assignee || state.currentUser.name;

    if (DOM.devFixModal) DOM.devFixModal.style.display = "flex";
  };

  on(DOM.closeDevFixModalBtn, "click", () => { if (DOM.devFixModal) DOM.devFixModal.style.display = "none"; });
  on(DOM.cancelDevFixModalBtn, "click", () => { if (DOM.devFixModal) DOM.devFixModal.style.display = "none"; });

  on(DOM.saveDevFixBtn, "click", () => {
    const bugId = DOM.devFixBugId ? DOM.devFixBugId.value : "";
    const devNotes = DOM.devFixNotesInput ? DOM.devFixNotesInput.value.trim() : "";
    const prLink = DOM.devFixPrInput ? DOM.devFixPrInput.value.trim() : "";
    const gitBranch = DOM.devFixBranchInput ? DOM.devFixBranchInput.value.trim() : "";
    const status = DOM.devFixStatusSelect ? DOM.devFixStatusSelect.value : "Fixed - Ready for QA";
    const assignee = (DOM.devFixAssigneeSelect ? DOM.devFixAssigneeSelect.value.trim() : "") || state.currentUser.name;

    if (!devNotes) {
      showToast("Please provide root cause / resolution notes", "error");
      if (DOM.devFixNotesInput) DOM.devFixNotesInput.focus();
      return;
    }

    StorageManager.updateDefectDevFix(bugId, {
      devNotes,
      prLink,
      gitBranch,
      status,
      assignee
    });

    if (DOM.devFixModal) DOM.devFixModal.style.display = "none";
    renderDevDashboard();
    if (state.currentView === "dev-kanban") renderDevKanban();
    showToast(`Bug ${bugId} updated to '${status}' & synced with QA!`);
  });

  function renderDevFailures() {
    const runs = StorageManager.getTestRuns();
    const cases = StorageManager.getTestCases();
    const caseMap = new Map(cases.map(c => [c.id, c]));

    const failedTests = [];
    runs.forEach(run => {
      Object.entries(run.results || {}).forEach(([tcId, res]) => {
        if (res.status === "Failed" || res.status === "Blocked") {
          failedTests.push({ run, testCase: caseMap.get(tcId), status: res.status, notes: res.notes });
        }
      });
    });

    if (DOM.devFailedTestsBadge) DOM.devFailedTestsBadge.textContent = failedTests.length;

    if (DOM.devFailuresContainer) {
      if (failedTests.length === 0) {
        DOM.devFailuresContainer.innerHTML = `<div class="dashboard-card p-4 text-center text-muted">✅ All recent tests passed! Zero execution failures.</div>`;
        return;
      }

      DOM.devFailuresContainer.innerHTML = failedTests.map(f => {
        const tc = f.testCase || { id: "TC-Unknown", title: "Test Case", steps: [] };
        return `
          <div class="dev-failure-card">
            <div class="d-flex justify-between align-center mb-2">
              <div class="d-flex align-center gap-1">
                <span class="test-id-pill" style="color:var(--rose); background:rgba(244,63,94,0.1);">${tc.id}</span>
                <span class="badge badge-failed">${f.status}</span>
                <span class="text-xs text-muted">in Run: <strong>${escapeHtml(f.run.name)}</strong> (${f.run.environment})</span>
              </div>
              <button class="btn btn-danger btn-xs" onclick="window.openDevFixModalForTest('${tc.id}')">
                <i class="fa-solid fa-bug"></i> Link / File Fix
              </button>
            </div>
            <h3 class="text-sm font-bold text-heading mb-1">${escapeHtml(tc.title)}</h3>
            <div class="precondition-box text-xs mb-2">
              <strong>QA Execution Log / Failure Reason:</strong> ${escapeHtml(f.notes || 'Step assertion mismatch')}
            </div>
            <div class="text-xs text-muted">
              <strong>Expected Steps:</strong> ${(tc.steps || []).map(s => `Step ${s.step}: ${escapeHtml(s.action)} → ${escapeHtml(s.expected)}`).join(" | ")}
            </div>
          </div>
        `;
      }).join("");
    }
  }

  window.openDevFixModalForTest = function(tcId) {
    const defect = StorageManager.getDefects().find(d => d.linkedTestCaseId === tcId);
    if (defect) {
      window.openDevFixModal(defect.id);
    } else {
      const newBug = StorageManager.addDefect({
        summary: `Failure investigation for ${tcId}`,
        linkedTestCaseId: tcId,
        severity: "Critical",
        priority: "P0 - Urgent",
        assignee: state.currentUser ? state.currentUser.name : "Marcus Vance",
        description: `Triggered from failed test diagnostics for ${tcId}`
      });
      window.openDevFixModal(newBug.id);
    }
  };

  // =========================================================================
  // CONFERENCE ROOM LOGIC (Live QA <-> Dev Real-Time Chat)
  // =========================================================================
  function renderConference() {
    const container = document.getElementById("conferenceMessagesContainer");
    if (!container) return;

    const currentUser = StorageManager.getCurrentUser() || state.currentUser || {
      name: state.currentPortal === "dev" ? "Dev Engineer" : "QA Tester",
      role: state.currentPortal === "dev" ? "dev" : "qa",
      roleTitle: state.currentPortal === "dev" ? "Developer" : "QA Lead",
      avatar: state.currentPortal === "dev" ? "DV" : "QA"
    };

    // Update sender indicator at bottom dock
    const avatarEl = document.getElementById("conferenceUserAvatar");
    const nameEl = document.getElementById("conferenceUserName");
    const roleBadgeEl = document.getElementById("conferenceUserRoleBadge");

    if (avatarEl) avatarEl.textContent = currentUser.avatar || (currentUser.role === "dev" ? "DV" : "QA");
    if (nameEl) nameEl.textContent = `Posting as ${currentUser.name || (currentUser.role === "dev" ? "Developer" : "QA Tester")}`;
    if (roleBadgeEl) {
      roleBadgeEl.textContent = currentUser.roleTitle || (currentUser.role === "dev" ? "Developer" : "QA Tester");
      roleBadgeEl.className = `badge ${currentUser.role === "dev" ? "badge-dev" : "badge-qa"}`;
    }

    const messages = StorageManager.getConferenceMessages();

    if (messages.length === 0) {
      container.innerHTML = `
        <div class="conference-empty-state">
          <div class="empty-icon"><i class="fa-solid fa-comments"></i></div>
          <h3>Conference Room Ready</h3>
          <p class="text-sm text-muted">No messages posted yet. Use the input below or select a quick prompt to start the real-time discussion between Testers and Developers.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = messages.map(msg => {
      const isDev = msg.senderRole === "dev" || (msg.roleTitle && msg.roleTitle.toLowerCase().includes("dev"));
      const isMe = (currentUser && currentUser.id && msg.senderId === currentUser.id) ||
                   (currentUser && currentUser.name && msg.senderName === currentUser.name) ||
                   (currentUser && currentUser.role === msg.senderRole && !msg.senderId);

      const roleClass = isDev ? "role-dev" : "role-qa";
      const roleBadgeText = msg.roleTitle || (isDev ? "Developer" : "QA Tester");
      const avatarLetters = msg.senderAvatar || (isDev ? "DV" : "QA");

      // Format text: convert #BUG-xxx or #TC-xxx to interactive pill tags
      let formattedText = escapeHtml(msg.text);
      formattedText = formattedText.replace(/#?(BUG-\d+)/gi, '<span class="conference-tag-pill conference-bug-pill" onclick="window.handleConferenceTagClick(\'$1\')" title="View Defect $1"><i class="fa-solid fa-bug"></i> $1</span>');
      formattedText = formattedText.replace(/#?(TC-\d+)/gi, '<span class="conference-tag-pill conference-tc-pill" onclick="window.handleConferenceTagClick(\'$1\')" title="View Test Case $1"><i class="fa-solid fa-vial"></i> $1</span>');

      return `
        <div class="conference-msg-row ${roleClass} ${isMe ? 'is-me' : ''}" data-msg-id="${msg.id}">
          <div class="conference-msg-avatar ${roleClass}">
            <span>${escapeHtml(avatarLetters)}</span>
          </div>
          <div class="conference-msg-content">
            <div class="conference-msg-header">
              <span class="sender-name">${escapeHtml(msg.senderName || 'Team Member')}</span>
              <span class="role-pill ${roleClass}"><i class="fa-solid ${isDev ? 'fa-laptop-code' : 'fa-flask-vial'}"></i> ${escapeHtml(roleBadgeText)}</span>
              <span class="msg-time"><i class="fa-regular fa-clock"></i> ${escapeHtml(msg.time || '')}</span>
            </div>
            <div class="conference-msg-bubble">
              ${formattedText}
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Scroll to bottom smoothly
    container.scrollTop = container.scrollHeight;
  }

  window.handleConferenceTagClick = function(tagId) {
    if (!tagId) return;
    tagId = tagId.toUpperCase();
    if (tagId.startsWith("BUG-")) {
      if (state.currentPortal === "dev") {
        switchView("dev-kanban");
      } else {
        switchView("defects");
      }
    } else if (tagId.startsWith("TC-")) {
      switchView("test-cases");
    }
  };

  function handleSendConferenceMessage() {
    const input = document.getElementById("conferenceInput");
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const currentUser = StorageManager.getCurrentUser() || state.currentUser || {
      id: state.currentPortal === "dev" ? "dev-usr" : "qa-usr",
      name: state.currentPortal === "dev" ? "Developer" : "QA Tester",
      role: state.currentPortal === "dev" ? "dev" : "qa",
      roleTitle: state.currentPortal === "dev" ? "Software Engineer" : "QA Lead",
      avatar: state.currentPortal === "dev" ? "DV" : "QA"
    };

    StorageManager.addConferenceMessage({
      senderId: currentUser.id || "usr-" + Date.now(),
      senderName: currentUser.name || (currentUser.role === "dev" ? "Developer" : "QA Tester"),
      senderRole: currentUser.role || (state.currentPortal === "dev" ? "dev" : "qa"),
      roleTitle: currentUser.roleTitle || (currentUser.role === "dev" ? "Software Engineer" : "QA Tester"),
      senderAvatar: currentUser.avatar || (currentUser.role === "dev" ? "DV" : "QA"),
      text: text
    });

    input.value = "";
    input.style.height = "auto";
    renderConference();
  }

  function initConferenceRoom() {
    const form = document.getElementById("conferenceForm");
    const input = document.getElementById("conferenceInput");
    const sendBtn = document.getElementById("conferenceSendBtn");
    const refreshBtn = document.getElementById("conferenceRefreshBtn");
    const clearBtn = document.getElementById("conferenceClearBtn");

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        handleSendConferenceMessage();
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener("click", (e) => {
        e.preventDefault();
        handleSendConferenceMessage();
      });
    }

    if (input) {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSendConferenceMessage();
        }
      });

      // Auto-grow height on multiline input
      input.addEventListener("input", () => {
        input.style.height = "auto";
        input.style.height = Math.min(input.scrollHeight, 120) + "px";
      });
    }

    // Quick prompt chips
    document.querySelectorAll(".conference-quick-chips .quick-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const text = chip.getAttribute("data-text");
        if (input && text) {
          input.value = text;
          input.focus();
          input.style.height = "auto";
          input.style.height = Math.min(input.scrollHeight, 120) + "px";
        }
      });
    });

    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        renderConference();
        showToast("Conference messages updated!");
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to clear the conference chat history? This will be cleared for both Devs and QA.")) {
          StorageManager.clearConferenceMessages();
          renderConference();
          showToast("Conference chat cleared.");
        }
      });
    }

    // Subscribe to cross-tab & storage broadcasts
    StorageManager.subscribe((msg) => {
      if (!msg) return;
      if (msg.type === "CONFERENCE_MESSAGE") {
        if (state.currentView === "conference") {
          renderConference();
        } else {
          // Highlight the sidebar pill badge
          const badge = document.getElementById("conferenceNavBadge") || document.getElementById("devConferenceNavBadge");
          if (badge) {
            badge.classList.add("pulse-highlight");
            badge.textContent = "New";
            setTimeout(() => {
              badge.textContent = "Live";
              badge.classList.remove("pulse-highlight");
            }, 6000);
          }
        }
      } else if (msg.type === "CONFERENCE_CLEARED") {
        if (state.currentView === "conference") {
          renderConference();
        }
      }
    });
  }

  // =========================================================================
  // QA PORTAL LOGIC (Analytics, Repository, Runner, Defects, AI Generator)
  // =========================================================================
  function renderDashboard() {
    checkRetestBanner();
    const cases = StorageManager.getTestCases();
    const defects = StorageManager.getDefects();
    const suites = StorageManager.getSuites();
    const runs = StorageManager.getTestRuns();

    const total = cases.length;
    const passed = cases.filter(c => c.status === "Passed").length;
    const failed = cases.filter(c => c.status === "Failed").length;
    const blocked = cases.filter(c => c.status === "Blocked").length;
    const untested = cases.filter(c => c.status === "Untested").length;

    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    const untestedPercent = total > 0 ? Math.round((untested / total) * 100) : 0;

    const openBugs = defects.filter(d => d.status !== "Closed" && d.status !== "Resolved & Verified");
    const criticalBugs = openBugs.filter(d => d.severity === "Critical" || d.priority.includes("P0"));

    if (DOM.kpiTotalTests) DOM.kpiTotalTests.textContent = total;
    if (DOM.kpiPassRate) DOM.kpiPassRate.textContent = `${passRate}%`;
    if (DOM.kpiPassRateProgress) DOM.kpiPassRateProgress.style.width = `${passRate}%`;

    if (DOM.kpiUntestedCount) DOM.kpiUntestedCount.textContent = untested;
    if (DOM.kpiUntestedSub) DOM.kpiUntestedSub.textContent = `${untested} awaiting manual test`;
    if (DOM.kpiUntestedProgress) DOM.kpiUntestedProgress.style.width = `${untestedPercent}%`;

    // Backward-compatibility
    if (DOM.kpiAutomationRate) DOM.kpiAutomationRate.textContent = `${untested}`;
    if (DOM.kpiAutoCount) DOM.kpiAutoCount.textContent = `${untested} Pending`;
    if (DOM.kpiAutoProgress) DOM.kpiAutoProgress.style.width = `${untestedPercent}%`;

    if (DOM.kpiDefectsCount) DOM.kpiDefectsCount.textContent = openBugs.length;
    if (DOM.kpiCriticalDefects) DOM.kpiCriticalDefects.textContent = `${criticalBugs.length} Critical Blocker${criticalBugs.length === 1 ? '' : 's'}`;

    if (DOM.testCaseCountBadge) DOM.testCaseCountBadge.textContent = total;
    if (DOM.defectCountBadge) DOM.defectCountBadge.textContent = openBugs.length;

    renderDonutChart(passed, failed, blocked, untested, total);
    renderModuleHealth(suites, cases);
    renderRecentRuns(runs);
    renderPriorityBreakdown(cases);
  }

  function renderDonutChart(passed, failed, blocked, untested, total) {
    if (!DOM.testStatusDonut) return;
    if (total === 0) {
      DOM.testStatusDonut.innerHTML = `<svg viewBox="0 0 36 36" class="donut"><circle cx="18" cy="18" r="15.915" fill="none" stroke="#1e293b" stroke-width="3"></circle></svg>`;
      if (DOM.donutCenterVal) DOM.donutCenterVal.textContent = "0%";
      if (DOM.statusLegend) DOM.statusLegend.innerHTML = `<div class="text-muted text-sm">No test cases available</div>`;
      return;
    }

    const pPassed = (passed / total) * 100;
    const pFailed = (failed / total) * 100;
    const pBlocked = (blocked / total) * 100;
    const pUntested = (untested / total) * 100;

    const offsetPassed = 25;
    const offsetFailed = offsetPassed - pPassed;
    const offsetBlocked = offsetFailed - pFailed;
    const offsetUntested = offsetBlocked - pBlocked;

    DOM.testStatusDonut.innerHTML = `
      <svg viewBox="0 0 36 36" class="donut" style="transform: rotate(0deg); width: 100%; height: 100%;">
        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#101728" stroke-width="4"></circle>
        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" stroke-width="4" stroke-dasharray="${pPassed} ${100 - pPassed}" stroke-dashoffset="${offsetPassed}"></circle>
        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f43f5e" stroke-width="4" stroke-dasharray="${pFailed} ${100 - pFailed}" stroke-dashoffset="${offsetFailed}"></circle>
        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" stroke-width="4" stroke-dasharray="${pBlocked} ${100 - pBlocked}" stroke-dashoffset="${offsetBlocked}"></circle>
        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#475569" stroke-width="4" stroke-dasharray="${pUntested} ${100 - pUntested}" stroke-dashoffset="${offsetUntested}"></circle>
      </svg>
    `;
    if (DOM.donutCenterVal) DOM.donutCenterVal.textContent = `${Math.round(((passed + failed + blocked) / total) * 100)}%`;

    if (DOM.statusLegend) {
      DOM.statusLegend.innerHTML = `
        <div class="legend-item">
          <div class="legend-left"><span class="legend-color-dot" style="background: #10b981;"></span> <span>Passed</span></div>
          <span class="legend-val text-emerald">${passed} (${Math.round(pPassed)}%)</span>
        </div>
        <div class="legend-item">
          <div class="legend-left"><span class="legend-color-dot" style="background: #f43f5e;"></span> <span>Failed</span></div>
          <span class="legend-val text-rose">${failed} (${Math.round(pFailed)}%)</span>
        </div>
        <div class="legend-item">
          <div class="legend-left"><span class="legend-color-dot" style="background: #f59e0b;"></span> <span>Blocked</span></div>
          <span class="legend-val text-amber">${blocked} (${Math.round(pBlocked)}%)</span>
        </div>
        <div class="legend-item">
          <div class="legend-left"><span class="legend-color-dot" style="background: #475569;"></span> <span>Untested</span></div>
          <span class="legend-val text-muted">${untested} (${Math.round(pUntested)}%)</span>
        </div>
      `;
    }
  }

  function renderModuleHealth(suites, cases) {
    if (!DOM.moduleHealthList) return;
    if (suites.length === 0) {
      DOM.moduleHealthList.innerHTML = `<div class="text-muted text-sm">No suites created yet.</div>`;
      return;
    }

    DOM.moduleHealthList.innerHTML = suites.slice(0, 5).map(suite => {
      const suiteCases = cases.filter(c => c.suiteId === suite.id);
      const total = suiteCases.length;
      const passed = suiteCases.filter(c => c.status === "Passed").length;
      const rate = total > 0 ? Math.round((passed / total) * 100) : 0;
      let barColor = rate < 50 ? "bg-rose" : rate < 70 ? "bg-amber" : "bg-emerald";

      return `
        <div class="module-health-item">
          <div class="module-health-header">
            <span class="module-health-name"><i class="${suite.icon || 'fa-solid fa-folder'} text-primary" style="margin-right: 6px;"></i> ${suite.name}</span>
            <span class="module-health-meta">${passed}/${total} Passed (${rate}%)</span>
          </div>
          <div class="module-health-bar">
            <div class="module-health-fill ${barColor}" style="width: ${rate}%;"></div>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderRecentRuns(runs) {
    if (!DOM.recentRunsTableBody) return;
    if (runs.length === 0) {
      DOM.recentRunsTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No test runs executed.</td></tr>`;
      return;
    }

    DOM.recentRunsTableBody.innerHTML = runs.slice(0, 4).map(run => {
      const total = run.testCaseIds.length;
      const passed = Object.values(run.results || {}).filter(r => r.status === "Passed").length;
      const executed = Object.values(run.results || {}).filter(r => r.status && r.status !== "Untested").length;
      const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
      let statusBadge = run.status === "Completed" ? `<span class="badge badge-passed">Completed</span>` : `<span class="badge badge-active">In Progress</span>`;

      return `
        <tr onclick="switchView('test-cases')">
          <td>
            <strong>${run.name}</strong>
            <div class="text-muted text-xs">${run.id} • ${run.date}</div>
          </td>
          <td><span class="badge badge-secondary">${run.environment}</span></td>
          <td><span class="font-mono">${executed} / ${total}</span></td>
          <td><strong class="${passRate >= 90 ? 'text-emerald' : 'text-amber'}">${passRate}%</strong></td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join("");
  }

  function renderPriorityBreakdown(cases) {
    if (!DOM.priorityBreakdown) return;
    const p0 = cases.filter(c => c.priority.includes("P0")).length;
    const p1 = cases.filter(c => c.priority.includes("P1")).length;
    const p2 = cases.filter(c => c.priority.includes("P2")).length;
    const p3 = cases.filter(c => c.priority.includes("P3")).length;
    const total = cases.length || 1;

    const priorities = [
      { label: "P0 - Critical", count: p0, badge: "badge-p0", bar: "bg-rose" },
      { label: "P1 - High", count: p1, badge: "badge-p1", bar: "bg-amber" },
      { label: "P2 - Medium", count: p2, badge: "badge-p2", bar: "bg-indigo" },
      { label: "P3 - Low", count: p3, badge: "badge-p3", bar: "bg-cyan" }
    ];

    DOM.priorityBreakdown.innerHTML = priorities.map(p => `
      <div class="priority-row">
        <div class="priority-badge-col"><span class="badge ${p.badge}">${p.label}</span></div>
        <div class="priority-bar-col">
          <div class="kpi-progress-bar">
            <div class="kpi-progress-fill ${p.bar}" style="width: ${(p.count / total) * 100}%;"></div>
          </div>
        </div>
        <div class="priority-count-col">${p.count} tests</div>
      </div>
    `).join("");
  }

  on(DOM.refreshMetricsBtn, "click", () => {
    renderDashboard();
    showToast("Dashboard metrics refreshed");
  });

  on(DOM.exportDashboardReportBtn, "click", () => {
    const cases = StorageManager.getTestCases();
    const defects = StorageManager.getDefects();
    const passCount = cases.filter(c => c.status === "Passed").length;
    const passRate = cases.length > 0 ? Math.round((passCount / cases.length) * 100) : 0;

    const report = `# NexusQA Test Execution Quality Report
**Generated Date:** ${new Date().toLocaleString()}
**Overall Pass Rate:** ${passRate}% (${passCount}/${cases.length} tests)
**Open Defects:** ${defects.filter(d => d.status === "Open").length}

## Test Suite Summary
${StorageManager.getSuites().map(s => {
  const sCases = cases.filter(c => c.suiteId === s.id);
  const sPass = sCases.filter(c => c.status === "Passed").length;
  return `- **${s.name}**: ${sPass}/${sCases.length} Passed (${sCases.length > 0 ? Math.round((sPass/sCases.length)*100) : 0}%)`;
}).join("\n")}

## Active Defects
${defects.map(d => `- [${d.id}] (${d.severity}) ${d.summary} - Status: ${d.status} (Dev: ${d.assignee || 'Unassigned'})`).join("\n")}
`;
    downloadFile("nexusqa-executive-report.md", report, "text/markdown");
    showToast("Executive QA Markdown Report downloaded!");
  });

  // Repository & Test Cases
  function renderRepository() {
    renderSuitesSidebar();
    populateSuiteDropdowns();
    renderTestCaseTable();
  }

  function renderSuitesSidebar() {
    if (!DOM.suiteNavList) return;
    const suites = StorageManager.getSuites();
    const cases = StorageManager.getTestCases();
    const filterQuery = DOM.suiteSearchInput ? DOM.suiteSearchInput.value.toLowerCase() : "";

    let filtered = suites;
    if (filterQuery) {
      filtered = suites.filter(s => s.name.toLowerCase().includes(filterQuery) || s.description.toLowerCase().includes(filterQuery));
    }

    let html = `
      <div class="suite-item ${state.selectedSuiteId === 'all' ? 'active' : ''}" data-suite-id="all">
        <span class="suite-item-name"><i class="fa-solid fa-layer-group"></i> All Test Cases</span>
        <span class="suite-count">${cases.length}</span>
      </div>
    `;

    filtered.forEach(suite => {
      const suiteCases = cases.filter(c => c.suiteId === suite.id);
      const isSelected = state.selectedSuiteId === suite.id;
      html += `
        <div class="suite-item ${isSelected ? 'active' : ''}" data-suite-id="${suite.id}">
          <span class="suite-item-name"><i class="${suite.icon || 'fa-solid fa-folder'}"></i> ${suite.name}</span>
          <span class="suite-count">${suiteCases.length}</span>
        </div>
      `;
    });

    DOM.suiteNavList.innerHTML = html;

    DOM.suiteNavList.querySelectorAll(".suite-item").forEach(item => {
      item.addEventListener("click", () => {
        state.selectedSuiteId = item.getAttribute("data-suite-id");
        DOM.suiteNavList.querySelectorAll(".suite-item").forEach(i => i.classList.remove("active"));
        item.classList.add("active");
        renderTestCaseTable();
      });
    });

    const activeCases = state.selectedSuiteId === "all" ? cases : cases.filter(c => c.suiteId === state.selectedSuiteId);
    if (DOM.selectedSuiteTestCount) DOM.selectedSuiteTestCount.textContent = activeCases.length;
    if (DOM.selectedSuiteAutoCount) DOM.selectedSuiteAutoCount.textContent = activeCases.filter(c => c.type === "Automated" || c.type === "API" || c.type === "E2E").length;
  }

  on(DOM.suiteSearchInput, "input", () => renderSuitesSidebar());

  function populateSuiteDropdowns() {
    const suites = StorageManager.getSuites();
    const options = suites.map(s => `<option value="${s.id}">${s.name}</option>`).join("");
    if (DOM.tcSuite) DOM.tcSuite.innerHTML = options;
    if (DOM.aiTargetSuiteSelect) DOM.aiTargetSuiteSelect.innerHTML = options;
  }

  function getFilteredTestCases() {
    let cases = StorageManager.getTestCases();
    if (state.selectedSuiteId !== "all") cases = cases.filter(c => c.suiteId === state.selectedSuiteId);
    if (state.filterStatus !== "all") cases = cases.filter(c => c.status === state.filterStatus);
    if (state.filterPriority !== "all") cases = cases.filter(c => c.priority === state.filterPriority);
    if (state.filterType !== "all") cases = cases.filter(c => c.type === state.filterType);

    if (state.searchQuery) {
      const q = state.searchQuery;
      cases = cases.filter(c => 
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (c.tags && c.tags.some(t => t.toLowerCase().includes(q))) ||
        (c.preconditions && c.preconditions.toLowerCase().includes(q)) ||
        (c.steps && c.steps.some(s => s.action.toLowerCase().includes(q) || s.expected.toLowerCase().includes(q)))
      );
    }

    cases.sort((a, b) => {
      let valA = a[state.sortField] || "";
      let valB = b[state.sortField] || "";
      if (state.sortField === "id") {
        const numA = parseInt(a.id.replace("TC-", ""), 10) || 0;
        const numB = parseInt(b.id.replace("TC-", ""), 10) || 0;
        return state.sortAsc ? numA - numB : numB - numA;
      }
      if (valA < valB) return state.sortAsc ? -1 : 1;
      if (valA > valB) return state.sortAsc ? 1 : -1;
      return 0;
    });
    return cases;
  }

  function renderTestCaseTable() {
    if (!DOM.testCasesTableBody) return;
    const suites = StorageManager.getSuites();
    const suiteMap = new Map(suites.map(s => [s.id, s.name]));
    const allCases = StorageManager.getTestCases();
    const filteredCases = getFilteredTestCases();

    if (DOM.showingCount) DOM.showingCount.textContent = filteredCases.length;
    if (DOM.totalTestsCount) DOM.totalTestsCount.textContent = allCases.length;

    if (DOM.statPassed) DOM.statPassed.textContent = allCases.filter(c => c.status === "Passed").length;
    if (DOM.statFailed) DOM.statFailed.textContent = allCases.filter(c => c.status === "Failed").length;
    if (DOM.statBlocked) DOM.statBlocked.textContent = allCases.filter(c => c.status === "Blocked").length;
    if (DOM.statUntested) DOM.statUntested.textContent = allCases.filter(c => c.status === "Untested").length;

    if (filteredCases.length === 0) {
      DOM.testCasesTableBody.innerHTML = "";
      if (DOM.testCaseEmptyState) DOM.testCaseEmptyState.style.display = "block";
      updateBatchBar();
      return;
    }

    if (DOM.testCaseEmptyState) DOM.testCaseEmptyState.style.display = "none";

    DOM.testCasesTableBody.innerHTML = filteredCases.map(tc => {
      const isChecked = state.selectedTestCaseIds.has(tc.id);
      const suiteName = suiteMap.get(tc.suiteId) || "General Suite";

      let statusClass = tc.status === "Passed" ? "badge-passed" : tc.status === "Failed" ? "badge-failed" : tc.status === "Blocked" ? "badge-blocked" : "badge-untested";
      let prioClass = tc.priority.includes("P0") ? "badge-p0" : tc.priority.includes("P1") ? "badge-p1" : tc.priority.includes("P3") ? "badge-p3" : "badge-p2";
      const tagsHtml = (tc.tags || []).map(t => `<span class="tag-pill">#${t}</span>`).join("");

      return `
        <tr data-tc-id="${tc.id}" class="${isChecked ? 'row-selected' : ''}">
          <td class="col-checkbox" onclick="event.stopPropagation()">
            <input type="checkbox" class="nexus-checkbox tc-select-checkbox" data-id="${tc.id}" ${isChecked ? 'checked' : ''}>
          </td>
          <td class="col-id" onclick="window.viewTestCaseDetail('${tc.id}')">
            <span class="test-id-pill">${tc.id}</span>
          </td>
          <td class="col-title" onclick="window.viewTestCaseDetail('${tc.id}')">
            <div class="test-title-cell">
              ${escapeHtml(tc.title)}
              ${tc.image ? '<span class="badge badge-version" style="font-size:9px; margin-left:6px; vertical-align:middle;" title="Reference image attached"><i class="fa-solid fa-image"></i> Image</span>' : ''}
            </div>
            <div class="test-tags-row">${tagsHtml}</div>
          </td>
          <td class="col-suite" onclick="window.viewTestCaseDetail('${tc.id}')">
            <span class="text-muted text-xs"><i class="fa-solid fa-folder text-dim"></i> ${escapeHtml(suiteName)}</span>
          </td>
          <td class="col-priority" onclick="window.viewTestCaseDetail('${tc.id}')">
            <span class="badge ${prioClass}">${tc.priority}</span>
          </td>
          <td class="col-type" onclick="window.viewTestCaseDetail('${tc.id}')">
            <span class="badge badge-type">${escapeHtml(tc.type || 'Functional')}</span>
          </td>
          <td class="col-status" onclick="window.viewTestCaseDetail('${tc.id}')">
            <span class="badge ${statusClass}"><i class="fa-solid fa-circle" style="font-size: 6px;"></i> ${tc.status}</span>
          </td>
          <td class="col-actions" onclick="event.stopPropagation()">
            <div class="d-flex justify-end align-center gap-1">
              <button class="icon-btn-xs" title="Quick Mark as Passed" onclick="window.markTestCaseStatus('${tc.id}', 'Passed')">
                <i class="fa-solid fa-check text-emerald"></i>
              </button>
              <button class="icon-btn-xs" title="Edit Test Case" onclick="window.openEditTestCaseModal('${tc.id}')">
                <i class="fa-solid fa-pen text-primary"></i>
              </button>
              ${createDeleteButtonHtml({ onClick: `window.deleteSingleTestCase('${tc.id}')`, title: `Delete test case ${tc.id}`, isCompact: true })}
            </div>
          </td>
        </tr>
      `;
    }).join("");

    DOM.testCasesTableBody.querySelectorAll(".tc-select-checkbox").forEach(cb => {
      cb.addEventListener("change", (e) => {
        const id = e.target.getAttribute("data-id");
        if (e.target.checked) state.selectedTestCaseIds.add(id);
        else state.selectedTestCaseIds.delete(id);
        updateBatchBar();
      });
    });

    updateBatchBar();
  }

  function updateBatchBar() {
    if (!DOM.batchActionBar) return;
    const count = state.selectedTestCaseIds.size;
    if (DOM.selectedCountBadge) DOM.selectedCountBadge.textContent = `${count} test case${count === 1 ? '' : 's'} selected`;
    DOM.batchActionBar.style.display = count > 0 ? "flex" : "none";
    if (DOM.selectAllCheckbox) DOM.selectAllCheckbox.checked = count > 0 && count === getFilteredTestCases().length;
  }

  on(DOM.selectAllCheckbox, "change", (e) => {
    const filtered = getFilteredTestCases();
    if (e.target.checked) filtered.forEach(tc => state.selectedTestCaseIds.add(tc.id));
    else state.selectedTestCaseIds.clear();
    renderTestCaseTable();
  });

  on(DOM.testCaseSearchInput, "input", (e) => {
    state.searchQuery = e.target.value.trim().toLowerCase();
    renderTestCaseTable();
  });
  on(DOM.filterStatus, "change", (e) => { state.filterStatus = e.target.value; renderTestCaseTable(); });
  on(DOM.filterPriority, "change", (e) => { state.filterPriority = e.target.value; renderTestCaseTable(); });
  on(DOM.filterType, "change", (e) => { state.filterType = e.target.value; renderTestCaseTable(); });

  on(DOM.resetFiltersBtn, "click", () => {
    if (DOM.testCaseSearchInput) DOM.testCaseSearchInput.value = "";
    if (DOM.filterStatus) DOM.filterStatus.value = "all";
    if (DOM.filterPriority) DOM.filterPriority.value = "all";
    if (DOM.filterType) DOM.filterType.value = "all";
    state.searchQuery = "";
    state.filterStatus = "all";
    state.filterPriority = "all";
    state.filterType = "all";
    state.selectedSuiteId = "all";
    renderSuitesSidebar();
    renderTestCaseTable();
    showToast("Filters reset");
  });

  document.querySelectorAll("#testCasesTable th.sortable").forEach(th => {
    th.addEventListener("click", () => {
      const field = th.getAttribute("data-sort");
      if (state.sortField === field) state.sortAsc = !state.sortAsc;
      else { state.sortField = field; state.sortAsc = true; }
      renderTestCaseTable();
    });
  });

  on(DOM.batchRunBtn, "click", () => {
    const selectedIds = Array.from(state.selectedTestCaseIds);
    if (selectedIds.length === 0) return;
    const run = StorageManager.createTestRun(`Custom Execution (${selectedIds.length} Tests)`, "Staging", selectedIds);
    state.selectedTestCaseIds.clear();
    renderTestCaseTable();
    showToast(`Test Run ${run.id} created with ${selectedIds.length} tests!`);
  });

  on(DOM.batchPassBtn, "click", () => {
    const selectedIds = Array.from(state.selectedTestCaseIds);
    StorageManager.updateMultipleTestCaseStatuses(selectedIds, "Passed");
    state.selectedTestCaseIds.clear();
    renderTestCaseTable();
    showToast(`Marked ${selectedIds.length} tests as Passed`);
  });

  on(DOM.batchFailBtn, "click", () => {
    const selectedIds = Array.from(state.selectedTestCaseIds);
    StorageManager.updateMultipleTestCaseStatuses(selectedIds, "Failed");
    state.selectedTestCaseIds.clear();
    renderTestCaseTable();
    showToast(`Marked ${selectedIds.length} tests as Failed`, "error");
  });

  on(DOM.batchBlockBtn, "click", () => {
    const selectedIds = Array.from(state.selectedTestCaseIds);
    StorageManager.updateMultipleTestCaseStatuses(selectedIds, "Blocked");
    state.selectedTestCaseIds.clear();
    renderTestCaseTable();
    showToast(`Marked ${selectedIds.length} tests as Blocked`, "warning");
  });

  on(DOM.batchDeleteBtn, "click", () => {
    const selectedIds = Array.from(state.selectedTestCaseIds);
    if (confirm(`Are you sure you want to delete ${selectedIds.length} test cases?`)) {
      StorageManager.deleteMultipleTestCases(selectedIds);
      state.selectedTestCaseIds.clear();
      renderTestCaseTable();
      renderSuitesSidebar();
      showToast(`Deleted ${selectedIds.length} test cases`, "info");
    }
  });

  function renderStepRows(steps = []) {
    if (!DOM.stepsBuilderList) return;
    DOM.stepsBuilderList.innerHTML = "";
    if (steps.length === 0) steps = [{ step: 1, action: "", expected: "" }];
    steps.forEach((s, idx) => addStepRow(s.action, s.expected, idx + 1));
  }

  function addStepRow(actionVal = "", expectedVal = "", stepNum = null) {
    if (!DOM.stepsBuilderList) return;
    const currentRows = DOM.stepsBuilderList.querySelectorAll(".step-builder-row");
    const num = stepNum || currentRows.length + 1;
    const row = document.createElement("div");
    row.className = "step-builder-row";
    row.innerHTML = `
      <span class="step-num-badge">${num}</span>
      <input type="text" class="nexus-input step-input-action" placeholder="Step ${num} Action / Input..." value="${escapeHtml(actionVal)}" required>
      <input type="text" class="nexus-input step-input-expected" placeholder="Expected Verification Result..." value="${escapeHtml(expectedVal)}" required>
      <button type="button" class="icon-btn-xs remove-step-btn" title="Remove Step"><i class="fa-solid fa-xmark text-rose"></i></button>
    `;
    row.querySelector(".remove-step-btn").addEventListener("click", () => {
      row.remove();
      renumberSteps();
    });
    DOM.stepsBuilderList.appendChild(row);
  }

  function renumberSteps() {
    if (!DOM.stepsBuilderList) return;
    DOM.stepsBuilderList.querySelectorAll(".step-builder-row").forEach((row, i) => {
      row.querySelector(".step-num-badge").textContent = i + 1;
    });
  }

  on(DOM.addStepBtn, "click", () => addStepRow());

  // Test Case Reference Image Attachment Controller
  state.currentTcImage = "";

  function setTestCaseImagePreview(dataUrl, fileName = "reference-screenshot.png") {
    state.currentTcImage = dataUrl || "";
    if (dataUrl) {
      if (DOM.tcImagePreview) DOM.tcImagePreview.src = dataUrl;
      if (DOM.tcViewImageFullBtn) DOM.tcViewImageFullBtn.href = dataUrl;
      if (DOM.tcImageFileName) DOM.tcImageFileName.textContent = fileName;
      if (DOM.tcImagePreviewWrap) DOM.tcImagePreviewWrap.style.display = "flex";
      if (DOM.tcImageDropzone) DOM.tcImageDropzone.style.display = "none";
    } else {
      if (DOM.tcImagePreview) DOM.tcImagePreview.src = "";
      if (DOM.tcImagePreviewWrap) DOM.tcImagePreviewWrap.style.display = "none";
      if (DOM.tcImageDropzone) DOM.tcImageDropzone.style.display = "flex";
      if (DOM.tcImageFileInput) DOM.tcImageFileInput.value = "";
    }
  }

  if (DOM.tcImageFileInput) {
    DOM.tcImageFileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image size exceeds 5MB limit. Please choose a smaller file.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setTestCaseImagePreview(event.target.result, file.name);
        showToast("Reference image attached to test case!", "success");
      };
      reader.readAsDataURL(file);
    });
  }

  if (DOM.tcImageUploadBox) {
    DOM.tcImageUploadBox.addEventListener("dragover", (e) => {
      e.preventDefault();
      DOM.tcImageUploadBox.classList.add("drag-over");
    });
    DOM.tcImageUploadBox.addEventListener("dragleave", () => {
      DOM.tcImageUploadBox.classList.remove("drag-over");
    });
    DOM.tcImageUploadBox.addEventListener("drop", (e) => {
      e.preventDefault();
      DOM.tcImageUploadBox.classList.remove("drag-over");
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        if (file.size > 5 * 1024 * 1024) {
          showToast("Image size exceeds 5MB limit.", "error");
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          setTestCaseImagePreview(event.target.result, file.name);
          showToast("Reference image attached!", "success");
        };
        reader.readAsDataURL(file);
      }
    });
  }

  on(DOM.tcRemoveImageBtn, "click", () => {
    setTestCaseImagePreview("");
    showToast("Attached image removed", "info");
  });

  function openCreateTestCaseModal() {
    if (DOM.testCaseForm) DOM.testCaseForm.reset();
    if (DOM.editTestCaseId) DOM.editTestCaseId.value = "";
    if (DOM.testCaseModalTitle) DOM.testCaseModalTitle.textContent = "Create New Test Case";
    setTestCaseImagePreview("");
    populateSuiteDropdowns();
    if (DOM.tcSuite && state.selectedSuiteId !== "all") DOM.tcSuite.value = state.selectedSuiteId;
    renderStepRows([
      { step: 1, action: "Navigate to target view or endpoint", expected: "Page/response loads correctly with status 200" },
      { step: 2, action: "Trigger action with parameters", expected: "State updates properly and confirmation returned" }
    ]);
    if (DOM.editTestCaseDeleteWrap) DOM.editTestCaseDeleteWrap.style.display = "none";
    if (DOM.testCaseModal) DOM.testCaseModal.style.display = "flex";
  }

  window.openEditTestCaseModal = function(id) {
    const tc = StorageManager.getTestCaseById(id);
    if (!tc) return;
    if (DOM.testCaseForm) DOM.testCaseForm.reset();
    if (DOM.editTestCaseId) DOM.editTestCaseId.value = tc.id;
    if (DOM.testCaseModalTitle) DOM.testCaseModalTitle.textContent = `Edit Test Case: ${tc.id}`;
    if (DOM.tcTitle) DOM.tcTitle.value = tc.title;
    setTestCaseImagePreview(tc.image || "", (tc.id || "test") + "-reference.png");
    populateSuiteDropdowns();
    if (DOM.tcSuite) DOM.tcSuite.value = tc.suiteId;
    if (DOM.tcPriority) DOM.tcPriority.value = tc.priority;
    if (DOM.tcType) DOM.tcType.value = tc.type;
    if (DOM.tcStatus) DOM.tcStatus.value = tc.status;
    if (DOM.tcPreconditions) DOM.tcPreconditions.value = tc.preconditions || "";
    if (DOM.tcTags) DOM.tcTags.value = (tc.tags || []).join(", ");
    renderStepRows(tc.steps || []);
    if (DOM.editTestCaseDeleteWrap) DOM.editTestCaseDeleteWrap.style.display = "inline-flex";
    if (DOM.testCaseModal) DOM.testCaseModal.style.display = "flex";
  };

  // Auto Input Scenarios & Modal Controller
  const autoInputScenarios = [
    {
      title: "Verify OAuth 2.0 PKCE redirection and session token persistence across browser restarts",
      suiteId: "suite-auth",
      priority: "P1 - High",
      type: "Security",
      status: "Untested",
      preconditions: "User account exists with corporate Google Workspace SSO enabled; 2FA requirement enabled.",
      tags: ["auth", "oauth", "security", "session", "sso"],
      steps: [
        { step: 1, action: "Click 'Sign in with Google' on the unified landing gateway", expected: "Redirected to Google OAuth authorization consent screen with valid client_id and state token" },
        { step: 2, action: "Complete biometric credentials consent and return to callback URL", expected: "Session token stored in httpOnly secure cookie and user redirected to workspace dashboard" },
        { step: 3, action: "Close browser window, reopen browser, and navigate directly to workspace URL", expected: "User remains authenticated without re-prompting for credentials" }
      ]
    },
    {
      title: "Verify 20% discount coupon applied accurately to subtotal and tax during multi-item checkout",
      suiteId: "suite-checkout",
      priority: "P0 - Critical",
      type: "Functional",
      status: "Untested",
      preconditions: "Shopping cart contains 2 products with subtotal exceeding $50.00; coupon 'SAVE20' is active.",
      tags: ["checkout", "payments", "discount", "stripe", "cart"],
      steps: [
        { step: 1, action: "Add items SKU-101 and SKU-102 to cart and navigate to checkout screen", expected: "Order summary displays accurate subtotal before promotional deductions" },
        { step: 2, action: "Enter promo code 'SAVE20' into discount input and click Apply", expected: "Discount of -$15.00 (20%) deducted immediately, and tax recomputed on adjusted balance" },
        { step: 3, action: "Submit payment with valid test card credentials", expected: "Order confirmation view loads with status 200 and invoice receipt email triggered" }
      ]
    },
    {
      title: "Verify REST API rate limiting triggers HTTP 429 Too Many Requests after 60 requests per minute",
      suiteId: "suite-api",
      priority: "P1 - High",
      type: "Integration",
      status: "Untested",
      preconditions: "API Client token generated with standard tier rate limit (60 requests per minute).",
      tags: ["api", "rate-limit", "security", "performance"],
      steps: [
        { step: 1, action: "Dispatch 60 rapid GET requests to /api/v1/test-cases within 30 seconds", expected: "All 60 requests respond with status 200 OK and valid JSON data payload" },
        { step: 2, action: "Dispatch 61st GET request within the same 60-second window", expected: "Server responds with HTTP 429 Too Many Requests and 'Retry-After' header" }
      ]
    },
    {
      title: "Verify faceted search filters test cases simultaneously by suite, priority, and text query",
      suiteId: "suite-search",
      priority: "P2 - Medium",
      type: "Functional",
      status: "Untested",
      preconditions: "Workspace contains test cases across diverse suites, priorities, and custom tags.",
      tags: ["search", "filtering", "ui", "performance"],
      steps: [
        { step: 1, action: "Select suite 'Authentication' from left sidebar and choose priority 'P1 - High'", expected: "Table immediately filters down to only P1 test cases in the Authentication suite" },
        { step: 2, action: "Type 'password' into the global search input box", expected: "Table updates in real-time to show matching test cases containing the keyword" }
      ]
    }
  ];

  // ==========================================================================
  // CAMPUSOS CONVERSATIONAL AI QA ASSISTANT CONTROLLER
  // ==========================================================================

  let currentAttachedScreenshot = null;
  let stagedQaRecords = [];

  function populateAiSuiteDropdown() {
    if (!DOM.aiTargetSuite) return;
    const suites = StorageManager.getSuites();
    DOM.aiTargetSuite.innerHTML = suites.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("");
    if (state.selectedSuiteId && state.selectedSuiteId !== "all" && DOM.aiTargetSuite.querySelector(`option[value="${state.selectedSuiteId}"]`)) {
      DOM.aiTargetSuite.value = state.selectedSuiteId;
    }
  }

  function updateSessionBarUI() {
    if (typeof QAAssistant === "undefined") return;
    const session = QAAssistant.getSession();
    
    if (DOM.valTestRef) DOM.valTestRef.textContent = session.test_reference || "Not Set";
    if (DOM.valSide) DOM.valSide.textContent = session.side || "Student";
    if (DOM.valTrainerCount) DOM.valTrainerCount.textContent = session.trainer_question_count !== null ? session.trainer_question_count : "-";
    if (DOM.valStudentCount) DOM.valStudentCount.textContent = session.student_question_count !== null ? session.student_question_count : "-";

    const hasMismatch = session.trainer_question_count !== null && 
                        session.student_question_count !== null && 
                        session.trainer_question_count !== session.student_question_count;

    if (DOM.pillMismatch) {
      DOM.pillMismatch.style.display = hasMismatch ? "inline-flex" : "none";
    }
  }

  function appendAiUserBubble(promptText, imageMeta = null) {
    if (!DOM.aiChatStream) return;
    const row = document.createElement("div");
    row.className = "ai-message-row user-row";
    
    let imgHtml = "";
    if (imageMeta && imageMeta.data) {
      imgHtml = `
        <div style="margin-top: 6px; display: inline-flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.25); padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
          <img src="${imageMeta.data}" style="width: 32px; height: 32px; object-fit: cover; border-radius: 4px;">
          <span class="text-xs text-muted">${escapeHtml(imageMeta.name || "Screenshot")}</span>
        </div>
      `;
    }

    row.innerHTML = `
      <div class="ai-avatar user-avatar"><i class="fa-solid fa-user"></i></div>
      <div class="ai-message-bubble">
        <div class="d-flex align-center justify-between gap-2 mb-1">
          <strong style="color: var(--primary-light, #a5b4fc);">You (QA Tester)</strong>
          <span class="text-xs text-muted">Just now</span>
        </div>
        <div style="white-space: pre-wrap; font-size: 0.86rem;">${escapeHtml(promptText)}</div>
        ${imgHtml}
      </div>
    `;
    DOM.aiChatStream.appendChild(row);
    DOM.aiChatStream.scrollTop = DOM.aiChatStream.scrollHeight;
  }

  function appendAiBotBubble(result) {
    if (!DOM.aiChatStream) return;
    const row = document.createElement("div");
    row.className = "ai-message-row bot-row";

    if (result.needsClarification && result.questions && result.questions.length > 0) {
      const qHtml = result.questions.map(q => `
        <div style="background: rgba(245, 158, 11, 0.15); border-left: 3px solid #f59e0b; padding: 6px 10px; border-radius: 4px; margin-top: 6px; font-weight: 600; color: #fde68a;">
          <i class="fa-solid fa-circle-question mr-1"></i> ${escapeHtml(q)}
        </div>
      `).join("");

      row.innerHTML = `
        <div class="ai-avatar ai-bot-avatar"><i class="fa-solid fa-robot"></i></div>
        <div class="ai-message-bubble">
          <div class="d-flex align-center justify-between gap-2 mb-1">
            <strong style="color: #ffffff;">CampusOS QA Assistant</strong>
            <span class="badge badge-warning text-xs">Clarification Needed</span>
          </div>
          <p style="margin: 0; font-size: 0.86rem;">I have noted your observation. To classify and structure it accurately without guessing:</p>
          ${qHtml}
        </div>
      `;
    } else if (result.newRecords && result.newRecords.length > 0) {
      const recordsSummaryHtml = result.newRecords.map((r, i) => `
        <div style="background: rgba(255,255,255,0.03); border-radius: 6px; padding: 6px 10px; margin-top: 6px; border-left: 3px solid ${r.test_case_type === 'Bug' ? '#ef4444' : '#3b82f6'};">
          <div class="d-flex align-center justify-between">
            <span class="badge ${r.test_case_type === 'Bug' ? 'badge-failed' : 'badge-primary'} text-xs font-bold">${r.test_case_type}</span>
            <span class="text-xs text-muted">${r.test_case_id} ${r.bug_id ? `• ${r.bug_id}` : ''}</span>
          </div>
          <div style="font-size: 0.84rem; font-weight: 600; margin-top: 3px; color: #ffffff;">${escapeHtml(r.title)}</div>
          ${r.is_duplicate ? `<div class="text-xs text-emerald mt-1"><i class="fa-solid fa-link mr-1"></i> Matched existing defect <strong>${r.bug_id}</strong></div>` : ''}
          ${r.possible_duplicate ? `<div class="text-xs text-amber mt-1"><i class="fa-solid fa-copy mr-1"></i> Possible match: <strong>${r.possible_duplicate.id}</strong> (Review in right panel)</div>` : ''}
        </div>
      `).join("");

      row.innerHTML = `
        <div class="ai-avatar ai-bot-avatar"><i class="fa-solid fa-robot"></i></div>
        <div class="ai-message-bubble" style="width: 100%;">
          <div class="d-flex align-center justify-between gap-2 mb-1">
            <div class="d-flex align-center gap-2">
              <strong style="color: #ffffff;">CampusOS QA Assistant</strong>
              <span class="badge badge-success text-xs"><i class="fa-solid fa-check mr-1"></i> ${result.newRecords.length} Record${result.newRecords.length > 1 ? 's' : ''} Extracted</span>
            </div>
            <span class="text-xs text-muted">Ready for Review</span>
          </div>
          <p style="margin: 0; font-size: 0.86rem;">
            Successfully extracted structured findings! I've loaded them into the <strong>Review Panel</strong> on the right for your confirmation before saving.
          </p>
          ${recordsSummaryHtml}
        </div>
      `;
    } else {
      row.innerHTML = `
        <div class="ai-avatar ai-bot-avatar"><i class="fa-solid fa-robot"></i></div>
        <div class="ai-message-bubble">
          <div class="d-flex align-center justify-between gap-2 mb-1">
            <strong style="color: #ffffff;">CampusOS QA Assistant</strong>
            <span class="text-xs text-muted">Observation Logged</span>
          </div>
          <p style="margin: 0; font-size: 0.86rem;">
            Updated session context with your observation. You can provide more details or another message to finalize the test case.
          </p>
        </div>
      `;
    }

    DOM.aiChatStream.appendChild(row);
    DOM.aiChatStream.scrollTop = DOM.aiChatStream.scrollHeight;
  }

  function renderStagedReviewCards() {
    if (!DOM.aiReviewCardsList) return;
    const records = stagedQaRecords;

    if (DOM.stagedRecordsCountBadge) {
      const unsavedCount = records.filter(r => !r._saved).length;
      DOM.stagedRecordsCountBadge.textContent = `${unsavedCount} Pending (${records.length} Total)`;
    }

    if (DOM.aiConfirmSaveAllBtn) {
      DOM.aiConfirmSaveAllBtn.disabled = records.filter(r => !r._saved).length === 0;
    }

    if (records.length === 0) {
      DOM.aiReviewCardsList.innerHTML = `
        <div class="empty-review-placeholder" id="emptyReviewPlaceholder">
          <div class="empty-icon"><i class="fa-solid fa-clipboard-question"></i></div>
          <h4>No Records Extracted Yet</h4>
          <p class="text-xs text-muted">
            Speak or type your testing notes on the left. The AI will extract facts, expected vs actual behavior, and generate structured 22-column records here for your review and confirmation before saving.
          </p>
        </div>
      `;
      return;
    }

    DOM.aiReviewCardsList.innerHTML = records.map((rec, index) => {
      const isBug = rec.test_case_type === "Bug";
      const cardTypeClass = isBug ? "card-bug" : "card-enhancement";
      const savedClass = rec._saved ? "card-saved" : "";

      const duplicateAlertHtml = rec.possible_duplicate && !rec._duplicateResolved ? `
        <div class="duplicate-bug-alert">
          <div class="alert-top">
            <strong><i class="fa-solid fa-copy text-amber mr-1"></i> Possible Existing Bug: ${escapeHtml(rec.possible_duplicate.id)}</strong>
            <span class="badge badge-warning text-xs">Medium Confidence</span>
          </div>
          <div class="text-xs text-muted">"${escapeHtml(rec.possible_duplicate.summary || rec.possible_duplicate.title || '')}"</div>
          <div class="d-flex align-center gap-1 mt-1">
            <button type="button" class="btn btn-secondary btn-xs" onclick="window.useExistingBugForRecord(${index}, '${rec.possible_duplicate.id}')">
              <i class="fa-solid fa-link mr-1"></i> Use Existing (${rec.possible_duplicate.id})
            </button>
            <button type="button" class="btn btn-ghost btn-xs" onclick="window.keepNewBugForRecord(${index})">
              Create New Bug ID
            </button>
          </div>
        </div>
      ` : "";

      const stepsListHtml = Array.isArray(rec.steps_to_reproduce) 
        ? rec.steps_to_reproduce.map((s, si) => `<div class="text-xs text-muted"><strong>${si + 1}.</strong> ${escapeHtml(s)}</div>`).join("")
        : `<div class="text-xs text-muted">${escapeHtml(rec.steps_to_reproduce || "1. Execute test as defined")}</div>`;

      return `
        <div class="qa-review-card ${cardTypeClass} ${savedClass}" id="qaCard-${index}">
          <div class="qa-review-card-header">
            <div class="qa-review-badges">
              <span class="badge ${isBug ? 'badge-failed' : 'badge-primary'} text-xs font-bold">${rec.test_case_type}</span>
              <span class="test-id-pill">${rec.test_case_id}</span>
              ${rec.bug_id ? `<span class="badge badge-secondary text-xs"><i class="fa-solid fa-bug text-rose mr-1"></i>${rec.bug_id}</span>` : ''}
              <span class="badge badge-secondary text-xs">${rec.severity}</span>
              <span class="badge badge-subtle text-xs">${rec.side} Side</span>
              <span class="badge ${rec.test_result === 'Fail' ? 'badge-failed' : 'badge-success'} text-xs">${rec.test_result}</span>
            </div>
            ${rec._saved ? `<span class="badge badge-success text-xs"><i class="fa-solid fa-check mr-1"></i> Saved to DB</span>` : ''}
          </div>

          <div class="qa-review-title">${escapeHtml(rec.title)}</div>

          ${duplicateAlertHtml}

          <!-- Expected vs Actual Comparison -->
          <div class="qa-expected-actual-box">
            <div class="qa-expected-pane">
              <div class="qa-pane-label label-expected"><i class="fa-solid fa-circle-check mr-1"></i> Expected Result:</div>
              <div>${escapeHtml(rec.expected_result)}</div>
            </div>
            <div class="qa-actual-pane">
              <div class="qa-pane-label label-actual"><i class="fa-solid fa-circle-xmark mr-1"></i> Actual Result:</div>
              <div>${escapeHtml(rec.actual_result)}</div>
            </div>
          </div>

          ${rec.preconditions ? `<div class="text-xs text-muted"><i class="fa-solid fa-info-circle mr-1"></i><strong>Preconditions:</strong> ${escapeHtml(rec.preconditions)}</div>` : ''}

          <div class="text-xs font-bold text-muted mt-1"><i class="fa-solid fa-list-ol mr-1"></i> Steps to Reproduce:</div>
          <div class="steps-box" style="padding-left: 0.5rem; display: flex; flex-direction: column; gap: 3px;">
            ${stepsListHtml}
          </div>

          <div class="d-flex align-center justify-between flex-wrap gap-1 text-xs text-muted mt-1 pt-1" style="border-top: 1px solid rgba(255,255,255,0.06);">
            <span><strong>Reproducibility:</strong> ${escapeHtml(rec.reproducibility || 'Not Tested')}</span>
            <span><strong>Status:</strong> ${escapeHtml(rec.bug_status || 'Open')}</span>
            <span><strong>Evidence:</strong> ${escapeHtml(rec.screenshot_evidence || 'None')}</span>
          </div>

          <div class="qa-card-actions">
            <div class="d-flex align-center gap-1">
              <button type="button" class="btn btn-ghost btn-xs text-rose" onclick="window.dismissStagedRecord(${index})" title="Dismiss Record">
                <i class="fa-solid fa-trash-can"></i>
              </button>
              <button type="button" class="btn btn-secondary btn-xs" onclick="window.editStagedRecord(${index})" title="Edit in Full 22-Column Editor">
                <i class="fa-solid fa-pen-to-square mr-1"></i> Edit
              </button>
              <button type="button" class="btn btn-outline btn-xs" onclick="window.copySingleRecordTsv(${index})" title="Copy 22-Col TSV for Excel">
                <i class="fa-solid fa-file-excel text-emerald mr-1"></i> TSV
              </button>
            </div>
            <div>
              ${rec._saved ? `
                <button type="button" class="btn btn-success btn-xs" disabled>
                  <i class="fa-solid fa-check mr-1"></i> Saved
                </button>
              ` : `
                <button type="button" class="btn btn-primary btn-xs" onclick="window.confirmSaveSingleRecord(${index})">
                  <i class="fa-solid fa-cloud-arrow-up mr-1"></i> Confirm & Save
                </button>
              `}
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  function handleExecuteAiPrompt() {
    if (!DOM.aiTestCasePromptInput) return;
    const promptText = DOM.aiTestCasePromptInput.value.trim();
    if (!promptText && !currentAttachedScreenshot) {
      showToast("Please enter an observation or voice dictation first.", "warning");
      DOM.aiTestCasePromptInput.focus();
      return;
    }

    const imageToSend = currentAttachedScreenshot;
    appendAiUserBubble(promptText || "(Screenshot attached)", imageToSend);
    DOM.aiTestCasePromptInput.value = "";
    
    // Clear screenshot preview
    currentAttachedScreenshot = null;
    if (DOM.aiEvidencePreviewBar) DOM.aiEvidencePreviewBar.style.display = "none";

    if (DOM.aiStudioStatusText) {
      DOM.aiStudioStatusText.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-primary"></i> Analyzing observation & extracting facts...`;
    }

    setTimeout(() => {
      const result = QAAssistant.processTesterMessage(promptText, imageToSend);
      if (result) {
        if (result.newRecords && result.newRecords.length > 0) {
          result.newRecords.forEach(rec => {
            stagedQaRecords.push(rec);
          });
        }

        appendAiBotBubble(result);
        updateSessionBarUI();
        renderStagedReviewCards();

        if (DOM.aiStudioStatusText) {
          DOM.aiStudioStatusText.innerHTML = `<i class="fa-solid fa-circle-check text-emerald"></i> Ready • ${stagedQaRecords.length} records in review`;
        }

        if (result.newRecords && result.newRecords.length > 0) {
          showToast(`⚡ QA Assistant: Extracted ${result.newRecords.length} structured QA record(s)`, "success");
        }
      }
    }, 180);
  }

  function openAutoInputModal() {
    populateAiSuiteDropdown();
    updateSessionBarUI();
    renderStagedReviewCards();
    if (DOM.autoInputModal) DOM.autoInputModal.style.display = "flex";
    if (DOM.aiTestCasePromptInput) DOM.aiTestCasePromptInput.focus();
  }

  // Voice Dictation Controller
  if (DOM.aiVoiceDictateBtn) {
    on(DOM.aiVoiceDictateBtn, "click", () => {
      const res = QAAssistant.toggleVoiceDictation(
        (voiceResult) => {
          if (DOM.aiTestCasePromptInput && voiceResult.fullText) {
            DOM.aiTestCasePromptInput.value = voiceResult.fullText;
          }
        },
        (isRecording, error) => {
          if (DOM.voiceRecordingBanner) DOM.voiceRecordingBanner.style.display = isRecording ? "flex" : "none";
          if (DOM.aiVoiceDictateBtn) {
            if (isRecording) {
              DOM.aiVoiceDictateBtn.classList.add("recording-active");
            } else {
              DOM.aiVoiceDictateBtn.classList.remove("recording-active");
            }
          }
          if (error) {
            showToast(`Voice input: ${error}. You can type directly in the prompt box.`, "warning");
          }
        }
      );

      if (!res.supported) {
        showToast("Speech recognition is not supported in this browser. Please use Chrome/Edge or type directly.", "info");
      }
    });
  }

  if (DOM.stopVoiceBtn) {
    on(DOM.stopVoiceBtn, "click", () => {
      QAAssistant.toggleVoiceDictation();
      if (DOM.voiceRecordingBanner) DOM.voiceRecordingBanner.style.display = "none";
      if (DOM.aiVoiceDictateBtn) DOM.aiVoiceDictateBtn.classList.remove("recording-active");
      if (DOM.aiTestCasePromptInput && DOM.aiTestCasePromptInput.value.trim()) {
        handleExecuteAiPrompt();
      }
    });
  }

  // Screenshot Upload & Paste Handlers
  if (DOM.aiScreenshotFileInput) {
    DOM.aiScreenshotFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          currentAttachedScreenshot = {
            name: file.name,
            data: event.target.result,
            size: file.size
          };
          if (DOM.evidencePreviewImg) DOM.evidencePreviewImg.src = currentAttachedScreenshot.data;
          if (DOM.evidenceFileName) DOM.evidenceFileName.textContent = currentAttachedScreenshot.name;
          if (DOM.aiEvidencePreviewBar) DOM.aiEvidencePreviewBar.style.display = "block";
          showToast(`Attached evidence screenshot: ${file.name}`, "info");
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (DOM.removeEvidenceBtn) {
    on(DOM.removeEvidenceBtn, "click", () => {
      currentAttachedScreenshot = null;
      if (DOM.aiEvidencePreviewBar) DOM.aiEvidencePreviewBar.style.display = "none";
      if (DOM.aiScreenshotFileInput) DOM.aiScreenshotFileInput.value = "";
    });
  }

  // Listen for clipboard image paste inside Prompt Console
  window.addEventListener("paste", (e) => {
    if (DOM.autoInputModal && DOM.autoInputModal.style.display === "flex") {
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (let index in items) {
        const item = items[index];
        if (item.kind === 'file' && item.type.includes('image/')) {
          const blob = item.getAsFile();
          const reader = new FileReader();
          reader.onload = (event) => {
            currentAttachedScreenshot = {
              name: `Screenshot-${new Date().toLocaleTimeString().replace(/:/g, '')}.png`,
              data: event.target.result,
              size: blob.size
            };
            if (DOM.evidencePreviewImg) DOM.evidencePreviewImg.src = currentAttachedScreenshot.data;
            if (DOM.evidenceFileName) DOM.evidenceFileName.textContent = currentAttachedScreenshot.name;
            if (DOM.aiEvidencePreviewBar) DOM.aiEvidencePreviewBar.style.display = "block";
            showToast("Screenshot pasted from clipboard!", "success");
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  });

  // Quick Scenarios Chips
  const predefinedTestingScenarios = {
    "test5-mismatch": "I'm testing Test 5. It's a Fill in the Blanks task, medium difficulty, Python, 5 questions. From the trainer side there are 5 questions, but when I open it as a student I only see one.",
    "test4-bug-and-enhancement": "I'm starting Test 4. Bug Fix task, medium, Python, 3 questions. As student only one is showing. The UI is also very bad, the question should be on the left and compiler on the right.",
    "test5-duplicate-bug": "Test 5 is showing Python but the compiler has Java boilerplate.",
    "test5-unexpected-challenge": "I'm testing Test 5. Practical Coding Challenge incorrectly appears in Fill in the Blanks task."
  };

  if (DOM.aiChatStream) {
    DOM.aiChatStream.addEventListener("click", (e) => {
      const chip = e.target.closest(".ai-prompt-chip[data-scenario]");
      if (chip && DOM.aiTestCasePromptInput) {
        const key = chip.getAttribute("data-scenario");
        if (predefinedTestingScenarios[key]) {
          DOM.aiTestCasePromptInput.value = predefinedTestingScenarios[key];
          handleExecuteAiPrompt();
        }
      }
    });
  }

  // Side quick chips
  if (DOM.chipTrainerSide) {
    on(DOM.chipTrainerSide, "click", () => {
      if (DOM.aiTestCasePromptInput) {
        DOM.aiTestCasePromptInput.value += " From the Trainer side: ";
        DOM.aiTestCasePromptInput.focus();
      }
    });
  }

  if (DOM.chipStudentSide) {
    on(DOM.chipStudentSide, "click", () => {
      if (DOM.aiTestCasePromptInput) {
        DOM.aiTestCasePromptInput.value += " From the Student side: ";
        DOM.aiTestCasePromptInput.focus();
      }
    });
  }

  // Clear & Reset Session
  function handleResetAssistant() {
    QAAssistant.resetSession();
    stagedQaRecords = [];
    currentAttachedScreenshot = null;
    if (DOM.aiEvidencePreviewBar) DOM.aiEvidencePreviewBar.style.display = "none";
    if (DOM.aiChatStream) {
      DOM.aiChatStream.innerHTML = `
        <div class="ai-message-row bot-row">
          <div class="ai-avatar ai-bot-avatar"><i class="fa-solid fa-robot"></i></div>
          <div class="ai-message-bubble">
            <div class="d-flex align-center justify-between gap-2 mb-1">
              <strong style="color: var(--primary-light, #a5b4fc);">CampusOS QA AI Assistant</strong>
              <span class="badge badge-success text-xs">Ready</span>
            </div>
            <p style="margin: 0 0 0.5rem 0; font-size: 0.86rem;">
              Testing session reset. Speak or type your next observation to start a fresh context!
            </p>
            <div class="ai-chip-group">
              <button type="button" class="ai-prompt-chip" data-scenario="test5-mismatch">
                <i class="fa-solid fa-code-compare text-rose mr-1"></i> Test 5: Trainer (5 Qs) vs Student (1 Q)
              </button>
              <button type="button" class="ai-prompt-chip" data-scenario="test4-bug-and-enhancement">
                <i class="fa-solid fa-bug text-amber mr-1"></i> Test 4: Bug + Split-View Enhancement
              </button>
              <button type="button" class="ai-prompt-chip" data-scenario="test5-duplicate-bug">
                <i class="fa-solid fa-copy text-indigo mr-1"></i> Duplicate Check: BUG-037 Python/Java
              </button>
              <button type="button" class="ai-prompt-chip" data-scenario="test5-unexpected-challenge">
                <i class="fa-solid fa-triangle-exclamation text-rose mr-1"></i> Test 5: Practical Challenge in Fill-in-Blanks
              </button>
            </div>
          </div>
        </div>
      `;
    }
    updateSessionBarUI();
    renderStagedReviewCards();
    showToast("Testing session & context reset", "info");
  }

  on(DOM.clearAiChatBtn, "click", handleResetAssistant);
  on(DOM.resetSessionBtn, "click", handleResetAssistant);

  on(DOM.aiExtractSubmitBtn, "click", handleExecuteAiPrompt);

  if (DOM.aiTestCasePromptInput) {
    DOM.aiTestCasePromptInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleExecuteAiPrompt();
      }
    });
  }

  // -------------------------------------------------------------
  // Record Actions (Window Exposed Functions)
  // -------------------------------------------------------------
  window.confirmSaveSingleRecord = function(index) {
    const record = stagedQaRecords[index];
    if (!record) return;

    const targetSuiteId = (DOM.aiTargetSuite && DOM.aiTargetSuite.value) ? DOM.aiTargetSuite.value : "suite-auth";

    const testCaseData = {
      id: record.test_case_id,
      title: record.title,
      suiteId: targetSuiteId,
      priority: record.severity === "Critical" ? "P0 - Critical" : (record.severity === "Major" ? "P1 - High" : "P2 - Medium"),
      type: record.test_case_type === "Bug" ? "Functional" : "UI / UX",
      status: record.test_result === "Fail" ? "Failed" : "Passed",
      preconditions: record.preconditions || "",
      tags: [record.test_module.toLowerCase(), record.test_case_type.toLowerCase(), record.side.toLowerCase()],
      steps: Array.isArray(record.steps_to_reproduce)
        ? record.steps_to_reproduce.map((s, idx) => ({ step: idx + 1, action: s, expected: idx === record.steps_to_reproduce.length - 1 ? record.expected_result : "Verified." }))
        : [{ step: 1, action: record.steps_to_reproduce, expected: record.expected_result }],
      author: "CampusOS QA Assistant",
      createdAt: record.date || new Date().toISOString().split("T")[0]
    };

    // Save Test Case
    const saved = StorageManager.saveTestCase(testCaseData);

    // If Bug, create Defect card
    if (record.test_case_type === "Bug" && record.bug_id) {
      const existingBugs = StorageManager.getDefects();
      const alreadyExists = existingBugs.some(b => b.id === record.bug_id);
      if (!alreadyExists) {
        StorageManager.saveDefect({
          id: record.bug_id,
          summary: record.title,
          title: record.title,
          linkedTestCaseId: saved.id,
          severity: record.severity || "Major",
          priority: record.severity === "Critical" ? "P0 - Urgent" : "P1 - High",
          assignee: "Senior Developer",
          reportedBy: "QA Tester",
          status: record.bug_status || "Open",
          description: `Identified on ${record.side} side. Expected: ${record.expected_result} | Actual: ${record.actual_result}. Preconditions: ${record.preconditions || 'None'}. Notes: ${record.notes || 'None'}`,
          module: record.module || "Tasks",
          feature: record.feature || "General",
          bug_type: record.bug_type || "Functional",
          side: record.side || "Student"
        });
      }
    }

    record._saved = true;
    renderStagedReviewCards();
    renderTestCaseTable();
    renderSuitesSidebar();
    renderMetrics();
    renderDashboard();
    renderKanban();

    showToast(`✓ Confirmed & Saved ${record.test_case_id} (${record.test_case_type}) to Database!`, "success");
  };

  window.dismissStagedRecord = function(index) {
    stagedQaRecords.splice(index, 1);
    renderStagedReviewCards();
    showToast("Record dismissed from review pool", "info");
  };

  window.useExistingBugForRecord = function(index, bugId) {
    if (stagedQaRecords[index]) {
      stagedQaRecords[index].bug_id = bugId;
      stagedQaRecords[index]._duplicateResolved = true;
      stagedQaRecords[index].is_duplicate = true;
      renderStagedReviewCards();
      showToast(`Linked existing defect ${bugId} to record`, "success");
    }
  };

  window.keepNewBugForRecord = function(index) {
    if (stagedQaRecords[index]) {
      stagedQaRecords[index].bug_id = `BUG-${Math.floor(100 + Math.random() * 900)}`;
      stagedQaRecords[index]._duplicateResolved = true;
      stagedQaRecords[index].is_duplicate = false;
      renderStagedReviewCards();
      showToast(`Assigned new Defect ID ${stagedQaRecords[index].bug_id}`, "info");
    }
  };

  window.copySingleRecordTsv = function(index) {
    const record = stagedQaRecords[index];
    if (!record) return;
    const tsv = QAAssistant.exportRecordsToTSV([record]);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(tsv).then(() => {
        showToast(`Copied 22-column record for Excel! Press Ctrl+V in Excel.`, "success");
      });
    }
  };

  // Batch Save All
  on(DOM.aiConfirmSaveAllBtn, "click", () => {
    const unsaved = stagedQaRecords.filter(r => !r._saved);
    if (unsaved.length === 0) {
      showToast("All staged records are already confirmed and saved.", "info");
      return;
    }

    stagedQaRecords.forEach((_, idx) => {
      if (!stagedQaRecords[idx]._saved) {
        window.confirmSaveSingleRecord(idx);
      }
    });

    showToast(`✓ All ${unsaved.length} QA records successfully saved to Database & Supabase!`, "success");
  });

  // Batch 22-Column TSV Export for Excel
  function handleCopyAllTsv() {
    if (stagedQaRecords.length === 0) {
      showToast("No QA records available to export. Please parse observations first.", "warning");
      return;
    }
    const tsv = QAAssistant.exportRecordsToTSV(stagedQaRecords);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(tsv).then(() => {
        showToast(`Copied ${stagedQaRecords.length} records in 22-column Excel structure! Press Ctrl+V in Excel or Sheets.`, "success");
      });
    }
  }

  on(DOM.copyAllTsvBtn, "click", handleCopyAllTsv);
  on(DOM.aiExportTsvFooterBtn, "click", handleCopyAllTsv);

  // Batch 22-Column CSV Export
  on(DOM.downloadAllCsvBtn, "click", () => {
    if (stagedQaRecords.length === 0) {
      showToast("No QA records available to download.", "warning");
      return;
    }
    const csv = QAAssistant.exportRecordsToCSV(stagedQaRecords);
    QAAssistant.downloadFile(csv, `CampusOS_QA_Tracker_22Col_${new Date().toISOString().split("T")[0]}.csv`, "text/csv;charset=utf-8;");
    showToast(`Downloaded ${stagedQaRecords.length} QA records as 22-column CSV!`, "success");
  });

  // -------------------------------------------------------------
  // Full 22-Column Inline Editor Modal Handlers
  // -------------------------------------------------------------
  function populate22ColDropdowns() {
    const dropdowns = QAAssistant.getDropdowns();
    
    function setSelectOptions(id, options) {
      const el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = options.map(opt => `<option value="${opt}">${opt}</option>`).join("");
    }

    setSelectOptions("edit_test_module", dropdowns.test_module);
    setSelectOptions("edit_test_case_type", dropdowns.test_case_type);
    setSelectOptions("edit_bug_type", dropdowns.bug_type);
    setSelectOptions("edit_severity", dropdowns.severity);
    setSelectOptions("edit_test_result", dropdowns.test_result);
    setSelectOptions("edit_bug_status", dropdowns.bug_status);
    setSelectOptions("edit_reproducibility", dropdowns.reproducibility);
    setSelectOptions("edit_side", dropdowns.side);
  }

  window.editStagedRecord = function(index) {
    const record = stagedQaRecords[index];
    if (!record) return;

    populate22ColDropdowns();

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined && val !== null ? val : "";
    };

    setVal("editRecordIndex", index);
    setVal("edit_test_module", record.test_module || "Tasks");
    setVal("edit_test_case_id", record.test_case_id || "");
    setVal("edit_test_case_type", record.test_case_type || "Bug");
    setVal("edit_bug_id", record.bug_id || "");
    setVal("edit_date", record.date || new Date().toISOString().split("T")[0]);
    setVal("edit_side", record.side || "Student");
    setVal("edit_module", record.module || "Student Task Attempt");
    setVal("edit_feature", record.feature || "General");
    setVal("edit_bug_type", record.bug_type || "Functional");
    setVal("edit_severity", record.severity || "Major");
    setVal("edit_test_result", record.test_result || "Fail");
    setVal("edit_bug_status", record.bug_status || "Open");
    setVal("edit_reproducibility", record.reproducibility || "Not Tested");
    setVal("edit_title", record.title || "");
    setVal("edit_preconditions", record.preconditions || "");
    setVal("edit_expected_result", record.expected_result || "");
    setVal("edit_actual_result", record.actual_result || "");
    setVal("edit_ai_response", record.ai_response || "Not Applicable");
    setVal("edit_reference_answer", record.reference_answer || "Not Applicable");
    setVal("edit_evidence", record.screenshot_evidence || "None");
    setVal("edit_notes", record.notes || "");

    const stepsVal = Array.isArray(record.steps_to_reproduce)
      ? record.steps_to_reproduce.join("\n")
      : (record.steps_to_reproduce || "");
    setVal("edit_steps", stepsVal);

    if (DOM.qa22ColEditModal) DOM.qa22ColEditModal.style.display = "flex";
  };

  on(DOM.closeQaEditModalBtn, "click", () => { if (DOM.qa22ColEditModal) DOM.qa22ColEditModal.style.display = "none"; });
  on(DOM.cancelQaEditModalBtn, "click", () => { if (DOM.qa22ColEditModal) DOM.qa22ColEditModal.style.display = "none"; });

  on(DOM.saveQaEditModalBtn, "click", () => {
    const idxEl = document.getElementById("editRecordIndex");
    const index = idxEl ? parseInt(idxEl.value, 10) : -1;
    if (index < 0 || !stagedQaRecords[index]) return;

    const getVal = (id) => (document.getElementById(id) ? document.getElementById(id).value : "");

    const stepsRaw = getVal("edit_steps");
    const stepsArr = stepsRaw.split("\n").map(s => s.trim().replace(/^\d+\.\s*/, "")).filter(Boolean);

    stagedQaRecords[index] = {
      ...stagedQaRecords[index],
      test_module: getVal("edit_test_module"),
      test_case_id: getVal("edit_test_case_id"),
      test_case_type: getVal("edit_test_case_type"),
      bug_id: getVal("edit_bug_id"),
      date: getVal("edit_date"),
      side: getVal("edit_side"),
      module: getVal("edit_module"),
      feature: getVal("edit_feature"),
      bug_type: getVal("edit_bug_type"),
      severity: getVal("edit_severity"),
      test_result: getVal("edit_test_result"),
      bug_status: getVal("edit_bug_status"),
      reproducibility: getVal("edit_reproducibility"),
      title: getVal("edit_title"),
      preconditions: getVal("edit_preconditions"),
      steps_to_reproduce: stepsArr,
      expected_result: getVal("edit_expected_result"),
      actual_result: getVal("edit_actual_result"),
      ai_response: getVal("edit_ai_response"),
      reference_answer: getVal("edit_reference_answer"),
      screenshot_evidence: getVal("edit_evidence"),
      notes: getVal("edit_notes")
    };

    renderStagedReviewCards();
    if (DOM.qa22ColEditModal) DOM.qa22ColEditModal.style.display = "none";
    showToast("Updated 22-column record successfully", "success");
  });

  // -------------------------------------------------------------
  // Task Reference Table Modal Handlers
  // -------------------------------------------------------------
  function renderTaskRefTable() {
    if (!DOM.taskRefTableBody) return;
    const tasks = QAAssistant.getTaskReferences();

    DOM.taskRefTableBody.innerHTML = tasks.map(t => `
      <tr>
        <td><strong>${escapeHtml(t.task_name)}</strong></td>
        <td><span class="badge badge-secondary text-xs">${escapeHtml(t.task_type)}</span></td>
        <td><span class="badge badge-subtle text-xs">${escapeHtml(t.difficulty)}</span></td>
        <td><code>${escapeHtml(t.language)}</code></td>
        <td>${t.xp} XP</td>
        <td>${t.time_limit}m</td>
        <td><strong class="text-primary">${t.question_count} Qs</strong></td>
        <td><span class="text-xs text-muted">${escapeHtml(t.topic || t.description)}</span></td>
        <td><span class="badge ${t.published ? 'badge-success' : 'badge-failed'} text-xs">${t.published ? 'Published' : 'Draft'}</span></td>
        <td>
          <button type="button" class="btn btn-primary btn-xs" onclick="window.selectTaskBenchmark('${t.task_name}')">
            <i class="fa-solid fa-play mr-1"></i> Test This
          </button>
        </td>
      </tr>
    `).join("");
  }

  window.selectTaskBenchmark = function(taskName) {
    const task = QAAssistant.findTaskReference(taskName);
    if (task) {
      QAAssistant.resetSession();
      QAAssistant.processTesterMessage(`I'm testing ${task.task_name}. It's a ${task.task_type} task, ${task.difficulty} difficulty, ${task.language}, ${task.question_count} questions.`);
      updateSessionBarUI();
      renderStagedReviewCards();
      if (DOM.taskReferenceModal) DOM.taskReferenceModal.style.display = "none";
      showToast(`Loaded benchmark for ${task.task_name} into Assistant session`, "info");
    }
  };

  on(DOM.openTaskRefModalBtn, "click", () => {
    renderTaskRefTable();
    if (DOM.taskReferenceModal) DOM.taskReferenceModal.style.display = "flex";
  });

  on(DOM.closeTaskRefModalBtn, "click", () => { if (DOM.taskReferenceModal) DOM.taskReferenceModal.style.display = "none"; });
  on(DOM.closeTaskRefModalFooterBtn, "click", () => { if (DOM.taskReferenceModal) DOM.taskReferenceModal.style.display = "none"; });

  on(DOM.addNewTaskRefBtn, "click", () => {
    const name = prompt("Enter Task Name (e.g. Test 6):");
    if (!name) return;
    const type = prompt("Enter Task Type (Fill in the Blanks, Bug Fix, Practical Coding Challenge, MCQ):", "Fill in the Blanks");
    const count = parseInt(prompt("Trainer Question Count:", "5"), 10) || 5;
    const lang = prompt("Programming Language:", "Python");

    const tasks = QAAssistant.getTaskReferences();
    tasks.push({
      task_name: name,
      description: `${type} task for ${lang}`,
      task_type: type || "Fill in the Blanks",
      difficulty: "Medium",
      language: lang || "Python",
      xp: 20,
      time_limit: 30,
      question_count: count,
      question_source: "Trainer Created",
      topic: `${lang} Exercises`,
      skills_tags: [lang.toLowerCase()],
      generation_time: "0.5s",
      task_content: `${count} exercises.`,
      ai_quality_check: "Passed",
      hints_support: "Enabled",
      batch_selected: "Batch A-2026",
      published: true,
      student_attempt: "Assigned",
      navigation_flow: `Dashboard -> Tasks -> ${name}`,
      status_notes: "Custom Task Benchmark"
    });

    QAAssistant.saveTaskReferences(tasks);
    renderTaskRefTable();
    showToast(`Added task benchmark ${name}`, "success");
  });

  // Action button triggers
  on(DOM.autoInputTestCaseBtn, "click", openAutoInputModal);
  on(DOM.dashboardAutoInputBtn, "click", openAutoInputModal);
  on(DOM.repoAutoInputBtn, "click", openAutoInputModal);
  on(DOM.dashboardNewTestCaseBtn, "click", openCreateTestCaseModal);
  on(DOM.createNewTestCaseBtn, "click", openCreateTestCaseModal);
  on(DOM.emptyCreateBtn, "click", openCreateTestCaseModal);
  on(DOM.closeAutoInputModalBtn, "click", () => { if (DOM.autoInputModal) DOM.autoInputModal.style.display = "none"; });
  on(DOM.cancelAutoInputModalBtn, "click", () => { if (DOM.autoInputModal) DOM.autoInputModal.style.display = "none"; });

  on(DOM.closeTestCaseModalBtn, "click", () => { if (DOM.testCaseModal) DOM.testCaseModal.style.display = "none"; });
  on(DOM.cancelTestCaseModalBtn, "click", () => { if (DOM.testCaseModal) DOM.testCaseModal.style.display = "none"; });
  on(DOM.deleteTestCaseModalBtn, "click", () => {
    const id = DOM.editTestCaseId ? DOM.editTestCaseId.value : "";
    if (id) {
      if (DOM.testCaseModal) DOM.testCaseModal.style.display = "none";
      window.deleteSingleTestCase(id);
    }
  });

  on(DOM.saveTestCaseBtn, "click", () => {
    const title = DOM.tcTitle ? DOM.tcTitle.value.trim() : "";
    if (!title) {
      showToast("Please enter a test case title", "error");
      if (DOM.tcTitle) DOM.tcTitle.focus();
      return;
    }

    const steps = [];
    if (DOM.stepsBuilderList) {
      DOM.stepsBuilderList.querySelectorAll(".step-builder-row").forEach((row, idx) => {
        const action = row.querySelector(".step-input-action").value.trim();
        const expected = row.querySelector(".step-input-expected").value.trim();
        if (action || expected) {
          steps.push({ step: idx + 1, action: action || `Execute step ${idx + 1}`, expected: expected || "Operation completes successfully." });
        }
      });
    }

    const tags = DOM.tcTags ? DOM.tcTags.value.split(",").map(t => t.trim().toLowerCase()).filter(Boolean) : [];
    const testCaseData = {
      title,
      suiteId: DOM.tcSuite ? DOM.tcSuite.value : "general",
      priority: DOM.tcPriority ? DOM.tcPriority.value : "P2 - Medium",
      type: DOM.tcType ? DOM.tcType.value : "Manual",
      status: DOM.tcStatus ? DOM.tcStatus.value : "Untested",
      preconditions: DOM.tcPreconditions ? DOM.tcPreconditions.value.trim() : "",
      tags,
      steps,
      image: state.currentTcImage || ""
    };

    const editId = DOM.editTestCaseId ? DOM.editTestCaseId.value : "";
    if (editId) {
      testCaseData.id = editId;
      StorageManager.updateTestCase(testCaseData);
      showToast(`Updated test case ${editId}`);
    } else {
      const created = StorageManager.addTestCase(testCaseData);
      showToast(`Created test case ${created.id}`);
    }
    if (DOM.testCaseModal) DOM.testCaseModal.style.display = "none";
    renderTestCaseTable();
    renderSuitesSidebar();
  });

  window.deleteSingleTestCase = function(id) {
    if (confirm(`Are you sure you want to delete test case ${id}?`)) {
      StorageManager.deleteTestCase(id);
      state.selectedTestCaseIds.delete(id);
      renderTestCaseTable();
      renderSuitesSidebar();
      showToast(`Deleted ${id}`, "info");
    }
  };

  window.viewTestCaseDetail = function(id) {
    const tc = StorageManager.getTestCaseById(id);
    if (!tc || !DOM.testCaseDetailModal) return;
    const suites = StorageManager.getSuites();
    const suite = suites.find(s => s.id === tc.suiteId);

    if (DOM.viewDetailId) DOM.viewDetailId.textContent = tc.id;
    if (DOM.viewDetailTitle) DOM.viewDetailTitle.textContent = tc.title;

    let prioClass = tc.priority.includes("P0") ? "badge-p0" : tc.priority.includes("P1") ? "badge-p1" : tc.priority.includes("P3") ? "badge-p3" : "badge-p2";
    let statusClass = tc.status === "Passed" ? "badge-passed" : tc.status === "Failed" ? "badge-failed" : tc.status === "Blocked" ? "badge-blocked" : "badge-untested";

    const stepsRowsHtml = (tc.steps || []).map(s => `
      <tr>
        <td style="width: 40px; font-family: var(--font-mono); font-weight: bold; color: var(--text-dim);">${s.step}</td>
        <td><strong>${escapeHtml(s.action)}</strong></td>
        <td><span class="text-cyan">${escapeHtml(s.expected)}</span></td>
      </tr>
    `).join("");

    if (DOM.viewDetailBody) {
      DOM.viewDetailBody.innerHTML = `
        <div class="detail-meta-grid">
          <div class="detail-meta-item">
            <span class="meta-label">Suite / Module</span>
            <span class="meta-val"><i class="${suite ? suite.icon : 'fa-solid fa-folder'} text-primary"></i> ${suite ? suite.name : 'General'}</span>
          </div>
          <div class="detail-meta-item">
            <span class="meta-label">Priority</span>
            <span class="meta-val"><span class="badge ${prioClass}">${tc.priority}</span></span>
          </div>
          <div class="detail-meta-item">
            <span class="meta-label">Category</span>
            <span class="meta-val"><span class="badge badge-type">${escapeHtml(tc.type || 'Functional')}</span></span>
          </div>
          <div class="detail-meta-item">
            <span class="meta-label">Current Status</span>
            <span class="meta-val"><span class="badge ${statusClass}">${tc.status}</span></span>
          </div>
        </div>
        <div class="mb-3">
          <label class="console-label"><i class="fa-solid fa-circle-info"></i> Preconditions</label>
          <div class="precondition-box">${escapeHtml(tc.preconditions || 'None specified.')}</div>
        </div>
        ${tc.image ? `
        <div class="mb-3">
          <label class="console-label"><i class="fa-solid fa-image text-primary"></i> Reference Screenshot / Attached Mock</label>
          <div class="tc-detail-image-box text-center">
            <a href="${tc.image}" target="_blank" title="Click to view full image in new tab">
              <img src="${tc.image}" alt="Reference image for ${escapeHtml(tc.id)}">
            </a>
            <div class="text-xs text-muted mt-2 d-flex justify-between align-center">
              <span><i class="fa-solid fa-up-right-from-square"></i> Click image to open high-resolution view</span>
              <a href="${tc.image}" download="${tc.id}-mockup.png" class="btn btn-ghost btn-xs text-primary">
                <i class="fa-solid fa-download"></i> Download Image
              </a>
            </div>
          </div>
        </div>
        ` : ''}
        <div class="mb-3">
          <label class="console-label"><i class="fa-solid fa-list-ol"></i> Step-by-Step Procedure (${(tc.steps || []).length} Steps)</label>
          <table class="detail-steps-table">
            <thead><tr><th>#</th><th>Action / Input</th><th>Expected Result</th></tr></thead>
            <tbody>${stepsRowsHtml || '<tr><td colspan="3" class="text-muted">No steps provided.</td></tr>'}</tbody>
          </table>
        </div>
        <div class="d-flex justify-between text-muted text-xs mt-3 pt-3 border-top">
          <span>Author: <strong>${escapeHtml(tc.author || 'QA Lead')}</strong></span>
          <span>Last Run: <strong>${tc.lastRun || 'Never'}</strong></span>
        </div>
      `;
    }

    if (DOM.editDetailTestCaseBtn) {
      DOM.editDetailTestCaseBtn.onclick = () => {
        if (DOM.testCaseDetailModal) DOM.testCaseDetailModal.style.display = "none";
        window.openEditTestCaseModal(tc.id);
      };
    }
    const detailPassBtn = document.getElementById("detailPassedTestCaseBtn");
    if (detailPassBtn) {
      detailPassBtn.onclick = () => {
        if (DOM.testCaseDetailModal) DOM.testCaseDetailModal.style.display = "none";
        window.markTestCaseStatus(tc.id, "Passed");
      };
    }
    const detailFailBtn = document.getElementById("detailFailedTestCaseBtn");
    if (detailFailBtn) {
      detailFailBtn.onclick = () => {
        if (DOM.testCaseDetailModal) DOM.testCaseDetailModal.style.display = "none";
        window.markTestCaseStatus(tc.id, "Failed");
      };
    }
    const detailBlockBtn = document.getElementById("detailBlockedTestCaseBtn");
    if (detailBlockBtn) {
      detailBlockBtn.onclick = () => {
        if (DOM.testCaseDetailModal) DOM.testCaseDetailModal.style.display = "none";
        window.markTestCaseStatus(tc.id, "Blocked");
      };
    }
    if (DOM.runDetailTestCaseBtn) {
      DOM.runDetailTestCaseBtn.onclick = () => {
        if (DOM.testCaseDetailModal) DOM.testCaseDetailModal.style.display = "none";
        window.markTestCaseStatus(tc.id, "Passed");
      };
    }
    if (DOM.deleteDetailTestCaseBtn) {
      DOM.deleteDetailTestCaseBtn.onclick = () => {
        if (DOM.testCaseDetailModal) DOM.testCaseDetailModal.style.display = "none";
        window.deleteSingleTestCase(tc.id);
      };
    }
    DOM.testCaseDetailModal.style.display = "flex";
  };

  on(DOM.closeDetailModalBtn, "click", () => { if (DOM.testCaseDetailModal) DOM.testCaseDetailModal.style.display = "none"; });

  // Single test execution & status logging
  window.markTestCaseStatus = function(testCaseId, newStatus) {
    const tc = StorageManager.getTestCaseById(testCaseId);
    if (!tc) return;
    StorageManager.updateTestCase({ ...tc, status: newStatus, lastRun: "Just now" });
    renderTestCaseTable();
    renderDashboard();
    showToast(`Test ${tc.id} marked as ${newStatus}!`, newStatus === "Failed" ? "error" : "success");
  };

  window.launchSingleTestRun = function(testCaseId) {
    window.markTestCaseStatus(testCaseId, "Passed");
  };

  // =========================================================================
  // DEFECT TRACKER
  // =========================================================================
  function renderDefects() {
    if (!DOM.defectsTableBody) return;
    const defects = StorageManager.getDefects();
    const searchQuery = DOM.bugSearchInput ? DOM.bugSearchInput.value.trim().toLowerCase() : "";
    const filterSev = DOM.filterBugSeverity ? DOM.filterBugSeverity.value : "all";
    const filterStat = DOM.filterBugStatus ? DOM.filterBugStatus.value : "all";

    let filtered = defects;
    if (searchQuery) {
      filtered = filtered.filter(d => 
        d.id.toLowerCase().includes(searchQuery) ||
        d.summary.toLowerCase().includes(searchQuery) ||
        (d.assignee && d.assignee.toLowerCase().includes(searchQuery)) ||
        (d.linkedTestCaseId && d.linkedTestCaseId.toLowerCase().includes(searchQuery))
      );
    }
    if (filterSev !== "all") filtered = filtered.filter(d => d.severity === filterSev);
    if (filterStat !== "all") filtered = filtered.filter(d => d.status === filterStat);

    const open = defects.filter(d => d.status === "Open" || d.status === "In Progress");
    if (DOM.openBugsCount) DOM.openBugsCount.textContent = open.length;
    if (DOM.criticalBugsCount) DOM.criticalBugsCount.textContent = open.filter(d => d.severity === "Critical" || d.priority.includes("P0")).length;
    if (DOM.readyForRetestCount) DOM.readyForRetestCount.textContent = defects.filter(d => d.status === "Fixed - Ready for QA").length;
    if (DOM.resolvedBugsCount) DOM.resolvedBugsCount.textContent = defects.filter(d => d.status === "Resolved & Verified" || d.status === "Closed").length;

    if (filtered.length === 0) {
      DOM.defectsTableBody.innerHTML = `<tr><td colspan="8" class="text-center text-muted p-4">No defects found matching criteria.</td></tr>`;
      return;
    }

    DOM.defectsTableBody.innerHTML = filtered.map(d => {
      let sevClass = d.severity === "Critical" ? "badge-p0" : d.severity === "Major" ? "badge-p1" : "badge-p2";
      let statusBadge = `<span class="badge badge-failed">${d.status}</span>`;
      if (d.status === "In Progress") statusBadge = `<span class="badge badge-blocked">In Progress</span>`;
      if (d.status === "Fixed - Ready for QA") statusBadge = `<span class="badge badge-indigo"><i class="fa-solid fa-flask"></i> Ready for QA</span>`;
      if (d.status === "Resolved & Verified" || d.status === "Closed") statusBadge = `<span class="badge badge-passed">${d.status}</span>`;

      return `
        <tr>
          <td><strong class="font-mono text-rose">${d.id}</strong></td>
          <td>
            <strong>${escapeHtml(d.summary)}</strong>
            <div class="text-muted text-xs">${escapeHtml(d.description || '').substring(0, 65)}...</div>
          </td>
          <td>
            ${d.linkedTestCaseId ? `<span class="test-id-pill" onclick="window.viewTestCaseDetail('${d.linkedTestCaseId}')" style="cursor:pointer;">${d.linkedTestCaseId}</span>` : '<span class="text-dim">None</span>'}
          </td>
          <td><span class="badge ${sevClass}">${d.severity}</span></td>
          <td><span class="text-muted text-xs"><i class="fa-solid fa-user-circle"></i> ${escapeHtml(d.assignee || 'Unassigned')}</span></td>
          <td>
            ${d.prLink ? `<a href="${d.prLink}" target="_blank" class="text-primary text-xs"><i class="fa-solid fa-code-pull-request"></i> PR Fix</a>` : d.devNotes ? `<span class="text-xs text-emerald"><i class="fa-solid fa-check"></i> Fix Added</span>` : '<span class="text-dim text-xs">Pending Dev</span>'}
          </td>
          <td>${statusBadge}</td>
          <td>
            <div class="d-flex align-center gap-1">
              <button class="btn btn-secondary btn-xs" title="Verify or Edit Fix" onclick="window.openDevFixModal('${d.id}')">
                <i class="fa-solid fa-magnifying-glass"></i> View
              </button>
              ${createDeleteButtonHtml({ onClick: `window.deleteDefect('${d.id}')`, title: `Delete defect ${d.id}`, isCompact: true })}
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  on(DOM.bugSearchInput, "input", () => renderDefects());
  on(DOM.filterBugSeverity, "change", () => renderDefects());
  on(DOM.filterBugStatus, "change", () => renderDefects());

  on(DOM.createNewBugBtn, "click", () => {
    if (DOM.defectForm) DOM.defectForm.reset();
    if (DOM.editDefectId) DOM.editDefectId.value = "";
    if (DOM.editDefectDeleteWrap) DOM.editDefectDeleteWrap.style.display = "none";
    if (DOM.defectModal) DOM.defectModal.style.display = "flex";
  });

  on(DOM.closeDefectModalBtn, "click", () => { if (DOM.defectModal) DOM.defectModal.style.display = "none"; });
  on(DOM.cancelDefectModalBtn, "click", () => { if (DOM.defectModal) DOM.defectModal.style.display = "none"; });
  on(DOM.deleteDefectModalBtn, "click", () => {
    const id = DOM.editDefectId ? DOM.editDefectId.value : "";
    if (id) {
      if (DOM.defectModal) DOM.defectModal.style.display = "none";
      window.deleteDefect(id);
    }
  });

  on(DOM.saveDefectBtn, "click", () => {
    const summary = DOM.bugSummary ? DOM.bugSummary.value.trim() : "";
    if (!summary) {
      showToast("Please provide a bug summary", "error");
      if (DOM.bugSummary) DOM.bugSummary.focus();
      return;
    }

    const defectData = {
      summary,
      severity: DOM.bugSeverity ? DOM.bugSeverity.value : "Major",
      priority: DOM.bugPriority ? DOM.bugPriority.value : "P1 - High",
      linkedTestCaseId: DOM.bugLinkedTest ? DOM.bugLinkedTest.value.trim() : "",
      assignee: (DOM.bugAssignee ? DOM.bugAssignee.value.trim() : "") || "Marcus Vance",
      description: DOM.bugDescription ? DOM.bugDescription.value.trim() : ""
    };

    const editId = DOM.editDefectId ? DOM.editDefectId.value : "";
    if (editId) {
      defectData.id = editId;
      StorageManager.updateDefect(defectData);
      showToast(`Updated defect ${editId}`);
    } else {
      const created = StorageManager.addDefect(defectData);
      showToast(`Logged defect ${created.id} & broadcasted to Dev Hub & Cloud!`);
    }

    if (DOM.defectModal) DOM.defectModal.style.display = "none";
    renderDefects();
  });

  window.deleteDefect = function(bugId) {
    if (confirm(`Delete bug ${bugId}?`)) {
      StorageManager.deleteDefect(bugId);
      renderDefects();
      showToast(`Deleted defect ${bugId}`, "info");
    }
  };

  // =========================================================================
  // VOICE & AI CHAT TEST CASE CREATOR STUDIO
  // =========================================================================
  let speechRecognition = null;
  let isVoiceListening = false;

  function renderAIGeneratorSuiteDropdown() {
    populateSuiteDropdowns();
  }

  function initVoiceRecognition() {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return null;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      isVoiceListening = true;
      updateVoiceUI(true);
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript && DOM.aiStoryPrompt) {
        const currentVal = DOM.aiStoryPrompt.value;
        DOM.aiStoryPrompt.value = currentVal ? `${currentVal.trim()} ${finalTranscript.trim()}` : finalTranscript.trim();
        DOM.aiStoryPrompt.scrollTop = DOM.aiStoryPrompt.scrollHeight;
      }
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition event:", event.error);
      if (event.error !== "no-speech") {
        showToast(`Voice mic notice: ${event.error}`, "info");
      }
      stopVoiceListening();
    };

    recognition.onend = () => {
      isVoiceListening = false;
      updateVoiceUI(false);
    };

    return recognition;
  }

  function toggleVoiceListening() {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      showToast("Speech Recognition is not supported by your current browser. You can type directly in the chat!", "error");
      if (DOM.aiStoryPrompt) DOM.aiStoryPrompt.focus();
      return;
    }
    if (!speechRecognition) {
      speechRecognition = initVoiceRecognition();
    }
    if (isVoiceListening) {
      stopVoiceListening();
    } else {
      try {
        speechRecognition.start();
        showToast("Microphone active! Speak your testing steps naturally...", "info");
      } catch (err) {
        console.warn("Speech recognition start warning:", err);
      }
    }
  }

  function stopVoiceListening() {
    if (speechRecognition && isVoiceListening) {
      try { speechRecognition.stop(); } catch (e) {}
    }
    isVoiceListening = false;
    updateVoiceUI(false);
  }

  function updateVoiceUI(listening) {
    if (DOM.btnVoiceMic) {
      if (listening) {
        DOM.btnVoiceMic.classList.add("recording");
        DOM.btnVoiceMic.innerHTML = '<i class="fa-solid fa-stop text-rose"></i>';
        DOM.btnVoiceMic.title = "Stop Recording & Extract";
      } else {
        DOM.btnVoiceMic.classList.remove("recording");
        DOM.btnVoiceMic.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        DOM.btnVoiceMic.title = "Toggle Microphone Dictation (Speech to Text)";
      }
    }
    if (DOM.voiceListeningBanner) {
      DOM.voiceListeningBanner.style.display = listening ? "flex" : "none";
    }
  }

  if (DOM.btnVoiceMic) {
    DOM.btnVoiceMic.addEventListener("click", toggleVoiceListening);
  }
  if (DOM.btnStopVoiceRec) {
    DOM.btnStopVoiceRec.addEventListener("click", stopVoiceListening);
  }

  if (DOM.topbarVoiceAiBtn) {
    DOM.topbarVoiceAiBtn.addEventListener("click", () => {
      switchView("ai-generator");
      if (DOM.aiStoryPrompt) DOM.aiStoryPrompt.focus({ preventScroll: true });
    });
  }

  window.setAiPreset = function(presetKey) {
    const promptEl = DOM.aiStoryPrompt || document.getElementById("aiStoryPrompt");
    if (!promptEl) return;
    
    if (presetKey === "checkout") {
      promptEl.value = "I tested the Stripe checkout flow: First I added a $120 item to cart, applied promo coupon 'CYBER30', and verified 30% discount deducted. Then entered test card 4242 4242, clicked Pay $84, and verified Stripe 3D Secure modal triggered and success confirmation receipt rendered.";
    } else if (presetKey === "oauth") {
      promptEl.value = "I tested the OAuth2 Google SSO authentication: Clicked 'Sign in with Google', authenticated test user account, verified authorization code exchanged for JWT session token, and confirmed user redirected to tester dashboard with valid active token.";
    } else if (presetKey === "security") {
      promptEl.value = "I tested API security endpoint rate limiting and XSS protection: Sent 70 POST requests within 1 minute with malicious payload '<script>alert(1)</script>', verified rate limiter blocked after 60 reqs with HTTP 429 Too Many Requests, and confirmed script payload was sanitized.";
    }
    showToast("AI Test Scenario loaded into prompt!");
  };

  if (DOM.btnClearAiChat) {
    DOM.btnClearAiChat.addEventListener("click", () => {
      if (DOM.aiChatHistory) {
        DOM.aiChatHistory.innerHTML = `
          <div class="chat-message chat-msg-assistant">
            <div class="chat-msg-avatar"><i class="fa-solid fa-robot"></i></div>
            <div class="chat-msg-bubble">
              <p><strong>Chat cleared!</strong> How can I help you document your testing?</p>
              <p class="mb-0">Turn on the <strong>microphone</strong> to speak your test actions, or type in what you tested. I will structure everything, auto-assign <strong>Test IDs</strong>, and prepare the <strong>Excel copy format</strong> and database records.</p>
            </div>
          </div>
        `;
      }
      showToast("Chat history cleared");
    });
  }

  if (DOM.aiStoryPrompt) {
    DOM.aiStoryPrompt.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleAiChatSubmit();
      }
    });
  }

  if (DOM.generateAITestsBtn) {
    DOM.generateAITestsBtn.addEventListener("click", handleAiChatSubmit);
  }

  function handleAiChatSubmit() {
    stopVoiceListening();
    const promptText = DOM.aiStoryPrompt ? DOM.aiStoryPrompt.value.trim() : "";
    if (!promptText) {
      showToast("Please speak or type your testing steps first", "error");
      if (DOM.aiStoryPrompt) DOM.aiStoryPrompt.focus();
      return;
    }

    const suiteId = DOM.aiTargetSuiteSelect ? DOM.aiTargetSuiteSelect.value : "general";
    const suiteObj = StorageManager.getSuites().find(s => s.id === suiteId) || { name: "General Suite" };

    // Append User Message to Chat History
    appendChatMessage("user", promptText);
    if (DOM.aiStoryPrompt) DOM.aiStoryPrompt.value = "";

    // Show Loader on Output Pane
    if (DOM.aiIdlePlaceholder) DOM.aiIdlePlaceholder.style.display = "none";
    if (DOM.generatedCardsList) DOM.generatedCardsList.style.display = "none";
    if (DOM.aiGeneratingLoader) DOM.aiGeneratingLoader.style.display = "flex";

    // Synthesize structured test cases
    setTimeout(() => {
      if (DOM.aiGeneratingLoader) DOM.aiGeneratingLoader.style.display = "none";
      if (DOM.generatedCardsList) DOM.generatedCardsList.style.display = "flex";

      state.generatedAITests = synthesizeTestsFromStory(promptText, suiteId);
      renderGeneratedAICards();

      if (DOM.btnCopyExcelTsv) DOM.btnCopyExcelTsv.style.display = "inline-flex";
      if (DOM.importAllAITestsBtn) DOM.importAllAITestsBtn.style.display = "inline-flex";
      if (DOM.aiGeneratedCount) DOM.aiGeneratedCount.textContent = state.generatedAITests.length;

      // Append Assistant Response to Chat History
      const assistantReply = `
        <p>I've extracted and structured <strong>${state.generatedAITests.length} formal test cases</strong> with auto-assigned IDs (<code>${state.generatedAITests.map(t => t.id).join(", ")}</code>) for suite <strong>${escapeHtml(suiteObj.name)}</strong>.</p>
        <div class="chat-assistant-quick-actions mt-2">
          <button class="btn btn-secondary btn-xs" onclick="window.copyGeneratedAITestsToExcel()">
            <i class="fa-solid fa-file-excel text-emerald"></i> Copy for Excel (Ctrl+V)
          </button>
          <button class="btn btn-success btn-xs" onclick="window.saveAllGeneratedAITests()">
            <i class="fa-solid fa-database"></i> Save to Database
          </button>
        </div>
      `;
      appendChatMessage("assistant", assistantReply, true);
      showToast(`Structured ${state.generatedAITests.length} test cases with auto-generated IDs!`);
    }, 900);
  }

  function appendChatMessage(sender, content, isHtml = false) {
    if (!DOM.aiChatHistory) return;
    const msgDiv = document.createElement("div");
    msgDiv.className = `chat-message chat-msg-${sender}`;
    
    const avatarHtml = sender === "user" 
      ? `<div class="chat-msg-avatar chat-avatar-user"><i class="fa-solid fa-user"></i></div>`
      : `<div class="chat-msg-avatar"><i class="fa-solid fa-robot"></i></div>`;
    
    const bodyContent = isHtml ? content : `<p class="mb-0">${escapeHtml(content).replace(/\n/g, "<br>")}</p>`;
    
    msgDiv.innerHTML = `
      ${avatarHtml}
      <div class="chat-msg-bubble">
        ${bodyContent}
      </div>
    `;
    DOM.aiChatHistory.appendChild(msgDiv);
    DOM.aiChatHistory.scrollTop = DOM.aiChatHistory.scrollHeight;
  }

  function parseStepsFromNarrative(text) {
    const rawSteps = [];
    // Check if text has numbered items (e.g. 1. step, 2. step) or line breaks
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    
    if (lines.length > 1) {
      lines.forEach((line, idx) => {
        const cleanLine = line.replace(/^\d+[\.\)]\s*/, "").trim();
        if (cleanLine.length > 3) {
          const parts = cleanLine.split(/\s*→\s*|\s*verify\s+|\s*verified\s+|\s*expected\s*:\s*|\s*and confirmed\s+/i);
          const action = parts[0].trim();
          const expected = parts[1] ? parts[1].trim() : `Verify ${action.toLowerCase()} executes with expected output.`;
          rawSteps.push({ step: rawSteps.length + 1, action, expected });
        }
      });
    }

    if (rawSteps.length === 0) {
      // Split by sentence delimiters / transition phrases (first, then, after, finally, verify)
      const sentences = text.split(/(?<=[.!?])\s+|,\s*(?=then|after|verified|next|finally)/i)
        .map(s => s.trim())
        .filter(s => s.length > 4);

      sentences.forEach((sent) => {
        const parts = sent.split(/\s*→\s*|\s*verify\s+|\s*verified\s+|\s*expected\s*:\s*|\s*and confirmed\s+/i);
        const action = parts[0].replace(/^(first|then|after that|next|finally)\s*/i, "").trim();
        const expected = parts[1] 
          ? parts[1].trim() 
          : `System handles ${action.substring(0, 40)} correctly without error.`;
        if (action.length > 2) {
          rawSteps.push({ step: rawSteps.length + 1, action, expected });
        }
      });
    }

    return rawSteps.length > 0 ? rawSteps : [
      { step: 1, action: "Navigate to feature interface", expected: "UI renders with required elements." },
      { step: 2, action: `Execute user flow: ${text.substring(0, 80)}`, expected: "All inputs validated and processed." },
      { step: 3, action: "Inspect response state & database persistence", expected: "Operation succeeds and UI reflects new state." }
    ];
  }

  function synthesizeTestsFromStory(prompt, suiteId) {
    const cases = StorageManager.getTestCases();
    let maxId = cases.reduce((max, tc) => {
      const num = parseInt(tc.id.replace("TC-", ""), 10) || 0;
      return Math.max(max, num);
    }, 100);

    const steps = parseStepsFromNarrative(prompt);
    const tests = [];

    // 1. Primary Flow (Happy Path)
    maxId += 1;
    tests.push({
      id: `TC-${maxId}`,
      title: `Verify ${prompt.substring(0, 65).replace(/^(I tested|I checked|As a user)/i, "").trim()}...`,
      suiteId: suiteId || "general",
      priority: "P0 - Critical",
      type: "Functional",
      status: "Untested",
      preconditions: "User is on the target screen with valid session and network connectivity.",
      tags: ["ai-extracted", "functional", "voice-dictated"],
      steps: steps
    });

    // 2. Negative & Validation Handling
    maxId += 1;
    tests.push({
      id: `TC-${maxId}`,
      title: `Verify boundary validation & error intercept for: ${prompt.substring(0, 50)}...`,
      suiteId: suiteId || "general",
      priority: "P1 - High",
      type: "Manual",
      status: "Untested",
      preconditions: "System input fields are ready for boundary and edge-condition testing.",
      tags: ["ai-extracted", "negative", "validation"],
      steps: [
        { step: 1, action: "Attempt workflow with boundary / empty / invalid parameters", expected: "Action is intercepted; client shows inline error feedback." },
        { step: 2, action: "Inspect error notification clarity and field highlights", expected: "Clear guidance displayed without crashing or unhandled exceptions." },
        { step: 3, action: "Correct invalid inputs and re-submit", expected: "Validation resolves and request succeeds." }
      ]
    });

    // 3. Security & Robustness Guard
    maxId += 1;
    tests.push({
      id: `TC-${maxId}`,
      title: `Verify security robustness & auth token verification on: ${prompt.substring(0, 48)}...`,
      suiteId: suiteId || "general",
      priority: "P1 - High",
      type: "Security",
      status: "Untested",
      preconditions: "Feature endpoint authorization and input sanitizers active.",
      tags: ["ai-extracted", "security", "xss-protection"],
      steps: [
        { step: 1, action: "Execute action with expired or unauthorized session token", expected: "HTTP 401/403 Forbidden returned; redirected to login." },
        { step: 2, action: "Inject XSS payload: '<script>alert(1)</script>' and special characters", expected: "Payload is HTML-entity encoded; script does not execute." }
      ]
    });

    return tests;
  }

  function renderGeneratedAICards() {
    if (!DOM.generatedCardsList) return;
    const suites = StorageManager.getSuites();

    DOM.generatedCardsList.innerHTML = state.generatedAITests.map((t, idx) => {
      const suiteName = (suites.find(s => s.id === t.suiteId) || {}).name || t.suiteId;
      return `
        <div class="gen-test-card" id="aiCard-${idx}">
          <div class="gen-card-header">
            <div class="d-flex align-center gap-2">
              <span class="test-id-pill">${escapeHtml(t.id)}</span>
              <span class="gen-card-title">${escapeHtml(t.title)}</span>
            </div>
            <div class="d-flex gap-1 align-center">
              <span class="badge badge-indigo">${t.priority}</span>
              <span class="badge badge-untested">${t.type}</span>
              <button class="btn btn-outline btn-xs" onclick="window.copySingleAITestToExcel(${idx})" title="Copy this test in Excel format">
                <i class="fa-solid fa-file-excel text-emerald"></i> Copy for Excel
              </button>
              <button class="btn btn-secondary btn-xs" id="btnSaveCard-${idx}" onclick="window.saveSingleAITest(${idx})" title="Save to Database">
                <i class="fa-solid fa-plus text-emerald"></i> Save to DB
              </button>
            </div>
          </div>
          
          <div class="gen-card-meta text-xs text-muted">
            <span><i class="fa-solid fa-folder-tree text-indigo"></i> Suite: <strong>${escapeHtml(suiteName)}</strong></span>
            <span><i class="fa-solid fa-circle-info text-cyan"></i> Preconditions: <em>${escapeHtml(t.preconditions)}</em></span>
          </div>

          <!-- Structured Step Table -->
          <div class="gen-steps-table-wrapper mt-2">
            <table class="gen-steps-table">
              <thead>
                <tr>
                  <th width="40">#</th>
                  <th>Action / Test Step</th>
                  <th>Expected Result</th>
                </tr>
              </thead>
              <tbody>
                ${(t.steps || []).map(s => `
                  <tr>
                    <td class="text-center font-bold text-muted">${s.step}</td>
                    <td>${escapeHtml(s.action)}</td>
                    <td class="text-emerald">${escapeHtml(s.expected)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }).join("");
  }

  // Excel TSV Export Function
  function copyTestsToExcelTsv(tests) {
    if (!tests || tests.length === 0) {
      showToast("No test cases available to copy", "error");
      return;
    }

    const headers = ["Test ID", "Title", "Suite", "Priority", "Type", "Status", "Preconditions", "Step #", "Action / Test Step", "Expected Result"];
    const rows = [];

    tests.forEach(t => {
      const suiteName = (StorageManager.getSuites().find(s => s.id === t.suiteId) || {}).name || t.suiteId;
      (t.steps || []).forEach(s => {
        rows.push([
          t.id || "",
          t.title || "",
          suiteName,
          t.priority || "",
          t.type || "",
          t.status || "Untested",
          t.preconditions || "",
          s.step || 1,
          s.action || "",
          s.expected || ""
        ].map(val => String(val).replace(/\t/g, " ").replace(/\r?\n/g, " ")).join("\t"));
      });
    });

    const tsvContent = [headers.join("\t"), ...rows].join("\n");

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(tsvContent).then(() => {
        showToast(`Copied ${tests.length} test cases (${rows.length} steps) for Excel! Press Ctrl+V in Excel or Google Sheets.`, "success");
      }).catch(() => {
        fallbackClipboardCopy(tsvContent, tests.length);
      });
    } else {
      fallbackClipboardCopy(tsvContent, tests.length);
    }
  }

  function fallbackClipboardCopy(text, count) {
    const tempTextArea = document.createElement("textarea");
    tempTextArea.value = text;
    tempTextArea.style.position = "fixed";
    tempTextArea.style.left = "-9999px";
    document.body.appendChild(tempTextArea);
    tempTextArea.focus();
    tempTextArea.select();
    try {
      document.execCommand("copy");
      showToast(`Copied ${count} test cases for Excel! Press Ctrl+V to paste.`, "success");
    } catch (err) {
      showToast("Clipboard copy failed. Please grant browser clipboard permission.", "error");
    }
    document.body.removeChild(tempTextArea);
  }

  window.copyGeneratedAITestsToExcel = function() {
    copyTestsToExcelTsv(state.generatedAITests);
  };

  window.copySingleAITestToExcel = function(index) {
    const tc = state.generatedAITests[index];
    if (tc) {
      copyTestsToExcelTsv([tc]);
    }
  };

  window.saveSingleAITest = function(index) {
    const testCase = state.generatedAITests[index];
    if (testCase) {
      const added = StorageManager.addTestCase(testCase);
      const btn = document.getElementById(`btnSaveCard-${index}`);
      if (btn) {
        btn.classList.remove("btn-secondary");
        btn.classList.add("btn-success");
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Saved in DB';
        btn.disabled = true;
      }
      showToast(`Saved ${added.id} to Test Repository & Database!`, "success");
      updateTestCaseBadges();
    }
  };

  window.saveAllGeneratedAITests = function() {
    if (!state.generatedAITests || state.generatedAITests.length === 0) return;
    state.generatedAITests.forEach(t => StorageManager.addTestCase(t));
    showToast(`Saved all ${state.generatedAITests.length} test cases to database!`, "success");
    updateTestCaseBadges();
    switchView("test-cases");
  };

  if (DOM.btnCopyExcelTsv) {
    DOM.btnCopyExcelTsv.addEventListener("click", window.copyGeneratedAITestsToExcel);
  }

  if (DOM.importAllAITestsBtn) {
    DOM.importAllAITestsBtn.addEventListener("click", window.saveAllGeneratedAITests);
  }

  // Suites
  function renderSuitesView() {
    if (!DOM.suitesGridCards) return;
    const suites = StorageManager.getSuites();
    const cases = StorageManager.getTestCases();

    DOM.suitesGridCards.innerHTML = suites.map(suite => {
      const suiteCases = cases.filter(c => c.suiteId === suite.id);
      const passed = suiteCases.filter(c => c.status === "Passed").length;
      const passRate = suiteCases.length > 0 ? Math.round((passed / suiteCases.length) * 100) : 0;

      return `
        <div class="suite-card">
          <div class="suite-card-top">
            <div class="suite-card-icon"><i class="${suite.icon || 'fa-solid fa-folder'}"></i></div>
            <div class="suite-card-info">
              <h3>${escapeHtml(suite.name)}</h3>
              <p class="suite-card-desc">${escapeHtml(suite.description || 'General test suite')}</p>
            </div>
          </div>
          <div class="suite-card-footer">
            <span><strong>${suiteCases.length}</strong> Tests</span>
            <span><strong class="text-emerald">${passRate}%</strong> Pass Rate</span>
            <button class="btn btn-secondary btn-xs" onclick="window.viewSuiteTests('${suite.id}')">View Tests <i class="fa-solid fa-arrow-right"></i></button>
          </div>
        </div>
      `;
    }).join("");
  }

  window.viewSuiteTests = function(suiteId) {
    state.selectedSuiteId = suiteId;
    switchView("test-cases");
  };

  on(DOM.createSuiteModalBtn, "click", () => { if (DOM.suiteForm) DOM.suiteForm.reset(); if (DOM.suiteModal) DOM.suiteModal.style.display = "flex"; });
  on(DOM.addNewSuiteBtn, "click", () => { if (DOM.suiteForm) DOM.suiteForm.reset(); if (DOM.suiteModal) DOM.suiteModal.style.display = "flex"; });
  on(DOM.closeSuiteModalBtn, "click", () => { if (DOM.suiteModal) DOM.suiteModal.style.display = "none"; });
  on(DOM.cancelSuiteModalBtn, "click", () => { if (DOM.suiteModal) DOM.suiteModal.style.display = "none"; });

  on(DOM.saveSuiteBtn, "click", () => {
    const name = DOM.newSuiteName ? DOM.newSuiteName.value.trim() : "";
    if (!name) {
      showToast("Please enter a suite name", "error");
      if (DOM.newSuiteName) DOM.newSuiteName.focus();
      return;
    }
    const suite = StorageManager.addSuite({
      name,
      description: DOM.newSuiteDescription ? DOM.newSuiteDescription.value.trim() : "",
      icon: DOM.newSuiteIcon ? DOM.newSuiteIcon.value : "fa-solid fa-folder"
    });
    if (DOM.suiteModal) DOM.suiteModal.style.display = "none";
    showToast(`Created suite: ${suite.name}`);
    renderSuitesSidebar();
    renderSuitesView();
  });

  // Settings Backups
  on(DOM.exportFullBackupBtn, "click", () => {
    const snapshot = StorageManager.getFullSnapshot();
    downloadFile(`nexusqa-workspace-backup-${new Date().toISOString().substring(0, 10)}.json`, JSON.stringify(snapshot, null, 2), "application/json");
    showToast("Workspace JSON snapshot exported!");
  });

  on(DOM.exportCsvBtn, "click", () => {
    const cases = StorageManager.getTestCases();
    const headers = ["ID", "Title", "Suite", "Priority", "Type", "Status", "Preconditions", "Tags", "StepsCount"];
    const rows = cases.map(c => [
      c.id,
      `"${(c.title || '').replace(/"/g, '""')}"`,
      c.suiteId,
      c.priority,
      c.type,
      c.status,
      `"${(c.preconditions || '').replace(/"/g, '""')}"`,
      `"${(c.tags || []).join(', ')}"`,
      (c.steps || []).length
    ]);
    downloadFile("nexusqa-test-cases.csv", [headers.join(","), ...rows.map(r => r.join(","))].join("\n"), "text/csv");
    showToast("Test cases CSV exported!");
  });

  on(DOM.exportTestsBtn, "click", () => { if (DOM.exportCsvBtn) DOM.exportCsvBtn.click(); });
  on(DOM.importTestsBtn, "click", () => { if (DOM.importJsonFileInput) DOM.importJsonFileInput.click(); });

  on(DOM.importJsonFileInput, "change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        StorageManager.importSnapshot(json);
        showToast("Workspace snapshot imported!");
        switchView(state.currentPortal === "dev" ? "dev-dashboard" : "dashboard");
      } catch (err) {
        showToast("Invalid JSON format", "error");
      }
    };
    reader.readAsText(file);
  });

  on(DOM.resetSeedDataBtn, "click", () => {
    if (confirm("Reset workspace to initial demo dataset?")) {
      StorageManager.resetToSeedData();
      showToast("Reloaded demo data!");
      switchView(state.currentPortal === "dev" ? "dev-dashboard" : "dashboard");
    }
  });

  function downloadFile(filename, text, type) {
    const blob = new Blob([text], { type });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Delete Button Component Helper (Uiverse delete button matching user spec)
  function createDeleteButtonHtml(options = {}) {
    const {
      id = "",
      onClick = "",
      title = "Delete",
      className = "",
      isCompact = true,
      extraAttrs = ""
    } = options;
    const idAttr = id ? `id="${id}"` : "";
    const clickAttr = onClick ? `onclick="${onClick}"` : "";
    const titleAttr = title ? `title="${escapeHtml(title)}"` : "";
    const compactClass = isCompact ? "btn-sm" : "";

    return `
      <div class="styled-delete-wrapper ${compactClass} ${className}">
        <button type="button" class="button" ${idAttr} ${clickAttr} ${titleAttr} ${extraAttrs}>
          <svg viewBox="0 0 448 512" class="svgIcon"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path></svg>
        </button>
      </div>
    `.trim();
  }

  // 404 Face Animation Component Helper (Uiverse / Custom Animated Face)
  function create404Html(options = {}) {
    const {
      title = "Error 404",
      heading = "Lost in Space?",
      desc = "We searched everywhere, but couldn't find what you're looking for.",
      actionText = "Back to Safety",
      actionHandler = "window.history.length > 1 ? window.history.back() : switchView('dashboard')"
    } = options;

    return `
      <div class="styled-404-wrapper">
        <div class="error-404-card">
          <div class="error-404-badge">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>${escapeHtml(title)}</span>
          </div>

          <main class="my-custom-face-container">
            <svg class="face" viewBox="0 0 320 380">
              <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="25">
                <g class="face__eyes" transform="translate(0,112.5)">
                  <g transform="translate(15,0)">
                    <polyline class="face__eye-lid" points="37,0 0,120 75,120" />
                    <polyline class="face__pupil" points="55,120 55,155" stroke-dasharray="35 35" />
                  </g>
                  <g transform="translate(230,0)">
                    <polyline class="face__eye-lid" points="37,0 0,120 75,120" />
                    <polyline class="face__pupil" points="55,120 55,155" stroke-dasharray="35 35" />
                  </g>
                </g>
                <rect class="face__nose" x="132.5" y="112.5" width="55" height="155" rx="4" ry="4" />
                <g transform="translate(65,334)" stroke-dasharray="102 102">
                  <path class="face__mouth-left" d="M 0 30 C 0 30 40 0 95 0" />
                  <path class="face__mouth-right" d="M 95 0 C 150 0 190 30 190 30" />
                </g>
              </g>
            </svg>
          </main>

          <h1 class="error-404-title">${escapeHtml(heading)}</h1>
          <p class="error-404-desc">${escapeHtml(desc)}</p>

          <div class="error-404-actions">
            <button type="button" class="btn-404-primary" onclick="${actionHandler}">
              <i class="fa-solid fa-arrow-left"></i>
              <span>${escapeHtml(actionText)}</span>
            </button>
          </div>
        </div>
      </div>
    `.trim();
  }
  window.create404Html = create404Html;

  // Back to Top Button Controller (Animated Expandable Pill)
  function initBackToTopButton() {
    const wrap = document.getElementById("scrollToTopWrapper");
    const btn = document.getElementById("scrollToTopBtn");
    if (!wrap && !btn) return;

    const mainContent = document.getElementById("mainContent");
    const viewViewport = document.getElementById("viewViewport");

    function checkScroll() {
      const winScroll = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const mainScroll = mainContent ? mainContent.scrollTop : 0;
      const viewScroll = viewViewport ? viewViewport.scrollTop : 0;
      const maxScroll = Math.max(winScroll, mainScroll, viewScroll);

      if (maxScroll > 200) {
        if (wrap) wrap.classList.add("show");
      } else {
        if (wrap) wrap.classList.remove("show");
      }
    }

    function doScrollToTop(e) {
      if (e) e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
      document.body.scrollTo({ top: 0, behavior: "smooth" });
      if (mainContent) mainContent.scrollTo({ top: 0, behavior: "smooth" });
      if (viewViewport) viewViewport.scrollTo({ top: 0, behavior: "smooth" });
    }

    window.addEventListener("scroll", checkScroll, { passive: true });
    document.addEventListener("scroll", checkScroll, { passive: true });
    if (mainContent) mainContent.addEventListener("scroll", checkScroll, { passive: true });
    if (viewViewport) viewViewport.addEventListener("scroll", checkScroll, { passive: true });

    if (btn) btn.addEventListener("click", doScrollToTop);
    if (wrap) wrap.addEventListener("click", doScrollToTop);
  }

  // URL Parameter Routing & 404 checks
  function applyUrlViewRouting() {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get("view");
    if (viewParam) {
      switchView(viewParam);
    }
  }

  // Boot Back to Top, Routing & Conference Room
  initBackToTopButton();
  initRouting();
  initConferenceRoom();
  applyUrlViewRouting();
});

