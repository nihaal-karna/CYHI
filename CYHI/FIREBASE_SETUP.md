# Firebase setup and test guide for the upgraded CYHI project

The existing browser data layer remains `frontend/js/consensus-data.js`; it still uses the Firebase project/config that was already in the project. The app uses Firebase Anonymous Authentication and binds each anonymous UID to a course/role in `accessSessions` after the join check succeeds.


## Immediate demo login (no database seeding required first)

The project now keeps Firestore as the primary access-control source, but a fresh ZIP can still be demonstrated before the new `students`, `courses`, and `enrollments` collections are created. If those Firestore records are missing, the join screen reads the bundled `frontend/data/demo-access.json` seed. This allows the supplied demo Student IDs/course pairs to enter instead of dead-ending at login.

For the final Firebase-backed demo, still create the Firestore documents below and publish the included rules. Once those documents exist, Firestore is used automatically and the compatibility fallback is no longer used. The packaged rules also permit a `bundled-demo` access session so the supplied demo can function before seeding; that fallback is intentionally MVP/demo-grade and should not be treated as production authentication.

## 1. Enable Anonymous Authentication

Firebase Console -> Authentication -> Sign-in method -> Anonymous -> Enable.

## 2. Create the demo Firestore documents

Use `database/firestore-demo-data.json` as the source. Create these top-level collections, using each JSON object key as the document ID:

- `students`
- `courses`
- `enrollments`

Demo documents included in the JSON:

- Students: `25BCS110`, `25BCS214`, `25BCS109`, `25BCS164`
- Courses: `IT2001`, `CS2002`, plus legacy `CS101`
- Enrollments are stored as a `courses` array on each `enrollments/{studentId}` document.

`accessSessions` and `presence` are created automatically by the application. Existing `confusions` data is not replaced.

## 3. Publish Firestore rules

The project includes `firestore.rules` and `firebase.json`.

With Firebase CLI configured for the same Firebase project:

```bash
firebase deploy --only firestore:rules
```

Or paste `firestore.rules` into Firebase Console -> Firestore Database -> Rules and click **Publish**.

The rules enforce the student/course enrollment relationship and bind classroom reads/writes to the verified course session. The TA/Professor selector remains an MVP role selector, not university-grade staff authentication; for production, replace it with SSO/custom claims.

## 4. Optional AI-assisted moderation

Local fallback validation works without any external API. It only handles structural spam/garbage cases such as repeated characters, excessive symbols, repeated words, obvious keyboard gibberish, duplicate submissions, and cooldown. It does **not** use a blacklist of bad words.

For semantic academic filtering, set `OPENAI_API_KEY` only in the **server environment** and run the included Node backend. The backend sends the complete message to an AI classifier that decides whether the overall message is genuinely academic/classroom-related. The key is never placed in frontend JavaScript.

macOS/Linux:

```bash
export OPENAI_API_KEY="your-server-side-key"
node backend/server.js
```

Windows PowerShell:

```powershell
$env:OPENAI_API_KEY="your-server-side-key"
node backend/server.js
```

If the API/key/backend is unavailable, the frontend automatically falls back to local validation so classroom submissions can continue.

## 5. Run the project

From the project root:

```bash
node backend/server.js
```

Open:

```text
http://localhost:3000
```

For a static/Firebase host, Firebase synchronization and structural spam/garbage checks still work. Whole-message academic relevance classification through `/api/moderate` requires this Node backend (or an equivalent server-side endpoint) with `OPENAI_API_KEY`.

## 6. Access-control test cases

After creating the demo Firestore documents and publishing the rules:

1. `25BCS110` + `IT2001` -> allowed.
2. `25BCS110` + `CS2002` -> allowed.
3. `25BCS214` + `IT2001` -> allowed.
4. `25BCS214` + `CS2002` -> blocked as not enrolled.
5. Unknown Student ID + `IT2001` -> blocked.
6. Valid student + unknown course -> blocked.

## 7. Moderation / duplicate / cooldown tests

In the Student dashboard, use **Raise a doubt silently**. The same student-side moderation is also applied to Student discussion messages.

Expected examples:

- `What is a stack?` -> allow.
- `Why does my C++ code crash?` -> allow.
- `I don't understand cache memory.` -> allow.
- `aaaaaaaaaaaaaaaaaaaa` -> block.
- `asdfghjkl qwerty` -> block.
- `hello hello hello hello hello` -> block.
- `!!!!!???????` -> block.
- Non-academic/unrelated message -> block based on the meaning of the complete message, not on individual bad words.
- `I am really frustrated because I still don't understand this concept.` -> allow.
- Submit the same/similar question again -> duplicate message.
- Submit a different doubt immediately after a successful one -> cooldown message; retry after about 12 seconds.

## 8. Consensus / TA test

Use three different verified student sessions for the same course and express confusion about the same/similar doubt. The existing threshold remains **3**.

TA dashboard interpretation:

