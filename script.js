let sentiment = null;
let modelReady = false;
let processingTimer = null;
let currentDream = "";
let currentConfidence = 0.5;

const moodThemes = {
    positive: {
        background: [
            "radial-gradient(1000px circle at var(--mx) var(--my), rgba(255, 211, 106, 0.18), transparent 42%)",
            "radial-gradient(900px circle at 18% 12%, rgba(255, 123, 200, 0.10), transparent 28%)",
            "linear-gradient(180deg, #05030c 0%, #0d0813 50%, #05030c 100%)"
        ].join(", "),
        accent: "#ffd56a",
        accent2: "#ff7ab8"
    },
    neutral: {
        background: [
            "radial-gradient(1000px circle at var(--mx) var(--my), rgba(155, 135, 255, 0.18), transparent 42%)",
            "radial-gradient(900px circle at 18% 12%, rgba(255, 123, 200, 0.10), transparent 28%)",
            "linear-gradient(180deg, #05030c 0%, #0a0814 50%, #05030c 100%)"
        ].join(", "),
        accent: "#8fd6ff",
        accent2: "#b08cff"
    },
    negative: {
        background: [
            "radial-gradient(1000px circle at var(--mx) var(--my), rgba(122, 160, 255, 0.16), transparent 42%)",
            "radial-gradient(900px circle at 18% 12%, rgba(51, 75, 157, 0.18), transparent 28%)",
            "linear-gradient(180deg, #05030c 0%, #04050d 50%, #020208 100%)"
        ].join(", "),
        accent: "#7aa0ff",
        accent2: "#334b9d"
    }
};

const symbolMap = [
    { label: "moon", keys: ["moon", "moons", "lunar"] },
    { label: "ocean", keys: ["ocean", "sea", "water", "wave", "waves", "river", "lake"] },
    { label: "forest", keys: ["forest", "tree", "trees", "woods", "woodland"] },
    { label: "city", keys: ["city", "cities", "building", "buildings", "tower", "palace", "library", "bridge"] },
    { label: "stars", keys: ["star", "stars", "constellation", "sky", "cosmic"] },
    { label: "mirror", keys: ["mirror", "mirrors", "glass", "reflection", "reflections"] },
    { label: "falling", keys: ["fall", "falling", "drop", "dropping"] },
    { label: "flight", keys: ["fly", "flying", "flight", "float", "floating", "soar", "hover"] },
    { label: "darkness", keys: ["dark", "darkness", "black", "void", "alone", "empty", "lost"] },
    { label: "connection", keys: ["friend", "friends", "family", "together", "crowd", "laughing"] },
    { label: "motion", keys: ["running", "moving", "chasing", "driving", "drift", "drifting"] },
    { label: "transformation", keys: ["change", "shifting", "morph", "morphing", "becoming"] }
];

document.addEventListener("DOMContentLoaded", () => {
    const beginButton = document.getElementById("beginButton");
    const interpretButton = document.getElementById("interpretButton");
    const dreamInput = document.getElementById("dreamInput");
    const introCard = document.getElementById("introCard");

    beginButton.addEventListener("click", () => {
        document.body.classList.remove("intro-state");
        document.body.classList.add("ready");
        introCard.classList.add("dismissed");

        window.setTimeout(() => {
            introCard.style.display = "none";
        }, 820);

        dreamInput.focus();
    });

    interpretButton.addEventListener("click", analyseDream);

    dreamInput.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            analyseDream();
        }
    });

    setupCursor();
    buildParticles();
    setupModel();

    window.addEventListener("resize", () => {
        if (currentDream && !document.getElementById("results").classList.contains("hidden")) {
            renderCircleDream(currentDream, currentConfidence);
        }
    });
});

async function setupModel() {
    try {
        sentiment = await ml5.sentiment("movieReviews");
        modelReady = true;
        console.log("Model ready");
    } catch (error) {
        console.error("Failed to load model:", error);
        alert("The ML model failed to load. Check the console.");
    }
}

function setupCursor() {
    document.addEventListener("pointermove", (event) => {
        document.documentElement.style.setProperty("--mx", `${event.clientX}px`);
        document.documentElement.style.setProperty("--my", `${event.clientY}px`);
    });
}

function buildParticles() {
    const container = document.getElementById("particles");
    const count = 34;

    for (let index = 0; index < count; index += 1) {
        const particle = document.createElement("span");
        particle.className = "particle";
        particle.style.setProperty("--left", `${Math.random() * 100}%`);
        particle.style.setProperty("--top", `${Math.random() * 100}%`);
        particle.style.setProperty("--size", `${2 + Math.random() * 4}px`);
        particle.style.setProperty("--duration", `${8 + Math.random() * 10}s`);
        particle.style.setProperty("--delay", `${Math.random() * 6}s`);
        container.appendChild(particle);
    }
}

