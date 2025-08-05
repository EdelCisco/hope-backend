const express                  = require('express');
const router                   = express.Router();
const {body, validationResult} = require ('express-validator');
const Users                    = require ('./Users/Utilisateurs.js');
const upload                   = multer({ storage: multer.memoryStorage() })
const multer                   = require('multer') 

  router.post('/Inscription'  , [
  body("password").isLength({min:8}).withMessage("Le mot de passe doit contenir au moins 8 caractères").matches(/[a-z]/).withMessage("Le mot de passe doit contenir au moins une minuscule").matches(/[A-Z]/).withMessage("Le mot de passe doit contenir au moins une majuscule").matches(/[\W_]/).withMessage("Le mot de passe doit contenir au moins un caractèr spéciale").matches(/[0-9]/).withMessage("Le mot de passe doit contenir au moins un chiffre"),
  ], Users.Inscription);
 
 
  router.get  ('/rdv'                                                        , Users.Rdv);
  router.get  ('/notifications/:id_client'                                  , Users.Notif);
  router.get  ('/auth/google'                                                , Users.google);
  router.get  ('/auth/google/callback'                                       , Users.googles);
  router.get  ('/medecins'                                                   , Users.medecins)
  router.get  ('/messages'                                                   , Users.messages);
  router.get  ('/historique'                                                 , Users.historique);
  router.get  ('/Deconnexion'                                                , Users.deconnexion);
  router.get  ('/Authenfication'                                             , Users.authentification)
 

  router.post ('/notifications/:id_client/mark-as-read'                      , Users.Mark);
  router.post ('/notifications/:id_client/delete/:id_notification'           , Users.Dell);
  router.post ('/Code'                                                       , Users.Code);
  router.post ('/Token'                                                      , Users.token)
  router.post ('/Profil'                                                     , Users.profil)
  router.post ('/notifications/:id_client/delete-all'                        ,Users.DellAll);
  router.post ('/Modifier'                                                   ,Users.Modifier)
  router.post ('/Suppression'                                                , Users.supprimer)
  router.post ('/resend-code'                                                ,Users.resendCode)
  router.post ('/Connexion'                                                  , Users.Connexion)
  router.post ('/Souscription' ,upload.single('fichier')                     , Users.Souscription);
  router.post ('/Modification'                                               , Users.Modification)
  router.post ('/envoieMessage'                                              , Users.envoieMessage)
  router.post ('/MotDePasseOublie'                                           ,Users.ModifierMotDePasse)


                                                                             
                                                      module.exports= router;

