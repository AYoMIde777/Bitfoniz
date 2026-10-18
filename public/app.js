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
  window.targetPortal = "admin"; // Explicitly flag that admin portal was requested
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

// Public Homepage Initializations (Calculator, etc.)
document.addEventListener("DOMContentLoaded", () => {
  const amtInput = document.getElementById("investmentAmount");
  const durSelect = document.getElementById("investmentDuration");
  const projRet = document.getElementById("projectedReturn");
  const withAmt = document.getElementById("withdrawableAmount");

  function calc() {
    let val = parseFloat(amtInput?.value) || 12000;
    if (val < 12000) val = 12000;
    const months = parseInt(durSelect?.value || 6);
    const total = val * Math.pow(1 + 0.035, months);
    const buffer = total * 0.22;
    if (projRet)
      projRet.textContent =
        "$" +
        total.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
    if (withAmt)
      withAmt.textContent =
        "$" +
        buffer.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  }

  if (amtInput && durSelect) {
    amtInput.addEventListener("input", calc);
    durSelect.addEventListener("change", calc);
    calc();
  }
});

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
      credentials: "include", // REQUIRED: Sends and receives cookies across domains
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      // Secure redirection based on administrative privileges or target gateway
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

// Smart Portal Gateway Handler (Triggered from Top Nav / Footer)
window.handlePortalClick = async function (portalType) {
  window.targetPortal = portalType;
  try {
    const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
      credentials: "include" // REQUIRED: Includes cookie so backend recognizes session
    });
    if (res.ok) {
      const user = await res.json();
      if (portalType === "admin") {
        if (user.isAdmin) {
          window.location.href = "/admin-portal.html";
        } else {
          alert("Access Restricted: You are logged in as a regular client.");
          window.location.href = "/client-portal.html";
        }
      } else {
        if (user.isAdmin) {
          window.location.href = "/admin-portal.html";
        } else {
          window.location.href = "/client-portal.html";
        }
      }
    } else {
      openAuthModal("login");
    }
  } catch (err) {
    openAuthModal("login");
  }
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

// Support Chat Toggle Handler
window.toggleSupportChat = function () {
  let chatModal = document.getElementById("supportChatModal");
  
  if (!chatModal) {
    chatModal = document.createElement("div");
    chatModal.id = "supportChatModal";
    chatModal.style.cssText = "position: fixed; bottom: 20px; right: 20px; width: 320px; background: #fff; border: 1px solid var(--border-color); border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); z-index: 1000; padding: 20px; font-family: 'Plus Jakarta Sans', sans-serif;";
    chatModal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
        <h4 style="margin: 0; color: var(--primary-deep); font-size: 1rem;"><i class="fa-solid fa-headset"></i> Bitfoniz Support Desk</h4>
        <button onclick="document.getElementById('supportChatModal').style.display='none'" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-muted);">&times;</button>
      </div>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 15px;">Our institutional desk is active. Send your inquiry directly to our compliance officers:</p>
      <a href="mailto:support@bitfoniz.com" class="btn btn-primary" style="display: block; text-align: center; text-decoration: none; padding: 10px; font-size: 0.85rem; border-radius: 8px;">Email Support Desk</a>
    `;
    document.body.appendChild(chatModal);
  } else {
    chatModal.style.display = chatModal.style.display === "none" ? "block" : "none";
  }
};