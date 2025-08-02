const express                  = require('express');
const router                   = express.Router();
const {body, validationResult} = require ('express-validator');
const Users                    = require ('./Users/Utilisateurs.js');




  router.post('/Inscription'  , [
  body("password").isLength({min:8}).withMessage("Le mot de passe doit contenir au moins 8 caractères").matches(/[a-z]/).withMessage("Le mot de passe doit contenir au moins une minuscule").matches(/[A-Z]/).withMessage("Le mot de passe doit contenir au moins une majuscule").matches(/[\W_]/).withMessage("Le mot de passe doit contenir au moins un caractèr spéciale").matches(/[0-9]/).withMessage("Le mot de passe doit contenir au moins un chiffre"),
  ], Users.Inscription);
 
  router.get('/medecins'   , Users.medecins)
  router.post('/Token'   , Users.token)
  router.get('/rdv'   , Users.Rdv);
  router.post('/Code'   , Users.Code);
  router.post('/Profil'        , Users.profil)
  router.post('/Connexion'     , Users.Connexion)
  router.post('/Suppression'   , Users.supprimer)
  router.get('/Deconnexion'   , Users.deconnexion);
  router.post('/resend-code',Users.resendCode)
  router.post('/Souscription'  , Users.Souscription);
  router.post('/Modification'  , Users.Modification)
  router.post('/Modifier',Users.Modifier)
  // router.post('/notifications/mark-as-read/:id'     , Users.Mark);
  router.get ('/Authenfication'                     , Users.authentification)
  // router.get ('/confirm/:tokenV'                , Users.Confirmation)

//   router.get ('/notifications/:userId'              , Users.Notif);

// router.post('/notifications/mark-all-read', Users.  MarkAll);


// router.post('/notifications/delete-all',Users.DellAll);

// router.post('/notifications/delete/:id', Users.Dell);

router.post('/MotDePasseOublie',Users.ModifierMotDePasse)
// router.post('/reset-password',  [
//     body("password").isLength({min:8}).withMessage("Le mot de passe doit contenir au moins 8 caractères").matches(/[a-z]/).withMessage("Le mot de passe doit contenir au moins une minuscule").matches(/[A-Z]/).withMessage("Le mot de passe doit contenir au moins une majuscule").matches(/[\W_]/).withMessage("Le mot de passe doit contenir au moins un caractèr spéciale").matches(/[0-9]/).withMessage("Le mot de passe doit contenir au moins un chiffre"),
//   ],Users.resetPassword)


                                                                             
                                                      module.exports= router;

