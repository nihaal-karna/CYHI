const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const url = require("url");

const PORT = 3000;

const ROOT = path.join(__dirname, "..");
const FRONTEND_DIR = path.join(ROOT, "frontend");
const DATABASE_DIR = path.join(ROOT, "database");
const DATABASE_FILE = path.join(DATABASE_DIR, "db.json");

const CONSENSUS_THRESHOLD = 3;

if (!fs.existsSync(DATABASE_DIR)) {
  fs.mkdirSync(DATABASE_DIR, { recursive: true });
}

function createId(prefix) {
  return (
    prefix +
    "-" +
    Date.now().toString(36) +
    "-" +
    crypto.randomBytes(3).toString("hex")
  );
}

function createSessionId() {
  return createId("session");
}

function loadDatabase() {

  if (!fs.existsSync(DATABASE_FILE)) {

    const initialDatabase = {
      classrooms: [
        {
          id: "class-cs101",
          code: "CS101",
          name: "Data Structures",
          lecture: "Live Lecture",
          activeStudents: 0,
          createdAt: new Date().toISOString()
        }
      ],

      sessions: [],

      confusions: [
        {
          id: "d-demo-consensus",

          classCode: "CS101",

          topic: "Pointer Dereferencing",

          category: "Concept",

          question:
            "Why does *p give the value stored at the address?",

          clusterId: "cluster-pointer",

          count: 3,

          status: "open",

          consensusReached: true,

          identitiesDissolved: true,

          createdAt:
            new Date(Date.now() - 6 * 60000).toISOString(),

          updatedAt:
            new Date(Date.now() - 2 * 60000).toISOString(),

          contributors: [],

          messages: [
            {
              id: createId("message"),

              author: "Class Consensus",

              role: "system",

              text:
                "This confusion reached consensus. Individual identity has been dissolved.",

              createdAt:
                new Date(Date.now() - 5 * 60000).toISOString()
            }
          ]
        }
      ],

      clusters: [
        {
          id: "cluster-pointer",

          classCode: "CS101",

          topic: "Pointer Dereferencing",

          confusionCount: 3,

          consensusReached: true,

          status: "open",

          createdAt:
            new Date(Date.now() - 6 * 60000).toISOString(),

          updatedAt:
            new Date(Date.now() - 2 * 60000).toISOString()
        }
      ]
    };

    saveDatabase(initialDatabase);

    return initialDatabase;
  }

  try {

    const raw = fs.readFileSync(
      DATABASE_FILE,
      "utf8"
    );

    return JSON.parse(raw);

  } catch (error) {

    console.error("Database read error:", error);

    return {
      classrooms: [],
      sessions: [],
      confusions: [],
      clusters: []
    };
  }
}

function saveDatabase(database) {

  fs.writeFileSync(
    DATABASE_FILE,
    JSON.stringify(database, null, 2),
    "utf8"
  );
}

function getClass(database, classCode) {

  return database.classrooms.find(
    (item) => item.code === classCode
  );
}

function normalizeText(text) {

  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "was",
  "were",
  "why",
  "what",
  "how",
  "does",
  "do",
  "i",
  "we",
  "you",
  "to",
  "of",
  "in",
  "on",
  "for",
  "and",
  "or",
  "this",
  "that",
  "it",
  "my",
  "me",
  "can",
  "be",
  "with",
  "about",
  "when",
  "where",
  "which",
  "really"
]);

function getKeywords(text) {

  return normalizeText(text)
    .split(" ")
    .filter(
      (word) =>
        word.length >= 3 &&
        !STOP_WORDS.has(word)
    );
}

function similarity(textA, textB) {

  const wordsA = new Set(getKeywords(textA));
  const wordsB = new Set(getKeywords(textB));

  if (!wordsA.size || !wordsB.size) {
    return 0;
  }

  let common = 0;

  for (const word of wordsA) {

    if (wordsB.has(word)) {
      common++;
    }
  }

  const union = new Set([
    ...wordsA,
    ...wordsB
  ]).size;

  return common / union;
}

