/**
 * NexusQA - Interactive Motion Canvas & Mouse Physics Engine
 * Generates an interactive constellation particle mesh, fluid parallax orbs,
 * dynamic cursor spotlight, ripple click waves, and 3D card tilt.
 */

(function initAuthMotionBackground() {
  const canvas = document.getElementById("authInteractiveCanvas");
  const card = document.getElementById("authCard") || document.getElementById("auth5Card");
  const spotlight = document.getElementById("authMouseSpotlight");
  const orb1 = document.getElementById("authOrb1");
  const orb2 = document.getElementById("authOrb2");
  const orb3 = document.getElementById("authOrb3");
  const orb4 = document.getElementById("authOrb4");

  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let dpr = window.devicePixelRatio || 1;

  // Mouse State with smooth lerp
  const mouse = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,
    radius: 180,
    isHovering: true
  };

  // Ripples & Click Sparks
  const ripples = [];
  const sparks = [];

  // Particle System Configuration
  const particles = [];
  const PARTICLE_COUNT = window.innerWidth < 768 ? 45 : 85;
  const CONNECT_DISTANCE = 140;
  const MOUSE_CONNECT_DISTANCE = 175;

  const THEME_COLORS = [
    { r: 99, g: 102, b: 241 },   // Indigo #6366f1
    { r: 6, g: 182, b: 212 },    // Cyan #06b6d4
    { r: 168, g: 85, b: 247 },   // Violet #a855f7
    { r: 52, g: 211, b: 153 },   // Emerald #34d399
    { r: 244, g: 114, b: 182 }   // Rose #f472b6
  ];

  class Particle {
    constructor() {
      this.init();
    }

    init() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.75;
      this.vy = (Math.random() - 0.5) * 0.75;
      this.size = Math.random() * 2.2 + 1.2;
      this.baseSize = this.size;
      this.color = THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)];
      this.alpha = Math.random() * 0.55 + 0.35;
      this.pulseSpeed = Math.random() * 0.02 + 0.01;
      this.pulseAngle = Math.random() * Math.PI * 2;
    }

    update() {
      this.pulseAngle += this.pulseSpeed;
      this.size = this.baseSize + Math.sin(this.pulseAngle) * 0.6;

      // Natural movement
      this.x += this.vx;
      this.y += this.vy;

      // Wrap around bounds
      if (this.x < 0) this.x = width;
      if (this.x > width) this.x = 0;
      if (this.y < 0) this.y = height;
      if (this.y > height) this.y = 0;

      // Mouse interactive physics (gentle magnetic pull & repulsion core)
      if (mouse.isHovering) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          if (dist < 45) {
            // Repel if too close
            this.x -= (dx / dist) * force * 3;
            this.y -= (dy / dist) * force * 3;
          } else {
            // Gentle attraction
            this.x += (dx / dist) * force * 0.65;
            this.y += (dy / dist) * force * 0.65;
          }
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(0.5, this.size), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha})`;
      ctx.shadowColor = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.8)`;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  class Ripple {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.radius = 10;
      this.maxRadius = 190;
      this.alpha = 0.8;
      this.speed = 4;
    }

    update() {
      this.radius += this.speed;
      this.alpha = Math.max(0, 0.8 * (1 - this.radius / this.maxRadius));
    }

    draw() {
      if (this.alpha <= 0) return;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(99, 102, 241, ${this.alpha})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(168, 85, 247, 0.6)";
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  class Spark {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.5 + 1.5;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.alpha = 1;
      this.color = THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)];
      this.size = Math.random() * 2.5 + 1.5;
      this.decay = Math.random() * 0.025 + 0.015;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.96;
      this.vy *= 0.96;
      this.alpha -= this.decay;
    }

    draw() {
      if (this.alpha <= 0) return;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha})`;
      ctx.fill();
    }
  }

  function resize() {
    dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    if (particles.length === 0) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
      }
    }
  }

  // Draw Constellation Lines
  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECT_DISTANCE) {
          const alpha = (1 - dist / CONNECT_DISTANCE) * 0.3;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }
      }

      // Connect to Mouse Cursor
      if (mouse.isHovering) {
        const mdx = mouse.x - particles[i].x;
        const mdy = mouse.y - particles[i].y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

        if (mdist < MOUSE_CONNECT_DISTANCE) {
          const mAlpha = (1 - mdist / MOUSE_CONNECT_DISTANCE) * 0.6;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(6, 182, 212, ${mAlpha})`;
          ctx.lineWidth = 1.3;
          ctx.stroke();
        }
      }
    }
  }

  // Mouse / Pointer Event Listeners
  window.addEventListener("pointermove", (e) => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
    mouse.isHovering = true;
  }, { passive: true });

  window.addEventListener("pointerleave", () => {
    mouse.isHovering = false;
  });

  window.addEventListener("click", (e) => {
    // Spawn ripple and sparks
    ripples.push(new Ripple(e.clientX, e.clientY));
    for (let i = 0; i < 12; i++) {
      sparks.push(new Spark(e.clientX, e.clientY));
    }
  });

  // Touch Support
  window.addEventListener("touchmove", (e) => {
    if (e.touches && e.touches[0]) {
      mouse.targetX = e.touches[0].clientX;
      mouse.targetY = e.touches[0].clientY;
      mouse.isHovering = true;
    }
  }, { passive: true });

  // 3D Card Tilt & Specular Physics
  function updateCardTilt() {
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cardCenterX = rect.left + rect.width / 2;
    const cardCenterY = rect.top + rect.height / 2;

    const normX = (mouse.x - cardCenterX) / (window.innerWidth / 2);
    const normY = (mouse.y - cardCenterY) / (window.innerHeight / 2);

    // Smooth subtle 3D tilt
    const maxTilt = 5;
    const tiltY = normX * maxTilt;
    const tiltX = -normY * maxTilt;

    card.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateY(-2px)`;

    // Update Card Dynamic Glow Border
    const angle = Math.atan2(mouse.y - cardCenterY, mouse.x - cardCenterX) * (180 / Math.PI);
    card.style.setProperty("--card-light-angle", `${angle + 90}deg`);
  }

  // Fluid Parallax on Aurora Orbs
  function updateParallaxOrbs() {
    const normX = (mouse.x - width / 2) / width;
    const normY = (mouse.y - height / 2) / height;

    if (orb1) orb1.style.transform = `translate(${normX * 50}px, ${normY * 50}px) scale(1.08)`;
    if (orb2) orb2.style.transform = `translate(${-normX * 60}px, ${-normY * 60}px) scale(1.12)`;
    if (orb3) orb3.style.transform = `translate(${normX * 40}px, ${-normY * 40}px) scale(0.95)`;
    if (orb4) orb4.style.transform = `translate(${-normX * 45}px, ${normY * 45}px) scale(1.1)`;

    if (spotlight) {
      spotlight.style.left = `${mouse.x}px`;
      spotlight.style.top = `${mouse.y}px`;
    }
  }

  // Animation Loop
  function animate() {
    // Lerp mouse coordinates for fluid physics
    mouse.x += (mouse.targetX - mouse.x) * 0.12;
    mouse.y += (mouse.targetY - mouse.y) * 0.12;

    ctx.clearRect(0, 0, width, height);

    // Update & Draw Particles
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }

    // Draw Constellation Connections
    drawConnections();

    // Update & Draw Ripples
    for (let i = ripples.length - 1; i >= 0; i--) {
      ripples[i].update();
      ripples[i].draw();
      if (ripples[i].alpha <= 0) ripples.splice(i, 1);
    }

    // Update & Draw Sparks
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].update();
      sparks[i].draw();
      if (sparks[i].alpha <= 0) sparks.splice(i, 1);
    }

    // Update Card Tilt & Aurora Parallax
    updateCardTilt();
    updateParallaxOrbs();

    requestAnimationFrame(animate);
  }

  // Initialize
  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(animate);
})();
