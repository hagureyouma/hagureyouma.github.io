'use strict';

const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css';

const emojiGhost='f6e2';
const emojiCat='f6be';
const emojiCrow='f520';

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
        this.width=this.height=0;
    }
    update(delta) {
        this.x += this.vx * delta;
        this.y += this.vy * delta;
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
    update(delta) {
        this.preUpdate(delta);
        for (const obj of this.objs) {
            if (!obj.base.isExist) continue;
            obj.update(delta);
        }
        this.postUpdate(delta);
    }
    draw(canvas) {
        for (const obj of this.objs) {
            if (!obj.base.isExist) continue;
            obj.draw(canvas);
        }
    }
    preUpdate(delta) { }
    postUpdate(delta) { }
}
class Moji {
    constructor(text) {
        this.base = new Base();
        this.pos = new Pos();
        this.text = text;
        this.size = 20;
        this.color = '#ffffff';
        this.font = 'FontAwesome';
        this.weight = 'normal';
        this.baseLine = 'top';
        this.rotate = 0;
        this._isCenter = false;
        this._isMiddle = false;
    }
    center() {
        this._isCenter = true;
        return this;
    }
    middle() {
        this._isMiddle = true;
        return this;
    }
    update(delta) {
        this.pos.update(delta);
    }
    draw(canvas) {
        const ctx = game.canvas.getContext('2d');
        ctx.font = `${this.weight} ${this.size}px ${this.font}`;
        ctx.textBaseline = this.baseLine;
        const tm = ctx.measureText(this.text);
        this.pos.width = tm.width;
        this.pos.height = Math.abs(tm.actualBoundingBoxAscent) + Math.abs(tm.actualBoundingBoxDescent);
        var ox = 0, oy = 0;
        if (this._isCenter) ox = this.pos.width * 0.5;
        if (this._isMiddle) oy = this.pos.height * 0.5;
        const x = this.pos.x - ox;
        const y = this.pos.y - oy;
        if (x < -this.width || x > canvas.width) return;
        if (y < -this.height || y > canvas.height) return;
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, x, y);
    }
}
class Tofu {
    constructor() {
        this.base = new Base();
        this.pos = new Pos();
        this.width = 0;
        this.height = 0;
        this.color = '#ffffff';
    }
    update(delta) {
        this.pos.update(delta);
    }
    draw(canvas) {

        const x = this.pos.x - this.width * 0.5;
        const y = this.pos.y - this.height * 0.5;;
        if (x < -this.width || x > canvas.width) return;
        if (y < -this.height || y > canvas.height) return;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, this.width, this.height);
    }
}
const game = new Game();
game.KeyBind('space', ' ');

class ScenePlay extends Iremono {
    constructor() {
        super();
        this.text = new Moji('シューティングゲームだよ');
        this.text.size = 25;
        this.text.color = '#666666';
        this.text.center();
        this.text.middle();
        this.text.pos.x = game.canvas.width * 0.5;
        this.text.pos.y = game.canvas.height * 0.5;
        this.Add(this.text);
        this.player = new Player();
        this.Add(this.player);
        this.Add(this.player.bullets);
    }
    preUpdate = (delta) => {
        this.player.preUpdate(delta);
    }
    postUpdate = (delta) => {
        {
            const halfX = this.player.width * 0.5;
            const halfY = this.player.height * 0.5;
            this.player.pos.x = Util.Clamp(halfX, this.player.pos.x, game.canvas.width - halfX);
            this.player.pos.y = Util.Clamp(halfY, this.player.pos.y, game.canvas.height - halfY);
        }
        {
            for (const obj of this.player.bullets.objs) {
                if (!obj.base.isExist) continue;
                const halfX = obj.width * 0.5;
                const halfY = obj.height * 0.5;
                if (obj.pos.x + halfX < 0 || obj.pos.x - halfX > game.canvas.width || obj.pos.y + halfY < 0 || obj.pos.y - halfY > game.canvas.height) this.player.bullets.put(obj);
            }
        }
    }
}
class Player extends Moji {
    constructor() {
        super(Util.ParseUnicode(emojiGhost));
        this.size = 40;
        this.color = '#de858c';
        this.center();
        this.middle();
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
                bullet.width = 4;
                bullet.height = 4;
                bullet.color = '#ffffff';
                bullet.pos.x = this.pos.x;
                bullet.pos.y = this.pos.y - this.height * 0.5;
                bullet.pos.vy = -400;
            } else {
                this.bulletCooltime -= 1 * delta;
            }
        }
    }
}
class Enemy extends Moji{
    constructor(){

    }
}
const enemies = new Iremono();
// sceneGame.Add(enemies);
enemies.addCreator(Moji.name, () => new Moji());
enemies.spawn = () => {

}
game.Add(new ScenePlay());
game.Start();