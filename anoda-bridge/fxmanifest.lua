fx_version 'cerulean'
game 'gta5'
author 'afanetd'
description 'Core bridge between FiveM and Java'
version '1.0.0'

dependencies {
    'spawnmanager'
}

server_scripts {
    'dist/server/index.js'
}

client_scripts {
    'dist/client/index.js'
}