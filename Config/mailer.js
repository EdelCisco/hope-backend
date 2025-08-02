const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'edelalmeida84@gmail.com',
    pass: 'wbaqcdybfbzdzkfm'
  }
});

async function sendConfirmationEmail(to, token) {
  try{

  const link = `http://localhost:3000/activate/${token}`;
  await transporter.sendMail({
    from: '"Blue Numeric" <edelalmeida84@gmail.com>',
    to: to,
    subject: 'Confirmation d’email',
    html: `<p>Merci pour ton inscription !</p><p>Clique ici pour activer ton compte :</p><a href="${link}">${link}</a>`
  });
  } catch(e){
    console.log(e)
  }
  
}

module.exports = sendConfirmationEmail;
