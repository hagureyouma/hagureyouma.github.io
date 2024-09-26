'use strict';

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
    Start(init) {
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
        game.KeyBind('up', 'ArrowUp');
        game.KeyBind('down', 'ArrowDown');
        game.KeyBind('left', 'ArrowLeft');
        game.KeyBind('right', 'ArrowRight');
        this.time = performance.now();
        this._tick();
    }
    _tick() {
        const now = performance.now();
        this.delta = Math.min((now - this.time) / 1000.0, 1 / 60.0);
        this.time = now;
        this.root.update(this.delta);
        const ctx = this.canvas.getContext('2d');
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.root.draw(this.canvas);
        requestAnimationFrame(this._tick.bind(this));
    }
    Add(scene) {
        this.root.Add(scene);
    }
    KeyBind(name, key) {
        this.key[name] = key;
        this.input[name] = false;
    }
}
class Util {
    static get nanameCorrect() { return 0.71 };
    static ParseUnicode = (code) => String.fromCharCode(parseInt(code, 16));
    static Clamp = (value, min, max) => Math.min(Math.max(value, min), max);
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
        this.alignX=this.alignY=0;
        this._isCenter = true;
        this._isMiddle = true;
    }
    apply(){
        
    }
    update() {
        this.x += this.vx * game.delta;
        this.y += this.vy * game.delta;
    }
}
class Iremono {
    constructor() {
        this.base = new Base();
        this.maker = {};
        this.objs = [];
        this.reserves = {};
    }
    addCreator(name, func) {
        this.maker[name] = func;
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
            obj = this.maker[name]();
            obj.base.id = this.objs.length;
            this.objs.push(obj);
        } else {
            obj = this.objs[this.reserves[name].pop()];
        }
        obj.base.isExist = true;
        return obj;
    }
    Add(obj) {
        this.objs.push(obj);
    }
    update() {
        this.preUpdate();
        for (const obj of this.objs) {
            if (!obj.base.isExist) continue;
            obj.update();
        }
        this.postUpdate();
    }
    draw() {
        for (const obj of this.objs) {
            if (!obj.base.isExist) continue;
            obj.draw();
        }
    }
    preUpdate() { }
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
        this._isCenter = isCenter;
        this._isMiddle = isMiddle;
        this.baseLine = 'top';
        this.rotate = 0;
        this._applyText();
    }
    changeText(text) {
        this.text = text;
        this._applyText();
    }
    _applyText() {
        const ctx = game.canvas.getContext('2d');
        ctx.font = `${this.weight} ${this.size}px ${this.font}`;
        ctx.textBaseline = this.baseLine;
        const tm = ctx.measureText(this.text);
        this.pos.width = tm.width;
        this.pos.height = Math.abs(tm.actualBoundingBoxAscent) + Math.abs(tm.actualBoundingBoxDescent);
    }
    update() {
        this.pos.update();
    }
    draw() {
        const x = this.pos.x - (Boolean(this._isCenter) * this.pos.width * 0.5);
        const y = this.pos.y - (Boolean(this._isMiddle) * this.pos.height * 0.5);
        if (x < -this.pos.width || x > game.canvas.width) return;
        if (y < -this.pos.height || y > game.canvas.height) return;
        const ctx = game.canvas.getContext('2d');
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, x, y);
    }
}
class Tofu {
    constructor() {
        this.base = new Base();
        this.pos = new Pos();
        this.color = '#ffffff';
    }
    update() {
        this.pos.update();
    }
    draw() {
        const x = this.pos.x - this.pos.width * 0.5;
        const y = this.pos.y - this.pos.height * 0.5;;
        if (x < -this.pos.width || x > game.canvas.width) return;
        if (y < -this.pos.height || y > game.canvas.height) return;
        const ctx = game.canvas.getContext('2d');
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, this.pos.width, this.pos.height);
    }
}
export const game = new Game();
game.KeyBind('space', ' ');

class ScenePlay extends Iremono {
    constructor() {
        super();
        this.text = new Moji('シューティングゲームだよ', { size: 25, color: '#666666', isCenter: true, isMiddle: true });
        this.text.pos.x = game.canvas.width * 0.5;
        this.text.pos.y = game.canvas.height * 0.5;
        this.Add(this.text);
        this.player = new Player();
        this.Add(this.player);
        this.Add(this.player.bullets);
    }
    preUpdate = () => {
        this.player.preUpdate();
    }
    postUpdate = () => {
        {
            const halfX = this.player.pos.width * 0.5;
            const halfY = this.player.pos.height * 0.5;
            this.player.pos.x = Util.Clamp(halfX, this.player.pos.x, game.canvas.width - halfX);
            this.player.pos.y = Util.Clamp(halfY, this.player.pos.y, game.canvas.height - halfY);
        }
        {
            for (const obj of this.player.bullets.objs) {
                if (!obj.base.isExist) continue;
                const halfX = obj.pos.width * 0.5;
                const halfY = obj.pos.height * 0.5;
                if (obj.pos.x + halfX < 0 || obj.pos.x - halfX > game.canvas.width || obj.pos.y + halfY < 0 || obj.pos.y - halfY > game.canvas.height) this.player.bullets.put(obj);
            }
        }
    }
}
class Player extends Moji {
    constructor() {
        super(Util.ParseUnicode(emojiGhost), { size: 40, color: '#de858c', isCenter: true, isMiddle: true });
        this.pos.x = game.canvas.width * 0.5;
        this.pos.y = game.canvas.height * 0.5;
        this.bulletCooltime = 0;
        this.bullets = new Iremono();
        this.bullets.addCreator(Tofu.name, () => new Tofu());
    }
    preUpdate(delta) {
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
                bullet.pos.y = this.pos.y - this.pos.height * 0.5;
                bullet.pos.vy = -400;
            } else {
                this.bulletCooltime -= 1 * game.delta;
            }
        }
    }
}
class Enemy extends Moji {
    constructor() {

    }
}
const enemies = new Iremono();
// sceneGame.Add(enemies);
enemies.addCreator(Moji.name, () => new Moji());
enemies.spawn = () => {

}
game.Add(new ScenePlay());
game.Start();