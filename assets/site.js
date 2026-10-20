const menuButton = document.querySelector(".menu-btn");
const siteNavigation = document.querySelector("#site-nav");

const themeButton = document.querySelector(".theme-button");
if (themeButton) {
  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem("mini-circles-theme");
  } catch (error) {
    console.warn("Theme preference could not be loaded.", error);
  }
  if (savedTheme === "dark") document.documentElement.dataset.theme = "dark";
  const updateThemeLabel = () => {
    const dark = document.documentElement.dataset.theme === "dark";
    themeButton.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  };
  updateThemeLabel();
  themeButton.addEventListener("click", () => {
    const dark = document.documentElement.dataset.theme !== "dark";
    if (dark) document.documentElement.dataset.theme = "dark";
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem("mini-circles-theme", dark ? "dark" : "light");
    } catch (error) {
      console.warn("Theme preference could not be saved.", error);
    }
    updateThemeLabel();
  });
}

if (menuButton && siteNavigation) {
  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    siteNavigation.classList.toggle("open", open);
  });

  siteNavigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      siteNavigation.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open navigation");
    }
  });
}

const MINI_CIRCLES_CONFIG = {
  whatsappNumber: "27607714822",
  teamEmail: "",
  formEndpoint: "",
  supabaseUrl: "",
  supabaseAnonKey: "",
  facebookUrl: "https://www.facebook.com/profile.php?id=61590757922760",
  instagramUrl: ""
};

const hasSupabaseConfig = () => {
  const hasUrl = Boolean(MINI_CIRCLES_CONFIG.supabaseUrl);
  const hasKey = Boolean(MINI_CIRCLES_CONFIG.supabaseAnonKey);
  if (hasUrl !== hasKey) throw new Error("Both Supabase URL and anon key must be configured.");
  return hasUrl;
};

const fetchSupabaseTable = async (table, query) => {
  if (!hasSupabaseConfig()) throw new Error("Supabase is not configured.");
  const baseUrl = MINI_CIRCLES_CONFIG.supabaseUrl.replace(/\/+$/, "");
  const url = new URL(`${baseUrl}/rest/v1/${table}`);
  url.search = new URLSearchParams(query);
  const response = await fetch(url, {
    headers: {
      apikey: MINI_CIRCLES_CONFIG.supabaseAnonKey,
      Authorization: `Bearer ${MINI_CIRCLES_CONFIG.supabaseAnonKey}`,
      Accept: "application/json"
    }
  });
  if (!response.ok) throw new Error(`Supabase ${table} request responded with ${response.status}.`);
  return response.json();
};