function findMatchingCluster(database, classCode, topic, question) {

  const clusters = database.clusters.filter(
    (cluster) =>
      cluster.classCode === classCode &&
      cluster.status === "open"
  );

  let bestCluster = null;
  let bestScore = 0;

  for (const cluster of clusters) {

    const topicScore =
      similarity(topic, cluster.topic);

    const questionScore =
      similarity(question, cluster.topic);

    const score =
      Math.max(
        topicScore,
        questionScore
      );

    if (score > bestScore) {

      bestScore = score;

      bestCluster = cluster;
    }
  }

  if (bestCluster && bestScore >= 0.20) {
    return bestCluster;
  }

  return null;
}

function calculateAgeMinutes(createdAt) {

  const milliseconds =
    Date.now() -
    new Date(createdAt).getTime();

  return Math.max(
    0,
    Math.floor(milliseconds / 60000)
  );
}

function publicConfusion(confusion) {

  const consensus =
    confusion.consensusReached === true;

  const contributorCount =
    confusion.contributors?.length || 0;

  return {

    id: confusion.id,

    topic: confusion.topic,

    category: confusion.category,

    question: confusion.question,

    confusionCount:
      Math.max(
        confusion.count || 0,
        contributorCount
      ),

    ageMinutes:
      calculateAgeMinutes(
        confusion.createdAt
      ),

    status: confusion.status,

    resolvedInLecture:
      confusion.status === "resolved",

    consensusReached:
      consensus,

    identitiesDissolved:
      consensus,

    // BEFORE consensus the frontend can show a
    // generic anonymous label.
    // AFTER consensus it becomes Class Consensus.
    authorName:
      consensus
        ? "Class Consensus"
        : "Anonymous Student",

    authorRoll: "",

    supportedByMe: false,

    answer:
      confusion.answer || "",

    messages:
      (confusion.messages || []).map(
        (message) => ({
          id: message.id,

          author:
            message.role === "student"
              ? (
                  consensus
                    ? "Anonymous"
                    : "Anonymous Student"
                )
              : message.author,

          role: message.role,

          text: message.text,

          ageMinutes:
            calculateAgeMinutes(
              message.createdAt
            )
        })
      )
  };
}

function publicCluster(cluster) {

  return {

    id: cluster.id,

    topic: cluster.topic,

    count: cluster.confusionCount,

    consensusReached:
      cluster.consensusReached,

    status: cluster.status,

    updatedAt: cluster.updatedAt
  };
}

function getPublicState(database, classCode) {

  const classInfo =
    getClass(database, classCode);

  const confusions =
    database.confusions
      .filter(
        (item) =>
          item.classCode === classCode
      )
      .map(publicConfusion);

  const clusters =
    database.clusters
      .filter(
        (item) =>
          item.classCode === classCode &&
          item.status === "open"
      )
      .map(publicCluster)
      .sort(
        (a, b) =>
          b.count - a.count
      );

  return {

    class: classInfo || null,

    activeStudents:
      database.sessions.filter(
        (session) =>
          session.classCode === classCode &&
          session.active === true
      ).length,

    doubts: confusions,

    clusters,

    notifications:
      confusions
        .filter(
          (doubt) =>
            doubt.consensusReached &&
            doubt.status !== "resolved"
        )
        .map(
          (doubt) => ({
            id:
              "notification-" +
              doubt.id,

            doubtId:
              doubt.id,

            topic:
              doubt.topic,

            question:
              doubt.question,

            count:
              doubt.confusionCount,

            read: false
          })
        )
  };
}

function parseBody(request) {

  return new Promise(
    (resolve, reject) => {

      let body = "";

      request.on(
        "data",
        (chunk) => {
          body += chunk.toString();
        }
      );

      request.on(
        "end",
        () => {

          if (!body) {
            resolve({});
            return;
          }

          try {
            resolve(JSON.parse(body));
          } catch {
            reject(
              new Error(
                "Invalid JSON body"
              )
            );
          }
        }
      );

      request.on(
        "error",
        reject
      );
    }
  );
}

function sendJSON(
  response,
  statusCode,
  data
) {

  response.writeHead(
    statusCode,
    {
      "Content-Type":
        "application/json",

      "Access-Control-Allow-Origin":
        "*",

      "Access-Control-Allow-Methods":
        "GET,POST,OPTIONS",

      "Access-Control-Allow-Headers":
        "Content-Type"
    }
  );

  response.end(
    JSON.stringify(data)
  );
}

