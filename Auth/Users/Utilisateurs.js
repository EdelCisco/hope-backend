const dayjs                    = require("dayjs");
const argon2                   = require('argon2');
const jwt                      = require('jsonwebtoken');
const utc                      = require("dayjs/plugin/utc");
const db                       = require("../../Config/db.js");
const {IO,verifyEmail, connectedUsers} = require('../../Config/server.js');
const passport = require('../../Config/auth.js');
const {body, validationResult} = require ('express-validator');
const timezone                 = require("dayjs/plugin/timezone");
const crypto = require('crypto');
const {ConfirmationCompte,UpdatePassword} = require('../../Config/sendReminderEmail.js')




dayjs.extend(utc);
dayjs.extend(timezone);

// GESTION DU TOKEN AU NIVEAU DE LA BARRE DE NAVIGATION

exports.google= passport.authenticate('google', { scope: ['profile', 'email'] })

exports.googles = (req, res, next) => {
  passport.authenticate('google', (err, user, info) => {
    if (err) {
      console.error('Erreur pendant la connexion Google :', err);
      return res.redirect('/Connexion'); // redirige proprement
    }

    if (!user) {
      console.warn('Connexion échouée ou utilisateur non trouvé');
      return res.redirect('/Connexion');
    }

    req.logIn(user, (err) => {
      if (err) {
        console.error('Erreur lors de la connexion de l\'utilisateur :', err);
        return res.redirect('/Connexion');
      }

      // Création du token JWT avec les infos de `user`
      const token = jwt.sign(
        {
          id: user.id_client,
          nom: user.nom_complet,
          ddn: user.date_de_naissance,
          email: user.email,
          sexe: user.xexe,
          MDP:"******",
          rg: user.rang
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Cookie sécurisé contenant le token
      res.cookie('token', token, {
        httpOnly: true,
        secure: false, // mettre à true si HTTPS
        sameSite: 'lax',
        maxAge: 3600000
      });
       console.log('Connexion réussie via Google OAuth');
       return res.redirect('http://localhost:5173');
    })
  })(req, res, next);
};

exports.token = async(req, res) => {

    const token = await req.cookies.token
   
    if(!token){ 
        console.log("Fonction Token: Token introuvable")
        return   res.json({token:null });
    } 
    else {
        jwt.verify(token, process.env.JWT_SECRET, async(err, user) => {
         try {
                if (err) {
                    console.log("Fonction Token: err Token introuvable")
                    return res.status(403).json({ error: 'Token invalide' });
                }
              
                const id = user.id;
               
                let [sql]  = await db.execute('SELECT * FROM clients WHERE id_client=?', [id]);

                if (sql.length === 0) {
                    return res.status(404).json({ error: 'Utilisateur non trouvé' });
                } 
                else { 
                  
                  
                 const infos={
                     id_client: sql[0].id_client,
                    Nom: sql[0].nom_complet,
                    ddn: sql[0].date_de_naissance,
                    MotDePasse: user.MDP,
                    Email: sql[0].email,
                    Sexe: sql[0].sexe,
                    Rang: sql[0].rang,
                    complet:sql[0].complet
                 }
            
                    res.json(infos);
                }
            }
            catch(e){
                    console.log('Erreur lors de la récupération du profil: ', e);
                    return res.status(400).json({ errors: e });
            }   
        })
    }
}

//INSCRIPTION DES UTILISATEURS

exports.Inscription = async (req, res) => {
   
    try {
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const err= errors.array()
            const error= [];
            for(let i=0;i<err.length;i++){
                error.push(err[i].msg);  
            }
            
            return res.json({ errors: error});    
        } 
        else {
        
            const {email,password, confirmPassword} = req.body;
            
             
            if(password!==confirmPassword) {
                console.log("Les deux mots de passe ne correspondent pas");
                res.json({ errors : ['Les deux mots de passe ne correspondent pas'] });
            }
            else {
                // Vérification de l'existence de l'utilisateur
                const [Users] = await db.query('SELECT * FROM clients');

                let pass = true;
                for(let i=0;i<Users.length;i++) {
                    const password_valide = await argon2.verify(Users[i].mot_de_passe, password);
                    
                    if(password_valide) {
                       
                        pass=false;
                    return  res.json({ errors : ['Un autre utilisateur utilise déjà ce mot de passe'] });
                    }
                    else{
                        
                        pass = true;
                       
                    }
                }
          
                if(pass) {
                    let [sql] = await db.execute('SELECT * FROM clients WHERE email=?',[email]);
                    
                            if(sql.length>0) {
                            console.log('Un autre utilisateur utilise déjà cet email');    
                            res.json({ errors : ['Un autre utilisateur utilise déjà cet email'] })
                            }
                        else {
                            const hash = await argon2.hash(password)

                           let [sql] = await db.execute('INSERT INTO clients (email,mot_de_passe,date_de_naissance) VALUES (?,?,?)',[email.toLowerCase(),hash,"2000-01-01"]);
                            console.log("Inscription reussie");
                            const code = Math.floor(1000 + Math.random() * 9000);
                            const msg= "Veuillez confirmer votre compte avec ce code de confirmation"
                            ConfirmationCompte(msg,email, code)
                            res.json({
                                
                                errors : null,
                                code:code,
                                email:email,
                                objet: 'MotDePasse',
                                route: '/Code',
                                msg: 'Votre compte est en cours d\'activation veuillez vérifiez votre compte email et insérer le code généré pour activer votre compte.'
                            });
                        }          
                }
                                        
            }        
        }              
        
    } catch (error) {
        console.log('erreur au niveau de l\'inscription: ', error);
        return res.status(400).json({errors: error});
    }
}

exports.resendCode = async (req, res) => {
  const  email = req.body.email;
 
  try {
                            const code = Math.floor(1000 + Math.random() * 9000);
                            const msg= "Voici le nouveau code pour activer votre compte"
                            ConfirmationCompte(msg,email, code)
                            res.json({
                                
                                errors : null,
                                code:code,
                                email:email,
                                msg: 'Code renvoyé vérifiez votre compte email et insérer le code généré pour activer votre compte.'
                            });

  } catch (err) {
    console.error(err);
    res.status(500).json({ errors: 'Erreur serveur lors du renvoi du lien.' });
  }
};


exports.Code = async (req, res) => {


  try {
      const {email,code,objet, nbre1,nbre2,nbre3,nbre4} = req.body;
        const code1= nbre1+nbre2+nbre3+nbre4;
 
        if(code1==code){
            if(objet==='MotDePasse'){
            let [sql] = await db.execute(`UPDATE clients SET confirmation=1  WHERE email=?`, [email])
             let [sq] = await db.execute(`SELECT * FROM clients  WHERE email=?`, [email])
             const data= sq[0]
               const token = jwt.sign({ id: data.id_client,nom: data.nom_complet,ddn: data.date_de_naissance, email: data.email, MDP:"******", sexe: data.xexe, rg: data.rang
                            }, process.env.JWT_SECRET, {expiresIn: '1h'});
                        

                    res.cookie('token', token, {httpOnly: true, secure: true, sameSite:'lax', maxAge: 86400000});
                    res.redirect('/Authenfication');
            }
            else{
        
                res.json({
                    route:'/RenouvelerLemdp',
                    email:email
                })
            }
         

        } else{
            return res.json({
                errors:'le code est incorrect'
            })
        }

  } catch (error) {
    console.error('Erreur lors de la confirmation :', error);
    return res.status(500).json({ msg: null, errors: 'Erreur lors de l’activation.' });
  }
};
exports.ModifierMotDePasse = async (req, res) => {
    try {
       
        
            // Échapper les entrées pour éviter l'injection SQL
            const email    = req.body.email;
         

            let [sql] = await db.execute('SELECT * FROM clients WHERE email=?',[email])

            if(sql.length>0) {
                 const code = Math.floor(1000 + Math.random() * 9000);
                 const msg= "Votre code pour la modification de votre mot de passe"
                            ConfirmationCompte(msg,email, code)
                            res.json({
                                
                                errors : null,
                                code:code,
                                email:email,
                                route: '/Code',
                                objet: 'Modifier',
                                msg: 'Un code a été envoyé vers votre adresse email veuillez vérifiez votre compte email et insérer le code généré pour modifier votre mot de passe'
                            });

            }
            else {
                    res.json({ errors : 'email inexistant' });
            }
            

        
    } catch (error) {
        console.log('erreur au niveau de l\'inscription: ', error);
        return res.status(400).json({errors: error});
    }
}





//CONNEXION DES UTILISATEURS

exports.Connexion = async (req, res) => {
    try {
        
            // Échapper les entrées pour éviter l'injection SQL
            const email    = req.body.email;
            const password = req.body.password;
            const rememberMe= req.body.rememberMe

            let [sql] = await db.execute('SELECT * FROM clients WHERE email=?',[email])

            if(sql.length>0) {
                if(sql[0].confirmation=0){
                    return res.json({ errors : null,
                                email:email,
                                route: '/Code',
                                msg: 'Votre compte n\'a pas encore été activé veuillez vérifiez votre compte email et insérer le code généré pour activer votre compte.'})
                }


                const data            = sql[0]; 
                const password_valide = await argon2.verify(data.mot_de_passe, password);
                if(!password_valide){
                    res.json({ errors : ['mot de passe incorrect'] });
                }
                else {
                  
                           
                         const token = jwt.sign({ id: data.id_client,nom: data.nom_complet,ddn: data.date_de_naissance, email: data.email, MDP: "******", sexe: data.xexe, rg: data.rang
                            }, process.env.JWT_SECRET, {expiresIn: rememberMe ? '7d' : '1h'});
                        

                    res.cookie('token', token, {httpOnly: true, secure: true, sameSite:'lax',     maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000});
                    res.redirect('/Authenfication');
                       

                   
                }

            }
            else {
                    res.json({ errors : ['email inexistant'] });
            }
            

        
    } catch (error) {
        console.log('erreur au niveau de l\'inscription: ', error);
        return res.status(400).json({errors: error});
    }
}


//Modification

exports.Modifier = async (req, res) => {


  try {
      const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const err= errors.array()
            const error= [];
            for(let i=0;i<err.length;i++){
                error.push(err[i].msg);  
            }
            
            return res.json({ errors: error});    
        }
        const {email,password,confirmPassword} = req.body;
          
            
            if(email==""){
                return res.json({
                    errors: ['Un ticket a déjà été utilisé pour effectuer cette action, générez un autre ticket en allant sur connexion ensuite mot de passe oublié']
                })
            }

        
           if(password===confirmPassword){
            
                const [Users] = await db.query('SELECT * FROM clients');

                let pass = true;
                for(let i=0;i<Users.length;i++) {
                    const password_valide = await argon2.verify(Users[i].mot_de_passe, password);
                    
                    if(password_valide) {
                       
                        pass=false;
                    return  res.json({ errors : ['Un autre utilisateur utilise déjà ce mot de passe'] });
                    }
                    else{
                        
                        pass = true;
                       
                    }
                }
          
                if(pass) {
                  
                            const hash = await argon2.hash(password)

                           let [sql] = await db.execute('UPDATE clients SET mot_de_passe=?  WHERE email=?',[hash,email]);
                            console.log("Modification reussie");
                            res.json({
                                route:'/Connexion'
                            })
                                  
                }
           }
           else{
                    res.json({errors: ['les deux mots de passent ne correspondent pas']})
           }
                                        
            }        

  catch (error) {
    console.error('Erreur lors de la confirmation :', error);
    return res.status(500).json({ msg: null, errors: 'Erreur lors de l’activation.' });
  }
};

