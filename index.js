const express = require('express');
const path = require('path');

const app = express();

// Servir les fichiers statiques
app.use(express.static('.'));

// Route racine
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Route de test
app.get('/test', (req, res) => {
  res.json({
    message: 'FCKNGMoney is working!',
    timestamp: new Date().toISOString()
  });
});

// Export pour Vercel
module.exports = app; 