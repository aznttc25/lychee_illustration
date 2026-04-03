// ---------- helpers ----------
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// ----- multi-image helpers -----
function parseSrcList(srcString) {
    return (srcString || "")
        .split("|")
        .map(s => s.trim())
        .filter(Boolean);
}

function buildDots() {
    if (!mediaDots) return;

    mediaDots.innerHTML = "";
    slides.forEach((_, idx) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", `View item ${idx + 1}`);
        dot.addEventListener("click", (e) => {
            e.stopPropagation();
            showSlide(idx);
        });
        mediaDots.appendChild(dot);
    });
}

function showSlide(i) {
    if (!slides.length) return;

    slideIndex = (i + slides.length) % slides.length;
    const item = slides[slideIndex];

    // stop/reset both
    if (vidEl) {
        vidEl.pause();
        vidEl.removeAttribute("src");
        vidEl.load();
        vidEl.style.display = "none";
    }
    imgEl.style.display = "none";
    imgEl.src = "";

    if (item.type === "video" && vidEl) {
        vidEl.src = item.url;
        vidEl.style.display = "block";
    } else {
        imgEl.src = item.url;
        imgEl.style.display = "block";
    }

    // dots active state
    if (mediaDots) {
        Array.from(mediaDots.children).forEach((dot, idx) => {
            dot.classList.toggle("is-active", idx === slideIndex);
        });
    }

    resetZoom();
}

function getMediaType(url) {
    const clean = (url || "").split("?")[0].toLowerCase();
    if (clean.endsWith(".mp4") || clean.endsWith(".webm") || clean.endsWith(".mov")) return "video";
    if (clean.endsWith(".jpg") || clean.endsWith(".jpeg") || clean.endsWith(".png") || clean.endsWith(".gif") || clean.endsWith(".webp")) return "image";
    return "image";
}

function parseMediaList(srcString) {
    return (srcString || "")
        .split("|")
        .map(s => s.trim())
        .filter(Boolean)
        .map(url => ({ url, type: getMediaType(url) }));
}

function parsePipeList(value) {
    return (value || "")
        .split("|")
        .map(s => s.trim())
        .filter(Boolean);
}