//DECONNEXION DES UTILISATEURS

exports.deconnexion = async(req, res) => {
    res.clearCookie('token');
    res.json({errors:null, route: '/'})
}

//AUTHENTIFICATION DES UTILISATEURS

exports.authentification = async(req, res) => {
    const token = await req.cookies.token
   
    if(!token) {
      return  console.log('Fonction authentification: Token inexistant')
    } 
    else {
        jwt.verify(token, process.env.JWT_SECRET, async(e, user) => {
     
      try {
                if (e) {
                    return res.status(403).json({ error: 'Token invalide' });
                }

                const id = user.id;
                let [sql]  = await db.execute('SELECT * FROM clients WHERE id_client=?', [id]);

                if (sql.length === 0) {
                    return res.status(404).json({ error: 'Utilisateur non trouvé' });
                } 
                else { 
                      
                 const infos={
                    id_client: sql[0].id_client,
                    Nom: sql[0].nom_complet,
                    ddn: sql[0].date_de_naissance,
                    MotDePasse: user.MDP,
                    Email: sql[0].email,
                    Sexe: sql[0].sexe,
                    Rang: sql[0].Rang,
                    complet:sql[0].complet
                    
                   
                 }
               res.json({route:'/', infos: infos})
                }
            }
            catch(e){
                    console.log('Erreur lors de la récupération du profil: ', e);
                    return res.status(400).json({ errors: e });
            }
       })
    }
}



