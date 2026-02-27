/// <reference types="@citizenfx/server" />

onNet('auth:request_register', async (username: string, password: string, isRegister: boolean) => {
    const src = (globalThis as any).source;
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
    exports['anoda-bridge'].publish('game_events', payload);
});

on('bridge:AUTH_SUCCESS', (src: number, data: any) => {
    TriggerClientEvent('auth:success', src, data);
});

on('bridge:AUTH_ERROR', (src: number, reason: string) => {
    TriggerClientEvent('auth:error', src, reason);
});