function renderInfoGallery(tile) {
    if (!infoGallerySectionEl || !infoGalleryEl) return;

    const processImages = parsePipeList(tile.dataset.processImages);
    const processCaptions = parsePipeList(tile.dataset.processCaptions);

    const supportImages = parsePipeList(tile.dataset.supportImages);
    const supportCaptions = parsePipeList(tile.dataset.supportCaptions);

    const processHeading = tile.dataset.processHeading || "Process";
    const supportHeading = tile.dataset.supportHeading || "Supporting Images";

    const isCardsSpecial = tile.dataset.layout === "cards-special";
    const infoSliderImages = parsePipeList(tile.dataset.infoSliderImages);
    const infoSliderCaptions = parsePipeList(tile.dataset.infoSliderCaptions);
    const loopImages = parsePipeList(tile.dataset.cardsLoopImages);
    const loopCaptions = parsePipeList(tile.dataset.cardsLoopCaptions);

    infoGalleryEl.innerHTML = "";

    const hasGallery =
        processImages.length > 0 ||
        supportImages.length > 0 ||
        infoSliderImages.length > 0 ||
        loopImages.length > 0;

    infoGallerySectionEl.hidden = !hasGallery;
    if (!hasGallery) return;

    if (isCardsSpecial) {
        const wrapper = document.createElement("div");
        wrapper.className = "cards-special";

        const storyText = tile.dataset.story || "";

        if (infoSliderImages.length) {
            const slider = document.createElement("section");
            slider.className = "cards-special__info-slider";

            const viewport = document.createElement("div");
            viewport.className = "cards-special__info-viewport";

            const img = document.createElement("img");
            img.className = "cards-special__info-image";
            img.alt = tile.dataset.title || "Artwork image";

            const prevBtn = document.createElement("button");
            prevBtn.type = "button";
            prevBtn.className = "cards-special__info-nav cards-special__info-nav--prev";
            prevBtn.setAttribute("aria-label", "Previous image");
            prevBtn.innerHTML = "‹";

            const nextBtn = document.createElement("button");
            nextBtn.type = "button";
            nextBtn.className = "cards-special__info-nav cards-special__info-nav--next";
            nextBtn.setAttribute("aria-label", "Next image");
            nextBtn.innerHTML = "›";

            const dots = document.createElement("div");
            dots.className = "cards-special__info-dots";

            let infoIndex = 0;

            function updateInfoSlider() {
                img.src = infoSliderImages[infoIndex];
                img.alt = infoSliderCaptions[infoIndex] || `Artwork image ${infoIndex + 1}`;

                Array.from(dots.children).forEach((dot, idx) => {
                    dot.classList.toggle("is-active", idx === infoIndex);
                });
            }

            infoSliderImages.forEach((_, idx) => {
                const dot = document.createElement("button");
                dot.type = "button";
                dot.className = "cards-special__info-dot";
                dot.setAttribute("aria-label", `Go to image ${idx + 1}`);
                dot.addEventListener("click", () => {
                    infoIndex = idx;
                    updateInfoSlider();
                });
                dots.appendChild(dot);
            });

            prevBtn.addEventListener("click", () => {
                infoIndex = (infoIndex - 1 + infoSliderImages.length) % infoSliderImages.length;
                updateInfoSlider();
            });

            nextBtn.addEventListener("click", () => {
                infoIndex = (infoIndex + 1) % infoSliderImages.length;
                updateInfoSlider();
            });

            viewport.appendChild(img);
            slider.appendChild(viewport);
            slider.appendChild(prevBtn);
            slider.appendChild(nextBtn);
            slider.appendChild(dots);

            updateInfoSlider();
            wrapper.appendChild(slider);
        }

        if (storyText) {
            const textBlock = document.createElement("div");
            textBlock.className = "cards-special__copy";

            const section = document.createElement("section");
            section.className = "lightbox__section";

            const heading = document.createElement("h4");
            heading.textContent = "The story";

            const body = document.createElement("p");
            body.className = "lightbox__body-copy";
            body.innerHTML = storyText.replace(/\|\|/g, "<br><br>");

            section.appendChild(heading);
            section.appendChild(body);
            textBlock.appendChild(section);
            wrapper.appendChild(textBlock);
        }

        if (loopImages.length) {
            const carousel = document.createElement("section");
            carousel.className = "cards-special__carousel";

            const viewport = document.createElement("div");
            viewport.className = "cards-special__viewport";

            const track = document.createElement("div");
            track.className = "cards-special__track";

            const items = loopImages.map((src, idx) => ({
                src,
                caption: loopCaptions[idx] || `Card ${idx + 1}`
            }));

            const duplicated = [...items, ...items];

            duplicated.forEach((item) => {
                const figure = document.createElement("figure");
                figure.className = "cards-special__slide";

                const image = document.createElement("img");
                image.src = item.src;
                image.alt = item.caption;
                image.loading = "lazy";

                const figcaption = document.createElement("figcaption");
                figcaption.textContent = item.caption;

                figure.appendChild(image);
                figure.appendChild(figcaption);
                track.appendChild(figure);
            });

            viewport.appendChild(track);
            carousel.appendChild(viewport);
            wrapper.appendChild(carousel);

            requestAnimationFrame(() => {
                let baseSpeed = 1.1;
                let position = 0;
                let paused = false;
                let isDragging = false;
                let startX = 0;
                let startPosition = 0;

                const originalCount = items.length;
                const slides = Array.from(track.children);

                function getGapValue() {
                    const styles = window.getComputedStyle(track);
                    return parseFloat(styles.columnGap || styles.gap || 0) || 0;
                }

                function getLoopWidth() {
                    let total = 0;
                    for (let i = 0; i < originalCount; i++) {
                        total += slides[i].offsetWidth;
                    }
                    total += (originalCount - 1) * getGapValue();
                    return total;
                }

                let loopWidth = getLoopWidth();

                function updateTrack() {
                    track.style.transform = `translateX(${position}px)`;
                }

                function normalizePosition() {
                    while (position > 0) position -= loopWidth;
                    while (Math.abs(position) >= loopWidth) position += loopWidth;
                }

                function animate() {
                    if (!paused && !isDragging) {
                        position -= baseSpeed;
                        normalizePosition();
                        updateTrack();
                    }
                    requestAnimationFrame(animate);
                }

                carousel.addEventListener("mouseenter", () => {
                    paused = true;
                });

                carousel.addEventListener("mouseleave", () => {
                    paused = false;
                });

                carousel.addEventListener("pointerdown", (e) => {
                    isDragging = true;
                    carousel.classList.add("is-dragging");
                    startX = e.clientX;
                    startPosition = position;
                    if (carousel.setPointerCapture) carousel.setPointerCapture(e.pointerId);
                });

                carousel.addEventListener("pointermove", (e) => {
                    if (!isDragging) return;
                    const dx = e.clientX - startX;
                    position = startPosition + dx;
                    normalizePosition();
                    updateTrack();
                });

                function endDrag() {
                    isDragging = false;
                    carousel.classList.remove("is-dragging");
                    normalizePosition();
                    updateTrack();
                }

                carousel.addEventListener("pointerup", endDrag);
                carousel.addEventListener("pointercancel", endDrag);

                carousel.addEventListener("wheel", (e) => {
                    e.preventDefault();
                    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
                    position -= delta * 0.9;
                    normalizePosition();
                    updateTrack();
                }, { passive: false });

                window.addEventListener("resize", () => {
                    loopWidth = getLoopWidth();
                    normalizePosition();
                    updateTrack();
                });

                updateTrack();
                animate();
            });
        }

        infoGalleryEl.appendChild(wrapper);
        return;
    }

    function createGallerySection(headingText, images, captions) {
        if (!images.length) return;

        const section = document.createElement("section");
        section.className = "lightbox__section lightbox__section--gallery-block";

        const heading = document.createElement("h4");
        heading.textContent = headingText;
        section.appendChild(heading);

        const grid = document.createElement("div");
        grid.className = "lightbox__process-grid";

        images.forEach((src, idx) => {
            const figure = document.createElement("figure");
            figure.className = "lightbox__process-card";

            const img = document.createElement("img");
            img.src = src;
            img.alt = captions[idx] || `${tile.dataset.title || "Artwork"} image ${idx + 1}`;
            img.loading = "lazy";
            figure.appendChild(img);

            if (captions[idx]) {
                const cap = document.createElement("figcaption");
                cap.textContent = captions[idx];
                figure.appendChild(cap);
            }

            grid.appendChild(figure);
        });

        section.appendChild(grid);
        infoGalleryEl.appendChild(section);
    }

    createGallerySection(processHeading, processImages, processCaptions);
    createGallerySection(supportHeading, supportImages, supportCaptions);
}

