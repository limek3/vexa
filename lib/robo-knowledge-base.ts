// lib/robo-knowledge-base.ts
// Hidden Robo knowledge base. It is used only by WorkspaceAssistant, not shown as a public page.

export type RoboLocale = 'ru' | 'en';
export type RoboKnowledgeLevel = 'basic' | 'standard' | 'advanced' | 'edge';

export type RoboKnowledgeAction = {
  labelRu: string;
  labelEn: string;
  href: string;
};

export type RoboKnowledgeItem = {
  id: string;
  categoryId: string;
  level: RoboKnowledgeLevel;
  questionRu: string;
  questionEn: string;
  answerRu: string;
  answerEn: string;
  keywordsRu: string[];
  keywordsEn: string[];
  actions: RoboKnowledgeAction[];
};

export type RoboKnowledgeCategory = {
  id: string;
  labelRu: string;
  labelEn: string;
  descriptionRu: string;
  descriptionEn: string;
  href: string;
};

export const ROBO_KNOWLEDGE_CATEGORIES = [
  { id: 'start', labelRu: 'Главная', labelEn: 'Dashboard', descriptionRu: 'Первичная проверка кабинета и запуск.', descriptionEn: 'Workspace launch check.', href: '/dashboard' },
  { id: 'profile', labelRu: 'Профиль', labelEn: 'Profile', descriptionRu: 'Доверие, описание, контакты, ссылка.', descriptionEn: 'Trust, description, contacts, link.', href: '/dashboard/profile' },
  { id: 'services', labelRu: 'Услуги', labelEn: 'Services', descriptionRu: 'Каталог, цены, длительность, порядок.', descriptionEn: 'Catalog, prices, duration, order.', href: '/dashboard/services' },
  { id: 'availability', labelRu: 'График', labelEn: 'Availability', descriptionRu: 'Дни, окна, слоты, тест записи.', descriptionEn: 'Days, windows, slots, booking test.', href: '/dashboard/availability' },
  { id: 'templates', labelRu: 'Шаблоны', labelEn: 'Templates', descriptionRu: 'Подтверждения, напоминания, возврат.', descriptionEn: 'Confirmations, reminders, returns.', href: '/dashboard/templates' },
  { id: 'public-page', labelRu: 'Публичная', labelEn: 'Public page', descriptionRu: 'Что видит клиент и почему он не записывается.', descriptionEn: 'What clients see and why they may not book.', href: '/dashboard/profile' },
  { id: 'chats', labelRu: 'Чаты', labelEn: 'Chats', descriptionRu: 'Ответы клиентам, шаблоны, скорость.', descriptionEn: 'Client replies, templates, speed.', href: '/dashboard/chats' },
  { id: 'today', labelRu: 'Сегодня', labelEn: 'Today', descriptionRu: 'Статусы записей, переносы, no-show.', descriptionEn: 'Booking statuses, reschedules, no-shows.', href: '/dashboard/today' },
  { id: 'stats', labelRu: 'Статистика', labelEn: 'Stats', descriptionRu: 'Деньги, записи, просадки, выводы.', descriptionEn: 'Money, bookings, drops, insights.', href: '/dashboard/stats' },
  { id: 'billing', labelRu: 'Оплата', labelEn: 'Billing', descriptionRu: 'Подписка, доступ, лимиты.', descriptionEn: 'Subscription, access, limits.', href: '/dashboard/subscription' },
] as const satisfies RoboKnowledgeCategory[];

