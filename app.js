const path             = require ('path')
const cors             = require ('cors');
const helmet           = require ('helmet');
const morgan           = require ('morgan'); 
const dotenv           = require ("dotenv");
const express          = require ("express");
const cookieParser     = require ('cookie-parser');
const db                = require("./Config/db.js");
const {sendReminderEmail} = require('./Config/sendReminderEmail');
const http = require('http');
const {Socket }= require('../backend/Config/server')

const Auth             = require ('./Auth/Authentification.js');





       dotenv.config();

 const app             = express();
const Port            = process.env.PORT ;
exports.Port
const server = http.createServer(app);
Socket(server)

app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(morgan('common'));

app.use(cors({
  origin: ['http://localhost:5173','http://localhost:5174'],  // Permet uniquement l'origine du frontend React
  methods: ['GET', 'POST', 'OPTIONS'], // Méthodes autorisées
  allowedHeaders: ['Content-Type', 'Authorization'],  // En-têtes autorisés
  credentials: true,  // Autorise l'envoi de cookies
  preflightContinue: true,
  optionsSuccessStatus: 204
}));

app.use("/Uploads", express.static(path.join(__dirname, "Update", "Uploads"), {
  setHeaders: (res, path, stat) => {
    res.set('Access-Control-Allow-Origin', ['http://localhost:5173','http://localhost:5174']); // Permet l'origine de ton frontend
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS'); // Permet les méthodes GET et OPTIONS
    res.set('cross-origin-resource-policy', 'cross-origin');  // Permet l'accès depuis un autre domaine
    res.set('cross-origin-opener-policy', 'unsafe-none');  // Permet d'éviter les restrictions de politique d'ouverture croisée
    res.set('content-security-policy', "default-src 'self'; img-src 'self' http://localhost:3000");  // Permet de charger les images depuis ton backend
  }
}));


app.use('/',Auth);





// // Cron toutes les heures
// cron.schedule('0 * * * *', async () => {
//   try {
//     // Trouver utilisateurs avec token expirant dans moins de 4h mais encore valides
//     const [usersToWarn] = await db.query(`
//       SELECT Email, token_expiration
//       FROM utilisateur
//       WHERE token_expiration IS NOT NULL
//         AND token_expiration > NOW()
//         AND token_expiration <= DATE_ADD(NOW(), INTERVAL 4 HOUR)
//         AND warned IS NULL -- champ booléen ou datetime indiquant si on a déjà averti
//     `);

//     for (const user of usersToWarn) {
//       await sendReminderEmail(user.email);
//       // Mettre à jour pour indiquer qu'on a averti
//       await db.query(`UPDATE utilisateur SET warned = NOW() WHERE Email = ?`, [user.email]);
//     }

//     // Supprimer les comptes expirés
//     const [deleteResult] = await db.query(`
//       DELETE FROM utilisateur
//       WHERE token_expiration IS NOT NULL AND token_expiration <= NOW()
//     `);
//     console.log(`Suppression des comptes expirés : ${deleteResult.affectedRows}`);

//   } catch (error) {
//     console.error('Erreur dans la tâche cron:', error);
//   }
// });





app.get("/", (req, res) => {
  console.log("Hello Word");
})


server.listen(Port,() => {
  console.log(`Serveur en cours : http://localhost:${Port}`);
});







