// State
let chatHistory = [];
let isGenerating = false;

// DOM Elements
const statusIndicator = document.getElementById("profileStatusIndicator");
const statusLabel = document.getElementById("statusLabel");
const sidebarPanel = document.getElementById("sidebarPanel");
const toggleSidebarBtn = document.getElementById("toggleSidebarBtn");

const tabUploadBtn = document.getElementById("tabUploadBtn");
const tabUrlBtn = document.getElementById("tabUrlBtn");
const tabUploadPane = document.getElementById("tab-upload");
const tabUrlPane = document.getElementById("tab-url");

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const selectedFileInfo = document.getElementById("selectedFileInfo");
const selectedFileName = document.getElementById("selectedFileName");
const submitFileBtn = document.getElementById("submitFileBtn");

const urlForm = document.getElementById("urlForm");
const urlInput = document.getElementById("urlInput");
const fetchUrlBtn = document.getElementById("fetchUrlBtn");

const processingLoader = document.getElementById("processingLoader");
const processingText = document.getElementById("processingText");

const markdownCode = document.getElementById("markdownCode");
const copyMarkdownBtn = document.getElementById("copyMarkdownBtn");
const refreshProfileBtn = document.getElementById("refreshProfileBtn");

const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const clearChatBtn = document.getElementById("clearChatBtn");
const promptChips = document.getElementById("promptChips");
const toast = document.getElementById("toast");

let selectedFile = null;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
  initEventListeners();
  renderWelcomeMessage();
});

function initEventListeners() {
  // Sidebar Toggle
  toggleSidebarBtn.addEventListener("click", () => {
    sidebarPanel.classList.toggle("collapsed");
    sidebarPanel.classList.toggle("open");
  });

  // Tabs
  tabUploadBtn.addEventListener("click", () => switchTab("upload"));
  tabUrlBtn.addEventListener("click", () => switchTab("url"));

  // File Drop Zone
  dropZone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", handleFileSelect);

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  });

  submitFileBtn.addEventListener("click", uploadSelectedFile);

  // URL Form
  urlForm.addEventListener("submit", handleUrlSubmit);

  // Markdown controls
  copyMarkdownBtn.addEventListener("click", copyMarkdown);
  refreshProfileBtn.addEventListener("click", loadProfile);

  // Chat Form & Textarea
  chatForm.addEventListener("submit", handleChatSubmit);
  
  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event("submit"));
    }
  });

  messageInput.addEventListener("input", autoResizeTextarea);

  // Clear Chat
  clearChatBtn.addEventListener("click", clearChat);

  // Prompt Chips
  promptChips.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (chip) {
      const prompt = chip.getAttribute("data-prompt");
      messageInput.value = prompt;
      autoResizeTextarea();
      chatForm.dispatchEvent(new Event("submit"));
    }
  });
}

function switchTab(tab) {
  if (tab === "upload") {
    tabUploadBtn.classList.add("active");
    tabUrlBtn.classList.remove("active");
    tabUploadPane.classList.add("active");
    tabUrlPane.classList.remove("active");
  } else {
    tabUrlBtn.classList.add("active");
    tabUploadBtn.classList.remove("active");
    tabUrlPane.classList.add("active");
    tabUploadPane.classList.remove("active");
  }
}

function autoResizeTextarea() {
  messageInput.style.height = "auto";
  messageInput.style.height = Math.min(messageInput.scrollHeight, 140) + "px";
}

function showToast(message, type = "success") {
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => {
    toast.className = "toast";
  }, 4000);
}

// Load current profile from /api/profile
async function loadProfile() {
  try {
    const res = await fetch("/api/profile");
    if (!res.ok) throw new Error("Failed to load profile status");
    const data = await res.json();

    if (data.exists && data.markdown) {
      markdownCode.textContent = data.markdown;
      statusIndicator.className = "status-indicator ready";
      statusLabel.textContent = "Profile Loaded";
    } else {
      markdownCode.textContent = "No profile loaded. Upload a document or fetch a public URL to begin.";
      statusIndicator.className = "status-indicator empty";
      statusLabel.textContent = "No Profile";
    }
  } catch (err) {
    markdownCode.textContent = "Error loading profile: " + err.message;
    statusIndicator.className = "status-indicator empty";
    statusLabel.textContent = "Load Error";
  }
}

// File handling
function handleFileSelect(e) {
  if (e.target.files && e.target.files.length > 0) {
    processSelectedFile(e.target.files[0]);
  }
}

function processSelectedFile(file) {
  const allowed = [".pdf", ".docx", ".doc", ".txt", ".html", ".htm", ".md"];
  const ext = "." + file.name.split(".").pop().toLowerCase();
  
  if (!allowed.includes(ext)) {
    showToast(`Unsupported format ${ext}. Allowed: PDF, DOCX, DOC, TXT, HTML, MD`, "error");
    return;
  }

  if (file.size > 15 * 1024 * 1024) {
    showToast("File size exceeds 15MB limit.", "error");
    return;
  }

  selectedFile = file;
  selectedFileName.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  selectedFileInfo.style.display = "flex";
}

