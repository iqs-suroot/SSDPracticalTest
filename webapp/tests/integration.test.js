const test = require('node:test');
const assert = require('node:assert/strict');
const mysql = require('mysql2/promise');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function submitSearch(term) {
  return fetch(`${BASE_URL}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ searchTerm: term }),
    redirect: 'manual'
  });
}

test('home page responds and contains the search form', async () => {
  const res = await fetch(`${BASE_URL}/`);
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /id="searchForm"/);
  assert.match(body, /name="searchTerm"/);
});

test('valid search term is accepted, rendered back, and persisted in `2401603`', async () => {
  const term = `ci-integration-${Date.now()}`;
  const res = await submitSearch(term);

  assert.equal(res.status, 200);
  const body = await res.text();
  assert.ok(body.includes(term));
  assert.match(body, /Back to Home/);

  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'pass',
    database: process.env.DB_NAME || 'testdb'
  });
  try {
    const [rows] = await pool.query('SELECT * FROM `2401603` WHERE search_term = ?', [term]);
    assert.equal(rows.length, 1);
    assert.ok(rows[0].query_time);
  } finally {
    await pool.end();
  }
});

test('SQL injection payload is rejected and redirects home with an error', async () => {
  const res = await submitSearch("' OR 1=1 --");
  assert.equal(res.status, 302);
  assert.match(res.headers.get('location'), /^\/\?error=/);
});

test('too-short search term is rejected with a length error', async () => {
  const res = await submitSearch('ab');
  assert.equal(res.status, 302);
  assert.match(res.headers.get('location'), /error=Search%20term%20must%20be%20between/);
});

test('too-long search term is rejected with a length error', async () => {
  const res = await submitSearch('a'.repeat(51));
  assert.equal(res.status, 302);
  assert.match(res.headers.get('location'), /error=Search%20term%20must%20be%20between/);
});
