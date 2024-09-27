'use strict';
console.clear();

const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css';

const emojiGhost = 'f6e2';
const emojiCat = 'f6be';
const emojiCrow = 'f520';

const playerMoveSpeed = 600;
const playerBulletRate = 1 / 20;

class Game {
    constructor(width = 320, height = 480) {
        const link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('type', 'text/css');
        link.setAttribute('href', iconUrl);
        document.querySelector('head').appendChild(link);
        this.canvas = document.createElement('canvas');
        document.querySelector('body').appendChild(this.canvas);
        this.canvas.width = width;
        this.canvas.height = height;
        this.root = new Iremono();
        this.key = {};
        this.input = {};
        this.time;
        this.delta;
    }
    start(init) {
        //todo:preload?
        init?.();
        const _keyEvent = e => {
            e.preventDefault();
            for (const key in this.key) {
                switch (e.type) {
                    case 'keydown':
                        if (e.key === this.key[key]) this.input[key] = true;
                        break;
                    case 'keyup':
                        if (e.key === this.key[key]) this.input[key] = false;
                        break;
                }
            }
        }
        addEventListener('keydown', _keyEvent, { passive: false });
        addEventListener('keyup', _keyEvent, { passive: false });
        game.keyBind('up', 'ArrowUp');
        game.keyBind('down', 'ArrowDown');
        game.keyBind('left', 'ArrowLeft');
        game.keyBind('right', 'ArrowRight');
        this.time = performance.now();
        this._tick();
    }
    _tick() {
        const now = performance.now();
        this.delta = Math.min((now - this.time) / 1000.0, 1 / 60.0);
        this.time = now;
        this.root._tick(this.delta);
        const ctx = this.canvas.getContext('2d');
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.root.draw(this.canvas);
        requestAnimationFrame(this._tick.bind(this));
    }
    add(scene) {
        this.root.add(scene);
    }
    keyBind(name, key) {
        this.key[name] = key;
        this.input[name] = false;
    }
    isOutOfRange = (x, y, width, height) => x + width < 0 || x > this.canvas.width || y + height < 0 || y > this.canvas.height;
}
class Util {
    static get nanameCorrect() { return 0.71 };
    static parseUnicode = (code) => String.fromCharCode(parseInt(code, 16));
    static clamp = (value, min, max) => Math.min(Math.max(value, min), max);
}
class Fiber {
    constructor() {
        this.fibers = [];
        this.isRunning = false;
    }
    add(fiber) {
        this.fibers.push(fiber);
    }
    update() {
        if (this.fibers.length == 0 || this.isRunning) return;
        this.isRunning = true;
        let c = this.fibers.at(-1);
        while (c) {
            let g = c.next();
            if (!g.done) {
                if (g.value) {
                    this.add(g.value);
                } else {
                    break;
                }
                if (c === this.fibers.at(-1)) break;
            }
            if (c === this.fibers.at(-1)) this.fibers.pop();
            c = this.fibers.at(-1);
        }
        this.isRunning = false;
    }
}
function* waitForTime(time) {
    time -= game.delta;
    while (time > 0) {
        time -= game.delta;
        yield null;
    }
}
function* waitForFrag(func) {
    while (!func()) {
        yield null;
    }
}
class Base {
    constructor() {
        this.id = -1;
        this.isExist = true;
    }
}
class Pos {
    constructor() {
        this.x = this.y = 0;
        this.vx = this.vy = 0;
        this.width = this.height = 0;
        this.isCenter = this.isMiddle = true;
    }
    update() {
        this.x += this.vx * game.delta;
        this.y += this.vy * game.delta;
    }
    getScreenX = () => (this.x - (Number(this.isCenter) * this.width * 0.5));
    getScreenY = () => (this.y - (Number(this.isMiddle) * this.height * 0.5));
}
class Iremono {
    constructor() {
        this.base = new Base();
        this.maker = {};
        this.objs = [];
        this.reserves = {};
    }
    addCreator(name, func, init = undefined) {
        this.maker[name] = { func, init };
    }
    put(obj) {
        if (obj.base.id < 0) return;
        obj.base.isExist = false;
        this.reserves[obj.constructor.name].push(obj.base.id);
        console.log(`${obj.constructor.name},${obj.base.id}`);
    }
    get(name) {
        let obj;
        if (!(name in this.reserves)) this.reserves[name] = [];
        if (this.reserves[name].length === 0) {
            obj = this.maker[name].func();
            obj.base.id = this.objs.length;
            this.objs.push(obj);
        } else {
            obj = this.objs[this.reserves[name].pop()];
        }
        obj.base.isExist = true;
        this.maker[name].init?.(obj)
        return obj;
    }
    add(obj) {
        this.objs.push(obj);
    }
    _tick() {
        this.update();
        for (const obj of this.objs) {
            if (!obj.base.isExist) continue;
            obj._tick();
        }
        this.postUpdate();
    }
    draw() {
        for (const obj of this.objs) {
            if (!obj.base.isExist) continue;
            obj.draw();
        }
    }
    update() { }
    postUpdate() { }
}
class Moji {
    constructor(text = '', { size = 20, color = '#ffffff', font = 'FontAwesome', weight = 'normal', isCenter = false, isMiddle = false } = {}) {
        this.base = new Base();
        this.pos = new Pos();
        this.text = text;
        this.size = size;
        this.color = color;
        this.font = font;
        this.weight = weight;
        this.pos.isCenter = isCenter;
        this.pos.isMiddle = isMiddle;
        this.baseLine = 'top';
        this.rotate = 0;
    }
    _tick() {
        this.pos.update();
        this.update();
    }
    draw() {
        const ctx = game.canvas.getContext('2d');
        ctx.font = `${this.weight} ${this.size}px ${this.font}`;
        ctx.textBaseline = this.baseLine;
        const tm = ctx.measureText(this.text);
        this.pos.width = tm.width;
        this.pos.height = Math.abs(tm.actualBoundingBoxAscent) + Math.abs(tm.actualBoundingBoxDescent);
        const x = this.pos.getScreenX();
        const y = this.pos.getScreenY();
        if (game.isOutOfRange(x, y, this.pos.width, this.pos.height)) return;
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, x, y);
    }
    update(){}
}
class Tofu {
    constructor() {
        this.base = new Base();
        this.pos = new Pos();
        this.color = '#ffffff';
    }
    _tick() {
        this.pos.update();
    }
    draw() {
        const x = this.pos.getScreenX();
        const y = this.pos.getScreenY();
        if (game.isOutOfRange(x, y, this.pos.width, this.pos.height)) return;
        const ctx = game.canvas.getContext('2d');
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, this.pos.width, this.pos.height);
    }
}
export const game = new Game();
game.keyBind('space', ' ');

