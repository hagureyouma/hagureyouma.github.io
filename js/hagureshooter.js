'use strict';
console.clear();

const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css';
// const fontUrl='https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c&display=swap';
const fontUrl = 'https://fonts.googleapis.com/css2?family=Kaisei+Decol&display=swap';

const TEXT_SIZE = {
    NORMAL: 20,
    MEDIUM: 30,
    BIG: 40,
}
Object.freeze(TEXT_SIZE);
const COLOR = {
    BLACK: '#000000',
    WHITE: '#ffffff',
    RED: '#ff0000',
    ORANGE: '#ff8c00',
    YELLOW: '#ffff00'
}
Object.freeze(COLOR);
const EMOJI = {
    GHOST: 'f6e2',
    CAT: 'f6be',
    CROW: 'f520',
    HOUSE: 'e00d',
    TREE: 'f1bb'
}
Object.freeze(EMOJI);

const LAYER_NAME = ['bg', 'main', 'effect', 'ui'];

let text = {
    title: 'シューティングゲーム', title2: 'のようななにか', pressanykey: 'Xキーを押してね',
    start: 'スタート', highscore: 'ハイスコア', credit: 'クレジット',
    pause: 'ポーズ', resume: 'ゲームを続ける', restart: '最初からやり直す', returntitle: 'タイトルに戻る',
    gameover: 'ゲームオーバー', continue: 'コンティニュー'
}
const KEY_REPEAT_WAIT_FIRST = 0.25;
const KEY_REPEAT_WAIT = 0.125;

const PLAYER_MOVE_SPEED = 600;
const PLAYER_BULLET_SPEED = 150;
const PLAYER_FIRELATE = 1 / 20;
const BADDIES_BULLET_SPEED = 150;
const BADDIE_FIRELATE = 1 / 0.5;

