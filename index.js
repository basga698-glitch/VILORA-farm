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

  // Если пишет сам админ
  if (userId === ADMIN_ID) {
    ctx.reply('Вы вошли как администратор VILORA Pharm.');
    return;
  }

  // Ответ клиенту
  ctx.reply('Спасибо за сообщение! Наш специалист свяжется с вами в ближайшее время.');

  // Отправка уведомления тебе (админу) через HTML-формат
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

// HTTP-сервер для Render
const PORT = process.env.PORT || 3000;
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('VILORA Pharm Bot is running and healthy!');
  })
  .listen(PORT, '0.0.0.0', () => {
    console.log(`HTTP server listening on port ${PORT}`);
  });

bot
  .launch()
  .then(() => {
    console.log('Telegram-бот VILORA Pharm успешно запущен!');
  })
  .catch((err) => {
    console.error('Ошибка при запуске бота:', err);
  });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));