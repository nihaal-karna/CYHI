// CYHI Firebase data layer

const FIREBASE_VERSION = "12.19.0";
const CONSENSUS_THRESHOLD = 3;

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

const DEFAULT_USERS = {
  student: {
    name: "Student",
    roll: "",
    email: "",
    courseCode: "CS101",
    role: "student"
  },

  ta: {
    name: "Teaching Assistant",
    roll: "",
    email: "",
    courseCode: "CS101",
    role: "ta"
  },

  professor: {
    name: "Professor",
    roll: "",
    email: "",
    courseCode: "CS101",
    role: "professor"
  }
};

const KEYS = {
  USER: "cyhi_user_v4",
  VIEW: "cyhi_view_v4",
  ACTIVE: "cyhi_active_doubt_v4",
  READ: "cyhi_read_notifications_v1"
};

const STOP = new Set(
  "the a an is are was were why what how does do can could should to of in on for and or with my i it this that be after before when where which from as at by about"
    .split(" ")
);

let readyPromise = null;
let db = null;
let auth = null;
let authUser = null;

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

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    auth = firebase.auth();
    db = firebase.firestore();

    if (!auth.currentUser) {
      authUser = (await auth.signInAnonymously()).user;
    } else {
      authUser = auth.currentUser;
    }

    return authUser;
  })();

  return readyPromise;
}

function uid() {
  return authUser?.uid || auth?.currentUser?.uid || null;
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
      getJSON(KEYS.USER, null);

    this.activeDoubtId =
      localStorage.getItem(KEYS.ACTIVE) || null;

    this.currentView =
      localStorage.getItem(KEYS.VIEW) || "landing";

    this.started = false;

    this.sync();
  }


  save() {

    if (this.currentUser) {

      localStorage.setItem(
        KEYS.USER,
        JSON.stringify(this.currentUser)
      );

    } else {

      localStorage.removeItem(KEYS.USER);

    }

    localStorage.setItem(
      KEYS.VIEW,
      this.currentView
    );

    if (this.activeDoubtId) {

      localStorage.setItem(
        KEYS.ACTIVE,
        this.activeDoubtId
      );

    }
  }


  async sync() {

    try {

      await ready();

      await this.presence();

      if (!this.started) {
        this.listen();
      }

      await this.refresh();

      render();

    } catch (e) {

      console.error(
        "CYHI Firebase:",
        e
      );

    }
  }


  listen() {

    this.started = true;

    db.collection("confusions")
      .where(
        "classId",
        "==",
        COURSE_INFO.code
      )
      .onSnapshot(

        () => {

          this.refresh()
            .then(render)
            .catch(console.error);

        },

        e => {

          console.error(
            "Firestore listener:",
            e
          );

        }
      );

    setInterval(
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
        d.answer || "",

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


  addDoubt({
    topic,
    category,
    question
  }) {

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


    this.createDoubt(
      topic.trim(),
      category || "Concept",
      question.trim()
    )
      .catch(console.error);


    return local;
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


  addMessage(
    doubtId,
    text
  ) {

    const d =
      this.getDoubt(doubtId);


    if (
      !d ||
      !text.trim()
    ) {

      return null;

    }


    const role =
      this.currentUser?.role ||
      "student";


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


    this.saveMessage(
      doubtId,
      text.trim()
    )
      .then(
        () => this.refresh()
      )
      .then(
        render
      )
      .catch(
        console.error
      );


    return msg;
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


  answerDoubt(
    doubtId,
    text
  ) {

    const d =
      this.getDoubt(doubtId);


    if (
      !d ||
      !text.trim()
    ) {

      return;

    }


    d.answer =
      text.trim();

    d.status =
      "answered";


    render();


    this.update(
      doubtId,
      {
        answer:
          text.trim(),

        status:
          "answered"
      }
    )
      .catch(
        console.error
      );
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