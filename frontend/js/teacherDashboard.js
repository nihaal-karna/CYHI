import { db } from "./firebase.js";

import {
collection,
query,
where,
onSnapshot,
doc,
updateDoc,
getDocs
}
from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const teacherContainer=document.getElementById("teacherContainer");

const total=document.getElementById("totalDoubts");

const forwarded=document.getElementById("forwarded");

const logoutBtn=document.getElementById("logoutBtn");

// Logout

logoutBtn.addEventListener("click",()=>{

localStorage.clear();

window.location.href="teacherLogin.html";

});

// Total doubts

async function loadStats(){

const snapshot=await getDocs(collection(db,"doubts"));

total.innerHTML=snapshot.size;

}

loadStats();

// Load forwarded doubts

const q=query(

collection(db,"doubts"),

where("forwarded","==",true)

);

onSnapshot(q,(snapshot)=>{

teacherContainer.innerHTML="";

forwarded.innerHTML=snapshot.size;

if(snapshot.empty){

teacherContainer.innerHTML=`

<div class="card">

<h3>🎉 Great!</h3>

<p>No major confusion in the classroom.</p>

</div>

`;

return;

}

snapshot.forEach((docSnap)=>{

const d=docSnap.data();

teacherContainer.innerHTML+=`

<div class="card">

<h3>🔥 CLASS CONFUSION</h3>

<p><strong>Topic:</strong></p>

<h2>${d.text}</h2>

<br>

<p>

<b>${d.likes}</b> students are confused about this topic.

</p>

<button onclick="answerDoubt('${docSnap.id}')">

✅ Mark as Answered

</button>

</div>

`;

});

});

// Mark answered

window.answerDoubt=async(id)=>{

await updateDoc(doc(db,"doubts",id),{

answered:true,

forwarded:false

});

alert("Marked as Answered");

};