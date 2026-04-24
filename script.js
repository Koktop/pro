/* ============================================================
   ДИРЕКТ.PRO — script.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ─── CUSTOM CURSOR ─── */
  const cursor = document.querySelector('.cursor');
  const ring   = document.querySelector('.cursor-ring');
  let mouseX = 0, mouseY = 0;
  let ringX  = 0, ringY  = 0;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX; mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
  });

  (function animateRing() {
    ringX += (mouseX - ringX) * 0.14;
    ringY += (mouseY - ringY) * 0.14;
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
    requestAnimationFrame(animateRing);
  })();

  document.querySelectorAll('a, button, .perk, .service-card, .stat-card').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('active');
      ring.classList.add('active');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('active');
      ring.classList.remove('active');
    });
  });

  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
    ring.style.opacity   = '0';
  });
  document.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
    ring.style.opacity   = '1';
  });

  /* ─── HERO CANVAS PARTICLES ─── */
  const canvas = document.getElementById('hero-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() { this.reset(true); }
      reset(initial) {
        this.x = Math.random() * W;
        this.y = initial ? Math.random() * H : H + 10;
        this.r = Math.random() * 1.4 + 0.4;
        this.vx = (Math.random() - 0.5) * 0.35;
        this.vy = -(Math.random() * 0.6 + 0.25);
        this.alpha = Math.random() * 0.45 + 0.05;
        this.life  = 0;
        this.maxLife = Math.random() * 280 + 140;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life++;
        const progress = this.life / this.maxLife;
        this.currentAlpha = this.alpha * Math.sin(Math.PI * progress);
        if (this.life >= this.maxLife || this.y < -10) this.reset(false);
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 69, 0, ${this.currentAlpha})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < 90; i++) particles.push(new Particle());

    function loop() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => { p.update(); p.draw(); });
      requestAnimationFrame(loop);
    }
    loop();
  }

  /* ─── NAV HIDE / SHOW ON SCROLL ─── */
  const nav = document.querySelector('nav');
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 80) {
      nav.classList.add('scrolled');
      nav.classList.toggle('hidden', y > lastY + 5 && y > 220);
      if (y < lastY) nav.classList.remove('hidden');
    } else {
      nav.classList.remove('scrolled', 'hidden');
    }
    lastY = y;
  });

  /* ─── SCROLL REVEAL ─── */
  const reveals = document.querySelectorAll('.reveal');
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const siblings = Array.from(entry.target.parentElement.querySelectorAll('.reveal:not(.visible)'));
      const idx = siblings.indexOf(entry.target);
      setTimeout(() => entry.target.classList.add('visible'), idx * 90);
      revealObs.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(el => revealObs.observe(el));

  /* ─── 3D CARD TILT ─── */
  document.querySelectorAll('.service-card, .stat-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width  / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      card.style.transform = `perspective(700px) rotateY(${dx * 8}deg) rotateX(${-dy * 8}deg) translateZ(8px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  /* ─── BUTTON RIPPLE ─── */
  document.querySelectorAll('.btn-primary, .btn-form, .nav-cta, .btn-back').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const r = document.createElement('span');
      r.className = 'ripple';
      r.style.cssText = `left:${x}px;top:${y}px;width:${rect.width * 2}px;height:${rect.width * 2}px;margin-left:-${rect.width}px;margin-top:-${rect.width}px;`;
      this.appendChild(r);
      setTimeout(() => r.remove(), 560);
    });
  });

  /* ─── FORM SUBMISSION via Web3Forms ─── */
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();

      const name    = form.querySelector('[name="name"]').value.trim();
      const contact = form.querySelector('[name="contact"]').value.trim();
      const errEl   = form.querySelector('.form-error');
      const btn     = form.querySelector('.btn-form');

      errEl.style.display = 'none';

      if (!name || !contact) {
        errEl.textContent = 'Пожалуйста, заполните имя и контакт для связи.';
        errEl.style.display = 'block';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Отправляем...';

      try {
        const data = new FormData(form);
        const res  = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: data
        });
        const json = await res.json();

        if (json.success) {
  ym(108716311, 'reachGoal', 'form_submit');
  window.location.href = 'thanks.html';
} else {
          throw new Error('fail');
        }
      } catch {
        errEl.textContent = 'Ошибка отправки. Напишите мне напрямую: @I5una в Telegram.';
        errEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Отправить заявку →';
      }
    });
  }
   
   setTimeout(function() {
  ym(108716311, 'reachGoal', 'time_60sec');
}, 60000);
   var timeSpent = 0;
var timer = setInterval(function() {
  if (!document.hidden) {
    timeSpent += 1;
    if (timeSpent >= 60) {
      ym(108716311, 'reachGoal', 'time_60sec');
      clearInterval(timer);
    }
  }
}, 1000);

   var pricingReached = false;
var contactsReached = false;

var scrollObs = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {

      if (entry.target.id === 'pricing' && !pricingReached) {
        pricingReached = true;
        ym(108716311, 'reachGoal', 'scroll_pricing');
        scrollObs.unobserve(entry.target);
      }

      if (entry.target.id === 'contacts' && !contactsReached) {
        contactsReached = true;
        ym(108716311, 'reachGoal', 'scroll_contacts');
        scrollObs.unobserve(entry.target);
      }

    }
  });
}, { threshold: 0.3 });

var pricingEl  = document.getElementById('pricing');
var contactsEl = document.getElementById('contacts');
if (pricingEl)  scrollObs.observe(pricingEl);
if (contactsEl) scrollObs.observe(contactsEl);

   document.querySelectorAll('a.btn-primary').forEach(function(el) {
  el.addEventListener('click', function() {
    ym(108716311, 'reachGoal', 'click_hero_cta');
  });
});

});
