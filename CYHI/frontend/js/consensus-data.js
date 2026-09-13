// CYHI Firebase data layer

const FIREBASE_VERSION = "12.19.0";
const CONSENSUS_THRESHOLD = 3;
const DOUBT_SUBMISSION_COOLDOWN_MS = 12000;
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_DOUBT_LENGTH = 800;
const MAX_DISCUSSION_LENGTH = 1000;
const DEMO_ACCESS_DATA_URL = "data/demo-access.json";

// =====================================================
// PASTE YOUR FIREBASE CONFIG HERE
// =====================================================

const firebaseConfig = {
  apiKey: "AIzaSyBN0U2f8SWd3DVP7z_O-rEl_mwgPrCPgL8",
  authDomain: "cyhi-daf42.firebaseapp.com",
  projectId: "cyhi-daf42",
  storageBucket: "cyhi-daf42.firebasestorage.app",
  messagingSenderId: "374526862670",
  appId: "1:374526862670:web:f01840904dd26a38d9ea1f",
  measurementId: "G-0ERS6JKNYZ"
};

// =====================================================

const COURSE_INFO = {
  code: "CS101",
  name: "Data Structures",
  lecture: "Live Lecture",
  activeStudents: 0
};

const KEYS = {
  USER: "cyhi_user_v4",
  VIEW: "cyhi_view_v4",
  ACTIVE: "cyhi_active_doubt_v4",
  READ: "cyhi_read_notifications_v1",
  SUBMISSIONS: "cyhi_recent_submissions_v1",
  COOLDOWN: "cyhi_last_doubt_submission_v1"
};

const STOP = new Set(
  "the a an is are was were why what how does do can could should to of in on for and or with my i it this that be after before when where which from as at by about"
    .split(" ")
);

