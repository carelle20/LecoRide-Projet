// Fichier: routes/auth.js

import { Router } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const router = Router();
let otpStore = {}; 
let users = {}; // Stockage local simple des utilisateurs (perdu au redémarrage)
let emailTokens = {}; // Non utilisé, mais peut être conservé si vous le développez

const JWT_SECRET = 'clesDeSecuriteSecurisees';

const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "4a94132504a3fe",
        pass: "88501b8e277dcf"
    }
});

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhone(phone) {
    if (!phone) return null;
    if (phone.startsWith('0')) {
        return '+237' + phone.slice(1); 
    }
    return phone;
}


// =========================================================================
// 1. ROUTE D'INSCRIPTION (POST /register)
// =========================================================================
router.post('/register', async (req, res) => {
    console.log(">>> Nouvelle inscription reçue:", req.body);
    const { firstName, lastName, emailPhone, password } = req.body;

    const userKey = emailPhone; // Clé pour le stockage users
    if (users[userKey]) {
         return res.status(400).json({ success: false, message: 'Ce compte existe déjà.' });
    }
    
    // Sauvegarde de l'utilisateur (non vérifié initialement)
    users[userKey] = { firstName, lastName, password, isVerified: false };

    const phoneRegex = /^(0|\+237)6\d{8}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Téléphone
    if (phoneRegex.test(emailPhone)) {
        const phone = normalizePhone(emailPhone);
        const otp = generateOtp();
        otpStore[phone] = otp;

        console.log(`OTP généré pour ${phone} : ${otp}`);

        return res.json({
            success: true,
            type: 'phone',
            message: 'Utilisateur enregistré. OTP envoyé.',
            phone
        });
    }

    // Email
    if (emailRegex.test(emailPhone)) {
        // ... (Logique d'envoi d'email avec JWT inchangée) ...
        const token = jwt.sign({ email: emailPhone }, JWT_SECRET, { expiresIn: '5m' });
        const verificationLink = `http://localhost:4200/verify-email?token=${token}&email=${encodeURIComponent(emailPhone)}`;
        console.log(`Lien de vérification généré : ${verificationLink}`);
        
        try {
             await transporter.sendMail({ 
                from: 'noreply@monapp.com',
                to: emailPhone,
                subject: 'Vérifiez votre adresse email',
                text: `Cliquez sur ce lien pour vérifier votre email : ${verificationLink}`,
                html: `
                    <p> Veuillez cliquer sur le lien ci-dessous pour vérifier votre adresse email et activer votre compte :</p>
                    <p><a href="${verificationLink}">Vérifier mon email</a></p>
                    <p>Ce lien est valable pendant 5 minutes</p>
                `
              });
        } catch (mailError) {
             console.error("Erreur d'envoi d'email (register):", mailError);
             return res.status(500).json({ success: false, message: 'Erreur serveur lors de l\'envoi de l\'email.' });
        }

        return res.json({
            success: true,
            type: 'email',
            message: 'Utilisateur enregistré. Email de vérification envoyé.',
            email: emailPhone
        });
    }

    return res.status(400).json({ success: false, message: 'Email ou téléphone invalide.' });
});