document.querySelectorAll("[data-whatsapp]").forEach((link) => {
  const message = link.dataset.whatsapp || "Hi Mini Circles! I'd like to get in touch.";
  link.href = `https://wa.me/${MINI_CIRCLES_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
});

document.querySelectorAll("[data-email-contact]").forEach((link) => {
  if (MINI_CIRCLES_CONFIG.teamEmail) {
    link.href = `mailto:${MINI_CIRCLES_CONFIG.teamEmail}`;
    link.textContent = "Email the team";
  }
});

document.querySelectorAll("[data-social]").forEach((link) => {
  const url = MINI_CIRCLES_CONFIG[`${link.dataset.social}Url`];
  if (url) {
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  } else {
    link.remove();
  }
});

document.querySelectorAll(".interest-form").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = form.querySelector(".form-status");
    const submit = form.querySelector('[type="submit"]');
    const data = new FormData(form);
    status.className = "form-status";
    status.textContent = "";

    if (data.get("_gotcha")) return;
    if (!MINI_CIRCLES_CONFIG.formEndpoint) {
      status.classList.add("error");
      status.textContent = "The secure enquiry service is not connected yet. Please WhatsApp the team instead.";
      return;
    }

    submit.disabled = true;
    status.textContent = "Sending your enquiry…";
    try {
      const response = await fetch(MINI_CIRCLES_CONFIG.formEndpoint, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error(`Form service responded with ${response.status}.`);
      form.reset();
      status.classList.add("success");
      status.textContent = "Thanks for getting in touch. Your enquiry has been sent.";
    } catch (error) {
      status.classList.add("error");
      status.textContent = "We couldn't send your enquiry. Please try again or WhatsApp the team.";
      console.error("Mini Circles enquiry could not be sent.", error);
    } finally {
      submit.disabled = false;
    }
  });
});

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[character]);

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted && character === '"' && text[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += character;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  if (!rows.length) throw new Error("League spreadsheet is empty.");
  const headers = rows.shift().map((header) => header.trim());
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, (values[index] || "").trim()])));
};

const validScore = (value) => /^\d+$/.test(value);
const loadLeague = async () => {
  const table = document.querySelector("#league-table");
  const matches = document.querySelector("#league-matches");
  if (!table || !matches) return;
  try {
    let fixtures;
    if (hasSupabaseConfig()) {
      const rows = await fetchSupabaseTable("league_fixtures", {
        select: "home_team,away_team,match_date,kickoff_time,venue,home_score,away_score",
        is_published: "eq.true",
        order: "match_date.asc.nullslast,kickoff_time.asc.nullslast"
      });
      fixtures = rows.map((fixture) => ({
        home: fixture.home_team,
        away: fixture.away_team,
        date: fixture.match_date || "",
        time: fixture.kickoff_time ? fixture.kickoff_time.slice(0, 5) : "",
        venue: fixture.venue || "",
        homeScore: fixture.home_score === null ? "" : String(fixture.home_score),
        awayScore: fixture.away_score === null ? "" : String(fixture.away_score)
      }));
    } else {
      const response = await fetch("/data/mini-league.csv", { cache: "no-store" });
      if (!response.ok) throw new Error(`League spreadsheet responded with ${response.status}.`);
      fixtures = parseCsv(await response.text());
    }
    const teams = new Map();
    const validFixtures = fixtures.filter((fixture) => fixture.home && fixture.away);
    for (const fixture of validFixtures) {
      for (const name of [fixture.home, fixture.away]) {
        if (!teams.has(name)) teams.set(name, { name, played: 0, wins: 0, draws: 0, losses: 0, points: 0 });
      }
      if (!validScore(fixture.homeScore) || !validScore(fixture.awayScore)) continue;
      const home = teams.get(fixture.home);
      const away = teams.get(fixture.away);
      const homeScore = Number(fixture.homeScore);
      const awayScore = Number(fixture.awayScore);
      home.played += 1;
      away.played += 1;
      if (homeScore > awayScore) {
        home.wins += 1; home.points += 3; away.losses += 1;
      } else if (homeScore < awayScore) {
        away.wins += 1; away.points += 3; home.losses += 1;
      } else {
        home.draws += 1; away.draws += 1; home.points += 1; away.points += 1;
      }
    }
    matches.innerHTML = validFixtures.length ? validFixtures.map((fixture) => {
      const date = fixture.date && !Number.isNaN(Date.parse(`${fixture.date}T12:00:00`))
        ? new Date(`${fixture.date}T12:00:00`).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
        : "Date to be announced";
      const played = validScore(fixture.homeScore) && validScore(fixture.awayScore);
      const detail = played
        ? `<strong>${escapeHtml(fixture.homeScore)} – ${escapeHtml(fixture.awayScore)}</strong>`
        : `<span class="muted">${escapeHtml(fixture.time || "Kick-off TBC")}</span>`;
      return `<article class="match-row"><time>${date}${fixture.time ? ` · ${escapeHtml(fixture.time)}` : ""}</time><strong>${escapeHtml(fixture.home)} <span aria-hidden="true">v</span> ${escapeHtml(fixture.away)}</strong><span>${detail}${fixture.venue ? ` · ${escapeHtml(fixture.venue)}` : ""}</span></article>`;
    }).join("") : '<p class="status-note">Fixtures will be posted here when the Mini League schedule is confirmed.</p>';
    const sortedTeams = [...teams.values()].sort((first, second) =>
      second.points - first.points || second.wins - first.wins || first.name.localeCompare(second.name)
    );
    table.innerHTML = sortedTeams.length ? sortedTeams.map((team) =>
      `<tr><td>${escapeHtml(team.name)}</td><td>${team.played}</td><td>${team.wins}</td><td>${team.draws}</td><td>${team.losses}</td><td><strong>${team.points}</strong></td></tr>`
    ).join("") : '<tr><td colspan="6">The table will appear when teams and fixtures are confirmed.</td></tr>';
  } catch (error) {
    matches.innerHTML = '<p class="status-note">Fixtures are temporarily unavailable. Please check back soon.</p>';
    table.innerHTML = '<tr><td colspan="6">The table is temporarily unavailable.</td></tr>';
    console.error("Mini League data could not be loaded.", error);
  }
};

loadLeague();

const calendarDateTime = (date, time) => {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || "");
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time || "");
  if (!dateMatch || !timeMatch || Number(timeMatch[1]) > 23 || Number(timeMatch[2]) > 59) return null;
  const [year, month, day] = dateMatch.slice(1).map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return new Date(Date.UTC(year, month - 1, day, Number(timeMatch[1]) - 2, Number(timeMatch[2])));
};

const icsEscape = (value) => String(value || "")
  .replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
const icsStamp = (date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const downloadCalendarEvent = (event) => {
  const start = calendarDateTime(event.date, event.startTime);
  const end = calendarDateTime(event.date, event.endTime);
  if (!start || !end || end <= start) return;
  const content = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Mini Circles//Events//EN",
    "CALSCALE:GREGORIAN", "BEGIN:VEVENT", `UID:${crypto.randomUUID()}@minicircles`,
    `DTSTAMP:${icsStamp(new Date())}`, `DTSTART:${icsStamp(start)}`, `DTEND:${icsStamp(end)}`,
    `SUMMARY:${icsEscape(event.title)}`, `DESCRIPTION:${icsEscape(event.description)}`,
    ...(event.location ? [`LOCATION:${icsEscape(event.location)}`] : []),
    "END:VEVENT", "END:VCALENDAR"
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${String(event.term || "mini-circles-event").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const renderEvents = (events, container) => {
  if (!Array.isArray(events) || !events.length) throw new Error("No Mini Circles events are configured.");
  container.innerHTML = events.map((event, index) => {
    const start = calendarDateTime(event.date, event.startTime);
    const end = calendarDateTime(event.date, event.endTime);
    const canDownload = start && end && end > start;
    const date = start
      ? `${start.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })} · ${escapeHtml(event.startTime)}`
      : "Date to be announced";
    const share = encodeURIComponent(`${event.term}: ${event.title}${start ? ` · ${date}` : ""} — Mini Circles`);
    return `<article class="event-card"><span class="tag">${escapeHtml(event.term)}</span><h3>${escapeHtml(event.title)}</h3><p class="event-date">${date}</p><p>${escapeHtml(event.description || "More details to come.")}${event.location ? ` · ${escapeHtml(event.location)}` : ""}</p><div class="event-actions"><button class="button button-blue" type="button" data-calendar-event="${index}" ${canDownload ? "" : "disabled"}>${canDownload ? "Add to calendar" : "Calendar date TBC"}</button><a class="button button-outline" href="https://wa.me/?text=${share}" target="_blank" rel="noopener noreferrer">Share on WhatsApp ↗</a></div></article>`;
  }).join("");
  container.querySelectorAll("[data-calendar-event]").forEach((button) => {
    button.addEventListener("click", () => downloadCalendarEvent(events[Number(button.dataset.calendarEvent)]));
  });
};

const eventContainer = document.querySelector("#event-list");
if (eventContainer) {
  const loadEvents = async () => {
    if (hasSupabaseConfig()) {
      const rows = await fetchSupabaseTable("events", {
        select: "term,title,event_date,start_time,end_time,location,description",
        is_published: "eq.true",
        order: "term_order.asc,event_date.asc.nullslast"
      });
      return rows.map((event) => ({
        term: event.term,
        title: event.title,
        date: event.event_date,
        startTime: event.start_time.slice(0, 5),
        endTime: event.end_time.slice(0, 5),
        location: event.location || "",
        description: event.description || ""
      }));
    }
    const response = await fetch("/data/events.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Events file responded with ${response.status}.`);
    return response.json();
  };
  loadEvents()
    .then((events) => renderEvents(events, eventContainer))
    .catch((error) => {
      eventContainer.innerHTML = '<p class="status-note">Event details are temporarily unavailable.</p>';
      console.error("Mini Circles events could not be loaded.", error);
    });
}
