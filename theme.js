// Apply before CSS is loaded to prevent a flash of the wrong theme.
(() => {
    'use strict';
    const key = 'usloviya-perevozki-theme';
    const valid = value => ['system', 'light', 'dark'].includes(value);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    let preference = 'system';
    try { const stored = localStorage.getItem(key); if (valid(stored)) preference = stored; } catch (_) {}
    function apply() {
        const theme = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
        document.documentElement.dataset.theme = theme;
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.content = theme === 'dark' ? '#141916' : '#f0f1eb';
        const select = document.getElementById('theme-select');
        if (select) select.value = preference;
    }
    apply();
    if (media.addEventListener) media.addEventListener('change', apply);
    else media.addListener(apply);
    window.addEventListener('storage', event => {
        if (event.key !== key && event.key !== null) return;
        preference = valid(event.newValue) ? event.newValue : 'system';
        apply();
    });
    document.addEventListener('DOMContentLoaded', () => {
        const select = document.getElementById('theme-select');
        if (!select) return;
        select.value = preference;
        select.addEventListener('change', () => {
            preference = valid(select.value) ? select.value : 'system';
            try { localStorage.setItem(key, preference); } catch (_) {}
            apply();
        });
    });
})();
