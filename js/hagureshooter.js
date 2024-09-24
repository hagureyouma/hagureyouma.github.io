'use strict';

const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css';

const nanameCorrect = 0.71;

const playerMoveSpeed = 400;
const playerBulletRate = 1 / 8;

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
        //todo:preload
        if (init !== undefined) init();
        const _keyevent = e => {
            e.preventDefault();
            for (let key in this.key) {
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
        addEventListener('keydown', _keyevent, { passive: false });
        addEventListener('keyup', _keyevent, { passive: false });
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
    CodeToStr(code) {
        return String.fromCharCode(parseInt(code, 16));
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
        this.reserveIndexes = {};
    }
    setMaker(name, func) {
        this.maker[name] = func;
    }
    put(obj) {
        if (obj.base.id < 0) return;
        obj.base.isExist = false;
        this.reserveIndexes[obj.constructor.name].push(obj.base.id);
        console.log(`${obj.constructor.name},${obj.base.id}`);
    }
    get(name) {
        let obj;
        if (!(name in this.reserveIndexes)) this.reserveIndexes[name] = [];
        if (this.reserveIndexes[name].length === 0) {
            obj = this.maker[name]();
            obj.base.id = this.objs.length;
            this.objs.push(obj);
        } else {
            obj = this.objs[this.reserveIndexes[name].pop()];
        }
        obj.base.isExist = true;
        return obj;
    }
    Add(obj) {
        this.objs.push(obj);
    }
    update(delta) {
        this.preUpdate(delta);
        for (let i = 0; i < this.objs.length; i++) {
            const obj = this.objs[i];
            if (!obj.base.isExist) continue;
            obj.update(delta);
        }
        this.postUpdate(delta);
    }
    draw(canvas) {
        for (let i = 0; i < this.objs.length; i++) {
            const obj = this.objs[i];
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
        this.width = this.height = 0;
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
        this.width = tm.width;
        this.height = Math.abs(tm.actualBoundingBoxAscent) + Math.abs(tm.actualBoundingBoxDescent);
        var ox = 0, oy = 0;
        if (this._isCenter) ox = this.width * 0.5;
        if (this._isMiddle) oy = this.height * 0.5;
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
        const ctx = canvas.getContext('2d');
        const x = this.pos.x - this.width * 0.5;
        const y = this.pos.y - this.height * 0.5;;
        if (x < -this.width || x > canvas.width) return;
        if (y < -this.height || y > canvas.height) return;
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, this.width, this.height);
    }
}
const game = new Game();
game.KeyBind('space', ' ');

const sceneGame = new Iremono();
game.Add(sceneGame);

const player = new Moji(game.CodeToStr('f6e2'));
sceneGame.Add(player);
player.size = 40;
player.color = '#de858c';
player.center();
player.middle();
player.pos.x = game.canvas.width * 0.5;
player.pos.y = game.canvas.height * 0.5;
player.bulletCooltime = 0;

const playerBullets = new Iremono();
sceneGame.Add(playerBullets);
playerBullets.setMaker(Tofu.name, () => new Tofu());

const enemies=new Iremono();
sceneGame.Add(enemies);
enemies.setMaker(Moji.name, () => new Moji());
enemies.spawn=()=>{

}

sceneGame.preUpdate = (delta) => {
    player.pos.vx = 0;
    player.pos.vy = 0;
    if (game.input.left) {
        player.pos.vx = -playerMoveSpeed;
    }
    if (game.input.right) {
        player.pos.vx = playerMoveSpeed;
    }
    if (game.input.up) {
        player.pos.vy = -playerMoveSpeed;
    }
    if (game.input.down) {
        player.pos.vy = playerMoveSpeed;
    }
    if (player.pos.vx !== 0 && player.pos.vy !== 0) {
        player.pos.vx *= nanameCorrect;
        player.pos.vy *= nanameCorrect;
    }
    if (game.input.space) {
        if (player.bulletCooltime < 0) {
            player.bulletCooltime = playerBulletRate;
            const bullet = playerBullets.get(Tofu.name);
            bullet.width = 4;
            bullet.height = 4;
            bullet.color = '#ffffff';
            bullet.pos.x = player.pos.x;
            bullet.pos.y = player.pos.y - player.height * 0.5;
            bullet.pos.vy = -400;
        } else {
            player.bulletCooltime -= 1 * delta;
        }
    }
}
sceneGame.postUpdate = (delta) => {
    for (let i = 0; i < playerBullets.objs.length; i++) {
        const obj = playerBullets.objs[i];
        if (!obj.base.isExist) continue;
        const halfX = obj.width * 0.5;
        const halfY = obj.height * 0.5;
        if (obj.pos.x + halfX < 0 || obj.pos.x - halfX > game.canvas.width || obj.pos.y + halfY < 0 || obj.pos.y - halfY > game.canvas.height) playerBullets.put(obj);
    }
}

const text2 = new Moji('はぐれシューター');
text2.size = 30;
text2.center();
text2.middle();
text2.pos.x = game.canvas.width * 0.5;
text2.pos.y = game.canvas.height * 0.5;
sceneGame.Add(text2);
game.Start();