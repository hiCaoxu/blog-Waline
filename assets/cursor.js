// 光标特效：淡绿色半透明光点跟随鼠标，渐变消散
// 节流渲染、数量上限 100、支持触屏
(function () {
  const canvas = document.getElementById("cursor-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const MAX = 100;
  let dpr = Math.max(1, window.devicePixelRatio || 1);
  let particles = [];
  let lastSpawn = 0;
  const SPAWN_INTERVAL = 16; // 节流：约 60fps 上限

  function resize() {
    dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  function spawn(x, y) {
    const now = performance.now();
    if (now - lastSpawn < SPAWN_INTERVAL) return;
    lastSpawn = now;
    if (particles.length >= MAX) return;
    particles.push({ x, y, r: 6 + Math.random() * 6, alpha: 0.55, life: 1 });
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= 0.02;
      p.r *= 0.97;
      p.alpha *= 0.94;
      if (p.life <= 0 || p.alpha < 0.02) {
        particles.splice(i, 1);
        continue;
      }
      // 读取主题色（淡绿）
      const css = getComputedStyle(document.documentElement)
        .getPropertyValue("--cursor")
        .trim() || "rgba(76,175,125,0.55)";
      ctx.beginPath();
      ctx.fillStyle = css.replace(/[\d.]+\)$/g, p.alpha.toFixed(2) + ")");
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  window.addEventListener("mousemove", (e) => spawn(e.clientX, e.clientY), { passive: true });
  window.addEventListener("touchmove", (e) => {
    const t = e.touches[0];
    if (t) spawn(t.clientX, t.clientY);
  }, { passive: true });
})();
