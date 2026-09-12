import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const firebaseConfig = {

  apiKey: "AIzaSyBn34zmEndZX0kz748f-4TCRqWZnTH4zLM",
  authDomain: "silentraise-ac210.firebaseapp.com",
  projectId: "silentraise-ac210",
  storageBucket: "silentraise-ac210.firebasestorage.app",
  messagingSenderId: "737583028760",
  appId: "1:737583028760:web:d4c9af1e578eab1ba5016d"

};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

export { auth, db };