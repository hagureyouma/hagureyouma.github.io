'use strict';
console.clear();

const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css';

const emojiGhost = 'f6e2';
const emojiCat = 'f6be';
const emojiCrow = 'f520';

const playerMoveSpeed = 600;
const playerBulletRate = 1 / 20;
const baddiesBulletRate = 1 / 0.5;
const baddiesBulletSpeed = 150;

class Game {
    constructor(width = 320, height = 480) {
        document.querySelector('head').insertAdjacentHTML('beforeend', `<link rel="stylesheet" type="text/css" href="${iconUrl}" /> `);
        this.canvas = document.createElement('canvas');
        document.querySelector('body').appendChild(this.canvas);
        this.canvas.width = width;
        this.canvas.height = height;
        this.root = new Iremono();
        this.key = {};
        this.input = {};
        this.time;
        this.delta;
        this.fpsBuffer = Array.from({ length: 60 });
    }
    init() {
        this.add(this.fpsView = new Bun(() => `FPS: ${this.fps}`, { font: 'Impact' }));
        this.fpsView.pos.x = this.canvas.width - 2;
        this.fpsView.pos.y = 2;
        this.fpsView.pos.align = 2;
    }
    start() {
        //todo:preload?
        this.init();
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
        this.delta = Math.min((now - this.time) / 1000.0, 1 / 1.0);
        this.time = now;
        this.fpsBuffer.push(this.delta);
        this.fpsBuffer.shift();
        this.root.baseUpdate();
        const ctx = this.canvas.getContext('2d');
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.root.draw(ctx);
        requestAnimationFrame(this.update.bind(this));
    }
    add(scene) {
        this.root.child.add(scene);
    }
    keybind(name, key) {
        this.key[name] = key;
        this.input[name] = false;
    }
    isOutOfRange = (x, y, width, height) => x + width < 0 || x > this.canvas.width || y + height < 0 || y > this.canvas.height;
    get fps() { return Math.floor(1 / Util.average(this.fpsBuffer)) };
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
    static average = (arr) => arr.reduce((prev, current, i, arr) => prev + current) / arr.length;

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
    draw(ctx) {
        if (!this.isExist) return;
        for (const mix of this.mixs) {
            mix.draw?.(ctx);
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
        this.align = this.valign = 0;//left top=0,center midle=1,right bottom=2
        this.vx = this.vy = 0;
        this.vxc = this.vyc = 1;
    }
    update() {
        this.x += this.vx * game.delta;
        this.y += this.vy * game.delta;
        this.vx *= this.vxc;
        this.vy *= this.vyc;
    }
    getScreenX = () => (this.x - this.align * this.width * 0.5);
    getScreenY = () => (this.y - this.valign * this.height * 0.5);
    isIntersect(other) {
        const x = this.getScreenX();
        const y = this.getScreenY();
        const ox = other.getScreenX();
        const oy = other.getScreenY();
        return ox + other.width > x && x + this.width > ox && oy + other.height > y && y + this.height > oy;
    }
}
class Child {
    constructor() {
        this.maker = {};
        this.objs = [];
        this.reserves = {};
        this.liveCount = 0;
    }
    static create = () => new Mono(new Child());
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
                this.liveCount--;
            }
            this.objs.push(obj);
        } else {
            obj = this.objs[this.reserves[name].pop()];
        }
        obj.isExist = true;
        this.maker[name].init?.(obj)
        this.liveCount++;
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
    draw(ctx) {
        for (const obj of this.objs) {
            obj.draw(ctx);
        }
    }
    each(func) {
        for (const obj of this.objs) {
            if (!obj.isExist) continue;
            func(obj);
        }
    }
}
class Jumyo {
    constructor(lifeSpan) {
        this.lifeSpan = lifeSpan;
    }
    update() {
        if (this.lifeSpan < 0) this.owner.putback();
        this.lifeSpan -= game.delta;
    }
}
class Iremono extends Mono {
    constructor() {
        super(new Child());
    }
}
class Moji {
    constructor(text, { size = 20, color = '#ffffff', font = 'FontAwesome', weight = 'normal', align = 0, valign = 0 } = {}) {
        const pos = new Pos();
        this.text = text;
        this.weight = weight;
        this.size = size;
        this.font = font;
        this.color = color;
        this.baseLine = 'top';
        this.rotate = 0;
        pos.align = align;
        pos.valign = valign;
        return [pos, this];
    }
    draw(ctx) {
        ctx.font = `${this.weight} ${this.size}px ${this.font}`;
        ctx.textBaseline = this.baseLine;
        const text = typeof this.text === 'function' ? this.text() : this.text;
        const tm = ctx.measureText(text);
        const pos = this.owner.pos;
        pos.width = tm.width;
        pos.height = Math.abs(tm.actualBoundingBoxAscent) + Math.abs(tm.actualBoundingBoxDescent);
        const x = pos.getScreenX();
        const y = pos.getScreenY();
        if (game.isOutOfRange(x, y, pos.width, pos.height)) return;
        ctx.fillStyle = this.color;
        ctx.fillText(text, x, y);
    }
}
class Bun extends Mono {
    constructor(text, { size = 20, color = '#ffffff', font = 'FontAwesome', weight = 'normal', align = 0, valign = 0 } = {}) {
        super(new Moji(text, { size, color, font, weight, align, valign }));
    }
}
class Brush {
    constructor() {
        this.color = '#ffffff';
        return [new Pos(), this];
    }
    draw(ctx) {
        const pos = this.owner.pos;
        const x = pos.getScreenX();
        const y = pos.getScreenY();
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, pos.width, pos.height);
    }
}
class Tofu extends Mono {
    constructor() {
        super(new Brush());
    }
}
class Tsubu extends Mono {
    constructor() {
        super(new Child());
        this.child.addCreator(Tofu.name, () => new Tofu(), (t) => {
            t.addMix(new Jumyo());
            t.pos.width = 8;
            t.pos.height = 8;
            t.pos.align = 1;
            t.pos.valign = 1;
            // t.brush.color = '#ffffff';
            t.update = () => {
                t.brush.color = `rgba(255, 255, 255, ${t.pos.vxc})`;
            }
        });
    }
    emittCircle(count, speed, lifeSpan, x, y, c) {
        const deg = 360 / count;
        for (let i = 0; i < count; i++) {
            const t = this.child.get(Tofu.name);
            t.pos.x = x;
            t.pos.y = y;
            t.pos.vx = Util.degToX(deg * i) * speed;
            t.pos.vy = Util.degToY(deg * i) * speed;
            t.pos.vxc = c;
            t.pos.vyc = c;
            t.jumyo.lifeSpan = lifeSpan;
        }
    }
}
export const game = new Game();
game.keybind('space', ' ');