class Game {
    constructor(width = 360, height = 480) {
        const head = document.querySelector('head');
        head.insertAdjacentHTML('beforeend', `<link rel="stylesheet" type="text/css" href="${iconUrl}" /> `);
        head.insertAdjacentHTML('beforeend', `<link rel="stylesheet" type="text/css" href="${fontUrl}" /> `);
        const body = document.querySelector('body');
        body.style.backgroundColor = COLOR.BLACK;
        this.screenRect = new Rect().set(0, 0, width, height);
        this.layers = {};
        for (const layer of LAYER_NAME) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.style.position = 'absolute';
            canvas.style.left = 0
            canvas.style.right = 0;
            canvas.style.margin = '0 auto';
            body.appendChild(this.layers[layer] = canvas);
        }
        const bg = this.layers['bg'].getContext('2d');
        bg.fillStyle = COLOR.BLACK;
        bg.fillRect(0, 0, this.width, this.height);
        this.blur = document.createElement('canvas');
        this.blur.width = width;
        this.blur.height = height;
        this.isPauseBlur = false;
        this.root = new Mono(new State(), new Child());
        this.input = new Input();
        this.time;
        this.delta;
        this.fpsBuffer = Array.from({ length: 60 });
    }
    get width() { return this.screenRect.width };
    get height() { return this.screenRect.height };
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
    setState = state => this.root.state.run(state);
    isOutOfRange = (rect) => !this.screenRect.isIntersect(rect);
    clearBlur() {
        const blurCtx = this.blur.getContext('2d');
        blurCtx.clearRect(0, 0, this.width, this.height);
    }
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
        addEventListener('gamepaddisconnected', e => this.padIndex = undefined);
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
    static hexColor = (hex, alpha) => `${hex}${alpha.toString(16).padStart(2, '0')}`;
}
class Rect {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
    }
    set(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        return this;
    }
    isIntersect = (rect) => rect.x + rect.width > this.x && this.x + this.width > rect.x && rect.y + rect.height > this.y && this.y + this.height > rect.y;
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
    resetMix() {
        for (const mix of this.mixs) {
            mix.reset();
        }
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
class State {
    constructor() {
        this.state;
    }
    reset = () => this.state = undefined;
    run = state => this.state = state;
    update() {
        if (!this.state) return;
        let result;
        while (result = this.state?.next(result).value !== undefined) { }
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
        this._rect = new Rect();
    }
    reset = () => this.set(0, 0, 0, 0);
    set(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        return this;
    }
    update() {
        this.x += this.vx * game.delta;
        this.y += this.vy * game.delta;
        this.vx *= this.vxc;
        this.vy *= this.vyc;
    }
    getScreenX = () => Math.floor(this.x - this.align * this.width * 0.5);
    getScreenY = () => Math.floor(this.y - this.valign * this.height * 0.5);
    get rect() { return this._rect.set(this.getScreenX(), this.getScreenY(), this.width, this.height) }
}
class Collision {
    constructor() {
        this._rect = new Rect();
        this.isVisible = true;
        return [new Pos(), this];
    }
    reset = () => this.set(0, 0);
    set = (width, height) => this._rect.set(0, 0, width, height);
    get rect() {
        const pos = this.owner.pos;
        return this._rect.set(Math.floor(pos.x - pos.align * this._rect.width * 0.5), Math.floor(pos.y - pos.valign * this._rect.height * 0.5), this._rect.width, this._rect.height);
    }
    ishit = (obj) => this.rect.isIntersect(obj.collision.rect);
    draw(ctx) {
        if (!this.isVisible) return;
        ctx.fillStyle = '#ff000080';
        const r = this.rect;
        ctx.fillRect(r.x, r.y, r.width, r.height);
    }
}
class Child {
    constructor() {
        this.creator = {};
        this.objs = [];
        this.reserves = {};
        this.liveCount = 0;
        this.drawlayer = '';
    }
    reset() { }
    addCreator(name, func) {
        this.creator[name] = func;
    }
    get(name) {
        let obj;
        if (name in this.reserves === false) this.reserves[name] = [];
        if (this.reserves[name].length === 0) {
            obj = this.creator[name]();
            obj.id = this.objs.length;
            obj.putback = () => {
                obj.isExist = false;
                obj.resetMix();
                this.reserves[name].push(obj.id);
                this.liveCount--;
            }
            this.objs.push(obj);
        } else {
            obj = this.objs[this.reserves[name].pop()];
        }
        obj.isExist = true;
        this.liveCount++;
        return obj;
    }
    add = (obj) => this.objs.push(obj);
    pop = () => this.objs.pop();
    putbackAll() {
        for (const obj of this.objs) {
            if (!obj.isExist || obj.id < 0) continue;
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
    constructor() {
        this.lifeSpan = 0;
        this.lifeStage = 0;
    }
    reset() {
        this.lifeSpan = 0;
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
class Color {
    constructor() {
        this.value = '';
        this.baseColor = '';
        this.func;
    }
    reset() {
        this.value = '';
        this.baseColor = '';
        this.func = undefined;
    }
    update = () => this.func?.();
    flash(color) {
        if (this.func) this.value = this.baseColor;
        this.baseColor = this.value;
        this.value = color;
        let timer = 0.03;
        this.func = () => {
            if (timer <= 0) {
                this.value = this.baseColor;
                this.func = undefined;
                return;
            }
            timer -= game.delta;
        }
    }
}
class Moji {
    constructor() {
        this.text = '';
        this.weight = 0;
        this.size = 0;
        this.font = 0;
        this.baseLine = 'top';
        return [new Pos(), new Color(), this];
    }
    reset() { }
    set(text, x, y, { size = TEXT_SIZE.NORMAL, color = COLOR.WHITE, font = 'FontAwesome', weight = 'normal', align = 0, valign = 0 } = {}) {
        this.text = text;
        this.weight = weight;
        this.size = size;
        this.font = font;
        this.owner.color.value = color;
        const ctx = game.layers['main'].getContext('2d');
        ctx.font = `${this.weight} ${this.size}px '${this.font}'`;
        ctx.textBaseline = this.baseLine;
        const tm = ctx.measureText(this.getText);
        const pos = this.owner.pos;
        pos.set(x, y, tm.width, Math.abs(tm.actualBoundingBoxAscent) + Math.abs(tm.actualBoundingBoxDescent));
        pos.align = align;
        pos.valign = valign;
    }
    get getText() { return typeof this.text === 'function' ? this.text() : this.text };
    draw(ctx) {
        ctx.font = `${this.weight} ${this.size}px '${this.font}'`;
        ctx.textBaseline = this.baseLine;
        ctx.fillStyle = this.owner.color.value;
        const x=this.owner.pos.getScreenX();
        const y=this.owner.pos.getScreenY();
        ctx.fillText(this.getText,x ,y );
    }
}
class label extends Mono {
    constructor(text, x, y, { size = TEXT_SIZE.NORMAL, color = COLOR.WHITE, font = 'FontAwesome', weight = 'normal', align = 0, valign = 0 } = {}) {
        super(new Moji());
        this.moji.set(text, x, y, { size, color, font, weight, align, valign });
    }
}
class Brush {
    constructor() {
        this.color = COLOR.WHITE;
        return [new Pos(), this];
    }
    reset() { }
    draw(ctx) {
        const pos = this.owner.pos;
        ctx.fillStyle = this.color;
        ctx.fillRect(pos.getScreenX(), pos.getScreenY(), pos.width, pos.height);
    }
}
class Tofu extends Mono {
    constructor() {
        super(new Brush());
    }
    set(x, y, width, height, color, alpha) {
        this.pos.set(x, y, width, height);
        this.brush.color = color;
        this.brush.alpha = alpha;
        return this;
    }
}
class Tsubu extends Mono {
    constructor() {
        super(new Child());
        this.child.addCreator(Tsubu.name, () => {
            const t = new Mono(new Brush(), new Jumyo());
            t.update = () => t.brush.color = Util.hexColor(t.brush.baseColor, Math.floor(255 - (t.jumyo.percentage * 255)));
            return t;
        });
    }
    emittCircle(count, speed, lifeSpan, color, x, y, c) {
        const deg = 360 / count;
        for (let i = 0; i < count; i++) {
            const t = this.child.get(Tsubu.name);
            t.brush.color = t.brush.baseColor = color;
            t.brush.alpha = 255;
            t.pos.set(x, y, 8, 8);
            t.pos.align = 1;
            t.pos.valign = 1;
            t.pos.vx = Util.degToX(deg * i) * speed;
            t.pos.vy = Util.degToY(deg * i) * speed;
            t.pos.vxc = c;
            t.pos.vyc = c;
            t.jumyo.lifeSpan = lifeSpan;
            t.jumyo.lifeStage = 0;
        }
    }
}
class Menu extends Mono {
    constructor(x, y, size, { icon = EMOJI.CAT, align = 1 } = {}) {
        super(new Pos(), new Child());
        this.pos.x = x;
        this.pos.y = y;
        this.pos.align = align;
        this.size = size;
        this.index = 0;
        this.color = COLOR.WHITE;
        this.highlite = COLOR.YELLOW;
        this.isEnableCancel = true;
        this.child.add(this.curL = new label(Util.parseUnicode(icon), 0, 0, { size: this.size, color: this.highlite, align: 2, valign: 1 }));
        this.child.add(this.curR = new label(Util.parseUnicode(icon), 0, 0, { size: this.size, color: this.highlite, valign: 1 }));
        this.indexOffset = this.child.objs.length;
    }
    add(text) {
        this.child.add(new label(text, this.pos.x, this.pos.y + this.size * 1.5 * (this.child.objs.length - 2), { size: this.size, color: this.color, font: 'Kaisei Decol', align: this.pos.align, valign: 1 }))
    }
    *stateSelect(newIndex = this.index) {
        const length = this.child.objs.length - this.indexOffset;
        function* move(key, direction) {
            if (!game.input.IsDown(key)) return false;
            this.moveIndex((this.index + direction) % length);
            let wait = KEY_REPEAT_WAIT;
            if (game.input.IsPress(key)) wait = KEY_REPEAT_WAIT_FIRST;
            yield* waitForTimeOrFrag(wait, () => game.input.IsUp(key));
            return true;
        }
        this.moveIndex(newIndex);
        while (true) {
            yield undefined;
            if (game.input.IsPress('z')) return this.child.objs[this.index + this.indexOffset].moji.getText;
            if (this.isEnableCancel && game.input.IsPress('x')) return '';
            if (yield* move.bind(this)('up', length - 1)) continue;
            if (yield* move.bind(this)('down', 1)) continue;
        }
    }
    moveIndex(newIndex) {
        this.child.objs[this.index + this.indexOffset].color.value = this.color;
        this.index = newIndex;
        const item = this.child.objs[newIndex + this.indexOffset];
        item.color.value = this.highlite;
        const w = item.pos.width;
        const x = (w * 0.5) * this.pos.align;
        this.curL.pos.x = item.pos.x - x;
        this.curL.pos.y = item.pos.y;
        this.curR.pos.x = item.pos.x - x + w;
        this.curR.pos.y = item.pos.y;
    }
    current = () => this.index === -1 ? Menu.cancel : this.child.objs[this.index + this.indexOffset].moji.text;
    static get cancel() { return 'cancel' };
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
    gameData.baddies['obake'] = new BaddieData('obake', EMOJI.GHOST, 5, 200);
    gameData.baddies['crow'] = new BaddieData('crow', EMOJI.CROW, 5, 100);

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
class Watch extends Mono {
    constructor() {
        super(new Pos(), new Child());
        this.child.drawlayer = 'ui';
        this.child.addCreator('label', () => new label());
    }
    add(watch) {
        const l = this.child.get('label');
        l.moji.set(watch, 2, this.pos.y + ((this.child.objs.length - 1) * l.moji.size * 1.5), { font: 'Impact' })
    }
}
class SceneTitle extends Mono {
    constructor() {
        super(new Child());
        //タイトル
        const titleSize = game.width / 11;
        const titleY = game.height * 0.25;
        this.child.add(new label(text.title, game.width * 0.5, titleY, { size: titleSize, color: COLOR.YELLOW, font: 'Kaisei Decol', align: 1, valign: 1 }));
        this.child.add(new label(text.title2, game.width * 0.5, titleY + titleSize * 1.5, { size: titleSize, color: COLOR.WHITE, font: 'Kaisei Decol', align: 1, valign: 1 }));
        //メニュー
        this.child.add(this.titleMenu = new Menu(game.width * 0.5, game.height * 0.5, titleSize));
        this.titleMenu.isEnableCancel = false;
        this.titleMenu.add(text.start);
        this.titleMenu.add(text.highscore);
        this.titleMenu.add(text.credit);
        //操作説明
        this.child.add(new label(text.title, game.width * 0.5, game.height - 20, { color: COLOR.WHITE, font: 'Kaisei Decol', align: 1, valign: 1 }));
        game.setState(this.stateDefault());
    }
    *stateDefault() {
        while (true) {
            switch (yield* this.titleMenu.stateSelect()) {
                case text.start:
                    this.isExist = false;
                    yield* new ScenePlay().stateDefault();
                    this.isExist = true;
                    break;
            }
        }
    }
}
class ScenePlay extends Mono {
    constructor() {
        super(new State(), new Child());
        //プレイヤー
        this.child.add(this.player = new Player());
        this.child.add(this.player.bullets);
        //敵キャラ
        this.child.add(this.baddies = new Baddies());
        this.child.add(this.baddies.bullets);
        //パーティクル
        this.child.add(this.effect = new Tsubu());
        this.effect.child.drawlayer = 'effect';
        //UI
        this.child.add(this.ui = new Mono(new Child()));
        this.ui.child.drawlayer = 'ui';
        this.ui.child.add(this.textScore = new label(() => `SCORE ${shared.score}`, 2, 2, { font: 'Impact' }));
        this.ui.child.add(this.fpsView = new label(() => `FPS: ${game.fps}`, game.width - 2, 2, { font: 'Impact' }));
        this.fpsView.pos.align = 2;

        // this.child.add(this.debug = new Watch());
        // this.debug.pos.y = 40;
        // this.debug.add(() => `ENEMY: ${this.baddies.child.liveCount}`);
        // this.debug.add(() => `ENEMYBULLET: ${this.baddies.bullets.child.liveCount}`);

        // this.child.add(this.textScore = new Bun(() => `Baddie:${this.baddies.child.liveCount} Bullets:${this.baddiesbullets.child.liveCount}`, { font: 'Impact' }));
        // this.textScore.pos.x = 2;
        // this.textScore.pos.y = 48;

        // this.fiber.add(this.stageRunner(con.stages[0]));        
        this.state.run(this.stageRunner2());
    }
    postUpdate() {
        const _ishit = (bullet, target) => {
            if (!bullet.collision.ishit(target)) return;
            bullet.putback();
            target.color.flash(COLOR.WHITE);
            if (!target.unit.hit(1, shared)) return;
            this.effect.emittCircle(8, 300, 0.5, COLOR.WHITE, target.pos.x, target.pos.y, 0.97)
            target.knockdown();
        }
        this.player.bullets.child.each((bullet) => {
            if (game.isOutOfRange(bullet.collision.rect)) {
                bullet.putback();
                return;
            }
            this.baddies.child.each((baddie) => _ishit(bullet, baddie));
        });
        this.baddies.bullets.child.each((bullet) => {
            if (game.isOutOfRange(bullet.collision.rect)) {
                bullet.putback();
                return;
            }
            if (this.player.unit.isDead) return;
            _ishit(bullet, this.player);
        })
    }
    *stateDefault() {
        game.pushScene(this);
        while (true) {
            yield undefined;
            if (this.player.unit.isDead) {
                switch (yield* new SceneGameOver().stateDefault()) {
                    case text.continue:
                        this.resetGame();
                        game.clearBlur();
                        break;
                    case text.returntitle:
                        game.popScene();
                        return;
                }
            }
            if (game.input.IsPress('x')) {
                this.isActive = false;
                switch (yield* new ScenePause().stateDefault()) {
                    case text.restart:
                        this.resetGame();
                        game.clearBlur();

                        break;
                    case text.returntitle:
                        game.popScene();
                        return;
                }
                this.isActive = true;
            }
            this.player.receiveInput();
        }
    }
    * stageRunner(stage) {
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
    * stageRunner2() {
        let wait = 1;
        let timeCounter = wait;
        while (true) {
            if (this.baddies.child.liveCount >= 50) {
                yield undefined;
                continue;
            }
            if (timeCounter < 0) {
                timeCounter = wait;
                this.baddies.spawn(Util.random(30, game.width - 30), Util.random(30, game.height * 0.5), 'crow');
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
        this.baddies.bullets.child.putbackAll();
        this.effect.child.putbackAll();
    }
}
class Unit {
    constructor() {
        this.hp = 0;
        this.point = 0;
    }
    reset() {
        this.hp = 0;
        this.point = 0;
    }
    hit(damage, shared) {
        this.hp -= damage;
        shared.score += this.point;
        return this.hp <= 0;
    }
    get isDead() { return this.hp <= 0 }
}
class Player extends Mono {
    constructor() {
        super(new Moji(), new Collision(), new Unit());
        this.bulletCooltime = 0;
        this.bullets = new BulletBox();
        this.reset();
    }
    reset() {
        this.resetMix();
        this.isExist = true;
        this.moji.set(Util.parseUnicode(EMOJI.CAT), game.width * 0.5, game.height * 40, { size: 40, color: COLOR.BLACK, align: 1, valign: 1 });
        this.collision.set(this.pos.width * 1, this.pos.height * 1);
        this.unit.hp = 1;
        this.bulletCooltime = 0.1;
    }
    receiveInput() {
        this.pos.vx = 0;
        this.pos.vy = 0;
        if (game.input.IsDown('left')) this.pos.vx = -PLAYER_MOVE_SPEED;
        if (game.input.IsDown('right')) this.pos.vx = PLAYER_MOVE_SPEED;
        if (game.input.IsDown('up')) this.pos.vy = -PLAYER_MOVE_SPEED;
        if (game.input.IsDown('down')) this.pos.vy = PLAYER_MOVE_SPEED;
        if (this.pos.vx !== 0 && this.pos.vy !== 0) {
            this.pos.vx *= Util.nanameCorrect;
            this.pos.vy *= Util.nanameCorrect;
        }
        if (game.input.IsDown('z')) this.shot();
    }
    shot() {
        if (this.bulletCooltime < 0) {
            this.bulletCooltime = PLAYER_FIRELATE;
            let lr = -1;
            for (let i = 0; i < 2; i++) {
                this.bullets.firing(this.pos.x + (10 * lr), this.pos.y, 0, -400, COLOR.YELLOW);
                lr *= -1;
            }
        } else {
            this.bulletCooltime -= 1 * game.delta;
        }
    }
    knockdown() {
        this.isExist = false;
    }
    postUpdate() {
        const halfX = this.pos.width * 0.5;
        const halfY = this.pos.height * 0.5;
        this.pos.x = Util.clamp(halfX, this.pos.x, game.width - halfX);
        this.pos.y = Util.clamp(halfY, this.pos.y, game.height - halfY);
    }
    draw(ctx) {
        const pos = this.pos;
        const x = this.pos.getScreenX();
        const y = pos.getScreenY();
        ctx.fillStyle = COLOR.YELLOW;
        ctx.fillRect(x + 31, y + 5, 10, 8);
    }
}
class Baddies extends Mono {
    constructor() {
        super(new Child());
        this.bullets = new BulletBox();
        for (const bad of Object.values(gameData.baddies)) {
            this.child.addCreator(bad.name, () => {
                const baddie = new Baddie();
                baddie.bullets = this.bullets;
                return baddie;
            });
        }
    }
    spawn(x, y, name) {
        const data = gameData.baddies[name];
        const baddie = this.child.get(name);
        baddie.moji.set(Util.parseUnicode(data.char), x, y, { size: 40, color: COLOR.BLACK, align: 1, valign: 1 });
        baddie.collision.set(baddie.pos.width, baddie.pos.height);
        baddie.unit.hp = data.hp;
        baddie.unit.point = data.point;
        baddie.bulletCooltime = 0.1;
    }
}
class Baddie extends Mono {
    constructor() {
        super(new Moji(), new Collision(), new Unit());
        this.bulletCooltime = 0;
        this.bullets;
    }
    update() {
        this.shot();
    }
    shot() {
        if (this.bulletCooltime <= 0) {
            this.bulletCooltime = BADDIE_FIRELATE;
            this.bullets.firing(this.pos.x, this.pos.y, 0, BADDIES_BULLET_SPEED, COLOR.RED);
            let d = Util.xyToDeg(0, BADDIES_BULLET_SPEED);
            this.bullets.firing(this.pos.x, this.pos.y, Util.degToX(d + 10 % 360) * BADDIES_BULLET_SPEED, Util.degToY(d + 10 % 360) * BADDIES_BULLET_SPEED, COLOR.RED);
            this.bullets.firing(this.pos.x, this.pos.y, Util.degToX(d - 10 % 360) * BADDIES_BULLET_SPEED, Util.degToY(d - 10 % 360) * BADDIES_BULLET_SPEED, COLOR.RED);
        } else {
            this.bulletCooltime -= 1 * game.delta;
        }
    }
    draw(ctx) {
        const pos = this.pos;
        const x = pos.getScreenX();
        const y = pos.getScreenY();
        ctx.fillStyle = COLOR.YELLOW;
        ctx.fillRect(x + 31, y + 3, 10, 10);
    }
    knockdown() {
        this.putback();
    }
}
class BulletBox extends Mono {
    constructor() {
        super(new Child());
        this.child.drawlayer = 'effect';
        this.child.addCreator('bullet', () => new Mono(new Collision(), new Brush()));
    }
    firing(x, y, vx, vy, color) {
        const bullet = this.child.get('bullet');
        bullet.pos.set(x, y, 4, 4);
        bullet.pos.align = 1;
        bullet.pos.valign = 1;
        bullet.pos.vx = vx;
        bullet.pos.vy = vy;
        bullet.collision.set(4, 4);
        bullet.brush.color = color;
        return bullet;
    }
}
class ScenePause extends Mono {
    constructor() {
        super(new Child());
        this.child.drawlayer = 'ui';
        this.child.add(new Tofu().set(0, 0, game.width, game.height, Util.hexColor(COLOR.BLACK, 127)));
        const titleSize = game.width / 11;
        let titleY = game.height * 0.25;
        this.child.add(new label(text.pause, game.width * 0.5, titleY, { size: titleSize, color: COLOR.YELLOW, font: 'Kaisei Decol', align: 1, valign: 1 }));
        this.child.add(this.menu = new Menu(game.width * 0.5, game.height * 0.5, titleSize));
        this.menu.add(text.resume);
        this.menu.add(text.restart);
        this.menu.add(text.returntitle);
    }
    *stateDefault() {
        game.pushScene(this);
        game.isPauseBlur = true;
        const result = yield* this.menu.stateSelect();
        game.isPauseBlur = false;
        game.popScene();
        return result;
    }
}
class SceneGameOver extends Mono {
    constructor() {
        super(new Child());
        this.child.drawlayer = 'ui';
        const titleSize = game.width / 11;
        let titleY = game.height * 0.25;
        this.child.add(new label(text.gameover, game.width * 0.5, titleY, { size: titleSize, color: COLOR.YELLOW, font: 'Kaisei Decol', align: 1, valign: 1 }));
        this.child.add(this.menu = new Menu(game.width * 0.5, game.height * 0.5, titleSize));
        this.menu.isEnableCancel = false;
        this.menu.add(text.continue);
        this.menu.add(text.returntitle);
    }
    *stateDefault() {
        game.pushScene(this);
        const result = yield* this.menu.stateSelect();
        game.popScene();
        return result;
    }
}
game.pushScene(new SceneTitle());
game.start();