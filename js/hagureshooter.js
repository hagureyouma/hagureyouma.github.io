'use strict';

const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css';
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
        this.objs = [];
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
        for (let i = 0; i < this.objs.length; i++) {
            this.objs[i].update(this.delta);
        }
        const ctx = this.canvas.getContext('2d');
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        for (let i = 0; i < this.objs.length; i++) {
            this.objs[i].draw(this.canvas);
        }
        requestAnimationFrame(this._tick.bind(this));
    }
    Add(obj) {
        this.objs.push(obj);
    }
    KeyBind(name, key) {
        this.key[name] = key;
        this.input[name] = false;
    }
    CodeToStr(code) {
        return String.fromCharCode(parseInt(code, 16));
    }
}

class Moji {
    constructor(text) {
        this.text = text;
        this.size = 20;
        this.color = '#ffffff';
        this.font = 'FontAwesome';
        this.weight = 'normal';
        this.baseLine = 'top';
        this.width = this.height = 0;
        this.x = this.y = 0;
        this.vx = this.vy = 0;
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
        this.onUpdate(delta);
        this.x += this.vx * delta;
        this.y += this.vy * delta;
    }
    draw(canvas) {
        const ctx = game.canvas.getContext('2d');
        ctx.font = `${this.weight} ${this.size}px ${this.font}`;
        ctx.textBaseline = this.baseLine;
        const tm = ctx.measureText(this.text);
        this.width = tm.width;
        this.height = Math.abs(tm.actualBoundingBoxAscent) + Math.abs(tm.actualBoundingBoxDescent);
        var ox = 0, oy = 0;
        if (this._isCenter) ox = this.width / 2;
        if (this._isMiddle) oy = this.height / 2;
        const x = this.x - ox;
        const y = this.y - oy;
        if (x < -this.width || x > canvas.width) return;
        if (y < -this.height || y > canvas.height) return;
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, x, y);
    }
    onUpdate() { }
}
class Tsubutsubu {
    constructor() {
        this.id = 0;
        this.IsExist = true;
        this.size = 0;
        this.color = '#ffffff';
        this.x = this.y = 0;
        this.vx = this.vy = 0;
    }
}
class TsubutsubuManager {
    constructor() {
        this.objs = [];
        this.reserveIndexes = [];
        this.range = { left: 0, right: game.canvas.width, top: 0, bottom: game.canvas.height };
    }
    put(obj) {
        obj.IsExist = false;
        this.reserveIndexes.push(obj.id);
    }
    get(x, y, size, color) {
        let obj;
        if (this.reserveIndexes.length === 0) {
            obj = new Tsubutsubu();
            obj.id = this.objs.length;
            this.objs.push(obj);
        } else {
            obj = this.objs[this.reserveIndexes.pop()];
        }
        obj.IsExist = true;
        obj.size = size;
        obj.color = color;
        obj.x = x;
        obj.y = y;
        return obj;
    }
    update(delta) {
        for (let i = 0; i < this.objs.length; i++) {
            const obj = this.objs[i];
            if (!obj.IsExist) continue;
            obj.x += obj.vx * delta;
            obj.y += obj.vy * delta;
            const half = obj.size / 2;
            if (obj.x + half < this.range.left || obj.x - half > this.range.right || obj.y + half < this.range.top || obj.y - half > this.range.bottom) this.put(obj);
        }
    }
    draw(canvas) {
        const ctx = canvas.getContext('2d');
        for (let i = 0; i < this.objs.length; i++) {
            const obj = this.objs[i];
            if (!obj.IsExist) continue;
            const x = obj.x - obj.size / 2;
            const y = obj.y - obj.size / 2;
            if (x < -obj.size || x > canvas.width) continue;
            if (y < -obj.size || y > canvas.height) continue;
            ctx.fillStyle = obj.color;
            ctx.fillRect(x, y, obj.size, obj.size);
        }
    }
}
const game = new Game();
game.KeyBind('space', ' ');

const playerMoveSpeed = 400;
const playerBulletRate = 1 / 8;

const player = new Moji(game.CodeToStr('f6e2'));
player.size = 40;
player.color = '#de858c';
player.center();
player.middle();
player.x = game.canvas.width / 2;
player.y = game.canvas.height / 2;
const bullets = new TsubutsubuManager();
player.bullets = bullets;
player.bulletCooltime = 0;
player.onUpdate = (delta) => {
    player.vx = 0;
    player.vy = 0;
    if (game.input.left) {
        player.vx = -playerMoveSpeed;
    }
    if (game.input.right) {
        player.vx = playerMoveSpeed;
    }
    if (game.input.up) {
        player.vy = -playerMoveSpeed;
    }
    if (game.input.down) {
        player.vy = playerMoveSpeed;
    }
    if (player.vx !== 0 && player.vy !== 0) {
        player.vx *= 0.71;
        player.vy *= 0.71;
    }
    if (game.input.space) {
        if (player.bulletCooltime < 0) {
            player.bulletCooltime = playerBulletRate;
            const bullet = player.bullets.get(player.x, player.y-player.height/2, 4, '#ffffff');
            bullet.vy = -400;
        } else {
            player.bulletCooltime -= 1 * delta;
        }
    }
}

const text2 = new Moji('はぐれシューター');
text2.size = 30;
text2.center();
text2.middle();
text2.x = game.canvas.width / 2;
text2.y = game.canvas.height / 2;

game.Add(player);
game.Add(player.bullets);
game.Add(text2);
game.Start();

// const contents = document.querySelector('body');
// const canvas = document.createElement('canvas');
// canvas.id = 'gameScreen';
// canvas.width = 320;
// canvas.height = 480;
// contents.appendChild(canvas);
// const ctx = canvas.getContext('2d');
// ctx.textBaseline = 'top';
// ctx.fillStyle = 'blue';
// ctx.fillRect(0, 0, canvas.width, canvas.height);
// ctx.fillStyle = 'white';
// ctx.font = '50px FontAwesome';
// const iconInt = parseInt("f6e2", 16);
// const iconStr = String.fromCharCode(iconInt);
// ctx.fillText(iconStr, 0, 0);
// console.log('ああああ');