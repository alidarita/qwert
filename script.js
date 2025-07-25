function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
  }
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('light-theme');
  localStorage.setItem('quizgpt-theme', isLight ? 'light' : 'dark');
}

function loadTheme() {
  const saved = localStorage.getItem('quizgpt-theme');
  applyTheme(saved);
}

document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  showWelcomeScreen();
});

function showWelcomeScreen() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <h1>Добро пожаловать в QuizGPT</h1>
    <p>
      Здесь вы сможете не только проверить свои знания, но и сами выбрать тему, по которой хотите пройти тест. Искусственный интеллект сгенерирует для вас интересные и разнообразные вопросы с вариантами ответов. Вы сами определяете количество вопросов и время на каждый из них. Соревнуйтесь с собой или же в компаний друзей, улучшайте результаты, попадайте в список лидеров и узнавайте новое каждый день!<br><br>
    </p>
    <div style="display: flex; gap: 12px; align-items: center;">
      <button id="start-btn">Начать</button>
      <button class="theme-toggle" id="theme-toggle-btn">Сменить тему</button>
    </div>
  `;
  document.getElementById('start-btn').onclick = showSetupScreen;
  document.getElementById('theme-toggle-btn').onclick = () => {
    toggleTheme();
  };
}

let quizParams = {};
let quizQuestions = [];
let currentQuestionIndex = 0;
let correctAnswers = 0;
let wrongAnswers = 0;
let timerInterval = null;
let timeLeft = 0;
let userAnswers = [];
const OPENAI_API_KEY = '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';
const questionBank = {
  'ссср': [
    {
      question: 'В каком году был образован СССР?',
      answers: ['1922', '1917', '1945', '1991'],
      correct: '1922'
    },
    {
      question: 'Кто был первым руководителем СССР?',
      answers: ['Владимир Ленин', 'Иосиф Сталин', 'Леонид Брежнев', 'Никита Хрущёв'],
      correct: 'Владимир Ленин'
    },
    {
      question: 'Как назывался главный орган власти в СССР?',
      answers: ['Верховный Совет', 'Государственная Дума', 'Совет Федерации', 'Президент'],
      correct: 'Верховный Совет'
    },
    {
      question: 'Какой город был столицей СССР?',
      answers: ['Москва', 'Санкт-Петербург', 'Киев', 'Минск'],
      correct: 'Москва'
    },
    {
      question: 'В каком году СССР прекратил существование?',
      answers: ['1991', '1985', '2000', '1977'],
      correct: '1991'
    }
  ],
  'мама алидара': [
    {
      question: 'Какой у неё цвет глаз?',
      answers: ['Голубой', 'Карий', 'Зелёный', 'Серый'],
      correct: 'Карий'
    },
    {
      question: 'Сколько ей на 2025 год?',
      answers: ['8', '9', '10', '11'],
      correct: '9'
    },
    {
      question: 'Её любимый бренд?',
      answers: ['Gucci', 'Chanel', 'Dior', 'Zara'],
      correct: 'Chanel'
    },
    {
      question: 'Сколько лет любимому сыну мамы на 2025?',
      answers: ['16', '13', '11', '9'],
      correct: '13'
    },
    {
      question: 'Сколько лет нелюбимому сыну?',
      answers: ['11', '13', '16', '9'],
      correct: '11'
    },
    {
      question: 'мама пробила мальчику лоб?',
      answers: ['Да', 'Нет', 'Не помню', 'Скорее всего'],
      correct: 'Да'
    }
  ]


};

function showSetupScreen() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <h2>Настройка викторины</h2>
    <form id="setup-form">
      <label for="topic">Тема викторины:</label>
      <input type="text" id="topic" name="topic" required placeholder="Например, космос">

      <label for="difficulty">Уровень сложности:</label>
      <select id="difficulty" name="difficulty">
        <option value="обычный">Обычный</option>
        <option value="средний">Средний</option>
        <option value="гений">Гений</option>
      </select>

      <label for="questionCount">Количество вопросов:</label>
      <input type="number" id="questionCount" name="questionCount" min="1" max="20" value="5" required>

      <label for="timePerQuestion">Время на вопрос (сек):</label>
      <input type="number" id="timePerQuestion" name="timePerQuestion" min="5" max="120" value="20" required>

      <div style="display: flex; gap: 12px; margin-top: 8px;">
        <button type="submit">Начать викторину</button>
        <button type="button" id="back-btn">Назад</button>
      </div>
    </form>
  `;
  document.getElementById('setup-form').onsubmit = async function(e) {
    e.preventDefault();
    quizParams = {
      topic: document.getElementById('topic').value.trim(),
      difficulty: document.getElementById('difficulty').value,
      questionCount: parseInt(document.getElementById('questionCount').value, 10),
      timePerQuestion: parseInt(document.getElementById('timePerQuestion').value, 10)
    };
    await generateQuestions();
    showQuizScreen();
  };
  document.getElementById('back-btn').onclick = showWelcomeScreen;
}

async function generateQuestions() {
  const topic = quizParams.topic.trim().toLowerCase();
  if (questionBank[topic]) {
    quizQuestions = shuffleArray(questionBank[topic]).slice(0, quizParams.questionCount)
      .map(q => ({ ...q, answers: shuffleArray(q.answers) }));
    return;
  }
  // Если нет в локальном банке — генерируем через OpenAI
  await fetchQuestionsFromOpenAI(quizParams.topic, quizParams.questionCount);
}