function normalizeCode(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeComparable(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function comparisonScore(a, b) {
  const A = new Set(normalizeComparable(a).split(" ").filter(Boolean));
  const B = new Set(normalizeComparable(b).split(" ").filter(Boolean));
  if (!A.size || !B.size) return 0;
  let common = 0;
  A.forEach(word => { if (B.has(word)) common += 1; });
  return common / new Set([...A, ...B]).size;
}

function moderationMessage(category, waitSeconds = 0) {
  if (category === "DUPLICATE") {
    return "You have already submitted a similar doubt.";
  }
  if (category === "COOLDOWN") {
    return `Please wait ${Math.max(1, waitSeconds)} second${waitSeconds === 1 ? "" : "s"} before submitting another doubt.`;
  }
  if (category === "NON_ACADEMIC") {
    return "Please enter a genuine academic/classroom question.";
  }
  if (category === "SPAM") {
    return "Please avoid repeated or meaningless submissions.";
  }
  return "Please enter a meaningful academic question.";
}

function localModerateText(text, context = "doubt") {
  const raw = String(text || "").trim();
  const maxLength = context === "discussion" ? MAX_DISCUSSION_LENGTH : MAX_DOUBT_LENGTH;
  const normalized = normalizeComparable(raw);
  const tokens = normalized.split(" ").filter(Boolean);
  const letters = (raw.match(/[a-z]/gi) || []).length;
  const symbols = (raw.match(/[^a-z0-9\s]/gi) || []).length;

  const reject = (category, reason) => ({
    allowed: false,
    category,
    reason,
    message: moderationMessage(category),
    source: "local"
  });

  if (!raw || raw.length < 4 || letters < 3) {
    return reject("GARBAGE", "Input is too short to be a meaningful academic message.");
  }

  if (raw.length > maxLength) {
    return reject("GARBAGE", "Input is excessively long for this classroom field.");
  }

  if (/([a-z0-9])\1{7,}/i.test(raw)) {
    return reject("GARBAGE", "Repeated characters detected.");
  }

  if (symbols >= 7 && symbols / Math.max(raw.length, 1) > 0.35) {
    return reject("GARBAGE", "Excessive symbols detected.");
  }

  if (tokens.length >= 4) {
    const counts = {};
    tokens.forEach(token => { counts[token] = (counts[token] || 0) + 1; });
    const maxRepeated = Math.max(...Object.values(counts));
    if (maxRepeated >= 4 || maxRepeated / tokens.length >= 0.7) {
      return reject("SPAM", "Repeated words detected.");
    }
  }

  const compact = normalized.replace(/\s/g, "");
  const keyboardRuns = ["asdfgh", "qwerty", "zxcvbn", "poiuy", "lkjhg", "mnbvc"];
  if (keyboardRuns.some(run => compact.includes(run))) {
    return reject("GARBAGE", "Keyboard-pattern gibberish detected.");
  }

  const suspiciousWord = tokens.some(token => {
    if (token.length < 9 || /\d/.test(token)) return false;
    const vowelCount = (token.match(/[aeiouy]/g) || []).length;
    return vowelCount / token.length < 0.12;
  });
  if (suspiciousWord && tokens.length <= 4) {
    return reject("GARBAGE", "Likely gibberish detected.");
  }


  // Keep the fallback conservative: valid short technical questions such as
  // "What is a stack?" must not be rejected merely because they are short.
  return {
    allowed: true,
    category: "ACADEMIC_VALID",
    reason: "Passed local classroom validation.",
    message: "",
    source: "local"
  };
}

let readyPromise = null;
let db = null;
let auth = null;
let authUser = null;
let messaging = null;
let messagingForegroundBound = false;

function getJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch (_) {
    return fallback;
  }
}

function putJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Login identity and the currently selected view are tab/session scoped.
// This is essential for classroom demos where several students are opened in
// separate tabs on the same computer. localStorage is shared across tabs and
// previously caused Nihaal/Kiran/Siri to overwrite one another.
function getSessionJSON(key, fallback) {
  try {
    return JSON.parse(sessionStorage.getItem(key)) ?? fallback;
  } catch (_) {
    return fallback;
  }
}

function putSessionJSON(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

function render() {
  if (typeof window.renderApp === "function") {
    window.renderApp();
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if ([...document.scripts].some(s => s.src === src)) {
      resolve();
      return;
    }

    const s = document.createElement("script");

    s.src = src;

    s.onload = resolve;

    s.onerror = () => {
      reject(new Error("Firebase SDK failed to load"));
    };

    document.head.appendChild(s);
  });
}

async function ready() {
  if (readyPromise) {
    return readyPromise;
  }

  readyPromise = (async () => {

    await loadScript(
      `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app-compat.js`
    );

    await loadScript(
      `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth-compat.js`
    );

    await loadScript(
      `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore-compat.js`
    );

    // Messaging is loaded with the existing Firebase compat stack so the project
    // can keep its current architecture. Browsers without Web Push support
    // continue working normally.
    try {
      await loadScript(
        `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-messaging-compat.js`
      );
    } catch (error) {
      console.warn("Firebase Messaging SDK is unavailable in this browser.", error);
    }

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    auth = firebase.auth();
    db = firebase.firestore();

    // Use SESSION persistence instead of Firebase's browser-wide LOCAL
    // persistence. Each tab/session can now represent a different classroom
    // participant while still sharing the same Firestore course data.
    try {
      await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
    } catch (error) {
      console.warn("Could not switch Firebase Auth to per-tab session persistence.", error);
    }

    // The original project used anonymous auth, but do not make the entire
    // classroom unusable if Anonymous Authentication has not yet been enabled
    // in a fresh Firebase console. Firestore access will still be subject to
    // whatever rules are published for the project.
    try {
      if (!auth.currentUser) {
        authUser = (await auth.signInAnonymously()).user;
      } else {
        authUser = auth.currentUser;
      }
    } catch (error) {
      console.warn("Anonymous Firebase sign-in is unavailable; continuing in demo compatibility mode.", error);
      authUser = null;
    }

    return authUser;
  })();

  return readyPromise;
}

function uid() {
  return authUser?.uid || auth?.currentUser?.uid || null;
}


function formatFirestoreTime(ts) {
  try {
    const date = ts?.toDate?.() || (ts instanceof Date ? ts : null);
    if (!date) return "";
    return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  } catch (_) {
    return "";
  }
}

function showPushToast(payload) {
  const data = payload?.data || {};
  const title = data.title || "New Student Doubt";
  const body = data.body || "A student raised a new doubt.";
  let host = document.getElementById("cyhi-push-toast");
  if (!host) {
    host = document.createElement("div");
    host.id = "cyhi-push-toast";
    host.className = "fixed right-4 top-4 z-[100] max-w-sm rounded-xl border border-border bg-card p-4 shadow-xl";
    document.body.appendChild(host);
  }
  host.innerHTML = `<div class="text-sm font-semibold text-foreground">${String(title).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]))}</div><div class="mt-1 text-xs text-muted-foreground">${String(body).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]))}</div>`;
  host.onclick = () => {
    const doubtId = data.doubtId || "";
    if (doubtId && window.store) window.store.setActiveDoubt(doubtId);
    if (window.store) window.store.setCurrentView("professor");
    window.location.hash = "professor";
    if (typeof window.renderApp === "function") window.renderApp();
    setTimeout(() => document.getElementById(`professor-doubt-${doubtId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
    host.remove();
  };
  clearTimeout(showPushToast._timer);
  showPushToast._timer = setTimeout(() => host?.remove(), 7000);
}

function words(s) {
  return new Set(
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter(x => x && !STOP.has(x))
  );
}

function score(a, b) {

  const A = words(a);
  const B = words(b);

  if (!A.size || !B.size) {
    return 0;
  }

  let common = 0;

  A.forEach(x => {
    if (B.has(x)) {
      common++;
    }
  });

  return common / new Set([...A, ...B]).size;
}

function age(ts) {

  const ms = ts?.toMillis?.() || 0;

  if (!ms) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor((Date.now() - ms) / 60000)
  );
}

function formatAge(minutes) {

  if (!minutes) {
    return "just now";
  }

  if (minutes === 1) {
    return "1 min ago";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const h = Math.floor(minutes / 60);

  return h === 1
    ? "1 hr ago"
    : `${h} hrs ago`;
}

function getDoubtState(count) {

  if (count >= CONSENSUS_THRESHOLD) {
    return "consensus";
  }

  if (count === CONSENSUS_THRESHOLD - 1) {
    return "approaching";
  }

  return "normal";
}

function isConsensus(doubt) {

  return !!doubt &&
    doubt.confusionCount >= CONSENSUS_THRESHOLD;
}


// =====================================================
// CONSENSUS STORE
// =====================================================

class ConsensusStore {

  constructor() {

    this.doubts = [];

    this.notifications = [];

    this.currentUser =
      getSessionJSON(KEYS.USER, null);

    this.activeDoubtId =
      sessionStorage.getItem(KEYS.ACTIVE) || null;

    this.currentView =
      sessionStorage.getItem(KEYS.VIEW) || "landing";

    this.started = false;
    this.realtimeError = "";
    this.unsubscribeConfusions = null;
    this.presenceTimer = null;

    if (this.currentUser?.courseCode) {
      COURSE_INFO.code = normalizeCode(this.currentUser.courseCode);
      COURSE_INFO.name = this.currentUser.courseName || COURSE_INFO.name;
    }

    this.sync();
  }


  save() {

    if (this.currentUser) {

      sessionStorage.setItem(
        KEYS.USER,
        JSON.stringify(this.currentUser)
      );

    } else {

      sessionStorage.removeItem(KEYS.USER);

    }

    sessionStorage.setItem(
      KEYS.VIEW,
      this.currentView
    );

    if (this.activeDoubtId) {

      sessionStorage.setItem(
        KEYS.ACTIVE,
        this.activeDoubtId
      );

    } else {
      sessionStorage.removeItem(KEYS.ACTIVE);
    }
  }


  async sync() {

    try {

      await ready();

      // Do not read/write classroom data until the user has completed the
      // join flow. This is important once the Firestore access rules below
      // are enabled.
      if (!this.currentUser?.accessVerified) {
        render();
        return;
      }

      await this.presence();

      if (!this.started) {
        this.listen();
      }

      await this.refresh();

      if (this.currentUser?.role === "professor") {
        this.initializeProfessorPushListener().catch(console.warn);
      }

      render();

    } catch (e) {

      console.error(
        "CYHI Firebase:",
        e
      );

    }
  }


  listen() {

    if (this.unsubscribeConfusions) {
      this.unsubscribeConfusions();
      this.unsubscribeConfusions = null;
    }

    if (this.presenceTimer) {
      clearInterval(this.presenceTimer);
      this.presenceTimer = null;
    }

    this.started = true;
    const listeningCourse = COURSE_INFO.code;

    this.unsubscribeConfusions = db.collection("confusions")
      .where(
        "classId",
        "==",
        listeningCourse
      )
      .onSnapshot(

        () => {

          this.realtimeError = "";

          // Ignore late callbacks from a course the user has already left.
          if (listeningCourse !== COURSE_INFO.code) return;

          this.refresh()
            .then(render)
            .catch(console.error);

        },

        e => {

          console.error(
            "Firestore shared-course listener failed:",
            e
          );

          this.realtimeError =
            e?.code === "permission-denied"
              ? "Firestore blocked shared course updates. Publish the included firestore.rules, then reload."
              : "Live classroom updates are temporarily unavailable.";
          render();

        }
      );

    this.presenceTimer = setInterval(
      () => {
        this.presence().catch(() => {});
      },
      20000
    );
  }


  async presence() {

    await ready();

    const id = uid();

    if (!id) {
      return;
    }

    await db
      .collection("presence")
      .doc(id)
      .set(
        {
          classId: COURSE_INFO.code,

          role:
            this.currentUser?.role ||
            "student",

          updatedAt:
            firebase.firestore.FieldValue.serverTimestamp()
        },
        {
          merge: true
        }
      );


    const snap =
      await db
        .collection("presence")
        .where(
          "classId",
          "==",
          COURSE_INFO.code
        )
        .get();


    const cutoff =
      Date.now() - 90000;


    COURSE_INFO.activeStudents =
      snap.docs.filter(d => {

        const x = d.data();

        return (
          x.role === "student" &&
          (x.updatedAt?.toMillis?.() || 0)
            >= cutoff
        );

      }).length;
  }


  setCourse(courseCode, courseData = {}) {
    const code = normalizeCode(courseCode);
    if (!code) return;

    const changed = COURSE_INFO.code !== code;
    COURSE_INFO.code = code;
    COURSE_INFO.name = courseData.courseName || courseData.name || COURSE_INFO.name || code;
    COURSE_INFO.lecture = courseData.lecture || "Live Lecture";

    if (changed) {
      this.doubts = [];
      this.notifications = [];
      this.activeDoubtId = null;
      this.started = false;
      if (this.unsubscribeConfusions) {
        this.unsubscribeConfusions();
        this.unsubscribeConfusions = null;
      }
      if (this.presenceTimer) {
        clearInterval(this.presenceTimer);
        this.presenceTimer = null;
      }
    }
  }

  async loadDemoAccessData() {
    // Loaded as a separate data file so the demo fallback also works when the
    // HTML is opened directly, where fetch(file://...) may be blocked.
    if (window.CYHI_DEMO_ACCESS) {
      return window.CYHI_DEMO_ACCESS;
    }

    try {
      const response = await fetch(DEMO_ACCESS_DATA_URL, { cache: "no-store" });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.warn("Bundled demo access data could not be loaded:", error);
      return null;
    }
  }

  async verifyDemoStudent(studentId, courseCode) {
    const data = await this.loadDemoAccessData();
    if (!data) return null;

    const sid = normalizeCode(studentId);
    const code = normalizeCode(courseCode);
    const student = data.students?.[sid];
    const course = data.courses?.[code];
    const enrollment = data.enrollments?.[sid];

    if (!course) {
      return { allowed: false, message: "Invalid course code." };
    }
    if (!student) {
      return { allowed: false, message: "Student ID not found." };
    }
    if (!enrollment) {
      return { allowed: false, message: "No course enrollment was found for this Student ID." };
    }

    const enrolledCourses = Array.isArray(enrollment.courses)
      ? enrollment.courses.map(normalizeCode)
      : [];

    if (!enrolledCourses.includes(code)) {
      return { allowed: false, message: "You are not enrolled in this course." };
    }

    return { allowed: true, student, course, enrollment, source: "bundled-demo" };
  }

  async authorizeJoin({ role, studentId, courseCode, name, email }) {
    await ready();

    const normalizedRole = ["student", "ta", "professor"].includes(role) ? role : "student";
    const code = normalizeCode(courseCode);
    const sid = normalizeCode(studentId);

    if (!code) {
      return { allowed: false, message: "Please enter a course code." };
    }

    if (normalizedRole === "student" && !sid) {
      return { allowed: false, message: "Please enter your Student ID." };
    }

    let courseData = null;
    let studentData = null;
    let enrollmentData = null;
    let accessSource = "firestore";
    let firestoreLookupError = null;

    // Primary path: verify the new access-control collections in Firestore.
    try {
      const courseSnap = await db.collection("courses").doc(code).get();

      if (courseSnap.exists) {
        courseData = courseSnap.data() || {};

        if (normalizedRole === "student") {
          const [studentSnap, enrollmentSnap] = await Promise.all([
            db.collection("students").doc(sid).get(),
            db.collection("enrollments").doc(sid).get()
          ]);

          if (!studentSnap.exists || !enrollmentSnap.exists) {
            // A partially seeded Firebase project should not lock out the
            // supplied demo users. Treat incomplete master data the same as
            // an unseeded project and validate against the bundled seed.
            courseData = null;
          } else {
            studentData = studentSnap.data() || {};
            enrollmentData = enrollmentSnap.data() || {};
            const enrolledCourses = Array.isArray(enrollmentData.courses)
              ? enrollmentData.courses.map(normalizeCode)
              : [];

            // If Firestore has a complete enrollment record, it is
            // authoritative. Do not let the demo fallback override a real
            // "not enrolled" decision.
            if (!enrolledCourses.includes(code)) {
              return { allowed: false, message: "You are not enrolled in this course." };
            }
          }
        }
      }
    } catch (error) {
      firestoreLookupError = error;
      console.warn("Firestore access-control lookup was unavailable; checking bundled demo access data.", error);
    }

    // Compatibility path for the supplied project ZIP. This prevents a fresh
    // download from becoming impossible to enter before the new Firestore
    // master-data collections have been seeded. The data lives in a separate
    // JSON seed file, not in application logic. Once Firestore documents are
    // present, this branch is not used.
    if (!courseData) {
      if (normalizedRole === "student") {
        const demo = await this.verifyDemoStudent(sid, code);
        if (!demo?.allowed) {
          if (firestoreLookupError && !demo) {
            return {
              allowed: false,
              message: "Could not verify the course right now. Check Firebase connectivity and try again."
            };
          }
          return demo || { allowed: false, message: "Invalid course code." };
        }
        studentData = demo.student || {};
        enrollmentData = demo.enrollment || {};
        courseData = demo.course || {};
        accessSource = "bundled-demo";
      } else {
        const demoData = await this.loadDemoAccessData();
        const demoCourse = demoData?.courses?.[code];
        if (!demoCourse) {
          return { allowed: false, message: "Invalid course code." };
        }
        courseData = demoCourse;
        accessSource = "bundled-demo";
      }
    }

    let user;

    if (normalizedRole === "student") {
      user = {
        name: studentData?.name || "Student",
        roll: sid,
        studentId: sid,
        section: studentData?.section || enrollmentData?.section || "",
        email: studentData?.email || "",
        courseCode: code,
        courseName: courseData?.courseName || courseData?.name || code,
        role: "student",
        accessVerified: true,
        accessSource
      };
    } else {
      user = {
        name: String(name || "").trim() || (normalizedRole === "ta" ? "Teaching Assistant" : "Professor"),
        roll: "",
        email: String(email || "").trim(),
        courseCode: code,
        courseName: courseData?.courseName || courseData?.name || code,
        role: normalizedRole,
        accessVerified: true,
        accessSource
      };
    }

    this.setCourse(code, courseData || {});

    // Secure session binding is preferred when Firebase Auth + the upgraded
    // rules are available. In bundled-demo compatibility mode it is best-effort
    // instead of a hard login blocker, preserving the original working demo.
    const currentUid = uid();
    if (currentUid) {
      try {
        await db.collection("accessSessions").doc(currentUid).set({
          uid: currentUid,
          role: normalizedRole,
          studentId: normalizedRole === "student" ? sid : "",
          displayName: user.name || "",
          courseCode: code,
          accessSource,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.warn("Access session could not be stored; continuing with verified demo access.", error);
        if (accessSource === "firestore") {
          return {
            allowed: false,
            message: "Your enrollment was verified, but Firebase blocked the classroom session. Publish the included Firestore rules and try again."
          };
        }
      }
    }

    return { allowed: true, user, course: { code, ...(courseData || {}) }, accessSource };
  }

  async moderateText(text, context = "doubt") {
    const local = localModerateText(text, context);
    if (!local.allowed) return local;

    // Optional AI layer. When the project is served by backend/server.js and
    // OPENAI_API_KEY is configured, this endpoint uses whole-message AI academic relevance classification.
    // Static/Firebase-only deployments simply fall back to the local result.
    if (!/^https?:$/.test(window.location.protocol)) return local;

    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 12000) : null;

    try {
      const response = await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: String(text || ""), context }),
        signal: controller?.signal
      });

      if (!response.ok) {
        let failure = null;
        try { failure = await response.json(); } catch (_) {}
        console.warn("CYHI AI moderation endpoint returned", response.status);
        return {
          allowed: false,
          category: failure?.category || "MODERATION_UNAVAILABLE",
          reason: failure?.reason || "AI moderation endpoint is unavailable.",
          message: failure?.message || "AI moderation is temporarily unavailable. Please try again.",
          source: failure?.source || "ai-unavailable"
        };
      }
      const result = await response.json();
      if (result && typeof result.allowed === "boolean") {
        console.info("CYHI moderation decision:", result.source || "server", result.category || "UNKNOWN");
        return {
          allowed: result.allowed,
          category: result.category || (result.allowed ? "ACADEMIC_VALID" : "NON_ACADEMIC"),
          reason: result.reason || (result.allowed ? "Message is academically relevant." : "Message is not academically relevant."),
          message: result.allowed ? "" : (result.message || moderationMessage(result.category || "NON_ACADEMIC")),
          source: result.source || "ai"
        };
      }
    } catch (error) {
      console.warn("CYHI AI moderation unavailable:", error?.message || error);
      return {
        allowed: false,
        category: "MODERATION_UNAVAILABLE",
        reason: error?.message || "AI moderation request failed.",
        message: "AI moderation is temporarily unavailable. Please try again.",
        source: "ai-unavailable"
      };
    } finally {
      if (timer) clearTimeout(timer);
    }

    return {
      allowed: false,
      category: "MODERATION_UNAVAILABLE",
      reason: "AI moderation returned no decision.",
      message: "AI moderation is temporarily unavailable. Please try again.",
      source: "ai-unavailable"
    };
  }

  submissionKey() {
    return `${uid() || "anonymous"}::${COURSE_INFO.code}`;
  }

  findDuplicateSubmission(question) {
    const now = Date.now();
    const key = this.submissionKey();
    const all = getJSON(KEYS.SUBMISSIONS, {});
    const recent = Array.isArray(all[key]) ? all[key] : [];

    const historicalDuplicate = recent.some(item =>
      now - Number(item.at || 0) <= DUPLICATE_WINDOW_MS &&
      Math.max(
        comparisonScore(question, item.text || ""),
        score(question, item.text || "")
      ) >= 0.72
    );

    if (historicalDuplicate) return true;

    return this.doubts.some(d =>
      d.status !== "resolved" &&
      d.supportedByMe &&
      Math.max(
        comparisonScore(question, d.question),
        score(question, d.question)
      ) >= 0.72
    );
  }

  getCooldownRemaining() {
    const key = this.submissionKey();
    const all = getJSON(KEYS.COOLDOWN, {});
    const last = Number(all[key] || 0);
    const remaining = DOUBT_SUBMISSION_COOLDOWN_MS - (Date.now() - last);
    return Math.max(0, Math.ceil(remaining / 1000));
  }

  recordSubmission(question) {
    const key = this.submissionKey();
    const now = Date.now();

    const cooldowns = getJSON(KEYS.COOLDOWN, {});
    cooldowns[key] = now;
    putJSON(KEYS.COOLDOWN, cooldowns);

    const all = getJSON(KEYS.SUBMISSIONS, {});
    const recent = (Array.isArray(all[key]) ? all[key] : [])
      .filter(item => now - Number(item.at || 0) <= DUPLICATE_WINDOW_MS)
      .slice(-9);
    recent.push({ text: normalizeComparable(question), at: now });
    all[key] = recent;
    putJSON(KEYS.SUBMISSIONS, all);
  }

  async validateDoubtSubmission(question) {
    const moderation = await this.moderateText(question, "doubt");
    if (!moderation.allowed) return moderation;

    if (this.findDuplicateSubmission(question)) {
      return {
        allowed: false,
        category: "DUPLICATE",
        message: moderationMessage("DUPLICATE"),
        reason: "A similar recent submission from this student already exists."
      };
    }

    const waitSeconds = this.getCooldownRemaining();
    if (waitSeconds > 0) {
      return {
        allowed: false,
        category: "COOLDOWN",
        waitSeconds,
        message: moderationMessage("COOLDOWN", waitSeconds),
        reason: "Submission cooldown is active."
      };
    }

    return moderation;
  }

  async refresh() {

    await ready();

    const snap =
      await db
        .collection("confusions")
        .where(
          "classId",
          "==",
          COURSE_INFO.code
        )
        .get();


    const uidNow = uid();


    const docs =
      snap.docs
        .map(d => ({
          id: d.id,
          ...d.data()
        }))
        .sort(
          (a, b) =>
            (b.createdAt?.toMillis?.() || 0) -
            (a.createdAt?.toMillis?.() || 0)
        );


    this.doubts =
      await Promise.all(
        docs.map(
          d => this.mapDoubt(d, uidNow)
        )
      );


    if (
      !this.activeDoubtId &&
      this.doubts[0]
    ) {

      this.activeDoubtId =
        this.doubts[0].id;

    }


    const read =
      getJSON(KEYS.READ, []);


    this.notifications =
      this.doubts
        .filter(
          d => d.consensusReached
        )
        .map(d => ({

          id:
            `consensus-${d.id}`,

          topic:
            d.topic,

          question:
            d.question,

          count:
            d.confusionCount,

          read:
            read.includes(
              `consensus-${d.id}`
            )

        }));


    this.save();
  }


  async mapDoubt(d, uidNow) {

    const msgSnap =
      await db
        .collection("confusions")
        .doc(d.id)
        .collection("messages")
        .orderBy(
          "createdAt",
          "asc"
        )
        .get();


    const messages =
      msgSnap.docs.map(m => {

        const x = m.data();

        let author =
          "Anonymous Student";


        if (x.role === "ta") {

          author =
            "Teaching Assistant";

        } else if (
          x.role === "professor"
        ) {

          author =
            "Professor";

        } else if (
          x.authorUid === uidNow
        ) {

          author =
            this.currentUser?.name ||
            "You";

        }


        return {

          id: m.id,

          author,

          role:
            x.role || "student",

          text:
            x.text || "",

          ageMinutes:
            age(x.createdAt)

        };

      });


    const contributors =
      d.contributors || {};


    let authorName =
      "Anonymous Student";

    let authorRoll = "";


    if (d.consensusReached) {

      authorName =
        "Class Consensus";

    } else if (
      d.authorUid === uidNow
    ) {

      authorName =
        this.currentUser?.name ||
        "You";

      authorRoll =
        this.currentUser?.roll ||
        "";

    }


    return {

      id: d.id,

      topic:
        d.topic || "General",

      category:
        d.category || "Concept",

      question:
        d.question || "",

      authorName,

      authorRoll,

      confusionCount:
        Number(
          d.confusionCount || 1
        ),

      ageMinutes:
        age(d.createdAt),

      status:
        d.status || "open",

      answer:
        d.taAnswer || d.answer || "",

      taAnswer:
        d.taAnswer || d.answer || "",

      taId:
        d.taId || "",

      taName:
        d.taName || "",

      answeredAt:
        formatFirestoreTime(d.answeredAt),

      isMine:
        !!uidNow && d.authorUid === uidNow,

      supportedByMe:
        !d.consensusReached &&
        !!uidNow &&
        !!contributors[uidNow],

      resolvedInLecture:
        !!d.resolvedInLecture,

      consensusReached:
        !!d.consensusReached,

      messages

    };
  }


  getDoubt(id) {

    return this.doubts.find(
      d => d.id === id
    );

  }


  async addDoubt({
    topic,
    category,
    question
  }) {

    const validation = await this.validateDoubtSubmission(question);
    if (!validation.allowed) {
      return { ok: false, ...validation };
    }

    const local = {

      id:
        `pending-${Date.now()}`,

      topic:
        topic.trim(),

      category:
        category || "Concept",

      question:
        question.trim(),

      authorName:
        this.currentUser?.name ||
        "You",

      authorRoll:
        this.currentUser?.roll ||
        "",

      confusionCount: 1,

      ageMinutes: 0,

      status: "open",

      supportedByMe: true,

      resolvedInLecture: false,

      consensusReached: false,

      messages: []

    };


    this.doubts.unshift(local);

    this.activeDoubtId =
      local.id;

    this.save();

    render();


    try {
      await this.createDoubt(
        topic.trim(),
        category || "Concept",
        question.trim()
      );
      this.recordSubmission(question);
      return { ok: true, doubt: local };
    } catch (error) {
      console.error(error);
      this.doubts = this.doubts.filter(d => d.id !== local.id);
      await this.refresh().catch(() => {});
      render();
      return {
        ok: false,
        category: "ERROR",
        message: "Your doubt could not be submitted. Please try again.",
        reason: String(error?.message || error)
      };
    }
  }


  async createDoubt(
    topic,
    category,
    question
  ) {

    await ready();

    const id = uid();


    const snap =
      await db
        .collection("confusions")
        .where(
          "classId",
          "==",
          COURSE_INFO.code
        )
        .get();


    let match = null;

    let best = 0;


    snap.forEach(doc => {

      const d = doc.data();


      if (
        d.status === "resolved" ||
        d.consensusReached
      ) {

        return;

      }


      const topicSame =
        words(topic).size &&
        score(topic, d.topic) >= 0.8;


      const s =
        topicSame
          ? 1
          : Math.max(
              score(question, d.question),
              score(
                `${topic} ${question}`,
                `${d.topic} ${d.question}`
              )
            );


      if (s > best) {

        best = s;

        match = doc.id;

      }

    });


    if (
      match &&
      best >= 0.35
    ) {

      await this.supportOnServer(
        match,
        id
      );

      this.activeDoubtId =
        match;

    } else {

      const ref =
        db
          .collection("confusions")
          .doc();


      await ref.set({

        classId:
          COURSE_INFO.code,

        topic,

        category,

        question,

        authorUid:
          id,

        confusionCount: 1,

        contributors: {
          [id]: true
        },

        consensusReached: false,

        status: "open",

        answer: "",
        taAnswer: "",
        taId: "",
        taName: "",
        answeredAt: null,

        resolvedInLecture: false,

        createdAt:
          firebase.firestore.FieldValue.serverTimestamp(),

        updatedAt:
          firebase.firestore.FieldValue.serverTimestamp()

      });


      this.activeDoubtId =
        ref.id;

    }


    await this.refresh();

    render();
  }


  supportDoubt(doubtId) {

    const d =
      this.getDoubt(doubtId);


    if (
      !d ||
      d.supportedByMe ||
      d.status === "resolved" ||
      d.consensusReached
    ) {

      return false;

    }


    d.supportedByMe = true;

    d.confusionCount++;

    render();


    this.supportOnServer(
      doubtId,
      uid()
    )
      .then(
        () => this.refresh()
      )
      .then(
        render
      )
      .catch(e => {

        console.error(e);

        d.supportedByMe = false;

        d.confusionCount--;

        render();

      });


    return true;
  }


  async supportOnServer(
    doubtId,
    userId
  ) {

    await ready();


    const ref =
      db
        .collection("confusions")
        .doc(doubtId);


    let reached = false;


    await db.runTransaction(
      async tx => {

        const snap =
          await tx.get(ref);


        if (!snap.exists) {
          return;
        }


        const d =
          snap.data();


        if (
          d.status === "resolved" ||
          d.consensusReached
        ) {

          return;

        }


        const contributors =
          {
            ...(d.contributors || {})
          };


        if (
          contributors[userId]
        ) {

          return;

        }


        contributors[userId] = true;


        const count =
          Object.keys(
            contributors
          ).length;


        reached =
          count >=
          CONSENSUS_THRESHOLD;


        tx.update(
          ref,
          {

            confusionCount:
              count,

            contributors:
              reached
                ? {}
                : contributors,

            consensusReached:
              reached,

            updatedAt:
              firebase.firestore.FieldValue.serverTimestamp(),

            ...(reached
              ? {
                  consensusReachedAt:
                    firebase.firestore.FieldValue.serverTimestamp()
                }
              : {})

          }
        );

      }
    );


    if (reached) {

      await this.deleteStudentMessages(
        doubtId
      );

    }
  }


  async deleteStudentMessages(
    doubtId
  ) {

    const snap =
      await db
        .collection("confusions")
        .doc(doubtId)
        .collection("messages")
        .get();


    const batch =
      db.batch();


    snap.docs.forEach(doc => {

      if (
        (doc.data().role || "student") ===
        "student"
      ) {

        batch.delete(doc.ref);

      }

    });


    if (snap.docs.length) {

      await batch.commit();

    }
  }


  async addMessage(
    doubtId,
    text
  ) {

    const d =
      this.getDoubt(doubtId);


    if (
      !d ||
      !text.trim()
    ) {

      return { ok: false, message: "Message cannot be empty." };

    }


    const role =
      this.currentUser?.role ||
      "student";

    if (role === "student") {
      const moderation = await this.moderateText(text, "discussion");
      if (!moderation.allowed) {
        return { ok: false, ...moderation };
      }
    }


    const msg = {

      id:
        `local-${Date.now()}`,

      author:
        role === "ta"
          ? "Teaching Assistant"
          : role === "professor"
            ? "Professor"
            : this.currentUser?.name ||
              "You",

      role,

      text:
        text.trim(),

      ageMinutes: 0

    };


    d.messages.push(msg);

    render();


    try {
      await this.saveMessage(
        doubtId,
        text.trim()
      );
      await this.refresh();
      render();
      return { ok: true, message: msg };
    } catch (error) {
      console.error(error);
      d.messages = d.messages.filter(item => item.id !== msg.id);
      render();
      return { ok: false, message: "Message could not be sent. Please try again." };
    }
  }


  async saveMessage(
    doubtId,
    text
  ) {

    await ready();


    const ref =
      db
        .collection("confusions")
        .doc(doubtId);


    const snap =
      await ref.get();


    if (!snap.exists) {
      return;
    }


    if (
      snap.data().consensusReached &&
      this.currentUser?.role === "student"
    ) {

      return;

    }


    await ref
      .collection("messages")
      .add({

        authorUid:
          uid(),

        role:
          this.currentUser?.role ||
          "student",

        text,

        createdAt:
          firebase.firestore.FieldValue.serverTimestamp()

      });
  }


  async answerDoubt(
    doubtId,
    text
  ) {
    const d = this.getDoubt(doubtId);
    const cleanText = String(text || "").trim();

    if (!d || !cleanText) {
      return { ok: false, message: "Answer cannot be empty." };
    }

    const taId = uid() || "";
    const taName = this.currentUser?.name || "Teaching Assistant";

    try {
      // IMPORTANT: update the SAME Firestore document by its real document ID.
      // The class onSnapshot listener then refreshes every connected client.
      await this.update(doubtId, {
        answer: cleanText,          // retained for backwards compatibility
        taAnswer: cleanText,
        taId,
        taName,
        status: "answered",
        answeredAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return { ok: true };
    } catch (error) {
      console.error("TA answer could not be saved:", error);
      return { ok: false, message: "The answer could not be saved to Firebase. Please try again." };
    }
  }

  resolveDoubt(
    doubtId,
    note
  ) {

    const d =
      this.getDoubt(doubtId);


    if (!d) {
      return;
    }


    d.status =
      "resolved";

    d.resolvedInLecture =
      true;

    d.answer =
      note ||
      d.answer;


    render();


    this.update(
      doubtId,
      {

        status:
          "resolved",

        resolvedInLecture:
          true,

        answer:
          note ||
          d.answer

      }
    )
      .catch(
        console.error
      );
  }


  async update(
    doubtId,
    data
  ) {

    await ready();


    await db
      .collection("confusions")
      .doc(doubtId)
      .update({

        ...data,

        updatedAt:
          firebase.firestore.FieldValue.serverTimestamp()

      });


    await this.refresh();

    render();
  }


  async enableProfessorPushNotifications() {
    await ready();

    if (this.currentUser?.role !== "professor") {
      return { ok: false, status: "not-professor" };
    }
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !firebase.messaging) {
      return { ok: false, status: "unsupported", message: "Web push is not supported in this browser." };
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { ok: false, status: permission, message: "Notification permission was not granted." };
    }

    const vapidKey = String(window.CYHI_FIREBASE_VAPID_KEY || "").trim();
    if (!vapidKey || vapidKey.includes("PASTE_")) {
      console.warn("Set CYHI_FIREBASE_VAPID_KEY in js/firebase-messaging-config.js before enabling FCM push.");
      return { ok: false, status: "missing-vapid", message: "Firebase Web Push key has not been configured yet." };
    }

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    messaging = messaging || firebase.messaging();

    const token = await messaging.getToken({
      vapidKey,
      serviceWorkerRegistration: registration
    });

    if (!token) {
      return { ok: false, status: "no-token", message: "Firebase did not return a notification token." };
    }

    const currentUid = uid();
    if (!currentUid) {
      return { ok: false, status: "no-auth", message: "Firebase authentication is required for push notifications." };
    }

    await db.collection("fcmTokens").doc(currentUid).set({
      uid: currentUid,
      role: "professor",
      courseCode: COURSE_INFO.code,
      tokens: firebase.firestore.FieldValue.arrayUnion(token),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    if (!messagingForegroundBound) {
      messagingForegroundBound = true;
      messaging.onMessage((payload) => {
        showPushToast(payload);
      });
    }

    return { ok: true, status: "enabled" };
  }

  async initializeProfessorPushListener() {
    if (this.currentUser?.role !== "professor") return;
    if (!("serviceWorker" in navigator) || !firebase.messaging) return;
    if (Notification.permission !== "granted") return;

    // Re-register the foreground handler on page load. Token registration is
    // attempted only when the public VAPID key is configured.
    messaging = messaging || firebase.messaging();
    if (!messagingForegroundBound) {
      messagingForegroundBound = true;
      messaging.onMessage((payload) => showPushToast(payload));
    }

    const vapidKey = String(window.CYHI_FIREBASE_VAPID_KEY || "").trim();
    if (!vapidKey || vapidKey.includes("PASTE_")) return;
    try {
      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      const token = await messaging.getToken({ vapidKey, serviceWorkerRegistration: registration });
      const currentUid = uid();
      if (token && currentUid) {
        await db.collection("fcmTokens").doc(currentUid).set({
          uid: currentUid,
          role: "professor",
          courseCode: COURSE_INFO.code,
          tokens: firebase.firestore.FieldValue.arrayUnion(token),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
    } catch (error) {
      console.warn("Professor push token refresh failed:", error);
    }
  }

  markNotificationsRead() {

    const old =
      getJSON(
        KEYS.READ,
        []
      );


    const all =
      [
        ...new Set(
          [
            ...old,
            ...this.notifications.map(
              n => n.id
            )
          ]
        )
      ];


    putJSON(
      KEYS.READ,
      all
    );


    this.notifications.forEach(
      n => n.read = true
    );
  }


  setUser(user) {

    if (!user) {

      this.currentUser =
        null;

      this.doubts = [];
      this.notifications = [];
      this.started = false;
      if (this.unsubscribeConfusions) {
        this.unsubscribeConfusions();
        this.unsubscribeConfusions = null;
      }
      if (this.presenceTimer) {
        clearInterval(this.presenceTimer);
        this.presenceTimer = null;
      }

      this.save();

      return;

    }


    this.currentUser = {

      ...user,

      sessionId:
        user.sessionId ||
        (
          crypto.randomUUID
            ? crypto.randomUUID()
            : Date.now().toString()
        )

    };

    if (this.currentUser.courseCode) {
      this.setCourse(this.currentUser.courseCode, {
        courseName: this.currentUser.courseName
      });
    }


    this.save();

    this.sync();
  }


  setCurrentView(view) {

    this.currentView =
      view;

    this.save();
  }


  setActiveDoubt(id) {

    this.activeDoubtId =
      id;

    this.save();
  }


  reset() {

    localStorage.removeItem(
      KEYS.USER
    );

    localStorage.removeItem(
      KEYS.ACTIVE
    );


    this.currentUser =
      null;

    this.activeDoubtId =
      null;

    this.currentView =
      "landing";


    this.save();
  }

}


const store =
  new ConsensusStore();