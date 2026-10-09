(() => {
  const STORAGE_KEY = "pasigCollectionOperations.v1";
  const today = new Date().toISOString().slice(0, 10);
  const areas = [
    { id: "area-san-antonio", name: "San Antonio", barangay: "San Antonio", zone: "North", pickupDays: "Mon, Thu" },
    { id: "area-kapitolyo", name: "Kapitolyo", barangay: "Kapitolyo", zone: "West", pickupDays: "Tue, Fri" },
    { id: "area-pinagbuhatan", name: "Pinagbuhatan", barangay: "Pinagbuhatan", zone: "East", pickupDays: "Mon, Wed, Sat" },
    { id: "area-rosario", name: "Rosario", barangay: "Rosario", zone: "North", pickupDays: "Tue, Sat" },
  ];

  const initialData = {
    trucks: [
      { id: "truck-101", unit: "Truck 101", plate: "NAX 2481", capacityTons: 10, status: "Available", lastService: today },
      { id: "truck-102", unit: "Truck 102", plate: "NAY 5162", capacityTons: 8, status: "On Route", lastService: today },
      { id: "truck-103", unit: "Truck 103", plate: "NBB 7034", capacityTons: 12, status: "Maintenance", lastService: today },
    ],
    drivers: [
      { id: "driver-1", name: "Ramon Dela Cruz", phone: "0917 555 0101", license: "N01-23-456789", status: "On Route" },
      { id: "driver-2", name: "Juan Santos", phone: "0917 555 0102", license: "N01-23-456790", status: "Available" },
      { id: "driver-3", name: "Kara David", phone: "0917 555 0103", license: "N01-23-456791", status: "Available" },
    ],
    areas,
    routes: [
      { id: "route-north", name: "North Loop", areaId: "area-san-antonio", distanceKm: 12.4, stops: 18, status: "Active" },
      { id: "route-east", name: "East Riverside", areaId: "area-pinagbuhatan", distanceKm: 16.8, stops: 24, status: "Active" },
      { id: "route-west", name: "West District", areaId: "area-kapitolyo", distanceKm: 9.2, stops: 15, status: "Active" },
    ],
    schedules: [
      { id: "schedule-1", date: today, time: "06:00", routeId: "route-north", truckId: "truck-102", driverId: "driver-1", status: "In Progress" },
      { id: "schedule-2", date: today, time: "08:30", routeId: "route-east", truckId: "truck-101", driverId: "driver-2", status: "Scheduled" },
    ],
    records: [
      { id: "record-1", date: today, routeId: "route-north", areaId: "area-san-antonio", truckId: "truck-102", driverId: "driver-1", wasteKg: 860, status: "Completed" },
      { id: "record-2", date: today, routeId: "route-east", areaId: "area-pinagbuhatan", truckId: "truck-101", driverId: "driver-2", wasteKg: 540, status: "In Progress" },
      { id: "record-3", date: today, routeId: "route-west", areaId: "area-kapitolyo", truckId: "truck-103", driverId: "driver-3", wasteKg: 0, status: "Missed" },
    ],
  };

  const entities = {
    trucks: {
      title: "Garbage Trucks",
      description: "Manage truck details, availability, and maintenance status.",
      singular: "truck",
      statusValues: ["Available", "On Route", "Maintenance"],
      fields: [
        { key: "unit", label: "Unit name", required: true },
        { key: "plate", label: "Plate number", required: true },
        { key: "capacityTons", label: "Capacity (tons)", type: "number", min: 1, step: 0.5, required: true },
        { key: "status", label: "Truck status", type: "select", values: ["Available", "On Route", "Maintenance"], required: true },
        { key: "lastService", label: "Last service date", type: "date", required: true },
      ],
      columns: [["unit", "Truck"], ["plate", "Plate"], ["capacityTons", "Capacity (tons)"], ["status", "Status"], ["lastService", "Last service"]],
    },
    drivers: {
      title: "Drivers",
      description: "Maintain driver contact and license information, and track availability.",
      singular: "driver",
      statusValues: ["Available", "On Route", "Off Duty"],
      fields: [
        { key: "name", label: "Full name", required: true },
        { key: "phone", label: "Phone number", type: "tel", required: true },
        { key: "license", label: "Driver license number", required: true },
        { key: "status", label: "Driver status", type: "select", values: ["Available", "On Route", "Off Duty"], required: true },
      ],
      columns: [["name", "Driver"], ["phone", "Phone"], ["license", "License"], ["status", "Status"]],
    },
    areas: {
      title: "Collection Areas",
      description: "Organize barangays into service zones and pickup days.",
      singular: "collection area",
      fields: [
        { key: "name", label: "Area name", required: true },
        { key: "barangay", label: "Barangay", required: true },
        { key: "zone", label: "Zone", required: true },
        { key: "pickupDays", label: "Pickup days", placeholder: "e.g. Mon, Thu", required: true },
      ],
      columns: [["name", "Area"], ["barangay", "Barangay"], ["zone", "Zone"], ["pickupDays", "Pickup days"]],
    },
    routes: {
      title: "Routes",
      description: "Create collection routes and assign them to collection areas.",
      singular: "route",
      statusValues: ["Active", "Inactive"],
      fields: [
        { key: "name", label: "Route name", required: true },
        { key: "areaId", label: "Collection area", type: "reference", entity: "areas", required: true },
        { key: "distanceKm", label: "Distance (km)", type: "number", min: 0.1, step: 0.1, required: true },
        { key: "stops", label: "Number of stops", type: "number", min: 1, step: 1, required: true },
        { key: "status", label: "Route status", type: "select", values: ["Active", "Inactive"], required: true },
      ],
      columns: [["name", "Route"], ["areaId", "Collection area"], ["distanceKm", "Distance (km)"], ["stops", "Stops"], ["status", "Status"]],
    },
    schedules: {
      title: "Collection Schedules",
      description: "Schedule routes, trucks, and drivers for upcoming collections.",
      singular: "schedule",
      statusValues: ["Scheduled", "In Progress", "Completed", "Cancelled"],
      fields: [
        { key: "date", label: "Collection date", type: "date", required: true },
        { key: "time", label: "Start time", type: "time", required: true },
        { key: "routeId", label: "Route", type: "reference", entity: "routes", required: true },
        { key: "truckId", label: "Truck", type: "reference", entity: "trucks", required: true },
        { key: "driverId", label: "Driver", type: "reference", entity: "drivers", required: true },
        { key: "status", label: "Schedule status", type: "select", values: ["Scheduled", "In Progress", "Completed", "Cancelled"], required: true },
      ],
      columns: [["date", "Date"], ["time", "Start time"], ["routeId", "Route"], ["truckId", "Truck"], ["driverId", "Driver"], ["status", "Status"]],
    },
    records: {
      title: "Collection Records",
      description: "Record collected waste and review completed, active, or missed collections.",
      singular: "collection record",
      statusValues: ["Completed", "In Progress", "Missed"],
      fields: [
        { key: "date", label: "Collection date", type: "date", required: true },
        { key: "routeId", label: "Route", type: "reference", entity: "routes", required: true },
        { key: "areaId", label: "Collection area", type: "reference", entity: "areas", required: true },
        { key: "truckId", label: "Truck", type: "reference", entity: "trucks", required: true },
        { key: "driverId", label: "Driver", type: "reference", entity: "drivers", required: true },
        { key: "wasteKg", label: "Collected waste (kg)", type: "number", min: 0, step: 1, required: true },
        { key: "status", label: "Record status", type: "select", values: ["Completed", "In Progress", "Missed"], required: true },
      ],
      columns: [["date", "Date"], ["routeId", "Route"], ["areaId", "Area"], ["truckId", "Truck"], ["driverId", "Driver"], ["wasteKg", "Waste (kg)"], ["status", "Status"]],
    },
  };

  const $ = (selector) => document.querySelector(selector);
  const dashboard = $("#dashboard-view");
  const opsView = $("#ops-view");
  const title = $("#ops-title");
  const description = $("#ops-description");
  const tableWrap = $("#ops-table-wrap");
  const statusFilter = $("#ops-status-filter");
  const dialog = $("#ops-dialog");
  const form = $("#ops-form");
  let activeTab = "overview";
  let editingId = null;
  let state = loadState();

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[char]);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function showStorageError(message) {
    let banner = $("#ops-storage-error");
    if (!banner) {
      banner = document.createElement("p");
      banner.id = "ops-storage-error";
      banner.className = "ops-storage-error";
      opsView.prepend(banner);
    }
    banner.textContent = message;
  }

  function loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        for (const key of Object.keys(entities)) {
          if (!Array.isArray(parsed[key])) throw new Error(`Saved ${key} data is invalid.`);
        }
        return parsed;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
      return clone(initialData);
    } catch (error) {
      showStorageError(`Could not load or save browser data: ${error.message}`);
      return clone(initialData);
    }
  }

  function persist(nextState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      state = nextState;
      const banner = $("#ops-storage-error");
      if (banner) banner.remove();
      return true;
    } catch (error) {
      showStorageError(`Changes were not saved: ${error.message}`);
      return false;
    }
  }

  function labelFor(entity, item) {
    if (!item) return "—";
    const labelKeys = {
      trucks: "unit",
      drivers: "name",
      areas: "name",
      routes: "name",
    };
    return item[labelKeys[entity]] || item.id;
  }

  function valueFor(entity, key, value) {
    const field = entities[entity].fields.find((item) => item.key === key);
    if (field && field.type === "reference") {
      const referenced = state[field.entity].find((item) => item.id === value);
      return labelFor(field.entity, referenced);
    }
    if (key === "areaId") {
      return labelFor("areas", state.areas.find((item) => item.id === value));
    }
    if (key === "capacityTons" || key === "distanceKm" || key === "wasteKg") {
      return `${Number(value).toLocaleString()}${key === "wasteKg" ? " kg" : ""}`;
    }
    if (key === "stops") return Number(value).toLocaleString();
    if (key === "date" || key === "lastService") {
      const date = new Date(`${value}T00:00:00`);
      return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    }
    return value || "—";
  }

  function statusClass(value) {
    return `ops-status ops-status-${String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  }

  function renderTabs() {
    document.querySelectorAll("[data-ops-tab]").forEach((button) => {
      const active = button.dataset.opsTab === activeTab;
      button.classList.toggle("is-selected", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });
    dashboard.hidden = activeTab !== "overview";
    opsView.hidden = activeTab === "overview";
    if (activeTab === "summary") renderSummary();
    else if (entities[activeTab]) renderEntity(activeTab);
  }

  function renderEntity(entity) {
    const config = entities[entity];
    title.textContent = config.title;
    description.textContent = config.description;
    $("#ops-add-button").hidden = false;
    $("#ops-add-button").textContent = `Add ${config.singular}`;
    $("#ops-toolbar").hidden = false;
    $("#ops-summary").hidden = true;
    $("#ops-table-wrap").hidden = false;
    statusFilter.hidden = !config.statusValues;
    statusFilter.innerHTML = `<option value="">All statuses</option>${(config.statusValues || []).map((value) =>
      `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("")}`;
    const search = $("#ops-search").value.trim().toLowerCase();
    const status = statusFilter.value;
    const rows = state[entity].filter((item) => {
      const values = config.columns.map(([key]) => valueFor(entity, key, item[key]));
      return (!status || item.status === status) && (!search || values.join(" ").toLowerCase().includes(search));
    });

    if (!rows.length) {
      tableWrap.innerHTML = `<div class="ops-empty"><strong>No ${escapeHtml(config.title.toLowerCase())} found.</strong><span>Add an item or adjust your search and filters.</span></div>`;
      return;
    }
    const headings = config.columns.map(([, label]) => `<th scope="col">${escapeHtml(label)}</th>`).join("");
    const body = rows.map((item) => `<tr data-item-id="${escapeHtml(item.id)}">
      ${config.columns.map(([key]) => {
        const value = valueFor(entity, key, item[key]);
        return `<td>${key === "status" ? `<span class="${statusClass(value)}">${escapeHtml(value)}</span>` : escapeHtml(value)}</td>`;
      }).join("")}
      <td class="ops-actions-cell">
        <button class="ops-row-button" type="button" data-action="edit" data-id="${escapeHtml(item.id)}">Edit</button>
        <button class="ops-row-button ops-delete-button" type="button" data-action="delete" data-id="${escapeHtml(item.id)}">Delete</button>
      </td>
    </tr>`).join("");
    tableWrap.innerHTML = `<table class="ops-table"><thead><tr>${headings}<th scope="col">Actions</th></tr></thead><tbody>${body}</tbody></table>`;
  }

  function summaryCard(label, value, detail, tone) {
    return `<article class="ops-metric-card ${tone ? `ops-metric-${tone}` : ""}">
      <p class="ops-metric-label">${escapeHtml(label)}</p>
      <p class="ops-metric-value">${escapeHtml(value)}</p>
      <p class="ops-metric-detail">${escapeHtml(detail)}</p>
    </article>`;
  }

  function renderSummary() {
    title.textContent = "Collection Summary";
    description.textContent = "Live operational totals based on your saved collection records and schedules.";
    $("#ops-add-button").hidden = true;
    $("#ops-toolbar").hidden = true;
    $("#ops-table-wrap").hidden = true;
    const summary = $("#ops-summary");
    summary.hidden = false;
    const completed = state.records.filter((record) => record.status === "Completed");
    const inProgress = state.records.filter((record) => record.status === "In Progress");
    const missed = state.records.filter((record) => record.status === "Missed");
    const totalKg = completed.reduce((sum, record) => sum + Number(record.wasteKg || 0), 0);
    const onRoute = state.trucks.filter((truck) => truck.status === "On Route").length;
    const available = state.trucks.filter((truck) => truck.status === "Available").length;
    const maintenance = state.trucks.filter((truck) => truck.status === "Maintenance").length;
    const activeSchedules = state.schedules.filter((item) => item.status === "Scheduled" || item.status === "In Progress").length;
    const topRoutes = state.routes.map((route) => {
      const routeRecords = state.records.filter((record) => record.routeId === route.id && record.status === "Completed");
      return {
        name: route.name,
        area: labelFor("areas", state.areas.find((area) => area.id === route.areaId)),
        collections: routeRecords.length,
        wasteKg: routeRecords.reduce((sum, record) => sum + Number(record.wasteKg || 0), 0),
      };
    }).sort((a, b) => b.wasteKg - a.wasteKg);
    summary.innerHTML = `<div class="ops-metrics">
      ${summaryCard("Waste collected", `${totalKg.toLocaleString()} kg`, "Completed collections", "green")}
      ${summaryCard("Completed collections", completed.length, "Collection records marked complete", "blue")}
      ${summaryCard("Currently active", inProgress.length, `${activeSchedules} active schedule${activeSchedules === 1 ? "" : "s"}`, "orange")}
      ${summaryCard("Missed collections", missed.length, "Review and reschedule these areas", "red")}
    </div>
    <div class="ops-summary-grid">
      <section class="ops-summary-panel">
        <h3>Truck availability</h3>
        <div class="ops-breakdown-row"><span><i class="ops-dot ops-dot-green"></i>Available</span><strong>${available}</strong></div>
        <div class="ops-breakdown-row"><span><i class="ops-dot ops-dot-blue"></i>On route</span><strong>${onRoute}</strong></div>
        <div class="ops-breakdown-row"><span><i class="ops-dot ops-dot-orange"></i>Maintenance</span><strong>${maintenance}</strong></div>
        <div class="ops-breakdown-row"><span><i class="ops-dot ops-dot-red"></i>Drivers on route</span><strong>${state.drivers.filter((driver) => driver.status === "On Route").length}</strong></div>
      </section>
      <section class="ops-summary-panel">
        <h3>Collection by route</h3>
        ${topRoutes.length ? `<div class="ops-route-list">${topRoutes.map((route) =>
          `<div class="ops-route-row"><div><strong>${escapeHtml(route.name)}</strong><span>${escapeHtml(route.area)} · ${route.collections} completed</span></div><b>${route.wasteKg.toLocaleString()} kg</b></div>`).join("")}</div>` :
          `<div class="ops-empty"><strong>No routes yet.</strong><span>Add routes and collection records to see a breakdown.</span></div>`}
      </section>
    </div>
    <section class="ops-summary-panel ops-schedule-summary">
      <h3>Upcoming and active schedules</h3>
      ${state.schedules.length ? `<div class="ops-table-wrap"><table class="ops-table"><thead><tr><th>Date</th><th>Time</th><th>Route</th><th>Truck</th><th>Driver</th><th>Status</th></tr></thead><tbody>
      ${state.schedules.slice().sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)).map((item) =>
        `<tr><td>${escapeHtml(valueFor("schedules", "date", item.date))}</td><td>${escapeHtml(item.time)}</td><td>${escapeHtml(valueFor("schedules", "routeId", item.routeId))}</td><td>${escapeHtml(valueFor("schedules", "truckId", item.truckId))}</td><td>${escapeHtml(valueFor("schedules", "driverId", item.driverId))}</td><td><span class="${statusClass(item.status)}">${escapeHtml(item.status)}</span></td></tr>`).join("")}
      </tbody></table></div>` : `<div class="ops-empty"><strong>No schedules yet.</strong><span>Create a schedule to coordinate a collection.</span></div>`}
    </section>`;
  }

  function referenceOptions(entity) {
    return state[entity].map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(labelFor(entity, item))}</option>`).join("");
  }

  function renderFormFields(entity, item = {}) {
    const config = entities[entity];
    $("#ops-form-fields").innerHTML = config.fields.map((field) => {
      const value = item[field.key] ?? "";
      const required = field.required ? "required" : "";
      let control;
      if (field.type === "select") {
        control = `<select name="${field.key}" id="field-${field.key}" ${required}>
          <option value="">Choose ${escapeHtml(field.label.toLowerCase())}</option>
          ${field.values.map((option) => `<option value="${escapeHtml(option)}" ${String(option) === String(value) ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
        </select>`;
      } else if (field.type === "reference") {
        const options = referenceOptions(field.entity);
        control = `<select name="${field.key}" id="field-${field.key}" ${required}>
          <option value="">Choose ${escapeHtml(field.label.toLowerCase())}</option>
          ${options.replace(`value="${escapeHtml(value)}"`, `value="${escapeHtml(value)}" selected`)}
        </select>`;
      } else {
        const attributes = [
          `type="${field.type || "text"}"`,
          `name="${field.key}"`,
          `id="field-${field.key}"`,
          `value="${escapeHtml(value)}"`,
          `placeholder="${escapeHtml(field.placeholder || "")}"`,
          field.min !== undefined ? `min="${field.min}"` : "",
          field.step ? `step="${field.step}"` : "",
          required,
        ].filter(Boolean).join(" ");
        control = `<input ${attributes} />`;
      }
      return `<label class="ops-field" for="field-${field.key}"><span>${escapeHtml(field.label)}${field.required ? " *" : ""}</span>${control}</label>`;
    }).join("");
  }

  function openForm(entity, item = null) {
    editingId = item ? item.id : null;
    $("#ops-dialog-title").textContent = `${item ? "Edit" : "Add"} ${entities[entity].singular}`;
    $("#ops-form-error").textContent = "";
    renderFormFields(entity, item || {});
    dialog.showModal();
    const firstInput = form.querySelector("input, select");
    if (firstInput) firstInput.focus();
  }

  function referencesFor(entity, id) {
    const fields = {
      areas: [["routes", "areaId"], ["records", "areaId"]],
      routes: [["schedules", "routeId"], ["records", "routeId"]],
      trucks: [["schedules", "truckId"], ["records", "truckId"]],
      drivers: [["schedules", "driverId"], ["records", "driverId"]],
    }[entity] || [];
    return fields.flatMap(([table, field]) => state[table]
      .filter((item) => item[field] === id)
      .map(() => table === "schedules" ? "a schedule" : "a collection record"));
  }

  function handleDelete(entity, id) {
    const item = state[entity].find((entry) => entry.id === id);
    if (!item) return;
    const references = referencesFor(entity, id);
    if (references.length) {
      window.alert(`This ${entities[entity].singular} is still assigned to ${references.length} ${references.length === 1 ? "item" : "items"}. Remove or reassign those first.`);
      return;
    }
    if (!window.confirm(`Delete ${labelFor(entity, item)}? This cannot be undone.`)) return;
    const next = clone(state);
    next[entity] = next[entity].filter((entry) => entry.id !== id);
    if (persist(next)) renderTabs();
  }

  document.querySelectorAll("[data-ops-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      activeTab = button.dataset.opsTab;
      renderTabs();
    });
  });

  $("#ops-add-button").addEventListener("click", () => {
    if (entities[activeTab]) openForm(activeTab);
  });

  $("#ops-search").addEventListener("input", () => renderEntity(activeTab));
  statusFilter.addEventListener("change", () => renderEntity(activeTab));

  tableWrap.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const item = state[activeTab].find((entry) => entry.id === button.dataset.id);
    if (button.dataset.action === "edit" && item) openForm(activeTab, item);
    if (button.dataset.action === "delete") handleDelete(activeTab, button.dataset.id);
  });

  $("#ops-close-button").addEventListener("click", () => dialog.close());
  $("#ops-cancel-button").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const entity = activeTab;
    const config = entities[entity];
    const values = Object.fromEntries(new FormData(form).entries());
    const invalid = config.fields.find((field) => {
      const value = String(values[field.key] || "").trim();
      if (field.required && !value) return true;
      if (field.type === "number" && value && (!Number.isFinite(Number(value)) || Number(value) < Number(field.min ?? -Infinity))) return true;
      if (field.type === "reference" && value && !state[field.entity].some((entry) => entry.id === value)) return true;
      return false;
    });
    if (invalid) {
      $("#ops-form-error").textContent = `Enter a valid value for ${invalid.label}.`;
      form.querySelector(`#field-${invalid.key}`).focus();
      return;
    }

    let businessError = "";
    if (entity === "schedules") {
      const route = state.routes.find((item) => item.id === values.routeId);
      const truck = state.trucks.find((item) => item.id === values.truckId);
      const driver = state.drivers.find((item) => item.id === values.driverId);
      if (values.date < today) businessError = "Schedule date cannot be in the past.";
      else if (route && route.status !== "Active") businessError = "Choose an active route for this schedule.";
      else if (!editingId && truck && truck.status === "Maintenance") businessError = "A truck in maintenance cannot be scheduled.";
      else if (!editingId && driver && driver.status === "Off Duty") businessError = "An off-duty driver cannot be scheduled.";
      else {
        const conflict = state.schedules.some((schedule) =>
          schedule.id !== editingId &&
          schedule.date === values.date &&
          schedule.status !== "Cancelled" &&
          (schedule.truckId === values.truckId || schedule.driverId === values.driverId));
        if (conflict) businessError = "That truck or driver is already assigned to a collection on this date.";
      }
    } else if (entity === "records") {
      const route = state.routes.find((item) => item.id === values.routeId);
      if (route && route.areaId !== values.areaId) {
        businessError = "Choose the collection area assigned to this route.";
      }
    } else if (entity === "routes" && editingId) {
      const hasRecords = state.records.some((record) => record.routeId === editingId && record.areaId !== values.areaId);
      if (hasRecords) businessError = "This route has collection records. Update those records before changing its collection area.";
    }
    if (businessError) {
      $("#ops-form-error").textContent = businessError;
      return;
    }

    const next = clone(state);
    const record = { ...values };
    config.fields.forEach((field) => {
      if (field.type === "number") record[field.key] = Number(values[field.key]);
    });
    if (editingId) {
      const index = next[entity].findIndex((item) => item.id === editingId);
      if (index === -1) {
        $("#ops-form-error").textContent = "This item no longer exists. Close the form and refresh the list.";
        return;
      }
      next[entity][index] = { ...next[entity][index], ...record };
    } else {
      record.id = `${entity.slice(0, -1)}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      next[entity].unshift(record);
    }
    if (persist(next)) {
      dialog.close();
      renderTabs();
    }
  });

  $("#ops-add-button").hidden = true;
  renderTabs();
})();