// =========================
// GALLERY TILE AUTO-PREVIEW (cycles thumbnail for multi-image tiles)
// =========================
(function tileAutoPreview() {
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;

    const featuredTiles = Array.from(document.querySelectorAll(".gallery .tile[data-src]"));
    const libraryTiles = Array.from(document.querySelectorAll(".artwork-library .tile[data-src]"));
    const tiles = [...featuredTiles, ...libraryTiles];
    if (!tiles.length) return;

    const FADE_MS = 500;
    const INTERVAL_MS = 4000;

    const state = new Map();

    function getImageUrls(tile) {
        const list = parseMediaList(tile.dataset.src || "");
        return list.filter(x => x.type === "image").map(x => x.url);
    }

    function start(tile) {
        const s = state.get(tile);
        if (!s || s.timer || s.list.length <= 1) return;

        s.timer = window.setInterval(() => {
            s.idx = (s.idx + 1) % s.list.length;
            s.img.classList.add("is-fading");
            window.setTimeout(() => {
                s.img.src = s.list[s.idx];
                s.img.classList.remove("is-fading");
            }, FADE_MS);
        }, INTERVAL_MS);
    }

    function stop(tile) {
        const s = state.get(tile);
        if (!s || !s.timer) return;
        clearInterval(s.timer);
        s.timer = null;
    }

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const tile = entry.target;
            if (entry.isIntersecting) start(tile);
            else stop(tile);
        });
    }, { threshold: 0.35 });

    tiles.forEach(tile => {
        const img = tile.querySelector("img");
        if (!img) return;

        const list = getImageUrls(tile);
        if (list.length <= 1) return;

        state.set(tile, { list, idx: 0, timer: null, img });

        io.observe(tile);

        tile.addEventListener("mouseenter", () => stop(tile));
        tile.addEventListener("mouseleave", () => start(tile));
        tile.addEventListener("focusin", () => stop(tile));
        tile.addEventListener("focusout", () => start(tile));
    });

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            tiles.forEach(stop);
        } else {
            tiles.forEach(tile => start(tile));
        }
    });
})();

