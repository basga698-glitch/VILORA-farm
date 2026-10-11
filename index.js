const { Telegraf } = require('telegraf');

const BOT_TOKEN = '8896495882:AAFj9M4UjubMvq6Ss3OdSSrMiQ3Vr-Z72hU'; 
const MY_CHAT_ID = 509898460; 

const bot = new Telegraf(BOT_TOKEN);
const messageMap = new Map();

// Обработка входящих сообщений
bot.on('message', async (ctx) => {
  const chatId = ctx.chat.id;

  // Если пишет пользователь (не админ)
  if (chatId !== MY_CHAT_ID) {
    try {
      const forwarded = await ctx.telegram.forwardMessage(MY_CHAT_ID, chatId, ctx.message.message_id);
      messageMap.set(forwarded.message_id, chatId);
      console.log(`📥 Сообщение от пользователя ${chatId} переслано вам.`);
    } catch (err) {
      console.error('Ошибка пересылки:', err);
    }
  } 
  // Если пишет админ (ты) с компьютера/телефона
  else if (chatId === MY_CHAT_ID) {
    if (ctx.message.reply_to_message) {
      const repliedMsgId = ctx.message.reply_to_message.message_id;
      const targetUserId = messageMap.get(repliedMsgId);

      if (targetUserId) {
        try {
          await ctx.telegram.copyMessage(targetUserId, MY_CHAT_ID, ctx.message.message_id);
          console.log(`📤 Ответ отправлен пользователю ${targetUserId}`);
        } catch (err) {
          console.error('Ошибка отправки:', err);
          await ctx.telegram.sendMessage(MY_CHAT_ID, '⚠️ Не удалось отправить сообщение.');
        }
      } else {
        await ctx.telegram.sendMessage(MY_CHAT_ID, '⚠️ Получатель не найден (возможно, бот перезапускался).');
      }
    }
  }
});

// Запускаем бота в облаке
bot.launch()
  .then(() => console.log('🚀 Бот успешно запущен в облаке Render!'))
  .catch((err) => console.error('❌ Ошибка запуска:', err));

// Корректная остановка
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));