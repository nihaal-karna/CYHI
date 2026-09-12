import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    serverTimestamp,
    query,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    increment
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// Elements
const className = document.getElementById("className");
const doubt = document.getElementById("doubt");
const postBtn = document.getElementById("postBtn");
const doubtsContainer = document.getElementById("doubtsContainer");

const chatBox = document.getElementById("chatBox");
const message = document.getElementById("message");
const sendBtn = document.getElementById("sendBtn");

const logoutBtn = document.getElementById("logoutBtn");

// Show selected class
className.innerText = localStorage.getItem("class");

// Logout
logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "studentLogin.html";
});

// ----------------------
// POST DOUBT
// ----------------------

postBtn.addEventListener("click", async () => {

    const text = doubt.value.trim();

    if (text === "") {
        alert("Please enter your doubt.");
        return;
    }

    await addDoc(collection(db, "doubts"), {

        text: text,

        likes: 1,   // Student posting is also confused

        forwarded: false,

        answered: false,

        class: localStorage.getItem("class"),

        time: serverTimestamp()

    });

    doubt.value = "";

});

// ----------------------
// LOAD DOUBTS
// ----------------------

const doubtsQuery = query(
    collection(db, "doubts"),
    orderBy("time", "desc")
);

onSnapshot(doubtsQuery, (snapshot) => {

    doubtsContainer.innerHTML = "";

    snapshot.forEach((docSnap) => {

        const data = docSnap.data();

        if (
            data.class === localStorage.getItem("class") &&
            !data.answered
        ) {

            doubtsContainer.innerHTML += `

            <div class="card">

                <h3>👤 Anonymous Student</h3>

                <p>${data.text}</p>

                <p>👍 ${data.likes} students are confused</p>

                <button
                    class="likeBtn"
                    onclick="likeDoubt('${docSnap.id}', ${data.likes})">

                    👍 Me Too

                </button>

            </div>

            `;

        }

    });

});

// ----------------------
// LIKE DOUBT
// ----------------------

window.likeDoubt = async (id, currentLikes) => {

    await updateDoc(doc(db, "doubts", id), {

        likes: increment(1),

        forwarded: (currentLikes + 1) >= 3

    });

};

// ----------------------
// SEND CHAT MESSAGE
// ----------------------

sendBtn.addEventListener("click", async () => {

    const text = message.value.trim();

    if (text === "") return;

    await addDoc(collection(db, "messages"), {

        message: text,

        class: localStorage.getItem("class"),

        time: serverTimestamp()

    });

    message.value = "";

});

// ----------------------
// LOAD CHAT
// ----------------------

const chatQuery = query(
    collection(db, "messages"),
    orderBy("time")
);

onSnapshot(chatQuery, (snapshot) => {

    chatBox.innerHTML = "";

    snapshot.forEach((docSnap) => {

        const data = docSnap.data();

        if (data.class === localStorage.getItem("class")) {

            chatBox.innerHTML += `

            <div class="message">

                <strong>👤 Anonymous Student</strong>

                <br><br>

                ${data.message}

            </div>

            `;

        }

    });

    chatBox.scrollTop = chatBox.scrollHeight;

});