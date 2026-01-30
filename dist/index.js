import * as alt from 'alt-server';
import { createClient } from 'redis';
console.log("🔥 Bridge: Загрузка TypeScript версии...");
// 1. Создаем клиентов
const pub = createClient({ url: 'redis://127.0.0.1:6379' });
const sub = createClient({ url: 'redis://127.0.0.1:6379' });
(async () => {
    try {
        // 2. Подключаемся
        await pub.connect();
        await sub.connect();
        console.log('✅ Bridge: Связь с Redis установлена');
        // 3. ПОДПИСЫВАЕМСЯ на команды от Java
        // Java пишет в канал "game_commands"
        await sub.subscribe('game_commands', (message) => {
            try {
                const cmd = JSON.parse(message);
                console.log(`📨 Получено от Java: ${cmd.action} -> ${cmd.data}`);
                // ТУТ БУДЕТ РАСПРЕДЕЛЕНИЕ (Switch)
                if (cmd.action === 'SHOW_NOTIFICATION') {
                    // Пока просто выведем всем в чат (или конкретному игроку, если передашь ID)
                    alt.emitAllClients('notify', cmd.data);
                }
            }
            catch (err) {
                console.error("Ошибка обработки сообщения от Java:", err);
            }
        });
    }
    catch (e) {
        console.error("Redis Error:", e);
    }
})();
// 4. Отправляем события В Java
alt.on('playerConnect', (player) => {
    console.log(`👤 Игрок ${player.name} зашел. Сообщаю в Java...`);
    // Формируем JSON для Java
    const payload = JSON.stringify({
        cmd: 'login',
        player: player.name
    });
    // Отправляем в канал "game_events" (который слушает Java)
    pub.publish('game_events', payload);
});
