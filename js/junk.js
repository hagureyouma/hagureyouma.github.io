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
        let c;
        while (c = this.fibers.at(-1)) {
            let g = c.next();
            if (!g.done) {
                if (!g.value) break;
                this.add(g.value);
                if (c === this.fibers.at(-1)) break;
            }
            if (c === this.fibers.at(-1)) this.fibers.pop();
        }
        this.isRunning = false;
    }
}