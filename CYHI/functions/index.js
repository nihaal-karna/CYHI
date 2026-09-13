const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

function shortQuestion(text, max = 110) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
}

exports.notifyProfessorOnNewDoubt = onDocumentCreated(
  "confusions/{doubtId}",
  async (event) => {
    const doubt = event.data?.data();
    if (!doubt) return;

    const doubtId = event.params.doubtId;
    const classId = String(doubt.classId || "").trim();
    if (!classId) {
      logger.warn("New confusion has no classId; push notification skipped.", { doubtId });
      return;
    }

    // Reuse the current app's accessSessions structure. Only professor sessions
    // for THIS course are targeted; professors in other classes are not notified.
    const professorSessions = await db.collection("accessSessions")
      .where("role", "==", "professor")
      .where("courseCode", "==", classId)
      .get();

    if (professorSessions.empty) {
      logger.info("No professor access session found for course.", { classId, doubtId });
      return;
    }

    const professorUids = [...new Set(professorSessions.docs.map((doc) => doc.id))];
    const tokenDocs = await Promise.all(
      professorUids.map((uid) => db.collection("fcmTokens").doc(uid).get())
    );

    const tokenOwners = new Map();
    const tokens = [];
    tokenDocs.forEach((snap, index) => {
      if (!snap.exists) return;
      const uid = professorUids[index];
      const values = Array.isArray(snap.data()?.tokens) ? snap.data().tokens : [];
      values.forEach((token) => {
        if (typeof token === "string" && token) {
          tokens.push(token);
          tokenOwners.set(token, uid);
        }
      });
    });

    const uniqueTokens = [...new Set(tokens)];
    if (!uniqueTokens.length) {
      logger.info("Professor has no FCM tokens registered.", { classId, doubtId });
      return;
    }

    let studentName = "A student";
    if (doubt.authorUid) {
      try {
        const authorSession = await db.collection("accessSessions").doc(String(doubt.authorUid)).get();
        studentName = String(authorSession.data()?.displayName || "A student");
      } catch (error) {
        logger.warn("Could not resolve doubt author display name.", { doubtId, code: error?.code || "unknown" });
      }
    }
    const slideNumber = doubt.slideNumber ? ` on Slide ${doubt.slideNumber}` : "";
    const question = shortQuestion(doubt.question);
    const body = `${studentName} raised a doubt${slideNumber}${question ? `: “${question}”` : "."}`;
    const url = `/professor.html?doubt=${encodeURIComponent(doubtId)}#professor`;

    const response = await admin.messaging().sendEachForMulticast({
      tokens: uniqueTokens,
      data: {
        title: "New Student Doubt",
        body,
        doubtId,
        classId,
        slideId: String(doubt.slideId || ""),
        slideNumber: String(doubt.slideNumber || ""),
        type: "new_doubt",
        url
      },
      webpush: {
        headers: { Urgency: "high" },
        fcmOptions: { link: url }
      }
    });

    const invalidCodes = new Set([
      "messaging/invalid-registration-token",
      "messaging/registration-token-not-registered"
    ]);
    const removalsByUid = new Map();

    response.responses.forEach((result, index) => {
      if (result.success) return;
      const code = result.error?.code || "";
      if (!invalidCodes.has(code)) {
        logger.warn("FCM send failed", { code, classId, doubtId });
        return;
      }
      const token = uniqueTokens[index];
      const uid = tokenOwners.get(token);
      if (!uid) return;
      if (!removalsByUid.has(uid)) removalsByUid.set(uid, []);
      removalsByUid.get(uid).push(token);
    });

    await Promise.all(
      [...removalsByUid.entries()].map(([uid, invalidTokens]) =>
        db.collection("fcmTokens").doc(uid).set({
          tokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true })
      )
    );

    logger.info("New-doubt push processed.", {
      classId,
      doubtId,
      professorCount: professorUids.length,
      successCount: response.successCount,
      failureCount: response.failureCount
    });
  }
);
