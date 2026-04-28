/**
 * server.js — Long Gone Front-End Static Server
 * Section 2, Group 3 — ITCS223
 *
 * Serves all static assets (HTML, CSS, JS, images) on port 8080.
 * Run with:  node server.js   OR   npx nodemon server.js
 */

const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 8080;

// ─── Serve everything in sec2_gr3_fe_src as static files ─────────────────────
app.use(express.static(path.join(__dirname)));

// ─── HTML pages (nice clean URLs, e.g. /html/dashboard) ──────────────────────
app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'homepage.html'));
});

const pages = [
    'homepage',
    'buy_search',
    'renting_search',
    'product_detail',
    'team_page',
    'log_in',
    'dashboard',
    'edit_page',
];

pages.forEach((page) => {
    app.get(`/${page}`, (_req, res) => {
        res.sendFile(path.join(__dirname, 'html', `${page}.html`));
    });
});

// ─── 404 fallback ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).send('<h1>404 — Page Not Found</h1>');
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`✅ Long Gone front-end server running at http://localhost:${PORT}`);
});
