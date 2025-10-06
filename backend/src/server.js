import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import authRoutes  from '../routes/auth.js';

const app = express();
const PORT = 3000;


app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth',authRoutes)

let users = {};
let otpStore = {};

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


// Inscription utilisateur avec numéro de téléphone
app.post("/api/auth/register", (req, res) => {
  const { phone, name, password } = req.body;

  if (!phone) {
    return res.status(400).json({ message: "Numéro de téléphone requis !" });
  }

  if (users[phone]) {
    return res.status(400).json({ message: "Ce numéro existe déjà !" });
  }

  users[phone] = { name, password, verified: false };

  // Génération OTP
  const otp = generateOtp();
  otpStore[phone] = otp;

  console.log(`Utilisateur inscrit: ${phone}, OTP: ${otp}`);

  res.json({
    message: "Inscription réussie. OTP envoyé (voir console backend).",
    phone,
  });
});

// Vérification OTP
app.post("/api/auth/verify/otp", (req, res) => {
  const { otp, phone } = req.body;

  if (otpStore[phone] && otpStore[phone] === otp) {
    users[phone].verified = true;
    delete otpStore[phone];
    return res.json({ message: "OTP vérifié avec succès!" });
  }

  return res.status(400).json({ message: "OTP incorrect!" });
});

// Renvoi OTP
app.post("/api/auth/verify/resend-otp", (req, res) => {
  const { phone } = req.body;

  if (!users[phone]) {
    return res.status(400).json({ message: "Numéro non trouvé !" });
  }

  const otp = generateOtp();
  otpStore[phone] = otp;

  console.log(`Nouveau OTP pour ${phone}: ${otp}`);

  res.json({ message: "Nouveau OTP généré (voir console backend)", phone });
});

app.listen(PORT, () => {
  console.log(`Backend simulé lancé sur http://localhost:${PORT}`);
});
