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

// Route pour servir les fichiers CSS
app.get('/css/:file', (req, res) => {
  const file = req.params.file;
  res.sendFile(path.join(__dirname, 'css', file));
});

// Route pour servir les fichiers JS
app.get('/js/:file', (req, res) => {
  const file = req.params.file;
  res.sendFile(path.join(__dirname, 'js', file));
});

// Route pour servir les assets
app.get('/assets/:folder/:file', (req, res) => {
  const folder = req.params.folder;
  const file = req.params.file;
  res.sendFile(path.join(__dirname, 'assets', folder, file));
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