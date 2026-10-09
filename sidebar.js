const LOGO_URL = "https://api.builder.io/api/v1/image/assets/TEMP/d98775bec2aab1011ba9358fd5bf1996fda7f5e1?width=268";
const DASHBOARD_ICON_URL = "https://api.builder.io/api/v1/image/assets/TEMP/2c53995339fc1ec81e6062da020aa37fae489244?width=104";

const strokeIcon = (path, width = 3.5, viewBox = "0 0 47 46") =>
  `<svg width="100%" height="100%" viewBox="${viewBox}" fill="none" stroke="#fff" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;

const fillIcon = (path, viewBox) =>
  `<svg width="100%" height="100%" viewBox="${viewBox}" fill="#fff"><path d="${path}"/></svg>`;

const ICONS = {
  home: strokeIcon("M17.625 42.1666V22.9999H29.375V42.1666M5.875 17.2499L23.5 3.83325L41.125 17.2499V38.3333C41.125 39.3499 40.7123 40.3249 39.9778 41.0438C39.2433 41.7627 38.2471 42.1666 37.2083 42.1666H9.79167C8.7529 42.1666 7.75668 41.7627 7.02216 41.0438C6.28765 40.3249 5.875 39.3499 5.875 38.3333V17.2499Z"),
  dashboard: `<img src="${DASHBOARD_ICON_URL}" alt="" />`,
  report: strokeIcon("M7.33325 30.8751C7.33325 29.8253 7.81614 28.8184 8.67568 28.0761C9.53522 27.3338 10.701 26.9167 11.9166 26.9167H36.6666M7.33325 30.8751C7.33325 31.9249 7.81614 32.9317 8.67568 33.674C9.53522 34.4164 10.701 34.8334 11.9166 34.8334H36.6666V3.16675H11.9166C10.701 3.16675 9.53522 3.58379 8.67568 4.32612C7.81614 5.06845 7.33325 6.07527 7.33325 7.12508V30.8751Z", 4, "0 0 44 38"),
  map: fillIcon("M21.5001 21.4999C22.4855 21.4999 23.3291 21.1491 24.0308 20.4473C24.7325 19.7456 25.0834 18.902 25.0834 17.9166C25.0834 16.9312 24.7325 16.0876 24.0308 15.3859C23.3291 14.6841 22.4855 14.3333 21.5001 14.3333C20.5147 14.3333 19.6711 14.6841 18.9694 15.3859C18.2676 16.0876 17.9167 16.9312 17.9167 17.9166C17.9167 18.902 18.2676 19.7456 18.9694 20.4473C19.6711 21.1491 20.5147 21.4999 21.5001 21.4999ZM21.5001 39.4166C16.6924 35.3256 13.1016 31.5258 10.7277 28.0171C8.35373 24.5084 7.16675 21.261 7.16675 18.2749C7.16675 13.7958 8.60755 10.2273 11.4891 7.56971C14.3707 4.91207 17.7077 3.58325 21.5001 3.58325C25.2924 3.58325 28.6294 4.91207 31.511 7.56971C34.3926 10.2273 35.8334 13.7958 35.8334 18.2749C35.8334 21.261 34.6464 24.5084 32.2725 28.0171C29.8985 31.5258 26.3077 35.3256 21.5001 39.4166Z", "0 0 43 43"),
  notification: fillIcon("M8.16675 34.0416V30.4583H12.2501V17.9166C12.2501 15.4381 13.1008 13.2433 14.8022 11.3322C16.5036 9.39124 18.7154 8.12214 21.4376 7.52492V6.27075C21.4376 5.52422 21.7268 4.89714 22.3053 4.3895C22.9178 3.852 23.6494 3.58325 24.5001 3.58325C25.3508 3.58325 26.0654 3.852 26.6438 4.3895C27.2563 4.89714 27.5626 5.52422 27.5626 6.27075V7.52492C30.2848 8.12214 32.4966 9.39124 34.198 11.3322C35.8994 13.2433 36.7501 15.4381 36.7501 17.9166V30.4583H40.8334V34.0416H8.16675ZM24.5001 39.4166C23.3772 39.4166 22.4074 39.0732 21.5907 38.3864C20.8081 37.6697 20.4167 36.8187 20.4167 35.8333H28.5834C28.5834 36.8187 28.1751 37.6697 27.3584 38.3864C26.5758 39.0732 25.623 39.4166 24.5001 39.4166ZM16.3334 30.4583H32.6667V17.9166C32.6667 15.9458 31.8671 14.2586 30.2678 12.8551C28.6685 11.4517 26.7459 10.7499 24.5001 10.7499C22.2542 10.7499 20.3317 11.4517 18.7324 12.8551C17.1331 14.2586 16.3334 15.9458 16.3334 17.9166V30.4583Z", "0 0 49 43"),
  settings: fillIcon("M13.875 32.0834L13.275 27.4167C12.95 27.2952 12.6438 27.1494 12.3563 26.9792C12.0688 26.8091 11.7875 26.6268 11.5125 26.4324L7.05005 28.2553L2.92505 21.3282L6.78755 18.4845C6.76255 18.3143 6.75005 18.1503 6.75005 17.9923V17.0079C6.75005 16.8499 6.76255 16.6858 6.78755 16.5157L2.92505 13.672L7.05005 6.74487L11.5125 8.56779C11.7875 8.37334 12.075 8.19105 12.375 8.02091C12.675 7.85078 12.975 7.70494 13.275 7.58341L13.875 2.91675H22.125L22.725 7.58341C23.05 7.70494 23.3563 7.85078 23.6438 8.02091C23.9313 8.19105 24.2125 8.37334 24.4875 8.56779L28.9501 6.74487L33.0751 13.672L29.2125 16.5157C29.2375 16.6858 29.25 16.8499 29.25 17.0079V17.9923C29.25 18.1503 29.225 18.3143 29.175 18.4845L33.0375 21.3282L28.9125 28.2553L24.4875 26.4324C24.2125 26.6268 23.925 26.8091 23.625 26.9792C23.325 27.1494 23.025 27.2952 22.725 27.4167L22.125 32.0834H13.875ZM18.075 22.6042C19.525 22.6042 20.7625 22.106 21.7875 21.1095C22.8125 20.1129 23.3251 18.9098 23.3251 17.5001C23.3251 16.0904 22.8125 14.8872 21.7875 13.8907C20.7625 12.8942 19.525 12.3959 18.075 12.3959C16.6 12.3959 15.3563 12.8942 14.3438 13.8907C13.3313 14.8872 12.825 16.0904 12.825 17.5001C12.825 18.9098 13.3313 20.1129 14.3438 21.1095C15.3563 22.106 16.6 22.6042 18.075 22.6042Z", "0 0 36 35"),
  profile: strokeIcon("M33.3334 35V31.6667C33.3334 29.8986 32.631 28.2029 31.3808 26.9526C30.1305 25.7024 28.4349 25 26.6667 25H13.3334C11.5653 25 9.86961 25.7024 8.61937 26.9526C7.36913 28.2029 6.66675 29.8986 6.66675 31.6667V35M26.6667 11.6667C26.6667 15.3486 23.682 18.3333 20.0001 18.3333C16.3182 18.3333 13.3334 15.3486 13.3334 11.6667C13.3334 7.98477 16.3182 5 20.0001 5C23.682 5 26.6667 7.98477 26.6667 11.6667Z", 3.5, "0 0 40 40"),
  logout: strokeIcon("M14.625 34.125H8.125C7.26305 34.125 6.4364 33.7826 5.8269 33.1731C5.21741 32.5636 4.875 31.737 4.875 30.875V8.125C4.875 7.26305 5.21741 6.4364 5.8269 5.8269C6.4364 5.21741 7.26305 4.875 8.125 4.875H14.625M26 11.375L34.125 19.5L26 27.625M34.125 19.5H14.625", 2.5, "0 0 39 39"),
};

const NAV_ITEMS = [
  { id: "home", label: "Home", href: "dashboard.html", icon: "home" },
  { id: "admin", label: "Admin Dashboard", href: "admin.html", icon: "dashboard" },
  { id: "report", label: "Report", href: "report.html", icon: "report" },
  { id: "map", label: "Map", href: "map.html", icon: "map" },
  { id: "notification", label: "Notification", href: "notifications.html", icon: "notification" },
  { id: "settings", label: "Settings", href: "settings.html", icon: "settings" },
  { id: "profile", label: "Profile", href: "profile.html", icon: "profile" },
];

function renderNavItem(item, active, unreadCount = 0) {
  const badgeCount = item.id === "notification" ? unreadCount : item.badge;
  const badge = badgeCount ? `<span class="nav-badge">${badgeCount}</span>` : "";
  return `<a class="nav-item${item.id === active ? " is-active" : ""}" href="${item.href}">
    <span class="nav-icon">${ICONS[item.icon]}</span>${item.label}${badge}
  </a>`;
}

function renderSidebar(active, expandReport = false, unreadCount = 0) {
  const items = NAV_ITEMS.map((item) => {
    const html = renderNavItem(item, expandReport && item.id === "report" ? null : active, unreadCount);
    if (item.id === "report" && expandReport) {
      return html + `<div class="nav-submenu">
        <a class="nav-subitem${active === "report" ? " is-active" : ""}" href="report.html">Report Issue</a>
        <a class="nav-subitem${active === "my-reports" ? " is-active" : ""}" href="my-reports.html">My Report</a>
      </div>`;
    }
    return html;
  }).join("");

  return `<aside class="sidebar">
    <div class="sidebar-brand">
      <img class="sidebar-logo" src="${LOGO_URL}" alt="" />
      <h1 class="sidebar-title">Waste Management Monitoring System</h1>
    </div>
    <nav class="sidebar-nav">${items}</nav>
    <a class="nav-item logout-link" href="index.html"><span class="nav-icon">${ICONS.logout}</span>Log out</a>
  </aside>`;
}

function applySavedTheme() {
  try {
    const saved = JSON.parse(localStorage.getItem("pasigPreferences.v1") || "{}");
    document.body.classList.toggle("portal-dark-mode", Boolean(saved.darkMode));
  } catch (error) {
    console.error("Could not load appearance preference from browser storage.", error);
  }
}

applySavedTheme();
window.addEventListener("storage", (event) => {
  if (event.key === "pasigPreferences.v1" || event.key === null) applySavedTheme();
});

const sidebarHost = document.querySelector("[data-sidebar]");
if (sidebarHost) {
  let unreadCount = 3;
  try {
    const notifications = JSON.parse(localStorage.getItem("pasigNotifications.v1") || "null");
    if (Array.isArray(notifications)) unreadCount = notifications.filter((item) => !item.read).length;
  } catch (error) {
    console.error("Could not load notification count from browser storage.", error);
  }
  sidebarHost.outerHTML = renderSidebar(
    sidebarHost.dataset.sidebar,
    sidebarHost.hasAttribute("data-expand-report"),
    unreadCount
  );
}
