const CURRENT_USER_KEY = "vj-marketing-current-user";

function getCurrentUser() {
    const savedUser = localStorage.getItem(CURRENT_USER_KEY);

    if (!savedUser) {
        return null;
    }

    try {
        return JSON.parse(savedUser);
    } catch (error) {
        localStorage.removeItem(CURRENT_USER_KEY);
        return null;
    }
}

const currentUser = getCurrentUser();

if (!currentUser || !currentUser.name || !currentUser.email) {
    window.location.replace("login.html");
} else {
    const accountLink = document.getElementById("accountLink");
    const welcomeName = document.getElementById("welcomeName");

    accountLink.textContent = `Logout (${currentUser.name})`;
    accountLink.href = "#";
    accountLink.addEventListener("click", (event) => {
        event.preventDefault();
        localStorage.removeItem(CURRENT_USER_KEY);
        window.location.replace("login.html");
    });

    welcomeName.textContent = currentUser.name;
}
