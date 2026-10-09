(() => {
  const KEYS = {
    profile: "pasigProfile.v1",
    preferences: "pasigPreferences.v1",
    reports: "pasigReports.v1",
    notifications: "pasigNotifications.v1",
    operations: "pasigCollectionOperations.v1",
    credential: "pasigLocalCredential.v1",
    activeAccount: "pasigActiveAccount.v1",
  };
  const DEFAULT_PROFILE = {
    name: "Arishelle Fernandez",
    email: "arishellefernandez@gmail.com",
    phone: "",
    barangay: "San Antonio",
  };
  const DEFAULT_PREFERENCES = {
    reportUpdates: true,
    collectionReminders: true,
    weeklySummary: false,
    newComments: true,
    systemAnnouncements: true,
    emailNotifications: false,
    darkMode: false,
  };
  const DEFAULT_NOTIFICATIONS = [
    { id: "welcome-update", title: "Welcome to Pasig Waste Management", body: "You can submit waste concerns and follow their progress from My Reports.", type: "Service update", date: new Date().toISOString(), read: false },
    { id: "collection-schedule", title: "Collection schedules are available", body: "Check the service map for collection areas and route coverage in your barangay.", type: "Collection reminder", date: new Date().toISOString(), read: false },
    { id: "community-cleanup", title: "Help keep Pasig clean", body: "Add a photo and location when reporting a waste issue so the right team can find it.", type: "Community update", date: new Date().toISOString(), read: false },
  ];
  const MAP_AREAS = [
    { name: "San Antonio", zone: "North district", pickup: "Monday · Thursday" },
    { name: "Kapitolyo", zone: "West district", pickup: "Tuesday · Friday" },
    { name: "Pinagbuhatan", zone: "East district", pickup: "Monday · Wednesday · Saturday" },
    { name: "Rosario", zone: "North district", pickup: "Tuesday · Saturday" },
    { name: "San Joaquin", zone: "South district", pickup: "Check local collection notice" },
  ];
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const $ = (selector, root = document) => root.querySelector(selector);
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);

  function showPageError(message) {
    let banner = $("#portal-error");
    if (!banner) {
      banner = document.createElement("p");
      banner.id = "portal-error";
      banner.className = "portal-error";
      const main = $("main");
      if (main) main.prepend(banner);
    }
    banner.textContent = message;
  }

  function readJson(key, fallback, validate) {
    try {
      const saved = localStorage.getItem(key);
      if (saved === null) return fallback;
      const parsed = JSON.parse(saved);
      if (validate && !validate(parsed)) throw new Error("Saved data has an unexpected format.");
      return parsed;
    } catch (error) {
      showPageError(`Unable to read saved app data: ${error.message}`);
      return fallback;
    }
  }

  function saveJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      showPageError(`Your changes could not be saved in this browser: ${error.message}`);
      return false;
    }
  }

  function syncAccountProfile(savedProfile) {
    try {
      const stored = localStorage.getItem(KEYS.credential);
      if (stored === null) return;
      const database = JSON.parse(stored);
      if (!database || database.version !== 2 || !Array.isArray(database.accounts)) {
        throw new Error("Saved local account data has an unexpected format.");
      }
      const activeEmail = localStorage.getItem(KEYS.activeAccount) || database.activeEmail;
      const account = database.accounts.find((item) => item.email === activeEmail);
      if (!account) return;
      account.profile = { ...savedProfile, email: account.email };
      localStorage.setItem(KEYS.credential, JSON.stringify(database));
    } catch (error) {
      showPageError(`Profile was saved, but could not be synced with this local account: ${error.message}`);
    }
  }

  function profile() {
    const saved = readJson(KEYS.profile, {}, (value) => value && typeof value === "object" && !Array.isArray(value));
    if (saved.email === "arishelle.fernandez@example.com") saved.email = DEFAULT_PROFILE.email;
    return { ...DEFAULT_PROFILE, ...saved };
  }

  function preferences() {
    return { ...DEFAULT_PREFERENCES, ...readJson(KEYS.preferences, {}, (value) => value && typeof value === "object" && !Array.isArray(value)) };
  }

  function reports() {
    return readJson(KEYS.reports, [], Array.isArray);
  }

  function notifications() {
    return readJson(KEYS.notifications, DEFAULT_NOTIFICATIONS, Array.isArray);
  }

  function updateNotifications(next) {
    if (!saveJson(KEYS.notifications, next)) return false;
    const badge = $(".nav-item[href='notifications.html'] .nav-badge");
    const unread = next.filter((item) => !item.read).length;
    const navLink = $(".nav-item[href='notifications.html']");
    if (unread && navLink && !badge) {
      const span = document.createElement("span");
      span.className = "nav-badge";
      span.textContent = unread;
      navLink.append(span);
    } else if (badge && unread) badge.textContent = unread;
    else if (badge) badge.remove();
    return true;
  }

  function setMessage(element, message, isError = false) {
    element.textContent = message;
    element.hidden = !message;
    element.classList.toggle("is-error", isError);
  }

  function initials(name) {
    return String(name || "").trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("") || "U";
  }

  function applyDarkMode(enabled) {
    document.body.classList.toggle("portal-dark-mode", Boolean(enabled));
  }

  function renderResidentProfile() {
    const saved = profile();
    const photoUrl = saved.photo || "";
    const overviewName = $("#profile-overview-name");
    const overviewEmail = $("#profile-overview-email");
    const overviewPhoto = $("#profile-overview-photo");
    const overviewInitials = $("#profile-overview-initials");
    if (overviewName) overviewName.textContent = saved.name;
    if (overviewEmail) overviewEmail.textContent = saved.email || DEFAULT_PROFILE.email;
    if (overviewPhoto && overviewInitials) {
      if (photoUrl) {
        overviewPhoto.src = photoUrl;
        overviewPhoto.hidden = false;
        overviewInitials.hidden = true;
      } else {
        overviewPhoto.removeAttribute("src");
        overviewPhoto.hidden = true;
        overviewInitials.textContent = initials(saved.name);
        overviewInitials.hidden = false;
      }
    }
    const topbar = $(".topbar-user");
    if (topbar) {
      const name = $(".user-name", topbar);
      const avatar = $(".user-avatar", topbar);
      if (name) name.textContent = saved.name;
      if (avatar) {
        avatar.alt = saved.name;
        if (photoUrl) avatar.src = photoUrl;
      }
    }
    const welcome = $(".welcome-title");
    if (welcome) welcome.textContent = `Good Morning, ${saved.name}!`;

    const reportAvatar = $(".report-header .user-avatar");
    if (reportAvatar) {
      reportAvatar.alt = saved.name;
      if (photoUrl) reportAvatar.src = photoUrl;
    }

    const notificationName = $("#notification-profile-name");
    if (notificationName) notificationName.textContent = saved.name;
    const notificationInitials = $("#notification-profile-initials");
    const notificationPhoto = $("#notification-profile-photo");
    if (notificationInitials) notificationInitials.textContent = initials(saved.name);
    if (notificationPhoto) {
      if (photoUrl) {
        notificationPhoto.src = photoUrl;
        notificationPhoto.hidden = false;
        notificationInitials.hidden = true;
      } else {
        notificationPhoto.removeAttribute("src");
        notificationPhoto.hidden = true;
        if (notificationInitials) notificationInitials.hidden = false;
      }
    }
  }

  function initProfile() {
    const form = $("#profile-form");
    if (!form) return;
    const current = profile();
    form.elements.name.value = current.name || "";
    form.elements.phone.value = current.phone || "";
    form.elements.address.value = current.address || current.barangay || "";
    let selectedPhoto = current.photo || "";
    const render = () => {
      const saved = profile();
      const avatar = $("#profile-avatar");
      const photo = $("#profile-photo-preview");
      avatar.textContent = initials(saved.name);
      if (saved.photo) {
        photo.src = saved.photo;
        photo.hidden = false;
        avatar.hidden = true;
      } else {
        photo.removeAttribute("src");
        photo.hidden = true;
        avatar.hidden = false;
      }
    };
    render();
    $("#profile-photo").addEventListener("change", (event) => {
      const file = event.currentTarget.files[0];
      if (!file) return;
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setMessage($("#profile-message"), "Choose a JPG, PNG, or WebP image.", true);
        event.currentTarget.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setMessage($("#profile-message"), "Photo must be 5 MB or smaller.", true);
        event.currentTarget.value = "";
        return;
      }
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        const image = new Image();
        image.addEventListener("load", () => {
          const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          const context = canvas.getContext("2d");
          if (!context) {
            setMessage($("#profile-message"), "This browser could not prepare the selected photo.", true);
            return;
          }
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          selectedPhoto = canvas.toDataURL("image/jpeg", 0.78);
          $("#profile-photo-preview").src = selectedPhoto;
          $("#profile-photo-preview").hidden = false;
          $("#profile-avatar").hidden = true;
          setMessage($("#profile-message"), "Photo ready. Save changes to keep it.");
        });
        image.addEventListener("error", () => setMessage($("#profile-message"), "The selected image could not be opened.", true));
        image.src = String(reader.result);
      });
      reader.addEventListener("error", () => setMessage($("#profile-message"), "The selected photo could not be read.", true));
      reader.readAsDataURL(file);
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const previous = profile();
      const values = {
        ...previous,
        name: form.elements.name.value.trim(),
        phone: form.elements.phone.value.trim(),
        address: form.elements.address.value.trim(),
        barangay: form.elements.address.value.trim(),
        photo: selectedPhoto,
      };
      if (values.name.length < 2) {
        form.elements.name.setCustomValidity("Enter your name.");
        form.reportValidity();
        form.elements.name.setCustomValidity("");
        return;
      }
      if (saveJson(KEYS.profile, values)) {
        syncAccountProfile(values);
        render();
        renderResidentProfile();
        setMessage($("#profile-message"), "Profile saved.");
      }
    });
  }

  function initSettings() {
    const form = $("#settings-form");
    if (form) {
      const saved = preferences();
      Object.keys(DEFAULT_PREFERENCES).forEach((key) => {
        const control = form.elements.namedItem(key);
        if (control && control.type === "checkbox") control.checked = Boolean(saved[key]);
      });
      const darkModeControl = form.elements.namedItem("darkMode");
      if (darkModeControl) {
        darkModeControl.addEventListener("change", () => {
          const next = { ...preferences(), darkMode: darkModeControl.checked };
          if (saveJson(KEYS.preferences, next)) {
            applyDarkMode(next.darkMode);
            setMessage($("#settings-message"), `Dark mode ${next.darkMode ? "enabled" : "disabled"}.`);
          } else {
            darkModeControl.checked = !darkModeControl.checked;
          }
        });
      }
      Object.keys(DEFAULT_PREFERENCES).forEach((key) => {
        const control = form.elements.namedItem(key);
        if (!control || control.type !== "checkbox" || control === darkModeControl) return;
        control.addEventListener("change", () => {
          const next = { ...preferences(), [key]: control.checked };
          if (saveJson(KEYS.preferences, next)) {
            setMessage($("#settings-message"), "Notification preferences saved.");
          } else {
            control.checked = !control.checked;
          }
        });
      });
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const next = { ...preferences() };
        Object.keys(DEFAULT_PREFERENCES).forEach((key) => {
          const control = form.elements.namedItem(key);
          if (control && control.type === "checkbox") next[key] = control.checked;
        });
        if (saveJson(KEYS.preferences, next)) {
          applyDarkMode(next.darkMode);
          setMessage($("#settings-message"), "Settings saved.");
        }
      });
    }

    const clearButton = $("#clear-local-data");
    if (!clearButton) return;
    clearButton.addEventListener("click", () => {
      if (!window.confirm("Clear local accounts and passwords, profile data, reports, notifications, settings, and collection operation data saved in this browser? This cannot be undone.")) return;
      try {
        Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
        window.location.href = "settings.html?data-cleared=1";
      } catch (error) {
        setMessage($("#clear-data-message"), `Saved app data could not be cleared: ${error.message}`, true);
      }
    });
    if (new URLSearchParams(window.location.search).has("data-cleared")) {
      setMessage($("#clear-data-message"), "Saved app data has been cleared.");
    }
  }

  function formatDate(value, withTime = false) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return date.toLocaleString(undefined, withTime
      ? { dateStyle: "medium", timeStyle: "short" }
      : { dateStyle: "medium" });
  }

  function initHome() {
    const list = $("#home-recent-reports");
    if (!list) return;
    const savedReports = reports();
    if (!savedReports.length) return;
    const sampleRows = [...list.querySelectorAll(".report-item")];
    const recent = savedReports
      .slice()
      .sort((a, b) => new Date(b.submittedAt || b.date).getTime() - new Date(a.submittedAt || a.date).getTime())
      .slice(0, 4);
    const userRows = recent.map((item) => {
      const status = item.status === "Submitted" ? "Pending" : item.status || "Pending";
      const statusClass = status.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const thumbnail = item.photoDataUrl
        ? `<img class="report-thumb" src="${escapeHtml(item.photoDataUrl)}" alt="Uploaded photo for ${escapeHtml(item.category || "waste report")}" />`
        : `<span class="report-thumb report-thumb-user" aria-hidden="true">♻</span>`;
      return `<article class="report-item" data-user-report="${escapeHtml(item.id)}">
        ${thumbnail}
        <div class="report-info"><h4 class="report-name">${escapeHtml(item.category || "Waste report")}</h4><p class="report-meta">Brgy. ${escapeHtml(item.location || "Location unavailable")} · ${escapeHtml(formatDate(`${item.date}T12:00:00`))}</p></div>
        <span class="status-badge status-${statusClass}">${escapeHtml(status)}</span>
      </article>`;
    });
    const remainingSamples = sampleRows.slice(0, Math.max(0, 4 - userRows.length)).map((item) => item.outerHTML);
    list.innerHTML = [...userRows, ...remainingSamples].join("");
  }

  function initNotifications() {
    const list = $("#notification-list");
    if (!list) return;
    let all = notifications();
    if (localStorage.getItem(KEYS.notifications) === null) updateNotifications(all);
    const filter = $("#notification-filter");
    let activeCategory = "all";
    renderResidentProfile();
    const categoryOf = (item) => {
      const type = String(item.type || "").toLowerCase();
      if (type.includes("announcement")) return "Announcements";
      if (type.includes("system") || type.includes("collection")) return "System";
      return "Updates";
    };

    const render = () => {
      all = notifications();
      const categories = ["Updates", "Announcements", "System"];
      $("#notification-count-all").textContent = all.length;
      categories.forEach((category) => {
        $(`#notification-count-${category.toLowerCase()}`).textContent = all.filter((item) => categoryOf(item) === category).length;
      });
      const items = activeCategory === "all" ? all : all.filter((item) => categoryOf(item) === activeCategory);
      if (!items.length) {
        list.innerHTML = `<div class="portal-empty"><span class="portal-empty-icon">✓</span><strong>No ${activeCategory === "all" ? "" : `${escapeHtml(activeCategory.toLowerCase())} `}notifications yet</strong><span>New updates about your reports and collection services will appear here.</span></div>`;
        return;
      }
      const groups = activeCategory === "all" ? categories : [activeCategory];
      list.innerHTML = groups.map((category) => {
        const grouped = items.filter((item) => categoryOf(item) === category);
        if (!grouped.length) return "";
        return `<section class="notification-group notification-group-${category.toLowerCase()}"><h2><span>${category === "Updates" ? "↻" : category === "Announcements" ? "◈" : "⚙"}</span>${category}<small>${grouped.length} notification${grouped.length === 1 ? "" : "s"}</small></h2><div class="notification-group-items">${grouped.map((item) => `<article class="notification-item${item.read ? "" : " is-unread"}" data-notification-id="${escapeHtml(item.id)}">
          <span class="notification-icon" aria-hidden="true">${item.type === "Collection reminder" ? "◷" : item.type === "Report update" ? "✓" : "i"}</span>
          <div class="notification-content"><div class="notification-meta"><span>${escapeHtml(item.type || category)}</span><time>${escapeHtml(formatDate(item.date, true))}</time></div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p></div>
          <div class="notification-actions">${item.read ? "" : `<button class="portal-text-button" type="button" data-notification-action="read" data-id="${escapeHtml(item.id)}">Mark read</button>`}<button class="portal-text-button notification-dismiss" type="button" data-notification-action="dismiss" data-id="${escapeHtml(item.id)}">Dismiss</button></div>
        </article>`).join("")}</div></section>`;
      }).join("");
    };

    filter.addEventListener("click", (event) => {
      const tab = event.target.closest("[data-category]");
      if (!tab) return;
      activeCategory = tab.dataset.category;
      filter.querySelectorAll("[data-category]").forEach((button) => {
        const active = button === tab;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-selected", String(active));
      });
      render();
    });
    $("#mark-all-read").addEventListener("click", () => {
      const next = all.map((item) => ({ ...item, read: true }));
      if (updateNotifications(next)) {
        all = next;
        setMessage($("#notification-message"), "All notifications marked as read.");
        render();
      }
    });
    list.addEventListener("click", (event) => {
      const button = event.target.closest("[data-notification-action]");
      if (!button) return;
      const id = button.dataset.id;
      const next = button.dataset.notificationAction === "read"
        ? all.map((item) => item.id === id ? { ...item, read: true } : item)
        : all.filter((item) => item.id !== id);
      if (updateNotifications(next)) {
        all = next;
        render();
      }
    });
    render();
  }

  function initMyReports() {
    const list = $("#my-report-list");
    if (!list) return;
    const filter = $("#my-report-filter");
    let activeStatus = "all";
    let all = reports();
    const render = () => {
      all = reports();
      const displayStatus = (item) => item.status === "Submitted" ? "Pending" : item.status;
      $("#count-all").textContent = all.length;
      filter.querySelectorAll("[data-status]").forEach((button) => {
        if (button.dataset.status !== "all") {
          button.textContent = button.dataset.status;
          const count = all.filter((item) => displayStatus(item) === button.dataset.status).length;
          button.insertAdjacentHTML("beforeend", `<span class="my-report-tab-count">${count}</span>`);
        }
      });
      const matching = all.filter((item) => activeStatus === "all" || displayStatus(item) === activeStatus);
      $("#my-report-count").textContent = `${matching.length} report${matching.length === 1 ? "" : "s"}`;
      if (!matching.length) {
        list.innerHTML = `<div class="portal-empty"><span class="portal-empty-icon">♻</span><strong>${all.length ? "No reports in this status" : "You haven't submitted a report yet"}</strong><span>${all.length ? "Choose another status filter to see your reports." : "When you report a local waste issue, it will appear here."}</span>${all.length ? "" : `<a class="portal-primary-link" href="report.html">Submit your first report</a>`}</div>`;
        return;
      }
      list.innerHTML = matching.map((item) => {
        const status = displayStatus(item);
        const thumbnail = item.photoDataUrl
          ? `<img class="my-report-symbol my-report-photo" src="${escapeHtml(item.photoDataUrl)}" alt="Uploaded photo for ${escapeHtml(item.category)}" />`
          : `<div class="my-report-symbol" aria-hidden="true">♻</div>`;
        return `<article class="my-report-item" data-report-id="${escapeHtml(item.id)}">
        ${thumbnail}
        <div class="my-report-info"><h3>${escapeHtml(item.category)}</h3><div class="my-report-meta"><span>Brgy. ${escapeHtml(item.location)}</span><time>${escapeHtml(formatDate(`${item.date}T12:00:00`))}</time></div></div>
        <div class="my-report-actions"><span class="portal-status portal-status-${String(status).toLowerCase().replace(/[^a-z0-9]+/g, "-")}">${escapeHtml(status)}</span><button class="portal-text-button" type="button" data-report-action="details" data-id="${escapeHtml(item.id)}">View details</button></div>
      </article>`;
      }).join("");
    };
    filter.addEventListener("click", (event) => {
      const tab = event.target.closest("[data-status]");
      if (!tab) return;
      activeStatus = tab.dataset.status;
      filter.querySelectorAll("[data-status]").forEach((button) => {
        const active = button === tab;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-selected", String(active));
      });
      render();
    });
    list.addEventListener("click", (event) => {
      const button = event.target.closest("[data-report-action='details']");
      if (!button) return;
      const item = all.find((report) => report.id === button.dataset.id);
      if (!item) return;
      $("#report-detail-title").textContent = item.category;
      const status = item.status === "Submitted" ? "Pending" : item.status;
      const photo = item.photoDataUrl ? `<img class="report-detail-photo" src="${escapeHtml(item.photoDataUrl)}" alt="Uploaded photo for ${escapeHtml(item.category)}" />` : "";
      $("#report-detail-body").innerHTML = `${photo}<dl class="report-detail-list"><div><dt>Location</dt><dd>${escapeHtml(item.location)}</dd></div><div><dt>Date reported</dt><dd>${escapeHtml(formatDate(`${item.date}T12:00:00`))}</dd></div><div><dt>Status</dt><dd>${escapeHtml(status)}</dd></div><div><dt>Photo</dt><dd>${escapeHtml(item.photoName || "No photo attached")}</dd></div><div class="report-detail-description"><dt>Description</dt><dd>${escapeHtml(item.description)}</dd></div></dl>`;
      $("#report-detail-dialog").showModal();
    });
    $("#close-report-detail").addEventListener("click", () => $("#report-detail-dialog").close());
    $("#report-detail-dialog").addEventListener("click", (event) => {
      if (event.target === $("#report-detail-dialog")) $("#report-detail-dialog").close();
    });
    render();
  }

  function operationsData() {
    const saved = readJson(KEYS.operations, {}, (value) => value && typeof value === "object" && !Array.isArray(value));
    return {
      areas: Array.isArray(saved.areas) ? saved.areas : [],
      routes: Array.isArray(saved.routes) ? saved.routes : [],
      reports: reports(),
    };
  }

  function initMap() {
    const areaList = $("#map-area-list");
    if (!areaList) return;
    const layer = $("#map-layer");
    const areaFilter = $("#map-area-filter");
    const markers = [...document.querySelectorAll("[data-map-area]")];

    const render = () => {
      const data = operationsData();
      const areasMode = layer.value !== "reports";
      const reportsMode = layer.value !== "areas";
      const selected = areaFilter.value;
      markers.forEach((marker) => {
        const area = marker.dataset.mapArea;
        const visible = (selected === "all" || selected === area) && (areasMode || data.reports.some((report) => report.location.includes(area)));
        marker.hidden = !visible;
        marker.classList.toggle("is-selected", selected === area);
        marker.classList.toggle("map-marker-reporting", reportsMode && data.reports.some((report) => report.location.includes(area)));
      });
      const areas = MAP_AREAS.filter((area) => selected === "all" || area.name === selected);
      $("#map-list-title").textContent = layer.value === "reports" ? "Community reports" : "Collection areas";
      $("#map-list-count").textContent = `${areas.length} area${areas.length === 1 ? "" : "s"} shown`;
      areaList.innerHTML = areas.map((area) => {
        const issueReports = reportsMode ? data.reports.filter((report) => report.location.includes(area.name)) : [];
        const routes = data.routes.filter((route) => {
          const linkedArea = data.areas.find((entry) => entry.id === route.areaId);
          return linkedArea ? linkedArea.name.toLowerCase() === area.name.toLowerCase() : false;
        });
        return `<button class="map-area-row${selected === area.name ? " is-selected" : ""}" data-area-select="${escapeHtml(area.name)}" type="button">
          <span class="map-area-number">${MAP_AREAS.indexOf(area) + 1}</span>
          <span class="map-area-copy"><strong>${escapeHtml(area.name)}</strong><small>${escapeHtml(area.zone)} · Pickup ${escapeHtml(area.pickup)}</small><small>${routes.length ? `${routes.length} mapped route${routes.length === 1 ? "" : "s"}` : "Service details not available"}</small></span>
          ${reportsMode ? `<span class="map-report-count">${issueReports.length}<small>report${issueReports.length === 1 ? "" : "s"}</small></span>` : ""}
        </button>`;
      }).join("");
      if (!areas.length) areaList.innerHTML = `<div class="portal-empty"><strong>No matching areas</strong><span>Adjust the area filter.</span></div>`;
    };

    layer.addEventListener("change", render);
    areaFilter.addEventListener("change", render);
    areaList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-area-select]");
      if (!button) return;
      areaFilter.value = button.dataset.areaSelect;
      render();
      $(".map-visual-card").scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    markers.forEach((marker) => marker.addEventListener("click", () => {
      areaFilter.value = marker.dataset.mapArea;
      render();
    }));
    render();
  }

  initProfile();
  renderResidentProfile();
  window.addEventListener("storage", (event) => {
    if (event.key === KEYS.profile || event.key === null) renderResidentProfile();
    if (event.key === KEYS.preferences || event.key === null) {
      const saved = preferences();
      applyDarkMode(saved.darkMode);
      const form = $("#settings-form");
      const control = form && form.elements.namedItem("darkMode");
      if (control) control.checked = Boolean(saved.darkMode);
    }
  });
  applyDarkMode(preferences().darkMode);
  initSettings();
  initNotifications();
  initMyReports();
  initMap();
  initHome();
})();
