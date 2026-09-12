import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const signupBtn = document.getElementById("signupBtn");

signupBtn.addEventListener("click", async () => {

    const name = document.getElementById("name").value.trim();
    const roll = document.getElementById("roll").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if(name=="" || roll=="" || email=="" || password==""){
        alert("Please fill all fields");
        return;
    }

    try{

        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        const user = userCredential.user;

        await setDoc(doc(db,"students",user.uid),{

            name:name,
            roll:roll,
            email:email

        });

        alert("Registration Successful");

        window.location.href="studentLogin.html";

    }

    catch(error){

        alert(error.message);

    }

});