// ---------- elements ----------
const lightbox = document.getElementById("lightbox");
const imgEl = document.getElementById("lightboxImg");
const titleEl = document.getElementById("lightboxTitle");
const subEl = document.getElementById("lightboxSub");
const descEl = document.getElementById("lightboxDesc");
const storyEl = document.getElementById("lightboxStory");
const infoGallerySectionEl = document.getElementById("lightboxInfoGallerySection");
const infoGalleryEl = document.getElementById("lightboxInfoGallery");
const kickerEl = document.getElementById("lightboxKicker");
const chipsEl = document.getElementById("lightboxChips");
const lightboxBodyEl = document.querySelector(".lightbox__body");

const lightboxStorySectionEl = document.getElementById("lightboxStorySection");

const featuredTiles = Array.from(document.querySelectorAll(".gallery .tile[data-src]"));
const libraryTiles = Array.from(document.querySelectorAll(".artwork-library .tile[data-src]"));
const tiles = [...featuredTiles, ...libraryTiles];

// NEW: motion projects use same lightbox
const motionProjects = Array.from(document.querySelectorAll(".motion-project[data-src]"));
const allProjectTiles = [...tiles, ...motionProjects];

const prevBtn = document.querySelector(".lightbox__nav--prev");
const nextBtn = document.querySelector(".lightbox__nav--next");

const zoomBtn = document.getElementById("lightboxZoomBtn");
const mediaWrap = document.querySelector(".lightbox__media");

const mediaPrevBtn = document.querySelector(".media-nav--prev");
const mediaNextBtn = document.querySelector(".media-nav--next");
const mediaDots = document.getElementById("mediaDots");

const vidEl = document.getElementById("lightboxVid");
const panelEl = document.querySelector(".lightbox__panel");

// =========================
// JUKEBOX CAROUSEL (auto + user-controlled)
// =========================
const jukeboxStage = document.getElementById("jukeboxStage");
const jukeboxItems = jukeboxStage ? Array.from(jukeboxStage.querySelectorAll(".jukebox__item")) : [];

let jukeboxIndex = 0;
let jukeboxTimer = null;
let wheelLock = false;

function applyJukeboxClasses() {
    if (!jukeboxItems.length) return;

    jukeboxItems.forEach((item, i) => {
        item.classList.remove("is-front", "is-left", "is-right", "is-back-left", "is-back-right");

        const offset = (i - jukeboxIndex + jukeboxItems.length) % jukeboxItems.length;

        if (offset === 0) item.classList.add("is-front");
        else if (offset === 1) item.classList.add("is-right");
        else if (offset === jukeboxItems.length - 1) item.classList.add("is-left");
        else if (offset === 2) item.classList.add("is-back-right");
        else if (offset === jukeboxItems.length - 2) item.classList.add("is-back-left");
        else {
            item.style.opacity = "0";
            item.style.pointerEvents = "none";
            return;
        }

        item.style.opacity = "";
        item.style.pointerEvents = "";
    });
}

function jukeboxGo(delta) {
    jukeboxIndex = (jukeboxIndex + delta + jukeboxItems.length) % jukeboxItems.length;
    applyJukeboxClasses();
}