async function analyseDream() {
    const dreamInput = document.getElementById("dreamInput");
    const dream = dreamInput.value.trim();

    if (!dream) {
        alert("Please describe a dream first.");
        return;
    }

    if (!modelReady || !sentiment) {
        alert("The model is still loading. Try again in a moment.");
        return;
    }

    currentDream = dream;

    const loadingScreen = document.getElementById("loadingScreen");
    loadingScreen.classList.remove("hidden");

    clearLayer("codeField");
    renderProcessingLog(dream);
    spawnCodeFragments(dream);

    await sleep(2200);

    const prediction = await sentiment.predict(dream);
    const confidence = prediction && typeof prediction.confidence === "number"
        ? prediction.confidence
        : (prediction && typeof prediction.score === "number" ? prediction.score : 0.5);

    currentConfidence = confidence;

    const mood = classifyMood(confidence);
    applyTheme(mood.key);

    const results = document.getElementById("results");
    results.classList.remove("hidden");

    renderCircleDream(dream, confidence);

    loadingScreen.classList.add("hidden");
    clearLayer("codeField");

    results.scrollIntoView({ behavior: "smooth", block: "start" });
}

function classifyMood(confidence) {
    if (confidence >= 0.66) {
        return {
            key: "positive",
            label: "Luminous / Optimistic"
        };
    }

    if (confidence >= 0.34) {
        return {
            key: "neutral",
            label: "Reflective / Ambiguous"
        };
    }

    return {
        key: "negative",
        label: "Tense / Anxious"
    };
}

function applyTheme(moodKey) {
    const theme = moodThemes[moodKey] || moodThemes.neutral;

    document.body.dataset.mood = moodKey;
    document.body.style.background = theme.background;
    document.documentElement.style.setProperty("--accent", theme.accent);
    document.documentElement.style.setProperty("--accent2", theme.accent2);
}

function renderProcessingLog(dream) {
    const processingLog = document.getElementById("processingLog");
    const tokens = getDreamTokens(dream).slice(0, 6);

    const lines = [
        "const memory = input.buffer();",
        "const fragments = tokenize(\"" + (tokens[0] || "dream") + "\");",
        "let latent = fold(fragments);",
        "signal = predict_pattern(latent);",
        "scene = reconstruct(signal);",
        "emit(scene);"
    ];

    let step = 0;

    clearInterval(processingTimer);
    processingLog.textContent = "";

    processingTimer = setInterval(() => {
        const visible = lines.slice(0, Math.min(step + 1, lines.length));

        if (step > 2) {
            visible.push(randomBinaryLine());
        }

        processingLog.textContent = visible.join("\n");
        step += 1;

        if (step > lines.length + 6) {
            step = 0;
        }
    }, 150);
}

function spawnCodeFragments(dream) {
    const container = document.getElementById("codeField");
    const tokens = getDreamTokens(dream);

    const fragments = [
        "INPUT_RECEIVED",
        "TOKENISE()",
        "PARSING",
        "SIMULATING_THOUGHT",
        "RECONSTRUCTING",
        "PATCH::MEMORY",
        "NEURAL_TRACE",
        "OUTPUT_PENDING",
        "signal -> form",
        "latent_space++",
        "fold(fragment)",
        "decode(pattern)"
    ];

    tokens.slice(0, 6).forEach((token) => {
        fragments.push("> " + token.toUpperCase());
    });

    fragments.slice(0, 14).forEach((text) => {
        const fragment = document.createElement("span");
        fragment.className = "code-fragment";
        fragment.textContent = text;
        fragment.style.setProperty("--x", `${8 + Math.random() * 84}vw`);
        fragment.style.setProperty("--y", `${10 + Math.random() * 72}vh`);
        fragment.style.setProperty("--size", `${0.78 + Math.random() * 0.62}rem`);
        fragment.style.setProperty("--duration", `${2.2 + Math.random() * 1.8}s`);
        fragment.style.animationDelay = `${Math.random() * 0.35}s`;
        container.appendChild(fragment);
    });
}

