"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference types="@citizenfx/server" />
const redis_1 = require("redis");
const pub = (0, redis_1.createClient)({ url: 'redis://127.0.0.1:6379' });
const sub = (0, redis_1.createClient)({ url: 'redis://127.0.0.1:6379' });
(async () => {
    await pub.connect();
    await sub.connect();
    console.log('Bridge: Связь с Redis установлена');
    await sub.subscribe('game_commands', (message) => {
        try {
            const cmd = JSON.parse(message);
            console.log(`[Java -> JS] Action: ${cmd.action}`);
            if (cmd.action === 'AUTH_SUCCESS') {
                const response = JSON.parse(cmd.data);
                console.log(`[Bridge] AUTH_SUCCESS для: ${response.playerHandle}`);
                console.log(`[Bridge] Игроки онлайн: ${getPlayers().map(p => GetPlayerName(p)).join(', ')}`);
                const players = getPlayers();
                for (const playerSrc of players) {
                    const name = GetPlayerName(playerSrc);
                    if (name === response.playerHandle) {
                        console.log(`[Bridge] Нашли игрока! Отправляем auth:success`);
                        const srcNum = Number(playerSrc);
                        console.log(`[Bridge] src: ${playerSrc}, num: ${srcNum}`);
                        TriggerClientEvent('auth:success', srcNum, response.characterData);
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
        }
        catch (err) {
            console.error('Ошибка обработки пакета от Java:', err);
        }
    });
})();
on('playerConnecting', (name, setKickReason, deferrals) => {
    deferrals.defer();
    deferrals.done();
});
onNet('auth:request_register', async (username, password, isRegister) => {
    const src = global.source;
    // @ts-ignore
    const steamId = GetPlayerIdentifier(src, 'steam') ?? 'unknown';
    // @ts-ignore
    const licenseId = GetPlayerIdentifier(src, 'license') ?? 'unknown';
    const playerName = GetPlayerName(src);
    const command = isRegister ? 'register' : 'login';
    const registrationData = {
        username,
        password,
        socialClubId: licenseId,
        hardwareId: steamId,
    };
    const payload = JSON.stringify({
        cmd: command,
        player: playerName,
        data: JSON.stringify(registrationData),
    });
    if (pub.isOpen) {
        await pub.publish('game_events', payload);
    }
});
