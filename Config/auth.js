const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const db = require("../Config/db"); // ← adapte le chemin à ton fichier MySQL
require("dotenv").config();
const argon2   = require('argon2');
const {ConfirmationCompte} = require('../Config/sendReminderEmail')

passport.use(
  new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback",
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const [rows] = await db.execute('SELECT * FROM clients WHERE email = ?', [email]);

      if (rows.length > 0) {
        return done(null, rows[0]); // utilisateur existant
      }

      // Création du compte
      const nom = profile.displayName || "Utilisateur Google";
      const motDePasse = Math.random().toString(36).slice(-8);
      const ddn = "2000-01-01";
      const hash = await argon2.hash(motDePasse)
      const msg= "Voici votre mot de passe vous pouvez le modifie plutard "
      const [result] = await db.execute(`
        INSERT INTO clients (nom_client,email, mot_de_passe, date_de_naissance)
        VALUES (?, ?, ?, ?)`,
        [nom,email, hash, ddn]
      );

      const newUser = {
        id_client: result.insertId,
        nom: nom,
        email: email,
        mot_de_passe: motDePasse,
        sexe: "",
        date_de_naissance: ddn,
        rang: "",
        complet: 0
      };
      ConfirmationCompte(msg,email, motDePasse)
      return done(null, newUser);
    } catch (err) {
      console.error("Erreur stratégie Google :", err);
      return done(err, false);
    }
  })
);


// Sérialisation
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

module.exports = passport;
