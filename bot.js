const { Telegraf } = require('telegraf');
const mysql = require('mysql2');
const http = require('http');

// Remplacez par votre jeton de bot Telegram
const bot = new Telegraf('7055389679:AAHgPOvZ0UWArqOvNszAIBsfuvaOf-U4oDI');

// Configurer la connexion MySQL
// Configurer la connexion MySQL
const db = mysql.createConnection({
  host: '109.70.148.57',
  user: 'solkahor_aire',
  password: '#Fuck0099',
  database: 'solkahor_aire'
});

db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion Ã  la base de donnÃ©es:', err);
    return;
  }
  console.log('ConnectÃ© Ã  la base de donnÃ©es MySQL');
});

// Fonction pour vÃ©rifier si l'utilisateur est dÃ©jÃ  enregistrÃ©
function isUserRegistered(userId, callback) {
  db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la vÃ©rification de l\'utilisateur:', err);
      callback(false);
      return;
    }
    callback(results.length > 0);
  });
}

// Fonction pour enregistrer un nouvel utilisateur
function registerUser(userId, username, referrerId) {
  db.query('INSERT INTO users (id, username, balance, invited_count, referrer_id) VALUES (?, ?, 0, 0, ?)', [userId, username, referrerId], (err, results) => {
    if (err) {
      console.error('Erreur lors de l\'enregistrement de l\'utilisateur:', err);
      return;
    }
    console.log('Utilisateur enregistrÃ©:', userId);

    // Mettre Ã  jour le compteur d'invitÃ©s du parrain
    if (referrerId) {
      db.query('UPDATE users SET invited_count = invited_count + 1 WHERE id = ?', [referrerId], (err, results) => {
        if (err) {
          console.error('Erreur lors de la mise Ã  jour du compteur d\'invitÃ©s:', err);
        } else {
          console.log('Compteur d\'invitÃ©s mis Ã  jour pour:', referrerId);
        }
      });
    }
  });
}

// Commande /start
bot.start((ctx) => {
  const userId = ctx.message.from.id;
  const username = ctx.message.from.username || 'Utilisateur';
  const referrerId = ctx.startPayload; // UtilisÃ© pour les parrainages

  isUserRegistered(userId, (registered) => {
    if (!registered) {
      registerUser(userId, username, referrerId);
    }
  });

  ctx.reply(`Salut, bienvenue dans le programme de rÃ©compense GxGcash. Veuillez rejoindre les canaux ci-dessous avant de continuer:`, {
  reply_markup: {
      inline_keyboard: [
      [{ text: 'Canal 1', url: 'https://t.me/+YbIDtsrloZZiNmE0' }],
                [{ text: 'Canal 2', url: 'https://t.me/+rSXyxHTwcN5lNWE0' }],
        [{ text: 'Checkâœ…ï¸', callback_data: 'check' }]
      ]
    },
    parse_mode: 'Markdown'
  });
});



// VÃ©rification de l'adhÃ©sion aux canaux
bot.action('check', (ctx) => {
  const userId = ctx.from.id;

  Promise.all([
    bot.telegram.getChatMember('-1001923341484', userId),
    bot.telegram.getChatMember('-1002191790432', userId)
  ])
    .then(([member1, member2]) => {
      if (['member', 'administrator', 'creator'].includes(member1.status) &&
          ['member', 'administrator', 'creator'].includes(member2.status)) {
        ctx.reply('Bienvenue au tableau de bord', {
          reply_markup: {
            keyboard: [
              [{ text: 'Mon compte ðŸ‘¥' }, { text: 'InviterðŸ«‚' }],
              [{ text: 'Play to win ðŸŽ®' }, { text: 'WithdrawalðŸ’°' }],
              [{ text: 'SupportðŸ“©' }, { text: 'tuto' }]
            ],
            resize_keyboard: true,
            one_time_keyboard:false 
          }
        });
      } else {
        ctx.reply('Veuillez rejoindre les canaux avant de continuer.');
      }
    })
    .catch((err) => {
      console.error('Erreur lors de la vÃ©rification des membres:', err);
      ctx.reply('Une erreur est survenue lors de la vÃ©rification. Veuillez rÃ©essayer.');
    });
});

// Mon compte
bot.hears('Mon compte ðŸ‘¥', (ctx) => {
  const userId = ctx.message.from.id;

  db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la rÃ©cupÃ©ration des informations utilisateur:', err);
      ctx.reply('Une erreur est survenue. Veuillez rÃ©essayer plus tard.');
      return;
    }

    if (results.length > 0) {
      const user = results[0];
      const balance = user.invited_count * 700; // Calculer le solde
      ctx.reply(`ðŸ¤´ðŸ» Mon compte\nðŸ†” ID: ${user.id}\nðŸ’°Balance: ${balance} Fcfa\nðŸ«‚InvitÃ©s: ${user.invited_count}`);
    } else {
      ctx.reply('Utilisateur non trouvÃ©.');
    }
  });
});

// Inviter
bot.hears('InviterðŸ«‚', (ctx) => {
  const userId = ctx.message.from.id;
  ctx.reply(`Partager ce lien et gagnez 700 Fcfa Ã  chaque invitÃ©:\nðŸ”—Lien: https://t.me/Hush_cashbot?start=${userId}`);
});

// Play to win ðŸŽ®
bot.hears('Play to win ðŸŽ®', (ctx) => {
  const userId = ctx.message.from.id;

  // Le lien pour jouer, avec un code d'accÃ¨s unique basÃ© sur l'ID de l'utilisateur
  const playLink = `https://t.me/gxgcashbot/notcoin?ref=${userId}`;

  // Envoyer un message avec le code d'accÃ¨s unique et un bouton inline "Play"
  ctx.reply(`Taper et gagner des piÃ¨ces\n\nVotre code d'accÃ¨s: ${userId}\n\nCliquez en bas pour commencer`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Play', url: playLink }]  // Bouton "Play" qui redirige vers le lien
      ]
    }
  });
});

// Withdrawal
bot.hears('WithdrawalðŸ’°', (ctx) => {
  const userId = ctx.message.from.id;

  db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la vÃ©rification du solde:', err);
      ctx.reply('Une erreur est survenue. Veuillez rÃ©essayer plus tard.');
      return;
    }

    if (results.length > 0) {
      const user = results[0];
      const balance = user.invited_count * 700; // Calculer le solde
      if (balance >= 30000) {
        ctx.reply('Envoyez votre mode de paiement.');
      } else {
        ctx.reply('Le minimum de retrait est de 30.000 Fcfa.');
      }
    } else {
      ctx.reply('Utilisateur non trouvÃ©.');
    }
  });
});
// Support
bot.hears('tuto', (ctx) => {
  ctx.reply(`tuto`  , {
              reply_markup: {
                  inline_keyboard: [
                  [{ text: 'voirðŸ”—', url: 'https://t.me/gxgcaca' }]
                          ]
    },
    parse_mode: 'Markdown'
  });
});


// Support
bot.hears('SupportðŸ“©', (ctx) => {
  ctx.reply('Contact: @Medatt00');
});

bot.launch();

console.log('Bot dÃ©marrÃ©');
// Code keep_alive pour Ã©viter que le bot ne s'endorme
http.createServer(function (req, res) {
    res.write("I'm alive");
    res.end();
}).listen(8080);
