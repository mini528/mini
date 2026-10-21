const escapeStakeholderHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[character]);

const stakeholderConfig = window.MINI_CIRCLES_CONFIG || {};
const stakeholderSupabaseConfigured = Boolean(stakeholderConfig.supabaseUrl && stakeholderConfig.supabaseAnonKey);

const stakeholderRequest = async (table, query) => {
  const url = new URL(`${stakeholderConfig.supabaseUrl.replace(/\/+$/, "")}/rest/v1/${table}`);
  url.search = new URLSearchParams(query);
  const response = await fetch(url, {
    headers: {
      apikey: stakeholderConfig.supabaseAnonKey,
      Accept: "application/json"
    }
  });
  if (!response.ok) throw new Error(`Stakeholder ${table} request responded with ${response.status}.`);
  return response.json();
};

const loadPublicStakeholders = async () => {
  if (window.loadStakeholderDirectory) return window.loadStakeholderDirectory();
  if (!stakeholderSupabaseConfigured) {
    const response = await fetch("/data/stakeholders.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Stakeholder directory file responded with ${response.status}.`);
    return response.json();
  }
  return stakeholderRequest("stakeholder_profiles", {
    select: "id,slug,name,category,tagline,description,logo_url,banner_url,website_url,contact_email,contact_phone,programmes,news,gallery",
    is_published: "eq.true",
    order: "name.asc"
  });
};

const safeStakeholderUrl = (value) => {
  if (!value || typeof value !== "string") return "";
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("..")) return value;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" ? parsed.href : "";
  } catch {
    return "";
  }
};

const renderStakeholderDirectory = (container, partners) => {
  if (!Array.isArray(partners) || !partners.length) {
    container.innerHTML = '<p class="status-note">No stakeholder profiles have been published yet.</p>';
    return;
  }
  container.innerHTML = partners.map((partner) => {
    const profilePath = `/stakeholders/profile.html?slug=${encodeURIComponent(partner.slug || "")}`;
    const bannerUrl = safeStakeholderUrl(partner.banner_url);
    const logoUrl = safeStakeholderUrl(partner.logo_url);
    const banner = bannerUrl
      ? `<img src="${escapeStakeholderHtml(bannerUrl)}" alt="" loading="lazy">`
      : '<span class="stakeholder-image-pending">Partner photo or banner<br>not added yet</span>';
    const logo = logoUrl
      ? `<img src="${escapeStakeholderHtml(logoUrl)}" alt="" loading="lazy">`
      : `<span aria-hidden="true">${escapeStakeholderHtml((partner.name || "P").slice(0, 1))}</span>`;
    return `<article class="stakeholder-directory-card">
      <a class="stakeholder-directory-banner" href="${profilePath}" aria-label="View ${escapeStakeholderHtml(partner.name)} profile">${banner}</a>
      <div class="stakeholder-directory-copy">
        <div class="stakeholder-logo">${logo}</div>
        <p class="eyebrow">${escapeStakeholderHtml(partner.category || "Community partner")}</p>
        <h2><a href="${profilePath}">${escapeStakeholderHtml(partner.name)}</a></h2>
        <p>${escapeStakeholderHtml(partner.tagline || partner.description || "")}</p>
        <a class="text-link" href="${profilePath}">View stakeholder profile <span aria-hidden="true">→</span></a>
      </div>
    </article>`;
  }).join("");
};

