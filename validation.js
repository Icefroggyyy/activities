const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MIN_DESCRIPTION_LENGTH = 10;

function compressReportPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("error", () => reject(new Error("The selected photo could not be read.")));
    reader.addEventListener("load", () => {
      const image = new Image();
      image.addEventListener("error", () => reject(new Error("The selected image could not be opened.")));
      image.addEventListener("load", () => {
        const scale = Math.min(1, 640 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("This browser could not prepare the selected photo."));
          return;
        }
        context.fillStyle = "#fff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        try {
          let quality = 0.78;
          let photoDataUrl = canvas.toDataURL("image/jpeg", quality);
          while (photoDataUrl.length > 350_000 && quality > 0.4) {
            quality -= 0.1;
            photoDataUrl = canvas.toDataURL("image/jpeg", quality);
          }
          if (photoDataUrl.length > 350_000) {
            reject(new Error("The photo could not be reduced enough to save with this report."));
            return;
          }
          resolve(photoDataUrl);
        } catch (error) {
          reject(new Error(`The photo could not be prepared: ${error.message}`));
        }
      });
      image.src = String(reader.result);
    });
    reader.readAsDataURL(file);
  });
}

function setError(input, message) {
  const error = document.getElementById(`${input.id}-error`);
  const box = input.closest(".login-field, .date-field, .upload-box") || input;
  box.classList.toggle("is-invalid", Boolean(message));
  input.setAttribute("aria-invalid", message ? "true" : "false");
  error.textContent = message;
  return !message;
}

function bindLiveValidation(form, validators) {
  Object.entries(validators).forEach(([id, validate]) => {
    const input = form.querySelector(`#${id}`);
    const eventName = input.tagName === "SELECT" || input.type === "file" || input.type === "date" ? "change" : "blur";
    input.addEventListener(eventName, () => setError(input, validate(input)));
    input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") === "true") setError(input, validate(input));
    });
  });
}

function runValidators(form, validators) {
  let firstInvalid = null;
  Object.entries(validators).forEach(([id, validate]) => {
    const input = form.querySelector(`#${id}`);
    if (!setError(input, validate(input)) && !firstInvalid) firstInvalid = input;
  });
  if (firstInvalid) firstInvalid.focus();
  return !firstInvalid;
}

function initLoginValidation() {
  const form = document.getElementById("login-form");
  const validators = {
    email(input) {
      const value = input.value.trim();
      if (!value) return "Email is required.";
      if (!EMAIL_PATTERN.test(value)) return "Enter a valid email address.";
      return "";
    },
    password(input) {
      if (!input.value) return "Password is required.";
      if (input.value.length < 8) return "Password must be at least 8 characters.";
      if (input.value.length > 128) return "Password must be 128 characters or fewer.";
      return "";
    },
  };

  bindLiveValidation(form, validators);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    runValidators(form, validators);
  });
}

function initReportValidation() {
  const form = document.getElementById("report-form");
  const success = document.getElementById("form-success");
  const dateInput = form.querySelector("#date");
  const description = form.querySelector("#description");
  const counter = document.getElementById("description-count");
  const today = new Date().toISOString().slice(0, 10);
  dateInput.max = today;

  const validators = {
    category: (input) => (input.value ? "" : "Select a waste category."),
    location: (input) => (input.value ? "" : "Select a location."),
    date(input) {
      if (!input.value) return "Select the date of the issue.";
      if (input.value > today) return "Date cannot be in the future.";
      return "";
    },
    description(input) {
      const length = input.value.trim().length;
      if (!length) return "Describe the issue.";
      if (length < MIN_DESCRIPTION_LENGTH) return `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters.`;
      return "";
    },
    photo(input) {
      const file = input.files[0];
      if (!file) return "Upload a photo of the issue.";
      if (!ALLOWED_PHOTO_TYPES.includes(file.type)) return "Photo must be a JPG, PNG or WebP image.";
      if (file.size > MAX_PHOTO_BYTES) return "Photo must be 5 MB or smaller.";
      return "";
    },
  };

  bindLiveValidation(form, validators);
  description.addEventListener("input", () => {
    counter.textContent = description.value.length;
  });

  form.querySelector("#photo").addEventListener("change", (event) => {
    const file = event.target.files[0];
    form.querySelector(".upload-text").textContent = file ? file.name : "Tap to upload or take a photo";
  });

  let isSubmitting = false;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    success.hidden = true;
    if (!runValidators(form, validators)) return;
    const photoFile = form.querySelector("#photo").files[0];
    const submitButton = form.querySelector("[type='submit']");
    isSubmitting = true;
    submitButton.disabled = true;
    try {
      const photoDataUrl = await compressReportPhoto(photoFile);
      const report = {
        id: `report-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        category: form.querySelector("#category").value,
        location: form.querySelector("#location").value.replace(/^Brgy\.\s*/i, ""),
        date: dateInput.value,
        description: description.value.trim(),
        photoName: photoFile.name,
        photoDataUrl,
        status: "Submitted",
        submittedAt: new Date().toISOString(),
      };
      try {
        const savedReports = JSON.parse(localStorage.getItem("pasigReports.v1") || "[]");
        if (!Array.isArray(savedReports)) throw new Error("Saved report data has an unexpected format.");
        localStorage.setItem("pasigReports.v1", JSON.stringify([report, ...savedReports]));
      } catch (error) {
        success.textContent = `Report could not be saved in this browser: ${error.message}`;
        success.classList.add("is-error");
        success.hidden = false;
        return;
      }

      try {
        const prefs = JSON.parse(localStorage.getItem("pasigPreferences.v1") || '{"reportUpdates":true}');
        if (prefs.reportUpdates !== false) {
          const savedNotifications = JSON.parse(localStorage.getItem("pasigNotifications.v1") || "[]");
          if (!Array.isArray(savedNotifications)) throw new Error("Saved notification data has an unexpected format.");
          const notification = {
            id: `report-update-${report.id}`,
            title: "Your report has been submitted",
            body: `${report.category} in ${report.location} is now in your report history.`,
            type: "Report update",
            date: new Date().toISOString(),
            read: false,
          };
          localStorage.setItem("pasigNotifications.v1", JSON.stringify([notification, ...savedNotifications]));
        }
      } catch (error) {
        console.error("The report was saved, but its notification could not be stored.", error);
      }

      form.reset();
      counter.textContent = "0";
      form.querySelector(".upload-text").textContent = "Tap to upload or take a photo";
      success.textContent = "Report submitted. Thank you for helping keep Pasig clean! You can track it in My Reports.";
      success.classList.remove("is-error");
      success.hidden = false;
      success.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (error) {
      success.textContent = `Report could not be saved: ${error.message}`;
      success.classList.add("is-error");
      success.hidden = false;
    } finally {
      isSubmitting = false;
      submitButton.disabled = false;
    }
  });
}
