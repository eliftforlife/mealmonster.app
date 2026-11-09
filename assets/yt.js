// Click-to-load YouTube shorts (11-09). Until someone presses play only the thumbnail loads; the player comes from youtube-nocookie.com.
(() => {
  document.querySelectorAll('.yt').forEach((y) => y.addEventListener('click', () => {
    if (y.querySelector('iframe')) return;
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(y.dataset.id)}?autoplay=1&rel=0`;
    f.title = y.dataset.title || 'Video'; f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true;
    y.appendChild(f);
  }));
})();
