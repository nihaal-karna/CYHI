function joinClass(className){

    localStorage.setItem("class", className);

    window.location.href = "studentDashboard.html";

}

function logout(){

    localStorage.clear();

    window.location.href = "studentLogin.html";

}