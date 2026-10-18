const API_BASE_URL =
  window.location.hostname === "localhost"
    ? ""
    : "https://bitfoniz.onrender.com";
let isLoginMode = false;

window.openAuthModal = function (mode = "signup") {
  isLoginMode = mode === "login";
  document.getElementById("modalTitle").textContent = isLoginMode
    ? "Client Portal Login"
    : "Create Client Account ($12k Min)";
  const nameField = document.getElementById("nameFieldGroup");
  if (nameField) nameField.style.display = isLoginMode ? "none" : "block";
  document.getElementById("authSwitchPrompt").textContent = isLoginMode
    ? "Don't have an account?"
    : "Already have an account?";
  document.getElementById("authSwitchLink").textContent = isLoginMode
    ? "Register"
    : "Login";
  document.getElementById("authModal").style.display = "flex";
};

window.openAdminModal = function () {
  window.targetPortal = "admin";
  openAuthModal("login");
  const emailInput = document.getElementById("authEmail");
  if (emailInput) emailInput.value = "admin@bitfoniz.com";
  document.getElementById("modalTitle").textContent = "Admin Portal Login";
};

window.closeAuthModal = function () {
  document.getElementById("authModal").style.display = "none";
};

window.toggleAuthMode = function () {
  isLoginMode = !isLoginMode;
  openAuthModal(isLoginMode ? "login" : "signup");
};

// Authentication Handler
window.submitAuth = async function () {
  const name = document.getElementById("authName")?.value || "";
  const email = document.getElementById("authEmail").value;
  const password = document.getElementById("authPassword").value;
  const isLogin = document
    .getElementById("modalTitle")
    .textContent.includes("Login");
  const path = isLogin ? "/api/auth/login" : "/api/auth/register";
  const payload = isLogin ? { email, password } : { name, email, password };

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      if (
        data.isAdmin ||
        window.targetPortal === "admin" ||
        email === "admin@bitfoniz.com"
      ) {
        window.location.href = "/admin-portal.html";
      } else {
        window.location.href = "/client-portal.html";
      }
    } else {
      alert(data.error || "Authentication failed.");
    }
  } catch (err) {
    console.error(err);
    alert("An unexpected network error occurred.");
  }
};

// Logout Handler
window.logoutUser = async function () {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, { 
      method: "POST",
      credentials: "include" 
    });
  } catch (err) {
    console.error("Logout request failed", err);
  }
  window.location.href = "/";
};

// Password Toggle
window.togglePasswordVisibility = function () {
  const passwordInput = document.getElementById("authPassword");
  const eyeIcon = document.getElementById("passwordEyeIcon");

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    eyeIcon.className = "fa-solid fa-eye-slash";
  } else {
    passwordInput.type = "password";
    eyeIcon.className = "fa-solid fa-eye";
  }
};

// --- Interactive Support Chat Logic ---
window.toggleSupportChat = function () {
  const chatWindow = document.getElementById("supportChatWindow");
  if (chatWindow) {
    chatWindow.style.display = chatWindow.style.display === "none" ? "flex" : "none";
  }
};

window.sendUserMessage = function () {
  const input = document.getElementById("chatUserInput");
  const text = input.value.trim();
  if (!text) return;

  appendChatMessage(text, "user-message");
  input.value = "";

  // Auto-respond simulation after brief delay
  setTimeout(() => {
    generateBotResponse(text);
  }, 600);
};

window.sendQuickPrompt = function (promptText) {
  appendChatMessage(promptText, "user-message");
  setTimeout(() => {
    generateBotResponse(promptText);
  }, 600);
};

window.handleChatKeyPress = function (event) {
  if (event.key === "Enter") {
    sendUserMessage();
  }
};

function appendChatMessage(text, className) {
  const chatBody = document.getElementById("chatBody");
  if (!chatBody) return;
  const msgDiv = document.createElement("div");
  msgDiv.className = `chat-message ${className}`;
  msgDiv.textContent = text;
  chatBody.appendChild(msgDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function generateBotResponse(query) {
  let reply = "Thank you for reaching out to Bitfoniz Holdings. Our compliance desk is reviewing your request. You can also reach us via email at support@bitfoniz.com.";
  
  const q = query.toLowerCase();
  if (q.includes("minimum") || q.includes("$12k") || q.includes("12000")) {
    reply = "The minimum investment capital requirement at Bitfoniz Holdings starts at $12,000 to ensure stable asset-backed agro allocation.";
  } else if (q.includes("22%") || q.includes("withdrawal") || q.includes("liquidity")) {
    reply = "Bitfoniz provides a 22% flexible liquidity buffer allowing you to withdraw a portion of your funds anytime without penalty.";
  } else if (q.includes("crypto") || q.includes("payout") || q.includes("deposit")) {
    reply = "You can securely deposit or request crypto payouts (USDT TRC20, Bitcoin, Ethereum) directly through your Client Portal after logging in.";
  }

  appendChatMessage(reply, "bot-message");
}