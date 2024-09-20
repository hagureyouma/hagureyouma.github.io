'use strict';

class Game {
    constructor(width, height, tag = 'body') {
        this.canvas = document.createElement('canvas');
        document.querySelector(tag).appendChild(this.canvas);
        this.canvas.width = width;
        this.canvas.height = height;
        this.obj = [];
        this.key = {};
        this.input = {};
        this.time;
        this.delta;
    }
    Start() {
        this.time = performance.now();
        this._tick();
    }
    _tick() {
        //update
        //draw
        var ctx = this.canvas.getContext('2d');
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(this.delta, 0, 30);
        requestAnimationFrame(this._tick.bind(this));
        const now = performance.now();
        this.delta = Math.min((now - this.time) / 1000000.0, 1 / 60.0);
        this.time = now;
    }
}

const game = new Game(320, 320, '.contents');
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