const renderStakeholderProfile = (container, partner) => {
  const bannerUrl = safeStakeholderUrl(partner.banner_url);
  const logoUrl = safeStakeholderUrl(partner.logo_url);
  const programmes = Array.isArray(partner.programmes) ? partner.programmes : [];
  const news = Array.isArray(partner.news) ? partner.news : [];
  const gallery = Array.isArray(partner.gallery) ? partner.gallery : [];
  const banner = bannerUrl
    ? `<img src="${escapeStakeholderHtml(bannerUrl)}" alt="${escapeStakeholderHtml(partner.name)} community banner">`
    : '<div class="stakeholder-profile-image-pending">Profile banner photo can be added by this stakeholder.</div>';
  const logo = logoUrl
    ? `<img src="${escapeStakeholderHtml(logoUrl)}" alt="">`
    : `<span aria-hidden="true">${escapeStakeholderHtml((partner.name || "P").slice(0, 1))}</span>`;
  const programmeContent = programmes.length
    ? `<ul class="stakeholder-programme-list">${programmes.map((programme) => `<li>${escapeStakeholderHtml(typeof programme === "string" ? programme : programme.title || "")}${typeof programme === "object" && programme.description ? `<p>${escapeStakeholderHtml(programme.description)}</p>` : ""}</li>`).join("")}</ul>`
    : '<p>Program details will be added by the stakeholder.</p>';
  const newsContent = news.length
    ? `<div class="stakeholder-news-list">${news.map((item) => `<article><p class="eyebrow">${escapeStakeholderHtml(item.date || "Update")}</p><h3>${escapeStakeholderHtml(item.title || "News update")}</h3><p>${escapeStakeholderHtml(item.body || "")}</p></article>`).join("")}</div>`
    : "<p>News and updates will be added by this stakeholder.</p>";
  const galleryContent = gallery.length
    ? `<div class="stakeholder-profile-gallery">${gallery.map((image) => {
      const imageUrl = safeStakeholderUrl(image.url);
      if (!imageUrl) return "";
      if (image.type === "video") {
        return `<p><a href="${escapeStakeholderHtml(imageUrl)}" target="_blank" rel="noopener noreferrer">${escapeStakeholderHtml(image.caption || "Watch stakeholder video")} ↗</a></p>`;
      }
      return `<figure><img src="${escapeStakeholderHtml(imageUrl)}" alt="${escapeStakeholderHtml(image.alt || "")}" loading="lazy"><figcaption>${escapeStakeholderHtml(image.caption || "")}</figcaption></figure>`;
    }).join("")}</div>`
    : '<p>Approved photos and updates will appear here as the profile grows.</p>';
  const website = safeStakeholderUrl(partner.website_url);
  const contactEmail = typeof partner.contact_email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(partner.contact_email)
    ? partner.contact_email
    : "";
  container.innerHTML = `<article class="stakeholder-profile">
    <div class="stakeholder-profile-banner">${banner}</div>
    <div class="stakeholder-profile-body">
      <div class="stakeholder-profile-heading">
        <div class="stakeholder-profile-logo">${logo}</div>
        <div><p class="eyebrow">${escapeStakeholderHtml(partner.category || "Foundation partner")}</p><h1>${escapeStakeholderHtml(partner.name)}</h1><p class="stakeholder-profile-tagline">${escapeStakeholderHtml(partner.tagline || "")}</p></div>
      </div>
      <section class="stakeholder-profile-section"><h2>About</h2><p>${escapeStakeholderHtml(partner.description || "This stakeholder profile is being prepared.")}</p></section>
      <section class="stakeholder-profile-section"><h2>Programs &amp; services</h2>${programmeContent}</section>
      <section class="stakeholder-profile-section"><h2>News &amp; updates</h2>${newsContent}</section>
      <section class="stakeholder-profile-section"><h2>Photos &amp; video highlights</h2>${galleryContent}</section>
      <section class="stakeholder-contact"><h2>Connect</h2><div>${website ? `<a href="${escapeStakeholderHtml(website)}" target="_blank" rel="noopener noreferrer">Visit partner website ↗</a>` : ""}${contactEmail ? `<a href="mailto:${escapeStakeholderHtml(contactEmail)}">Email ${escapeStakeholderHtml(partner.name)} ↗</a>` : ""}${partner.contact_phone ? `<a href="tel:${escapeStakeholderHtml(String(partner.contact_phone).replace(/[^+\\d]/g, ""))}">Call partner ↗</a>` : ""}${!website && !contactEmail && !partner.contact_phone ? "<p>Contact information will be added by this stakeholder.</p>" : ""}</div></section>
      <p class="form-note">Part of the Mlungisi Mashinini Foundation stakeholder network · <a href="/stakeholders/">View all stakeholders</a></p>
    </div>
  </article>`;
  document.title = `${partner.name} | Mlungisi Mashinini Foundation`;
};

const directoryContainer = document.querySelector("[data-stakeholder-directory]");
if (directoryContainer) {
  loadPublicStakeholders()
    .then((partners) => renderStakeholderDirectory(directoryContainer, partners))
    .catch((error) => {
      directoryContainer.innerHTML = '<p class="status-note">Stakeholder profiles are temporarily unavailable. Please try again later.</p>';
      console.error("Stakeholder directory could not be loaded.", error);
    });
}

const profileContainer = document.querySelector("[data-stakeholder-profile]");
if (profileContainer) {
  const slug = new URLSearchParams(window.location.search).get("slug");
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    profileContainer.innerHTML = '<p class="status-note">This stakeholder profile link is invalid. <a href="/stakeholders/">Browse the directory.</a></p>';
  } else {
    const loadProfile = stakeholderSupabaseConfigured
      ? stakeholderRequest("stakeholder_profiles", {
        select: "slug,name,category,tagline,description,logo_url,banner_url,website_url,contact_email,contact_phone,programmes,news,gallery",
        slug: `eq.${slug}`,
        is_published: "eq.true",
        limit: "1"
      })
      : loadPublicStakeholders().then((partners) => partners.filter((partner) => partner.slug === slug));
    loadProfile
      .then((partners) => {
        const partner = partners[0];
        if (!partner) {
          profileContainer.innerHTML = '<p class="status-note">This stakeholder profile is not available. <a href="/stakeholders/">Browse the directory.</a></p>';
          return;
        }
        renderStakeholderProfile(profileContainer, partner);
      })
      .catch((error) => {
        profileContainer.innerHTML = '<p class="status-note">This stakeholder profile is temporarily unavailable. Please try again later.</p>';
        console.error("Stakeholder profile could not be loaded.", error);
      });
  }
}