async function uploadSelectedFile() {
  if (!selectedFile) return;

  const formData = new FormData();
  formData.append("file", selectedFile);

  setProcessing(true, "Extracting text and converting to Markdown...");

  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Upload failed");
    }

    markdownCode.textContent = data.markdown;
    statusIndicator.className = "status-indicator ready";
    statusLabel.textContent = "Profile Updated";
    showToast("Profile successfully extracted & updated!", "success");

    selectedFile = null;
    selectedFileInfo.style.display = "none";
    fileInput.value = "";
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    setProcessing(false);
  }
}

// URL Handling
async function handleUrlSubmit(e) {
  e.preventDefault();
  const url = urlInput.value.trim();
  if (!url) return;

  const formData = new FormData();
  formData.append("url", url);

  setProcessing(true, "Fetching webpage and extracting content...");

  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "URL fetch failed");
    }

    markdownCode.textContent = data.markdown;
    statusIndicator.className = "status-indicator ready";
    statusLabel.textContent = "Profile Updated";
    showToast("Webpage extracted & saved as Markdown!", "success");
    urlInput.value = "";
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    setProcessing(false);
  }
}

function setProcessing(isProcessing, message = "") {
  if (isProcessing) {
    processingLoader.style.display = "flex";
    processingText.textContent = message;
    submitFileBtn.disabled = true;
    fetchUrlBtn.disabled = true;
  } else {
    processingLoader.style.display = "none";
    submitFileBtn.disabled = false;
    fetchUrlBtn.disabled = false;
  }
}

async function copyMarkdown() {
  const content = markdownCode.textContent;
  if (!content) return;
  try {
    await navigator.clipboard.writeText(content);
    showToast("Markdown copied to clipboard!", "success");
  } catch (err) {
    showToast("Failed to copy to clipboard", "error");
  }
}

// Chat UI Logic
function renderWelcomeMessage() {
  chatMessages.innerHTML = "";
  appendBotMessage(
    "Hello! I am your AI persona powered strictly by your LinkedIn profile. Ask me any questions about my professional background, skills, education, or career achievements.",
    "Summary"
  );
}

function appendUserMessage(text) {
  const row = document.createElement("div");
  row.className = "message-row user";
  row.innerHTML = `
    <div class="msg-avatar user-av">You</div>
    <div class="message-bubble">${escapeHtml(text)}</div>
  `;
  chatMessages.appendChild(row);
  scrollToBottom();
}

function appendBotMessage(text, section) {
  const row = document.createElement("div");
  row.className = "message-row bot";

  let sectionTagHtml = "";
  if (section && section !== "None") {
    sectionTagHtml = `<div class="section-tag">📌 Source: ${escapeHtml(section)}</div>`;
  } else if (section === "None") {
    sectionTagHtml = `<div class="section-tag none">ℹ️ Not found in profile</div>`;
  }

  row.innerHTML = `
    <div class="msg-avatar bot-av">AI</div>
    <div class="message-bubble">
      <div class="msg-text">${escapeHtml(text)}</div>
      ${sectionTagHtml}
    </div>
  `;
  chatMessages.appendChild(row);
  scrollToBottom();
}

function showTypingIndicator() {
  const id = "typingIndicator";
  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const row = document.createElement("div");
  row.id = id;
  row.className = "message-row bot";
  row.innerHTML = `
    <div class="msg-avatar bot-av">AI</div>
    <div class="message-bubble">
      <div class="typing-dots">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    </div>
  `;
  chatMessages.appendChild(row);
  scrollToBottom();
}

function removeTypingIndicator() {
  const indicator = document.getElementById("typingIndicator");
  if (indicator) indicator.remove();
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(string) {
  const div = document.createElement("div");
  div.innerText = string;
  return div.innerHTML;
}

async function handleChatSubmit(e) {
  e.preventDefault();
  if (isGenerating) return;

  const message = messageInput.value.trim();
  if (!message) return;

  appendUserMessage(message);
  chatHistory.push({ role: "user", content: message });

  messageInput.value = "";
  autoResizeTextarea();
  isGenerating = true;
  sendBtn.disabled = true;
  showTypingIndicator();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message,
        history: chatHistory
      })
    });

    const data = await res.json();
    removeTypingIndicator();

    if (!res.ok) {
      throw new Error(data.detail || "Chat request failed");
    }

    const reply = data.reply || "My profile does not include that information.";
    const section = data.section || "None";

    appendBotMessage(reply, section);
    chatHistory.push({ role: "assistant", content: reply });

  } catch (err) {
    removeTypingIndicator();
    appendBotMessage(`⚠️ Error: ${err.message}`, "Error");
    showToast("Chat request failed: " + err.message, "error");
  } finally {
    isGenerating = false;
    sendBtn.disabled = false;
    messageInput.focus();
  }
}

function clearChat() {
  chatHistory = [];
  renderWelcomeMessage();
  showToast("Chat history cleared.", "success");
}