function startJukebox() {
    if (!jukeboxItems.length) return;
    stopJukebox();
    jukeboxTimer = setInterval(() => jukeboxGo(1), 3200);
}

function stopJukebox() {
    if (jukeboxTimer) clearInterval(jukeboxTimer);
    jukeboxTimer = null;
}

if (jukeboxItems.length) {
    applyJukeboxClasses();
    startJukebox();

    jukeboxItems.forEach((item, i) => {
        item.addEventListener("click", () => {
            jukeboxIndex = i;
            applyJukeboxClasses();
            startJukebox();
        });
    });

    jukeboxStage.addEventListener("mouseenter", stopJukebox);
    jukeboxStage.addEventListener("mouseleave", startJukebox);

    jukeboxStage.addEventListener("wheel", (e) => {
        const mostlyHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
        const allowCarouselWheel = e.shiftKey || mostlyHorizontal;

        if (!allowCarouselWheel) return;

        e.preventDefault();

        if (wheelLock) return;
        wheelLock = true;
        setTimeout(() => (wheelLock = false), 250);

        const v = mostlyHorizontal ? e.deltaX : e.deltaY;

        if (v > 0) jukeboxGo(1);
        else jukeboxGo(-1);

        startJukebox();
    }, { passive: false });

    let touchStartX = 0;
    let touchStartY = 0;

    jukeboxStage.addEventListener("touchstart", (e) => {
        if (!e.touches || !e.touches[0]) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        stopJukebox();
    }, { passive: true });

    jukeboxStage.addEventListener("touchend", (e) => {
        const t = e.changedTouches && e.changedTouches[0];
        if (!t) { startJukebox(); return; }

        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;

        if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) jukeboxGo(1);
            else jukeboxGo(-1);
        }

        startJukebox();
    }, { passive: true });
}

// ---------- state ----------
let lastFocused = null;
let currentIndex = 0;
let activeTileIndices = featuredTiles.map(tile => allProjectTiles.indexOf(tile));

let isZoomed = false;
let dragging = false;
let startX = 0, startY = 0;
let offsetX = 0, offsetY = 0;
const ZOOM_SCALE = 2;

let slides = [];
let slideIndex = 0;

function getActiveIndices() {
    return activeTileIndices && activeTileIndices.length
        ? activeTileIndices
        : allProjectTiles.map((_, idx) => idx);
}

function getProjectGlobalIndex(tile) {
    return allProjectTiles.indexOf(tile);
}

function getGlobalIndexFromFeaturedIndex(featuredIdx) {
    const tile = featuredTiles[featuredIdx];
    return getProjectGlobalIndex(tile);
}

// ---------- core render ----------
function renderFromIndex(i) {
    const tile = allProjectTiles[i];
    if (!tile) return;

    const srcString = tile.dataset.src || "";
    slides = parseMediaList(srcString);
    slideIndex = 0;

    const thumb = tile.querySelector("img")?.getAttribute("src");
    if (!slides.length && thumb) {
        slides = [{ url: thumb, type: getMediaType(thumb) }];
    }

    buildDots();
    showSlide(0);

    const hasMultiple = slides.length > 1;
    if (mediaPrevBtn) mediaPrevBtn.style.display = hasMultiple ? "grid" : "none";
    if (mediaNextBtn) mediaNextBtn.style.display = hasMultiple ? "grid" : "none";
    if (mediaDots) mediaDots.style.display = hasMultiple ? "flex" : "none";

    const desc = tile.dataset.desc || "";
    const story = tile.dataset.story || desc || "This piece can hold a longer narrative, memory, or artist reflection.";
    const details = (tile.dataset.details || "")
        .split("•")
        .map(s => s.trim())
        .filter(Boolean);

    titleEl.textContent = tile.dataset.title || "";
    subEl.textContent = [tile.dataset.year, tile.dataset.medium].filter(Boolean).join(" • ");

    descEl.innerHTML = (desc || "")
        .split("||")
        .map(p => `<p>${p.trim()}</p>`)
        .join("");

    const isCardsSpecial = tile.dataset.layout === "cards-special";

    if (lightboxBodyEl) {
        lightboxBodyEl.classList.toggle("is-cards-special", isCardsSpecial);
    }

    if (isCardsSpecial) {
        storyEl.innerHTML = "";
        if (lightboxStorySectionEl) {
            lightboxStorySectionEl.style.display = "none";
        }
    } else {
        storyEl.innerHTML = story
            .split("||")
            .map(p => `<p>${p.trim()}</p>`)
            .join("");
        if (lightboxStorySectionEl) {
            lightboxStorySectionEl.style.display = story.trim() ? "" : "none";
        }
    }

    renderInfoGallery(tile);

    kickerEl.textContent = tile.dataset.series || tile.dataset.year || "Featured Work";

    chipsEl.innerHTML = "";
    details.forEach((detail) => {
        const chip = document.createElement("span");
        chip.textContent = detail;
        chipsEl.appendChild(chip);
    });
}

