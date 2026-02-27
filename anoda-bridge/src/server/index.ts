/// <reference types="@citizenfx/server" />
import { createClient } from 'redis';

const pub = createClient({ url: 'redis://127.0.0.1:6379' });
const sub = createClient({ url: 'redis://127.0.0.1:6379' });

interface JavaCommand {
    action: string;
    data: string;
}

interface PlayerSyncData {
    accountId: number;
    health: number;
    armor: number;
    money: number;
    bankMoney: number;
    lastX: number;
    lastY: number;
    lastZ: number;
}

const playerData = new Map<number, PlayerSyncData>();

(async () => {
    await pub.connect();
    await sub.connect();
    console.log('Bridge: Связь с Redis установлена');

    await sub.subscribe('game_commands', (message) => {
        try {
            const cmd: JavaCommand = JSON.parse(message);
            console.log(`[Java -> JS] Action: ${cmd.action}`);

            if (cmd.action === 'AUTH_SUCCESS') {
                const response = JSON.parse(cmd.data);
                const players = getPlayers();
                for (const playerSrc of players) {
                    if (GetPlayerName(playerSrc) === response.playerHandle) {
                        const srcNum = Number(playerSrc);
                        playerData.set(srcNum, response.characterData);
                        emit('bridge:AUTH_SUCCESS', srcNum, response.characterData);
                        break;
                    }
                }
            }

            if (cmd.action === 'AUTH_ERROR') {
                const errorInfo = JSON.parse(cmd.data);
                const players = getPlayers();
                for (const playerSrc of players) {
                    if (GetPlayerName(playerSrc) === errorInfo.username) {
                        emit('bridge:AUTH_ERROR', Number(playerSrc), errorInfo.reason);
                        break;
                    }
                }
            }

        } catch (err) {
            console.error('Ошибка обработки пакета от Java:', err);
        }
    });
})();

on('playerConnecting', (name: string, setKickReason: Function, deferrals: any) => {
    deferrals.defer();
    deferrals.done();
});

onNet('player:sync', (data: PlayerSyncData) => {
    const src = (global as any).source;
    const existing = playerData.get(src);

    if (existing) {
        playerData.set(src, { ...existing, ...data });
    }
});

on('playerDropped', async () => {
    const src = (global as any).source;
    const data = playerData.get(src);

    if (data) {
        console.log(`[Bridge] Сохраняем данные игрока ${GetPlayerName(String(src))} при выходе`);

        if (pub.isOpen) {
            await pub.publish('game_events', JSON.stringify({
                cmd: 'save_player',
                player: GetPlayerName(String(src)),
                data: JSON.stringify(data)
            }));
        }

        playerData.delete(src);
    }
});

exports('publish', async (channel: string, data: string) => {
    if (pub.isOpen) {
        await pub.publish(channel, data);
    }
});