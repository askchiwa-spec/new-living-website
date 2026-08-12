/* ==========================================================================
   New Living Health Care Services — site behaviour
   --------------------------------------------------------------------------
   Motion policy: this site is used by people who may be unwell or in distress.
   Animation is restrained by design. One orchestrated moment (the thread and
   the hero), quiet reveals elsewhere, and a hard stop under prefers-reduced-
   motion. CSS holds the final visual state, so if anime.js fails to load or
   JS is disabled, the page is still complete and readable.

   Library: anime.js v4 (UMD build — everything lives on the window.anime
   namespace: anime.animate, anime.stagger, anime.svg, anime.utils).
   ========================================================================== */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var A = window.anime;
  var hasAnime = !!(A && typeof A.animate === 'function');

  /* ------------------------------------------------------------ 1. Mobile nav */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('primary-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
      document.body.classList.toggle('nav-open', !open);
      document.body.style.overflow = !open ? 'hidden' : '';

      if (!open && hasAnime && !reduced) {
        A.animate(nav.querySelectorAll('.nav__link, .nav .btn'), {
          translateX: [22, 0],
          opacity: [0, 1],
          delay: A.stagger(45),
          duration: 380,
          ease: 'outQuad'
        });
      }
    });

    // Close on Escape, on a tap outside the panel (the scrim), and when a
    // link is followed
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) toggle.click();
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !e.target.closest('.nav') && !e.target.closest('.nav-toggle')) {
        toggle.click();
      }
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && nav.classList.contains('is-open')) toggle.click();
    });
  }

  /* ------------------------------------------------ 2. Scroll reveals (quiet) */
  var revealables = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window) || reduced) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);

        // Stagger siblings inside a group for a single coherent movement
        var group = el.dataset.revealGroup
          ? Array.prototype.slice.call(el.parentNode.querySelectorAll('[data-reveal-group="' + el.dataset.revealGroup + '"]'))
          : [el];

        if (hasAnime) {
          // Let anime.js own the animation — the CSS transition on .is-in would
          // otherwise chase every per-frame inline style update and lag.
          group.forEach(function (n) { n.style.transition = 'none'; n.classList.add('is-in'); });
          A.animate(group, {
            translateY: [14, 0],
            opacity: [0, 1],
            delay: A.stagger(70),
            duration: 620,
            ease: 'outCubic'
          });
          group.forEach(function (n) { io.unobserve(n); });
        } else {
          group.forEach(function (n) { n.classList.add('is-in'); io.unobserve(n); });
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------- 3. Hero entrance */
  var hero = document.querySelector('[data-hero]');
  if (hero && hasAnime && !reduced) {
    var pieces = hero.querySelectorAll('[data-hero-item]');
    pieces.forEach(function (p) { p.style.opacity = 0; });
    A.animate(pieces, {
      translateY: [26, 0],
      opacity: [0, 1],
      duration: 780,
      delay: A.stagger(110),
      ease: 'outCubic'
    });
  }

  /* ------------------------------------ 4. Brand mark entrance (first load)
     The official logo (a raster image) rises in once per session. CSS holds
     the final state: with JS off, reduced motion, or a repeat visit this
     session, the mark is simply there. */
  var mark = document.querySelector('.site-header .brand__mark');
  var markDrawn = false;
  try { markDrawn = !!window.sessionStorage.getItem('nl-mark-drawn'); } catch (e) {}
  if (mark && hasAnime && !reduced && !markDrawn) {
    try { window.sessionStorage.setItem('nl-mark-drawn', '1'); } catch (e) {}
    A.animate(mark, {
      opacity: [0, 1],
      translateY: [5, 0],
      scale: [0.92, 1],
      duration: 700,
      ease: 'outCubic'
    });
  }

  /* --------------------------------------- 4b. Photograph drift (site-wide)
     Every .photo image breathes — a very slow Ken Burns drift, alternating
     origin so neighbouring photos don't move in lockstep. Decorative only;
     killed by prefers-reduced-motion. */
  if (hasAnime && !reduced) {
    document.querySelectorAll('.photo img').forEach(function (img, i) {
      img.style.transformOrigin = i % 2 ? '70% 35%' : '30% 65%';
      A.animate(img, {
        scale: [1, 1.06],
        duration: 14000,
        ease: 'inOutSine',
        alternate: true,
        loop: true,
        delay: i * 900
      });
    });
  }

  /* ---------------------------------------- 5. The thread — signature element
     A single unbroken line down the left rail that draws as you read. It is
     the agency's own promise made visible: continuity, nobody dropped.
     Runs on requestAnimationFrame (not anime.js) so it tracks scroll exactly. */
  var thread = document.querySelector('[data-thread]');
  if (thread) {
    var path = thread.querySelector('.thread__draw');
    var nodesWrap = thread.querySelector('.thread__nodes');
    var anchors = Array.prototype.slice.call(document.querySelectorAll('[data-thread-node]'));

    if (path) {
      var len = path.getTotalLength();
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = reduced ? 0 : len;
    }

    // Place a node marker on the rail for each anchored section
    var markers = anchors.map(function (section) {
      var dot = document.createElement('span');
      dot.className = 'thread__node';
      dot.setAttribute('aria-hidden', 'true');
      if (nodesWrap) nodesWrap.appendChild(dot);
      return { section: section, dot: dot };
    });

    var ticking = false;

    function paint() {
      ticking = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;

      if (path && !reduced) {
        path.style.strokeDashoffset = len * (1 - progress);
      }

      var vh = window.innerHeight;
      markers.forEach(function (m) {
        var box = m.section.getBoundingClientRect();
        // Position the dot at the section's vertical midpoint, clamped to the rail
        var mid = box.top + box.height / 2;
        var y = Math.max(12, Math.min(vh - 12, mid));
        m.dot.style.top = y + 'px';
        m.dot.style.opacity = (box.bottom > 0 && box.top < vh) ? '1' : '0';
        m.dot.classList.toggle('is-lit', box.top < vh * 0.55 && box.bottom > vh * 0.2);
      });
    }

    function onScroll() {
      if (!ticking) { window.requestAnimationFrame(paint); ticking = true; }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    paint();
  }

  /* ------------------------------------------------------- 6. Accordion (Notices) */
  document.querySelectorAll('.acc__btn').forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (!panel) return;

    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));

      var target = open ? 0 : panel.firstElementChild.offsetHeight;

      if (hasAnime && !reduced) {
        A.utils.remove(panel);
        A.animate(panel, {
          height: target,
          duration: 340,
          ease: 'outQuad',
          onComplete: function () { if (!open) panel.style.height = 'auto'; }
        });
      } else {
        panel.style.height = open ? '0px' : 'auto';
      }
    });
  });

  /* --------------------------------- 7. Intercepted forms (contact, CSW apply)
     No backend is wired yet. See README — connect to a HIPAA-appropriate
     handler before accepting real submissions. The pending state below is
     the pattern for that handler: replace the timeout with the real fetch.  */
  document.querySelectorAll('[data-contact-form], [data-csw-form]').forEach(function (form) {
    var spinner = form.querySelector('[data-form-spinner]');
    var submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('[data-form-status]');
      var endpoint = form.getAttribute('data-endpoint');

      if (spinner) spinner.hidden = false;
      if (submitBtn) submitBtn.disabled = true;

      function finish(message) {
        if (spinner) spinner.hidden = true;
        if (submitBtn) submitBtn.disabled = false;
        if (status) {
          status.hidden = false;
          status.textContent = message;
          status.focus();
        }
      }

      if (endpoint) {
        // Real delivery via the form relay. The "no health information"
        // notice above the form stays load-bearing: nothing clinical
        // belongs in this channel.
        window.fetch(endpoint, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        }).then(function (r) {
          if (!r.ok) throw new Error('relay rejected');
          return r.json();
        }).then(function () {
          form.reset();
          finish('Thank you — we received your message and will call you back during office hours.');
        }).catch(function () {
          finish('Sorry, the message could not be sent. Please call 202-248-1356 or email info@newlivinghealthcare.com.');
        });
      } else {
        window.setTimeout(function () {
          finish(form.getAttribute('data-form-message') ||
            'This form is not connected yet. Please call 202-248-1356 or email info@newlivinghealthcare.com.');
        }, 400);
      }
    });
  });

  /* ------------------------------------------------------------ 8. Year stamp */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