function contentType(filePath) {

  const ext =
    path.extname(filePath)
      .toLowerCase();

  const types = {

    ".html":
      "text/html; charset=utf-8",

    ".js":
      "text/javascript; charset=utf-8",

    ".css":
      "text/css; charset=utf-8",

    ".json":
      "application/json",

    ".png":
      "image/png",

    ".jpg":
      "image/jpeg",

    ".jpeg":
      "image/jpeg",

    ".svg":
      "image/svg+xml",

    ".woff2":
      "font/woff2"
  };

  return (
    types[ext] ||
    "application/octet-stream"
  );
}

function serveStatic(
  request,
  response
) {

  let pathname =
    decodeURIComponent(
      url.parse(request.url).pathname
    );

  if (pathname === "/") {
    pathname = "/index.html";
  }

  const filePath =
    path.normalize(
      path.join(
        FRONTEND_DIR,
        pathname
      )
    );

  if (
    !filePath.startsWith(
      FRONTEND_DIR
    )
  ) {

    response.writeHead(403);

    response.end("Forbidden");

    return;
  }

  fs.readFile(
    filePath,
    (error, data) => {

      if (error) {

        response.writeHead(404);

        response.end(
          "CYHI page not found"
        );

        return;
      }

      response.writeHead(
        200,
        {
          "Content-Type":
            contentType(filePath)
        }
      );

      response.end(data);
    }
  );
}

