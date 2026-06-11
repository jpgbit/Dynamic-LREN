const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_/#$%";

const randomGlyph = () => glyphs[Math.floor(Math.random() * glyphs.length)];

function createWaves(canvas, options = {}) {
  if (!canvas) return;

  const context = canvas.getContext("2d");
  const host = options.host || canvas.parentElement;
  const pointer = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    active: false
  };
  const waves = {
    width: 0,
    height: 0,
    points: [],
    time: 0
  };
  const settings = {
    lineColor: "rgba(22, 92, 255, 0.16)",
    waveSpeedX: 0.018,
    waveSpeedY: 0.008,
    waveAmpX: 34,
    waveAmpY: 18,
    xGap: 14,
    yGap: 34,
    friction: 0.92,
    tension: 0.006,
    maxCursorMove: 110,
    ...options
  };
  delete settings.host;

  const buildWavePoints = () => {
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    waves.width = Math.max(1, Math.round(rect.width));
    waves.height = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(waves.width * pixelRatio);
    canvas.height = Math.round(waves.height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const columns = Math.ceil(waves.width / settings.xGap) + 4;
    const rows = Math.ceil(waves.height / settings.yGap) + 4;
    waves.points = Array.from({ length: columns }, (_, column) =>
      Array.from({ length: rows }, (_, row) => ({
        baseX: column * settings.xGap - settings.xGap * 2,
        baseY: row * settings.yGap - settings.yGap * 2,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0
      }))
    );
  };

  const drawWaves = () => {
    waves.time += 1;
    context.clearRect(0, 0, waves.width, waves.height);
    context.lineWidth = 1;
    context.strokeStyle = settings.lineColor;

    waves.points.forEach((column, columnIndex) => {
      context.beginPath();

      column.forEach((point, rowIndex) => {
        const waveX = Math.sin(waves.time * settings.waveSpeedX + rowIndex * 0.55) * settings.waveAmpX;
        const waveY = Math.cos(waves.time * settings.waveSpeedY + columnIndex * 0.42) * settings.waveAmpY;

        let targetX = point.baseX + waveX;
        let targetY = point.baseY + waveY;

        if (pointer.active) {
          const dx = targetX - pointer.x;
          const dy = targetY - pointer.y;
          const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          const force = Math.max(0, 1 - distance / settings.maxCursorMove);
          targetX += dx * force * 0.3;
          targetY += dy * force * 0.3;
        }

        point.vx += (targetX - point.x) * settings.tension;
        point.vy += (targetY - point.y) * settings.tension;
        point.vx *= settings.friction;
        point.vy *= settings.friction;
        point.x += point.vx;
        point.y += point.vy;

        if (rowIndex === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
      });

      context.stroke();
    });

    window.requestAnimationFrame(drawWaves);
  };

  const handlePointerMove = (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  };

  buildWavePoints();
  window.addEventListener("resize", buildWavePoints);
  host?.addEventListener("mousemove", handlePointerMove);
  host?.addEventListener("mouseleave", () => {
    pointer.active = false;
  });
  window.requestAnimationFrame(drawWaves);
}

createWaves(document.querySelector("[data-waves]"), {
  host: document.querySelector(".hero")
});

const scrambleElement = document.querySelector(".scramble");
const words = scrambleElement.dataset.words.split(",");
let wordIndex = 0;

function scrambleTo(nextWord) {
  const previous = scrambleElement.textContent;
  const length = Math.max(previous.length, nextWord.length);
  let frame = 0;
  const totalFrames = 18;

  const timer = window.setInterval(() => {
    const progress = frame / totalFrames;
    scrambleElement.textContent = Array.from({ length }, (_, index) => {
      if (index < nextWord.length && index / length < progress) {
        return nextWord[index];
      }

      return randomGlyph();
    }).join("");

    frame += 1;

    if (frame > totalFrames) {
      window.clearInterval(timer);
      scrambleElement.textContent = nextWord;
    }
  }, 36);
}

window.setInterval(() => {
  wordIndex = (wordIndex + 1) % words.length;
  scrambleTo(words[wordIndex]);
}, 2200);

document.querySelectorAll("[data-counter]").forEach((counter) => {
  const min = Number(counter.dataset.min);
  const max = Number(counter.dataset.max);

  window.setInterval(() => {
    counter.textContent = String(Math.floor(min + Math.random() * (max - min + 1)));
  }, 680 + Math.random() * 520);
});

const rainLines = [
  "INIT MODEL  0101",
  "VECTOR SYNC 2048",
  "ROUTE /FLOW  98%",
  "TOKEN MAP  731K",
  "STATE READY  01",
  "QUERY LAYER 07",
  "LATENCY  12MS",
  "SIGNAL LOCK",
  "DELTA  +0.84",
  "OUTPUT CLEAN"
];

document.querySelectorAll(".data-rain").forEach((panel, panelIndex) => {
  const render = () => {
    panel.textContent = Array.from({ length: 18 }, (_, index) => {
      const base = rainLines[(index + panelIndex) % rainLines.length];
      const code = Array.from({ length: 5 }, randomGlyph).join("");
      return `${base}  ${code}`;
    }).join("\n");
  };

  render();
  window.setInterval(render, 900 + panelIndex * 320);
});

const hero = document.querySelector(".hero");
const revealRoot = document.querySelector("[data-reveal-root]");
const revealLayer = document.querySelector("[data-reveal-layer]");
const revealEnabled = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 561px)");

