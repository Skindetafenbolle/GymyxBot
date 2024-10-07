import express from 'express';
import TelegramBot from 'node-telegram-bot-api'
import dotenv from 'dotenv';
import fetch from 'node-fetch';


dotenv.config();


const token = process.env.TOKEN;
const URL = process.env.URL;

if (!token || !URL) {
    console.error('Ошибка: Переменные окружения TOKEN или URL не установлены.');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

const app = express();
app.use(express.json());

app.post('/send-message', async (req, res) => {
    const { chat_id, message } = req.body;

    if (!chat_id || !message) {
        return res.status(400).json({ error: 'Необходимо предоставить chat_id и сообщение' });
    }

    try {
        await bot.sendMessage(chat_id, message);

        res.status(200).json({ message: 'Сообщение успешно отправлено.' });
    } catch (error) {
        console.error('Ошибка при отправке сообщения:', error);
        res.status(500).json({ error: 'Ошибка при отправке сообщения.' });
    }
});
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, 'Нажмите на кнопку ниже, чтобы поделиться своим номером телефона для авторизации.', {
        reply_markup: {
            keyboard: [
                [{ text: 'Поделиться контактом', request_contact: true }],
            ],
            one_time_keyboard: true,
        },
    });
});

bot.on('contact', async (msg) => {
    const chatId = msg.chat.id;
    const phoneNumber = msg.contact.phone_number;

    console.log(`Chat ID: ${chatId}`);
    console.log(`Phone Number: ${phoneNumber}`);

    try {
        const response = await fetch(URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone: phoneNumber,
                telegram_id: chatId
            }),
        });

        const data = await response.json();
        if (response.ok) {
            bot.sendMessage(chatId, 'Ваш номер телефона успешно отправлен и сохранен.');
        } else {
            console.error('Ошибка на стороне API:', data);
            bot.sendMessage(chatId, 'Ошибка при отправке данных на сервер.');
        }
    } catch (error) {
        console.error('Ошибка при отправке данных на API:', error);
        bot.sendMessage(chatId, 'Произошла ошибка при отправке данных.');
    }
});

app.listen(3001, () => {
    console.log('Сервер запущен на порту 3001');
});