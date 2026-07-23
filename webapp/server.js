const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const { MIN_LENGTH, MAX_LENGTH, validateSearchTerm } = require('./validation');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Served from the project root (not /public) so the browser and the server
// run the exact same validation rules instead of two copies drifting apart.
app.get('/validation.js', (req, res) => {
  res.type('application/javascript').sendFile(path.join(__dirname, 'validation.js'));
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysqldb',
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'pass',
  database: process.env.DB_NAME || 'testdb',
  waitForConnections: true,
  connectionLimit: 5
});

async function connectWithRetry(retries = 10, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (err) {
      console.log(`DB not ready yet (attempt ${attempt}/${retries}): ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('Could not reach the database after multiple retries');
}

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`2401603\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      search_term VARCHAR(${MAX_LENGTH}) NOT NULL,
      query_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function renderHome(error) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Search</title>
  <script src="/validation.js"></script>
  <script src="/validate.js" defer></script>
</head>
<body>
  <h1>Search</h1>
  ${error ? `<p style="color:red;">${escapeHtml(error)}</p>` : ''}
  <form id="searchForm" action="/search" method="POST" novalidate>
    <label for="searchTerm">Enter a search term:</label>
    <input type="text" id="searchTerm" name="searchTerm"
           minlength="${MIN_LENGTH}" maxlength="${MAX_LENGTH}" required>
    <button type="submit">Submit</button>
    <p id="clientError" style="color:red;"></p>
  </form>
</body>
</html>`;
}

function renderResult(term) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Search Result</title>
</head>
<body>
  <h1>Search Result</h1>
  <p>You searched for: <strong>${escapeHtml(term)}</strong></p>
  <a href="/"><button type="button">Back to Home</button></a>
</body>
</html>`;
}

app.get('/', (req, res) => {
  res.send(renderHome(typeof req.query.error === 'string' ? req.query.error : ''));
});

app.post('/search', async (req, res) => {
  // Server-side validation is authoritative — the client-side check in
  // public/validate.js is a UX convenience only and must never be trusted alone.
  const result = validateSearchTerm(req.body.searchTerm);

  if (!result.valid) {
    const message = result.reason === 'length'
      ? `Search term must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters.`
      : 'Invalid input detected. Please try again.';
    return res.redirect('/?error=' + encodeURIComponent(message));
  }

  const term = result.value;
  const queryTime = new Date();

  try {
    // Parameterized query — the search term is never concatenated into SQL text.
    await pool.execute(
      'INSERT INTO `2401603` (search_term, query_time) VALUES (?, ?)',
      [term, queryTime]
    );
  } catch (err) {
    console.error('DB error while storing search term:', err);
  }

  console.log(`[SEARCH LOG] query="${term}" time=${queryTime.toISOString()}`);

  res.send(renderResult(term));
});

const PORT = process.env.PORT || 3000;

connectWithRetry()
  .then(ensureTable)
  .then(() => {
    app.listen(PORT, () => console.log(`webapp listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Fatal startup error:', err);
    process.exit(1);
  });
