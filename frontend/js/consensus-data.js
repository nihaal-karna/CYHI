// Consensus Data & State Management
// Holds mock data, initial state, and localStorage synchronization

const COURSE_INFO = {
  code: "CS101",
  name: "Data Structures",
  lecture: "Lecture 4",
  activeStudents: 32
};

const DEFAULT_USERS = {
  student: {
    name: "Rahul Verma",
    roll: "23CSE101",
    email: "rahul.v@university.edu",
    courseCode: "CS101",
    role: "student"
  },
  ta: {
    name: "Meera Iyer",
    roll: "",
    email: "meera.i@university.edu",
    courseCode: "CS101",
    role: "ta"
  },
  professor: {
    name: "Dr. A. Nair",
    roll: "",
    email: "a.nair@university.edu",
    courseCode: "CS101",
    role: "professor"
  }
};

const INITIAL_DOUBTS = [
  {
    id: "d-consensus",
    topic: "Time Complexity",
    category: "Concept",
    question: "Why is binary search O(log n)?",
    authorName: "Ishaan",
    authorRoll: "23CSE118",
    confusionCount: 6,
    ageMinutes: 4,
    status: "open",
    supportedByMe: false,
    resolvedInLecture: false,
    messages: [
      {
        id: "m1",
        author: "Class Consensus",
        role: "system",
        text: "This doubt reached consensus. Individual identity has been dissolved.",
        ageMinutes: 4
      },
      {
        id: "m2",
        author: "Anonymous",
        role: "student",
        text: "I get that it halves the array, but I lose track of why that becomes a log.",
        ageMinutes: 3
      },
      {
        id: "m3",
        author: "Meera (TA)",
        role: "ta",
        text: "Think about how many times you can halve n before you reach 1 — that count is log₂(n).",
        ageMinutes: 2
      }
    ]
  },
  {
    id: "d-approaching",
    topic: "Linked Lists",
    category: "Concept",
    question: "Why do we need a head pointer?",
    authorName: "Ananya",
    authorRoll: "23CSE104",
    confusionCount: 4,
    ageMinutes: 6,
    status: "open",
    supportedByMe: false,
    resolvedInLecture: false,
    messages: [
      {
        id: "m4",
        author: "Ananya",
        role: "student",
        text: "If every node points to the next one, why keep a separate head?",
        ageMinutes: 6
      }
    ]
  },
  {
    id: "d-individual",
    topic: "Pointers",
    category: "Coding",
    question: "Why does this pointer become NULL after deletion?",
    authorName: "Rahul",
    authorRoll: "23CSE101",
    confusionCount: 2,
    ageMinutes: 9,
    status: "open",
    supportedByMe: false,
    resolvedInLecture: false,
    messages: [
      {
        id: "m5",
        author: "Rahul",
        role: "student",
        text: "I called delete but the pointer still looks like it has an address in the debugger sometimes.",
        ageMinutes: 9
      }
    ]
  },
  {
    id: "d-arrays",
    topic: "Arrays",
    category: "Assignment",
    question: "For assignment 2, can the input array contain duplicates?",
    authorName: "Karthik",
    authorRoll: "23CSE131",
    confusionCount: 1,
    ageMinutes: 12,
    status: "open",
    supportedByMe: false,
    resolvedInLecture: false,
    messages: []
  },
  {
    id: "d-recursion",
    topic: "Recursion",
    category: "Concept",
    question: "How does the call stack unwind when a base case is hit?",
    authorName: "Priya",
    authorRoll: "23CSE109",
    confusionCount: 3,
    ageMinutes: 15,
    status: "open",
    supportedByMe: false,
    resolvedInLecture: false,
    messages: [
      {
        id: "m6",
        author: "Priya",
        role: "student",
        text: "The recursion diagram makes sense going down, but the return path confuses me.",
        ageMinutes: 15
      }
    ]
  },
  {
    id: "d-resolved",
    topic: "Big-O Notation",
    category: "Lecture",
    question: "What is the difference between O(n) and Θ(n)?",
    authorName: "Class Consensus",
    authorRoll: "",
    confusionCount: 7,
    ageMinutes: 24,
    status: "resolved",
    supportedByMe: false,
    resolvedInLecture: true,
    answer: "Re-taught with a tight vs. asymptotic upper-bound comparison. Class confirmed understanding.",
    messages: [
      {
        id: "m7",
        author: "Prof. Nair",
        role: "professor",
        text: "Re-explained with the runway analogy — resolved live in lecture.",
        ageMinutes: 20
      }
    ]
  }
];

const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-1",
    doubtId: "d-consensus",
    topic: "Time Complexity",
    question: "Why is binary search O(log n)?",
    count: 6,
    read: false
  }
];

const STORAGE_KEYS = {
  DOUBTS: "consensus_doubts_v1",
  USER: "consensus_user_v1",
  NOTIFICATIONS: "consensus_notifs_v1",
  CURRENT_VIEW: "consensus_view_v1",
  ACTIVE_DOUBT_ID: "consensus_active_doubt_v1"
};

class ConsensusStore {
  constructor() {
    this.init();
  }

  init() {
    try {
      const savedDoubts = localStorage.getItem(STORAGE_KEYS.DOUBTS);
      this.doubts = savedDoubts ? JSON.parse(savedDoubts) : JSON.parse(JSON.stringify(INITIAL_DOUBTS));
      
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
      this.currentUser = savedUser ? JSON.parse(savedUser) : null;
      
      const savedNotifs = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      this.notifications = savedNotifs ? JSON.parse(savedNotifs) : JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));
      
