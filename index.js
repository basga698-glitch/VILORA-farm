const { Telegraf } = require('telegraf');
const http = require('http');

// Токен бота и ID администратора вшиты напрямую
const BOT_TOKEN = '8896495882:AAFj9M4UjubMvq6Ss3OdSSrMiQ3Vr-Z72hU';
const ADMIN_ID = 509898460;

const bot = new Telegraf(BOT_TOKEN);

// Команда /start
bot.start((ctx) => {
  ctx.reply('Привет! Добро пожаловать в VILORA Pharm 💊\nВыберите нужный раздел или отправьте нам сообщение.');
});

// Команда /help
bot.help((ctx) => {
  ctx.reply('Доступные команды:\n/start — Главное меню\n/help — Помощь');
});

// Обработка текстовых сообщений от клиентов
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const userName = ctx.from.first_name || 'Клиент';
  const userUsername = ctx.from.username ? `@${ctx.from.username}` : 'нет юзернейма';
  const text = ctx.message.text;

  // Если сообщение пишет сам админ (ты)
  if (userId === ADMIN_ID) {
    ctx.reply('Вы вошли как администратор VILORA Pharm.');
    return;
  }

  // Ответ клиенту
  ctx.reply('Спасибо за сообщение! Наш специалист свяжется с вами в ближайшее время.');

  // Пересылка уведомления тебе (админу)
  try {
    await bot.telegram.sendMessage(
      ADMIN_ID,
      `📩 **Новое сообщение в VILORA Pharm!**\n\n👤 **От:** ${userName} (${userUsername})\n🆔 **ID:** \`${userId}\`\n💬 **Текст:** ${text}`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('Ошибка при отправке уведомления администратору:', err);
  }
});

// Обработка ошибок бота
bot.catch((err, ctx) => {
  console.error(`Ошибка в боте для обновления ${ctx.updateType}:`, err);
});

// HTTP-сервер для Render (решает проблему с привязкой порта)
const PORT = process.env.PORT || 3000;
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('VILORA Pharm Bot is running and healthy!');
  })
  .listen(PORT, '0.0.0.0', () => {
    console.log(`HTTP server listening on port ${PORT}`);
  });

// Запуск Telegram-бота
bot
  .launch()
  .then(() => {
    console.log('Telegram-бот VILORA Pharm успешно запущен!');
  })
  .catch((err) => {
    console.error('Ошибка при запуске бота:', err);
  });

// Корректное завершение работы
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));