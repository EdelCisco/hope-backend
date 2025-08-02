const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
async function ConfirmationCompte (email,code){

  
                              const mailOptions = {
                                  from: process.env.EMAIL_USER,
                                  to: email,
                                  subject: 'Confirmez votre email',
                                  html: `<p>${code}</p>`
      };
  
     await transporter.sendMail(mailOptions);
                             
}


async function sendReminderEmail(email) {
 
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Votre compte sera supprimé bientôt',
      html: `
    <p>Bonjour,</p>
    <p>Votre compte Blue Numeric sera <strong>supprimé dans moins de 4 heures</strong> car il n'a pas été confirmé.</p>
    <p>Pour éviter cela, vous pouvez <a href="http://localhost:5173/resend-confirmation?email=${encodeURIComponent(email)}">cliquer ici pour recevoir un nouveau lien de confirmation</a>.</p>
    <p><em>Ce lien actualisera la date d'expiration de votre confirmation.</em></p>
    <p>Merci,<br>L'équipe Blue Numeric</p>
  `
  };

  await transporter.sendMail(mailOptions);
}

module.exports = {sendReminderEmail, ConfirmationCompte};
