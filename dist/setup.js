"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setup = setup;
exports.waitForCondition = waitForCondition;
const http = __importStar(require("http"));
const flying_squid_1 = require("flying-squid");
const mineflayer_1 = __importDefault(require("mineflayer"));
const PathVisualizer_1 = require("./visualization/PathVisualizer");
const PrismarinePathVisualizer_1 = require("./visualization/PrismarinePathVisualizer");
const SERVER_DEFAULTS = {
    'online-mode': false,
    version: '1.8.8',
    logging: false,
    plugins: {},
    'view-distance': 2,
    'max-players': 4,
    gameMode: 1,
    'player-list-text': { header: '', footer: '' },
};
function postLayout(adminPort, layout) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(layout);
        const req = http.request({ hostname: 'localhost', port: adminPort, path: '/reset', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, res => { res.resume(); res.on('end', resolve); });
        req.on('error', reject);
        req.end(body);
    });
}
async function applyLayoutStandalone(world, layout, version) {
    const mcData = require('minecraft-data')(version);
    const PBlock = require('prismarine-block')(version);
    const { Vec3 } = require('vec3');
    const sidOf = (name) => {
        const info = mcData.blocksByName[name];
        return new PBlock(info.id, 0, 0).stateId ?? (info.id << 4);
    };
    for (const region of layout.fillRegions) {
        const sid = sidOf(region.block);
        const ops = [];
        for (let x = region.min.x; x <= region.max.x; x++)
            for (let y = region.min.y; y <= region.max.y; y++)
                for (let z = region.min.z; z <= region.max.z; z++)
                    ops.push(world.setBlockStateId(new Vec3(x, y, z), sid));
        await Promise.all(ops);
    }
    await Promise.all(layout.placedBlocks.map(({ pos, block }) => world.setBlockStateId(new Vec3(pos.x, pos.y, pos.z), sidOf(block))));
}
async function setup(options) {
    const { port, layout, version = '1.8.8', plugins = [], viewDistance = 2 } = options;
    const externalPort = process.env.TEST_SERVER_PORT
        ? Number(process.env.TEST_SERVER_PORT)
        : null;
    let stopServer = null;
    if (externalPort) {
        await postLayout(externalPort + 2000, layout);
    }
    else {
        const voidGenPath = require('path').resolve(__dirname, '../void-generator.js');
        const server = (0, flying_squid_1.createMCServer)({
            ...SERVER_DEFAULTS,
            port,
            version,
            'view-distance': viewDistance,
            generation: { name: voidGenPath, options: { seed: 0 } },
        });
        server.once('pluginsReady', () => {
            server.getSpawnPoint = async () => server.spawnPoint;
        });
        await new Promise(resolve => server.once('listening', resolve));
        const { Vec3 } = require('vec3');
        server.spawnPoint = new Vec3(layout.spawnPoint.x, layout.spawnPoint.y, layout.spawnPoint.z);
        await applyLayoutStandalone(server.overworld, layout, version);
        stopServer = () => server.quit();
    }
    const connectPort = externalPort ?? port;
    const bot = mineflayer_1.default.createBot({
        host: 'localhost', port: connectPort, username: 'Test', version, auth: 'offline',
    });
    for (const plugin of plugins) {
        bot.loadPlugin(plugin);
    }
    await new Promise((resolve, reject) => {
        bot.once('spawn', resolve);
        bot.once('error', reject);
        setTimeout(() => reject(new Error('spawn timeout')), 15000);
    });
    let visualizer = new PathVisualizer_1.NullPathVisualizer();
    if (externalPort) {
        const { mineflayer: startMineflayerViewer } = require('prismarine-viewer');
        startMineflayerViewer(bot, { port: externalPort + 3000, firstPerson: false, viewDistance: 4 });
        visualizer = new PrismarinePathVisualizer_1.PrismarinePathVisualizer(bot);
    }
    bot.on('path_update', (update) => {
        visualizer.renderPath(update.path);
    });
    return {
        bot,
        visualizer,
        teardown: async () => {
            await new Promise(resolve => {
                bot.once('end', () => resolve());
                bot.quit();
                stopServer?.();
            });
        },
    };
}
function waitForCondition(condition, intervalMs = 50, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
            if (condition()) {
                clearInterval(interval);
                clearTimeout(timeout);
                resolve();
            }
        }, intervalMs);
        const timeout = setTimeout(() => {
            clearInterval(interval);
            reject(new Error('condition timed out'));
        }, timeoutMs);
    });
}
//# sourceMappingURL=setup.js.map