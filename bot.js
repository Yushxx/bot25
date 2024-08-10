const { Telegraf } = require('telegraf');
const http = require('http');
const axios = require('axios'); // Pour faire des requêtes HTTP

// Remplacez par votre jeton de bot Telegram
const bot = new Telegraf('7282753875:AAEcih5wYDaniimZD_5lWt3qhn7ElhQvGl4');

// Fonction pour envoyer les données utilisateur au script PHP
function sendUserDataToServer(userData) {
  axios.post('https://solkah.org/app/index.php', userData)
    .then(response => {
      console.log('Données envoyées au serveur:', response.data);
    })
    .catch(error => {
      console.error('Erreur lors de l\'envoi des données au serveur:', error);
    });
}

// Fonction pour enregistrer un nouvel utilisateur
function registerUser(userId, username, referrerId) {
  const userData = {
    name: username,
    id: userId,
    invites: 0,
    balance: 0,
    referrerId: referrerId || ''
  };

  sendUserDataToServer(userData);
  console.log('Utilisateur enregistré:', userId);

  // Mettre à jour le compteur d'invités du parrain
  if (referrerId) {
    updateUserInvites(referrerId);
  }
}

// Fonction pour mettre à jour le compteur d'invités
function updateUserInvites(referrerId) {
  const updateData = {
    id: referrerId,
    updateInvites: true
  };

  sendUserDataToServer(updateData);
  console.log('Compteur d\'invités mis à jour pour:', referrerId);
}

// Commande /start
bot.start((ctx) => {
  const userId = ctx.message.from.id;
  const username = ctx.message.from.username || 'Utilisateur';
  const referrerId = ctx.startPayload; // Utilisé pour les parrainages

  registerUser(userId, username, referrerId);

  ctx.reply(`Salut ${username}, bienvenue dans le programme de récompense GxGcash. Veuillez rejoindre les canaux ci-dessous avant de continuer:

👉: [Rejoindre solkah](https://t.me/+YbIDtsrloZZiNmE0)

👉 : [ Rejoindre Jushey Moneyⓥ ](https://t.me/+qm3jHNWSJYtlOTJk)`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Check', callback_data: 'check' }]
      ]
    },
    parse_mode: 'Markdown'
  });
});

// Vérification de l'adhésion aux canaux
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
              [{ text: 'Mon compte 👥' }, { text: 'Inviter🫂' }],
              [{ text: 'Play to win 🎮' }, { text: 'Withdrawal💰' }],
              [{ text: 'Support📩' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: false 
          }
        });
      } else {
        ctx.reply('Veuillez rejoindre les canaux avant de continuer.');
      }
    })
    .catch((err) => {
      console.error('Erreur lors de la vérification des membres:', err);
      ctx.reply('Une erreur est survenue lors de la vérification. Veuillez réessayer.');
    });
});

// Mon compte
bot.hears('Mon compte 👥', (ctx) => {
  const userId = ctx.message.from.id;

  axios.post('https://solkah.org/app/index.php', { id: userId })
    .then(response => {
      const user = response.data;
      if (user) {
        const balance = user.invites * 700; // Calculer le solde
        ctx.reply(`🤴🏻 Mon compte\n🆔 ID: ${user.id}\n💰Balance: ${balance} Fcfa\n🫂Invités: ${user.invites}`);
      } else {
        ctx.reply('Utilisateur non trouvé.');
      }
    })
    .catch(error => {
      console.error('Erreur lors de la récupération des informations utilisateur:', error);
      ctx.reply('Une erreur est survenue. Veuillez réessayer plus tard.');
    });
});

// Inviter
bot.hears('Inviter🫂', (ctx) => {
  const userId = ctx.message.from.id;
  ctx.reply(`Partager ce lien et gagnez 700 Fcfa à chaque invité:\nLien: t.me/GXG88bot?start=${userId}`);
});

// Play to win 🎮
bot.hears('Play to win 🎮', (ctx) => {
  const userId = ctx.message.from.id;

  // Le lien pour jouer, avec un code d'accès unique basé sur l'ID de l'utilisateur
  const playLink = `http://t.me/GxGcashbot/tap?ref=${userId}`;

  // Envoyer un message avec le code d'accès unique et un bouton inline "Play"
  ctx.reply(`Taper et gagner des pièces\n\nVotre code d'accès: ${userId}\n\nCliquez en bas pour commencer`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Play', url: playLink }]  // Bouton "Play" qui redirige vers le lien
      ]
    }
  });
});

// Withdrawal
bot.hears('Withdrawal💰', (ctx) => {
  const userId = ctx.message.from.id;

  axios.post('https://solkah.org/app/index.php', { id: userId })
    .then(response => {
      const user = response.data;
      const balance = user.invites * 700; // Calculer le solde
      if (balance >= 30000) {
        ctx.reply('Envoyez votre mode de paiement.');
      } else {
        ctx.reply('Le minimum de retrait est de 30.000 Fcfa.');
      }
    })
    .catch(error => {
      console.error('Erreur lors de la vérification du solde:', error);
      ctx.reply('Une erreur est survenue. Veuillez réessayer plus tard.');
    });
});

// Support
bot.hears('Support📩', (ctx) => {
  ctx.reply('Contact: @Medatt00');
});

bot.launch();

console.log('Bot démarré');

// Code keep_alive pour éviter que le bot ne s'endorme
http.createServer(function (req, res) {
  res.write("I'm alive");
  res.end();
}).listen(8080);
