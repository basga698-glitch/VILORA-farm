const { Telegraf } = require('telegraf');

const BOT_TOKEN = '8896495882:AAFj9M4UjubMvq6Ss3OdSSrMiQ3Vr-Z72hU'; 
const MY_CHAT_ID = 509898460; 

const bot = new Telegraf(BOT_TOKEN);

bot.on('message', async (ctx) => {
  const chatId = ctx.chat.id;

  // Если пишет обычный пользователь (не админ)
  if (chatId !== MY_CHAT_ID) {
    try {
      // Пересылаем оригинальное сообщение админу
      const forwarded = await ctx.telegram.forwardMessage(MY_CHAT_ID, chatId, ctx.message.message_id);

      // Отправляем служебную плашку с ID прямо под пересылкой
      await ctx.telegram.sendMessage(MY_CHAT_ID, `💬 Ответьте на это сообщение, чтобы написать пользователю [ID:${chatId}]`, {
        reply_to_message_id: forwarded.message_id
      });

      console.log(`📥 Сообщение от пользователя ${chatId} переслано.`);
    } catch (err) {
      console.error('Ошибка пересылки:', err);
    }
  } 
  // Если пишет админ
  else if (chatId === MY_CHAT_ID) {
    if (ctx.message.reply_to_message) {
      const replyText = ctx.message.reply_to_message.text || '';
      // Ищем ID пользователя в тексте служебного сообщения с помощью регулярного выражения
      const match = replyText.match(/\[ID:(\d+)\]/);

      if (match) {
        const targetUserId = match[1];
        try {
          // Копируем ответ админа и отправляем пользователю
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
    console.log('🔄 Сбрасываем старые соединения Telegram...');
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });

    await bot.launch();
    console.log('🚀 Бот успешно запущен в облаке Render!');
  } catch (err) {
    console.error('❌ Ошибка запуска:', err.message);
    setTimeout(startBot, 5000);
  }
}

startBot();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));