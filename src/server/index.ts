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

                console.log(`[Java -> JS] Action: ${cmd.action}`);

                if (cmd.action === 'AUTH_SUCCESS') {

                    const response = JSON.parse(cmd.data);
                    const searchName = response.playerHandle || response.username;


                    const targetPlayer = alt.Player.all.find(p => p.name === searchName);

                    if (targetPlayer && targetPlayer.valid) {

                        const stats = response.characterData;
                        targetPlayer.model = 'mp_m_freemode_01';
                        targetPlayer.spawn(stats.lastX, stats.lastY, stats.lastZ);

                        targetPlayer.emit('auth:success', stats);
                    } else {
                        console.log("Доступные игроки:", alt.Player.all.map(p => p.name).join(', '));
                    }
                }

                if (cmd.action === 'AUTH_ERROR') {
                    const errorInfo = JSON.parse(cmd.data);
                    
                    const targetPlayer = alt.Player.all.find(p => p.name === errorInfo.username);
                    if (targetPlayer && targetPlayer.valid) {
                        targetPlayer.emit('auth:error', errorInfo.reason);
                    }
                }

            } catch (err) {
                console.error("Ошибка обработки пакета от Java:", err);
            }
        });

    } catch (e) {
        console.error("Redis Fatal Error:", e);
    }
})();

alt.on('playerConnect', (player) => {
    console.log(`Игрок ${player.name} подключился.`);

    player.model = 'mp_m_freemode_01';
    player.spawn(-425.48, 1123.55, 325.85); 

    alt.setTimeout(() => {
        if(player && player.valid) {
            player.emit('auth:open_ui'); 
        }
    }, 1000);
});

alt.onClient('auth:request_register', async (player, username, password, isRegister) => {
    console.log(`BRIDGE: Запрос от ${player.name}: ${isRegister ? 'Регистрация' : 'Вход'}`);

    const command = isRegister ? 'register' : 'login';

    const registrationData = {
        username: username, 
        password: password, 
        socialClubId: player.socialID.toString(), 
        hardwareId: player.hwidHash.toString(), 
    };

    const payload = JSON.stringify({
        cmd: command,
        player: player.name, 
        data: JSON.stringify(registrationData)
    });

    if (pub.isOpen) {
        try {
            await pub.publish('game_events', payload);
        } catch(e) {
            console.error("Ошибка отправки в Redis:", e);
        }
    } else {
        console.error("Ошибка: Redis не подключен, не могу отправить данные!");
    }
});