- Pending: unresolved and confusion count < 3.
- Small group: unresolved and confusion count >= 2 and < 3.
- Consensus reached: unresolved and confusion count >= 3.
- Resolved: status is resolved.
- Active Students: live Firestore presence count.

## 9. Professor high-priority notification test

Browser notifications require browser permission and work best on `http://localhost:3000` or HTTPS.

1. Join as Professor and allow notifications when prompted (or click **Enable desktop alerts**).
2. Keep 0-3 unresolved doubts -> no high-priority alert.
3. Increase to 4 unresolved doubts -> in-page high-priority alert appears and one desktop/browser notification is sent.
4. Increase 4 -> 5 -> the high-priority state remains, but the app does not repeatedly notify on each Firestore refresh.
5. Resolve doubts until the count is 3 -> alert clears.
6. Increase 3 -> 4 again -> a new desktop notification is allowed.
7. Click **View Doubts** to jump to the active unresolved-doubt list.

A normal browser cannot bypass OS/browser notification permission or force itself above every desktop application.

---

## TA answers -> Student in real time

This project continues using the existing `confusions` collection as the single source of truth.

When a TA answers, the existing confusion document is updated by its real Firestore document ID with:

- `answer` (legacy compatibility)
- `taAnswer`
- `taId`
- `taName`
- `answeredAt`
- `status: "answered"`

The existing course `onSnapshot()` listener refreshes connected clients, so a Student does not need to reload the page. No second `doubts` or `answeredQuestions` collection is created.

## Firebase Cloud Messaging / professor desktop push

The project now includes:

- `frontend/firebase-messaging-sw.js` — background Firebase Messaging service worker
- `frontend/js/firebase-messaging-config.js` — public Web Push VAPID key setting
- `functions/index.js` — Firestore-triggered Firebase Cloud Function
- `fcmTokens/{professorUid}` — multiple browser/device FCM tokens per professor

### 1. Create a Web Push certificate

In Firebase Console:

**Project settings -> Cloud Messaging -> Web Push certificates**

Generate a Web Push key pair if one does not already exist. Copy the **public key** and paste it into:

`frontend/js/firebase-messaging-config.js`

Replace only:

`PASTE_FIREBASE_WEB_PUSH_PUBLIC_VAPID_KEY_HERE`

The VAPID public key is a browser public key. Do not place private/server credentials in frontend files.

### 2. Publish Firestore rules and indexes

From the project root:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

The rules let only the signed-in professor UID maintain its own `fcmTokens` document. Cloud Functions use the Firebase Admin SDK and do not need client rule access.

### 3. Deploy the Cloud Function

Install the Firebase CLI if required, log in, and select the existing `cyhi-daf42` Firebase project. Then:

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

The function `notifyProfessorOnNewDoubt` runs when a new document is created at:

`confusions/{doubtId}`

It uses the existing `accessSessions` collection to find only professor sessions whose `courseCode` matches the new doubt's `classId`, reads their registered FCM tokens, and sends a data-only Web Push message. Invalid/expired tokens are removed automatically.

Firebase Cloud Functions may require enabling billing on the Firebase/Google Cloud project depending on the project's plan and deployment requirements.

### 4. Professor first-time setup

The professor must:

1. Join the Professor dashboard for the course at least once.
2. Click **Enable desktop alerts**.
3. Allow browser notifications.

The browser then stores its FCM token under the professor's Firebase UID. A second browser/device is added to the token array instead of replacing the first token.

### 5. Background notification test

1. Open the Professor dashboard, click **Enable desktop alerts**, and allow notifications.
2. Leave the browser running and switch to PowerPoint, Word, Excel, or another app.
3. Open the Student site in another browser/profile and create a new doubt.
4. Firestore creates the `confusions/{doubtId}` document.
5. The Cloud Function sends FCM push to the professor for that course.
6. A Windows/browser notification should appear even if the Professor tab is in the background/minimized.
7. Click the notification. The Professor page opens/focuses and scrolls to that doubt where possible.

Web push still depends on browser/OS notification permissions and the browser's normal background-push support; a website cannot bypass those operating-system controls.


## AI moderation verification

After starting the backend with `OPENAI_API_KEY`, open:

`http://localhost:3000/api/moderation-status`

It should report `"aiConfigured": true` and `"mode": "semantic-ai"`. The server console also prints `AI moderation: ENABLED`. If it reports false, the site is using only the structural local fallback.

The browser now waits up to 12 seconds for the semantic classifier instead of falling back after 1.8 seconds, and it uses the server decision for both allowed and rejected messages.

## Seed student 25BCS164 (Siri) into live Firestore

The bundled demo roster now contains `25BCS164` with name `Siri`, section `B`, enrolled in `IT2001`. To write the same record into your live Firebase project, use `scripts/seed-siri-student.js` with Firebase Admin credentials. The repository intentionally does not contain a private service-account key.

PowerShell:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account.json"
cd functions
npm install
cd ..
node scripts/seed-siri-student.js
```
