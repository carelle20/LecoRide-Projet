import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import authRoutes from '../routes/auth.js'; 
const app = express();
const PORT = 3000;

// Configuration des Middlewares
app.use(cors());
app.use(bodyParser.json());

// 💡 Montage du routeur d'authentification
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('API Backend is running.');
});

// Lancement du serveur
app.listen(PORT, () => {
    console.log(`Backend simulé lancé sur http://localhost:${PORT}`);
});