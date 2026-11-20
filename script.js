const STORAGE_KEY = "vj-marketing-users";
const REMEMBERED_EMAIL_KEY = "vj-marketing-remembered-email";
const CURRENT_USER_KEY = "vj-marketing-current-user";
const HASH_ITERATIONS = 120000;

const loginForm = document.getElementById("loginForm");
const formTitle = document.getElementById("formTitle");
const formSubtitle = document.getElementById("formSubtitle");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const message = document.getElementById("message");
const forgotPassword = document.getElementById("forgotPassword");
const rememberInput = document.getElementById("remember");
const switchMode = document.getElementById("switchMode");
const switchPrompt = document.getElementById("switchPrompt");
const submitText = document.getElementById("submitText");
const signupFields = document.querySelectorAll(".signup-field");
const loginOnlyFields = document.querySelectorAll(".login-only");

let isSignupMode = false;

const activeUser = localStorage.getItem(CURRENT_USER_KEY);
if (activeUser) {
    window.location.replace("index.html");
}

function getUsers() {
    const storedUsers = localStorage.getItem(STORAGE_KEY);

    if (!storedUsers) {
        return {};
    }

    try {
        return JSON.parse(storedUsers);
    } catch (error) {
        throw new Error("Saved account data is invalid.");
    }
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function bytesToBase64(bytes) {
    let binary = "";
    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });
    return btoa(binary);
}

function base64ToBytes(value) {
    return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function hashPassword(password, salt) {
    if (!window.crypto || !window.crypto.subtle) {
        throw new Error("Open this page through localhost or a secure website to enable password storage.");
    }

    const passwordBytes = new TextEncoder().encode(password);
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        passwordBytes,
        "PBKDF2",
        false,
        ["deriveBits"]
    );
    const hash = await window.crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt,
            iterations: HASH_ITERATIONS,
            hash: "SHA-256"
        },
        keyMaterial,
        256
    );

    return bytesToBase64(new Uint8Array(hash));
}

function setMessage(text, color = "#f87171") {
    message.textContent = text;
    message.style.color = color;
}

function goToHome(user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({
        name: user.name,
        email: user.email
    }));
    window.location.href = "index.html";
}

function setMode(signupMode) {
    isSignupMode = signupMode;
    formTitle.textContent = signupMode ? "Create Account" : "Welcome Back!";
    formSubtitle.textContent = signupMode
        ? "Sign up to start your journey"
        : "Login to continue your journey";
    submitText.textContent = signupMode ? "Sign Up" : "Login";
    switchPrompt.textContent = signupMode ? "Already have an account?" : "Don't have an account?";
    switchMode.textContent = signupMode ? "Login" : "Sign Up";
    passwordInput.autocomplete = signupMode ? "new-password" : "current-password";
    passwordInput.value = "";
    setMessage("");

    signupFields.forEach((field) => field.classList.toggle("hidden", !signupMode));
    loginOnlyFields.forEach((field) => field.classList.toggle("hidden", signupMode));
    nameInput.required = signupMode;
}

togglePassword.addEventListener("click", () => {
    const showingPassword = passwordInput.type === "text";
    passwordInput.type = showingPassword ? "password" : "text";
    togglePassword.textContent = showingPassword ? "Show" : "Hide";
});

switchMode.addEventListener("click", (event) => {
    event.preventDefault();
    setMode(!isSignupMode);
});

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!email || !password || (isSignupMode && !nameInput.value.trim())) {
        setMessage("Please fill all fields.");
        return;
    }

    if (password.length < 6) {
        setMessage("Password must contain at least 6 characters.");
        return;
    }

    try {
        const users = getUsers();

        if (isSignupMode) {
            if (users[email]) {
                setMessage("An account with this email already exists.");
                return;
            }

            if (!window.crypto || !window.crypto.getRandomValues) {
                throw new Error("Secure account creation is unavailable in this browser.");
            }

            const salt = window.crypto.getRandomValues(new Uint8Array(16));
            users[email] = {
                name: nameInput.value.trim(),
                salt: bytesToBase64(salt),
                passwordHash: await hashPassword(password, salt)
            };
            saveUsers(users);
            goToHome({ name: users[email].name, email });
            return;
        }

        const user = users[email];
        if (!user) {
            setMessage("Email or password is incorrect.");
            return;
        }

        const salt = base64ToBytes(user.salt);
        const passwordHash = await hashPassword(password, salt);
        if (passwordHash !== user.passwordHash) {
            setMessage("Email or password is incorrect.");
            return;
        }

        if (rememberInput.checked) {
            localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
        } else {
            localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }
        goToHome({ name: user.name, email });
    } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to complete this request.");
    }
});

forgotPassword.addEventListener("click", (event) => {
    event.preventDefault();
    setMessage("Password reset requires a server and email service.", "#b58aff");
});

emailInput.value = localStorage.getItem(REMEMBERED_EMAIL_KEY) || "";
