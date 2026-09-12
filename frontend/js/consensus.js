// Consensus Main Web Application Logic
// Provides complete single-page interactive UI for Landing, Join, Student, TA, and Professor views.

(function () {
  "use strict";

  // State
  let activeTab = "doubts"; // for student (doubts | discussion | activity)
  let taActiveTab = "dashboard"; // for ta (dashboard | queue | answered | classes | discussion)
  let notifsOpen = false;
  let userMenuOpen = false;
  let switcherExpanded = true;
  let answerModalDoubtId = null;
  let resolveModalDoubtId = null;

  // Icons Helper
  const Icons = {
    logo: `
      <span class="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <span class="flex gap-0.5">
          <span class="block h-3 w-0.5 rounded-full bg-primary-foreground"></span>
          <span class="block h-3.5 w-0.5 rounded-full bg-primary-foreground/70"></span>
          <span class="block h-2.5 w-0.5 rounded-full bg-primary-foreground/50"></span>
        </span>
      </span>`,
    hand: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hand size-4.5"><path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"></path><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"></path><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"></path><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path></svg>`,
    handMetal: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hand-metal size-4"><path d="M18 12.5V10a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1.4"></path><path d="M14 11V9a2 2 0 1 0-4 0v2"></path><path d="M10 10.5V5a2 2 0 1 0-4 0v9"></path><path d="m7 15-1.76-1.76a2 2 0 0 0-2.83 2.82l3.6 3.6C7.5 21.14 9.2 22 12 22h2a8 8 0 0 0 8-8V7a2 2 0 1 0-4 0v5"></path></svg>`,
    users: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users size-4"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><path d="M16 3.128a4 4 0 0 1 0 7.744"></path><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><circle cx="9" cy="7" r="4"></circle></svg>`,
    shieldOff: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-off size-4"><path d="m2 2 20 20"></path><path d="M5 5a1 1 0 0 0-1 1v7c0 5 3.5 7.5 7.67 8.94a1 1 0 0 0 .67.01c2.35-.82 4.48-1.97 5.9-3.71"></path><path d="M9.309 3.652A12.252 12.252 0 0 0 11.24 2.28a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1v7a9.784 9.784 0 0 1-.08 1.264"></path></svg>`,
    eye: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye size-4"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
    gradCap: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-graduation-cap size-5"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"></path><path d="M22 10v6"></path><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"></path></svg>`,
    headset: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-headset size-5"><path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z"></path><path d="M21 16v2a4 4 0 0 1-4 4h-5"></path></svg>`,
    presentation: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-presentation size-5"><path d="M2 3h20"></path><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"></path><path d="m7 21 5-5 5 5"></path></svg>`,
    bell: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bell size-4.5"><path d="M10.268 21a2 2 0 0 0 3.464 0"></path><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.674C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326Z"></path></svg>`,
    arrowRight: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right size-4"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>`,
    arrowDown: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-down size-4"><path d="M12 5v14"></path><path d="m19 12-7 7-7-7"></path></svg>`,
    arrowLeft: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left size-4"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check size-3.5"><path d="M20 6 9 17l-5-5"></path></svg>`,
    messagesSquare: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-messages-square size-8"><path d="M16 10a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 14.286V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path><path d="M20 9a2 2 0 0 1 2 2v10.286a.71.71 0 0 1-1.212.502l-2.202-2.202A2 2 0 0 0 17.172 19H10a2 2 0 0 1-2-2v-1"></path></svg>`,
    messageCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-circle size-3.5"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path></svg>`,
    sparkles: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles size-4 text-consensus"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path></svg>`,
    plus: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus size-3.5"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>`,
    logOut: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-log-out size-3.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line></svg>`,
    send: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-send size-3.5"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg>`,
    close: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x size-4"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>`,
    activity: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-activity size-3.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>`,
    inbox: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-inbox size-4"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>`
  };

  // Helper to get initials
  function getInitials(name) {
    if (!name) return "U";
    return name
      .replace(/^(Dr\.|Prof\.)\s*/i, "")
      .split(" ")
      .map(part => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  // Escape HTML to prevent injection
  function escapeHTML(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Navigation Controller
  window.navigateTo = function (view, role) {
    if (role && DEFAULT_USERS[role]) {
      store.setUser(DEFAULT_USERS[role]);
    }
    store.setCurrentView(view);
    window.location.hash = view;
    renderApp();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Switch role directly from floating switcher or header
  window.switchRole = function (role) {
    if (DEFAULT_USERS[role]) {
      store.setUser(DEFAULT_USERS[role]);
      store.setCurrentView(role);
      window.location.hash = role;
      renderApp();
    }
  };

  // Initialize view from hash
  function initRouting() {
    const hash = window.location.hash.replace("#", "");
    if (["landing", "join", "student", "ta", "professor"].includes(hash)) {
      store.setCurrentView(hash);
      if (["student", "ta", "professor"].includes(hash) && !store.currentUser) {
        store.setUser(DEFAULT_USERS[hash]);
      }
    } else {
      store.setCurrentView("landing");
    }
    window.addEventListener("hashchange", () => {
      const h = window.location.hash.replace("#", "");
      if (["landing", "join", "student", "ta", "professor"].includes(h)) {
        store.setCurrentView(h);
        renderApp();
      }
    });
  }

  // Close menus when clicking outside
  document.addEventListener("click", (e) => {
    if (notifsOpen && !e.target.closest("#notif-dropdown-container")) {
      notifsOpen = false;
      renderNotifications();
    }
    if (userMenuOpen && !e.target.closest("#user-menu-container")) {
      userMenuOpen = false;
      renderUserMenu();
    }
  });

  // Global actions attached to window for event handlers
  window.consensusActions = {
    toggleNotifs: function (e) {
      e.stopPropagation();
      notifsOpen = !notifsOpen;
      userMenuOpen = false;
      if (notifsOpen) {
        store.markNotificationsRead();
      }
      renderNotifications();
    },

    toggleUserMenu: function (e) {
      e.stopPropagation();
      userMenuOpen = !userMenuOpen;
      notifsOpen = false;
      renderUserMenu();
    },

    leaveSession: function () {
      store.setUser(null);
      navigateTo("landing");
    },

    setStudentTab: function (tab) {
      activeTab = tab;
      renderApp();
    },

    setTaTab: function (tab) {
      taActiveTab = tab;
      renderApp();
    },

    selectDoubt: function (doubtId, targetTab) {
      store.setActiveDoubt(doubtId);
      if (targetTab) {
        activeTab = targetTab;
      }
      renderApp();
    },

    supportDoubt: function (doubtId) {
      const res = store.supportDoubt(doubtId);
      if (res) {
        renderApp();
      }
    },

    handleRaiseDoubt: function (e) {
      e.preventDefault();
      const topicInput = document.getElementById("doubt-topic-input");
      const questionInput = document.getElementById("doubt-question-input");
      const categorySelect = document.getElementById("doubt-category-select");

      const topic = topicInput.value;
      const question = questionInput.value;
      const category = categorySelect ? categorySelect.value : "Concept";

      if (!topic.trim() || !question.trim()) return;

      store.addDoubt({ topic, question, category });
      topicInput.value = "";
      questionInput.value = "";
      activeTab = "doubts";
      renderApp();
    },

    handleSendMessage: function (e, doubtId) {
      e.preventDefault();
      const input = document.getElementById("chat-message-input");
      if (!input || !input.value.trim()) return;
      store.addMessage(doubtId, input.value);
      input.value = "";
      renderApp();
    },

    openAnswerModal: function (doubtId) {
      answerModalDoubtId = doubtId;
      renderAnswerModal();
    },

    closeAnswerModal: function () {
      answerModalDoubtId = null;
      renderAnswerModal();
    },

    submitAnswer: function (e) {
      e.preventDefault();
      const answerInput = document.getElementById("answer-text-input");
      if (!answerInput || !answerInput.value.trim() || !answerModalDoubtId) return;
      store.answerDoubt(answerModalDoubtId, answerInput.value);
      answerModalDoubtId = null;
      renderAnswerModal();
      renderApp();
    },

    openResolveModal: function (doubtId) {
      resolveModalDoubtId = doubtId;
      renderResolveModal();
    },

    closeResolveModal: function () {
      resolveModalDoubtId = null;
      renderResolveModal();
    },

    submitResolve: function (e) {
      e.preventDefault();
      const noteInput = document.getElementById("resolve-note-input");
      const note = noteInput ? noteInput.value : "";
      if (resolveModalDoubtId) {
        store.resolveDoubt(resolveModalDoubtId, note || "Resolved live in lecture.");
      }
      resolveModalDoubtId = null;
      renderResolveModal();
      renderApp();
    },

    toggleSwitcher: function () {
      switcherExpanded = !switcherExpanded;
      renderRoleSwitcher();
    },

    scrollToSection: function (id) {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // Header component generator
  function renderHeader({ subtitle, links = [], active = "", onNavigateTab, showBrandAction = true }) {
    const user = store.currentUser;
    const unreadCount = store.notifications.filter((n) => !n.read).length;

    const navLinksHTML = links.length
      ? `<nav class="hidden items-center gap-1 md:flex">
          ${links
            .map(
              (l) => `
            <button type="button" onclick="${onNavigateTab}('${l.key}')" 
              class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                active === l.key
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }">
              ${l.label}
            </button>
          `
            )
            .join("")}
        </nav>`
      : "";

    const userProfileHTML = user
      ? `
      <div class="relative" id="user-menu-container">
        <button type="button" onclick="consensusActions.toggleUserMenu(event)" 
          class="flex items-center gap-2 rounded-lg border border-border bg-card py-1 pl-1 pr-2 transition-colors hover:bg-secondary">
          <span class="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
            ${getInitials(user.name)}
          </span>
          <div class="hidden text-left leading-none sm:block">
            <span class="block text-xs font-medium text-foreground">${escapeHTML(user.name)}</span>
            <span class="block text-[0.7rem] text-muted-foreground">${escapeHTML(user.roll || user.role.toUpperCase())}</span>
          </div>
        </button>
        <div id="user-menu-popover" class="hidden"></div>
      </div>
    `
      : "";

    const notifsHTML = user
      ? `
      <div class="relative" id="notif-dropdown-container">
        <button type="button" onclick="consensusActions.toggleNotifs(event)" 
          class="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" 
          aria-label="Notifications">
          ${Icons.bell}
          ${
            unreadCount > 0
              ? `<span class="absolute right-1.5 top-1.5 flex size-2 items-center justify-center">
                  <span class="absolute inline-flex size-full animate-ping rounded-full bg-consensus/60"></span>
                  <span class="relative inline-flex size-2 rounded-full bg-consensus"></span>
                </span>`
              : ""
          }
        </button>
        <div id="notifs-popover" class="hidden"></div>
      </div>
    `
      : "";

    return `
      <header class="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div class="mx-auto flex h-15 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div class="flex items-center gap-8">
            <button type="button" onclick="navigateTo('landing')" class="flex items-center gap-2.5 text-left group">
              ${Icons.logo}
              <span class="leading-none">
                <span class="block text-sm font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">Consensus</span>
                ${
                  subtitle
                    ? `<span class="block text-[0.7rem] font-medium text-muted-foreground">${escapeHTML(subtitle)}</span>`
                    : ""
                }
              </span>
            </button>
            ${navLinksHTML}
          </div>

          <div class="flex items-center gap-2">
            ${
              !user
                ? `<button type="button" onclick="navigateTo('join')" 
                    class="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                    Join Session
                  </button>`
                : `<div class="flex items-center gap-2">
                    ${notifsHTML}
                    ${userProfileHTML}
                  </div>`
            }
          </div>
        </div>
      </header>
    `;
  }

  // Lecture Session Sub-bar
  function renderSessionBar(actionsHTML = "") {
    return `
      <div class="border-b border-border bg-card/50">
        <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span class="inline-flex items-center gap-1.5 text-xs font-medium text-resolved-strong bg-resolved-soft px-2 py-0.5 rounded-full">
              <span class="size-1.5 rounded-full bg-resolved pulse-dot"></span>
              Connected
            </span>
            <span class="text-muted-foreground">
              <span class="font-medium text-foreground">${COURSE_INFO.code}</span> · ${COURSE_INFO.lecture}
            </span>
            <span class="inline-flex items-center gap-1.5 text-muted-foreground text-xs">
              ${Icons.users}
              ${COURSE_INFO.activeStudents} students active
            </span>
          </div>
          ${actionsHTML ? `<div class="flex items-center gap-2">${actionsHTML}</div>` : ""}
        </div>
      </div>
    `;
  }

  // 1. Landing View
  function renderLandingView() {
    const navLinks = [
      { label: "How It Works", key: "how" },
      { label: "For Students", key: "students" },
      { label: "For TAs", key: "tas" },
      { label: "For Professors", key: "professors" }
    ];

    return `
      <div class="min-h-screen">
        ${renderHeader({ links: navLinks, onNavigateTab: "consensusActions.scrollToSection" })}

        <!-- Hero Section -->
        <section class="relative overflow-hidden">
          <div class="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-24">
            <div class="fade-in">
              <span class="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
                <span class="size-1.5 rounded-full bg-consensus pulse-dot"></span>
                Silent Hand-Raise for classrooms
              </span>
              <h1 class="mt-5 text-balance font-serif text-4xl font-medium leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Ask Without Raising Your Hand.
              </h1>
              <p class="mt-5 max-w-lg text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                Consensus turns individual confusion into a collective classroom signal—without putting anyone on the spot.
              </p>
              <div class="mt-7 flex flex-wrap items-center gap-3">
                <button type="button" onclick="navigateTo('join')" 
                  class="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 shadow-sm cursor-pointer">
                  ${Icons.handMetal}
                  Join a Class
                </button>
                <button type="button" onclick="consensusActions.scrollToSection('how')" 
                  class="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary cursor-pointer">
                  See How It Works
                  ${Icons.arrowRight}
                </button>
              </div>
            </div>

            <!-- Core Mechanic Interactive Visualizer -->
            <div class="relative fade-in">
              <div class="rounded-2xl border border-border bg-secondary/40 p-6 sm:p-8 shadow-sm">
                <p class="mb-5 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  The core mechanic
                </p>
                <div class="mx-auto flex w-full max-w-sm flex-col gap-1">
                  <!-- Step 1 -->
                  <div class="flex flex-col items-center">
                    <div class="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-xs">
                      <div class="flex items-center gap-3">
                        <span class="size-2 rounded-full bg-state-normal"></span>
                        <span class="text-sm font-medium text-foreground">A student asks a doubt</span>
                      </div>
                      <span class="text-xs text-muted-foreground">1 confused</span>
                    </div>
                    <div class="my-1 text-muted-foreground/50">${Icons.arrowDown}</div>
                  </div>

                  <!-- Step 2 -->
                  <div class="flex flex-col items-center">
                    <div class="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-xs">
                      <div class="flex items-center gap-3">
                        <span class="size-2 rounded-full bg-state-normal"></span>
                        <span class="text-sm font-medium text-foreground">"I'm confused too"</span>
                      </div>
                      <span class="text-xs text-muted-foreground">others agree silently</span>
                    </div>
                    <div class="my-1 text-muted-foreground/50">${Icons.arrowDown}</div>
                  </div>

                  <!-- Step 3 -->
                  <div class="flex flex-col items-center">
                    <div class="flex w-full items-center justify-between gap-3 rounded-xl border border-approaching/40 bg-approaching-soft px-4 py-3 shadow-xs">
                      <div class="flex items-center gap-3">
                        <span class="size-2 rounded-full bg-approaching"></span>
                        <span class="text-sm font-medium text-foreground">4 students confused</span>
                      </div>
                      <span class="text-xs text-approaching-strong font-medium">approaching consensus</span>
                    </div>
                    <div class="my-1 text-muted-foreground/50">${Icons.arrowDown}</div>
                  </div>

                  <!-- Step 4 -->
                  <div class="flex flex-col items-center">
                    <div class="flex w-full items-center justify-between gap-3 rounded-xl border border-consensus/40 bg-consensus-soft px-4 py-3 shadow-xs">
                      <div class="flex items-center gap-3">
                        <span class="size-2 rounded-full bg-consensus"></span>
                        <span class="text-sm font-medium text-foreground">3 students confused</span>
                      </div>
                      <span class="text-xs text-consensus-strong font-medium">threshold reached</span>
                    </div>
                    <div class="my-1 text-muted-foreground/50">${Icons.arrowDown}</div>
                  </div>

                  <!-- Step 5 -->
                  <div class="flex flex-col items-center">
                    <div class="flex w-full items-center justify-between gap-3 rounded-xl border border-consensus/40 bg-consensus-soft px-4 py-3 shadow-xs">
                      <div class="flex items-center gap-3">
                        ${Icons.shieldOff}
                        <span class="text-sm font-medium text-foreground">Identity dissolves</span>
                      </div>
                      <span class="text-xs text-muted-foreground">name & roll removed</span>
                    </div>
                    <div class="my-1 text-muted-foreground/50">${Icons.arrowDown}</div>
                  </div>

                  <!-- Step 6 -->
                  <div class="flex flex-col items-center">
                    <div class="flex w-full items-center justify-between gap-3 rounded-xl border border-consensus/40 bg-consensus-soft px-4 py-3 shadow-xs">
                      <div class="flex items-center gap-3">
                        <span class="size-2 rounded-full bg-consensus"></span>
                        <span class="text-sm font-medium text-foreground">Class Consensus</span>
                      </div>
                      <span class="text-xs text-muted-foreground">professor sees the topic</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- How It Works Section -->
        <section id="how" class="border-t border-border bg-card/40 scroll-mt-16">
          <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div class="max-w-2xl">
              <p class="text-sm font-medium text-primary">How it works</p>
              <h2 class="mt-2 text-balance text-3xl font-medium tracking-tight text-foreground sm:text-4xl font-serif">
                From one quiet doubt to a class-wide signal
              </h2>
            </div>
            <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <!-- Step 1 Card -->
              <div class="flex flex-col rounded-xl border border-border bg-card p-5 shadow-xs">
                <div class="flex items-center justify-between">
                  <span class="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
                    ${Icons.hand}
                  </span>
                  <span class="font-serif text-2xl text-muted-foreground/50">01</span>
                </div>
                <h3 class="mt-4 text-pretty text-base font-medium text-foreground">Raise a doubt silently</h3>
                <p class="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
                  Type what confuses you and raise your hand without speaking up or being put on the spot.
                </p>
              </div>

              <!-- Step 2 Card -->
              <div class="flex flex-col rounded-xl border border-border bg-card p-5 shadow-xs">
                <div class="flex items-center justify-between">
                  <span class="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
                    ${Icons.users}
                  </span>
                  <span class="font-serif text-2xl text-muted-foreground/50">02</span>
                </div>
                <h3 class="mt-4 text-pretty text-base font-medium text-foreground">Others indicate "I'm confused too"</h3>
                <p class="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
                  Classmates quietly add themselves to the same doubt instead of asking it all over again.
                </p>
              </div>

              <!-- Step 3 Card -->
              <div class="flex flex-col rounded-xl border border-border bg-card p-5 shadow-xs">
                <div class="flex items-center justify-between">
                  <span class="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
                    ${Icons.shieldOff}
                  </span>
                  <span class="font-serif text-2xl text-muted-foreground/50">03</span>
                </div>
                <h3 class="mt-4 text-pretty text-base font-medium text-foreground">At 3+ students, identity dissolves</h3>
                <p class="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
                  The original asker disappears. The doubt becomes a collective, anonymous class signal.
                </p>
              </div>

              <!-- Step 4 Card -->
              <div class="flex flex-col rounded-xl border border-border bg-card p-5 shadow-xs">
                <div class="flex items-center justify-between">
                  <span class="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
                    ${Icons.eye}
                  </span>
                  <span class="font-serif text-2xl text-muted-foreground/50">04</span>
                </div>
                <h3 class="mt-4 text-pretty text-base font-medium text-foreground">The professor sees what to revisit</h3>
                <p class="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
                  The lecture view surfaces the topics the class collectively needs re-taught.
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Perspective Section -->
        <section id="students" class="scroll-mt-16">
          <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div class="max-w-2xl">
              <p class="text-sm font-medium text-primary">Built for the whole room</p>
              <h2 class="mt-2 text-balance text-3xl font-medium tracking-tight text-foreground sm:text-4xl font-serif">
                One idea, three calmer perspectives
              </h2>
            </div>
            <div class="mt-10 grid gap-5 md:grid-cols-3">
              <!-- Student card -->
              <div class="rounded-xl border border-border bg-card p-6 shadow-xs">
                <span class="flex size-10 items-center justify-center rounded-lg bg-accent text-primary">
                  ${Icons.gradCap}
                </span>
                <h3 class="mt-4 text-lg font-medium text-foreground">Students</h3>
                <p class="mt-1 text-pretty text-[0.95rem] font-medium text-foreground/90">
                  Ask without the pressure of speaking up.
                </p>
                <p class="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
                  Raise doubts silently and know you are never the only one who is confused.
                </p>
                <button type="button" onclick="navigateTo('student', 'student')" 
                  class="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                  Launch Student View &rarr;
                </button>
              </div>

              <!-- TA card -->
              <div id="tas" class="scroll-mt-20 rounded-xl border border-border bg-card p-6 shadow-xs">
                <span class="flex size-10 items-center justify-center rounded-lg bg-accent text-primary">
                  ${Icons.headset}
                </span>
                <h3 class="mt-4 text-lg font-medium text-foreground">Teaching Assistants</h3>
                <p class="mt-1 text-pretty text-[0.95rem] font-medium text-foreground/90">
                  See individual doubts and help students quickly.
                </p>
                <p class="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
                  Work a prioritized queue, answer in discussion, and resolve or escalate with one click.
                </p>
                <button type="button" onclick="navigateTo('ta', 'ta')" 
                  class="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                  Launch TA View &rarr;
                </button>
              </div>

              <!-- Professor card -->
              <div id="professors" class="scroll-mt-20 rounded-xl border border-border bg-card p-6 shadow-xs">
                <span class="flex size-10 items-center justify-center rounded-lg bg-accent text-primary">
                  ${Icons.presentation}
                </span>
                <h3 class="mt-4 text-lg font-medium text-foreground">Professors</h3>
                <p class="mt-1 text-pretty text-[0.95rem] font-medium text-foreground/90">
                  See what the class collectively doesn't understand.
                </p>
                <p class="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
                  A calm lecture view that only surfaces doubts once they matter to the whole room.
                </p>
                <button type="button" onclick="navigateTo('professor', 'professor')" 
                  class="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                  Launch Lecture View &rarr;
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- CTA Section -->
        <section class="border-t border-border">
          <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div class="flex flex-col items-center rounded-2xl border border-border bg-secondary/50 px-6 py-14 text-center">
              <span class="text-primary">${Icons.messagesSquare}</span>
              <h2 class="mt-5 max-w-2xl text-balance text-3xl font-medium tracking-tight text-foreground sm:text-4xl font-serif">
                Make confusion visible. Without making students visible.
              </h2>
              <button type="button" onclick="navigateTo('join')" 
                class="mt-7 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 shadow-sm cursor-pointer">
                ${Icons.handMetal}
                Join a Session
              </button>
            </div>
          </div>
        </section>

        <!-- Footer -->
        <footer class="border-t border-border">
          <div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <span class="font-semibold text-foreground">Consensus</span>
              <span>·</span>
              <span>Silent Hand-Raise</span>
            </div>
            <p class="text-xs text-muted-foreground">
              A classroom doubt-resolution prototype · University demo
            </p>
          </div>
        </footer>
      </div>
    `;
  }

  // 2. Join Session View
  function renderJoinView() {
    let selectedRole = "student";

    window.selectJoinRole = function (role) {
      selectedRole = role;
      const profile = DEFAULT_USERS[role];
      document.getElementById("join-name").value = profile.name;
      document.getElementById("join-email").value = profile.email;
      const rollContainer = document.getElementById("join-roll-container");
      if (role === "student") {
        rollContainer.classList.remove("hidden");
        document.getElementById("join-roll").value = profile.roll;
      } else {
        rollContainer.classList.add("hidden");
      }

      // Update button text
      const roleText = role === "student" ? "Student" : role === "ta" ? "Teaching Assistant" : "Professor";
      document.getElementById("join-submit-btn").textContent = `Join as ${roleText}`;

      // Update role buttons
      ["student", "ta", "professor"].forEach((r) => {
        const btn = document.getElementById(`role-btn-${r}`);
        if (btn) {
          if (r === role) {
            btn.className = "flex-1 rounded-lg border border-primary bg-primary/5 py-2 text-sm font-medium text-primary shadow-xs";
          } else {
            btn.className = "flex-1 rounded-lg border border-border bg-card py-2 text-sm font-medium text-muted-foreground hover:bg-secondary";
          }
        }
      });
    };

    window.handleJoinSubmit = function (e) {
      e.preventDefault();
      const name = document.getElementById("join-name").value;
      const email = document.getElementById("join-email").value;
      const roll = document.getElementById("join-roll").value;
      const course = document.getElementById("join-course").value;

      const newUser = {
        name: name.trim() || DEFAULT_USERS[selectedRole].name,
        email: email.trim() || DEFAULT_USERS[selectedRole].email,
        roll: selectedRole === "student" ? roll.trim() || "23CSE101" : "",
        courseCode: course.trim() || "CS101",
        role: selectedRole
      };

      store.setUser(newUser);
      navigateTo(selectedRole);
    };

    return `
      <div class="min-h-screen">
        <div class="border-b border-border bg-background/85 backdrop-blur-md">
          <div class="mx-auto flex h-15 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <button type="button" onclick="navigateTo('landing')" class="flex items-center gap-2.5 text-left">
              ${Icons.logo}
              <span class="block text-sm font-semibold tracking-tight text-foreground">Consensus</span>
            </button>
            <button type="button" onclick="navigateTo('landing')" 
              class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              ${Icons.arrowLeft}
              Back
            </button>
          </div>
        </div>

        <div class="mx-auto max-w-lg px-4 py-12 sm:px-6">
          <div class="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div class="text-center">
              <h1 class="text-balance text-3xl font-medium tracking-tight text-foreground font-serif">
                Join a Session
              </h1>
              <p class="mt-2 text-sm text-muted-foreground">
                Experience the classroom from any perspective.
              </p>
            </div>

            <!-- Role Selector -->
            <div class="mt-6">
              <label class="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Choose your role
              </label>
              <div class="flex gap-2">
                <button type="button" id="role-btn-student" onclick="selectJoinRole('student')" 
                  class="flex-1 rounded-lg border border-primary bg-primary/5 py-2 text-sm font-medium text-primary shadow-xs">
                  Student
                </button>
                <button type="button" id="role-btn-ta" onclick="selectJoinRole('ta')" 
                  class="flex-1 rounded-lg border border-border bg-card py-2 text-sm font-medium text-muted-foreground hover:bg-secondary">
                  TA
                </button>
                <button type="button" id="role-btn-professor" onclick="selectJoinRole('professor')" 
                  class="flex-1 rounded-lg border border-border bg-card py-2 text-sm font-medium text-muted-foreground hover:bg-secondary">
                  Professor
                </button>
              </div>
            </div>

            <form onsubmit="handleJoinSubmit(event)" class="mt-6 space-y-4">
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</label>
                <input type="text" id="join-name" required value="Rahul Verma" 
                  class="mt-1.5 block w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              <div id="join-roll-container">
                <label class="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Roll / Student ID</label>
                <input type="text" id="join-roll" value="23CSE101" 
                  class="mt-1.5 block w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
                <input type="email" id="join-email" required value="rahul.v@university.edu" 
                  class="mt-1.5 block w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Course Code</label>
                <input type="text" id="join-course" required value="CS101" 
                  class="mt-1.5 block w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              <div class="pt-2">
                <button type="submit" id="join-submit-btn" 
                  class="w-full rounded-lg bg-primary py-2.5 text-center text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer">
                  Join as Student
                </button>
              </div>
            </form>

            <div class="mt-6 border-t border-border pt-4 text-center">
              <p class="text-xs text-muted-foreground">
                Demo accounts are pre-filled. You can also edit any field.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 3. Student Workspace
  function renderStudentView() {
    const studentTabs = [
      { label: "Doubts", key: "doubts" },
      { label: "Discussion", key: "discussion" },
      { label: "My Activity", key: "activity" }
    ];

    const sessionActions = `
      <button type="button" onclick="consensusActions.setStudentTab('doubts')" 
        class="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary">
        ${Icons.inbox}
        Doubts Queue
      </button>
      <button type="button" onclick="consensusActions.setStudentTab('doubts'); document.getElementById('doubt-question-input')?.focus();" 
        class="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90">
        ${Icons.plus}
        Raise a Doubt
      </button>
    `;

    return `
      <div class="min-h-screen pb-20">
        ${renderHeader({
          subtitle: `${COURSE_INFO.code} · Student`,
          links: studentTabs,
          active: activeTab,
          onNavigateTab: "consensusActions.setStudentTab"
        })}
        ${renderSessionBar(sessionActions)}

        <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 fade-in">
          ${
            activeTab === "doubts"
              ? renderStudentDoubtsTab()
              : activeTab === "discussion"
              ? renderDiscussionTab()
              : renderStudentActivityTab()
          }
        </main>
      </div>
    `;
  }

  // Subtab: Student Doubts
  function renderStudentDoubtsTab() {
    const activeDoubts = store.doubts.filter((d) => d.status !== "resolved");

    return `
      <div class="grid gap-8 lg:grid-cols-12">
        <!-- Left: Doubts List (7 cols) -->
        <div class="space-y-4 lg:col-span-7">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-foreground">Class Doubts</h2>
              <p class="text-xs text-muted-foreground">Doubts from students currently in this lecture</p>
            </div>
            <span class="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              ${activeDoubts.length} active
            </span>
          </div>

          <div class="space-y-3">
            ${
              activeDoubts.length === 0
                ? `<div class="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
                    No active doubts right now. Raise one below!
                   </div>`
                : activeDoubts.map((doubt) => renderDoubtCard(doubt, true)).join("")
            }
          </div>
        </div>

        <!-- Right: Raise Doubt Form (5 cols) -->
        <div class="lg:col-span-5">
          <div class="sticky top-20 rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-semibold text-foreground">Raise a doubt silently</h3>
              <span class="flex items-center gap-1 text-xs text-muted-foreground">
                ${Icons.shieldOff}
                Private
              </span>
            </div>

            <form onsubmit="consensusActions.handleRaiseDoubt(event)" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Category</label>
                <select id="doubt-category-select" 
                  class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="Concept">Concept</option>
                  <option value="Coding">Coding</option>
                  <option value="Assignment">Assignment</option>
                  <option value="Lecture">Lecture</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Topic</label>
                <input type="text" id="doubt-topic-input" required placeholder="e.g. Recursion, Binary Trees, Big-O" 
                  class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">What are you confused about?</label>
                <textarea id="doubt-question-input" required rows="3" placeholder="Describe what's not clicking. At 3 confused students, your name dissolves completely..." 
                  class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"></textarea>
              </div>

              <div class="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground flex items-start gap-2">
                <span class="text-consensus mt-0.5">${Icons.shieldOff}</span>
                <span>
                  <strong>Silent & Anonymized:</strong> Your identity is only seen by TAs until 3 students agree. Once 3 students are confused, it becomes an anonymous Class Consensus.
                </span>
              </div>

              <button type="submit" 
                class="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer">
                Raise Doubt Silently
              </button>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  // Subtab: Discussion
  function renderDiscussionTab() {
    const doubt = store.getDoubt(store.activeDoubtId) || store.doubts[0];
    if (!doubt) {
      return `<div class="p-12 text-center text-muted-foreground">No doubt selected.</div>`;
    }

    const isCons = isConsensus(doubt);

    return `
      <div class="grid gap-6 lg:grid-cols-12">
        <!-- Doubt list navigation (4 cols) -->
        <div class="space-y-2 lg:col-span-4">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Select Doubt</h2>
          <div class="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            ${store.doubts
              .map(
                (d) => `
              <button type="button" onclick="consensusActions.selectDoubt('${d.id}', 'discussion')" 
                class="w-full rounded-xl border p-3 text-left transition-all ${
                  d.id === doubt.id
                    ? "border-primary/60 bg-accent shadow-xs"
                    : "border-border bg-card hover:bg-secondary"
                }">
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="rounded bg-secondary px-1.5 py-0.5 font-medium text-secondary-foreground">${escapeHTML(d.topic)}</span>
                  <span class="${isConsensus(d) ? "text-consensus font-semibold" : "text-muted-foreground"}">${d.confusionCount} confused</span>
                </div>
                <p class="text-sm font-medium text-foreground line-clamp-2">${escapeHTML(d.question)}</p>
              </button>
            `
              )
              .join("")}
          </div>
        </div>

        <!-- Discussion Thread (8 cols) -->
        <div class="rounded-xl border border-border bg-card p-5 shadow-xs lg:col-span-8 flex flex-col h-[75vh]">
          <div class="border-b border-border pb-4 mb-4">
            <div class="flex items-center gap-2 mb-1">
              <span class="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">${escapeHTML(doubt.topic)}</span>
              ${
                isCons
                  ? `<span class="inline-flex items-center gap-1 rounded-full bg-consensus-soft px-2.5 py-0.5 text-xs font-semibold text-consensus-strong">
                      ${Icons.shieldOff} Class Consensus (${doubt.confusionCount})
                     </span>`
                  : `<span class="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">${doubt.confusionCount} confused</span>`
              }
            </div>
            <h3 class="text-lg font-semibold text-foreground">${escapeHTML(doubt.question)}</h3>
            <p class="text-xs text-muted-foreground mt-1">
              ${isCons ? "Class Consensus · Identity dissolved" : `Asked by ${escapeHTML(doubt.authorName)}`} · ${formatAge(doubt.ageMinutes)}
            </p>
          </div>

          <!-- Message bubbles -->
          <div class="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
            ${
              doubt.messages.length === 0
                ? `<div class="py-12 text-center text-xs text-muted-foreground">No replies yet. Start the discussion!</div>`
                : doubt.messages
                    .map((msg) => {
                      const isSystem = msg.role === "system";
                      const isTA = msg.role === "ta";
                      const isProf = msg.role === "professor";

                      if (isSystem) {
                        return `
                        <div class="my-2 flex items-center justify-center">
                          <span class="inline-flex items-center gap-1.5 rounded-full bg-consensus-soft px-3 py-1 text-xs font-medium text-consensus-strong">
                            ${Icons.shieldOff}
                            ${escapeHTML(msg.text)}
                          </span>
                        </div>
                      `;
                      }

                      return `
                      <div class="rounded-xl p-3.5 ${
                        isProf
                          ? "border border-primary/30 bg-primary/5"
                          : isTA
                          ? "border border-border bg-accent/60"
                          : "border border-border bg-secondary/40"
                      }">
                        <div class="flex items-center justify-between text-xs mb-1">
                          <span class="font-semibold ${isProf ? "text-primary" : isTA ? "text-foreground" : "text-muted-foreground"}">
                            ${escapeHTML(msg.author)}
                            ${isTA ? `<span class="ml-1 rounded bg-secondary px-1 text-[0.65rem] font-medium">TA</span>` : ""}
                            ${isProf ? `<span class="ml-1 rounded bg-primary text-primary-foreground px-1 text-[0.65rem] font-medium">Prof</span>` : ""}
                          </span>
                          <span class="text-[0.7rem] text-muted-foreground">${formatAge(msg.ageMinutes)}</span>
                        </div>
                        <p class="text-sm text-foreground text-pretty">${escapeHTML(msg.text)}</p>
                      </div>
                    `;
                    })
                    .join("")
            }
          </div>

          <!-- Message input -->
          <form onsubmit="consensusActions.handleSendMessage(event, '${doubt.id}')" class="flex gap-2 pt-2 border-t border-border">
            <input type="text" id="chat-message-input" placeholder="Type a response or clarification..." required 
              class="flex-1 rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            <button type="submit" 
              class="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer">
              ${Icons.send}
              Reply
            </button>
          </form>
        </div>
      </div>
    `;
  }

  // Subtab: Student Activity
  function renderStudentActivityTab() {
    const user = store.currentUser;
    const askedByMe = store.doubts.filter((d) => d.authorName === (user ? user.name : "You") || d.authorRoll === (user ? user.roll : ""));
    const supportedByMe = store.doubts.filter((d) => d.supportedByMe);
    const resolvedDoubts = store.doubts.filter((d) => d.status === "resolved");

    return `
      <div class="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 class="text-xl font-semibold text-foreground">My Classroom Activity</h2>
          <p class="text-sm text-muted-foreground">Your participation this session—kept private to you.</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <div class="rounded-xl border border-border bg-card p-4 shadow-xs">
            <span class="text-xs font-medium text-muted-foreground uppercase">Doubts Asked</span>
            <p class="mt-2 text-2xl font-semibold text-foreground">${askedByMe.length}</p>
          </div>
          <div class="rounded-xl border border-border bg-card p-4 shadow-xs">
            <span class="text-xs font-medium text-muted-foreground uppercase">Doubts Supported</span>
            <p class="mt-2 text-2xl font-semibold text-foreground">${supportedByMe.length}</p>
          </div>
          <div class="rounded-xl border border-border bg-card p-4 shadow-xs">
            <span class="text-xs font-medium text-muted-foreground uppercase">Resolved in Lecture</span>
            <p class="mt-2 text-2xl font-semibold text-foreground">${resolvedDoubts.length}</p>
          </div>
        </div>

        <div class="space-y-4">
          <h3 class="text-base font-semibold text-foreground">Doubts You Supported</h3>
          <div class="space-y-3">
            ${
              supportedByMe.length === 0
                ? `<div class="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">You haven't supported any doubts yet.</div>`
                : supportedByMe.map((d) => renderDoubtCard(d, false)).join("")
            }
          </div>
        </div>
      </div>
    `;
  }

  // 4. Teaching Assistant Workspace
  function renderTAView() {
    const taTabs = [
      { label: "Dashboard", key: "dashboard" },
      { label: "Doubt Queue", key: "queue" },
      { label: "Answered", key: "answered" },
      { label: "Classes", key: "classes" },
      { label: "Discussion", key: "discussion" }
    ];

    return `
      <div class="min-h-screen pb-20">
        ${renderHeader({
          subtitle: `${COURSE_INFO.code} · Teaching Assistant`,
          links: taTabs,
          active: taActiveTab,
          onNavigateTab: "consensusActions.setTaTab"
        })}
        ${renderSessionBar()}

        <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 fade-in">
          ${
            taActiveTab === "dashboard"
              ? renderTADashboardTab()
              : taActiveTab === "queue"
              ? renderTAQueueTab()
              : taActiveTab === "answered"
              ? renderTAAnsweredTab()
              : taActiveTab === "classes"
              ? renderTAClassesTab()
              : renderDiscussionTab()
          }
        </main>
      </div>
    `;
  }

  // TA Dashboard Tab
  function renderTADashboardTab() {
    const pending = store.doubts.filter((d) => d.status !== "resolved");
    const smallGroup = pending.filter((d) => d.confusionCount >= 2 && d.confusionCount < 3);
    const consensusCount = pending.filter((d) => d.confusionCount >= 3);
    const resolvedCount = store.doubts.filter((d) => d.status === "resolved");

    const topPriority = [...pending].sort((a, b) => b.confusionCount - a.confusionCount).slice(0, 2);

    return `
      <div class="space-y-8">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-foreground font-serif">
            Which doubts need your attention?
          </h1>
          <p class="mt-1 text-sm text-muted-foreground">
            A live snapshot of the queue, ordered by how many students are stuck.
          </p>
        </div>

        <!-- Metric Cards -->
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-xl border border-border bg-card p-5 shadow-xs">
            <p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pending Doubts</p>
            <p class="mt-2 text-3xl font-semibold text-foreground">${pending.length}</p>
          </div>
          <div class="rounded-xl border border-border bg-card p-5 shadow-xs">
            <p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Small Group (2)</p>
            <p class="mt-2 text-3xl font-semibold text-approaching-strong">${smallGroup.length}</p>
          </div>
          <div class="rounded-xl border border-consensus/30 bg-consensus-soft p-5 shadow-xs">
            <p class="text-xs font-medium uppercase tracking-wider text-consensus-strong">Consensus Reached (3+)</p>
            <p class="mt-2 text-3xl font-semibold text-consensus-strong">${consensusCount.length}</p>
          </div>
          <div class="rounded-xl border border-border bg-card p-5 shadow-xs">
            <p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Resolved</p>
            <p class="mt-2 text-3xl font-semibold text-resolved-strong">${resolvedCount.length}</p>
          </div>
        </div>

        <!-- Priority Attention Queue -->
        <div class="rounded-xl border border-border bg-card p-6 shadow-xs">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-base font-semibold text-foreground">Priority Queue</h2>
              <p class="text-xs text-muted-foreground">Doubts ranked by student confusion count</p>
            </div>
            <button type="button" onclick="consensusActions.setTaTab('queue')" 
              class="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              View Full Queue &rarr;
            </button>
          </div>

          <div class="space-y-3">
            ${topPriority.map((d) => renderTADoubtRow(d)).join("")}
          </div>
        </div>
      </div>
    `;
  }

  // TA Queue Tab
  function renderTAQueueTab() {
    const sorted = [...store.doubts]
      .filter((d) => d.status !== "resolved")
      .sort((a, b) => b.confusionCount - a.confusionCount);

    return `
      <div class="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-foreground font-serif">Doubt Queue</h1>
          <p class="mt-1 text-sm text-muted-foreground">
            Ordered by priority. Student identity is visible below 5 students—hidden once consensus is reached.
          </p>
        </div>

        <div class="space-y-3">
          ${sorted.length === 0 ? `<p class="text-center py-12 text-sm text-muted-foreground">All doubts are resolved!</p>` : sorted.map((d) => renderTADoubtRow(d, true)).join("")}
        </div>
      </div>
    `;
  }

  // TA Answered Tab
  function renderTAAnsweredTab() {
    const answered = store.doubts.filter(
      (d) => d.status === "resolved" || d.status === "answered" || d.answer
    );

    return `
      <div class="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-foreground font-serif">Answered & Resolved</h1>
          <p class="mt-1 text-sm text-muted-foreground">Doubts addressed by you or the teaching team.</p>
        </div>

        <div class="space-y-3">
          ${
            answered.length === 0
              ? `<div class="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">Nothing answered yet.</div>`
              : answered
                  .map(
                    (d) => `
                <div class="rounded-xl border border-border bg-card p-5 shadow-xs">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">${escapeHTML(d.topic)}</span>
                      <span class="inline-flex items-center gap-1 rounded-full bg-resolved-soft px-2.5 py-0.5 text-xs font-semibold text-resolved-strong">
                        ${Icons.check} Resolved
                      </span>
                    </div>
                    <span class="text-xs text-muted-foreground">${formatAge(d.ageMinutes)}</span>
                  </div>
                  <h3 class="mt-2 text-sm font-medium text-foreground">${escapeHTML(d.question)}</h3>
                  ${
                    d.answer
                      ? `<div class="mt-3 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
                          <strong>Resolution / Answer:</strong> ${escapeHTML(d.answer)}
                         </div>`
                      : ""
                  }
                </div>
              `
                  )
                  .join("")
          }
        </div>
      </div>
    `;
  }

  // TA Classes Tab
  function renderTAClassesTab() {
    return `
      <div class="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-foreground font-serif">Classes & Roster</h1>
          <p class="mt-1 text-sm text-muted-foreground">Course overview and active participants for this lecture.</p>
        </div>

        <div class="rounded-xl border border-border bg-card p-6 shadow-xs">
          <div class="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 class="text-base font-semibold text-foreground">${COURSE_INFO.code} - ${COURSE_INFO.name}</h3>
              <p class="text-xs text-muted-foreground">${COURSE_INFO.lecture} · Live Session</p>
            </div>
            <span class="rounded-full bg-resolved-soft px-3 py-1 text-xs font-semibold text-resolved-strong">
              Active Lecture
            </span>
          </div>

          <div class="mt-6 grid gap-4 sm:grid-cols-3">
            <div class="rounded-lg bg-secondary/40 p-3 text-center">
              <span class="text-xs text-muted-foreground">Enrolled Students</span>
              <p class="text-xl font-bold text-foreground mt-1">45</p>
            </div>
            <div class="rounded-lg bg-secondary/40 p-3 text-center">
              <span class="text-xs text-muted-foreground">Currently Connected</span>
              <p class="text-xl font-bold text-resolved-strong mt-1">32</p>
            </div>
            <div class="rounded-lg bg-secondary/40 p-3 text-center">
              <span class="text-xs text-muted-foreground">Doubts Raised Today</span>
              <p class="text-xl font-bold text-foreground mt-1">${store.doubts.length}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Helper row for TA views
  function renderTADoubtRow(doubt, detailed = false) {
    const isCons = isConsensus(doubt);

    return `
      <div class="rounded-xl border border-border bg-card p-4 shadow-xs transition-colors hover:border-border/80">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">${escapeHTML(doubt.topic)}</span>
            <span class="rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">${escapeHTML(doubt.category)}</span>
            ${
              isCons
                ? `<span class="inline-flex items-center gap-1 rounded-full bg-consensus-soft px-2 py-0.5 text-xs font-semibold text-consensus-strong">
                    ${Icons.shieldOff} Consensus
                   </span>`
                : doubt.confusionCount >= 2
                ? `<span class="rounded-full bg-approaching-soft px-2 py-0.5 text-xs font-semibold text-approaching-strong">
                    Approaching
                   </span>`
                : ""
            }
          </div>
          <span class="text-xs text-muted-foreground">${formatAge(doubt.ageMinutes)}</span>
        </div>

        <p class="mt-2 text-sm font-medium text-foreground">${escapeHTML(doubt.question)}</p>

        <div class="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3 text-xs">
          <div class="flex items-center gap-3">
            <span class="font-semibold ${isCons ? "text-consensus" : "text-foreground"}">
              ${doubt.confusionCount} ${doubt.confusionCount === 1 ? "student" : "students"} confused
            </span>
            <span class="text-muted-foreground">·</span>
            <span class="text-muted-foreground">
              ${isCons ? "Class Consensus (Identity dissolved)" : `Asked by <strong>${escapeHTML(doubt.authorName)}</strong> (${escapeHTML(doubt.authorRoll)})`}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <button type="button" onclick="consensusActions.selectDoubt('${doubt.id}', 'discussion')" 
              class="rounded-lg border border-border bg-secondary/50 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-secondary cursor-pointer">
              Reply
            </button>
            <button type="button" onclick="consensusActions.openAnswerModal('${doubt.id}')" 
              class="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-secondary cursor-pointer">
              Quick Answer
            </button>
            <button type="button" onclick="consensusActions.openResolveModal('${doubt.id}')" 
              class="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 cursor-pointer">
              Resolve
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 5. Professor Lecture View
  function renderProfessorView() {
    const consensusDoubts = store.doubts.filter(
      (d) => d.confusionCount >= 3 && d.status !== "resolved"
    );
    const resolvedDoubts = store.doubts.filter((d) => d.status === "resolved");

    const topDoubt = consensusDoubts[0];
    const otherConsensus = consensusDoubts.slice(1);

    return `
      <div class="min-h-screen pb-20">
        <!-- Professor Header -->
        <header class="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
          <div class="mx-auto flex h-15 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div class="flex items-center gap-4">
              <button type="button" onclick="navigateTo('landing')" class="flex items-center gap-2.5 text-left">
                ${Icons.logo}
                <span class="block text-sm font-semibold tracking-tight text-foreground">Consensus</span>
              </button>
              <span class="hidden h-6 w-px bg-border sm:block"></span>
              <div class="hidden leading-tight sm:block">
                <p class="text-sm font-medium text-foreground">${COURSE_INFO.code} · ${COURSE_INFO.name}</p>
                <p class="text-xs text-muted-foreground">${COURSE_INFO.lecture} · Live Lecture View</p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <span class="inline-flex items-center gap-1.5 rounded-full bg-resolved-soft px-2.5 py-0.5 text-xs font-medium text-resolved-strong">
                <span class="size-1.5 rounded-full bg-resolved pulse-dot"></span>
                Lecture Mode Active
              </span>
              <button type="button" onclick="navigateTo('landing')" 
                class="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">
                Exit
              </button>
            </div>
          </div>
        </header>

        <main class="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-10 fade-in">
          <!-- Intro Notice -->
          <div class="text-center max-w-xl mx-auto">
            <span class="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              ${Icons.eye}
              Calm Lecture Display
            </span>
            <h1 class="mt-3 text-3xl font-serif font-medium text-foreground tracking-tight">
              Classroom Consensus Topics
            </h1>
            <p class="mt-2 text-sm text-muted-foreground">
              Only doubts reaching the 5-student consensus threshold appear here. All individual identities are dissolved.
            </p>
          </div>

          <!-- Top Priority Consensus Card -->
          ${
            topDoubt
              ? `
            <div class="rounded-2xl border-2 border-consensus/50 bg-consensus-soft/30 p-6 sm:p-8 shadow-md">
              <div class="flex items-center justify-between">
                <span class="inline-flex items-center gap-1.5 rounded-full bg-consensus-soft px-3 py-1 text-xs font-bold text-consensus-strong">
                  ${Icons.shieldOff}
                  Classroom Consensus Reached
                </span>
                <span class="text-xs font-medium text-muted-foreground">${formatAge(topDoubt.ageMinutes)}</span>
              </div>

              <div class="mt-4">
                <span class="text-sm font-semibold uppercase tracking-wider text-consensus">${escapeHTML(topDoubt.topic)}</span>
                <h2 class="mt-1 text-2xl font-serif font-medium text-foreground sm:text-3xl">
                  ${escapeHTML(topDoubt.question)}
                </h2>
              </div>

              <div class="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-consensus/20 pt-4">
                <div class="flex items-center gap-3">
                  <span class="flex size-9 items-center justify-center rounded-lg bg-consensus text-primary-foreground font-bold">
                    ${topDoubt.confusionCount}
                  </span>
                  <span class="text-sm font-medium text-foreground">
                    Students confused on this concept right now
                  </span>
                </div>

                <button type="button" onclick="consensusActions.openResolveModal('${topDoubt.id}')" 
                  class="inline-flex items-center gap-2 rounded-lg bg-consensus px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-consensus-strong transition-all cursor-pointer">
                  ${Icons.check}
                  Resolve Doubt in Lecture
                </button>
              </div>
            </div>
          `
              : `
            <div class="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <span class="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground mb-3">
                ${Icons.check}
              </span>
              <h3 class="text-base font-medium text-foreground">No High-Consensus Doubts</h3>
              <p class="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                No doubt currently exceeds the 5-student confusion threshold. Your class is following along well!
              </p>
            </div>
          `
          }

          <!-- Other Consensus Doubts -->
          ${
            otherConsensus.length > 0
              ? `
            <div class="space-y-4">
              <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Other Topics Near Threshold</h3>
              <div class="grid gap-4 sm:grid-cols-2">
                ${otherConsensus
                  .map(
                    (d) => `
                  <div class="rounded-xl border border-border bg-card p-5 shadow-xs">
                    <div class="flex items-center justify-between text-xs mb-2">
                      <span class="rounded bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">${escapeHTML(d.topic)}</span>
                      <span class="font-bold text-consensus">${d.confusionCount} confused</span>
                    </div>
                    <p class="text-sm font-medium text-foreground">${escapeHTML(d.question)}</p>
                    <button type="button" onclick="consensusActions.openResolveModal('${d.id}')" 
                      class="mt-4 w-full rounded-lg border border-border py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors">
                      Mark Addressed
                    </button>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          `
              : ""
          }

          <!-- Resolved Topics Recap -->
          <div class="rounded-xl border border-border bg-card p-6 shadow-xs">
            <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Addressed In This Lecture (${resolvedDoubts.length})
            </h3>
            ${
              resolvedDoubts.length === 0
                ? `<p class="text-xs text-muted-foreground">No doubts resolved yet.</p>`
                : `<div class="divide-y divide-border">
                    ${resolvedDoubts
                      .map(
                        (d) => `
                      <div class="py-3 flex items-start justify-between gap-4">
                        <div>
                          <div class="flex items-center gap-2 mb-1">
                            <span class="rounded bg-secondary px-2 py-0.5 text-xs font-medium">${escapeHTML(d.topic)}</span>
                            <span class="text-xs text-resolved-strong font-medium">Addressed</span>
                          </div>
                          <p class="text-sm text-foreground">${escapeHTML(d.question)}</p>
                          ${d.answer ? `<p class="text-xs text-muted-foreground mt-1 italic">"${escapeHTML(d.answer)}"</p>` : ""}
                        </div>
                        <span class="text-xs text-muted-foreground shrink-0">${d.confusionCount} students</span>
                      </div>
                    `
                      )
                      .join("")}
                   </div>`
            }
          </div>
        </main>
      </div>
    `;
  }

  // Common Doubt Card Component
  function renderDoubtCard(doubt, allowSupport = true) {
    const isCons = isConsensus(doubt);
    const state = getDoubtState(doubt.confusionCount);

    let stateBadge = "";
    if (state === "consensus") {
      stateBadge = `
        <span class="inline-flex items-center gap-1 rounded-full bg-consensus-soft px-2.5 py-0.5 text-xs font-semibold text-consensus-strong">
          ${Icons.shieldOff} Class Consensus
        </span>`;
    } else if (state === "approaching") {
      stateBadge = `
        <span class="inline-flex items-center gap-1 rounded-full bg-approaching-soft px-2.5 py-0.5 text-xs font-semibold text-approaching-strong">
          Approaching consensus
        </span>`;
    } else {
      stateBadge = `
        <span class="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          ${doubt.confusionCount} ${doubt.confusionCount === 1 ? "confused" : "confused"}
        </span>`;
    }

    return `
      <div class="rounded-xl border p-4 shadow-xs transition-all ${
        state === "consensus"
          ? "border-consensus/40 bg-consensus-soft/20"
          : state === "approaching"
          ? "border-approaching/40 bg-approaching-soft/20"
          : "border-border bg-card hover:border-border/80"
      }">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">${escapeHTML(doubt.topic)}</span>
            ${stateBadge}
          </div>
          <span class="text-xs text-muted-foreground">${formatAge(doubt.ageMinutes)}</span>
        </div>

        <p class="mt-2 text-sm font-medium text-foreground text-pretty">${escapeHTML(doubt.question)}</p>

        <div class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs">
          <div class="flex items-center gap-1.5 text-muted-foreground">
            ${
              isCons
                ? `<span class="inline-flex items-center gap-1 font-medium text-consensus">
                    ${Icons.shieldOff} Identity dissolved
                   </span>`
                : `<span>Asked by <strong>${escapeHTML(doubt.authorName)}</strong>${doubt.authorRoll ? ` · ${escapeHTML(doubt.authorRoll)}` : ""}</span>`
            }
          </div>

          <div class="flex items-center gap-2">
            <button type="button" onclick="consensusActions.selectDoubt('${doubt.id}', 'discussion')" 
              class="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-secondary transition-colors cursor-pointer">
              ${Icons.messageCircle}
              Discussion ${doubt.messages.length ? `(${doubt.messages.length})` : ""}
            </button>

            ${
              allowSupport && doubt.status !== "resolved"
                ? `
              <button type="button" onclick="consensusActions.supportDoubt('${doubt.id}')" 
                ${doubt.supportedByMe ? "disabled" : ""}
                class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  doubt.supportedByMe
                    ? "bg-secondary text-primary cursor-default"
                    : "border border-border bg-card text-foreground hover:bg-secondary"
                }">
                ${Icons.hand}
                ${doubt.supportedByMe ? "I'm confused too" : "I'm confused too"}
                <span class="ml-1 rounded-full bg-secondary/80 px-1.5 py-0.2 text-[0.65rem] font-bold">
                  ${doubt.confusionCount}
                </span>
              </button>
            `
                : ""
            }
          </div>
        </div>
      </div>
    `;
  }

  // Notifications Popover Generator
  function renderNotifications() {
    const pop = document.getElementById("notifs-popover");
    if (!pop) return;

    if (!notifsOpen) {
      pop.className = "hidden";
      pop.innerHTML = "";
      return;
    }

    const notifs = store.notifications;

    pop.className = "dropdown-menu absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-xl fade-in";
    pop.innerHTML = `
      <div class="border-b border-border px-4 py-3">
        <p class="text-sm font-semibold text-foreground">Consensus alerts</p>
        <p class="text-xs text-muted-foreground">Topics that reached the class threshold</p>
      </div>
      <div class="max-h-80 overflow-y-auto p-2">
        ${
          notifs.length === 0
            ? `<div class="py-8 text-center text-xs text-muted-foreground">No alerts yet.</div>`
            : notifs
                .map(
                  (n) => `
              <button type="button" onclick="consensusActions.selectDoubt('${n.doubtId}', 'discussion'); notifsOpen = false; renderNotifications();" 
                class="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-secondary">
                <span class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-consensus-soft text-consensus-strong">
                  ${Icons.users}
                </span>
                <span class="min-w-0">
                  <span class="block text-sm font-medium text-foreground">Consensus on ${escapeHTML(n.topic)}</span>
                  <span class="block truncate text-xs text-muted-foreground">${n.count} students confused · ${escapeHTML(n.question)}</span>
                </span>
              </button>
            `
                )
                .join("")
        }
      </div>
    `;
  }

  // User Profile Menu Generator
  function renderUserMenu() {
    const pop = document.getElementById("user-menu-popover");
    if (!pop) return;

    if (!userMenuOpen) {
      pop.className = "hidden";
      pop.innerHTML = "";
      return;
    }

    const user = store.currentUser;
    if (!user) return;

    pop.className = "dropdown-menu absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-xl fade-in p-2";
    pop.innerHTML = `
      <div class="px-3 py-2 border-b border-border/60 mb-1">
        <p class="text-xs font-semibold text-foreground">${escapeHTML(user.name)}</p>
        <p class="text-[0.7rem] text-muted-foreground">${escapeHTML(user.email)}</p>
      </div>
      <button type="button" onclick="consensusActions.leaveSession()" 
        class="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer">
        ${Icons.logOut}
        Leave Session
      </button>
    `;
  }

  // Answer Modal
  function renderAnswerModal() {
    let container = document.getElementById("answer-modal-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "answer-modal-container";
      document.body.appendChild(container);
    }

    if (!answerModalDoubtId) {
      container.innerHTML = "";
      return;
    }

    const doubt = store.getDoubt(answerModalDoubtId);
    if (!doubt) return;

    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
        <div class="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl fade-in">
          <div class="flex items-center justify-between pb-3 border-b border-border">
            <h3 class="text-base font-semibold text-foreground">Answer Doubt</h3>
            <button type="button" onclick="consensusActions.closeAnswerModal()" class="text-muted-foreground hover:text-foreground">
              ${Icons.close}
            </button>
          </div>
          <div class="mt-3">
            <span class="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">${escapeHTML(doubt.topic)}</span>
            <p class="mt-2 text-sm font-medium text-foreground">${escapeHTML(doubt.question)}</p>
          </div>
          <form onsubmit="consensusActions.submitAnswer(event)" class="mt-4 space-y-4">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Explanation / Answer</label>
              <textarea id="answer-text-input" rows="4" required placeholder="Write a clear explanation for the student and class..." 
                class="w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"></textarea>
            </div>
            <div class="flex justify-end gap-2">
              <button type="button" onclick="consensusActions.closeAnswerModal()" 
                class="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-secondary">
                Cancel
              </button>
              <button type="submit" 
                class="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                Submit Answer
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // Resolve Modal
  function renderResolveModal() {
    let container = document.getElementById("resolve-modal-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "resolve-modal-container";
      document.body.appendChild(container);
    }

    if (!resolveModalDoubtId) {
      container.innerHTML = "";
      return;
    }

    const doubt = store.getDoubt(resolveModalDoubtId);
    if (!doubt) return;

    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
        <div class="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl fade-in">
          <div class="flex items-center justify-between pb-3 border-b border-border">
            <h3 class="text-base font-semibold text-foreground">Resolve Doubt in Lecture</h3>
            <button type="button" onclick="consensusActions.closeResolveModal()" class="text-muted-foreground hover:text-foreground">
              ${Icons.close}
            </button>
          </div>
          <div class="mt-3">
            <span class="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">${escapeHTML(doubt.topic)}</span>
            <p class="mt-2 text-sm font-medium text-foreground">${escapeHTML(doubt.question)}</p>
          </div>
          <form onsubmit="consensusActions.submitResolve(event)" class="mt-4 space-y-4">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Teaching Note / Summary (Optional)</label>
              <textarea id="resolve-note-input" rows="3" placeholder="e.g. Explained via runway diagram live in class." 
                class="w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"></textarea>
            </div>
            <div class="flex justify-end gap-2">
              <button type="button" onclick="consensusActions.closeResolveModal()" 
                class="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-secondary">
                Cancel
              </button>
              <button type="submit" 
                class="rounded-lg bg-resolved px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-resolved-strong">
                Confirm Resolved
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // Floating Demo Role Switcher
  function renderRoleSwitcher() {
    let el = document.getElementById("demo-role-switcher");
    if (!el) {
      el = document.createElement("div");
      el.id = "demo-role-switcher";
      document.body.appendChild(el);
    }

    const currentView = store.currentView;

    el.className = "fixed bottom-4 left-1/2 z-40 -translate-x-1/2";
    el.innerHTML = `
      <div class="flex items-center gap-1 rounded-full border border-border bg-card/95 p-1 shadow-lg backdrop-blur-md">
        <button type="button" onclick="consensusActions.toggleSwitcher()" 
          class="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer" 
          aria-label="Toggle demo role switcher">
          ${Icons.sparkles}
          <span class="hidden sm:inline">Role:</span>
          <span class="font-semibold text-foreground capitalize">${currentView}</span>
        </button>

        ${
          switcherExpanded
            ? `
          <div class="flex items-center gap-1 border-l border-border pl-1">
            <button type="button" onclick="switchRole('student')" 
              class="rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                currentView === "student"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }">
              Student
            </button>
            <button type="button" onclick="switchRole('ta')" 
              class="rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                currentView === "ta"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }">
              TA
            </button>
            <button type="button" onclick="switchRole('professor')" 
              class="rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                currentView === "professor"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }">
              Professor
            </button>
            <button type="button" onclick="navigateTo('landing')" 
              class="rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                currentView === "landing"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }">
              Landing
            </button>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  // Core Render Trigger
  function renderApp() {
    const root = document.getElementById("app-root");
    if (!root) return;

    const view = store.currentView;

    let html = "";
    switch (view) {
      case "landing":
        html = renderLandingView();
        break;
      case "join":
        html = renderJoinView();
        break;
      case "student":
        html = renderStudentView();
        break;
      case "ta":
        html = renderTAView();
        break;
      case "professor":
        html = renderProfessorView();
        break;
      default:
        html = renderLandingView();
    }

    root.innerHTML = html;
    renderRoleSwitcher();
  }
    window.renderApp = renderApp;

  // Document Ready
  document.addEventListener("DOMContentLoaded", () => {
    initRouting();
    renderApp();
  });
})();

