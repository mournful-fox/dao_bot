// --- НАСТРОЙКИ ---
const MY_CHAT_ID = 'CHAT_ID'; // ⚠️ Замени на свой Telegram ID
const TOKEN = 'TOKEN'; // Твой бот-токен
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const SHEET_URL = 'LINK'; // Ссылка на таблицу
const SHEET_NAME = 'name_of_list'; // Имя листа

// Уроки на 21 день (начиная с 18.08.2025)
const LESSONS = [
  "Добро пожаловать! 🌿 День 1: Сегодня начни с даосского дыхания. 10 минут: дыши животом, руки на нижний даньтянь (3 пальца ниже пупка). Чувствуй тепло.",
  "День 2: Продолжай дыхание. Добавь визуализацию: представь, как с каждым вдохом в даньтянь приходит золотой свет.",
  "День 3: Попробуй 'подуть' энергию от даньтяня к копчику и обратно (вдох туда, выдох сюда). Не форсируй.",
  "День 4: Удели 5 минут просто ощущению тела. Замечай, где напряжение — дыши туда.",
  "День 5: Повтори вчерашнее, но добавь прижатие языка к нёбу — 'мост энергии'.",
  "День 6: Представь, как энергия поднимается по позвоночнику на вдохе. Только визуализация.",
  "День 7: Попробуй полный образ: вдох — энергия вверх по спине, выдох — вниз по переду. Без напряжения.",
  "День 8: Сделай 3–5 кругов Микрокосмического орбита. Вдох — вверх, выдох — вниз.",
  "День 9: Увеличь до 9 кругов. Представляй, что очищаешь тело с каждым кругом.",
  "День 10: Добавь цвет: вдох — белый свет вверх, выдох — тьма уходит вниз.",
  "День 11: Практикуй утром. Заметь, как меняется самочувствие.",
  "День 12: Сделай 12 кругов. Если устал — остановись. Главное — регулярность.",
  "День 13: Соедини дыхание, внимание и язык на нёбе. Это основа.",
  "День 14: Представь, что в нижнем даньтяне рождается эликсир — тёплый шар света.",
  "День 15: Направь этот шар по полному кругу 9 раз. Оставь его в даньтяне на завершение.",
  "День 16: Практикуй с закрытыми глазами. Наблюдай за внутренними ощущениями.",
  "День 17: Если ощущения слабые — не беда. Представление — уже действие.",
  "День 18: Сделай 18 кругов. Почувствуй ритм, как пульс Вселенной.",
  "День 19: Добавь благодарность телу после практики.",
  "День 20: Повтори всё с чувством покоя и принятия.",
  "День 21: Поздравляю! 🎉 Ты прошёл 21 день. Продолжай практику — теперь ты на новой ступени."
];

// === ЕЖЕДНЕВНАЯ РАССЫЛКА ===
function sendDailyLesson() {
  try {
    // Открываем таблицу
    const sheet = SpreadsheetApp.openByUrl(SHEET_URL).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const rows = data.slice(1); // без заголовка

    // Ищем строку с нашим ID
    const userRow = rows.find(row => row[0] == MY_CHAT_ID);
    const rowIndex = userRow ? rows.indexOf(userRow) + 2 : null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate, dayCompleted;

    if (userRow) {
      // Парсим дату в формате "дд.мм.гггг"
      const [day, month, year] = String(userRow[2]).split('.').map(Number);
      if (isNaN(day) || isNaN(month) || isNaN(year)) {
        console.error("Неверный формат даты:", userRow[2]);
        return;
      }
      startDate = new Date(year, month - 1, day);
      startDate.setHours(0, 0, 0, 0);
      dayCompleted = userRow[4] ? parseInt(userRow[4]) : 0;
    } else {
      // Если пользователя нет — создаём с датой старта 18.08.2025
      sheet.appendRow([MY_CHAT_ID, 'Пользователь', '18.08.2025', '', 0]);
      sendTelegramMessage(MY_CHAT_ID, "🌱 Курс запущен! Первое упражнение — завтра. Жди!");
      return;
    }

    // Считаем, сколько дней прошло
    const daysSinceStart = Math.floor((today - startDate) / (24 * 60 * 60 * 1000));

    // Проверяем, нужно ли отправить урок
    if (daysSinceStart >= 0 && daysSinceStart < 21 && daysSinceStart === dayCompleted) {
      const lessonText = LESSONS[daysSinceStart];
      if (!lessonText) {
        console.error("Урок не найден для дня:", daysSinceStart);
        return;
      }

      const message = `<b>День ${daysSinceStart + 1} из 21</b>\n\n${lessonText}`;
      sendTelegramMessage(MY_CHAT_ID, message);

      // Обновляем прогресс
      if (rowIndex) {
        sheet.getRange(rowIndex, 5).setValue(daysSinceStart + 1); // DayCompleted
        sheet.getRange(rowIndex, 4).setValue(today); // LastSent
      }
    }
  } catch (error) {
    console.error('Ошибка в sendDailyLesson:', error);
  }
}

// === ОТПРАВКА СООБЩЕНИЯ В TELEGRAM ===
function sendTelegramMessage(chatId, text) {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    console.error('❌ Попытка отправить пустое сообщение:', text);
    return;
  }

  const payload = {
    method: 'post',
    muteHttpExceptions: true,
    payload: {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    }
  };

  try {
    const response = UrlFetchApp.fetch(TELEGRAM_API + '/sendMessage', payload);
    const result = JSON.parse(response.getContentText());

    if (result.ok) {
      console.log('✅ Сообщение отправлено:', chatId);
    } else {
      console.error('❌ Ошибка Telegram API:', result);
      // Если "chat not found" — возможно, ты не начинал диалог с ботом
      if (result.description && result.description.includes('chat not found')) {
        console.error('❗ Чтобы бот мог писать, напиши ему в Telegram: /start');
      }
    }
  } catch (error) {
    console.error('❌ Ошибка отправки:', error.toString());
  }
}

// === ТЕСТ: отправить себе сообщение (запускай вручную) ===
function testSend() {
  sendTelegramMessage(MY_CHAT_ID, "✅ Привет! Это тестовое сообщение. Бот работает.");
}
