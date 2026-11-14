const { Telegraf } = require('telegraf');
const http = require('http');

// Проверка токена
const token = process.env.BOT_TOKEN;
if (!token) {
  console.error('Ошибка: не задана переменная окружения BOT_TOKEN');
  process.exit(1);
}

const bot = new Telegraf(token);

// --- СЮДА МОЖЕШЬ ДОБАВЛЯТЬ СВОИ КОМАНДЫ И ЛОГИКУ БОТА ---

bot.start((ctx) => {
  ctx.reply('Привет! Бот VILORA Farm успешно запущен и работает! 💊');
});

bot.help((ctx) => {
  ctx.reply('Используйте /start для запуска бота.');
});

bot.on('text', (ctx) => {
  ctx.reply(`Получено сообщение: ${ctx.message.text}`);
});

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error(`Ошибка в боте для обновления ${ctx.updateType}:`, err);
});

// --- HTTP-СЕРВЕР ДЛЯ RENDER (РЕШАЕТ ПРОБЛЕМУ С ПОРТОМ) ---
const PORT = process.env.PORT || 3000;
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('VILORA Farm Bot is running and healthy!');
  })
  .listen(PORT, '0.0.0.0', () => {
    console.log(`HTTP server listening on port ${PORT}`);
  });

// --- ЗАПУСК ТЕЛЕГРАМ-БОТА ---
bot
  .launch()
  .then(() => {
    console.log('Telegram-бот успешно запущен!');
  })
  .catch((err) => {
    console.error('Ошибка при запуске бота:', err);
  });

// Корректное завершение работы
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));