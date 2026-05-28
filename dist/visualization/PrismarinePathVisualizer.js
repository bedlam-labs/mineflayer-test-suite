"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismarinePathVisualizer = void 0;
const vec3_1 = require("vec3");
class PrismarinePathVisualizer {
    constructor(bot) {
        this.bot = bot;
    }
    renderPath(nodes) {
        if (!this.bot.viewer)
            return;
        const toPoint = (n) => new vec3_1.Vec3(n.x + 0.5, n.y + 0.5, n.z + 0.5);
        this.bot.viewer.drawLine('viz-path', nodes.map(toPoint), 0x00aaff);
        const neoNodes = nodes.filter(n => n.neo);
        if (neoNodes.length > 0) {
            this.bot.viewer.drawLine('viz-neo', neoNodes.map(toPoint), 0xff8800);
        }
        else {
            this.bot.viewer.erase('viz-neo');
        }
    }
    clear() {
        this.bot.viewer?.erase('viz-path');
        this.bot.viewer?.erase('viz-neo');
    }
}
exports.PrismarinePathVisualizer = PrismarinePathVisualizer;
//# sourceMappingURL=PrismarinePathVisualizer.js.map