// ---------- open / close ----------
function openAtIndex(i, options = {}) {
    lastFocused = document.activeElement;
    currentIndex = i;

    if (Array.isArray(options.activeIndices)) {
        activeTileIndices = options.activeIndices.slice();
    }

    renderFromIndex(currentIndex);

    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    imgEl.src = "";
    document.body.style.overflow = "";
    resetZoom();

    if (vidEl) {
        vidEl.pause();
        vidEl.removeAttribute("src");
        vidEl.load();
        vidEl.style.display = "none";
    }

    if (lightboxBodyEl) {
        lightboxBodyEl.classList.remove("is-cards-special");
    }

    if (lightboxStorySectionEl) {
        lightboxStorySectionEl.style.display = "";
    }

    if (infoGallerySectionEl) {
        infoGallerySectionEl.hidden = true;
    }

    if (infoGalleryEl) {
        infoGalleryEl.innerHTML = "";
    }

    if (lastFocused) lastFocused.focus();
}

// ---------- open on featured artwork click ----------
featuredTiles.forEach((tile, idx) => {
    tile.addEventListener("click", () => {
        const featuredGlobalIndices = featuredTiles.map(item => getProjectGlobalIndex(item));
        openAtIndex(getGlobalIndexFromFeaturedIndex(idx), {
            activeIndices: featuredGlobalIndices
        });
    });
});

// ---------- NEW: motion project button click ----------
motionProjects.forEach((project) => {
    const button = project.querySelector(".motion__btn");

    if (!button) return;

    button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const motionIndices = motionProjects.map(item => getProjectGlobalIndex(item));
        const projectIndex = getProjectGlobalIndex(project);

        openAtIndex(projectIndex, {
            activeIndices: motionIndices
        });
    });
});

// close on backdrop/close button
lightbox.addEventListener("click", (e) => {
    const closeTarget = e.target.closest('[data-close="true"]');
    if (closeTarget) closeLightbox();
});

// ---------- project collections ----------
const projectCards = Array.from(document.querySelectorAll(".card--project"));
const projectOverlay = document.getElementById("projectOverlay");
const projectOverlayTitle = document.getElementById("projectOverlayTitle");
const projectOverlayDesc = document.getElementById("projectOverlayDesc");
const projectOverlayTools = document.getElementById("projectOverlayTools");
const projectOverlayGrid = document.getElementById("projectOverlayGrid");

let projectLastFocused = null;

function closeProjectOverlay({ restoreFocus = true } = {}) {
    if (!projectOverlay) return;
    projectOverlay.classList.remove("is-open");
    projectOverlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (restoreFocus && projectLastFocused) projectLastFocused.focus();
}