async function handleAPI(
  request,
  response
) {

  const parsed =
    url.parse(
      request.url,
      true
    );

  const pathname =
    parsed.pathname;

  if (
    request.method === "OPTIONS"
  ) {

    response.writeHead(
      204,
      {
        "Access-Control-Allow-Origin":
          "*",

        "Access-Control-Allow-Methods":
          "GET,POST,OPTIONS",

        "Access-Control-Allow-Headers":
          "Content-Type"
      }
    );

    response.end();

    return;
  }

  const database =
    loadDatabase();

  // ----------------------------------
  // HEALTH CHECK
  // ----------------------------------

  if (
    pathname === "/api/health" &&
    request.method === "GET"
  ) {

    sendJSON(
      response,
      200,
      {
        ok: true,
        message: "CYHI backend is running",
        consensusThreshold:
          CONSENSUS_THRESHOLD
      }
    );

    return;
  }

  // ----------------------------------
  // GET STATE
  // ----------------------------------

  if (
    pathname === "/api/state" &&
    request.method === "GET"
  ) {

    const classCode =
      parsed.query.classCode ||
      "CS101";

    sendJSON(
      response,
      200,
      getPublicState(
        database,
        classCode
      )
    );

    return;
  }

  // ----------------------------------
  // JOIN CLASS
  // ----------------------------------

  if (
    pathname === "/api/class/join" &&
    request.method === "POST"
  ) {

    const body =
      await parseBody(request);

    const classCode =
      String(
        body.classCode || ""
      ).trim().toUpperCase();

    if (!classCode) {

      sendJSON(
        response,
        400,
        {
          error:
            "Class code is required."
        }
      );

      return;
    }

    const classInfo =
      getClass(
        database,
        classCode
      );

    if (!classInfo) {

      sendJSON(
        response,
        404,
        {
          error:
            "Class not found."
        }
      );

      return;
    }

    const sessionId =
      body.sessionId ||
      createSessionId();

    const existing =
      database.sessions.find(
        (session) =>
          session.id === sessionId
      );

    if (existing) {

      existing.active = true;

      existing.lastSeen =
        new Date().toISOString();

    } else {

      database.sessions.push({

        id: sessionId,

        classCode,

        role:
          body.role || "student",

        active: true,

        joinedAt:
          new Date().toISOString(),

        lastSeen:
          new Date().toISOString()
      });
    }

    saveDatabase(database);

    sendJSON(
      response,
      200,
      {
        success: true,

        sessionId,

        class: classInfo
      }
    );

    return;
  }

  // ----------------------------------
  // SUBMIT CONFUSION
  // ----------------------------------

  if (
    pathname === "/api/confusions" &&
    request.method === "POST"
  ) {

    const body =
      await parseBody(request);

    const classCode =
      String(
        body.classCode || "CS101"
      ).trim().toUpperCase();

    const question =
      String(
        body.question || ""
      ).trim();

    const topic =
      String(
        body.topic || "General"
      ).trim();

    const category =
      String(
        body.category || "Concept"
      ).trim();

    const sessionId =
      String(
        body.sessionId || ""
      ).trim();

    if (!question) {

      sendJSON(
        response,
        400,
        {
          error:
            "Question cannot be empty."
        }
      );

      return;
    }

    if (!sessionId) {

      sendJSON(
        response,
        400,
        {
          error:
            "Student session is required."
        }
      );

      return;
    }

    // Ensure student session exists.
    const session =
      database.sessions.find(
        (item) =>
          item.id === sessionId
      );

    if (!session) {

      database.sessions.push({

        id: sessionId,

        classCode,

        role: "student",

        active: true,

        joinedAt:
          new Date().toISOString(),

        lastSeen:
          new Date().toISOString()
      });
    }

    const now =
      new Date().toISOString();

    // Find an existing confusion cluster.
    let cluster =
      findMatchingCluster(
        database,
        classCode,
        topic,
        question
      );

    // If no cluster exists,
    // create one.
    if (!cluster) {

      cluster = {

        id: createId("cluster"),

        classCode,

        topic,

        confusionCount: 0,

        consensusReached: false,

        status: "open",

        createdAt: now,

        updatedAt: now
      };

      database.clusters.push(
        cluster
      );
    }

    // Check whether this student
    // has already contributed to
    // this cluster.
    const alreadyContributed =
      database.confusions.some(
        (confusion) =>
          confusion.clusterId ===
            cluster.id &&
          confusion.classCode ===
            classCode &&
          confusion.contributors?.includes(
            sessionId
          )
      );

    if (alreadyContributed) {

      sendJSON(
        response,
        409,
        {
          error:
            "You have already flagged this confusion."
        }
      );

      return;
    }

    const confusion = {

      id: createId("confusion"),

      classCode,

      topic,

      category,

      question,

      clusterId:
        cluster.id,

      count: 1,

      status: "open",

      consensusReached: false,

      identitiesDissolved: false,

      contributors: [
        sessionId
      ],

      createdAt: now,

      updatedAt: now,

      messages: []
    };

    database.confusions.push(
      confusion
    );

    // Every new question is a
    // contribution to its cluster.
    cluster.confusionCount += 1;

    cluster.updatedAt = now;

    // ----------------------------------
    // CONSENSUS CHECK
    // ----------------------------------

    if (
      cluster.confusionCount >=
      CONSENSUS_THRESHOLD
    ) {

      cluster.consensusReached = true;

      // Identity dissolution.
      //
      // We intentionally remove the
      // individual contributor IDs from
      // the classroom-facing state.
      //
      // The backend still has only the
      // aggregate count.
      for (
        const item of database.confusions
      ) {

        if (
          item.clusterId ===
            cluster.id
        ) {

          item.consensusReached = true;

          item.identitiesDissolved = true;

          item.count =
            cluster.confusionCount;

          item.contributors = [];

          item.messages =
            (item.messages || [])
              .filter(
                (message) =>
                  message.role !==
                  "student"
              );
        }
      }

      // Put one collective message
      // into the first confusion.
      const representative =
        database.confusions.find(
          (item) =>
            item.clusterId ===
            cluster.id
        );

      if (
        representative &&
        !representative.messages.some(
          (message) =>
            message.text.includes(
              "identity has been dissolved"
            )
        )
      ) {

        representative.messages.unshift({

          id:
            createId("message"),

          author:
            "Class Consensus",

          role:
            "system",

          text:
            "This confusion reached consensus. Individual identity has been dissolved.",

          createdAt: now
        });
      }
    }

    saveDatabase(database);

    sendJSON(
      response,
      201,
      {
        success: true,

        doubt:
          publicConfusion(
            confusion
          ),

        consensusReached:
          cluster.consensusReached,

        cluster:
          publicCluster(
            cluster
          ),

        state:
          getPublicState(
            database,
            classCode
          )
      }
    );

    return;
  }

  // ----------------------------------
  // SUPPORT EXISTING CONFUSION
  // ----------------------------------

  const supportMatch =
    pathname.match(
      /^\/api\/confusions\/([^/]+)\/support$/
    );

  if (
    supportMatch &&
    request.method === "POST"
  ) {

    const confusionId =
      supportMatch[1];

    const body =
      await parseBody(request);

    const sessionId =
      String(
        body.sessionId || ""
      );

    const confusion =
      database.confusions.find(
        (item) =>
          item.id ===
          confusionId
      );

    if (!confusion) {

      sendJSON(
        response,
        404,
        {
          error:
            "Confusion not found."
        }
      );

      return;
    }

    const cluster =
      database.clusters.find(
        (item) =>
          item.id ===
          confusion.clusterId
      );

    if (!cluster) {

      sendJSON(
        response,
        404,
        {
          error:
            "Confusion cluster not found."
        }
      );

      return;
    }

    if (
      cluster.consensusReached
    ) {

      sendJSON(
        response,
        200,
        {
          success: true,

          alreadyConsensus: true,

          state:
            getPublicState(
              database,
              confusion.classCode
            )
        }
      );

      return;
    }

    // Find whether this session has
    // already supported the cluster.
    const hasSupported =
      database.confusions.some(
        (item) =>
          item.clusterId ===
            cluster.id &&
          item.contributors?.includes(
            sessionId
          )
      );

    if (hasSupported) {

      sendJSON(
        response,
        409,
        {
          error:
            "You already supported this confusion."
        }
      );

      return;
    }

    const now =
      new Date().toISOString();

    // Add this session to the cluster.
    //
    // For the MVP we keep this
    // information only until consensus.
    confusion.contributors =
      confusion.contributors || [];

    confusion.contributors.push(
      sessionId
    );

    cluster.confusionCount += 1;

    cluster.updatedAt = now;

    confusion.count =
      cluster.confusionCount;

    confusion.updatedAt = now;

    // ----------------------------------
    // CONSENSUS
    // ----------------------------------

    if (
      cluster.confusionCount >=
      CONSENSUS_THRESHOLD
    ) {

      cluster.consensusReached =
        true;

      for (
        const item of database.confusions
      ) {

        if (
          item.clusterId ===
          cluster.id
        ) {

          item.consensusReached =
            true;

          item.identitiesDissolved =
            true;

          item.count =
            cluster.confusionCount;

          // Identity dissolution.
          item.contributors = [];

          // Student-authored messages
          // are no longer retained in
          // the public-facing record.
          item.messages =
            (item.messages || [])
              .filter(
                (message) =>
                  message.role !==
                  "student"
              );
        }
      }

      const representative =
        database.confusions.find(
          (item) =>
            item.clusterId ===
            cluster.id
        );

      if (representative) {

        representative.messages.unshift({

          id:
            createId("message"),

          author:
            "Class Consensus",

          role:
            "system",

          text:
            "This confusion reached consensus. Individual identity has been dissolved.",

          createdAt: now
        });
      }
    }

    saveDatabase(database);

    sendJSON(
      response,
      200,
      {
        success: true,

        consensusReached:
          cluster.consensusReached,

        count:
          cluster.confusionCount,

        state:
          getPublicState(
            database,
            confusion.classCode
          )
      }
    );

    return;
  }

  // ----------------------------------
  // ADD MESSAGE
  // ----------------------------------

  const messageMatch =
    pathname.match(
      /^\/api\/confusions\/([^/]+)\/messages$/
    );

  if (
    messageMatch &&
    request.method === "POST"
  ) {

    const confusionId =
      messageMatch[1];

    const body =
      await parseBody(request);

    const confusion =
      database.confusions.find(
        (item) =>
          item.id ===
          confusionId
      );

    if (!confusion) {

      sendJSON(
        response,
        404,
        {
          error:
            "Confusion not found."
        }
      );

      return;
    }

    const message = {

      id:
        createId("message"),

      author:
        body.role === "student"
          ? "Anonymous Student"
          : (
              body.authorName ||
              "Teaching Assistant"
            ),

      role:
        body.role || "student",

      text:
        String(
          body.text || ""
        ).trim(),

      createdAt:
        new Date().toISOString()
    };

    if (!message.text) {

      sendJSON(
        response,
        400,
        {
          error:
            "Message cannot be empty."
        }
      );

      return;
    }

    // If consensus already happened,
    // student identity is never stored.
    if (
      confusion.consensusReached &&
      message.role === "student"
    ) {

      message.author =
        "Anonymous";
    }

    confusion.messages =
      confusion.messages || [];

    confusion.messages.push(
      message
    );

    confusion.updatedAt =
      new Date().toISOString();

    saveDatabase(database);

    sendJSON(
      response,
      201,
      {
        success: true,

        message,

        state:
          getPublicState(
            database,
            confusion.classCode
          )
      }
    );

    return;
  }

  // ----------------------------------
  // ANSWER CONFUSION
  // ----------------------------------

  const answerMatch =
    pathname.match(
      /^\/api\/confusions\/([^/]+)\/answer$/
    );

  if (
    answerMatch &&
    request.method === "POST"
  ) {

    const confusionId =
      answerMatch[1];

    const body =
      await parseBody(request);

    const confusion =
      database.confusions.find(
        (item) =>
          item.id ===
          confusionId
      );

    if (!confusion) {

      sendJSON(
        response,
        404,
        {
          error:
            "Confusion not found."
        }
      );

      return;
    }

    const text =
      String(
        body.text || ""
      ).trim();

    if (!text) {

      sendJSON(
        response,
        400,
        {
          error:
            "Answer cannot be empty."
        }
      );

      return;
    }

    confusion.answer = text;

    confusion.status =
      "answered";

    confusion.updatedAt =
      new Date().toISOString();

    confusion.messages =
      confusion.messages || [];

    confusion.messages.push({

      id:
        createId("message"),

      author:
        body.authorName ||
        "Teaching Assistant",

      role:
        body.role || "ta",

      text,

      createdAt:
        new Date().toISOString()
    });

    saveDatabase(database);

    sendJSON(
      response,
      200,
      {
        success: true,

        state:
          getPublicState(
            database,
            confusion.classCode
          )
      }
    );

    return;
  }

  // ----------------------------------
  // RESOLVE CONFUSION
  // ----------------------------------

  const resolveMatch =
    pathname.match(
      /^\/api\/confusions\/([^/]+)\/resolve$/
    );

  if (
    resolveMatch &&
    request.method === "POST"
  ) {

    const confusionId =
      resolveMatch[1];

    const body =
      await parseBody(request);

    const confusion =
      database.confusions.find(
        (item) =>
          item.id ===
          confusionId
      );

    if (!confusion) {

      sendJSON(
        response,
        404,
        {
          error:
            "Confusion not found."
        }
      );

      return;
    }

    confusion.status =
      "resolved";

    confusion.resolvedInLecture =
      true;

    confusion.answer =
      body.resolutionNote ||
      "Resolved live in lecture.";

    confusion.updatedAt =
      new Date().toISOString();

    const cluster =
      database.clusters.find(
        (item) =>
          item.id ===
          confusion.clusterId
      );

    if (cluster) {

      cluster.status =
        "resolved";

      cluster.updatedAt =
        new Date().toISOString();
    }

    saveDatabase(database);

    sendJSON(
      response,
      200,
      {
        success: true,

        state:
          getPublicState(
            database,
            confusion.classCode
          )
      }
    );

    return;
  }

  sendJSON(
    response,
    404,
    {
      error:
        "API endpoint not found."
    }
  );
}

const server =
  http.createServer(
    async (request, response) => {

      try {

        if (
          request.url.startsWith(
            "/api/"
          )
        ) {

          await handleAPI(
            request,
            response
          );

          return;
        }

        serveStatic(
          request,
          response
        );

      } catch (error) {

        console.error(
          "Server error:",
          error
        );

        sendJSON(
          response,
          500,
          {
            error:
              "Internal server error."
          }
        );
      }
    }
  );

server.listen(
  PORT,
  () => {

    console.log("");
    console.log(
      "===================================="
    );
    console.log(
      "        CYHI BACKEND RUNNING"
    );
    console.log(
      "===================================="
    );
    console.log(
      `Website: http://localhost:${PORT}`
    );
    console.log(
      `API:     http://localhost:${PORT}/api/health`
    );
    console.log(
      `Consensus threshold: ${CONSENSUS_THRESHOLD}`
    );
    console.log(
      "===================================="
    );
    console.log("");
  }
);