      this.activeDoubtId = localStorage.getItem(STORAGE_KEYS.ACTIVE_DOUBT_ID) || "d-consensus";
      this.currentView = localStorage.getItem(STORAGE_KEYS.CURRENT_VIEW) || "landing";
    } catch (e) {
      console.warn("Error accessing localStorage, falling back to in-memory:", e);
      this.doubts = JSON.parse(JSON.stringify(INITIAL_DOUBTS));
      this.currentUser = null;
      this.notifications = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));
      this.activeDoubtId = "d-consensus";
      this.currentView = "landing";
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEYS.DOUBTS, JSON.stringify(this.doubts));
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(this.currentUser));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(this.notifications));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_DOUBT_ID, this.activeDoubtId);
      localStorage.setItem(STORAGE_KEYS.CURRENT_VIEW, this.currentView);
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  }

  reset() {
    this.doubts = JSON.parse(JSON.stringify(INITIAL_DOUBTS));
    this.currentUser = null;
    this.notifications = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));
    this.activeDoubtId = "d-consensus";
    this.currentView = "landing";
    this.save();
  }

  getDoubt(id) {
    return this.doubts.find(d => d.id === id);
  }

  addDoubt({ topic, category, question }) {
    const id = "d-" + Date.now().toString(36);
    const authorName = this.currentUser ? this.currentUser.name : "You";
    const authorRoll = this.currentUser ? (this.currentUser.roll || "") : "";
    
    const newDoubt = {
      id,
      topic: topic.trim(),
      category: category || "Concept",
      question: question.trim(),
      authorName,
      authorRoll,
      confusionCount: 1,
      ageMinutes: 0,
      status: "open",
      supportedByMe: true,
      resolvedInLecture: false,
      messages: []
    };

    this.doubts.unshift(newDoubt);
    this.activeDoubtId = id;
    this.save();
    return newDoubt;
  }

  supportDoubt(doubtId) {
    const doubt = this.doubts.find(d => d.id === doubtId);
    if (!doubt || doubt.supportedByMe || doubt.status === "resolved") {
      return false;
    }

    const prevCount = doubt.confusionCount;
    const newCount = prevCount + 1;
    doubt.confusionCount = newCount;
    doubt.supportedByMe = true;

    // Check consensus threshold (threshold is 5)
    if (prevCount < 5 && newCount >= 5) {
      this.notifications.unshift({
        id: "notif-" + Date.now().toString(36),
        doubtId: doubt.id,
        topic: doubt.topic,
        question: doubt.question,
        count: newCount,
        read: false
      });
      
      // System message to indicate identity dissolution
      doubt.messages.unshift({
        id: "msg-" + Date.now().toString(36),
        author: "Class Consensus",
        role: "system",
        text: "This doubt reached consensus. Individual identity has been dissolved.",
        ageMinutes: 0
      });
    }

    this.save();
    return true;
  }

  addMessage(doubtId, text) {
    const doubt = this.doubts.find(d => d.id === doubtId);
    if (!doubt || !text.trim()) return null;

    let authorName = "You";
    let role = "student";

    if (this.currentUser) {
      role = this.currentUser.role;
      if (role === "ta") {
        authorName = `${this.currentUser.name.split(" ")[0]} (TA)`;
      } else if (role === "professor") {
        authorName = this.currentUser.name;
      } else {
        authorName = doubt.confusionCount >= 5 ? "Anonymous" : (this.currentUser.name.split(" ")[0] || "You");
      }
    }

    const newMsg = {
      id: "msg-" + Date.now().toString(36),
      author: authorName,
      role: role,
      text: text.trim(),
      ageMinutes: 0
    };

    doubt.messages.push(newMsg);
    this.save();
    return newMsg;
  }

  answerDoubt(doubtId, answerText) {
    const doubt = this.doubts.find(d => d.id === doubtId);
    if (!doubt) return;

    doubt.answer = answerText.trim();
    doubt.status = "answered";

    const responder = this.currentUser ? this.currentUser.name : "Teaching Assistant";
    doubt.messages.push({
      id: "msg-" + Date.now().toString(36),
      author: responder,
      role: this.currentUser ? this.currentUser.role : "ta",
      text: answerText.trim(),
      ageMinutes: 0
    });

    this.save();
  }

  resolveDoubt(doubtId, resolutionNote) {
    const doubt = this.doubts.find(d => d.id === doubtId);
    if (!doubt) return;

    doubt.status = "resolved";
    doubt.resolvedInLecture = true;
    if (resolutionNote) {
      doubt.answer = resolutionNote;
    }

    this.notifications = this.notifications.filter(n => n.doubtId !== doubtId);
    this.save();
  }

  markNotificationsRead() {
    this.notifications.forEach(n => n.read = true);
    this.save();
  }

  setUser(user) {
    this.currentUser = user;
    this.save();
  }

  setCurrentView(view) {
    this.currentView = view;
    this.save();
  }

  setActiveDoubt(id) {
    this.activeDoubtId = id;
    this.save();
  }
}

// Utility formatting helpers
function formatAge(ageMinutes) {
  if (ageMinutes === undefined || ageMinutes <= 0) return "just now";
  if (ageMinutes === 1) return "1 min ago";
  if (ageMinutes < 60) return `${ageMinutes} min ago`;
  const hrs = Math.floor(ageMinutes / 60);
  return hrs === 1 ? "1 hr ago" : `${hrs} hrs ago`;
}

function getDoubtState(confusionCount) {
  if (confusionCount >= 5) return "consensus";
  if (confusionCount >= 4) return "approaching";
  return "normal";
}

function isConsensus(doubt) {
  return doubt.confusionCount >= 5;
}

// Global store instance
const store = new ConsensusStore();