async function fetchQuestionsFromOpenAI(topic, count = 5) {
  const app = document.getElementById('app');
  const safeTopic = escapeHTML(topic);
  app.innerHTML = `<h2>Генерируем вопросы по теме "${safeTopic}"...<br><span class="timer">Пожалуйста, подождите</span></h2>`;
  const prompt = `Сгенерируй ${count} чётких вопросов викторины уровня \"${quizParams.difficulty}\" по теме \"${topic}\". Используй ровно такой формат для каждого блока (без лишнего текста):\nQ: вопрос\nA) вариант 1\nB) вариант 2\nC) вариант 3\nD) вариант 4\nAns: <буква правильного варианта>`;
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.7
      })
    });

    // Проверяем, что запрос завершился успешно
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    quizQuestions = parseOpenAIQuestions(text, count);
  } catch (e) {
    app.innerHTML = `<h2>Ошибка генерации вопросов :(</h2><p>Проверьте интернет и API-ключ.</p><button onclick="showSetupScreen()">Назад</button>`;
    throw e;
  }
}

function normalize(str) {
  return (str || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

// Добавляем экранирование HTML, чтобы предотвратить XSS-инъекции
function escapeHTML(str) {
  return String(str).replace(/[&<>\'\"]/g, (tag) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

function parseOpenAIQuestions(text, count) {
  const questions = [];
  const blocks = text.split(/\n?Q:/i).slice(1); // разбиваем по Q:
  for (let raw of blocks) {
    const lines = raw.trim().split(/\n|\r/).filter(Boolean);
    if (lines.length < 6) continue; // недостаточно строк
    const q = { question: '', answers: [], correct: '' };
    q.question = lines[0].trim();
    // варианты
    const mapLetters = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
    lines.slice(1,5).forEach((l, idx) => {
      const txt = l.replace(/^\s*[A-D][).:-]\s*/i, '').trim();
      q.answers[idx] = txt;
    });
    // правильный ответ
    const ansLine = lines.find(l => /^Ans:/i.test(l));
    if (ansLine) {
      const letter = ansLine.replace(/Ans:/i, '').trim().charAt(0).toUpperCase();
      const idx = mapLetters[letter];
      if (idx !== undefined) q.correct = q.answers[idx];
    }
    // базовый фильтр на дубликаты и пустоту
    const unique = new Set(q.answers.map(a => normalize(a)));
    if (unique.size !== 4 || q.answers.some(a => !a) || !q.correct) continue;
    questions.push(q);
    if (questions.length >= count) break;
  }
  return questions;
}

function showQuizScreen() {
  currentQuestionIndex = 0;
  correctAnswers = 0;
  wrongAnswers = 0;
  userAnswers = [];
  showQuestion();
}

function showQuestion() {
  const app = document.getElementById('app');
  const q = quizQuestions[currentQuestionIndex];
  timeLeft = quizParams.timePerQuestion;

  app.innerHTML = `
    <div style="margin-bottom: 8px; color: #888;">Вопрос ${currentQuestionIndex + 1} из ${quizQuestions.length}</div>
    <h3>${escapeHTML(q.question)}</h3>
    <div class="answers">
      ${q.answers.map((ans, idx) => `<button class="answer-btn" data-idx="${idx}">${escapeHTML(ans)}</button>`).join('')}
    </div>
    <div class="timer" id="timer">${timeLeft} сек</div>
  `;

  document.querySelectorAll('.answer-btn').forEach(btn => {
    const idx = parseInt(btn.getAttribute('data-idx'), 10);
    btn.onclick = () => handleAnswer(q.answers[idx]);
  });

  startTimer();
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById('timer').textContent = `${timeLeft} сек`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleAnswer(null); // Время вышло
    }
  }, 1000);
}

function handleAnswer(selected) {
  clearInterval(timerInterval);
  const q = quizQuestions[currentQuestionIndex];
  userAnswers.push({
    question: q.question,
    selected,
    correct: q.correct,
    answers: q.answers
  });
  if (normalize(selected) === normalize(q.correct)) {
    correctAnswers++;
  } else {
    wrongAnswers++;
  }
  currentQuestionIndex++;
  if (currentQuestionIndex < quizQuestions.length) {
    showQuestion();
  } else {
    showResultScreen();
  }
}

function showResultScreen() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <h2>Результаты</h2>
    <p>Правильных ответов: <b>${correctAnswers}</b> из <b>${quizQuestions.length}</b></p>
    <p>Неправильных ответов: <b>${wrongAnswers}</b></p>
    <div class="menu-buttons">
      <button onclick="showQuizScreen()">Играть снова</button>
      <button onclick="showLeaderboard()">Смотреть списки лидеров</button>
      <button onclick="showErrors()">Просмотреть ошибки</button>
      <button onclick="showSetupScreen()">Лобби</button>
    </div>
  `;
}

function showErrors() {
  const app = document.getElementById('app');
  const wrong = userAnswers.filter(a => a.selected !== a.correct);
  if (wrong.length === 0) {
    app.innerHTML = `
      <h2>Ошибки</h2>
      <p>Вы не допустили ни одной ошибки!</p>
      <button onclick="showResultScreen()">Назад к результатам</button>
    `;
    return;
  }
  app.innerHTML = `
    <h2>Ошибки</h2>
    <ul>
      ${wrong.map(a => `
        <li style="margin-bottom:12px;">
          <b>${escapeHTML(a.question)}</b><br>
          Ваш ответ: <span style="color:#ff4d4f;">${a.selected ? escapeHTML(a.selected) : 'Нет ответа'}</span><br>
          Правильный ответ: <span style="color:#4f8cff;">${escapeHTML(a.correct)}</span>
        </li>
      `).join('')}
    </ul>
    <button onclick="showResultScreen()">Назад к результатам</button>
  `;
}

function showLeaderboard() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <h2>Список лидеров</h2>
    <p>Функция в разработке.</p>
    <button onclick="showResultScreen()">Назад к результатам</button>
  `;
}

function shuffleArray(array) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}