function openProjectOverlay(card) {
    if (!projectOverlay || !card) return;

    projectLastFocused = document.activeElement;
    const collection = card.dataset.projectCollection || "";
    const matches = tiles
        .map((tile) => ({ tile, idx: getProjectGlobalIndex(tile) }))
        .filter(({ tile }) => tile.dataset.collection === collection);

    const collectionIndices = matches.map(({ idx }) => idx);
    activeTileIndices = collectionIndices.slice();

    projectOverlayTitle.textContent = card.dataset.projectTitle || "Collection";
    projectOverlayDesc.textContent = card.dataset.projectDesc || "";
    projectOverlayTools.textContent = card.dataset.projectTools || "";

    projectOverlayGrid.innerHTML = "";

    matches.forEach(({ tile, idx }) => {
        const media = parseMediaList(tile.dataset.src || "");
        const firstImage = media.find((item) => item.type === "image")?.url || tile.querySelector("img")?.getAttribute("src") || "";

        const cardBtn = document.createElement("button");
        cardBtn.type = "button";
        cardBtn.className = "project-piece";
        cardBtn.innerHTML = `
          <div class="project-piece__thumb">
            <img src="${firstImage}" alt="${tile.dataset.title || ""}">
          </div>
          <div class="project-piece__meta">
            <h4>${tile.dataset.title || ""}</h4>
            <p>${[tile.dataset.year, tile.dataset.medium].filter(Boolean).join(" • ")}</p>
          </div>
        `;

        cardBtn.addEventListener("click", () => {
            closeProjectOverlay({ restoreFocus: false });
            openAtIndex(idx, { activeIndices: collectionIndices });
        });

        projectOverlayGrid.appendChild(cardBtn);
    });

    if (!matches.length) {
        const empty = document.createElement("p");
        empty.className = "project-overlay__empty";
        empty.textContent = "Add artworks with matching data-collection values to show them here.";
        projectOverlayGrid.appendChild(empty);
    }

    projectOverlay.classList.add("is-open");
    projectOverlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

projectCards.forEach((card) => {
    card.addEventListener("click", () => openProjectOverlay(card));
});

projectOverlay?.addEventListener("click", (e) => {
    const closeTarget = e.target.closest('[data-project-close="true"]');
    if (closeTarget) closeProjectOverlay();
});

// ---------- INNER (within artwork) navigation ----------
if (mediaPrevBtn) {
    mediaPrevBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        showSlide(slideIndex - 1);
    });
}

if (mediaNextBtn) {
    mediaNextBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        showSlide(slideIndex + 1);
    });
}

// ---------- OUTER (gallery / motion project) navigation ----------
function prevArtwork() {
    const activeIndices = getActiveIndices();
    const currentPos = Math.max(0, activeIndices.indexOf(currentIndex));
    const nextPos = (currentPos - 1 + activeIndices.length) % activeIndices.length;
    currentIndex = activeIndices[nextPos];
    renderFromIndex(currentIndex);
}

function nextArtwork() {
    const activeIndices = getActiveIndices();
    const currentPos = Math.max(0, activeIndices.indexOf(currentIndex));
    const nextPos = (currentPos + 1) % activeIndices.length;
    currentIndex = activeIndices[nextPos];
    renderFromIndex(currentIndex);
}

prevBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    prevArtwork();
});

nextBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    nextArtwork();
});

// keyboard
document.addEventListener("keydown", (e) => {
    const lightboxOpen = lightbox.classList.contains("is-open");
    const projectOpen = projectOverlay?.classList.contains("is-open");
    const sketchOpen = sketchOverlay?.classList.contains("active");

    if (!lightboxOpen && !projectOpen && !sketchOpen) return;

    if (e.key === "Escape") {
        if (lightboxOpen) closeLightbox();
        else if (projectOpen) closeProjectOverlay();
        else if (sketchOpen) closeSketchOverlay();
        return;
    }

    if (!lightboxOpen) return;
    if (e.key === "ArrowLeft") prevArtwork();
    if (e.key === "ArrowRight") nextArtwork();
});

