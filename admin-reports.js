(() => {
  const REPORTS_KEY = "pasigReports.v1";
  const tableBody = document.querySelector(".records-table tbody");
  const errorMessage = document.querySelector("#admin-report-error");
  const photoDialog = document.querySelector("#admin-report-photo-dialog");
  const fullPhoto = document.querySelector("#admin-report-photo-full");
  if (!tableBody || !errorMessage || !photoDialog || !fullPhoto) return;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);

  function loadReports() {
    const raw = localStorage.getItem(REPORTS_KEY);
    if (raw === null) return [];
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved)) throw new Error("Saved report data has an unexpected format.");
    return saved;
  }

  function render() {
    tableBody.querySelectorAll("[data-community-report]").forEach((row) => row.remove());
    errorMessage.hidden = true;
    try {
      const reports = loadReports()
        .filter((report) => report && typeof report === "object")
        .sort((left, right) =>
          new Date(right.submittedAt || right.date).getTime()
          - new Date(left.submittedAt || left.date).getTime());
      const rows = reports.map((report, index) => {
        const id = String(report.id || `community-report-${index}`);
        const category = String(report.category || "Waste report");
        const status = report.status === "Submitted" ? "Pending" : String(report.status || "Pending");
        const statusClass = status.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const reportedAt = new Date(report.submittedAt || `${report.date || ""}T12:00:00`);
        const dateLabel = Number.isNaN(reportedAt.getTime())
          ? "Date unavailable"
          : reportedAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
        const photo = typeof report.photoDataUrl === "string" && report.photoDataUrl.startsWith("data:image/")
          ? `<button class="admin-report-photo-button" type="button" data-admin-report-photo="${escapeHtml(id)}" aria-label="View photo for ${escapeHtml(category)}"><img class="admin-report-thumbnail" src="${escapeHtml(report.photoDataUrl)}" alt="Uploaded photo for ${escapeHtml(category)}" /></button>`
          : "—";
        return `<tr data-community-report="${escapeHtml(id)}">
          <td>${index + 1}</td>
          <td>${escapeHtml(report.title || category)}</td>
          <td>Brgy. ${escapeHtml(report.location || "Location unavailable")}</td>
          <td>${escapeHtml(category)}</td>
          <td><span class="table-badge table-badge-${escapeHtml(statusClass)}">${escapeHtml(status)}</span></td>
          <td>${escapeHtml(dateLabel)}</td>
          <td>Unassigned</td>
          <td>${photo}</td>
        </tr>`;
      });
      tableBody.insertAdjacentHTML("afterbegin", rows.join(""));
    } catch (error) {
      errorMessage.textContent = `Submitted reports could not be loaded: ${error.message}`;
      errorMessage.hidden = false;
    }
  }

  tableBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-admin-report-photo]");
    if (!button) return;
    try {
      const report = loadReports().find((item) => item.id === button.dataset.adminReportPhoto);
      if (!report || typeof report.photoDataUrl !== "string" || !report.photoDataUrl.startsWith("data:image/")) {
        throw new Error("This report photo is no longer available.");
      }
      fullPhoto.src = report.photoDataUrl;
      fullPhoto.alt = `Uploaded photo for ${report.category || "waste report"}`;
      photoDialog.showModal();
    } catch (error) {
      errorMessage.textContent = `Report photo could not be opened: ${error.message}`;
      errorMessage.hidden = false;
    }
  });

  photoDialog.addEventListener("close", () => fullPhoto.removeAttribute("src"));
  window.addEventListener("storage", (event) => {
    if (event.key === REPORTS_KEY || event.key === null) render();
  });
  render();
})();
