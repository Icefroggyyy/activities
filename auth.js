(() => {
  const STORAGE_KEY = "pasigLocalCredential.v1";
  const PROFILE_KEY = "pasigProfile.v1";
  const ACTIVE_EMAIL_KEY = "pasigActiveAccount.v1";
  const ITERATIONS = 150000;
  const DEFAULT_PROFILE = {
    name: "Arishelle Fernandez",
    email: "arishellefernandez@gmail.com",
    phone: "",
    barangay: "San Antonio",
  };
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function readProfile() {
    const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
      throw new Error("Saved profile data has an unexpected format.");
    }
    return { ...DEFAULT_PROFILE, ...saved };
  }

  function normalizeEmail(email) {
    const normalized = String(email || "").trim().toLowerCase();
    return normalized === "arishelle.fernandez@example.com" ? DEFAULT_PROFILE.email : normalized;
  }

  function readDatabase() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return { version: 2, accounts: [], activeEmail: "" };
    const stored = JSON.parse(raw);
    if (stored && stored.version === 2 && Array.isArray(stored.accounts)) {
      const valid = stored.accounts.every((account) =>
        account
        && typeof account.email === "string"
        && (
          (account.provider === "google-demo" && typeof account.profile === "object")
          || (typeof account.salt === "string" && typeof account.hash === "string")
        ),
      );
      if (!valid) throw new Error("Saved local account data is invalid. Clear this browser's saved app data to reset it.");
      return { ...stored, activeEmail: normalizeEmail(stored.activeEmail) };
    }
    if (
      stored
      && stored.version === 1
      && typeof stored.email === "string"
      && typeof stored.salt === "string"
      && typeof stored.hash === "string"
    ) {
      const email = normalizeEmail(stored.email);
      const savedProfile = readProfile();
      const migrated = {
        version: 2,
        accounts: [{ email, salt: stored.salt, hash: stored.hash, profile: { ...savedProfile, email } }],
        activeEmail: email,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    throw new Error("Saved local account data is invalid. Clear this browser's saved app data to reset it.");
  }

  function writeDatabase(database) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
  }

  function bytesToHex(bytes) {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function deriveHash(email, password, salt) {
    if (!crypto.subtle || !crypto.getRandomValues) {
      throw new Error("Password protection requires a modern browser on localhost or HTTPS.");
    }
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const bits = await crypto.subtle.deriveBits({
      name: "PBKDF2",
      salt: new TextEncoder().encode(`${email}:${salt}`),
      iterations: ITERATIONS,
      hash: "SHA-256",
    }, keyMaterial, 256);
    return bytesToHex(new Uint8Array(bits));
  }

  async function createAccount(email, password, accountProfile) {
    const normalizedEmail = normalizeEmail(email);
    const database = readDatabase();
    if (database.accounts.some((account) => account.email === normalizedEmail)) {
      throw new Error("An account with this email already exists in this browser. Sign in instead.");
    }
    const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
    const hash = await deriveHash(normalizedEmail, password, salt);
    const nextAccount = {
      email: normalizedEmail,
      salt,
      hash,
      profile: { ...DEFAULT_PROFILE, ...accountProfile, email: normalizedEmail },
    };
    database.accounts.push(nextAccount);
    database.activeEmail = normalizedEmail;
    writeDatabase(database);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(nextAccount.profile));
    localStorage.setItem(ACTIVE_EMAIL_KEY, normalizedEmail);
  }

  function setFormMessage(element, message, isError = false) {
    element.textContent = message;
    element.hidden = !message;
    element.classList.toggle("is-error", isError);
  }

  function showAccountProfile(account, database) {
    const accountProfile = account.profile && typeof account.profile === "object"
      ? { ...DEFAULT_PROFILE, ...account.profile, email: account.email }
      : { ...readProfile(), email: account.email };
    database.activeEmail = account.email;
    account.profile = accountProfile;
    writeDatabase(database);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(accountProfile));
    localStorage.setItem(ACTIVE_EMAIL_KEY, account.email);
  }

  const loginForm = document.querySelector("#login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = normalizeEmail(loginForm.elements.email.value);
      const password = loginForm.elements.password.value;
      const message = document.querySelector("#auth-message");
      if (!EMAIL_PATTERN.test(email) || password.length < 8 || password.length > 128) return;

      const submit = loginForm.querySelector("[type=submit]");
      submit.disabled = true;
      try {
        const database = readDatabase();
        let account = database.accounts.find((item) => item.email === email);
        if (!account && database.accounts.length === 0 && email === normalizeEmail(readProfile().email)) {
          const currentProfile = readProfile();
          const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
          const hash = await deriveHash(email, password, salt);
          account = { email, salt, hash, profile: { ...currentProfile, email } };
          database.accounts.push(account);
        }
        if (!account) {
          setFormMessage(message, "No account with this email exists in this browser. Choose Sign Up to create one.", true);
          return;
        }
        if (account.provider === "google-demo") {
          setFormMessage(message, "This browser account uses Google sign-in demo. Use the Google button to continue.", true);
          return;
        }
        const candidate = await deriveHash(account.email, password, account.salt);
        if (candidate !== account.hash) {
          setFormMessage(message, "The email or password does not match this browser's local account.", true);
          return;
        }
        showAccountProfile(account, database);
        window.location.href = loginForm.getAttribute("action");
      } catch (error) {
        setFormMessage(message, `Sign-in could not be completed: ${error.message}`, true);
      } finally {
        submit.disabled = false;
      }
    });
  }

  const googleDemoButton = document.querySelector("#google-demo-button");
  const googleDemoDialog = document.querySelector("#google-demo-dialog");
  const googleDemoForm = document.querySelector("#google-demo-form");
  if (googleDemoButton && googleDemoDialog && googleDemoForm) {
    const closeDialog = () => googleDemoDialog.close();
    googleDemoButton.addEventListener("click", () => {
      const message = document.querySelector("#google-demo-message");
      try {
        const loginEmail = document.querySelector("#email").value.trim();
        const loginPassword = document.querySelector("#password").value;
        const accounts = readDatabase().accounts;
        const savedAccount = accounts.find((account) => account.email === normalizeEmail(loginEmail));
        const savedProfile = savedAccount && savedAccount.profile;
        googleDemoForm.elements.name.value = savedProfile ? savedProfile.name || "" : readProfile().name || "";
        googleDemoForm.elements.email.value = loginEmail || (savedAccount ? savedAccount.email : "");
        message.hidden = true;
        googleDemoDialog.showModal();
        if (loginPassword.length) googleDemoForm.elements.email.focus();
        else googleDemoForm.elements.name.focus();
      } catch (error) {
        setFormMessage(message, `Demo sign-in could not be opened: ${error.message}`, true);
        googleDemoDialog.showModal();
      }
    });
    document.querySelectorAll("#google-demo-cancel, #google-demo-cancel-link").forEach((button) => {
      button.addEventListener("click", closeDialog);
    });
    googleDemoForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = googleDemoForm.elements.name.value.trim();
      const email = normalizeEmail(googleDemoForm.elements.email.value);
      const message = document.querySelector("#google-demo-message");
      if (name.length < 2 || name.length > 80) {
        setFormMessage(message, "Enter a name between 2 and 80 characters.", true);
        googleDemoForm.elements.name.focus();
        return;
      }
      if (!EMAIL_PATTERN.test(email)) {
        setFormMessage(message, "Enter a valid email address.", true);
        googleDemoForm.elements.email.focus();
        return;
      }
      const submit = googleDemoForm.querySelector("[type=submit]");
      submit.disabled = true;
      try {
        const database = readDatabase();
        let account = database.accounts.find((item) => item.email === email);
        if (account) {
          showAccountProfile(account, database);
        } else {
          const newAccount = {
            email,
            provider: "google-demo",
            profile: { ...DEFAULT_PROFILE, name, email },
          };
          database.accounts.push(newAccount);
          database.activeEmail = email;
          writeDatabase(database);
          localStorage.setItem(PROFILE_KEY, JSON.stringify(newAccount.profile));
          localStorage.setItem(ACTIVE_EMAIL_KEY, email);
        }
        window.location.href = "dashboard.html";
      } catch (error) {
        setFormMessage(message, `Demo sign-in could not be completed: ${error.message}`, true);
      } finally {
        submit.disabled = false;
      }
    });
  }

  const signupForm = document.querySelector("#signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = signupForm.elements.name.value.trim();
      const email = normalizeEmail(signupForm.elements.email.value);
      const phone = signupForm.elements.phone.value.trim();
      const password = signupForm.elements.password.value;
      const confirmation = signupForm.elements.confirmPassword.value;
      const message = document.querySelector("#signup-message");

      if (name.length < 2 || name.length > 80) {
        setFormMessage(message, "Enter a name between 2 and 80 characters.", true);
        signupForm.elements.name.focus();
        return;
      }
      if (!EMAIL_PATTERN.test(email)) {
        setFormMessage(message, "Enter a valid email address.", true);
        signupForm.elements.email.focus();
        return;
      }
      if (password.length < 8 || password.length > 128) {
        setFormMessage(message, "Password must be between 8 and 128 characters.", true);
        signupForm.elements.password.focus();
        return;
      }
      if (password !== confirmation) {
        setFormMessage(message, "The password and confirmation do not match.", true);
        signupForm.elements.confirmPassword.focus();
        return;
      }

      const submit = signupForm.querySelector("[type=submit]");
      submit.disabled = true;
      try {
        await createAccount(email, password, { ...DEFAULT_PROFILE, name, email, phone });
        window.location.href = "dashboard.html";
      } catch (error) {
        setFormMessage(message, `Account could not be created: ${error.message}`, true);
      } finally {
        submit.disabled = false;
      }
    });
  }

  const changeForm = document.querySelector("#change-password-form");
  if (changeForm) {
    const currentPassword = changeForm.elements.currentPassword;
    const currentGroup = document.querySelector("#current-password-group");
    const status = document.querySelector("#password-setup-status");
    const message = document.querySelector("#change-password-message");
    let activeAccount;
    let database;
    try {
      database = readDatabase();
      const activeEmail = normalizeEmail(localStorage.getItem(ACTIVE_EMAIL_KEY) || database.activeEmail);
      activeAccount = database.accounts.find((account) => account.email === activeEmail);
      if (!activeAccount) {
        currentGroup.hidden = true;
        currentPassword.required = false;
        status.textContent = "No local password is set yet. Choose a password to protect future sign-ins in this browser.";
      } else if (activeAccount.provider === "google-demo") {
        currentGroup.hidden = true;
        currentPassword.required = false;
        status.textContent = "This demo Google account has no local password. You can set one here for password sign-in in this browser.";
      } else {
        currentPassword.required = true;
        status.textContent = "This password is stored only in this browser and is not a secure account credential.";
      }
    } catch (error) {
      setFormMessage(message, error.message, true);
      changeForm.querySelector("[type=submit]").disabled = true;
    }

    changeForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const next = changeForm.elements.newPassword.value;
      const confirmation = changeForm.elements.confirmPassword.value;
      if (next.length < 8 || next.length > 128) {
        setFormMessage(message, "Use a password between 8 and 128 characters.", true);
        return;
      }
      if (next !== confirmation) {
        setFormMessage(message, "The new password and confirmation do not match.", true);
        changeForm.elements.confirmPassword.focus();
        return;
      }

      const submit = changeForm.querySelector("[type=submit]");
      submit.disabled = true;
      try {
        database = readDatabase();
        const activeEmail = normalizeEmail(localStorage.getItem(ACTIVE_EMAIL_KEY) || database.activeEmail);
        activeAccount = database.accounts.find((account) => account.email === activeEmail);
        if (activeAccount && activeAccount.provider !== "google-demo") {
          const candidate = await deriveHash(activeAccount.email, currentPassword.value, activeAccount.salt);
          if (candidate !== activeAccount.hash) {
            setFormMessage(message, "Current password is incorrect.", true);
            currentPassword.focus();
            return;
          }
        } else if (!activeAccount) {
          const email = normalizeEmail(readProfile().email);
          activeAccount = { email, profile: { ...readProfile(), email } };
          database.accounts.push(activeAccount);
          database.activeEmail = email;
          localStorage.setItem(ACTIVE_EMAIL_KEY, email);
        }
        activeAccount.salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
        activeAccount.hash = await deriveHash(activeAccount.email, next, activeAccount.salt);
        activeAccount.provider = "password";
        writeDatabase(database);
        changeForm.reset();
        setFormMessage(message, "Browser-local password updated. You will need it for your next sign-in.");
      } catch (error) {
        setFormMessage(message, `Password could not be updated: ${error.message}`, true);
      } finally {
        submit.disabled = false;
      }
    });
  }
})();