//PROFIL DES UTILISATEURS

exports.profil = async (req, res) => {
   
   
    try {
        const token = await req.cookies.token
        if (!token) {
           return res.json({ route: '/Connexion', errors: 'token expiré' })
        }
        jwt.verify(token, process.env.JWT_SECRET, async(err, user) => {
            try {
                if (err) {
                    return res.status(403).json({ error: 'Token invalide' });
                }

                const id = user.id;
                let [sql]  = await db.execute('SELECT * FROM clients WHERE id_client=?', [id]);

                if (sql.length === 0) {
                    return res.status(404).json({ error: 'Utilisateur non trouvé' });
                } 
                else { 
                  
                    
                    let mdp = "";

                    for(i=0;i< (user.MDP).length;i++) {
                        mdp += ".";
                    }
                 
            
                    res.json({errors: null, token: token, MDP: mdp, infos: sql[0]});
                }
            }
            catch(e){
                    console.log('Erreur lors de la récupération du profil: ', e);
                    return res.status(400).json({ errors: e });
            }   
        });
    } catch (error) {
        console.log('Erreur lors de la récupération du profil : ', error);
        return res.status(400).json({ errors: error });
    }
}


exports.Modification = async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.json({ route: '/Connexion', errors: 'token expiré' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token invalide' });
        }

        try {
            const { nom, ddn, sexe, email, rang, password, confirmpassword } = req.body;
         

            const [rows] = await db.execute("SELECT * FROM clients WHERE id_client = ?", [user.id]);
            if (rows.length === 0) {
                return res.json({ errors: ['utilisateur inexistant'] });
            }

            const data = rows[0];

            const password_valide = await argon2.verify(data.mot_de_passe, confirmpassword);
            if (!password_valide) {
                return res.json({ errors: ['mot de passe incorrect'] });
            }

            // Gestion du nouveau mot de passe
            let hash = data.mot_de_passe;
            if (password && password !== "") {
                const [Users] = await db.query('SELECT * FROM clients');
                for (let i = 0; i < Users.length; i++) {
                    const match = await argon2.verify(Users[i].mot_de_passe, password);
                    if (match) {
                        return res.json({ errors: ['Un autre utilisateur utilise déjà ce mot de passe'] });
                    }
                }
                hash = await argon2.hash(password);
            }

            // Gestion de l'email
            let mails = data.email;
            if (email && email !== "" && email !== data.email) {
                const [emailCheck] = await db.execute("SELECT * FROM clients WHERE email = ?", [email]);
                if (emailCheck.length > 0) {
                    return res.json({ errors: ['un utilisateur utilise déjà cette email'] });
                }
                mails = email;
            }

            // Mise à jour dans la base de données
            await db.execute(
                `UPDATE clients 
                 SET nom_complet = ?, sexe = ?, date_de_naissance = ?, rang = ?, email = ?, mot_de_passe = ?, complet = ? 
                 WHERE id_client = ?`,
                [nom, sexe, ddn, rang, mails, hash, 1, user.id]
            );

            return res.json({ errors: null });

        } catch (error) {
            console.log('Erreur au niveau de l\'inscription: ', error);
            return res.status(400).json({ errors: error.message });
        }
    });
};


