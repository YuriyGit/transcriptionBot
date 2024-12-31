import {hydrateFiles} from "@grammyjs/files";
import {Bot, GrammyError, HttpError} from "grammy";
import 'dotenv/config';
import {createClient} from "@deepgram/sdk";
import fs from "node:fs";

const bot = new Bot(process.env.BOT_API_KEY);
bot.api.config.use(hydrateFiles(bot.token));
/////command/////
bot.command('start', async ctx => {
    await ctx.reply(`Привет ${ctx.from.first_name}`);
});
/////listen/////
const listen = async (path) => {
    const deepgram = createClient(process.env.DEEP_GRAM_API_KEY);
    const {result, error} = await deepgram.listen.prerecorded.transcribeFile(
        fs.readFileSync(path),
        {
            model: 'nova-2',
            smart_format: true,
            language: 'ru',
        },
    );

    if (error) {
        console.error(error);
    } else {
        console.dir(result.results.channels[0].alternatives[0].transcript, {depth: null});
        return result.results.channels[0].alternatives[0].transcript;
    }
}
/////
bot.on(':voice', async ctx => {
    const file = await ctx.getFile();
    const path = await file.download();
    const result = await listen(path);
    await ctx.reply(result);
});
/////err/////
bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Ошибка при обработке обновления ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
        console.error("Ошибка в запросе:", e.description);
    } else if (e instanceof HttpError) {
        console.error("Не удалось связаться с Telegram:", e);
    } else {
        console.error("Неизвестная ошибка:", e);
    }
});
/////
await bot.start();