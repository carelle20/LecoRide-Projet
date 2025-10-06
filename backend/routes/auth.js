import { Router } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const router = Router();
let otpStore = {}; 
let emailTokens = {}; 

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

// Normaliser téléphone
function normalizePhone(phone) {
    if (!phone) return null;
    if (phone.startsWith('0')) {
        return '+237' + phone.slice(1); 
    }
    return phone;
}

const JWT_SECRET = 'clesDeSecuriteSecurisees';

router.post('/register', async (req, res) => {
    console.log(">>> Nouvelle inscription reçue:", req.body);
    const { firstName, lastName, emailPhone, password } = req.body;

    const phoneRegex = /^(0|\+237)6\d{8}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    //Téléphone
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

    //Email
    if (emailRegex.test(emailPhone)) {
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

//Vérification OTP
router.post('/verify/otp', (req, res) => {
    let { otp, phone } = req.body;
    phone = normalizePhone(phone);

    if (!otpStore[phone]) {
        return res.status(400).json({ success: false, message: 'Aucun OTP généré pour ce numéro.' });
    }

    if (otpStore[phone] === otp) {
        delete otpStore[phone];
        return res.json({ success: true, message: 'OTP valide. Bienvenue !' });
    } else {
        return res.status(400).json({ success: false, message: 'OTP incorrect.' });
    }
});

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