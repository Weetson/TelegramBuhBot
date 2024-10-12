import TelegramBot from 'node-telegram-bot-api';
import { config } from 'dotenv';
import Post from './Post.js';
import fs from 'fs';
import Graph from './Graph.js';

config();

const TOKEN = process.env.TOKEN;
const REGEX = /^\d+(?:[.,]\d{1,2})?$/;

const bot = new TelegramBot(TOKEN, { polling: true});

const causeOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{text: 'Еда', callback_data: 'food'}, {text: 'Здоровье и мед расходы', callback_data: 'health'}],
            [{text: 'Дорога', callback_data: 'road'}, {text: 'Машина', callback_data: 'car'}],
            [{text: 'Коммуналка', callback_data: 'kom'}, {text: 'Ништяки с вб', callback_data: 'wb'}],
            [{text: 'Образование и развитие', callback_data: 'edu'},{text: 'Спорт', callback_data: 'sport'}],
            [{text: 'Ипотека', callback_data: 'ipot'}, {text: 'Развлечение', callback_data: 'entertai'}],
            [{text: 'Одежда / подарки', callback_data: 'cloth'}, {text: 'Связь и интернет', callback_data: 'inet'}]
        ]
    })
}

// Настройка кнопок ответа
const buttonOptions = {
    reply_markup: {
        keyboard: [
        [{ text: '/spend' }, { text: '/thismonth' }],
        [{ text: '/somemonth(Сюда не жмай пака!)' }]
        ],
        resize_keyboard: true, // Автоматически подгоняет размер кнопок
        one_time_keyboard: true // Кнопки исчезнут после использования
    }
};

// Настройка кнопок валюты
const currencyOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
        [{ text: 'BYN', callback_data: 'BYN'}, { text: 'PLN', callback_data: 'PLN'}]
        ],
        resize_keyboard: true, // Автоматически подгоняет размер кнопок
        one_time_keyboard: true // Кнопки исчезнут после использования
    })
};

const monthOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{text: 'Декабрь', callback_data: 11}, {text: 'Январь', callback_data: 0}, {text: 'Февраль', callback_data: 1}],
            [{text: 'Март', callback_data: 2}, {text: 'Аперль', callback_data: 3}, {text: 'Май', callback_data: 4}],
            [{text: 'Июнь', callback_data: 5}, {text: 'Июль', callback_data: 6}, {text: 'Август', callback_data: 7}],
            [{text: 'Сентябрь', callback_data: 8}, {text: 'Окрябрь', callback_data: 9}, {text: 'Ноябрь', callback_data: 10}]
        ]
    })
}

// Объект, в котором будем хранить состояния разговора с каждым пользователем
const conversations = {};
const summ = {};
const cause = {};
const currency = {};

