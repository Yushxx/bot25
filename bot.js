const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const http = require('http');

const token = '7282753875:AAEcih5wYDaniimZD_5lWt3qhn7ElhQvGl4';
const bot = new TelegramBot(token, {polling: true});

const channelIds = ['-1001923341484', '-1002191790432'];

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name;

    // Enregistrer les informations de l'utilisateur
    const userId = msg.from.id;
    const userData = {
        id: userId,
        solde: 0,
        invite: 0
    };

    // Envoyer les informations au fichier PHP pour les stocker
    axios.post('https://solkah.org/app/save.php', userData)
        .then(response => console.log('Données envoyées'))
        .catch(error => console.log('Erreur lors de l\'envoi des données', error));

    const message = `Salut ${userName}, gagnez 7000 FCFA pour chaque personne que vous invitez ! Avant de continuer, veuillez rejoindre les canaux ci-dessous :`;
    const options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Canal 1', url: 'https://t.me/+YbIDtsrloZZiNmE0' }],
                [{ text: 'Canal 2', url: 'https://t.me/+rSXyxHTwcN5lNWE0' }],
                [{ text: 'Check✅️', callback_data: 'check_membership' }]
            ]
        }
    };

    bot.sendMessage(chatId, message, options);
});

bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const action = callbackQuery.data;

    if (action === 'check_membership') {
        const isMember = await checkMembership(userId);
        if (isMember) {
            bot.sendMessage(chatId, 'Vous êtes membre des canaux. Voici les options disponibles :', {
                reply_markup: {
                    keyboard: [
                        ['Play to win'],
                        ['Inviter', 'Mon compte'],
                        ['Support', 'Tuto']
                    ],
                    resize_keyboard: true
                }
            });
        } else {
            bot.sendMessage(chatId, 'Veuillez rejoindre les canaux avant de continuer.');
        }
    }
});

async function checkMembership(userId) {
    let isMember = true;

    for (const channelId of channelIds) {
        try {
            const chatMember = await bot.getChatMember(channelId, userId);
            if (chatMember.status === 'left' || chatMember.status === 'kicked') {
                isMember = false;
                break;
            }
        } catch (error) {
            console.log('Erreur lors de la vérification de l\'adhésion', error);
            isMember = false;
        }
    }

    return isMember;
}

bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    if (msg.text === 'Play to win') {
        bot.sendMessage(chatId, 'Tapez et gagnez des coins :', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Play', url: 'https://t.me/GxGcashbot/notcoin' }]
                ]
            }
        });
    } else if (msg.text === 'Inviter') {
        const invitationLink = `https://t.me/GxGcashbot?start=${msg.from.id}`;
        bot.sendMessage(chatId, `Partager et gagnez 7000 FCFA !\nLien : ${invitationLink}`);
    } else if (msg.text === 'Mon compte') {
        axios.get('https://solkah.org/app/data.txt')
            .then(response => {
                const userData = JSON.parse(response.data);
                const userInfo = userData.find(user => user.id === msg.from.id.toString());

                if (userInfo) {
                    const message = `ID : ${userInfo.id}\nSolde : ${userInfo.solde} FCFA\nInvités : ${userInfo.invite}`;
                    bot.sendMessage(chatId, message, {
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: 'Retrait', callback_data: 'retrait' }]
                            ]
                        }
                    });
                } else {
                    bot.sendMessage(chatId, 'Informations utilisateur non trouvées.');
                }
            })
            .catch(error => console.log('Erreur lors de la récupération des données utilisateur', error));
    } else if (msg.text === 'Support') {
        bot.sendMessage(chatId, 'Contactez @medatt00 pour assistance.');
    } else if (msg.text === 'Tuto') {
        bot.sendMessage(chatId, 'Voici le tutoriel :', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Voir le tuto', url: 'https://t.me/gxgcaca/1' }]
                ]
            }
        });
    }
});

bot.on('callback_query', (callbackQuery) => {
    const message = callbackQuery.message;
    if (callbackQuery.data === 'retrait') {
        bot.sendMessage(message.chat.id, 'Le minimum de retrait est 30.000F.');
    }
});


// Code keep_alive pour éviter que le bot ne s'endorme
http.createServer(function (req, res) {
    res.write("I'm alive");
    res.end();
}).listen(8080);
