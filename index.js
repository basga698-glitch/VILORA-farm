const { Telegraf } = require('telegraf');

const BOT_TOKEN = '8896495882:AAFj9M4UjubMvq6Ss3OdSSrMiQ3Vr-Z72hU'; 
const MY_CHAT_ID = 509898460; 

const bot = new Telegraf(BOT_TOKEN);
const messageMap = new Map();

bot.on('message', async (ctx) => {
  const chatId = ctx.chat.id;

  if (chatId !== MY_CHAT_ID) {
    try {
      const forwarded = await ctx.telegram.forwardMessage(MY_CHAT_ID, chatId, ctx.message.message_id);
      messageMap.set(forwarded.message_id, chatId);
      console.log(`📥 Сообщение от пользователя ${chatId} переслано вам.`);
    } catch (err) {
      console.error('Ошибка пересылки:', err);
    }
  } 
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