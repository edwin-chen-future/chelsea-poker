const express = require('express');
const cors = require('cors');
const sessionsRouter = require('./routes/sessions');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/sessions', sessionsRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Chelsea Poker backend listening on port ${PORT}`);
  });
}

module.exports = app;
