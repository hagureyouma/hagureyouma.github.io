'use strict';
console.clear();

const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css';

const emojiGhost = 'f6e2';
const emojiCat = 'f6be';
const emojiCrow = 'f520';

const playerMoveSpeed = 600;
const playerBulletRate = 1 / 20;
const baddiesBulletRate = 1 / 2;

class Game {
    constructor(width = 640, height = 480) {
        document.querySelector('head').insertAdjacentHTML('beforeend', `<link rel="stylesheet" type="text/css" href="${iconUrl}" /> `);
        this.canvas = document.createElement('canvas');
        document.querySelector('body').appendChild(this.canvas);
        this.canvas.width = width;
        this.canvas.height = height;
        this.root = Hako.create();
        this.key = {};
        this.input = {};
        this.time;
        this.delta;
        this.fps;
        this.fpsBuffer = [];
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
        game.keybind('up', 'ArrowUp');
        game.keybind('down', 'ArrowDown');
        game.keybind('left', 'ArrowLeft');
        game.keybind('right', 'ArrowRight');
        this.time = performance.now();
        this.update();
    }
    update() {
        const now = performance.now();
        this.delta = Math.min((now - this.time) / 1000.0, 1 / 60.0);
        this.time = now;
        this.root.baseUpdate();
        const ctx = this.canvas.getContext('2d');
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.root.draw();
        requestAnimationFrame(this.update.bind(this));
    }
    add(scene) {
        this.root.hako.add(scene);
    }
    keybind(name, key) {
        this.key[name] = key;
        this.input[name] = false;
    }
    isOutOfRange = (x, y, width, height) => x + width < 0 || x > this.canvas.width || y + height < 0 || y > this.canvas.height;
}
class Queue {
    constructor() {
        this.buf = new Array(16);
        this.head = 0;
        this.last = 0;
    }
    enqueue(value) {
if(this.last===this.buf.length-1){
    if((this.last-this.head)>this.buf.length-1){

    }
}
        this.push.push(value);
        last++;
    }
    dequeue() {
        const obj = this.buf[head];
        this.buf[head] = undefined;
        if (this.head === this.last) {
            this.head = this.last = 0;
        } else {
            this.head++;
        }
        return obj;
    }
}
class Util {
    static get nanameCorrect() { return 0.71 };
    static get radian() { return Math.PI / 180 };
    static get degree() { return 180 / Math.PI };
    static parseUnicode = (code) => String.fromCharCode(parseInt(code, 16));
    static clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    static degToX = (deg) => Math.cos(deg * Util.radian);
    static degToY = (deg) => -Math.sin(deg * Util.radian);
    static xyToDeg(x, y) {
        var r = Math.atan2(-y, x);
        if (r < 0) r += 2 * Math.PI;
        return r * Util.degree;
    }
    static random = (min, max) => Math.floor(Math.random() * (max + 1 - min) + min);
}
class Mono {
    constructor(...args) {
        this.isExist = true;
        this.mixs = [];
        for (const arg of args) {
            if (Array.isArray(arg)) {
                for (const mix of arg) {
                    this.addMix(mix);
                }
            } else {
                this.addMix(arg);
            }
        }
    }
    addMix(mix) {
        const name = mix.constructor.name.toLowerCase();
        if (name in this) return;
        this[name] = mix;
        mix.owner = this;
        this.mixs.push(mix);
        return this;
    }
    baseUpdate() {
        if (!this.isExist) return;
        this.update();
        for (const mix of this.mixs) {
            mix.update?.();
        }
        this.postUpdate();
    }
    update() { }
    postUpdate() { }
    draw() {
        if (!this.isExist) return;
        for (const mix of this.mixs) {
            mix.draw?.();
        }
    }
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
                if (!g.value) break;
                this.add(g.value);
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
class Pos {
    constructor() {
        this.x = this.y = 0;
        this.width = this.height = 0;
        this.isCenter = this.isMiddle = false;
        this.vx = this.vy = 0;
    }
    update() {
        this.x += this.vx * game.delta;
        this.y += this.vy * game.delta;
    }
    getScreenX = () => (this.x - (Number(this.isCenter) * this.width * 0.5));
    getScreenY = () => (this.y - (Number(this.isMiddle) * this.height * 0.5));
    isIntersect(other) {
        const x = this.getScreenX();
        const y = this.getScreenY();
        const ox = other.getScreenX();
        const oy = other.getScreenY();
        return ox + other.width > x && x + this.width > ox && oy + other.height > y && y + this.height > oy;
    }
}
class Hako {
    constructor() {
        this.maker = {};
        this.objs = [];
        this.reserves = {};
    }
    static create = () => new Mono(new Hako());
    addCreator(name, func, init = undefined) {
        this.maker[name] = { func, init };
    }
    get(name) {
        let obj;
        if (name in this.reserves === false) this.reserves[name] = [];
        if (this.reserves[name].length === 0) {
            obj = this.maker[name].func();
            obj.id = this.objs.length;
            obj.putback = () => {
                obj.isExist = false;
                this.reserves[name].push(obj.id);
            }
            this.objs.push(obj);
        } else {
            obj = this.objs[this.reserves[name].pop()];
        }
        obj.isExist = true;
        this.maker[name].init?.(obj)
        return obj;
    }
    add(obj) {
        this.objs.push(obj);
    }
    update() {
        for (const obj of this.objs) {
            obj.baseUpdate();
        }
    }
    draw() {
        for (const obj of this.objs) {
            obj.draw();
        }
    }
    each(func) {
        for (const obj of this.objs) {
            if (!obj.isExist) continue;
            func(obj);
        }
    }
}
class Iremono extends Mono {
    constructor() {
        super(new Hako());
    }
}
class Moji {
    constructor(text, { size = 20, color = '#ffffff', font = 'FontAwesome', weight = 'normal', isCenter = false, isMiddle = false } = {}) {
        const pos = new Pos();
        this.text = text;
        this.size = size;
        this.color = color;
        this.font = font;
        this.weight = weight;
        this.baseLine = 'top';
        this.rotate = 0;
        this.watch;
        pos.isCenter = isCenter;
        pos.isMiddle = isMiddle;
        return [pos, this];
    }
    update() {
        if (this.watch) {
            this.text = this.watch();
        }
    }
    draw() {
        const ctx = game.canvas.getContext('2d');
        ctx.font = `${this.weight} ${this.size}px ${this.font}`;
        ctx.textBaseline = this.baseLine;
        const tm = ctx.measureText(this.text);
        const pos = this.owner.pos;
        pos.width = tm.width;
        pos.height = Math.abs(tm.actualBoundingBoxAscent) + Math.abs(tm.actualBoundingBoxDescent);
        const x = pos.getScreenX();
        const y = pos.getScreenY();
        if (game.isOutOfRange(x, y, pos.width, pos.height)) return;
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, x, y);
    }
}
class Bun extends Mono {
    constructor(text, { size = 20, color = '#ffffff', font = 'FontAwesome', weight = 'normal', isCenter = false, isMiddle = false } = {}) {
        super(new Moji(text, { size, color, font, weight, isCenter, isMiddle }));
    }
}
class Brush {
    constructor() {
        this.color = '#ffffff';
        return [new Pos(), this];
    }
    draw() {
        const pos = this.owner.pos;
        const x = pos.getScreenX();
        const y = pos.getScreenY();
        if (game.isOutOfRange(x, y, pos.width, pos.height)) return;
        const ctx = game.canvas.getContext('2d');
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, pos.width, pos.height);
    }
}
class Tofu extends Mono {
    constructor() {
        super(new Brush());
    }
}
export const game = new Game();
game.keybind('space', ' ');

