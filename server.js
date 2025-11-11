const http = require('http');
const fs = require('fs');
const path = require('path');

// Définir le port
const PORT = 3000;

// Créer le serveur
const server = http.createServer((req, res) => {
  // Si l’utilisateur demande la page d’accueil
  if (req.url === '/' || req.url === '/index.html') {
    const filePath = path.join(__dirname, 'index.html');
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Erreur interne du serveur');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      }
    });
  } else {
    // Si la page n’existe pas
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Page non trouvée');
  }
});

// Démarrer le serveur
server.listen(PORT, () => {
  console.log(`✅ Serveur en ligne sur http://localhost:${PORT}`);
});
