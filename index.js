const { Telegraf } = require('telegraf');
const http = require('http');

const BOT_TOKEN = '8896495882:AAFj9M4UjubMvq6Ss3OdSSrMiQ3Vr-Z72hU'; 
const MY_CHAT_ID = 509898460; 
const RENDER_URL = 'https://vilora-farm.onrender.com'; // Ваш публичный URL на Render
const WEBHOOK_PATH = `/webhook-${BOT_TOKEN.split(':')[1]}`; // Уникальный защищенный путь

const bot = new Telegraf(BOT_TOKEN);

// Логика пересылки и ответов
bot.on('message', async (ctx) => {
  const chatId = ctx.chat.id;

  if (chatId !== MY_CHAT_ID) {
    try {
      const forwarded = await ctx.telegram.forwardMessage(MY_CHAT_ID, chatId, ctx.message.message_id);
      
      await ctx.telegram.sendMessage(MY_CHAT_ID, `💬 Ответьте на это сообщение, чтобы написать пользователю [ID:${chatId}]`, {
        reply_to_message_id: forwarded.message_id
      });
      
      console.log(`📥 Сообщение от пользователя ${chatId} переслано.`);
    } catch (err) {
      console.error('Ошибка пересылки:', err);
    }
  } 
  else if (chatId === MY_CHAT_ID) {
    if (ctx.message.reply_to_message) {
      const replyText = ctx.message.reply_to_message.text || '';
      const match = replyText.match(/\[ID:(\d+)\]/);

      if (match) {
        const targetUserId = match[1];
        try {
          await ctx.telegram.copyMessage(targetUserId, MY_CHAT_ID, ctx.message.message_id);
          console.log(`📤 Ответ успешно отправлен пользователю ${targetUserId}`);
        } catch (err) {
          console.error('Ошибка отправки пользователю:', err);
        }
      }
    }
  }
});

// Создаем HTTP-сервер, который принимает и запросы от Render (для поддержания активности), и вебхуки от Telegram
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.url === WEBHOOK_PATH && req.method === 'POST') {
    // Передаем вебхук-запрос в Telegraf
    return bot.webhookCallback(WEBHOOK_PATH)(req, res);
  }
  
  // Простой ответ для проверки жизнеспособности сервера Render
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot webhook server is active and running!');
});

server.listen(PORT, async () => {
  console.log(`🌐 HTTP-сервер запущен на порту ${PORT}`);

  try {
    const fullWebhookUrl = `${RENDER_URL}${WEBHOOK_PATH}`;
    console.log(`🔗 Устанавливаем вебхук Telegram: ${fullWebhookUrl}`);
    
    // Удаляем старые вебхуки/опросы и регистрируем новый вебхук
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await bot.telegram.setWebhook(fullWebhookUrl);
    
    console.log('🚀 Вебхук успешно зарегистрирован! Бот готов принимать сообщения.');
  } catch (err) {
    console.error('❌ Ошибка настройки вебхука:', err.message);
  }
});

// Корректное завершение работы
process.once('SIGINT', () => server.close());
process.once('SIGTERM', () => server.close());