export const ROBO_KNOWLEDGE_BASE = [
  {
    id: 'client-cant-see-page',
    categoryId: 'public-page',
    level: 'standard',
    questionRu: 'Почему клиент не видит страницу или кабинет?',
    questionEn: 'Why can the client not see the page?',
    answerRu:
      'Сначала отделяем две вещи: кабинет видит только мастер, а клиенту нужна публичная ссылка. Если клиенту отправили ссылку на /dashboard — он ничего нормально не увидит.\n\nЧто проверить прямо сейчас:\n1. Откройте публичную страницу из бокового меню, а не кабинет.\n2. Скопируйте именно клиентскую ссылку: /m/ваш-slug или демо-ссылку /demo/demo.\n3. Откройте ссылку в режиме инкогнито или с телефона, где вы не авторизованы.\n4. Если открывается не тот профиль — проверьте демо/рабочий режим.\n5. Если страница пустая — проверьте профиль, услуги и график.\n\nПравильный результат: клиент видит имя мастера, описание, услуги, свободное время и кнопку записи. Если чего-то нет — Робо поведёт по конкретному разделу.',
    answerEn:
      'First separate two things: the workspace is for the specialist, the client needs a public link. If you send a /dashboard link, the client will not see the booking page.\n\nCheck now:\n1. Open the public page from the sidebar, not the workspace.\n2. Copy the client link: /m/your-slug or demo link /demo/demo.\n3. Open it in incognito or on a phone where you are not logged in.\n4. If the wrong profile opens, check demo/live mode.\n5. If the page is empty, check profile, services and availability.\n\nCorrect result: the client sees specialist name, description, services, available time and booking action.',
    keywordsRu: ['клиент не видит', 'не открывается', 'страница не видна', 'ссылка не работает', 'публичная ссылка', 'кабинет клиент'],
    keywordsEn: ['client cannot see', 'page not visible', 'link does not work', 'public link', 'dashboard client'],
    actions: [
      { labelRu: 'Открыть публичную страницу', labelEn: 'Open public page settings', href: '/dashboard/profile' },
      { labelRu: 'Проверить услуги', labelEn: 'Check services', href: '/dashboard/services' },
      { labelRu: 'Проверить график', labelEn: 'Check availability', href: '/dashboard/availability' },
    ],
  },
  {
    id: 'nothing-changed-after-save',
    categoryId: 'profile',
    level: 'edge',
    questionRu: 'После сохранения ничего не изменилось. Что делать?',
    questionEn: 'Nothing changed after saving. What should I do?',
    answerRu:
      'Почти всегда причина одна из трёх: вы смотрите не тот режим, не ту ссылку или не дождались обновления данных.\n\nПорядок проверки:\n1. Посмотрите сверху в меню: Рабочий или Демо. Правки в демо не обязаны менять рабочий профиль.\n2. После сохранения обновите страницу.\n3. Откройте публичную страницу заново, не старую вкладку.\n4. Проверьте, что меняли именно тот профиль, чей slug отправляете клиенту.\n5. Если меняли фото/описание — проверьте, что поле реально заполнено, а не осталось пустым после перезагрузки.\n\nЕсли нужно быстро понять проблему: напишите Робо “проверить готовность”, и он покажет, какой раздел ещё не готов.',
    answerEn:
      'Usually it is one of three things: wrong mode, wrong link, or old data in the tab.\n\nCheck in order:\n1. Look at the mode: Live or Demo. Demo edits may not change the live profile.\n2. Refresh after saving.\n3. Open the public page again, not an old tab.\n4. Make sure you edited the same profile whose slug you send to clients.\n5. If you edited photo/description, check that the field is still filled after reload.\n\nTo quickly diagnose, ask Robo to check readiness.',
    keywordsRu: ['не сохранилось', 'ничего не изменилось', 'после сохранения', 'не обновилось', 'сохранение'],
    keywordsEn: ['not saved', 'nothing changed', 'after save', 'not updated', 'saving'],
    actions: [
      { labelRu: 'Открыть профиль', labelEn: 'Open profile', href: '/dashboard/profile' },
      { labelRu: 'Открыть внешний вид', labelEn: 'Open appearance', href: '/dashboard/appearance' },
    ],
  },
  {
    id: 'open-slots',
    categoryId: 'availability',
    level: 'standard',
    questionRu: 'Как открыть слоты, чтобы клиент мог записаться?',
    questionEn: 'How do I open slots so clients can book?',
    answerRu:
      'Слот — это не просто красивое время в интерфейсе. Это обещание клиенту: “в это время я точно могу принять”.\n\nЧто сделать:\n1. Перейдите в “График”.\n2. Выберите рабочие дни.\n3. Откройте реальные интервалы, например 10:00–18:00.\n4. Закройте обед, личные окна и дни, где вы не принимаете.\n5. Сохраните и проверьте публичную страницу: клиент должен видеть доступное время.\n6. Сделайте тестовую запись сами.\n\nЧастая ошибка: открывать весь день без буфера. Лучше меньше слотов, но реальные. Тогда будет меньше переносов и неявок.',
    answerEn:
      'A slot is not just time in the interface. It is a promise: “I can actually accept a client at this time.”\n\nDo this:\n1. Open Availability.\n2. Select work days.\n3. Open real intervals, for example 10:00–18:00.\n4. Close lunch, personal windows and days off.\n5. Save and check the public page: clients should see available time.\n6. Make a test booking yourself.\n\nCommon mistake: opening the whole day without buffers. Fewer real slots are better than many fake ones.',
    keywordsRu: ['открыть слоты', 'слоты', 'график', 'расписание', 'время записи', 'нет времени', 'клиент не видит время'],
    keywordsEn: ['open slots', 'slots', 'availability', 'schedule', 'booking time', 'client does not see time'],
    actions: [
      { labelRu: 'Открыть график', labelEn: 'Open availability', href: '/dashboard/availability' },
      { labelRu: 'Проверить публичную страницу', labelEn: 'Check public page', href: '/dashboard/profile' },
    ],
  },
  {
    id: 'no-slots-on-public-page',
    categoryId: 'availability',
    level: 'edge',
    questionRu: 'Почему на публичной странице нет свободного времени?',
    questionEn: 'Why are there no available times on the public page?',
    answerRu:
      'Если клиент не видит время, проверяем цепочку: услуга → длительность → график → дата.\n\nДиагностика:\n1. Есть ли хотя бы одна видимая услуга? Без услуги клиенту нечего бронировать.\n2. У услуги указана длительность? Если длительность больше окна, слот не появится.\n3. Открыт ли график на нужный день?\n4. Не закрыт ли день как выходной или исключение?\n5. Вы смотрите рабочий профиль или демо?\n\nСамый быстрый тест: откройте услугу на 30 минут и рабочее окно на 2 часа. Если слоты появились — проблема была в длительности или пересечении времени.',
    answerEn:
      'If clients do not see time, check the chain: service → duration → availability → date.\n\nDiagnose:\n1. Is there at least one visible service? Without a service there is nothing to book.\n2. Does the service have duration? If duration is longer than the window, no slot appears.\n3. Is the day open in availability?\n4. Is the day closed as day off or exception?\n5. Are you viewing live profile or demo?\n\nFast test: create a 30-minute service and open a 2-hour window. If slots appear, the issue was duration or time intersection.',
    keywordsRu: ['нет слотов', 'нет свободного времени', 'время не показывается', 'публичная нет времени', 'нет окон'],
    keywordsEn: ['no slots', 'no available time', 'time not showing', 'no windows'],
    actions: [
      { labelRu: 'Проверить услуги', labelEn: 'Check services', href: '/dashboard/services' },
      { labelRu: 'Проверить график', labelEn: 'Check availability', href: '/dashboard/availability' },
    ],
  },
  {
    id: 'make-services-sell',
    categoryId: 'services',
    level: 'advanced',
    questionRu: 'Как сделать услуги продающими, а не просто списком?',
    questionEn: 'How do I make services sell instead of just listing them?',
    answerRu:
      'Услуги должны отвечать на вопрос клиента: “что я получу, сколько это займёт и сколько стоит”.\n\nКак оформить:\n1. Название: человеческое, без внутренних сокращений. Не “Комплекс 1”, а “Маникюр с покрытием”.\n2. Категория: чтобы клиент не терялся.\n3. Цена: конкретная или “от”, если зависит от объёма.\n4. Длительность: реальная, с буфером.\n5. Порядок: сначала популярное и понятное, потом редкое.\n6. Уберите лишнее: услуги, которые нельзя записать онлайн, лучше скрыть.\n\nПример: “Маникюр + гель-лак — 2 часа — от 2500 ₽”. Клиент сразу понимает решение, время и цену.',
    answerEn:
      'Services should answer the client’s question: “what do I get, how long does it take and how much is it?”\n\nHow to format:\n1. Human name, no internal abbreviations. Not “Complex 1”, but “Manicure with gel polish”.\n2. Category, so clients do not get lost.\n3. Price: exact or “from” if it depends on scope.\n4. Duration: realistic, with buffer.\n5. Order: popular and clear first, rare later.\n6. Remove noise: hide services that cannot be booked online.\n\nExample: “Manicure + gel polish — 2 hours — from 2500”.',
    keywordsRu: ['продающие услуги', 'оформить услуги', 'названия услуг', 'прайс', 'каталог услуг', 'как добавить услугу'],
    keywordsEn: ['selling services', 'format services', 'service names', 'pricing', 'service catalog', 'add service'],
    actions: [
      { labelRu: 'Открыть услуги', labelEn: 'Open services', href: '/dashboard/services' },
    ],
  },
  {
    id: 'profile-trust',
    categoryId: 'profile',
    level: 'advanced',
    questionRu: 'Что написать в профиле, чтобы клиент доверял?',
    questionEn: 'What should I write in the profile to build trust?',
    answerRu:
      'Профиль не должен быть “о себе”. Он должен быстро снять страх клиента перед записью.\n\nФормула описания:\n1. Кто вы: специализация и формат работы.\n2. Для кого: какой клиент вам подходит.\n3. Результат: что человек получает после визита.\n4. Доверие: опыт, аккуратность, стерильность, подход, если это важно.\n5. Логистика: район, адрес, как попасть.\n\nШаблон:\n“Я [специализация]. Помогаю [кому] получить [результат]. Работаю [как/где]. Перед записью можно выбрать услугу и удобное время онлайн.”\n\nНе пишите длинную биографию. Клиенту важно понять: можно ли вам доверять и как записаться.',
    answerEn:
      'The profile should not be “about me”. It should remove fear before booking.\n\nDescription formula:\n1. Who you are: specialty and work format.\n2. For whom: what client fits you.\n3. Result: what the client gets.\n4. Trust: experience, hygiene, accuracy, approach if relevant.\n5. Logistics: area, address, how to get there.\n\nTemplate:\n“I am [specialty]. I help [who] get [result]. I work [how/where]. You can choose a service and time online.”\n\nDo not write a long biography. The client needs to know whether to trust you and how to book.',
    keywordsRu: ['что написать', 'описание профиля', 'био', 'доверие', 'профиль мастера', 'заполнить профиль'],
    keywordsEn: ['what to write', 'profile description', 'bio', 'trust', 'specialist profile', 'fill profile'],
    actions: [
      { labelRu: 'Редактировать профиль', labelEn: 'Edit profile', href: '/dashboard/profile' },
    ],
  },
  {
    id: 'template-reminder',
    categoryId: 'templates',
    level: 'standard',
    questionRu: 'Как написать напоминание клиенту, чтобы он дошёл?',
    questionEn: 'How do I write a reminder so the client shows up?',
    answerRu:
      'Хорошее напоминание не давит. Оно подтверждает договорённость и убирает забывчивость.\n\nРабочий текст:\n“Здравствуйте, {clientName}! Напоминаю, что вы записаны на {serviceName} {date} в {time}. Адрес: {address}. Если планы изменились — напишите заранее, чтобы я смогла освободить окно.”\n\nПочему работает:\n1. Клиент видит имя, услугу, дату и время.\n2. Есть адрес.\n3. Есть мягкая просьба предупредить заранее.\n4. Нет агрессии и лишней воды.\n\nЛучше отправлять за день и коротко повторить за 2–3 часа, если ниша с частыми неявками.',
    answerEn:
      'A good reminder does not pressure. It confirms the agreement and prevents forgetting.\n\nWorking text:\n“Hi {clientName}! Reminder: you are booked for {serviceName} on {date} at {time}. Address: {address}. If plans change, please message in advance so I can free the slot.”\n\nWhy it works:\n1. Client sees name, service, date and time.\n2. Address is included.\n3. It softly asks to warn in advance.\n4. No aggression or extra text.\n\nSend one day before and a short repeat 2–3 hours before if no-shows are common.',
    keywordsRu: ['напоминание', 'шаблон напоминания', 'дошел', 'неявка', 'сообщение клиенту', 'подтверждение'],
    keywordsEn: ['reminder', 'reminder template', 'show up', 'no-show', 'client message', 'confirmation'],
    actions: [
      { labelRu: 'Открыть шаблоны', labelEn: 'Open templates', href: '/dashboard/templates' },
    ],
  },
  {
    id: 'no-show',
    categoryId: 'today',
    level: 'advanced',
    questionRu: 'Что делать с неявкой клиента?',
    questionEn: 'What should I do with a no-show?',
    answerRu:
      'Неявку лучше не просто отметить, а закрыть цикл, чтобы не терять деньги повторно.\n\nЧто сделать:\n1. В “Сегодня” поставьте статус “не пришёл” или соответствующий статус.\n2. Напишите клиенту коротко: “Вижу, что сегодня не получилось прийти. Если хотите, подберу новое окно.”\n3. Если клиент отвечает — переносите запись, а не создавайте хаос в чате.\n4. Если не отвечает — через 1–2 дня отправьте мягкое сообщение с новыми окнами.\n5. Если неявки повторяются — подумайте о предоплате или подтверждении за день.\n\nЦель: не ругаться, а либо вернуть клиента, либо понять, что место надо отдавать другому.',
    answerEn:
      'Do not just mark a no-show. Close the loop so you do not lose money again.\n\nDo this:\n1. In Today, set the status to no-show or similar.\n2. Send a short message: “Looks like today did not work out. I can help choose another time.”\n3. If the client replies, reschedule properly.\n4. If not, send available windows in 1–2 days.\n5. If no-shows repeat, consider prepayment or day-before confirmation.\n\nGoal: do not argue; either return the client or free the slot for someone else.',
    keywordsRu: ['неявка', 'не пришел', 'no show', 'не дошел', 'клиент не пришел', 'отмена'],
    keywordsEn: ['no-show', 'did not come', 'client did not show', 'missed booking', 'cancel'],
    actions: [
      { labelRu: 'Открыть записи на сегодня', labelEn: 'Open today bookings', href: '/dashboard/today' },
      { labelRu: 'Открыть шаблоны', labelEn: 'Open templates', href: '/dashboard/templates' },
    ],
  },
  {
    id: 'what-next',
    categoryId: 'start',
    level: 'basic',
    questionRu: 'Что делать дальше?',
    questionEn: 'What should I do next?',
    answerRu:
      'Идём по запуску, без хаоса:\n\n1. Профиль — клиент понимает, кто вы и где принимаете.\n2. Услуги — клиент видит цену и длительность.\n3. График — клиент видит реальные окна.\n4. Шаблоны — клиент получает подтверждение и напоминание.\n5. Публичная страница — вы проверяете путь глазами клиента.\n6. Тестовая запись — убеждаетесь, что всё работает.\n\nЕсли хотите, нажмите “Проверить готовность”: Робо покажет, что уже отмечено и какой следующий шаг открыть.',
    answerEn:
      'Move through launch without chaos:\n\n1. Profile — client understands who you are and where you work.\n2. Services — client sees price and duration.\n3. Availability — client sees real windows.\n4. Templates — client receives confirmation and reminder.\n5. Public page — you check the path as a client.\n6. Test booking — you make sure everything works.\n\nClick “Check readiness” and Robo will show what is completed and what to open next.',
    keywordsRu: ['что дальше', 'дальше', 'следующий шаг', 'с чего начать', 'запуск', 'проверить готовность'],
    keywordsEn: ['what next', 'next step', 'where to start', 'launch', 'check readiness'],
    actions: [
      { labelRu: 'Открыть профиль', labelEn: 'Open profile', href: '/dashboard/profile' },
      { labelRu: 'Открыть график', labelEn: 'Open availability', href: '/dashboard/availability' },
    ],
  },
  {
    id: 'stats-drop',
    categoryId: 'stats',
    level: 'advanced',
    questionRu: 'Как понять, почему стало меньше записей?',
    questionEn: 'How do I understand why bookings dropped?',
    answerRu:
      'Просадку записей смотрим не “по ощущению”, а по цепочке.\n\nПроверьте:\n1. Есть ли свободные слоты на ближайшие дни? Если нет окон — записей не будет.\n2. Не спрятались ли популярные услуги?\n3. Публичная страница открывается с телефона?\n4. В чатах есть входящие без ответа?\n5. Уведомления и напоминания работают?\n6. Не выросли ли отмены или неявки?\n\nЕсли слоты есть, услуги понятны, а записей нет — проблема чаще в ссылке, трафике или доверии профиля. Тогда усиливаем описание, фото/портфолио и первые услуги.',
    answerEn:
      'Analyze booking drops by chain, not by feeling.\n\nCheck:\n1. Are there free slots in the next days? No windows means no bookings.\n2. Are popular services hidden?\n3. Does the public page open on mobile?\n4. Are there unanswered chats?\n5. Do notifications and reminders work?\n6. Did cancellations or no-shows grow?\n\nIf slots exist, services are clear, but bookings are low — the issue is often link, traffic or profile trust.',
    keywordsRu: ['меньше записей', 'просадка', 'статистика', 'нет заявок', 'нет клиентов', 'упали записи'],
    keywordsEn: ['bookings dropped', 'drop', 'stats', 'no leads', 'no clients', 'fewer bookings'],
    actions: [
      { labelRu: 'Открыть статистику', labelEn: 'Open stats', href: '/dashboard/stats' },
      { labelRu: 'Проверить график', labelEn: 'Check availability', href: '/dashboard/availability' },
    ],
  },
  {
    id: 'chat-fast-reply',
    categoryId: 'chats',
    level: 'standard',
    questionRu: 'Как быстрее отвечать клиентам в чатах?',
    questionEn: 'How do I reply to clients faster in chats?',
    answerRu:
      'Скорость ответа влияет на запись. Клиент часто пишет нескольким мастерам и выбирает того, кто понятнее ответил.\n\nСделайте базовые шаблоны:\n1. “Да, есть время” — с 2–3 вариантами окон.\n2. “Как подготовиться” — короткая инструкция перед визитом.\n3. “Адрес и как пройти” — без лишней переписки.\n4. “Перенос записи” — спокойно и по делу.\n5. “Возврат клиента” — когда появились новые окна.\n\nРобо может помочь написать текст: спросите “напиши шаблон ответа клиенту про адрес” или “напиши сообщение для переноса”.',
    answerEn:
      'Reply speed affects booking. Clients often message several specialists and choose the clearest one.\n\nCreate base templates:\n1. “Yes, I have time” with 2–3 windows.\n2. “How to prepare” short visit instructions.\n3. “Address and how to get in” without extra chat.\n4. “Reschedule” calm and clear.\n5. “Return client” when new windows open.\n\nAsk Robo to write a specific text, for example: “write an address reply template”.',
    keywordsRu: ['чаты', 'быстро отвечать', 'ответ клиенту', 'шаблон ответа', 'сообщение в чат'],
    keywordsEn: ['chats', 'reply faster', 'client reply', 'reply template', 'chat message'],
    actions: [
      { labelRu: 'Открыть чаты', labelEn: 'Open chats', href: '/dashboard/chats' },
      { labelRu: 'Открыть шаблоны', labelEn: 'Open templates', href: '/dashboard/templates' },
    ],
  },
  {
    id: 'payment-access',
    categoryId: 'billing',
    level: 'standard',
    questionRu: 'Почему закрыт доступ или не работает подписка?',
    questionEn: 'Why is access closed or subscription not working?',
    answerRu:
      'Проверяем не интерфейс, а статус доступа.\n\nЧто сделать:\n1. Откройте “Подписка” и проверьте текущий тариф.\n2. Откройте “Оплата” и посмотрите статус платежа.\n3. Если доступ ограничен — проверьте “Лимиты”.\n4. Если оплата прошла, но доступ не появился — обновите страницу и выйдите/войдите снова.\n5. Если всё равно не работает — отправьте в поддержку скрин оплаты и email аккаунта.\n\nРобо может подсказать, какой раздел открыть первым, но сам платёж без интеграции не проведёт.',
    answerEn:
      'Check access status, not just the interface.\n\nDo this:\n1. Open Subscription and check current plan.\n2. Open Payments and check payment status.\n3. If access is limited, check Limits.\n4. If payment succeeded but access did not update, refresh and sign out/in.\n5. If still broken, send support a payment screenshot and account email.\n\nRobo can guide you, but cannot process payment without integration.',
    keywordsRu: ['подписка', 'оплата', 'доступ закрыт', 'лимиты', 'тариф', 'не работает подписка'],
    keywordsEn: ['subscription', 'payment', 'access closed', 'limits', 'plan', 'billing not working'],
    actions: [
      { labelRu: 'Открыть подписку', labelEn: 'Open subscription', href: '/dashboard/subscription' },
      { labelRu: 'Открыть оплату', labelEn: 'Open payments', href: '/dashboard/payments' },
      { labelRu: 'Открыть лимиты', labelEn: 'Open limits', href: '/dashboard/limits' },
    ],
  },
] as const satisfies RoboKnowledgeItem[];

