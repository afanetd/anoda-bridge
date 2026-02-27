/// <reference types="@citizenfx/client" />

setInterval(() => {
    const ped = PlayerPedId();
    const [x, y, z] = GetEntityCoords(ped, true);
    
    emitNet('player:sync', {
        health: GetEntityHealth(ped),
        armor: GetPedArmour(ped),
        lastX: x,
        lastY: y,
        lastZ: z,
    });
}, 10000);