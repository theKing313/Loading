const express = require('express');
const session = require('express-session');
const cors = require('cors');

const app = express();
const PORT = 4000;
const allowedOrigins = ['https://loading-inky.vercel.app', 'https://store-26yu.vercel.app'];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(session({
  secret: 'dev-secret',
  resave: false,
  saveUninitialized: true
}));

const allItems = Array.from({ length: 1000000 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));
let selected = new Set();
let orderedIds = [];

app.get('/api/items', (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search?.toLowerCase() || '';

  let filtered = allItems.filter(i => i.name.toLowerCase().includes(search));
  if (orderedIds.length > 0 && search === '') {
    filtered = orderedIds.map(id => filtered.find(i => i.id === id)).filter(Boolean).concat(
      filtered.filter(i => !orderedIds.includes(i.id))
    );
  }

  const paged = filtered.slice(page * limit, (page + 1) * limit);
  res.json(paged);
});
app.post('/api/selected', (req, res) => {
    selected = new Set(req.body);
    res.sendStatus(200);
  });
  
  app.get('/api/selected', (req, res) => {
    res.json(Array.from(selected));
  });
  
  app.post('/api/order', (req, res) => {
    orderedIds = req.body;
    res.sendStatus(200);
  });
  
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
