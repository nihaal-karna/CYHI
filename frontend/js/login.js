import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

// Student Login
const loginBtn = document.getElementById("loginBtn");

if (loginBtn) {
    loginBtn.addEventListener("click", () => {

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (email === "" || password === "") {
            alert("Please enter Email and Password");
            return;
        }

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                alert("Student Login Successful!");
                window.location.href = "classes.html";
            })
            .catch((error) => {
                alert(error.message);
            });

    });
}

// Teacher Login
const teacherLoginBtn = document.getElementById("teacherLoginBtn");

if (teacherLoginBtn) {
    teacherLoginBtn.addEventListener("click", () => {

        const email = document.getElementById("teacherEmail").value.trim();
        const password = document.getElementById("teacherPassword").value.trim();

        if (email === "" || password === "") {
            alert("Please enter Email and Password");
            return;
        }

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                alert("Teacher Login Successful!");
                window.location.href = "teacherDashboard.html";
            })
            .catch((error) => {
                alert(error.message);
            });

    });
}