/**
 * CampusOS Conversational AI QA Assistant Engine
 * Implements Natural Language QA Interpretation, Multi-Message Context Management,
 * Cross-Role Mismatch Detection, Existing Bug Matching, Controlled Dropdowns,
 * Speech-to-Text Dictation, Screenshot Evidence Understanding, and EXACT 22-Column Export.
 */

const QAAssistant = (function () {
  // -------------------------------------------------------------
  // 1. Task Reference Table Storage & Access
  // -------------------------------------------------------------
  const TASK_REF_KEY = "nexusqa_task_references";

  function getTaskReferences() {
    try {
      const raw = localStorage.getItem(TASK_REF_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("Failed to parse task references from storage", e);
    }
    return typeof SEED_TASK_REFERENCES !== "undefined" ? [...SEED_TASK_REFERENCES] : [];
  }

  function saveTaskReferences(tasks) {
    try {
      localStorage.setItem(TASK_REF_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.warn("Failed to save task references", e);
    }
  }

  function findTaskReference(nameOrText) {
    if (!nameOrText) return null;
    const tasks = getTaskReferences();
    const query = String(nameOrText).toLowerCase().trim();
    
    // Exact name match (e.g. "Test 5" or "Test 4")
    const match = tasks.find(t => t.task_name.toLowerCase() === query || 
      t.task_name.toLowerCase().replace(/\s+/g, "") === query.replace(/\s+/g, ""));
    if (match) return match;

    // Pattern match like "test 5" in text
    const patternMatch = query.match(/\btest\s*(\d+)\b/i);
    if (patternMatch) {
      const targetName = `Test ${patternMatch[1]}`.toLowerCase();
      return tasks.find(t => t.task_name.toLowerCase() === targetName);
    }

    return null;
  }

  // -------------------------------------------------------------
  // 2. Controlled Dropdown Access
  // -------------------------------------------------------------
  function getDropdowns() {
    return typeof CONTROLLED_DROPDOWNS !== "undefined" ? CONTROLLED_DROPDOWNS : {
      test_case_type: ["Bug", "Enhancement"],
      test_result: ["Pass", "Fail", "Not Run", "Blocked", "Not Applicable"],
      reproducibility: ["Yes", "No", "Not Tested", "Intermittent"],
      bug_status: ["Passed", "Completed", "Closed", "Open", "Not Run", "Passes", "Testing", "Check", "Fixed", "Retest"],
      side: ["Trainer", "Student"],
      severity: ["Critical", "Major", "Medium", "Minor", "Trivial"],
      bug_type: ["Functional", "Content", "Configuration", "Scoring", "Content Quality", "UI Improvement"],
      test_module: ["Tasks", "Assessments", "Courses", "Authentication", "Dashboard", "Reports", "Settings", "Student Portal"]
    };
  }

  // -------------------------------------------------------------
  // 3. Conversational Session Context State
  // -------------------------------------------------------------
  let currentSession = {
    test_reference: "",
    module: "Tasks",
    side: "Student",
    task_type: "",
    difficulty: "",
    language: "",
    xp: null,
    time_limit: null,
    trainer_question_count: null,
    student_question_count: null,
    published: true,
    history: [],
    staged_records: [],
    attached_screenshots: [],
    last_observation: ""
  };

  function resetSession() {
    currentSession = {
      test_reference: "",
      module: "Tasks",
      side: "Student",
      task_type: "",
      difficulty: "",
      language: "",
      xp: null,
      time_limit: null,
      trainer_question_count: null,
      student_question_count: null,
      published: true,
      history: [],
      staged_records: [],
      attached_screenshots: [],
      last_observation: ""
    };
    return currentSession;
  }

  function getSession() {
    return currentSession;
  }

  // -------------------------------------------------------------
  // 4. Duplicate Bug Matching Engine
  // -------------------------------------------------------------
  function searchExistingBugs(title, description, topic) {
    const defects = typeof StorageManager !== "undefined" ? StorageManager.getDefects() : [];
    if (!defects || defects.length === 0) return { match: null, confidence: "None" };

    const searchStr = `${title || ""} ${description || ""} ${topic || ""}`.toLowerCase();
    
    // 1. Check for strong keyword / semantic matches
    let bestMatch = null;
    let highestScore = 0;

    defects.forEach(defect => {
      const defectSummary = (defect.summary || defect.title || "").toLowerCase();
      const defectDesc = (defect.description || "").toLowerCase();
      const defectFull = `${defectSummary} ${defectDesc}`;

      let score = 0;

      // Boilerplate & compiler mismatch
      if (searchStr.includes("python") && searchStr.includes("java") && searchStr.includes("boilerplate") &&
          defectFull.includes("python") && defectFull.includes("java") && defectFull.includes("boilerplate")) {
        score = 0.95;
      } else if (searchStr.includes("python") && defectFull.includes("python") && 
                 (searchStr.includes("boilerplate") || searchStr.includes("compiler")) &&
                 (defectFull.includes("boilerplate") || defectFull.includes("compiler"))) {
        score = 0.65; // Medium confidence for Python -> C++ vs Python -> Java
      } else {
        // Token overlap scoring
        const words1 = searchStr.replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 3);
        const words2 = defectFull.replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 3);
        
        let matchingWords = 0;
        words1.forEach(w => {
          if (words2.includes(w)) matchingWords++;
        });

        if (words1.length > 0) {
          score = matchingWords / Math.max(words1.length, words2.length);
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = defect;
      }
    });

    if (highestScore >= 0.8) {
      return { match: bestMatch, confidence: "High", score: highestScore };
    } else if (highestScore >= 0.45) {
      return { match: bestMatch, confidence: "Medium", score: highestScore };
    }

    return { match: null, confidence: "None", score: 0 };
  }

  // -------------------------------------------------------------
  // 5. Intelligent NLP Fact Extraction & Reasoning
  // -------------------------------------------------------------
  function extractFactsFromContext(text, attachedImage = null) {
    const cleanText = text.trim();
    const lower = cleanText.toLowerCase();

    // 1. Detect Task Reference (e.g. "Test 5", "Test 4", "Test 1")
    const testMatch = cleanText.match(/\btest\s*(\d+)\b/i) || cleanText.match(/\btask\s*(\d+)\b/i);
    if (testMatch) {
      const testName = `Test ${testMatch[1]}`;
      currentSession.test_reference = testName;
      const ref = findTaskReference(testName);
      if (ref) {
        currentSession.task_type = ref.task_type || currentSession.task_type;
        currentSession.difficulty = ref.difficulty || currentSession.difficulty;
        currentSession.language = ref.language || currentSession.language;
        currentSession.xp = ref.xp || currentSession.xp;
        currentSession.time_limit = ref.time_limit || currentSession.time_limit;
        if (ref.question_count && currentSession.trainer_question_count === null) {
          currentSession.trainer_question_count = ref.question_count;
        }
      }
    }

    // 2. Detect Task Type
    if (/fill\s*in\s*the\s*blanks?/i.test(cleanText)) {
      currentSession.task_type = "Fill in the Blanks";
    } else if (/bug\s*fix/i.test(cleanText)) {
      currentSession.task_type = "Bug Fix";
    } else if (/practical\s*coding(?:\s*challenge)?|coding\s*challenge/i.test(cleanText)) {
      currentSession.task_type = "Practical Coding Challenge";
    } else if (/mcq|multiple\s*choice/i.test(cleanText)) {
      currentSession.task_type = "MCQ";
    }

    // 3. Detect Difficulty
    if (/\beasy\b/i.test(cleanText)) currentSession.difficulty = "Easy";
    else if (/\bmedium\b/i.test(cleanText)) currentSession.difficulty = "Medium";
    else if (/\bhard\b/i.test(cleanText)) currentSession.difficulty = "Hard";

    // 4. Detect Programming Language
    if (/\bpython\b/i.test(cleanText)) currentSession.language = "Python";
    else if (/\bjava\b/i.test(cleanText)) currentSession.language = "Java";
    else if (/\bc\+\+\b/i.test(cleanText)) currentSession.language = "C++";
    else if (/\bjavascript\b|\bjs\b/i.test(cleanText)) currentSession.language = "JavaScript";
    else if (/\btypescript\b|\bts\b/i.test(cleanText)) currentSession.language = "TypeScript";

    // 5. Detect Role / Side
    if (/\btrainer\s*(?:side|view|role|created|has|configured)?\b/i.test(cleanText) && 
        !(/\bstudent\s*(?:side|sees|only|opens|view)?\b/i.test(cleanText))) {
      currentSession.side = "Trainer";
    } else if (/\bstudent\s*(?:side|view|sees|opens|attempt|portal)?\b/i.test(cleanText) ||
               /\bas\s*a\s*student\b/i.test(cleanText) ||
               /\bfrom\s*the\s*student\b/i.test(cleanText)) {
      currentSession.side = "Student";
    }

    // 6. Detect Numerical Counts & Mismatches
    // Trainer counts
    const trainerCountMatch = cleanText.match(/trainer\s*(?:created|has|configured|side(?:\s*there\s*are)?)\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten|fifteen|twenty)\s*(?:questions?|tasks?|items?)?/i) ||
                             cleanText.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten|fifteen|twenty)\s*questions?\s*(?:from\s*the\s*trainer\s*side|by\s*trainer|configured)/i) ||
                             cleanText.match(/(\d+)\s*questions\b/i);

    const wordToNum = {
      one: 1, two: 2, three: 3, four: 4, five: 5,
      six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
      fifteen: 15, twenty: 20
    };

    function parseNum(val) {
      if (!val) return null;
      if (!isNaN(val)) return parseInt(val, 10);
      return wordToNum[val.toLowerCase()] || null;
    }

    if (trainerCountMatch) {
      const num = parseNum(trainerCountMatch[1]);
      if (num !== null) currentSession.trainer_question_count = num;
    }

    // Student counts
    const studentCountMatch = cleanText.match(/student\s*(?:only\s*)?(?:sees|gets|shows|has|view)\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i) ||
                             cleanText.match(/only\s*(?:see\s*)?(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:question|item)?\s*(?:is\s*visible|is\s*showing|shown|as\s*a\s*student)?/i) ||
                             cleanText.match(/only\s*(?:one|1)\s*(?:question\s*)?(?:is\s*)?(?:showing|visible|seen)/i);

    if (studentCountMatch) {
      let num = parseNum(studentCountMatch[1]);
      if (num === null && /only\s*(?:one|1)/i.test(cleanText)) num = 1;
      if (num !== null) currentSession.student_question_count = num;
    }

    // XP & Time
    const xpMatch = cleanText.match(/(\d+)\s*xp\b/i);
    if (xpMatch) currentSession.xp = parseInt(xpMatch[1], 10);
    const timeMatch = cleanText.match(/(\d+)\s*(?:mins?|minutes?)\b/i);
    if (timeMatch) currentSession.time_limit = parseInt(timeMatch[1], 10);

    // Image attachment
    if (attachedImage) {
      currentSession.attached_screenshots.push(attachedImage);
    }
  }

  // -------------------------------------------------------------
  // 6. Multi-Record Extraction & Record Builder
  // -------------------------------------------------------------
  function generateRecordsFromContext(userMessage, imageMetadata = null) {
    const text = (userMessage || "").trim();
    const cleanText = text;
    const dateStr = new Date().toISOString().split("T")[0];
    const generatedRecords = [];
    const questionsToAsk = [];

    // Check if tester provided a vague statement without any task context
    if (!currentSession.test_reference && !/\btest\s*\d+\b/i.test(text) && !/\btask\s*\d+\b/i.test(text)) {
      if (/only\s*(?:one|\d+)\s*question\s*(?:is\s*)?(?:showing|visible)|not\s*working|fails|broken/i.test(text)) {
        questionsToAsk.push("Which task/test number are you testing? (e.g. Test 4, Test 5)");
        return {
          records: [],
          questions: questionsToAsk,
          session: currentSession,
          needsClarification: true
        };
      }
    }

    const testRef = currentSession.test_reference || "Test Case";
    const moduleName = currentSession.module || "Tasks";
    const side = currentSession.side || "Student";
    const taskType = currentSession.task_type || "General Task";
    const lang = currentSession.language || "Not Provided";
    const diff = currentSession.difficulty || "Medium";

    // -------------------------------------------------------------
    // Finding 1: Numerical Question Count Mismatch (Bug)
    // -------------------------------------------------------------
    const hasStudentObservation = /student.*only.*(?:see|one|\d+)|only.*(?:one|1|\d+).*(?:showing|visible|seen)|student.*sees/i.test(text);
    const hasCountMismatch = currentSession.trainer_question_count !== null &&
                             currentSession.student_question_count !== null &&
                             currentSession.trainer_question_count !== currentSession.student_question_count;

    if ((hasStudentObservation && hasCountMismatch) || (/trainer/i.test(text) && /student/i.test(text) && /only/i.test(text))) {
      const trainerCount = currentSession.trainer_question_count || 5;
      const studentCount = currentSession.student_question_count || 1;
      const recordTitle = `${testRef}: Only ${studentCount === 1 ? 'one' : studentCount} of ${trainerCount} questions shown to student`;

      const alreadyStaged = currentSession.staged_records.some(r => r.title === recordTitle);
      if (!alreadyStaged) {
        // Duplicate matching check
        const bugSearch = searchExistingBugs(
          `${testRef}: Question count mismatch between Trainer and Student`,
          `Trainer created ${trainerCount} questions but student sees only ${studentCount}`,
          "Cross-role question count mismatch"
        );

        const bugId = bugSearch.match && bugSearch.confidence === "High" 
          ? bugSearch.match.id 
          : `BUG-${Math.floor(100 + Math.random() * 900)}`;

        const testCaseId = `TC-${moduleName.toUpperCase().substring(0, 4)}-${Math.floor(100 + Math.random() * 900)}`;

        const bugRecord = {
          test_module: "Tasks",
          test_case_id: testCaseId,
          test_case_type: "Bug",
          bug_id: bugId,
          date: dateStr,
          module: side === "Student" ? "Student Task Attempt" : "Trainer Task Configuration",
          feature: "Question Count / Visibility",
          bug_type: "Functional",
          severity: "Major",
          title: recordTitle,
          preconditions: `${testRef} is published as a ${taskType} (${diff}, ${lang}) with ${trainerCount} questions.`,
          steps_to_reproduce: [
            "Login as Trainer and verify task configuration has " + trainerCount + " questions published.",
            "Login as Student in separate session/browser.",
            "Navigate to Dashboard -> Tasks -> My Tasks -> Today's Task.",
            "Open " + testRef + " and observe loaded questions."
          ],
          expected_result: `Student should see all ${trainerCount} published questions.`,
          actual_result: `Student sees only ${studentCount} question${studentCount === 1 ? '' : 's'}.`,
          test_result: "Fail",
          ai_response: "Not Applicable",
          reference_answer: "Not Applicable",
          reproducibility: /reproduced|again/i.test(text) ? "Yes" : "Not Tested",
          screenshot_evidence: imageMetadata ? imageMetadata.name || "Screenshot attached" : "None",
          screenshot_data: imageMetadata ? imageMetadata.data : null,
          notes: `${testRef}; cross-role numerical mismatch detected (Trainer: ${trainerCount}, Student: ${studentCount}).`,
          bug_status: "Open",
          side: side,
          is_duplicate: bugSearch.match && bugSearch.confidence === "High",
          possible_duplicate: bugSearch.confidence === "Medium" ? bugSearch.match : null,
          duplicate_confidence: bugSearch.confidence
        };

        generatedRecords.push(bugRecord);
      }
    }

    // -------------------------------------------------------------
    // Finding 2: Unexpected Task Type / Injected Challenge (Bug)
    // -------------------------------------------------------------
    if (/coding\s*challenge.*shouldn't\s*be\s*there|unexpected.*task\s*type|practical\s*coding\s*challenge\s*incorrectly\s*appears/i.test(text) ||
        (/coding\s*challenge/i.test(text) && /shouldn't|unexpected|incorrect/i.test(text))) {
      
      const recordTitle = `${testRef}: Practical Coding Challenge incorrectly appears in Fill in the Blanks task`;
      const alreadyStaged = currentSession.staged_records.some(r => r.title === recordTitle);
      
      if (!alreadyStaged) {
        const bugSearch = searchExistingBugs(
          recordTitle,
          "Practical Coding Challenge appears inside a Fill in the Blanks task.",
          "Task type configuration mismatch"
        );

        const bugId = bugSearch.match && bugSearch.confidence === "High"
          ? bugSearch.match.id
          : `BUG-${Math.floor(100 + Math.random() * 900)}`;

        const testCaseId = `TC-${moduleName.toUpperCase().substring(0, 4)}-${Math.floor(100 + Math.random() * 900)}`;

        const unexpectedTypeRecord = {
          test_module: "Tasks",
          test_case_id: testCaseId,
          test_case_type: "Bug",
          bug_id: bugId,
          date: dateStr,
          module: "Student Task Attempt",
          feature: "Task Type / Content",
          bug_type: "Functional",
          severity: "Major",
          title: recordTitle,
          preconditions: `${testRef} is published as a ${taskType} task.`,
          steps_to_reproduce: [
            "Login as Student",
            "Open Dashboard",
            "Open Tasks -> My Tasks",
            "Open Today's Task",
            "Open " + testRef
          ],
          expected_result: "Only Fill in the Blanks content should be displayed.",
          actual_result: "A Practical Coding Challenge also appears.",
          test_result: "Fail",
          ai_response: "Not Applicable",
          reference_answer: "Not Applicable",
          reproducibility: /reproduced|again/i.test(text) ? "Yes" : "Not Tested",
          screenshot_evidence: imageMetadata ? imageMetadata.name || "Screenshot attached" : "None",
          screenshot_data: imageMetadata ? imageMetadata.data : null,
          notes: `${testRef}; unexpected task type displayed.`,
          bug_status: "Open",
          side: "Student",
          is_duplicate: bugSearch.match && bugSearch.confidence === "High",
          possible_duplicate: bugSearch.confidence === "Medium" ? bugSearch.match : null,
          duplicate_confidence: bugSearch.confidence
        };

        generatedRecords.push(unexpectedTypeRecord);
      }
    }

    // -------------------------------------------------------------
    // Finding 3: Language Boilerplate Mismatch (Bug) e.g. Python -> Java
    // -------------------------------------------------------------
    if (/python.*selected.*java.*boilerplate|showing\s*python.*compiler\s*has\s*java|java\s*starter\s*code|c\+\+\s*boilerplate/i.test(text)) {
      const isCpp = /c\+\+/i.test(text);
      const displayedLang = isCpp ? "C++" : "Java";
      const recordTitle = `${testRef}: Python selected but ${displayedLang} boilerplate displayed in code editor`;
      const alreadyStaged = currentSession.staged_records.some(r => r.title === recordTitle);

      if (!alreadyStaged) {
        const bugSearch = searchExistingBugs(
          "Python selected but Java boilerplate displayed",
          "Python language selected but compiler loads Java boilerplate starter code",
          "Boilerplate code editor"
        );

        const isHighDuplicate = !isCpp && bugSearch.match && bugSearch.confidence === "High";
        const isMediumDuplicate = isCpp && bugSearch.match;

        const bugId = isHighDuplicate ? bugSearch.match.id : `BUG-${Math.floor(100 + Math.random() * 900)}`;
        const testCaseId = `TC-${moduleName.toUpperCase().substring(0, 4)}-${Math.floor(100 + Math.random() * 900)}`;

        const boilerplateRecord = {
          test_module: "Tasks",
          test_case_id: testCaseId,
          test_case_type: "Bug",
          bug_id: bugId,
          date: dateStr,
          module: "Student Task Attempt",
          feature: "Compiler / Language Selector",
          bug_type: "Configuration",
          severity: "Major",
          title: recordTitle,
          preconditions: `${testRef} is configured with Python as the target programming language.`,
          steps_to_reproduce: [
            "Login as Student and open " + testRef,
            "Verify language dropdown displays 'Python'",
            "Inspect compiler code editor workspace"
          ],
          expected_result: "Code editor should initialize with Python boilerplate starter code.",
          actual_result: `Code editor initializes with ${displayedLang} boilerplate template code.`,
          test_result: "Fail",
          ai_response: "Not Applicable",
          reference_answer: "Not Applicable",
          reproducibility: /reproduced|again/i.test(text) ? "Yes" : "Not Tested",
          screenshot_evidence: imageMetadata ? imageMetadata.name || "Screenshot attached" : "None",
          screenshot_data: imageMetadata ? imageMetadata.data : null,
          notes: `${testRef}; language mismatch in compiler starter code.`,
          bug_status: "Open",
          side: "Student",
          is_duplicate: isHighDuplicate,
          possible_duplicate: isMediumDuplicate ? bugSearch.match : null,
          duplicate_confidence: isHighDuplicate ? "High" : (isMediumDuplicate ? "Medium" : "None")
        };

        generatedRecords.push(boilerplateRecord);
      }
    }

    // -------------------------------------------------------------
    // Finding 4: UI / UX Layout Enhancement (Enhancement)
    // -------------------------------------------------------------
    if (/ui\s*(?:is\s*)?(?:also\s*)?(?:very\s*)?bad|question\s*should\s*be\s*on\s*the\s*left|compiler\s*on\s*the\s*right|workspace\s*layout|should\s*be\s*improved|suggest|enhancement/i.test(text)) {
      const testCaseId = `TC-${moduleName.toUpperCase().substring(0, 4)}-${Math.floor(100 + Math.random() * 900)}`;

      let enhancementTitle = `${testRef}: Improve coding workspace layout`;
      let expectedLayout = "Question panel should be on the left and compiler/editor on the right for ergonomic viewing.";
      let actualLayout = "Current layout causes visual clutter and suboptimal positioning.";

      if (/question.*left.*compiler.*right/i.test(text)) {
        enhancementTitle = `${testRef}: Align question panel on left and compiler workspace on right`;
        expectedLayout = "Question description should be docked on the left panel and code compiler on the right.";
        actualLayout = "Current workspace layout lacks split-view alignment.";
      }

      const alreadyStaged = currentSession.staged_records.some(r => r.title === enhancementTitle);
      if (!alreadyStaged) {
        const enhancementRecord = {
          test_module: "Tasks",
          test_case_id: testCaseId,
          test_case_type: "Enhancement",
          bug_id: "", // Enhancements do not assign bug IDs by default
          date: dateStr,
          module: "Student Task Attempt",
          feature: "Workspace UI / Layout",
          bug_type: "UI Improvement",
          severity: "Medium",
          title: enhancementTitle,
          preconditions: `${testRef} is open in student attempt view.`,
          steps_to_reproduce: [
            "Open " + testRef + " workspace view as student",
            "Evaluate UI element placement and split panes"
          ],
          expected_result: expectedLayout,
          actual_result: actualLayout,
          test_result: "Pass",
          ai_response: "Not Applicable",
          reference_answer: "Not Applicable",
          reproducibility: "Not Applicable",
          screenshot_evidence: imageMetadata ? imageMetadata.name || "Screenshot attached" : "None",
          screenshot_data: imageMetadata ? imageMetadata.data : null,
          notes: `${testRef}; UX enhancement request for ergonomic coding split layout.`,
          bug_status: "Open",
          side: side,
          is_duplicate: false,
          possible_duplicate: null
        };

        generatedRecords.push(enhancementRecord);
      }
    }

    // -------------------------------------------------------------
    // Fallback: If no predefined pattern matched but text describes an actual defect or enhancement
    // -------------------------------------------------------------
    const isSetupOnly = /^(?:i'?m\s*(?:testing|starting)|it'?s\s+[a-z\s,]+|trainer\s*(?:created|has|configured)\s*\d+|now\s*i'?m\s*opening)/i.test(text) &&
                        !/fail|bug|defect|error|bad|issue|wrong|shouldn't|unexpected|only\s*one/i.test(text);

    if (generatedRecords.length === 0 && cleanText.length > 10 && !isSetupOnly) {
      const isNegative = /fail|bug|defect|error|crash|broken|incorrect|missing/i.test(text);
      const isEnhancement = /improve|enhancement|suggest|better|feature|layout/i.test(text);

      const recordType = isEnhancement ? "Enhancement" : (isNegative ? "Bug" : "Bug");
      const testCaseId = `TC-${moduleName.toUpperCase().substring(0, 4)}-${Math.floor(100 + Math.random() * 900)}`;
      const bugId = recordType === "Bug" ? `BUG-${Math.floor(100 + Math.random() * 900)}` : "";

      const genericRecord = {
        test_module: "Tasks",
        test_case_id: testCaseId,
        test_case_type: recordType,
        bug_id: bugId,
        date: dateStr,
        module: side === "Student" ? "Student Task Attempt" : "Trainer Task Configuration",
        feature: "General Observation",
        bug_type: recordType === "Bug" ? "Functional" : "UI Improvement",
        severity: "Major",
        title: `${testRef}: ${cleanText.substring(0, 65).replace(/[\r\n]+/g, " ")}...`,
        preconditions: `${testRef} accessible under ${moduleName}.`,
        steps_to_reproduce: [
          "Navigate to target module " + moduleName,
          "Execute action as " + side,
          "Verify outcome"
        ],
        expected_result: "System should perform action according to CampusOS specifications.",
        actual_result: cleanText,
        test_result: recordType === "Bug" ? "Fail" : "Pass",
        ai_response: "Not Applicable",
        reference_answer: "Not Applicable",
        reproducibility: "Not Tested",
        screenshot_evidence: imageMetadata ? imageMetadata.name || "Screenshot attached" : "None",
        screenshot_data: imageMetadata ? imageMetadata.data : null,
        notes: `${testRef}; recorded via Conversational AI QA Assistant.`,
        bug_status: "Open",
        side: side,
        is_duplicate: false,
        possible_duplicate: null
      };

      generatedRecords.push(genericRecord);
    }

    return {
      records: generatedRecords,
      questions: questionsToAsk,
      session: currentSession,
      needsClarification: questionsToAsk.length > 0
    };
  }

  // -------------------------------------------------------------
  // 7. Multi-Message Processing Orchestrator
  // -------------------------------------------------------------
  function processTesterMessage(userMessage, imageMetadata = null) {
    if (!userMessage && !imageMetadata) return null;
    const msg = (userMessage || "").trim();

    if (msg) {
      currentSession.history.push(msg);
      currentSession.last_observation = msg;
    }

    // Step 1: Extract facts & update persistent session context
    extractFactsFromContext(msg, imageMetadata);

    // Step 2: Generate candidate structured records
    const result = generateRecordsFromContext(msg, imageMetadata);

    // Step 3: Append newly extracted records to staged session pool
    if (result.records && result.records.length > 0) {
      result.records.forEach(rec => {
        currentSession.staged_records.push(rec);
      });
    }

    return {
      userMessage: msg,
      imageMetadata: imageMetadata,
      newRecords: result.records,
      allStagedRecords: currentSession.staged_records,
      questions: result.questions,
      needsClarification: result.needsClarification,
      session: currentSession
    };
  }

  // -------------------------------------------------------------
  // 8. EXACT 22-Column Export Utilities
  // -------------------------------------------------------------
  const EXACT_COLUMNS_KEYS = [
    "test_module",
    "test_case_id",
    "test_case_type",
    "bug_id",
    "date",
    "module",
    "feature",
    "bug_type",
    "severity",
    "title",
    "preconditions",
    "steps_to_reproduce",
    "expected_result",
    "actual_result",
    "test_result",
    "ai_response",
    "reference_answer",
    "reproducibility",
    "screenshot_evidence",
    "notes",
    "bug_status",
    "side"
  ];

  const EXACT_COLUMNS_HEADERS = [
    "Test Module",
    "Test Case ID",
    "Test Case Type",
    "Bug ID",
    "Date",
    "Module",
    "Feature",
    "Bug Type",
    "Severity",
    "Title",
    "Preconditions",
    "Steps to Reproduce",
    "Expected Result",
    "Actual Result",
    "Test Result",
    "AI Response",
    "Reference Answer",
    "Reproducibility",
    "Screenshot / Evidence",
    "Notes",
    "Bug Status",
    "Side"
  ];

  function formatRecordValue(key, record) {
    let val = record[key];
    if (val === undefined || val === null || val === "") {
      if (key === "bug_id" && record.test_case_type === "Enhancement") return "";
      if (key === "ai_response" || key === "reference_answer") return "Not Applicable";
      return "";
    }
    if (Array.isArray(val)) {
      return val.map((item, idx) => `${idx + 1}. ${item}`).join(" | ");
    }
    return String(val);
  }

  function exportRecordsToTSV(records) {
    if (!records || records.length === 0) return "";
    const rows = [];
    rows.push(EXACT_COLUMNS_HEADERS.join("\t"));

    records.forEach(rec => {
      const row = EXACT_COLUMNS_KEYS.map(k => {
        const str = formatRecordValue(k, rec);
        return str.replace(/\t/g, " ").replace(/[\r\n]+/g, " ");
      });
      rows.push(row.join("\t"));
    });

    return rows.join("\n");
  }

  function exportRecordsToCSV(records) {
    if (!records || records.length === 0) return "";
    const rows = [];
    
    // Header
    rows.push(EXACT_COLUMNS_HEADERS.map(h => `"${h.replace(/"/g, '""')}"`).join(","));

    records.forEach(rec => {
      const row = EXACT_COLUMNS_KEYS.map(k => {
        const str = formatRecordValue(k, rec);
        return `"${str.replace(/"/g, '""')}"`;
      });
      rows.push(row.join(","));
    });

    return rows.join("\r\n");
  }

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // -------------------------------------------------------------
  // 9. Speech-to-Text Controller (Web Speech API)
  // -------------------------------------------------------------
  let speechRecognitionInstance = null;
  let isListening = false;

  function initSpeechRecognition(onResultCallback, onStateChangeCallback) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Web Speech Recognition API is not supported in this browser.");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      isListening = true;
      if (onStateChangeCallback) onStateChangeCallback(true);
    };

    recognition.onend = () => {
      isListening = false;
      if (onStateChangeCallback) onStateChangeCallback(false);
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      isListening = false;
      if (onStateChangeCallback) onStateChangeCallback(false, event.error);
    };

    recognition.onresult = (event) => {
      let interim = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (onResultCallback) {
        onResultCallback({
          final: finalTranscript,
          interim: interim,
          fullText: (finalTranscript + " " + interim).trim()
        });
      }
    };

    speechRecognitionInstance = recognition;
    return recognition;
  }

  function toggleVoiceDictation(onResultCallback, onStateChangeCallback) {
    if (!speechRecognitionInstance) {
      initSpeechRecognition(onResultCallback, onStateChangeCallback);
    }

    if (!speechRecognitionInstance) {
      return { supported: false };
    }

    try {
      if (isListening) {
        speechRecognitionInstance.stop();
        isListening = false;
        return { supported: true, listening: false };
      } else {
        speechRecognitionInstance.start();
        isListening = true;
        return { supported: true, listening: true };
      }
    } catch (err) {
      console.warn("Speech recognition toggle error", err);
      return { supported: true, listening: false, error: err.message };
    }
  }

  // -------------------------------------------------------------
  // Public Interface
  // -------------------------------------------------------------
  return {
    getDropdowns,
    getTaskReferences,
    saveTaskReferences,
    findTaskReference,
    getSession,
    resetSession,
    processTesterMessage,
    extractFactsFromContext,
    searchExistingBugs,
    exportRecordsToTSV,
    exportRecordsToCSV,
    downloadFile,
    toggleVoiceDictation,
    isVoiceSupported: () => !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  };
})();

// Attach to global window
if (typeof window !== "undefined") {
  window.QAAssistant = QAAssistant;
}