if (hero && revealRoot && revealLayer && revealEnabled.matches) {
  const maskCanvas = document.createElement("canvas");
  const maskContext = maskCanvas.getContext("2d");
  const pointer = {
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    active: false,
    initialized: false
  };

  let canvasWidth = 0;
  let canvasHeight = 0;

  const syncCanvasSize = () => {
    const rect = revealRoot.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));

    if (width !== canvasWidth || height !== canvasHeight) {
      canvasWidth = width;
      canvasHeight = height;
      maskCanvas.width = canvasWidth;
      maskCanvas.height = canvasHeight;
    }

    return rect;
  };

  const updatePointer = (event) => {
    const rect = syncCanvasSize();
    pointer.targetX = event.clientX - rect.left;
    pointer.targetY = event.clientY - rect.top;

    if (!pointer.initialized) {
      pointer.currentX = pointer.targetX;
      pointer.currentY = pointer.targetY;
      pointer.initialized = true;
    }

    pointer.active = true;
    hero.classList.add("hero--reveal-active");
  };

  const drawMask = () => {
    const rect = syncCanvasSize();
    const radius = Math.max(132, Math.min(rect.width, rect.height) * 0.18);

    pointer.currentX += (pointer.targetX - pointer.currentX) * 0.16;
    pointer.currentY += (pointer.targetY - pointer.currentY) * 0.16;

    maskContext.clearRect(0, 0, canvasWidth, canvasHeight);

    if (pointer.active) {
      const gradient = maskContext.createRadialGradient(
        pointer.currentX,
        pointer.currentY,
        radius * 0.18,
        pointer.currentX,
        pointer.currentY,
        radius
      );

      gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
      gradient.addColorStop(0.42, "rgba(0, 0, 0, 1)");
      gradient.addColorStop(0.72, "rgba(0, 0, 0, 0.46)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      maskContext.fillStyle = gradient;
      maskContext.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    const maskUrl = `url("${maskCanvas.toDataURL("image/png")}")`;
    revealLayer.style.maskImage = maskUrl;
    revealLayer.style.webkitMaskImage = maskUrl;

    window.requestAnimationFrame(drawMask);
  };

  hero.addEventListener("mousemove", updatePointer);
  hero.addEventListener("mouseleave", () => {
    pointer.active = false;
    hero.classList.remove("hero--reveal-active");
  });
  window.addEventListener("resize", syncCanvasSize);

  syncCanvasSize();
  window.requestAnimationFrame(drawMask);
}
