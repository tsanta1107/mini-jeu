// server.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware pour servir les fichiers statiques du dossier "public"
app.use(express.static(path.join(__dirname)));

// Route principale (index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname,'index.html'));
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur en cours d’exécution sur http://localhost:${PORT}`);
});