function renderCircleDream(dream, confidence) {
    const canvas = document.getElementById("dreamCanvas");
    const ctx = canvas.getContext("2d");

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();

    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.style.display = "block";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const cols = 42;
    const rows = 26;
    const spacingX = rect.width / cols;
    const spacingY = rect.height / rows;

    const lower = dream.toLowerCase();
    const active = buildPatternCells(lower, cols, rows, confidence);

    drawBaseGrid(ctx, cols, rows, spacingX, spacingY);

    animateFill(ctx, active, spacingX, spacingY, rect.width, rect.height);
}

function drawBaseGrid(ctx, cols, rows, spacingX, spacingY) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.22)";

    for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
            const px = (x + 0.5) * spacingX;
            const py = (y + 0.5) * spacingY;
            ctx.beginPath();
            ctx.arc(px, py, 3.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
}

function animateFill(ctx, activeCells, spacingX, spacingY, width, height) {
    const unique = dedupeCells(activeCells);
    const totalFrames = 42;
    let frame = 0;

    function drawFrame() {
        ctx.clearRect(0, 0, width, height);
        drawBaseGrid(ctx, 42, 26, spacingX, spacingY);

        const visibleCount = Math.floor((unique.length * frame) / totalFrames);

        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.18)";
        ctx.lineWidth = 1;

        for (let index = 0; index < visibleCount - 1; index += 1) {
            const a = unique[index];
            const b = unique[index + 1];

            const ax = (a.x + 0.5) * spacingX;
            const ay = (a.y + 0.5) * spacingY;
            const bx = (b.x + 0.5) * spacingX;
            const by = (b.y + 0.5) * spacingY;

            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
        }

        ctx.restore();

        for (let index = 0; index < visibleCount; index += 1) {
            const cell = unique[index];
            const px = (cell.x + 0.5) * spacingX;
            const py = (cell.y + 0.5) * spacingY;

            ctx.save();
            ctx.shadowColor = "rgba(0,0,0,0.18)";
            ctx.shadowBlur = 6;
            ctx.fillStyle = "#000000";
            ctx.beginPath();
            ctx.arc(px, py, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        frame += 1;
        if (frame <= totalFrames) {
            requestAnimationFrame(drawFrame);
        }
    }

    drawFrame();
}

function buildPatternCells(dream, cols, rows, confidence) {
    const cells = [];
    const add = (x, y) => {
        if (x >= 0 && x < cols && y >= 0 && y < rows) {
            cells.push({ x, y });
        }
    };

    const baseDensity = confidence > 0.66 ? 0.16 : confidence > 0.33 ? 0.24 : 0.34;

    // moon clusters
    if (hasAny(dream, ["moon", "moons", "lunar"])) {
        const moonCount = countNumberHints(dream, 3);
        const positions = moonCount === 1 ? [12] : moonCount === 2 ? [10, 28] : [9, 21, 33];
        positions.forEach((cx) => {
            addCluster(add, cx, 5, 3);
        });
    }

    // ocean / waves
    if (hasAny(dream, ["ocean", "sea", "water", "wave", "waves", "river", "lake"])) {
        for (let x = 0; x < cols; x += 1) {
            const baseY = 16 + Math.round(Math.sin(x * 0.45) * 1.4);
            add(x, baseY);
            add(x, baseY + 1);
            if (x % 3 === 0) add(x, baseY + 2);
        }
    }

    // forest / vertical structures
    if (hasAny(dream, ["forest", "tree", "trees", "woods", "woodland"])) {
        for (let x = 3; x < cols; x += 4) {
            for (let y = 8; y < rows - 2; y += 1) {
                add(x, y);
                if (y % 4 === 0) add(x + 1, y);
            }
        }
    }

    // city / blocks
    if (hasAny(dream, ["city", "building", "buildings", "tower", "palace", "library", "bridge", "stairs", "staircase"])) {
        const towers = [
            { x: 4, w: 4, h: 7 },
            { x: 10, w: 5, h: 9 },
            { x: 18, w: 4, h: 6 },
            { x: 25, w: 5, h: 10 },
            { x: 32, w: 4, h: 8 }
        ];

        towers.forEach((t, index) => {
            for (let x = t.x; x < t.x + t.w; x += 1) {
                for (let y = rows - 1; y > rows - 1 - t.h; y -= 1) {
                    add(x, y);
                }
            }

            add(t.x + Math.floor(t.w / 2), rows - 1 - t.h - 1 - (index % 2));
        });
    }

    // stars
    if (hasAny(dream, ["star", "stars", "constellation", "sky", "cosmic"])) {
        for (let i = 0; i < 55; i += 1) {
            add(randInt(0, cols - 1), randInt(0, 6));
        }
    }

    // mirror / symmetry
    if (hasAny(dream, ["mirror", "mirrors", "glass", "reflection", "reflections"])) {
        for (let x = 0; x < Math.floor(cols / 2); x += 1) {
            const y = 6 + (x % 7);
            add(x, y);
            add(cols - 1 - x, y);
            if (x % 3 === 0) {
                add(x, y + 2);
                add(cols - 1 - x, y + 2);
            }
        }
    }

    // falling
    if (hasAny(dream, ["fall", "falling", "drop", "dropping"])) {
        for (let i = 0; i < Math.min(cols, rows); i += 1) {
            const x = i + 4;
            const y = i / 1.6;
            add(Math.round(x), Math.round(y));
            add(Math.round(x) - 1, Math.round(y) + 1);
        }
    }

    // flight / upward movement
    if (hasAny(dream, ["fly", "flying", "flight", "float", "floating", "soar", "hover"])) {
        for (let i = 0; i < 18; i += 1) {
            const x = 5 + i * 2;
            const y = 16 - Math.round(Math.sin(i * 0.25) * 4) - Math.floor(i / 6);
            add(x, y);
            add(x + 1, y - 1);
        }
    }

    // connection / clustered people
    if (hasAny(dream, ["friend", "friends", "family", "together", "crowd", "laughing"])) {
        addCluster(add, 12, 14, 3);
        addCluster(add, 30, 14, 3);
        for (let x = 14; x <= 28; x += 1) {
            add(x, 14);
            if (x % 2 === 0) add(x, 15);
        }
    }

    // anxiety / darkness
    if (hasAny(dream, ["fear", "scared", "anxious", "trapped", "dark", "darkness", "alone", "empty", "lost", "void"])) {
        for (let y = 8; y < rows - 4; y += 1) {
            for (let x = 14; x < 28; x += 1) {
                if (Math.abs(x - 21) + Math.abs(y - 15) < 10) {
                    add(x, y);
                    if ((x + y) % 3 === 0) add(x + 1, y);
                }
            }
        }
    }

    // transformation / ring structures
    if (hasAny(dream, ["change", "shifting", "morph", "morphing", "becoming"])) {
        addRing(add, 21, 13, 7);
    }

    // density based on sentiment
    const targetRandom = Math.floor(cols * rows * baseDensity);
    for (let i = 0; i < targetRandom; i += 1) {
        if (confidence > 0.66) {
            if (Math.random() > 0.55) {
                add(randInt(0, cols - 1), randInt(0, rows - 1));
            }
        } else if (confidence > 0.33) {
            if (Math.random() > 0.45) {
                add(randInt(0, cols - 1), randInt(0, rows - 1));
            }
        } else {
            add(randInt(0, cols - 1), randInt(0, rows - 1));
        }
    }

    return cells;

    function addCluster(pushFn, cx, cy, radius) {
        for (let y = cy - radius; y <= cy + radius; y += 1) {
            for (let x = cx - radius; x <= cx + radius; x += 1) {
                const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
                if (dist <= radius) {
                    pushFn(x, y);
                }
            }
        }
    }

    function addRing(pushFn, cx, cy, radius) {
        for (let y = cy - radius - 1; y <= cy + radius + 1; y += 1) {
            for (let x = cx - radius - 1; x <= cx + radius + 1; x += 1) {
                const dx = x - cx;
                const dy = y - cy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist >= radius - 1 && dist <= radius + 0.8) {
                    pushFn(x, y);
                }
            }
        }
    }
}

function dedupeCells(cells) {
    const seen = new Set();
    const out = [];

    cells.forEach((cell) => {
        const key = `${cell.x},${cell.y}`;
        if (!seen.has(key)) {
            seen.add(key);
            out.push(cell);
        }
    });

    return out;
}

function hasAny(text, keys) {
    return keys.some((key) => text.includes(key));
}

function countNumberHints(text, defaultCount) {
    if (text.includes("one")) return 1;
    if (text.includes("two")) return 2;
    if (text.includes("three")) return 3;
    if (text.includes("four")) return 4;
    if (text.includes("five")) return 5;
    return defaultCount;
}

function clearLayer(id) {
    const layer = document.getElementById(id);
    if (layer) {
        layer.innerHTML = "";
    }
}

function getDreamTokens(dream) {
    return [...new Set(
        dream
            .toLowerCase()
            .split(/\s+/)
            .map((word) => word.replace(/[^a-z']/g, ""))
            .filter((word) => word.length > 3)
    )];
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBinaryLine(length = 18) {
    let output = "";
    for (let index = 0; index < length; index += 1) {
        output += Math.random() > 0.5 ? "1" : "0";
    }
    return output;
}