import * as alt from 'alt-server';
import { createClient } from 'redis';

console.log("🔥 Bridge: Загрузка TypeScript версии...");

const pub = createClient({ url: 'redis://127.0.0.1:6379' });
const sub = createClient({ url: 'redis://127.0.0.1:6379' });

interface JavaCommand {
    action: string;
    data: string;
}

(async () => {
    try {

        await pub.connect();
        await sub.connect();
        console.log('Bridge: Связь с Redis установлена');

        await sub.subscribe('game_commands', (message) => {
            try {
                const cmd: JavaCommand = JSON.parse(message);
                console.log(`Получено от Java: ${cmd.action} -> ${cmd.data}`);

                if (cmd.action === 'SHOW_NOTIFICATION') {
                    alt.emitAllClients('notify', cmd.data);
                }

            } catch (err) {
                console.error("Ошибка обработки сообщения от Java:", err);
            }
        });

    } catch (e) {
        console.error("Redis Error:", e);
    }
})();

alt.on('playerConnect', (player) => {
    console.log(`👤 Игрок ${player.name} зашел.`);

    const payload = JSON.stringify({
        cmd: 'login',
        player: player.name
    });

    pub.publish('game_events', payload);
});