const { Telegraf } = require('telegraf');
const http = require('http');

const BOT_TOKEN = '8896495882:AAFj9M4UjubMvq6Ss3OdSSrMiQ3Vr-Z72hU';
const ADMIN_ID = 509898460;

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply('Привет! Добро пожаловать в VILORA Pharm 💊\nНапишите ваш вопрос, и мы передадим его специалисту.');
});

bot.help((ctx) => {
  ctx.reply('Доступные команды:\n/start — Главное меню');
});

// Обработка текстовых сообщений
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const userName = ctx.from.first_name || 'Клиент';
  const userUsername = ctx.from.username ? `@${ctx.from.username}` : 'нет юзернейма';
  const text = ctx.message.text;

  // ЕСЛИ ПИШЕТ АДМИН
  if (userId === ADMIN_ID) {
    
    // 1. Команда для отправки сообщения по ID: /send 12345678 Привет!
    if (text.startsWith('/send')) {
      const parts = text.split(' ');
      const targetId = parts[1];
      const messageText = parts.slice(2).join(' ');

      if (!targetId || !messageText) {
        return ctx.reply('⚠️ Ошибка формата!\nИспользуй так:\n`/send ID_клиента Текст сообщения`', { parse_mode: 'Markdown' });
      }

      try {
        await bot.telegram.sendMessage(
          targetId,
          `👨‍💻 <b>Ответ от специалиста VILORA Pharm:</b>\n\n${messageText}`,
          { parse_mode: 'HTML' }
        );
        await ctx.reply('✅ Сообщение успешно отправлено клиенту!');
      } catch (err) {
        await ctx.reply('❌ Не удалось отправить сообщение (возможно, клиент заблокировал бота или неверный ID).');
      }
      return;
    }

    // 2. Ответ через Reply (ответ на сообщение-карточку)
    if (ctx.message.reply_to_message) {
      const repliedText = ctx.message.reply_to_message.text || '';
      const match = repliedText.match(/ID:\s*(\d+)/);

      if (match && match[1]) {
        const targetClientId = match[1];
        try {
          await bot.telegram.sendMessage(
            targetClientId,
            `👨‍💻 <b>Ответ от специалиста VILORA Pharm:</b>\n\n${text}`,
            { parse_mode: 'HTML' }
          );
          await ctx.reply('✅ Ответ успешно отправлен клиенту!');
        } catch (err) {
          await ctx.reply('❌ Не удалось отправить сообщение клиенту.');
        }
        return;
      }
    }

    ctx.reply(
      'ℹ️ **Панель администратора VILORA Pharm:**\n\n' +
      '• Чтобы ответить клиенту, сделайте **Reply** (Ответить) на его карточку.\n' +
      '• Или используйте команду: `/send ID_клиента Текст`',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // ЕСЛИ ПИШЕТ КЛИЕНТ
  ctx.reply('Спасибо за сообщение! Наш специалист свяжется с вами в ближайшее время.');

  // Пересылаем уведомление админу
  try {
    await bot.telegram.sendMessage(
      ADMIN_ID,
      `📩 <b>Новое сообщение в VILORA Pharm!</b>\n\n` +
      `👤 <b>От:</b> ${userName} (${userUsername})\n` +
      `🆔 <b>ID:</b> <code>${userId}</code>\n` +
      `💬 <b>Текст:</b> ${text}`,
      { parse_mode: 'HTML' }
    );
  } catch (err) {
    console.error('Ошибка при отправке уведомления администратору:', err);
  }
});

bot.catch((err, ctx) => {
  console.error(`Ошибка в боте для обновления ${ctx.updateType}:`, err);
});

// HTTP-сервер для Render (обязательная привязка порта)
const PORT = process.env.PORT || 3000;
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('VILORA Pharm Bot is running and healthy!');
  })
  .listen(PORT, '0.0.0.0', () => {
    console.log(`HTTP server listening on port ${PORT}`);
  });

// ЗАПУСК ТЕЛЕГРАМ-БОТА (сбрасываем зависшие сеансы через dropPendingUpdates)
bot
  .launch({ dropPendingUpdates: true })
  .then(() => {
    console.log('Telegram-бот VILORA Pharm успешно запущен!');
  })
  .catch((err) => {
    console.error('Ошибка при запуске бота:', err);
  });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));