// =========================================================================
// 2. ROUTE DE CONNEXION (POST /connexion) - CORRECTION DU 404
// =========================================================================
router.post('/connexion', async (req, res) => {
    console.log(">>> Tentative de connexion:", req.body);
    const { emailPhone, password } = req.body;
    const userKey = emailPhone; 
    
    const user = users[userKey];

    // 1. Utilisateur et mot de passe
    if (!user || user.password !== password) {
        return res.status(401).json({ message: "Identifiants incorrects." });
    }
    
    // 2. Vérification de l'état
    if (!user.isVerified) {
        return res.status(401).json({ message: "Veuillez vérifier votre compte avant de vous connecter." });
    }

    // 3. Succès: Génération des tokens JWT simulés
    const accessToken = jwt.sign({ id: userKey, name: user.firstName }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = crypto.randomBytes(64).toString('hex');

    console.log(`Connexion réussie pour: ${userKey}`);

    res.json({
        message: "Connexion réussie!",
        accessToken: accessToken, 
        refreshToken: refreshToken
    });
});


// =========================================================================
// 3. ROUTE DE DÉCONNEXION (POST /logout)
// =========================================================================
router.post('/logout', (req, res) => {
    // Le client Angular purge les tokens, le serveur renvoie un succès.
    console.log("Déconnexion serveur simulée.");
    res.status(200).json({ message: "Déconnexion serveur réussie." });
});


// =========================================================================
// 4. ROUTE DE VÉRIFICATION OTP (POST /verify/otp)
// =========================================================================
router.post('/verify/otp', (req, res) => {
    let { otp, phone } = req.body;
    phone = normalizePhone(phone); // Utilisé comme clé OTP

    if (!otpStore[phone] || otpStore[phone] !== otp) {
        return res.status(400).json({ success: false, message: 'OTP incorrect ou expiré.' });
    }
    
    // L'OTP est valide, on marque l'utilisateur comme vérifié pour la connexion
    // On utilise la version non normalisée pour chercher la clé dans 'users' (si elle existe)
    if (users[phone]) {
         users[phone].isVerified = true; 
    }
    
    delete otpStore[phone];
    return res.json({ success: true, message: 'OTP valide. Bienvenue !' });
});

// 5. Autres routes 

//Renvoyer OTP
router.post('/verify/resend-otp', (req, res) => {
    let { phone } = req.body;
    phone = normalizePhone(phone);

    if (!phone) {
        return res.status(400).json({ success: false, message: 'Numéro requis.' });
    }

    const otp = generateOtp();
    otpStore[phone] = otp;

    console.log(`Nouvel OTP pour ${phone} : ${otp}`);

    return res.json({ success: true, message: 'Nouvel OTP généré et envoyé.' });
});


//Vérification email
router.get('/verify/email', (req, res) => {
    const { token, email } = req.query;
    
    if (!token || !email) {
        return res.status(400).json({ success: false, message: "Lien invalide ou incomplet." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        //Vérifier si l'email dans le token correspond à l'email dans l'URL
        if (decoded.email !== email) {
            return res.status(401).json({ success: false, message: "Erreur de vérification. Les informations ne correspondent pas." });
        }
        
        return res.json({
            success: true,
            message: 'Email vérifié avec succès',
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            console.log(`Token expiré pour ${email}`);
            return res.status(403).json({ 
                success: false, 
                message: "Le lien de vérification a expiré. Veuillez en demander un nouveau." 
            });
        }
        
        return res.status(401).json({ success: false, message: "Lien invalide ou corrompu." });
    }
});


//Renvoyer lien email
router.post('/verify/resend-email', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "L'adresse email est requise." });
    }

    const userExists = true; 

    if (!userExists) {
        return res.status(404).json({ success: false, message: "Aucun compte trouvé avec cet email." });
    }

    //Générer un nouveau token
    const newToken = jwt.sign({ email: email }, JWT_SECRET, { expiresIn: '5m' }); 
    
    const verificationLink = `http://localhost:4200/verify-email?token=${newToken}&email=${encodeURIComponent(email)}`;
    
    try {
        await transporter.sendMail({
            from: 'noreply@monapp.com',
            to: email,
            subject: 'Nouveau lien de vérification d\'email',
            text: `Veuillez cliquer sur ce lien pour vérifier votre email : ${verificationLink}`,
            html: `<p>Cliquez sur <a href="${verificationLink}">ce lien</a> pour finaliser la vérification de votre compte.</p>`
        });
        
        console.log(`Nouveau lien de vérification envoyé à : ${email}`);

        return res.json({
            success: true,
            message: "Un nouveau lien de vérification a été envoyé à votre adresse email."
        });

    } catch (mailError) {
        console.error("Erreur lors de l'envoi du mail de renvoi:", mailError);
        return res.status(500).json({ success: false, message: "Erreur serveur lors de l'envoi de l'email." });
    }
});

export default router;