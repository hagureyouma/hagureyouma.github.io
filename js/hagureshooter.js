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
    Init(init) {
        //todo:preload
        init();
    }
    Start() {
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
    CodeToStr(code) {
        return String.fromCharCode(parseInt(code, 16));
    }
}

class Text {
    constructor(text) {
        this.text = text
        this.font = 'FontAwesome';
        this.color = '#ffffff';
        this.weight = 'normal';
        this.baseLine = 'top';
        this.size = 40;
        this.x = this.y = 0;
        this.vx = this.vy = 0;
        this._width = this._height = 0;
        this.offsetX = this.offsetY = 0;
        this.rotate = 0;
        this._isCenter = false;
        this._isMiddle = false;

        const ctx = game.canvas.getContext('2d');
        ctx.font = `${this.weight} ${this.size}px ${this.font}`;
        ctx.fillStyle = this.color;
        const tm = ctx.measureText(this.text);
        this._width = tm.width;
        this._height = Math.abs(tm.actualBoundingBoxAscent) + Math.abs(tm.actualBoundingBoxDescent);
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
        this.x += this.vx * delta;
        this.y += this.vy * delta;
    }
    draw(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.font = `${this.weight} ${this.size}px ${this.font}`;
        ctx.fillStyle = this.color;
        ctx.textBaseline = this.baseLine;
        const tm = ctx.measureText(this.text);
        this._width = tm.width;
        this._height = Math.abs(tm.actualBoundingBoxAscent) + Math.abs(tm.actualBoundingBoxDescent);
        let ox = 0, oy = 0;
        if (this._isCenter) ox = this._width / 2;
        if (this._isMiddle) oy = this._height / 2;
        const x = this.x - ox;
        const y = this.y - oy;
        if (x < -this._width || x > canvas.width) return;
        if (y < -this._height || x > canvas.height) return;
        ctx.fillText(this.text, x, y);
    }
}

const game = new Game();

const text1 = new Text(game.CodeToStr('f6e2'));
text1.size = 100;
text1.center();
text1.middle();
const text2 = new Text('はぐれシューター');
text2.size = 30;
text2.center();

game.Add(text1);
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