//FUNCTION SUPPRESION DE COMPTE UTILISATEUR

exports.supprimer = async (req, res) => {
    try {
         const token = await req.cookies.token
        if (!token) {
           return res.json({ route: '/Connexion', errors: 'token expiré' })
        }
        jwt.verify(token, process.env.JWT_SECRET, async(err, user) => {
     
                if (err) {
                    return res.status(403).json({ error: 'Token invalide' });
                }
            
            const {password} = req.body;

                const password_valide = await argon2.verify(user.mot_de_passe, password);
                if(!password_valide) {
               
                    res.json({errors : ['mot de passe incorrect']});
                } 
                else {
                  
                    const [sql] = await db.execute('DELETE FROM clients WHERE id_client=?', [user.id_client]);
                   
                    
                        res.clearCookie('token');
                        res.json({errors : null, route: '/'});
                        
                }
            
           
            })
            
                                                                                                                                         
        
    } catch (e) {
        console.log('erreur au niveau de la suppression: ', e);
        return res.status(400).json({errors: "Erreur lors de la suppression"});
    }   
}

//FONCTION SOUSCRIPTION DE SERVICES

exports.Souscription = async (req, res) => {
    const { nom, ddn, sexe, telephone, specialite, motif, medecin, DateHeure, document, typeDePatient, informations } = req.body;

    try {
        const token = await req.cookies.token;

        if (!token) {
            return res.json({ route: '/Connexion', errors: 'token expiré' });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
            try {
                if (err) {
                    console.log('403');
                    return res.json({ route: '/Connexion', errors: 'token expiré' });
                }

                let med = null;

                if (medecin !== "") {
                    const [rows] = await db.execute('SELECT * FROM medecins WHERE service=? AND nom=?', [specialite, medecin]);

                    if (rows.length > 0) {
                        med = rows[0].id_medecin;
                    }
                }


                await db.execute(
                    `INSERT INTO rendez_vous 
                    (id_client, id_medecin, nom_du_client, date_de_naissance, sexe, telephone, medecin_souhaite, service, motif, type_de_patient, document, description, date_du_rendez_vous, confirmation, validation)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [user.id, med, nom, ddn, sexe, telephone, medecin, specialite, motif, typeDePatient, document, informations, DateHeure, 0, 0]
                );

                return res.status(200).json({ route:'/' });

            } catch (e) {
                console.log('Erreur lors de la souscription: ', e);
                return res.status(400).json({ errors: e });
            }
        });
    } catch (error) {
        console.log('Erreur lors de la souscription : ', error);
        return res.status(400).json({ errors: error });
    }
};






exports.Rdv = async (req, res) => {
    try {
         const token = await req.cookies.token
        if (!token) {
            
           return res.json({ route: '/Connexion', errors: 'token expiré' })
        }
        jwt.verify(token, process.env.JWT_SECRET, async(err, user) => {
     
                if (err) {
                    return res.status(403).json({ error: 'Token invalide' });
                }
            
                  
                    const [sql] = await db.execute('SELECT * FROM rendez_vous WHERE id_client=?', [user.id]);

                        res.json({errors : null, infos: sql});

            })
            
                                                                                                                                         
        
    } catch (e) {
        console.log('erreur au niveau de la suppression: ', e);
        return res.status(400).json({errors: "Erreur lors de la suppression"});
    }   
}




exports.medecins = async (req, res) => {
    try {
            
                  
                    const [sql] = await db.execute('SELECT * FROM medecins');

                        res.json(sql);

                                                                                                                         
        
    } catch (e) {
        console.log('erreur au niveau de la suppression: ', e);
        return res.status(400).json({errors: "Erreur lors de la suppression"});
    }   
}




















exports.Mark = async (req, res) => {
  const notifId = req.params.id;
  await db.query("UPDATE notifications SET is_read = 1 WHERE id = ?", [notifId]);
  res.json({ success: true });
};

exports.Notif = async (req, res) => {
  const userId = req.params.userId;
  const [rows] = await db.query(
    "SELECT * FROM notifications WHERE id_utilisateur = ? ORDER BY created_at DESC",
    [userId]
  );
  res.json(rows);
}

exports.MarkAll= async (req, res) => {
  const { id_utilisateur } = req.body;

  if (!id_utilisateurn) {
    return res.status(400).json({ error: "id_utilisateur requis" });
  }

  try {
    await db.query(`UPDATE notifications SET is_read = 1 WHERE id_utilisateur= ?`, [id_utilisateur]);
    res.json({ success: true });
  } catch (err) {
    console.error("Erreur DB:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}


exports.DellAll= async (req, res) => {
  const {id_utilisateur } = req.body;

  if (!id_utilisateur) {
    return res.status(400).json({ error: "id_utilisateur requis" });
  }

  try {
    await db.query(`DELETE FROM notifications WHERE id_utilisateur = ?`, [id_utilisateur]);
    res.json({ success: true });
  } catch (err) {
    console.error("Erreur DB:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.Dell=  async (req, res) => {
  const id = req.params.id;

  try {
    await db.query(`DELETE FROM notifications WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Erreur suppression:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}