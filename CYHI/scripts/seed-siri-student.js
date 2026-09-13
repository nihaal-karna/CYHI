// One-time Firestore seed helper for the CYHI Firebase project.
// Requires Firebase Admin credentials in your environment. No service-account key is stored here.
//
// PowerShell example:
//   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account.json"
//   cd functions
//   npm install
//   cd ..
//   node scripts/seed-siri-student.js

const path = require("path");
const admin = require(path.join(__dirname, "..", "functions", "node_modules", "firebase-admin"));

if (!admin.apps.length) {
  admin.initializeApp({ projectId: "cyhi-daf42" });
}

const db = admin.firestore();

async function main() {
  const studentId = "25BCS164";
  await db.collection("students").doc(studentId).set({
    studentId,
    name: "Siri",
    section: "B"
  }, { merge: true });

  await db.collection("enrollments").doc(studentId).set({
    studentId,
    section: "B",
    courses: ["IT2001"]
  }, { merge: true });

  console.log("Seeded students/25BCS164 as Siri and enrolled in IT2001.");
}

main().then(() => process.exit(0)).catch((error) => {
  console.error("Failed to seed Firestore:", error);
  process.exit(1);
});
