'use strict';

class Game {
    constructor(width = 320, height = 320) {
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
    Init(init){
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
        for (let i = 0; i < this.objs.length; i++) {
            this.objs[i].draw(this.canvas);
        }
        var ctx = this.canvas.getContext('2d');
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.font = '20px FontAwesome';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Delta:' + this.delta, 0, 30);
        requestAnimationFrame(this._tick.bind(this));
    }
    CodeToStr(code) {
        return String.fromCharCode(parseInt(code, 16));
    }
    Add(obj){
        this.objs.push(obj);
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
        this._width = this._height = 0;
        this.offsetX = this.offsetY = 0;
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
        this.x += this.vx * delta;
        this.y += this.vy * delta;
    }
    draw(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.font = `${this.size}px ${this.font} ${this.weight}`;
        ctx.fillStyle = this.color;
        ctx.textBaseLine = this.baseLine;
        const tm = ctx.measureText(this.text);
        this._width = tm.width;
        this._height = Math.abs(tm.actualBoundingBoxAscent) + Math.abs(tm.actualBoundingBoxDescent);
        let ox, oy = 0;
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
game.Start();

// const contents = document.querySelector('.contents');
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