export function normalizeRoboText(value: string) {
  return value
    .toLowerCase()
    .replaceAll('ё', 'е')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getRoboKnowledgeCategory(categoryId: string) {
  return ROBO_KNOWLEDGE_CATEGORIES.find((category) => category.id === categoryId) ?? null;
}

export function getRoboKnowledgeText(item: RoboKnowledgeItem, locale: RoboLocale) {
  return {
    question: locale === 'ru' ? item.questionRu : item.questionEn,
    answer: locale === 'ru' ? item.answerRu : item.answerEn,
    keywords: locale === 'ru' ? item.keywordsRu : item.keywordsEn,
  };
}

export function searchRoboKnowledge(
  query: string,
  locale: RoboLocale,
  limit = 4,
  categoryId?: string,
) {
  const cleanQuery = normalizeRoboText(query);

  if (!cleanQuery && categoryId) {
    return ROBO_KNOWLEDGE_BASE.filter((item) => item.categoryId === categoryId).slice(0, limit);
  }

  if (!cleanQuery) {
    return ROBO_KNOWLEDGE_BASE.slice(0, limit);
  }

  const queryWords = cleanQuery.split(' ').filter((word) => word.length > 2);

  return ROBO_KNOWLEDGE_BASE
    .filter((item) => !categoryId || item.categoryId === categoryId)
    .map((item) => {
      const text = getRoboKnowledgeText(item, locale);
      const otherText = getRoboKnowledgeText(item, locale === 'ru' ? 'en' : 'ru');
      const category = getRoboKnowledgeCategory(item.categoryId);
      const haystack = normalizeRoboText([
        text.question,
        text.answer,
        ...text.keywords,
        otherText.question,
        ...otherText.keywords,
        category?.labelRu ?? '',
        category?.labelEn ?? '',
        category?.descriptionRu ?? '',
        category?.descriptionEn ?? '',
      ].join(' '));

      let score = 0;

      if (haystack.includes(cleanQuery)) score += 18;

      queryWords.forEach((word) => {
        if (haystack.includes(word)) score += 3;
      });

      text.keywords.forEach((keyword) => {
        const normalizedKeyword = normalizeRoboText(keyword);
        if (normalizedKeyword && cleanQuery.includes(normalizedKeyword)) score += 8;
      });

      if (normalizeRoboText(text.question).includes(cleanQuery)) score += 10;

      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}
