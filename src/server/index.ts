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
                console.log(`[Bridge] AUTH_SUCCESS для: ${response.playerHandle}`);

                const players = getPlayers();
                for (const playerSrc of players) {
                    const name = GetPlayerName(playerSrc);
                    if (name === response.playerHandle) {
                        console.log(`[Bridge] Нашли игрока! Отправляем auth:success`);
                        const srcNum = Number(playerSrc);
                        TriggerClientEvent('auth:success', srcNum, response.characterData);

                        playerData.set(srcNum, {
                            accountId: response.characterData.accountId,
                            health: response.characterData.health,
                            armor: response.characterData.armor,
                            money: response.characterData.money,
                            bankMoney: response.characterData.bankMoney,
                            lastX: response.characterData.lastX,
                            lastY: response.characterData.lastY,
                            lastZ: response.characterData.lastZ,
                        });

                        break;
                    }
                }
            }

            if (cmd.action === 'AUTH_ERROR') {
                const errorInfo = JSON.parse(cmd.data);
                const players = getPlayers();
                for (const playerSrc of players) {
                    if (GetPlayerName(playerSrc) === errorInfo.username) {
                        TriggerClientEvent('auth:error', parseInt(playerSrc), errorInfo.reason);
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

RegisterCommand('save', (source: number) => {
    const data = playerData.get(source);
    if (data && pub.isOpen) {
        pub.publish('game_events', JSON.stringify({
            cmd: 'save_player',
            player: GetPlayerName(String(source)),
            data: JSON.stringify(data)
        }));
        console.log(`[Bridge] Принудительное сохранение для ${GetPlayerName(String(source))}`);
    }
}, false);

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

onNet('auth:request_register', async (username: string, password: string, isRegister: boolean) => {
    const src = (global as any).source;

    // @ts-ignore
    const steamId = GetPlayerIdentifier(src, 'steam') ?? 'unknown';
    // @ts-ignore
    const licenseId = GetPlayerIdentifier(src, 'license') ?? 'unknown';

    const playerName = GetPlayerName(src as any);
    const command = isRegister ? 'register' : 'login';

    const payload = JSON.stringify({
        cmd: command,
        player: playerName,
        data: JSON.stringify({
            username,
            password,
            socialClubId: licenseId,
            hardwareId: steamId,
        }),
    });

    if (pub.isOpen) {
        await pub.publish('game_events', payload);
    }
});