const start = async () => {
    bot.setMyCommands([
        { command: '/spend', description: 'Я потратил деньги!!!' },
        { command: '/thismonth', description: 'Посмотреть статистику за этот месяц' },
        { command: '/lastmonth', description: 'Посмотреть статистику за прошлый месяц' }
    ])

    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, 'Выберите одну из кнопок:', buttonOptions);
    });

    bot.on('message', async (msg) => {
        const text = msg.text;
        const chatId = msg.chat.id;

        // Проверяем, есть ли уже разговор с этим пользователем
        if (!conversations[chatId]) {
            conversations[chatId] = { state: 'start' };
        }

        const conversation = conversations[chatId];

        // Обработка команд
        switch (conversation.state) {
            case 'start':
                if (text === '/spend') {
                    // Пользователь хочет ввести сумму расхода
                    conversation.state = 'waitingForAmount';
                    return bot.sendMessage(chatId, 'Напиши, сколько денег ты потратил:');
                }
                if (text === '/thismonth') {
                    let date = new Date();
                    let monthc = date.getMonth()
                    let yearc = date.getFullYear()

                    const graphData = await Post.getAllForMonth(monthc, yearc);
                    const processed = await Graph.processData(graphData);
                    const graphName = await Graph.createGraph(processed);
                    //console.log(graphData)
                    await bot.sendPhoto(chatId, `graphs/${graphName}.png`)
                    return bot.sendMessage(chatId, 'Статистика за этот месяц', buttonOptions);
                }
                if (text === '/somemonth') {
                    return bot.sendMessage(chatId, 'Статистика за выбранный месяц', buttonOptions);
                }
                return bot.sendMessage(chatId, 'Я тебя не понимаю.', buttonOptions);
                break;
            case 'waitingForAmount':
                // Ожидание суммы от пользователя
                // Обработка суммы (можно добавить проверку на соответствие формату числа)
                conversation.state = 'start';
                if(REGEX.test(text)) {
                    // conversation.state = 'waitingForCurrency';
                    summ[chatId] = parseFloat(text.replace(",", "."));
                    return bot.sendMessage(chatId, 'Выберите валюту', currencyOptions);
                   // return bot.sendMessage(chatId, `Ты потратил ${summ[chatId]} рублей. по причине ${await cause[chatId]}`);
                } else {
                    conversation.state = 'waitingForAmount';
                    return bot.sendMessage(chatId, `Ты неправильно ввел, попробуй ещё раз`);
                }
                break;
           /* case 'waitingForCurrency':
                conversation.state = 'start';
                try {
                    if(text == 'PLN') {summ[ChatId] = Math.round(summ[ChatId] / 1.2);}
                    else if(text == 'BYN') {summ[ChatId] = summ[ChatId];}

                    return bot.sendMessage(chatId, 'Выберите причину траты', causeOptions);
                } catch (err) {
                    fs.writeFile('log.txt', err);
                    return bot.sendMessage(chatId, `Пост не был создан из-за ошибки`, buttonOptions);
                }

                break; */
            default:
                conversation.state = 'start';
                return bot.sendMessage(chatId, 'Что-то пошло не так. Начнем сначала.', buttonOptions);
        }
    });

    /* bot.on('callback_query', async (msg) => {
        const chatId = msg.from.id;

        if(msg.message.text == 'Выберите причину траты') {
            try {
                //console.log(msg);
                cause[chatId] = msg.data;
                let date = new Date();
                const createdPost = await Post.create({"spentmoney": summ[chatId], "cause": cause[chatId], "author": msg.message.chat.first_name, "monthc": date.getMonth(), "yearc": date.getFullYear()});
                //console.log(createdPost);
                return bot.sendMessage(chatId, `Пост создан, вы потратили ${summ[chatId]} по причине ${cause[chatId]}`, buttonOptions);
            } catch (err) {
                fs.writeFile('log.txt', err);
                return bot.sendMessage(chatId, `Пост не был создан из-за ошибки`, buttonOptions);
            }
        }

        if(msg.message.text == 'Выберите валюту') {
            try {
                currency[сhatId] = msg.data;
                if(currency[сhatId] == 'PLN') {summ[сhatId] = Math.round(summ[сhatId] / 1.2);}
                else if(currency[сhatId] == 'BYN') {summ[сhatId] = summ[сhatId];}

                return bot.sendMessage(chatId, 'Выберите причину траты', causeOptions);
            } catch (err) {
                console.log(err);
            }
        }


    }) */

    bot.on('callback_query', async (msg) => {
        const chatId = msg.from.id;

        if (msg.message.text === 'Выберите причину траты') {
            try {
                cause[chatId] = msg.data;
                let date = new Date();
                const createdPost = await Post.create({
                    "spentmoney": summ[chatId],
                    "cause": cause[chatId],
                    "author": msg.message.chat.first_name,
                    "monthc": date.getMonth(),
                    "yearc": date.getFullYear()
                });
                return bot.sendMessage(chatId, `Пост создан, вы потратили ${summ[chatId]} по причине ${cause[chatId]}`, buttonOptions);
            } catch (err) {
                fs.writeFile('log.txt', err.toString());
                return bot.sendMessage(chatId, `Пост не был создан из-за ошибки`, buttonOptions);
            }
        }

        if (msg.message.text === 'Выберите валюту') {  // Исправлено здесь
            try {
                currency[chatId] = msg.data;  // Исправлено здесь
                if (currency[chatId] === 'PLN') {
                    summ[chatId] = Math.round(summ[chatId] / 1.2);
                } else if (currency[chatId] === 'BYN') {
                    summ[chatId] = summ[chatId];
                }

                return bot.sendMessage(chatId, 'Выберите причину траты', causeOptions);
            } catch (err) {
                console.log(err);
            }
        }
    });

}

start();
