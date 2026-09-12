import { auth } from "./firebase.js";

import {
signInWithEmailAndPassword
}
from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", async () => {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if(email=="" || password==""){
        alert("Please enter email and password");
        return;
    }

    try{

        await signInWithEmailAndPassword(auth,email,password);

        window.location.href="teacherDashboard.html";

    }

    catch(error){

        alert(error.message);

    }

});