export const data = {};
data.score = 0;

class SpawnData {
    constructor(time, x, y, name) {
        this.time = time;
        this.x = x;
        this.y = y;
        this.name = name;
    }
}
const stage1 = [];
stage1.push(new SpawnData(2, 50, 50, 'obake'));
stage1.push(new SpawnData(2, 100, 50, 'obake'));
stage1.push(new SpawnData(3, 150, 50, 'obake'));
stage1.push(new SpawnData(4, 200, 50, 'obake'));


class ScenePlay extends Iremono {
    constructor() {
        super();
        this.text = new Moji('シューティングゲームだよ', { size: 25, color: '#666666', isCenter: true, isMiddle: true });
        this.text.pos.x = game.canvas.width * 0.5;
        this.text.pos.y = game.canvas.height * 0.5;
        this.add(this.text);
        this.player = new Player();
        this.add(this.player);
        this.add(this.player.bullets);
        this.baddies = new Baddies();
        this.add(this.baddies);
        this.add(this.baddies.bullets);
        this.fiber = new Fiber();
        this.stage;
        this.stageStart(stage1);
    }
    update = () => {
        this.fiber.update();
        this.player.preUpdate();
    }
    postUpdate = () => {
        {
            const halfX = this.player.pos.width * 0.5;
            const halfY = this.player.pos.height * 0.5;
            this.player.pos.x = Util.clamp(halfX, this.player.pos.x, game.canvas.width - halfX);
            this.player.pos.y = Util.clamp(halfY, this.player.pos.y, game.canvas.height - halfY);
        }
        {
            for (const obj of this.player.bullets.objs) {
                if (!obj.base.isExist) continue;
                if (game.isOutOfRange(obj.pos.getScreenX(), obj.pos.getScreenY(), obj.pos.width, obj.pos.height)) this.player.bullets.put(obj);
            }
        }
    }
    stageStart(stage) {
        this.stage = stage;
        this.fiber.add(this.stageRunner(stage));
    }
    *stageRunner(stage) {
        const temp = [...stage].sort((a, b) => a.time < b.time);
        let timeCounter = 0;
        for (const d of temp) {
            while (d.time > timeCounter) {
                timeCounter += game.delta;
                yield undefined;
            }
            this.baddies.spawn(d.x, d.y, d.name);
        }
    }
}
class Player extends Moji {
    constructor() {
        super(Util.parseUnicode(emojiCat), { size: 40, color: '#de858c', isCenter: true, isMiddle: true });
        this.pos.x = game.canvas.width * 0.5;
        this.pos.y = game.canvas.height * 0.5;
        this.bulletCooltime = 0;
        this.bullets = new Iremono();
        this.bullets.addCreator(Tofu.name, () => new Tofu());
    }
    preUpdate() {
        this.pos.vx = 0;
        this.pos.vy = 0;
        if (game.input.left) {
            this.pos.vx = -playerMoveSpeed;
        }
        if (game.input.right) {
            this.pos.vx = playerMoveSpeed;
        }
        if (game.input.up) {
            this.pos.vy = -playerMoveSpeed;
        }
        if (game.input.down) {
            this.pos.vy = playerMoveSpeed;
        }
        if (this.pos.vx !== 0 && this.pos.vy !== 0) {
            this.pos.vx *= Util.nanameCorrect;
            this.pos.vy *= Util.nanameCorrect;
        }
        if (game.input.space) {
            if (this.bulletCooltime < 0) {
                this.bulletCooltime = playerBulletRate;
                const bullet = this.bullets.get(Tofu.name);
                bullet.pos.width = 4;
                bullet.pos.height = 4;
                bullet.color = '#ffffff';
                bullet.pos.x = this.pos.x;
                bullet.pos.y = this.pos.y;
                bullet.pos.vy = -400;
            } else {
                this.bulletCooltime -= 1 * game.delta;
            }
        }
    }
}
class Baddies extends Iremono {
    constructor() {
        super();
        this.addCreator('obake', () => new Baddie(), (bad) => {
            bad.text = Util.parseUnicode(emojiGhost);
        });
        this.addCreator('crow', () => new Baddie(), (bad) => {
            bad.text = Util.parseUnicode(emojiCrow);
        });
        this.bullets = new Iremono();
        this.bullets.addCreator(Tofu.name, () => new Tofu());
    }
    spawn(x, y, name) {
        const bad = this.get(name);
        bad.pos.x = x;
        bad.pos.y = y;
    }
}
class Baddie extends Moji {
    constructor() {
        super('', { size: 40, color: '#999999', isCenter: true, isMiddle: true });
        this.bulletCooltime = 0;
    }
}
game.add(new ScenePlay());
game.start();