// ---------- zoom ----------
function applyZoomTransform() {
    imgEl.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${ZOOM_SCALE})`;
}

function setZoom(on) {
    isZoomed = on;
    mediaWrap.classList.toggle("is-zoomed", on);

    if (!on) {
        offsetX = 0;
        offsetY = 0;
        imgEl.style.transform = "";
    } else {
        applyZoomTransform();
    }
}

function resetZoom() {
    setZoom(false);
}

function toggleZoom() {
    if (imgEl.style.display === "none") return;
    setZoom(!isZoomed);
}

zoomBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleZoom();
});

imgEl?.addEventListener("dblclick", (e) => {
    e.preventDefault();
    toggleZoom();
});

// ---------- drag to pan (bounded) ----------
imgEl?.addEventListener("mousedown", (e) => {
    if (!isZoomed) return;
    dragging = true;
    startX = e.clientX - offsetX;
    startY = e.clientY - offsetY;
});

window.addEventListener("mousemove", (e) => {
    if (!dragging || !isZoomed) return;

    const containerRect = mediaWrap.getBoundingClientRect();
    const scaledW = imgEl.naturalWidth * ZOOM_SCALE;
    const scaledH = imgEl.naturalHeight * ZOOM_SCALE;

    const maxX = Math.max(0, (scaledW - containerRect.width) / 2);
    const maxY = Math.max(0, (scaledH - containerRect.height) / 2);

    offsetX = clamp(e.clientX - startX, -maxX, maxX);
    offsetY = clamp(e.clientY - startY, -maxY, maxY);

    applyZoomTransform();
});

window.addEventListener("mouseup", () => {
    dragging = false;
});

// ---------- footer year ----------
const yearEl = document.getElementById("year");
if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
}

// Prevent refresh from jumping to last hash
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', () => {
        setTimeout(() => {
            history.replaceState(null, "", window.location.pathname + window.location.search);
        }, 50);
    });
});

// ---------- legacy motion single-video hook ----------
const motionVid = document.getElementById("motionVid");
if (motionVid) {
    motionVid.addEventListener("play", () => {
        motionVid.loop = true;
    });

    motionVid.addEventListener("pause", () => {
        motionVid.loop = false;
    });
}

// ---------- compact header ----------
const header = document.querySelector(".artist-header");
let isCompact = false;
let ticking = false;

function updateHeaderCompact() {
    if (!header) return;

    const y = window.scrollY;

    if (!isCompact && y > 80) {
        isCompact = true;
        header.classList.add("is-compact");
    } else if (isCompact && y < 30) {
        isCompact = false;
        header.classList.remove("is-compact");
    }
}

function onScroll() {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            updateHeaderCompact();
            ticking = false;
        });
        ticking = true;
    }
}

updateHeaderCompact();
window.addEventListener("scroll", onScroll, { passive: true });

// ---------- sketch overlay ----------
const sketchOverlay = document.getElementById("sketchOverlay");
const openSketchOverlayBtn = document.getElementById("openSketchOverlay");
const closeSketchOverlayBtn = document.getElementById("closeSketchOverlay");

function openSketchOverlay() {
    if (!sketchOverlay) return;
    sketchOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeSketchOverlay() {
    if (!sketchOverlay) return;
    sketchOverlay.classList.remove("active");
    document.body.style.overflow = "";
}

if (openSketchOverlayBtn) {
    openSketchOverlayBtn.addEventListener("click", openSketchOverlay);
}

if (closeSketchOverlayBtn) {
    closeSketchOverlayBtn.addEventListener("click", closeSketchOverlay);
}

if (sketchOverlay) {
    sketchOverlay.addEventListener("click", (e) => {
        if (e.target === sketchOverlay) closeSketchOverlay();
    });
}

// =========================
// MOTION VIDEOS: autoplay when in view, pause when out of view
// =========================
(function motionAutoPlayOnScroll() {
    const videos = Array.from(document.querySelectorAll(".motion-auto-video"));
    if (!videos.length) return;

    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;

    videos.forEach((video) => {
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.autoplay = true;
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const video = entry.target;

            if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
                const playPromise = video.play();
                if (playPromise && typeof playPromise.catch === "function") {
                    playPromise.catch(() => { });
                }
            } else {
                video.pause();
                video.currentTime = 0;
            }
        });
    }, {
        threshold: [0, 0.45, 0.75]
    });

    videos.forEach((video) => observer.observe(video));

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            videos.forEach((video) => video.pause());
        }
    });
})();