export const con = {};

class BaddieData {
    constructor(name, char, hp) {
        this.name = name;
        this.char = char;
        this.hp = hp;
    }
}
con.baddies = {};
con.baddies['obake'] = new BaddieData('obake', emojiGhost, 10);

class SpawnData {
    constructor(time, x, y, name) {
        this.time = time;
        this.x = x;
        this.y = y;
        this.name = name;
    }
}
con.stages = [];
const stage1 = [];
con.stages.push(stage1);
stage1.push(new SpawnData(2, 160, 50, 'obake'));
// stage1.push(new SpawnData(2, 100, 50, 'obake'));
// stage1.push(new SpawnData(3, 150, 50, 'obake'));
// stage1.push(new SpawnData(4, 200, 50, 'obake'));

export const data = {};
data.score = 0;

class ScenePlay extends Mono {
    constructor() {
        super(new Fiber(), new Hako());
        this.hako.add(this.text = new Bun('シューティングゲームだよ', { size: 25, color: '#666666', isCenter: true, isMiddle: true }));
        this.text.pos.x = game.canvas.width * 0.5;
        this.text.pos.y = game.canvas.height * 0.5

        this.player = new Player();
        this.hako.add(this.player.bullets);
        this.hako.add(this.player);

        this.hako.add(this.baddiesbullets = Baddie.createBullets());
        this.hako.add(this.baddies = Baddie.createBaddies());

        this.hako.add(this.textScore = new Bun('', { font: 'Impact' }));
        this.textScore.moji.watch = () => `SCORE ${data.score}`;
        this.textScore.pos.x = 2;
        this.textScore.pos.y = 2;

        // this.fiber.add(this.stageRunner(con.stages[0]));
        this.fiber.add(this.stageRunner2());
    }
    postUpdate() {
        {
            const halfX = this.player.pos.width * 0.5;
            const halfY = this.player.pos.height * 0.5;
            this.player.pos.x = Util.clamp(halfX, this.player.pos.x, game.canvas.width - halfX);
            this.player.pos.y = Util.clamp(halfY, this.player.pos.y, game.canvas.height - halfY);
        }
        {
            this.player.bullets.hako.each((bullet) => {
                if (game.isOutOfRange(bullet.pos.getScreenX(), bullet.pos.getScreenY(), bullet.pos.width, bullet.pos.height)) bullet.putback();
                this.baddies.hako.each((baddie) => {
                    if (!bullet.pos.isIntersect(baddie.pos)) return;
                    console.log('ぐわぁぁぁ');
                    bullet.putback();
                    if (baddie.hit(1)) baddie.putback();
                })
            });
        }
        {
            this.baddiesbullets.hako.each((bullet) => {
                if (game.isOutOfRange(bullet.pos.getScreenX(), bullet.pos.getScreenY(), bullet.pos.width, bullet.pos.height)) bullet.putback();
                if (!bullet.pos.isIntersect(this.player.pos)) return;
                console.log('ぎにゃー');
                bullet.putback();
            })
        }
    }
    *stageRunner(stage) {
        const temp = [...stage].sort((a, b) => a.time < b.time);
        let timeCounter = 0;
        for (const d of temp) {
            while (d.time > timeCounter) {
                timeCounter += game.delta;
                yield undefined;
            }
            this.spawnBaddie(d.x, d.y, d.name);
        }
    }
    *stageRunner2() {
        let timeCounter = 0;
        while (data.score < 100000) {
            if (this.baddies.hako.objs.length > 100) {
                yield undefined;
                continue;
            }
            if (timeCounter < 0) {
                timeCounter = 0;
                this.spawnBaddie(Util.random(30, game.canvas.width - 30), Util.random(30, game.canvas.height * 0.5), 'obake');
            } else {
                timeCounter -= 1 * game.delta;
            }
            yield undefined;
        }
    }
    spawnBaddie(x, y, name) {
        const bad = this.baddies.hako.get(name);
        bad.pos.x = x;
        bad.pos.y = y;
        bad.bullets = this.baddiesbullets;
    }
}
class Player extends Mono {
    constructor() {
        super(new Moji(Util.parseUnicode(emojiCat), { size: 40, color: '#de858c', isCenter: true, isMiddle: true }));
        this.pos.x = game.canvas.width * 0.5;
        this.pos.y = game.canvas.height * 0.5;
        this.bulletCooltime = 0;
        this.bullets = new Iremono();
        this.bullets.hako.addCreator(Tofu.name, () => new Tofu(), (bullet) => {
            bullet.pos.width = 4;
            bullet.pos.height = 4;
            bullet.pos.isCenter = true;
            bullet.pos.isMiddle = true;
            bullet.brush.color = '#9999ff';
        });
    }
    update() {
        const pos = this.pos;
        pos.vx = 0;
        pos.vy = 0;
        if (game.input.left) {
            pos.vx = -playerMoveSpeed;
        }
        if (game.input.right) {
            pos.vx = playerMoveSpeed;
        }
        if (game.input.up) {
            pos.vy = -playerMoveSpeed;
        }
        if (game.input.down) {
            pos.vy = playerMoveSpeed;
        }
        if (pos.vx !== 0 && pos.vy !== 0) {
            pos.vx *= Util.nanameCorrect;
            pos.vy *= Util.nanameCorrect;
        }
        if (game.input.space) {
            if (this.bulletCooltime < 0) {
                this.bulletCooltime = playerBulletRate;
                let lr = -1;
                for (let i = 0; i < 2; i++) {
                    const bullet = this.bullets.hako.get(Tofu.name);
                    bullet.pos.x = pos.x + (10 * lr);
                    bullet.pos.y = pos.y;
                    bullet.pos.vy = -400;
                    lr *= -1;
                }
            } else {
                this.bulletCooltime -= 1 * game.delta;
            }
        }
    }
}
class Baddie extends Mono {
    constructor(char) {
        super(new Moji(char, { size: 40, color: '#999999', isCenter: true, isMiddle: true }))
        this.hp = 0;
        this.bullets;
        this.bulletCooltime = 0;
    }
    static createBaddies() {
        const baddies = new Iremono();
        for (const bad of Object.values(con.baddies)) {
            baddies.hako.addCreator(bad.name, () => new Baddie(Util.parseUnicode(bad.char)), (baddie) => {
                baddie.hp = bad.hp;
            });
        }
        return baddies;
    }
    static createBullets() {
        const bullets = new Iremono();
        bullets.hako.addCreator(Tofu.name, () => new Tofu(), (bullet) => {
            bullet.pos.width = 4;
            bullet.pos.height = 4;
            bullet.pos.isCenter = true;
            bullet.pos.isMiddle = true;
            bullet.brush.color = '#ff9999';
        });
        return bullets;
    }
    update() {
        if (this.bulletCooltime < 0) {
            this.bulletCooltime = baddiesBulletRate;
            let bullet = this.bullets.hako.get(Tofu.name);
            bullet.pos.x = this.pos.x;
            bullet.pos.y = this.pos.y;
            bullet.pos.vx = 0;
            bullet.pos.vy = 200;
            let d = Util.xyToDeg(0, 200);
            bullet = this.bullets.hako.get(Tofu.name);
            bullet.pos.x = this.pos.x;
            bullet.pos.y = this.pos.y;
            bullet.pos.vx = Util.degToX(d + 10 % 360) * 200;
            bullet.pos.vy = Util.degToY(d + 10 % 360) * 200;
            bullet = this.bullets.hako.get(Tofu.name);
            bullet.pos.x = this.pos.x;
            bullet.pos.y = this.pos.y;
            bullet.pos.vx = Util.degToX(d - 10 % 360) * 200;
            bullet.pos.vy = Util.degToY(d - 10 % 360) * 200;
        } else {
            this.bulletCooltime -= 1 * game.delta;
        }
    }
    hit(damage) {
        this.hp -= damage;
        data.score += 100;
        return this.hp <= 0;
    }
}
game.add(new ScenePlay());
game.start();