export const con = {};
{
    class BaddieData {
        constructor(name, char, hp) {
            this.name = name;
            this.char = char;
            this.hp = hp;
        }
    }
    con.baddies = {};
    con.baddies['obake'] = new BaddieData('obake', emojiGhost, 5);
    con.baddies['crow'] = new BaddieData('crow', emojiCrow, 5);

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
}
export const data = {};
{
    data.score = 0;
}
class ScenePlay extends Mono {
    constructor() {
        super(new Fiber(), new Child());
        // this.child.add(this.text = new Bun('シューティングゲームのようなもの', { size: 25,color: '#666666', align: 1, valign: 1 }));
        // this.text.pos.x = game.canvas.width * 0.5;
        // this.text.pos.y = game.canvas.height * 0.5

        this.player = new Player();
        this.child.add(this.player.bullets);
        this.child.add(this.player);

        this.child.add(this.baddiesbullets = Baddie.createBullets());
        this.child.add(this.baddies = Baddie.createBaddies());

        this.child.add(this.effect = new Tsubu());

        this.child.add(this.textScore = new Bun(() => `SCORE ${data.score}`, { font: 'Impact' }));
        this.textScore.pos.x = 2;
        this.textScore.pos.y = 2;

        // this.child.add(this.textScore = new Bun(() => `Baddie:${this.baddies.child.liveCount} Bullets:${this.baddiesbullets.child.liveCount}`, { font: 'Impact' }));
        // this.textScore.pos.x = 2;
        // this.textScore.pos.y = 48;

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
            this.player.bullets.child.each((bullet) => {
                if (game.isOutOfRange(bullet.pos.getScreenX(), bullet.pos.getScreenY(), bullet.pos.width, bullet.pos.height)) bullet.putback();
                this.baddies.child.each((baddie) => {
                    if (!bullet.pos.isIntersect(baddie.pos)) return;
                    // console.log('ぐわぁぁぁ');
                    bullet.putback();
                    if (baddie.hit(1)) {
                        this.effect.emittCircle(8, 300, 0.5, baddie.pos.x, baddie.pos.y, 0.97)
                        baddie.putback();
                    }
                })
            });
        }
        {
            this.baddiesbullets.child.each((bullet) => {
                if (game.isOutOfRange(bullet.pos.getScreenX(), bullet.pos.getScreenY(), bullet.pos.width, bullet.pos.height)) bullet.putback();
                if (!bullet.pos.isIntersect(this.player.pos)) return;
                // console.log('ぎにゃー');
                this.effect.emittCircle(8, 300, 0.5, this.player.pos.x, this.player.pos.y, 0.97)

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
        let timeCounter = 1;
        while (true) {
            if (this.baddies.child.liveCount > 30) {
                yield undefined;
                continue;
            }
            if (timeCounter < 0) {
                timeCounter = 1;
                this.spawnBaddie(Util.random(30, game.canvas.width - 30), Util.random(30, game.canvas.height * 0.5), 'crow');
            } else {
                timeCounter -= 1 * game.delta;
            }
            yield undefined;
        }
    }
    spawnBaddie(x, y, name) {
        const bad = this.baddies.child.get(name);
        bad.pos.x = x;
        bad.pos.y = y;
        bad.bullets = this.baddiesbullets;
    }
}
class Player extends Mono {
    constructor() {
        super(new Moji(Util.parseUnicode(emojiCat), { size: 40, color: '#ffffff', align: 1, valign: 1 }));
        this.pos.x = game.canvas.width * 0.5;
        this.pos.y = game.canvas.height * 40;
        this.bulletCooltime = 0;
        this.bullets = new Iremono();
        this.bullets.child.addCreator(Tofu.name, () => new Tofu(), (bullet) => {
            bullet.pos.width = 4;
            bullet.pos.height = 4;
            bullet.pos.align = 1;
            bullet.pos.valign = 1;
            bullet.brush.color = '#ffff00';
        });
    }
    update() {
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
                let lr = -1;
                for (let i = 0; i < 2; i++) {
                    const bullet = this.bullets.child.get(Tofu.name);
                    bullet.pos.x = this.pos.x + (10 * lr);
                    bullet.pos.y = this.pos.y;
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
        super(new Moji(char, { size: 40, color: '#ffffff', align: 1, valign: 1 }))
        this.hp = 0;
        this.bullets;
        this.bulletCooltime = 0;
    }
    static createBaddies() {
        const baddies = new Iremono();
        for (const bad of Object.values(con.baddies)) {
            baddies.child.addCreator(bad.name, () => new Baddie(Util.parseUnicode(bad.char)), (baddie) => {
                baddie.hp = bad.hp;
            });
        }
        return baddies;
    }
    static createBullets() {
        const bullets = new Iremono();
        bullets.child.addCreator(Tofu.name, () => new Tofu(), (bullet) => {
            bullet.pos.width = 4;
            bullet.pos.height = 4;
            bullet.pos.align = 1;
            bullet.pos.valign = 1;
            bullet.brush.color = '#ff7777';
        });
        return bullets;
    }
    update() {
        if (this.bulletCooltime < 0) {
            this.bulletCooltime = baddiesBulletRate;
            let bullet = this.bullets.child.get(Tofu.name);
            bullet.pos.x = this.pos.x;
            bullet.pos.y = this.pos.y;
            bullet.pos.vx = 0;
            bullet.pos.vy = baddiesBulletSpeed;
            let d = Util.xyToDeg(0, baddiesBulletSpeed);
            bullet = this.bullets.child.get(Tofu.name);
            bullet.pos.x = this.pos.x;
            bullet.pos.y = this.pos.y;
            bullet.pos.vx = Util.degToX(d + 10 % 360) * baddiesBulletSpeed;
            bullet.pos.vy = Util.degToY(d + 10 % 360) * baddiesBulletSpeed;
            bullet = this.bullets.child.get(Tofu.name);
            bullet.pos.x = this.pos.x;
            bullet.pos.y = this.pos.y;
            bullet.pos.vx = Util.degToX(d - 10 % 360) * baddiesBulletSpeed;
            bullet.pos.vy = Util.degToY(d - 10 % 360) * baddiesBulletSpeed;
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