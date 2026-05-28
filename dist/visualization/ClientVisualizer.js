"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NullClientVisualizer = exports.PrismarineClientVisualizer = void 0;
class PrismarineClientVisualizer {
    constructor(bot) {
        this.bot = bot;
        this.trackedIds = new Set();
    }
    drawLine(id, points, color = 0x00aaff) {
        if (!this.bot.viewer)
            return;
        this.trackedIds.add(id);
        this.bot.viewer.drawLine(id, points, color);
    }
    drawBox(id, start, end, color = 0x00ff00) {
        if (!this.bot.viewer)
            return;
        this.trackedIds.add(id);
        this.bot.viewer.drawBox(id, start, end, color);
    }
    drawSphere(id, position, radius = 0.5, color = 0xff00ff) {
        if (!this.bot.viewer)
            return;
        this.trackedIds.add(id);
        this.bot.viewer.drawSphere(id, position, radius, color);
    }
    drawPoints(id, points, color = 0xffff00, size = 5) {
        if (!this.bot.viewer)
            return;
        this.trackedIds.add(id);
        this.bot.viewer.drawPoints(id, points, color, size);
    }
    drawText(id, position, text, color = '#ffffff') {
        if (!this.bot.viewer)
            return;
        this.trackedIds.add(id);
        this.bot.viewer.drawText(id, position, text, color);
    }
    erase(id) {
        this.bot.viewer?.erase(id);
        this.trackedIds.delete(id);
    }
    clear() {
        for (const id of this.trackedIds) {
            this.bot.viewer?.erase(id);
        }
        this.trackedIds.clear();
    }
}
exports.PrismarineClientVisualizer = PrismarineClientVisualizer;
class NullClientVisualizer {
    drawLine(_id, _points, _color) { }
    drawBox(_id, _start, _end, _color) { }
    drawSphere(_id, _position, _radius, _color) { }
    drawPoints(_id, _points, _color, _size) { }
    drawText(_id, _position, _text, _color) { }
    erase(_id) { }
    clear() { }
}
exports.NullClientVisualizer = NullClientVisualizer;
//# sourceMappingURL=ClientVisualizer.js.map