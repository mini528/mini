const photoFrames = [...document.querySelectorAll("[data-photo-frame]")];

if (photoFrames.length) {
  photoFrames.forEach((frame) => {
    const image = frame.querySelector("img");
    if (image) image.hidden = true;
  });

  const markPhotoPending = (frame, message) => {
    frame.dataset.photoState = "pending";
    const image = frame.querySelector("img");
    const notice = frame.querySelector(".photo-pending");
    if (image) image.hidden = true;
    if (notice) notice.textContent = message;
  };

  fetch("/data/homepage-media.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`Homepage media manifest responded with ${response.status}.`);
      return response.json();
    })
    .then((media) => {
      for (const frame of photoFrames) {
        const key = frame.dataset.photoFrame;
        const entry = media[key];
        const image = frame.querySelector("img");
        const notice = frame.querySelector(".photo-pending");
        if (!entry || !image || !notice) {
          console.error(`Homepage photo slot "${key}" is missing its media configuration or image element.`);
          markPhotoPending(frame, "Photo slot setup needs attention.");
          continue;
        }

        if (!entry.src || !entry.consentConfirmed) {
          const message = entry.suggestedPath
            ? `Approved photo goes at ${entry.suggestedPath}. Confirm permission in the media manifest before publishing.`
            : "Add an approved photo and confirm permission in the media manifest.";
          markPhotoPending(frame, message);
          continue;
        }

        if (!entry.alt?.trim()) {
          console.error(`Homepage photo "${key}" needs descriptive alt text before it can be published.`);
          markPhotoPending(frame, "Add descriptive alt text before publishing this photo.");
          continue;
        }

        if (!entry.src.startsWith("/assets/images/") || entry.src.includes("..")) {
          console.error(`Homepage photo "${key}" must use a local path under /assets/images/.`);
          markPhotoPending(frame, "Photo path must be a local image under assets/images.");
          continue;
        }

        image.alt = entry.alt || "";
        image.addEventListener("load", () => {
          frame.dataset.photoState = "ready";
          notice.hidden = true;
          image.hidden = false;
        }, { once: true });
        image.addEventListener("error", () => {
          console.error(`Homepage photo "${key}" could not be loaded from ${entry.src}.`);
          markPhotoPending(frame, `Photo unavailable at ${entry.src}.`);
        }, { once: true });
        image.src = entry.src;
      }
    })
    .catch((error) => {
      for (const frame of photoFrames) markPhotoPending(frame, "Photo manifest unavailable; check data/homepage-media.json.");
      console.error("Foundation homepage photos could not be configured.", error);
    });
}
