# Anoda Bridge | FiveM TypeScript Adapter

![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![FiveM](https://img.shields.io/badge/FiveM-Client%20%26%20Server-orange) ![Node.js](https://img.shields.io/badge/Runtime-Node.js-green) ![License](https://img.shields.io/badge/License-MIT-green)

**Anoda Bridge** is the communication layer (Adapter) for the game server, running within the **FiveM** environment.
Its primary role is to act as the system's "hands": it makes no business decisions but acts as a bridge, translating game events to [Anoda Core](https://github.com/afanetd/anoda-core) (Java) and executing incoming commands.

## 🔗 How It Works

This service operates as a "dumb terminal" or a stateless client:
1.  **Listens to Player:** (Keystrokes, connection, damage) -> Sends JSON payloads to Redis.
2.  **Listens to Core:** Receives commands from Redis -> (Show UI, spawn vehicle, teleport player).

## 🛠 Tech Stack

* **Language:** TypeScript
* **Platform:** Node.js (Server-side FiveM)
* **Communication:** Redis Client (Pub/Sub)
* **Build Tool:** `tsc` (TypeScript Compiler)

## 📦 Resources

| Resource | Description |
|----------|-------------|
| [anoda-bridge](anoda-bridge) | Core bridge — Redis communication, player sync, save on disconnect |
| [anoda-auth](anoda-auth) | Authentication module — login, register, NUI interface |

## 🚀 Installation & Setup

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Compile TypeScript to JavaScript (outputs to `dist` folder):
    ```bash
    npx tsc
    ```
    
    or
    
    ```bash
    npm run build
    ```
    *(Or use `npx tsc -w` for auto-compilation during development)*

4.  Ensure your `fxmanifest.lua` points to the compiled file: `dist/index.js`.
