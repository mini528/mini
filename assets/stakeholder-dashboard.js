const dashboard = document.querySelector("[data-stakeholder-dashboard]");

if (dashboard) {
  const config = window.MINI_CIRCLES_CONFIG || {};
  const loginSection = dashboard.querySelector("[data-dashboard-login]");
  const signedInSection = dashboard.querySelector("[data-dashboard-signed-in]");
  const configNotice = dashboard.querySelector("[data-dashboard-config-notice]");
  const loginForm = dashboard.querySelector("#stakeholder-login-form");
  const loginStatus = dashboard.querySelector("[data-login-status]");
  const membershipList = dashboard.querySelector("[data-membership-list]");
  const userLabel = dashboard.querySelector("[data-dashboard-user]");
  const logoutButton = dashboard.querySelector("[data-dashboard-logout]");
  let session = null;

  const escapeDashboardHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);

  const configIsReady = Boolean(config.supabaseUrl && config.supabaseAnonKey);
  if (!configIsReady) {
    configNotice.hidden = false;
    loginForm.querySelectorAll("input, button").forEach((control) => { control.disabled = true; });
    loginStatus.textContent = "Stakeholder sign-in is not configured yet. Add the Foundation Supabase URL and public anon key to assets/site.js after setting up the backend.";
  } else {
    configNotice.hidden = true;
  }

  const authEndpoint = () => `${config.supabaseUrl.replace(/\/+$/, "")}/auth/v1`;
  const restEndpoint = () => `${config.supabaseUrl.replace(/\/+$/, "")}/rest/v1`;
  const storageEndpoint = () => `${config.supabaseUrl.replace(/\/+$/, "")}/storage/v1`;

  const requestToken = async (grantType, credentials) => {
    const response = await fetch(`${authEndpoint()}/token?grant_type=${grantType}`, {
      method: "POST",
      headers: {
        apikey: config.supabaseAnonKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(credentials)
    });
    if (!response.ok) throw new Error(`Authentication request responded with ${response.status}.`);
    return response.json();
  };

  const refreshSession = async () => {
    if (!session?.refreshToken) throw new Error("Your dashboard session has expired. Sign in again.");
    const tokens = await requestToken("refresh_token", { refresh_token: session.refreshToken });
    session = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
      user: tokens.user
    };
  };

  const ensureFreshSession = async () => {
    if (!session) throw new Error("Sign in to use the stakeholder dashboard.");
    if (session.expiresAt < Date.now() + 60_000) await refreshSession();
  };

  const dashboardRequest = async (table, query, options = {}) => {
    await ensureFreshSession();
    const url = new URL(`${restEndpoint()}/${table}`);
    url.search = new URLSearchParams(query);
    const headers = {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${session.accessToken}`,
      Accept: "application/json",
      ...options.headers
    };
    const response = await fetch(url, {
      method: options.method || "GET",
      headers,
      body: options.body
    });
    if (!response.ok) throw new Error(`Dashboard request responded with ${response.status}.`);
    if (response.status === 204) return [];
    return response.json();
  };

  const showDashboardError = (status, error, action) => {
    status.className = "form-status error";
    status.textContent = `${action} failed. Please try again; if it continues, contact the Foundation administrator.`;
    console.error(`Stakeholder dashboard ${action.toLowerCase()} failed.`, error);
  };

  const renderProfileEditor = (membership) => {
    const profile = membership.stakeholder_profiles;
    if (!profile) return "";
    const canEdit = ["owner", "editor"].includes(membership.role);
    const programmes = Array.isArray(profile.programmes)
      ? profile.programmes.map((programme) => typeof programme === "string" ? programme : programme.title || "").join("\n")
      : "";
    const news = Array.isArray(profile.news) ? JSON.stringify(profile.news, null, 2) : "[]";
    const gallery = Array.isArray(profile.gallery) ? JSON.stringify(profile.gallery, null, 2) : "[]";
    return `<section class="stakeholder-editor-card" data-profile-id="${escapeDashboardHtml(profile.id)}">
      <div class="stakeholder-editor-heading"><div><p class="eyebrow">${escapeDashboardHtml(profile.category || "Stakeholder")}</p><h2>${escapeDashboardHtml(profile.name)}</h2><p>Access level: ${escapeDashboardHtml(membership.role)} · ${profile.is_published ? "Published profile" : "Draft profile"}</p></div><a class="text-link" href="/stakeholders/profile.html?slug=${encodeURIComponent(profile.slug)}" target="_blank" rel="noopener noreferrer">Preview public profile ↗</a></div>
      ${canEdit ? `<form class="stakeholder-profile-editor" data-profile-form>
        <div class="form-grid">
          <label>Organization name<input name="name" required maxlength="140" value="${escapeDashboardHtml(profile.name)}"></label>
          <label>Category<input name="category" maxlength="100" value="${escapeDashboardHtml(profile.category)}"></label>
          <label class="wide">Tagline<input name="tagline" maxlength="180" value="${escapeDashboardHtml(profile.tagline)}"></label>
          <label class="wide">About<textarea name="description" maxlength="2000">${escapeDashboardHtml(profile.description)}</textarea></label>
          <label>Logo image URL<input name="logo_url" type="url" maxlength="1000" value="${escapeDashboardHtml(profile.logo_url)}"><input type="file" accept="image/jpeg,image/png,image/webp" data-media-target="logo_url" aria-label="Upload organization logo"></label>
          <label>Banner image URL<input name="banner_url" type="url" maxlength="1000" value="${escapeDashboardHtml(profile.banner_url)}"><input type="file" accept="image/jpeg,image/png,image/webp" data-media-target="banner_url" aria-label="Upload profile banner"></label>
          <label>Website URL<input name="website_url" type="url" maxlength="1000" value="${escapeDashboardHtml(profile.website_url)}"></label>
          <label>Public email<input name="contact_email" type="email" maxlength="254" value="${escapeDashboardHtml(profile.contact_email)}"></label>
          <label>Public phone<input name="contact_phone" type="tel" maxlength="40" value="${escapeDashboardHtml(profile.contact_phone)}"></label>
          <label class="wide">Programs &amp; services (one per line)<textarea name="programmes" maxlength="3000">${escapeDashboardHtml(programmes)}</textarea></label>
          <label class="wide">News &amp; updates (JSON array with title, date and body fields)<textarea name="news" maxlength="8000" spellcheck="false">${escapeDashboardHtml(news)}</textarea></label>
          <label class="wide">Gallery items (JSON array with url, alt and caption; use type "video" for HTTPS video links)<textarea name="gallery" maxlength="8000" spellcheck="false">${escapeDashboardHtml(gallery)}</textarea><input type="file" accept="image/jpeg,image/png,image/webp" data-gallery-upload multiple aria-label="Upload gallery photos"><span class="form-note">Photos are publicly accessible. Upload only images approved for publication; add descriptive alt text and captions to gallery entries.</span></label>
          <div class="wide"><button class="button button-blue" type="submit">Save profile changes</button><p class="form-status" data-profile-status aria-live="polite"></p></div>
        </div>
      </form>` : '<p class="status-note">You have view-only access to this profile. Ask a profile owner to make changes.</p>'}
    </section>`;
  };

  const loadMemberships = async () => {
    const rows = await dashboardRequest("stakeholder_memberships", {
      select: "role,stakeholder_profiles(id,slug,name,category,tagline,description,logo_url,banner_url,website_url,contact_email,contact_phone,programmes,news,gallery,is_published)",
      user_id: `eq.${session.user.id}`,
      order: "created_at.asc"
    });
    if (!rows.length) {
      membershipList.innerHTML = '<p class="status-note">This account has not been connected to a stakeholder profile yet. Contact the Foundation administrator.</p>';
      return;
    }
    membershipList.innerHTML = rows.map(renderProfileEditor).join("");
    membershipList.querySelectorAll("[data-profile-form]").forEach((form) => {
      form.addEventListener("submit", saveProfile);
      form.querySelectorAll("[data-media-target]").forEach((input) => {
        input.addEventListener("change", uploadProfileFieldImage);
      });
      form.querySelectorAll("[data-gallery-upload]").forEach((input) => {
        input.addEventListener("change", uploadGalleryImages);
      });
    });
  };

  const uploadStakeholderImage = async (stakeholderId, file) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      throw new Error("Choose a JPEG, PNG or WebP image.");
    }
    if (file.size > 10 * 1024 * 1024) throw new Error("Each image must be 10 MB or smaller.");
    await ensureFreshSession();
    const filename = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "photo.webp";
    const objectName = `${Date.now()}-${filename}`;
    const objectPath = `${stakeholderId}/${objectName}`;
    const response = await fetch(`${storageEndpoint()}/object/stakeholder-media/${objectPath}`, {
      method: "POST",
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": file.type,
        "x-upsert": "false",
        "cache-control": "3600"
      },
      body: file
    });
    if (!response.ok) throw new Error(`Image upload responded with ${response.status}.`);
    return `${storageEndpoint()}/object/public/stakeholder-media/${objectPath}`;
  };

  const uploadProfileFieldImage = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    const form = input.closest("form");
    const target = form.elements.namedItem(input.dataset.mediaTarget);
    if (!file || !target) return;
    const status = form.querySelector("[data-profile-status]");
    input.disabled = true;
    status.className = "form-status";
    status.textContent = "Uploading approved image…";
    try {
      target.value = await uploadStakeholderImage(form.closest("[data-profile-id]").dataset.profileId, file);
      status.classList.add("success");
      status.textContent = "Image uploaded. Save the profile to publish its URL.";
    } catch (error) {
      showDashboardError(status, error, "Uploading image");
    } finally {
      input.disabled = false;
      input.value = "";
    }
  };

  const uploadGalleryImages = async (event) => {
    const input = event.currentTarget;
    const files = [...(input.files || [])];
    if (!files.length) return;
    const form = input.closest("form");
    const galleryField = form.elements.namedItem("gallery");
    const status = form.querySelector("[data-profile-status]");
    input.disabled = true;
    status.className = "form-status";
    status.textContent = "Uploading approved gallery photos…";
    try {
      const gallery = JSON.parse(galleryField.value || "[]");
      if (!Array.isArray(gallery)) throw new Error("Gallery must be a JSON array.");
      const stakeholderId = form.closest("[data-profile-id]").dataset.profileId;
      for (const file of files) {
        const url = await uploadStakeholderImage(stakeholderId, file);
        gallery.push({ url, alt: `Photo uploaded: ${file.name.replace(/\.[^.]+$/, "")}`, caption: "" });
      }
      galleryField.value = JSON.stringify(gallery, null, 2);
      status.classList.add("success");
      status.textContent = "Photos uploaded. Review their alt text and captions, then save the profile.";
    } catch (error) {
      showDashboardError(status, error, "Uploading gallery photos");
    } finally {
      input.disabled = false;
      input.value = "";
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const card = form.closest("[data-profile-id]");
    const status = form.querySelector("[data-profile-status]");
    const button = form.querySelector('[type="submit"]');
    const values = new FormData(form);
    let gallery;
    let news;
    try {
      gallery = JSON.parse(values.get("gallery") || "[]");
      if (!Array.isArray(gallery)) throw new Error("Gallery must be a JSON array.");
    } catch (error) {
      status.className = "form-status error";
      status.textContent = "Gallery must be valid JSON containing an array of image objects.";
      return;
    }
    try {
      news = JSON.parse(values.get("news") || "[]");
      if (!Array.isArray(news)) throw new Error("News must be a JSON array.");
    } catch (error) {
      status.className = "form-status error";
      status.textContent = "News & updates must be valid JSON containing an array of items.";
      return;
    }

    const payload = {
      name: values.get("name").trim(),
      category: values.get("category").trim(),
      tagline: values.get("tagline").trim(),
      description: values.get("description").trim(),
      logo_url: values.get("logo_url").trim(),
      banner_url: values.get("banner_url").trim(),
      website_url: values.get("website_url").trim(),
      contact_email: values.get("contact_email").trim(),
      contact_phone: values.get("contact_phone").trim(),
      programmes: values.get("programmes").split("\n").map((line) => line.trim()).filter(Boolean),
      news,
      gallery
    };

    button.disabled = true;
    status.className = "form-status";
    status.textContent = "Saving profile…";
    try {
      await dashboardRequest("stakeholder_profiles", { id: `eq.${card.dataset.profileId}` }, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(payload)
      });
      status.classList.add("success");
      status.textContent = "Profile saved. Public changes are live if this profile is published.";
    } catch (error) {
      showDashboardError(status, error, "Saving");
    } finally {
      button.disabled = false;
    }
  };

  const showSignedInDashboard = async () => {
    loginSection.hidden = true;
    signedInSection.hidden = false;
    userLabel.textContent = session.user.email || "Stakeholder account";
    membershipList.innerHTML = '<p class="status-note">Loading your stakeholder profiles…</p>';
    try {
      await loadMemberships();
    } catch (error) {
      membershipList.innerHTML = '<p class="status-note">Your stakeholder profiles could not be loaded. Please sign in again or contact the Foundation administrator.</p>';
      console.error("Stakeholder memberships could not be loaded.", error);
    }
  };

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!configIsReady) return;
    const status = loginStatus;
    const button = loginForm.querySelector('[type="submit"]');
    const formData = new FormData(loginForm);
    button.disabled = true;
    status.className = "form-status";
    status.textContent = "Signing in…";
    try {
      const tokens = await requestToken("password", {
        email: formData.get("email").trim(),
        password: formData.get("password")
      });
      session = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + tokens.expires_in * 1000,
        user: tokens.user
      };
      loginForm.reset();
      await showSignedInDashboard();
    } catch (error) {
      status.className = "form-status error";
      status.textContent = "Sign-in failed. Check your details or contact the Foundation administrator.";
      console.error("Stakeholder sign-in failed.", error);
    } finally {
      button.disabled = false;
    }
  });

  logoutButton.addEventListener("click", async () => {
    let logoutFailed = false;
    if (session) {
      try {
        await ensureFreshSession();
        const response = await fetch(`${authEndpoint()}/logout`, {
          method: "POST",
          headers: {
            apikey: config.supabaseAnonKey,
            Authorization: `Bearer ${session.accessToken}`
          }
        });
        if (!response.ok) throw new Error(`Sign-out request responded with ${response.status}.`);
      } catch (error) {
        console.error("Stakeholder sign-out request failed.", error);
        logoutFailed = true;
      }
    }
    session = null;
    membershipList.replaceChildren();
    signedInSection.hidden = true;
    loginSection.hidden = false;
    loginStatus.className = "form-status";
    loginStatus.textContent = logoutFailed
      ? "Signed out on this device, but the server could not revoke the session. It will expire automatically."
      : "You have signed out.";
  });
}
