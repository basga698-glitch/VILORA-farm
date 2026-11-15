const { Telegraf } = require('telegraf');
const http = require('http');

const BOT_TOKEN = '8896495882:AAFj9M4UjubMvq6Ss3OdSSrMiQ3Vr-Z72hU'; 
const MY_CHAT_ID = 509898460; 

const bot = new Telegraf(BOT_TOKEN);

const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running and alive!');
}).listen(PORT, () => {
  console.log(`🌐 HTTP-сервер успешно запущен на порту ${PORT}`);
});

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

async function startBot() {
  try {
    console.log('⏳ Безопасная пауза 12 сек для сброса старых сессий...');
    await new Promise(resolve => setTimeout(resolve, 12000));

    console.log('🔄 Сбрасываем старые вебхуки и соединения...');
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    
    await bot.launch();
    console.log('🚀 Бот успешно запущен в облаке Render и готов к работе!');
  } catch (err) {
    console.error('❌ Ошибка запуска:', err.message);
    setTimeout(startBot, 8000);
  }
}

startBot();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));