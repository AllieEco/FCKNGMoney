const express = require('express');
const path = require('path');

const app = express();

// Servir les fichiers statiques depuis la racine
app.use(express.static(__dirname));

// Route racine
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Route pour les autres pages HTML
app.get('/achat.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'achat.html'));
});

app.get('/rpghetto.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'rpghetto.html'));
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