// Fichier: server.js

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import authRoutes from '../routes/auth.js'; // Assurez-vous que le chemin est correct

const app = express();
const PORT = 3000;

// Configuration des Middlewares
app.use(cors());
app.use(bodyParser.json());

// 💡 Montage du routeur d'authentification
// Toutes les routes de auth.js sont accessibles via /api/auth/...
app.use('/api/auth', authRoutes);

// Route de test simple (facultatif)
app.get('/', (req, res) => {
    res.send('API Backend is running.');
});

// Lancement du serveur
app.listen(PORT, () => {
    console.log(`Backend simulé lancé sur http://localhost:${PORT}`);
});