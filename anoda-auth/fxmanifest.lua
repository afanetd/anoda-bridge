fx_version 'cerulean'
game 'gta5'
author 'afanetd'
description 'Authentication module'
version '1.0.0'

dependencies {
    'spawnmanager',
    'anoda-bridge'
}

server_scripts {
    'dist/server/index.js'
}

client_scripts {
    'dist/client/index.js'
}

ui_page 'dist/client/html/auth.html'

files {
    'dist/client/html/auth.html'
}