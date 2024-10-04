'use strict';
console.clear();

const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css';
// const fontUrl='https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c&display=swap';
const fontUrl = 'https://fonts.googleapis.com/css2?family=Kaisei+Decol&display=swap';

window.addEventListener("gamepadconnected", (e) => {
    const gp = navigator.getGamepads()[e.gamepad.index];
    console.log(
        "Gamepad connected at index %d: %s. %d buttons, %d axes.",
        gp.index,
        gp.id,
        gp.buttons.length,
        gp.axes.length,
    );
});

const colorPumpkin = '#F89537';

const emojiGhost = 'f6e2';
const emojiCat = 'f6be';
const emojiCrow = 'f520';
const emojiHouse = 'e00d';
const emojiTree = 'f1bb';

const layerName = ['bg', 'main', 'effect', 'ui'];

export let text = {
    title: 'シューティングゲーム', title2: 'かもしれないなにか', pressanykey: 'Xキーを押してね',
    start: 'スタート', highscore: 'ハイスコア', credit: 'クレジット',
    pause: 'ポーズ', resume: 'ゲームを続ける', restart: '最初からやり直す', returntitle: 'タイトルに戻る',
    gameover: 'ゲームオーバー', continue: 'コンティニュー'
}
const keyRepeatFirstWait = 0.25;
const keyRepeatWait = 0.125;

const playerMoveSpeed = 600;
const playerBulletRate = 1 / 20;
const baddiesBulletRate = 1 / 0.5;
const baddiesBulletSpeed = 150;

