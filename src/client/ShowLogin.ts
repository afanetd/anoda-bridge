import * as alt from 'alt-client';
import * as native from 'natives';

let loginView: alt.WebView | null = null;
let loginCam: number | null = null;


alt.onServer('auth:open_ui', () => {

    if (loginView) return;

    native.displayRadar(false);
    native.displayHud(false);

    loginCam = native.createCamWithParams(
        'DEFAULT_SCRIPTED_CAMERA',
        -363.96, 1083.47, 350.0, 
        0, 0, 0, 
        50, 
        true, 
        2
    );

    native.pointCamAtCoord(loginCam, 74.06, -785.49, 100.0);
    native.setCamActive(loginCam, true);
    native.renderScriptCams(true, false, 0, true, false, 0);
    
    native.freezeEntityPosition(alt.Player.local.scriptID, true);
    native.setEntityVisible(alt.Player.local.scriptID, false, false);

    loginView = new alt.WebView('http://resource/dist/client/html/auth.html');
    loginView.focus();
    
    alt.showCursor(true);
    alt.toggleGameControls(false); 

    loginView.on('view:submit_login', (username, password, isRegister) => {
        alt.emitServer('auth:request_register', username, password, isRegister);
    });

    console.log("CL: UI авторизации открыт.");
});


alt.onServer('auth:success', (stats: any) => {
    if (loginView) {
        loginView.destroy();
        loginView = null;
    }
    
    alt.showCursor(false);

    cleanupLoginCamera();
});


alt.onServer('auth:error', (reason: string) => {
    console.log(`CL: Ошибка входа: ${reason}`);
    
    if (loginView) {
        loginView.emit('view:auth_error', reason);
    }
});


function cleanupLoginCamera() {
    alt.toggleGameControls(true);

    native.renderScriptCams(false, false, 0, true, false, 0);
    if (loginCam !== null) {
        native.destroyCam(loginCam, false);
        loginCam = null;
    }

    native.displayRadar(true);
    native.displayHud(true);
    
    native.freezeEntityPosition(alt.Player.local.scriptID, false);
    native.setEntityVisible(alt.Player.local.scriptID, true, false);
}