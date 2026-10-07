(() => {
  'use strict';

  const iconPath = 'static/icons/lucide.svg#';
  const videos = Array.from(document.querySelectorAll('video'));
  const openingVideo = document.querySelector('#opening-video');
  const opening = document.querySelector('.opening');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let openingEnabled = !reduceMotion.matches;
  let openingVisible = true;
  let openingEngaged = false;

  // Clear the title once playback moves beyond the introduction or is operated directly.
  function syncOpeningTitle() {
    opening.classList.toggle('is-watching', openingEngaged || openingVideo.currentTime >= 10);
  }
  function engageOpening() {
    openingEngaged = true;
    syncOpeningTitle();
  }
  openingVideo.addEventListener('timeupdate', syncOpeningTitle);
  openingVideo.addEventListener('pointerdown', engageOpening);
  openingVideo.addEventListener('focus', engageOpening);

  function playOpening() {
    if (openingEnabled && openingVisible && !document.hidden) {
      openingVideo.play().catch(() => { /* Native controls remain available if autoplay is blocked. */ });
    } else {
      openingVideo.pause();
    }
  }

  if (reduceMotion.matches) openingVideo.pause();
  openingVideo.addEventListener('play', () => { openingEnabled = true; });
  openingVideo.addEventListener('pause', () => {
    if (openingVisible && !document.hidden) openingEnabled = false;
  });
  reduceMotion.addEventListener('change', () => {
    openingEnabled = !reduceMotion.matches;
    playOpening();
  });

  function keepSilent(video) {
    video.defaultMuted = true;
    if (!video.muted) video.muted = true;
    if (video.volume !== 0) video.volume = 0;
  }

  videos.forEach((video) => {
    keepSilent(video);
    video.addEventListener('volumechange', () => keepSilent(video));
    video.addEventListener('loadedmetadata', () => keepSilent(video));
    video.addEventListener('play', () => {
      videos.forEach((other) => {
        if (other !== video && !other.paused) other.pause();
      });
    });
  });

  if ('IntersectionObserver' in window) {
    const mediaObserver = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (target === openingVideo) {
          openingVisible = isIntersecting;
          if (isIntersecting && videos.every((video) => video === openingVideo || video.paused)) playOpening();
          else openingVideo.pause();
        } else if (!isIntersecting) {
          target.pause();
        }
      });
    }, { threshold: 0.08 });
    videos.forEach((video) => mediaObserver.observe(video));
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) videos.forEach((video) => video.pause());
    else if (videos.every((video) => video === openingVideo || video.paused)) playOpening();
  });

  function changeVideo(video, source, poster, label) {
    video.pause();
    keepSilent(video);
    video.querySelector('source').setAttribute('src', source);
    video.setAttribute('poster', poster);
    video.setAttribute('aria-label', label);
    video.load();
    video.play().catch(() => { /* Native controls remain available if autoplay is blocked. */ });
  }

  function setupTabs(container, panel, onSelect, gridColumns) {
    const buttons = Array.from(container.querySelectorAll('[role="tab"]'));
    const select = (button) => {
      buttons.forEach((tab) => {
        const selected = tab === button;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });
      panel.setAttribute('aria-labelledby', button.id);
      onSelect(button);
    };
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => select(button));
      button.addEventListener('keydown', (event) => {
        let next = index;
        if (event.key === 'ArrowRight') next += 1;
        else if (event.key === 'ArrowLeft') next -= 1;
        else if (event.key === 'ArrowDown') next += gridColumns();
        else if (event.key === 'ArrowUp') next -= gridColumns();
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = buttons.length - 1;
        else return;
        event.preventDefault();
        const nextTab = buttons[(next + buttons.length) % buttons.length];
        nextTab.focus();
        select(nextTab);
      });
    });
  }

  const targetVideo = document.querySelector('#target-video');
  const targetTabs = document.querySelector('.target-tabs');
  setupTabs(targetTabs, document.querySelector('#target-panel'), (button) => {
    const number = button.dataset.target;
    const overview = number === 'all';
    const label = overview ? 'All nine landing targets' : 'Landing target ' + number;
    const asset = overview ? 'target-8' : number === '8' ? 'target-8-detail' : 'target-' + number;
    const poster = overview ? 'tp8' : number === '8' ? 'tp8-detail' : 'tp' + number;
    document.querySelector('#target-label').textContent = label;
    changeVideo(targetVideo, 'assets/videos/web/' + asset + '.mp4',
      'assets/images/posters/' + poster + '.jpg', label + ', real robot');
  }, () => getComputedStyle(targetTabs).gridTemplateColumns.split(' ').length);

  const matchTabs = document.querySelector('.match-tabs');
  setupTabs(matchTabs, document.querySelector('#match-panel'), (button) => {
    const recording = button.dataset.match;
    const asset = button.dataset.asset || 'match-' + recording;
    const game = button.querySelector('.game-number').firstChild.textContent.trim();
    const label = 'Game ' + game + ' / G1 11 : Human ' + button.dataset.human;
    document.querySelector('#match-label').textContent = label;
    changeVideo(document.querySelector('#match-video'), 'assets/videos/web/' + asset + '.mp4',
      'assets/images/posters/' + asset + '.jpg', label);
  }, () => getComputedStyle(matchTabs).gridTemplateColumns.split(' ').length);

  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#site-menu');
  function closeMenu() {
    menu.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    menuButton.setAttribute('title', 'Open navigation');
    menuButton.querySelector('use').setAttribute('href', iconPath + 'menu');
  }
  menuButton.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') === 'true';
    if (expanded) closeMenu();
    else {
      menu.classList.add('is-open');
      menuButton.setAttribute('aria-expanded', 'true');
      menuButton.setAttribute('aria-label', 'Close navigation');
      menuButton.setAttribute('title', 'Close navigation');
      menuButton.querySelector('use').setAttribute('href', iconPath + 'x');
    }
  });
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.classList.contains('is-open')) {
      closeMenu();
      menuButton.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.site-header')) closeMenu();
  });

  const dialog = document.querySelector('#figure-dialog');
  const dialogImage = document.querySelector('#dialog-image');
  document.querySelectorAll('[data-enlarge]').forEach((button) => {
    button.addEventListener('click', () => {
      const caption = button.dataset.caption;
      dialogImage.src = button.dataset.enlarge;
      dialogImage.alt = caption;
      document.querySelector('#dialog-caption').textContent = caption;
      dialog.showModal();
    });
  });
  document.querySelector('#close-figure').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });

})();
