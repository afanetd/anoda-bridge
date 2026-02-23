fx_version 'cerulean'
game 'gta5'

author 'afanetd'
description 'The bridge between FiveM and Java Core'
version '1.0.0'

dependencies {
    'spawnmanager'
}

server_scripts {
    'dist/server/index.js'
}

client_scripts {
    'dist/client/ShowLogin.js'
}

ui_page 'dist/client/html/auth.html'

files {
    'dist/client/html/auth.html'
}

