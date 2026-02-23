/// <reference types="@citizenfx/client" />
let authOpened = false;
const openAuth = async () => {
    DisplayRadar(false);
    DisplayHud(false);
    SendNUIMessage({ type: 'open' });
    await new Promise(r => setTimeout(r, 500));
    SetNuiFocus(true, true);
    SetNuiFocusKeepInput(false);
    SetMouseCursorVisible(true);
};
on('onClientResourceStart', async (resourceName) => {
    if (GetCurrentResourceName() !== resourceName)
        return;
    exports['spawnmanager'].setAutoSpawn(false);
    await new Promise(r => setTimeout(r, 800));
    if (!authOpened) {
        authOpened = true;
        openAuth();
    }
});
onNet('auth:success', async (stats) => {
    SendNUIMessage({ type: 'close' });
    SetNuiFocus(false, false);
    SetMouseCursorVisible(false);
    exports['spawnmanager'].spawnPlayer({
        x: stats.lastX,
        y: stats.lastY,
        z: stats.lastZ,
        heading: 0,
        model: 'mp_m_freemode_01',
        skipFade: true
    }, async () => {
        const model = GetHashKey('mp_m_freemode_01');
        RequestModel(model);
        while (!HasModelLoaded(model)) {
            await new Promise(r => setTimeout(r, 100));
        }
        console.log('^2[Auth] ^0Модель загружена, применяем...');
        SetPlayerModel(PlayerId(), model);
        SetModelAsNoLongerNeeded(model);
        await new Promise(r => setTimeout(r, 500));
        const ped = PlayerPedId();
        FreezeEntityPosition(ped, false);
        SetPlayerControl(PlayerId(), true, 0);
        // Сбрасываем все камеры
        RenderScriptCams(false, false, 0, true, false);
        // Переключаем на третье лицо
        SetFollowPedCamViewMode(1);
        // Делаем ped видимым для всех
        SetEntityVisible(ped, true, false);
        ResetEntityAlpha(ped);
        // Принудительно обновляем компоненты модели
        SetPedDefaultComponentVariation(ped);
        DisplayRadar(true);
        DisplayHud(true);
    });
});
onNet('auth:error', (reason) => {
    SendNUIMessage({ type: 'auth_error', reason });
});
RegisterNuiCallbackType('submit_login');
on('__cfx_nui:submit_login', (data, cb) => {
    emitNet('auth:request_register', data.username, data.password, data.isRegister);
    cb({});
});
