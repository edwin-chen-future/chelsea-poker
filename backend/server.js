const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db');
const authRouter = require('./routes/auth');
const sessionsRouter = require('./routes/sessions');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/auth', authRouter);
app.use('/api/sessions', sessionsRouter);

// Catch-all: serve the web app for any non-API route
app.get('*', (req, res) => {
  const fs = require('fs');
  const jsDir = path.join(__dirname, 'public', '_expo', 'static', 'js', 'web');
  let bundle = '';
  try {
    bundle = fs.readdirSync(jsDir).find(f => f.endsWith('.js')) || '';
  } catch {}

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no"/>
  <title>Chelsea Poker</title>
  <style>
    html, body { height: 100%; background-color: #000000; }
    body { overflow: hidden; }
    #root { display: flex; height: 100%; flex: 1; }
  </style>
  <link rel="icon" href="/favicon.ico"/>
</head>
<body>
  <div id="root"></div>
  ${bundle ? `<script src="/_expo/static/js/web/${bundle}" defer></script>` : ''}
</body>
</html>`);
});

async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Chelsea Poker server running on port ${PORT}`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = app;
