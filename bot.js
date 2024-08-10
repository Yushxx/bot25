const { Telegraf } = require('telegraf');
const axios = require('axios');
const http = require('http');

// Remplacez par votre jeton de bot Telegram
const bot = new Telegraf('7282753875:AAEcih5wYDaniimZD_5lWt3qhn7ElhQvGl4');

// URL des scripts PHP pour lire et écrire les données
const readDataUrl = 'https://solkah.org/app/read_data.php';
const updateDataUrl = 'https://solkah.org/app/update_data.php';

// Lire les données depuis data.txt
async function readData() {
  try {
    const response = await axios.get(readDataUrl);
    const data = JSON.parse(response.data.data);
    return data;
  } catch (error) {
    console.error('Erreur lors de la lecture des données:', error);
    return [];
  }
}

// Mettre à jour les données dans data.txt
async function updateData(data) {
  try {
    const response = await axios.post(updateDataUrl, { data: JSON.stringify(data) });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour des données:', error);
    return null;
  }
}

// Commande /start
bot.start(async (ctx) => {
  const userId = ctx.message.from.id;
  const username = ctx.message.from.username || 'Utilisateur';
  const referrerId = ctx.startPayload; // Utilisé pour les parrainages

  // Lire les données depuis data.txt
  const data = await readData();
  let user = data.find(user => user.id === userId);

  if (!user) {
    // Enregistrer un nouvel utilisateur dans data.txt
    user = {
      id: userId,
      username: username,
      balance: 0,
      invited_count: 0
    };
    data.push(user);
    await updateData({ data: JSON.stringify(data) });

    // Mettre à jour le compteur d'invités du parrain
    if (referrerId) {
      const referrer = data.find(user => user.id === referrerId);
      if (referrer) {
        referrer.invited_count += 1;
        await updateData({ data: JSON.stringify(data) });
      }
    }
  }

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

// Commande pour vérifier l'adhésion aux canaux
bot.action('check', async (ctx) => {
  const userId = ctx.from.id;

  try {
    const [member1, member2] = await Promise.all([
      bot.telegram.getChatMember('-1001923341484', userId),
      bot.telegram.getChatMember('-1002191790432', userId)
    ]);

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
  } catch (err) {
    console.error('Erreur lors de la vérification des membres:', err);
    ctx.reply('Une erreur est survenue lors de la vérification. Veuillez réessayer.');
  }
});

// Mon compte
bot.hears('Mon compte 👥', async (ctx) => {
  const userId = ctx.message.from.id;

  const data = await readData();
  const user = data.find(user => user.id === userId);

  if (user) {
    const balance = user.invited_count * 700; // Calculer le solde
    ctx.reply(`🤴🏻 Mon compte\n🆔 ID: ${user.id}\n💰Balance: ${balance} Fcfa\n🫂Invités: ${user.invited_count}`);
  } else {
    ctx.reply('Utilisateur non trouvé.');
  }
});

// Inviter
bot.hears('Inviter🫂', (ctx) => {
  const userId = ctx.message.from.id;
  ctx.reply(`Partager ce lien et gagnez 700 Fcfa à chaque invité:\nLien: t.me/GxGcashbot?start=${userId}`);
});

// Play to win 🎮
bot.hears('Play to win 🎮', (ctx) => {
  const userId = ctx.message.from.id;
  const playLink = `http://t.me/GxGcashbot/tap?ref=${userId}`;
  ctx.reply(`Taper et gagner des pièces\n\nVotre code d'accès: ${userId}\n\nCliquez en bas pour commencer`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Play', url: playLink }]
      ]
    }
  });
});

// Withdrawal
bot.hears('Withdrawal💰', async (ctx) => {
  const userId = ctx.message.from.id;

  const data = await readData();
  const user = data.find(user => user.id === userId);

  if (user) {
    const balance = user.invited_count * 700; // Calculer le solde
    if (balance >= 30000) {
      ctx.reply('Envoyez votre mode de paiement.');
    } else {
      ctx.reply('Le minimum de retrait est de 30.000 Fcfa.');
    }
  } else {
    ctx.reply('Utilisateur non trouvé.');
  }
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
