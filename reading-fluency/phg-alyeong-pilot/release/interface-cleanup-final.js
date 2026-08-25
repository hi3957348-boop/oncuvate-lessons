(function () {
  'use strict';

  const CSS_HREF = 'release/interface-cleanup-final.css';   // 폴더 밖 참조(../) 금지 — 규격 2·3장
  let scheduled = false;

  function ensureCssLast() {
    let link = document.querySelector('link[data-module="interface-cleanup-final"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = CSS_HREF;
      link.dataset.module = 'interface-cleanup-final';
      document.head.appendChild(link);
      return;
    }
    if (link !== document.head.lastElementChild) document.head.appendChild(link);
  }

  function activeStep() {
    const active = document.querySelector('.step-btn.active, .step-btn.is-active, .step-btn[aria-current="step"], [data-step].active, [data-step].is-active');
    const raw = active && (active.dataset.step || active.getAttribute('data-page') || active.textContent);
    const match = String(raw || '').match(/[1-5]/);
    return match ? Number(match[0]) : null;
  }

  function findFooter(shell) {
    const root = shell && (shell.closest('.studio') || shell.parentElement);
    return (root && (root.querySelector('.bottombar') || root.querySelector('.bottom-bar'))) || document.querySelector('.bottombar, .bottom-bar');
  }

  function placeBefore(actions, node, next) {
    if (!node) return;
    if (node.parentElement === actions && node.nextElementSibling === next) return;
    actions.insertBefore(node, next || null);
  }

  function moveControls() {
    const shell = document.querySelector('.activity-shell');
    const footer = findFooter(shell);
    const actions = footer && footer.querySelector('.bottom-actions');
    if (!shell || !footer || !actions) return;

    const step = activeStep();
    let guides = Array.from(document.querySelectorAll('[data-action="open-modal"]'));
    if (!guides.length) {
      const createdGuide = document.createElement('button');
      createdGuide.type = 'button';
      createdGuide.className = 'quiet-btn instruction-btn activity-guide-action';
      createdGuide.dataset.action = 'open-modal';
      createdGuide.textContent = '활동 안내';
      guides = [createdGuide];
    }
    const guide = guides.find((node) => node.parentElement === actions && node.classList.contains('instruction-btn'))
      || guides.find((node) => node.parentElement === actions)
      || guides[0];
    guides.filter((node) => node !== guide).forEach((node) => node.remove());
    if (guide) {
      guide.classList.remove('compact-info');
      guide.classList.add('activity-guide-action');
      guide.textContent = '활동 안내';
      guide.hidden = false;
      const next = actions.querySelector('[data-action="next"]');
      placeBefore(actions, guide, next);
    }

    const launcher = document.querySelector('.annotation-launcher');
    if (launcher && step && step >= 1 && step <= 5) {
      launcher.hidden = false;
      launcher.disabled = false;
      launcher.tabIndex = 0;
      const next = actions.querySelector('[data-action="next"]');
      placeBefore(actions, launcher, next);
    }

    shell.querySelectorAll('.compact-activity-bar').forEach((bar) => {
      if (!bar.textContent.trim() && !bar.querySelector('button, input, select')) bar.hidden = true;
    });
  }

  function refresh() {
    scheduled = false;
    ensureCssLast();
    moveControls();
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(refresh);
  }

  ensureCssLast();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
  } else {
    schedule();
  }

  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'hidden', 'aria-current', 'data-step', 'data-page']
  });
})();