class Game {
    constructor(width = 320, height = 480) {
        document.querySelector('head').insertAdjacentHTML('beforeend', `<link rel="stylesheet" type="text/css" href="${iconUrl}" /> `);
        document.querySelector('head').insertAdjacentHTML('beforeend', `<link rel="stylesheet" type="text/css" href="${fontUrl}" /> `);
        this.width = width;
        this.height = height;
        this.layers = {};
        for (const layer of layerName) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.style.position = 'absolute';
            document.querySelector('body').appendChild(this.layers[layer] = canvas);
        }
        const bg = this.layers['bg'].getContext('2d');
        bg.fillStyle = '#000000';
        bg.fillRect(0, 0, this.width, this.height);
        this.blur = document.createElement('canvas');
        this.blur.width = width;
        this.blur.height = height;
        this.isPauseBlur = false;
        this.root = new Mono(new Generator(), new Child());
        this.input = new Input();
        this.time;
        this.delta;
        this.fpsBuffer = Array.from({ length: 60 });
    }
    create() { }
    start() {
        //todo:preload?
        this.input.init();
        this.create();
        this.time = performance.now();
        this.mainloop();
    }
    mainloop() {
        const now = performance.now();
        this.delta = Math.min((now - this.time) / 1000.0, 1 / 1.0);
        this.time = now;
        this.fpsBuffer.push(this.delta);
        this.fpsBuffer.shift();
        this.input.update();
        this.root.baseUpdate();
        const layers = Object.values(this.layers).slice(1);
        for (const layer of layers) {
            layer.getContext('2d').clearRect(0, 0, this.width, this.height);
        }
        const ctx = this.layers['effect'].getContext('2d');
        //ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(this.blur, 0, 0);
        //ctx.globalCompositeOperation = 'source-over';
        this.root.baseDraw(this.layers['main'].getContext('2d'));
        if (!this.isPauseBlur) {
            const blurCtx = this.blur.getContext('2d');
            blurCtx.clearRect(0, 0, this.width, this.height);
            blurCtx.globalAlpha = 0.6;
            blurCtx.drawImage(this.layers['effect'], 0, 0);
        }
        requestAnimationFrame(this.mainloop.bind(this));
    }
    pushScene = scene => this.root.child.add(scene);
    popScene = () => this.root.child.pop();
    setState = state => this.root.generator.run(state);
    isOutOfRange = (x, y, width, height) => x + width < 0 || x > this.width || y + height < 0 || y > this.height;
    get fps() { return Math.floor(1 / Util.average(this.fpsBuffer)) };
}
class Input {
    constructor() {
        this.nameIndex = new Map();
        this.keyIndex = new Map();
        this.keyData = [];
        this.padIndex;
    }
    init() {
        addEventListener('keydown', this._keyEvent(true));
        addEventListener('keyup', this._keyEvent(false));
        addEventListener('gamepadconnected', e => this.padIndex = e.gamepad.index);
        addEventListener('gamepadconnected', e => this.padIndex = undefined);
        game.input.keybind('left', 'ArrowLeft', { button: 14, axes: 0 });
        game.input.keybind('right', 'ArrowRight', { button: 15, axes: 1 });
        game.input.keybind('up', 'ArrowUp', { button: 12, axes: 2 });
        game.input.keybind('down', 'ArrowDown', { button: 13, axes: 3 });
    }
    _keyEvent(frag) {
        return e => {
            e.preventDefault();
            const i = this.keyIndex.get(e.key);
            if (i === undefined) return;
            this.keyData[i].buffer = frag;
        }
    }
    update() {
        for (let i = 0; i < this.keyData.length; i++) {
            this.keyData[i].before = this.keyData[i].current;
            this.keyData[i].current = this.keyData[i].buffer;
        }
        if (this.padIndex !== undefined) {
            const pad = navigator.getGamepads()[this.padIndex];
            for (const key of this.keyData) {
                if (key.button > -1) key.current |= pad.buttons[key.button].pressed;
                if (key.axes > -1) {
                    const index = Math.floor(key.axes / 2);
                    if (Util.isEven(key.axes)) {
                        key.current |= pad.axes[index] < -0.5;
                    } else {
                        key.current |= pad.axes[index] > 0.5;
                    }
                }
            }
            // for (let i = 0; i < pad.buttons.length; i++) {
            //     if(!pad.buttons[i].pressed)continue;
            //     console.log(`${i}`);
            // }
        }
    }
    keybind(name, key, { button = -1, axes = -1 } = {}) {
        const index = this.nameIndex.size;
        this.nameIndex.set(name, index);
        this.keyIndex.set(key, index);
        this.keyData.push({ buffer: false, before: false, current: false, button: button, axes: axes });
    }
    IsDown = (name) => this.keyData[this.nameIndex.get(name)].current;
    IsPress = (name) => this.keyData[this.nameIndex.get(name)].current && !this.keyData[this.nameIndex.get(name)].before;
    IsUp = (name) => !this.keyData[this.nameIndex.get(name)].current && this.keyData[this.nameIndex.get(name)].before;
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
    static isGenerator = (obj) => obj && typeof obj.next === 'function' && typeof obj.throw === 'function';
    static isEven = (n) => n % 2 === 0;
}
class Mono {
    constructor(...args) {
        this.id = -1;
        this.putback;
        this.isExist = true;
        this.isActive = true;
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
        mix.owner = this;
        this[name] = mix;
        this.mixs.push(mix);
        return this;
    }
    baseUpdate() {
        if (!this.isExist || !this.isActive) return;
        this.update();
        for (const mix of this.mixs) {
            mix.update?.();
        }
        this.postUpdate();
    }
    update() { }
    postUpdate() { }
    baseDraw(ctx) {
        if (!this.isExist) return;
        this.draw(ctx);
        for (const mix of this.mixs) {
            mix.draw?.(ctx);
        }
    }
    draw() { };
}
class Generator {
    constructor() {
        this.state;
    }
    run = state => this.state = state;
    update() {
        if (!this.state) return;
        this.state?.next();
    }
}
function* waitForTime(time) {
    time -= game.delta;
    while (time > 0) {
        time -= game.delta;
        yield undefined;
    }
}
function* waitForFrag(func) {
    while (!func()) {
        yield undefined;
    }
}
function* waitForTimeOrFrag(time, func) {
    time -= game.delta;
    while (time > 0 && !func()) {
        time -= game.delta;
        yield undefined;
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
    getScreenX = () => Math.floor(this.x - this.align * this.width * 0.5);
    getScreenY = () => Math.floor(this.y - this.valign * this.height * 0.5);
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
        this.drawlayer = '';
    }
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
    add = (obj) => this.objs.push(obj);
    pop = () => this.objs.pop();
    putbackAll() {
        for (const obj of this.objs) {
            if (!obj.isExist && obj.id < 0) continue;
            obj.putback();
        }
    }
    update() {
        for (const obj of this.objs) {
            obj.baseUpdate();
        }
    }
    draw(ctx) {
        let currentCtx = this.drawlayer !== '' ? game.layers[this.drawlayer].getContext('2d') : ctx;
        for (const obj of this.objs) {
            obj.baseDraw(currentCtx);
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
        this.lifeStage = 0;
    }
    update() {
        if (this.lifeStage < this.lifeSpan) {
            this.lifeStage = Math.min(this.lifeStage + game.delta, this.lifeSpan);
            return;
        }
        this.owner.putback();
    }
    get percentage() { return this.lifeStage / this.lifeSpan };
}
class Iremono extends Mono {
    constructor() {
        super(new Child());
    }
}
class Moji {
    constructor(text, x, y, { size = 20, color = '#ffffff', font = 'FontAwesome', weight = 'normal', align = 0, valign = 0 } = {}) {
        const pos = new Pos();
        this.text = text;
        this.weight = weight;
        this.size = size;
        this.font = font;
        this.color = color;
        this.baseLine = 'top';
        this.rotate = 0;
        pos.x = x;
        pos.y = y;
        pos.height = size;
        pos.align = align;
        pos.valign = valign;
        return [pos, this];
    }
    get _getText() { return typeof this.text === 'function' ? this.text() : this.text };
    getWidth = (ctx) => this._getWidth(ctx, this._getText);
    _getWidth(ctx, text) {
        ctx.font = `${this.weight} ${this.size}px '${this.font}'`;
        ctx.textBaseline = this.baseLine;
        const tm = ctx.measureText(text);
        return tm.width;
    }
    draw(ctx) {
        const text = this._getText;
        const pos = this.owner.pos;
        pos.width = this._getWidth(ctx, text);
        //pos.height = Math.abs(tm.actualBoundingBoxAscent) + Math.abs(tm.actualBoundingBoxDescent);
        const x = pos.getScreenX();
        const y = pos.getScreenY();
        ctx.fillStyle = this.color;
        ctx.fillText(text, x, y);
    }
}
class Bun extends Mono {
    constructor(text, x, y, { size = 20, color = '#ffffff', font = 'FontAwesome', weight = 'normal', align = 0, valign = 0 } = {}) {
        super(new Moji(text, x, y, { size, color, font, weight, align, valign }));
    }
}
class Brush {
    constructor() {
        this.color = '#ffffff';
        this.alpha = 255;
        return [new Pos(), this];
    }
    draw(ctx) {
        const pos = this.owner.pos;
        const x = pos.getScreenX();
        const y = pos.getScreenY();
        ctx.fillStyle = `${this.color}${this.alpha.toString(16).padStart(2, '0')}`;
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
        this.child.addCreator(Tsubu.name, () => {
            const t = new Tofu();
            t.addMix(new Jumyo());
            t.update = () => t.brush.alpha = Math.floor(255 - (t.jumyo.percentage * 255));
            return t;
        }, (t) => {
            t.pos.width = 8;
            t.pos.height = 8;
            t.pos.align = 1;
            t.pos.valign = 1;
            t.jumyo.lifeStage = 0;
        });
    }
    emittCircle(count, speed, lifeSpan, color, x, y, c) {
        const deg = 360 / count;
        for (let i = 0; i < count; i++) {
            const t = this.child.get(Tsubu.name);
            t.brush.color = color;
            t.brush.alpha = 255;
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
class Menu extends Mono {
    constructor(x, y, size, align = 1) {
        super(new Pos(), new Child());
        this.pos.x = x;
        this.pos.y = y;
        this.pos.align = align;
        this.size = size;
        this.index = 0;
        this.color = '#ffffff';
        this.highlite = '#EDD425';
        this.isEnableCancel = true;
        this.child.add(this.curL = new Bun(Util.parseUnicode(emojiCat), 0, 0, { size: this.size, color: this.highlite, align: 2, valign: 1 }));
        this.child.add(this.curR = new Bun(Util.parseUnicode(emojiCat), 0, 0, { size: this.size, color: this.highlite, valign: 1 }));
        this.indexOffset = this.child.objs.length;
    }
    add(text) {
        this.child.add(new Bun(text, this.pos.x, this.pos.y + this.size * 1.5 * (this.child.objs.length - 2), { size: this.size, color: this.color, font: 'Kaisei Decol', align: this.pos.align, valign: 1 }))
    }
    *stateSelect(newIndex = this.index) {
        const length = this.child.objs.length - this.indexOffset;
        this.move(newIndex);
        while (true) {
            yield undefined;
            if (game.input.IsDown('up')) {
                this.move((this.index + (length - 1)) % length);
                let wait = keyRepeatWait
                if (game.input.IsPress('up')) wait = keyRepeatFirstWait;
                yield* waitForTimeOrFrag(wait, () => game.input.IsUp('up'));
                continue;
            }
            if (game.input.IsDown('down')) {
                this.move((this.index + 1) % length);
                let wait = keyRepeatWait
                if (game.input.IsPress('down')) wait = keyRepeatFirstWait;
                yield* waitForTimeOrFrag(wait, () => game.input.IsUp('down'));
                continue;
            }
            if (game.input.IsPress('z')) {
                return;
            }
            if (this.isEnableCancel && game.input.IsPress('x')) {
                this.index = -1;
                return;
            }
        }
    }
    move(newIndex) {
        this.child.objs[this.index + this.indexOffset].moji.color = this.color;
        this.index = newIndex;
        const item = this.child.objs[newIndex + this.indexOffset];
        item.moji.color = this.highlite;
        const w = item.moji.getWidth(game.layers['main'].getContext('2d'));
        const x = (w * 0.5) * this.pos.align;
        this.curL.pos.x = item.pos.x - x;
        this.curL.pos.y = item.pos.y;
        this.curR.pos.x = item.pos.x - x + w;
        this.curR.pos.y = item.pos.y;
    }
    current = () => this.index === -1 ? Menu.cancel : this.child.objs[this.index + this.indexOffset].moji.text;
    static get cancel() { return 'cancel' };
}
class Scene {
    constructor() {
        this.result = -1;
        return [new Child(), this];
    }
}
export const game = new Game();
game.create = () => {
    game.input.keybind('z', 'z', { button: 1 });
    game.input.keybind('x', 'x', { button: 0 });

    const ctx = game.layers['bg'].getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, game.height);
    grad.addColorStop(0, "#611180");
    grad.addColorStop(1, "#253FB0");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, game.width, game.height);
};
export const gameData = {};
{
    class BaddieData {
        constructor(name, char, hp, point) {
            this.name = name;
            this.char = char;
            this.hp = hp;
            this.point = point;
        }
    }
    gameData.baddies = {};
    gameData.baddies['obake'] = new BaddieData('obake', emojiGhost, 5, 200);
    gameData.baddies['crow'] = new BaddieData('crow', emojiCrow, 5, 100);

    class SpawnData {
        constructor(time, x, y, name) {
            this.time = time;
            this.x = x;
            this.y = y;
            this.name = name;
        }
    }
    gameData.stages = [];
    const stage1 = [];
    gameData.stages.push(stage1);
    stage1.push(new SpawnData(2, 160, 50, 'obake'));
    // stage1.push(new SpawnData(2, 100, 50, 'obake'));
    // stage1.push(new SpawnData(3, 150, 50, 'obake'));
    // stage1.push(new SpawnData(4, 200, 50, 'obake'));
}
export const shared = {};
{
    shared.score = 0;
}
class SceneTitle extends Mono {
    constructor() {
        super(new Scene());
        //タイトル
        const titleSize = game.width / 11;
        const titleY = game.height * 0.25;
        this.child.add(new Bun(text.title, game.width * 0.5, titleY, { size: titleSize, color: '#EDD425', font: 'Kaisei Decol', align: 1, valign: 1 }));
        this.child.add(new Bun(text.title2, game.width * 0.5, titleY + titleSize * 1.5, { size: titleSize, color: '#ffffff', font: 'Kaisei Decol', align: 1, valign: 1 }));
        //メニュー
        this.child.add(this.titleMenu = new Menu(game.width * 0.5, game.height * 0.5, titleSize, 1));
        this.titleMenu.isEnableCancel = false;
        this.titleMenu.add(text.start);
        this.titleMenu.add(text.highscore);
        this.titleMenu.add(text.credit);
        game.setState(this.stateDefault());
    }
    *stateDefault() {
        while (true) {
            yield* this.titleMenu.stateSelect();
            switch (this.titleMenu.current()) {
                case text.start:
                    this.isExist = false;
                    const play = new ScenePlay();
                    game.pushScene(play);
                    yield* play.stateDefault();
                    this.isExist = true;
                    break;
            }
        }
    }
}
class ScenePlay extends Mono {
    constructor() {
        super(new Generator(), new Scene());
        //プレイヤー
        this.player = new Player();
        this.child.add(this.player.bullets);
        this.child.add(this.player);
        //敵
        this.child.add(this.baddiesbullets = Baddie.createBullets());
        this.child.add(this.baddies = Baddie.createBaddies());
        //パーティクル
        this.child.add(this.effect = new Tsubu());
        this.effect.child.drawlayer = 'effect';
        //UI
        this.child.add(this.ui = new Iremono());
        this.ui.child.drawlayer = 'ui';
        this.ui.child.add(this.textScore = new Bun(() => `SCORE ${shared.score}`, { font: 'Impact' }));
        this.textScore.pos.x = 2;
        this.textScore.pos.y = 2;
        this.ui.child.add(this.fpsView = new Bun(() => `FPS: ${game.fps}`, { font: 'Impact' }));
        this.fpsView.pos.x = game.width - 2;
        this.fpsView.pos.y = 2;
        this.fpsView.pos.align = 2;

        // this.child.add(this.textScore = new Bun(() => `Baddie:${this.baddies.child.liveCount} Bullets:${this.baddiesbullets.child.liveCount}`, { font: 'Impact' }));
        // this.textScore.pos.x = 2;
        // this.textScore.pos.y = 48;

        // this.fiber.add(this.stageRunner(con.stages[0]));        
        this.generator.run(this.stageRunner2());
    }
    postUpdate() {
        {
            const halfX = this.player.pos.width * 0.5;
            const halfY = this.player.pos.height * 0.5;
            this.player.pos.x = Util.clamp(halfX, this.player.pos.x, game.width - halfX);
            this.player.pos.y = Util.clamp(halfY, this.player.pos.y, game.height - halfY);
        }
        {
            this.player.bullets.child.each((bullet) => {
                if (game.isOutOfRange(bullet.pos.getScreenX(), bullet.pos.getScreenY(), bullet.pos.width, bullet.pos.height)) bullet.putback();
                this.baddies.child.each((baddie) => {
                    if (!bullet.pos.isIntersect(baddie.pos)) return;
                    // console.log('ぐわぁぁぁ');
                    bullet.putback();
                    if (baddie.unit.hit(1, shared)) {
                        this.effect.emittCircle(8, 300, 0.5, '#ffffff', baddie.pos.x, baddie.pos.y, 0.97)
                        baddie.putback();
                    }
                })
            });
        }
        {
            this.baddiesbullets.child.each((bullet) => {
                if (game.isOutOfRange(bullet.pos.getScreenX(), bullet.pos.getScreenY(), bullet.pos.width, bullet.pos.height)) bullet.putback();
                if (!this.player.isExist) return;
                if (!bullet.pos.isIntersect(this.player.pos)) return;
                // console.log('ぎにゃー');
                bullet.putback();
                if (this.player.unit.hit(1, shared)) {
                    this.effect.emittCircle(8, 300, 0.5, '#ffffff', this.player.pos.x, this.player.pos.y, 0.97)
                }
            })
        }
    }
    *stateDefault() {
        while (true) {
            yield undefined;
            if (this.player.unit.dead) {
                this.player.isExist = false;
                const gameover = new SceneGameOver();
                game.pushScene(gameover);
                yield* gameover.stateDefault();
                this.resetGame();
                if (gameover.scene.result === 0) {
                    return;
                }
            }
            if (game.input.IsPress('x')) {
                this.isActive = false;
                const pause = new ScenePause();
                game.pushScene(pause);
                yield* pause.stateDefault();
                if (pause.scene.result === 0) {
                    this.resetGame();
                    return;
                }
                this.isActive = true;
            }
            this.player.receiveInput();
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
                this.spawnBaddie(Util.random(30, game.width - 30), Util.random(30, game.height * 0.5), 'crow');
            } else {
                timeCounter -= 1 * game.delta;
            }
            yield undefined;
        }
    }
    resetGame() {
        shared.score = 0;
        this.player.reset();
        this.player.bullets.child.putbackAll();
        this.baddies.child.putbackAll();
        this.baddiesbullets.child.putbackAll();
    }
    spawnBaddie(x, y, name) {
        const bad = this.baddies.child.get(name);
        bad.pos.x = x;
        bad.pos.y = y;
        bad.bullets = this.baddiesbullets;
    }
}
class Unit {
    constructor() {
        this.hp = 0;
        this.point = 0;
    }
    hit(damage, shared) {
        this.hp -= damage;
        shared.score += this.point;
        return this.hp <= 0;
    }
    get dead() { return this.hp <= 0 }
}
class Player extends Mono {
    constructor() {
        super(new Moji(Util.parseUnicode(emojiCat), 0, 0, { size: 40, color: '#ffffff', align: 1, valign: 1 }), new Unit());
        this.bulletCooltime = 0;
        this.reset();
        this.bullets = new Iremono();
        this.bullets.child.drawlayer = 'effect';
        this.bullets.child.addCreator(Tofu.name, () => new Tofu(), (bullet) => {
            bullet.pos.width = 4;
            bullet.pos.height = 4;
            bullet.pos.align = 1;
            bullet.pos.valign = 1;
            bullet.brush.color = '#ffff00';
        });
    }
    reset() {
        this.isExist = true;
        this.pos.x = game.width * 0.5;
        this.pos.y = game.height * 40
        this.unit.hp = 1;
        this.bulletCooltime = 0;
    }
    receiveInput() {
        this.pos.vx = 0;
        this.pos.vy = 0;
        if (game.input.IsDown('left')) {
            this.pos.vx = -playerMoveSpeed;
        }
        if (game.input.IsDown('right')) {
            this.pos.vx = playerMoveSpeed;
        }
        if (game.input.IsDown('up')) {
            this.pos.vy = -playerMoveSpeed;
        }
        if (game.input.IsDown('down')) {
            this.pos.vy = playerMoveSpeed;
        }
        if (this.pos.vx !== 0 && this.pos.vy !== 0) {
            this.pos.vx *= Util.nanameCorrect;
            this.pos.vy *= Util.nanameCorrect;
        }
        if (game.input.IsDown('z')) {
            this.shot();
        }
    }
    shot() {
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
class Baddie extends Mono {
    constructor(char) {
        super(new Moji(char, 0, 0, { size: 40, color: '#000000', align: 1, valign: 1 }), new Unit())
        this.bullets;
        this.bulletCooltime = 0;
    }
    static createBaddies() {
        const baddies = new Iremono();
        for (const bad of Object.values(gameData.baddies)) {
            baddies.child.addCreator(bad.name, () => new Baddie(Util.parseUnicode(bad.char)), (baddie) => {
                baddie.unit.hp = bad.hp;
                baddie.unit.point = bad.point;
                baddie.bulletCooltime = 0;
            });
        }
        return baddies;
    }
    static createBullets() {
        const bullets = new Iremono();
        bullets.child.drawlayer = 'effect';
        bullets.child.addCreator(Tofu.name, () => new Tofu(), (bullet) => {
            bullet.pos.width = 4;
            bullet.pos.height = 4;
            bullet.pos.align = 1;
            bullet.pos.valign = 1;
            bullet.brush.color = '#ffffff';
        });
        return bullets;
    }
    update() {
        this.shot();
    }
    shot() {
        if (this.bulletCooltime <= 0) {
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
}
class ScenePause extends Mono {
    constructor() {
        super(new Scene());
        const titleSize = game.width / 11;
        let titleY = game.height * 0.25;
        this.child.add(new Bun(text.pause, game.width * 0.5, titleY, { size: titleSize, color: '#EDD425', font: 'Kaisei Decol', align: 1, valign: 1 }));
        this.child.add(this.menu = new Menu(game.width * 0.5, game.height * 0.5, titleSize, 1));
        this.menu.add(text.resume);
        this.menu.add(text.restart);
        this.menu.add(text.returntitle);
    }
    draw(ctx) {
        ctx.fillStyle = '#00000080';
        ctx.fillRect(0, 0, game.width, game.height);
    }
    *stateDefault() {
        game.isPauseBlur = true;
        yield* this.menu.stateSelect();
        game.isPauseBlur = false;
        switch (this.menu.current()) {
            case text.resume:
            case Menu.cancel:
                game.popScene();
                break;
            case text.restart:

                break;
            case text.returntitle:
                this.scene.result = 0;
                game.popScene();
                game.popScene();
                break;
        }
    }
}
class SceneGameOver extends Mono {
    constructor() {
        super(new Scene());
        const titleSize = game.width / 11;
        let titleY = game.height * 0.25;
        this.child.add(new Bun(text.gameover, game.width * 0.5, titleY, { size: titleSize, color: '#EDD425', font: 'Kaisei Decol', align: 1, valign: 1 }));
        this.child.add(this.menu = new Menu(game.width * 0.5, game.height * 0.5, titleSize, 1));
        this.menu.isEnableCancel = false;
        this.menu.add(text.continue);
        this.menu.add(text.returntitle);
    }
    *stateDefault() {
        yield* this.menu.stateSelect();
        switch (this.menu.current()) {
            case text.continue:
                game.popScene();
                break;
            case text.returntitle:
                this.scene.result = 0;
                game.popScene();
                game.popScene();
                break;
        }
    }
}
game.pushScene(new SceneTitle());
game.start();