const { Telegraf } = require('telegraf');
const http = require('http');

const BOT_TOKEN = '8896495882:AAFj9M4UjubMvq6Ss3OdSSrMiQ3Vr-Z72hU'; 
const MY_CHAT_ID = 509898460; 
const RENDER_URL = 'https://vilora-farm.onrender.com'; 
const WEBHOOK_PATH = `/webhook-${BOT_TOKEN.split(':')[1]}`; 

const bot = new Telegraf(BOT_TOKEN);

// Словарь для связки ID сообщений у админа с ID пользователя
const activeDialogs = {};

bot.on('message', async (ctx) => {
  const chatId = ctx.chat.id;

  if (chatId !== MY_CHAT_ID) {
    try {
      // Пересылаем сообщение клиента админу
      const forwarded = await ctx.telegram.forwardMessage(MY_CHAT_ID, chatId, ctx.message.message_id);
      
      // Отправляем подсказку с ID
      const promptMsg = await ctx.telegram.sendMessage(MY_CHAT_ID, `💬 Ответьте на это сообщение, чтобы написать пользователю [ID:${chatId}]`, {
        reply_to_message_id: forwarded.message_id
      });
      
      // Запоминаем связь для ОБЕИХ сообщений (и для пересланного, и для подсказки)
      activeDialogs[forwarded.message_id] = chatId;
      activeDialogs[promptMsg.message_id] = chatId;
      
      console.log(`📥 Сообщение от пользователя ${chatId} переслано.`);
    } catch (err) {
      console.error('❌ Ошибка пересылки:', err);
    }
  } 
  else if (chatId === MY_CHAT_ID) {
    if (ctx.message.reply_to_message) {
      const repliedMsgId = ctx.message.reply_to_message.message_id;
      let targetUserId = activeDialogs[repliedMsgId];

      // Резервный поиск по тексту (на случай перезапуска бота)
      if (!targetUserId) {
        const replyText = ctx.message.reply_to_message.text || ctx.message.reply_to_message.caption || '';
        const match = replyText.match(/\[ID:(\d+)\]/);
        if (match) {
          targetUserId = match[1];
        }
      }

      if (targetUserId) {
        try {
          await ctx.telegram.copyMessage(targetUserId, MY_CHAT_ID, ctx.message.message_id);
          console.log(`📤 Ответ успешно отправлен пользователю ${targetUserId}`);
        } catch (err) {
          console.error('❌ Ошибка отправки пользователю:', err);
        }
      } else {
        console.log('⚠️ Админ сделал реплай, но ID пользователя не найден.');
      }
    }
  }
});

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.url === WEBHOOK_PATH && req.method === 'POST') {
    return bot.webhookCallback(WEBHOOK_PATH)(req, res);
  }
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot webhook server is active and running!');
});

server.listen(PORT, async () => {
  console.log(`🌐 HTTP-сервер запущен на порту ${PORT}`);
  try {
    const fullWebhookUrl = `${RENDER_URL}${WEBHOOK_PATH}`;
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await bot.telegram.setWebhook(fullWebhookUrl);
    console.log('🚀 Вебхук успешно зарегистрирован!');
  } catch (err) {
    console.error('❌ Ошибка настройки вебхука:', err.message);
  }
});

process.once('SIGINT', () => server.close());
process.once('SIGTERM', () => server.close());