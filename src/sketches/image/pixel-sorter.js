import { ToolBase } from '../../core/tool-base.js';

export class PixelSorter extends ToolBase {
    constructor(p) {
        super(p);
        this.sortMode = 'brightness';
        this.threshold = 80;
        this.direction = 'horizontal';
        this.sortedImage = null;

        // Media property
        this.media = null;
    }

    setup() {
        // No specific setup
    }

    sort(sourceMedia) {
        if (!sourceMedia) return;

        if (sourceMedia.width <= 0 || sourceMedia.height <= 0) {
            console.error("Invalid media dimensions");
            return;
        }

        try {
            const p = this.p;
            this.sortedImage = p.createImage(sourceMedia.width, sourceMedia.height);
            this.sortedImage.copy(sourceMedia, 0, 0, sourceMedia.width, sourceMedia.height, 0, 0, sourceMedia.width, sourceMedia.height);
            this.sortedImage.loadPixels();

            if (!this.sortedImage.pixels || !this.sortedImage.pixels.length) {
                throw new Error("No pixel data available");
            }

            const w = this.sortedImage.width;
            const h = this.sortedImage.height;

            if (this.direction === 'horizontal') {
                for (let y = 0; y < h; y++) {
                    let row = [];
                    for (let x = 0; x < w; x++) {
                        let index = (x + y * w) * 4;
                        if (index + 3 >= this.sortedImage.pixels.length) continue;
                        row.push({
                            r: this.sortedImage.pixels[index],
                            g: this.sortedImage.pixels[index + 1],
                            b: this.sortedImage.pixels[index + 2],
                            a: this.sortedImage.pixels[index + 3],
                        });
                    }

                    let start = -1;
                    for (let x = 0; x < w; x++) {
                        const val = this.getSortValue(row[x]);
                        if (val > this.threshold && start === -1) {
                            start = x;
                        } else if (val < this.threshold && start !== -1) {
                            this.sortSegment(row, start, x);
                            start = -1;
                        }
                    }
                    if (start !== -1) this.sortSegment(row, start, w);

                    for (let x = 0; x < w; x++) {
                        let index = (x + y * w) * 4;
                        this.sortedImage.pixels[index] = row[x].r;
                        this.sortedImage.pixels[index + 1] = row[x].g;
                        this.sortedImage.pixels[index + 2] = row[x].b;
                        this.sortedImage.pixels[index + 3] = row[x].a;
                    }
                }
            } else { // Vertical
                for (let x = 0; x < w; x++) {
                    let col = [];
                    for (let y = 0; y < h; y++) {
                        let index = (x + y * w) * 4;
                        if (index + 3 >= this.sortedImage.pixels.length) continue;
                        col.push({
                            r: this.sortedImage.pixels[index],
                            g: this.sortedImage.pixels[index + 1],
                            b: this.sortedImage.pixels[index + 2],
                            a: this.sortedImage.pixels[index + 3],
                        });
                    }

                    let start = -1;
                    for (let y = 0; y < h; y++) {
                        const val = this.getSortValue(col[y]);
                        if (val > this.threshold && start === -1) {
                            start = y;
                        } else if (val < this.threshold && start !== -1) {
                            this.sortSegment(col, start, y);
                            start = -1;
                        }
                    }
                    if (start !== -1) this.sortSegment(col, start, h);

                    for (let y = 0; y < h; y++) {
                        let index = (x + y * w) * 4;
                        this.sortedImage.pixels[index] = col[y].r;
                        this.sortedImage.pixels[index + 1] = col[y].g;
                        this.sortedImage.pixels[index + 2] = col[y].b;
                        this.sortedImage.pixels[index + 3] = col[y].a;
                    }
                }
            }
            this.sortedImage.updatePixels();

        } catch (error) {
            console.error("Error during pixel sorting:", error);
            return;
        }
    }

    getSortValue(px) {
        try {
            if (!px) return 0;
            const p = this.p;
            const c = p.color(px.r, px.g, px.b);
            if (this.sortMode === 'hue') return p.hue(c);
            if (this.sortMode === 'red') return px.r;
            if (this.sortMode === 'green') return px.g;
            if (this.sortMode === 'blue') return px.b;
            return p.brightness(c);
        } catch (e) {
            console.error("Error getting sort value:", e);
            return 0;
        }
    }

    sortSegment(arr, start, end) {
        try {
            if (start >= end || start < 0 || end > arr.length) return;
            const segment = arr.slice(start, end);
            segment.sort((a, b) => this.getSortValue(a) - this.getSortValue(b));
            arr.splice(start, segment.length, ...segment);
        } catch (e) {
            console.error("Error sorting segment:", e);
        }
    }

    draw() {
        const p = this.p;

        if (!this.showBackground) {
            p.background(17, 17, 17);
        }

        if (this.sortedImage) {
            p.image(this.sortedImage, 0, 0, p.width, p.height);
        } else {
            p.fill(128);
            p.textAlign(p.CENTER, p.CENTER);
            p.text('UPLOAD AN IMAGE AND CLICK "SORT"', p.width / 2, p.height / 2);
        }
    }

    bindControls() {
        const inputs = {
            sortMode: document.getElementById('ps-sort-mode'),
            direction: document.getElementById('ps-direction'),
            threshold: document.getElementById('ps-threshold'),
            sortBtn: document.getElementById('ps-sort-btn')
        };

        const update = () => {
            this.sortMode = inputs.sortMode?.value || 'brightness';
            this.direction = inputs.direction?.value || 'horizontal';
            this.threshold = parseInt(inputs.threshold?.value || 80, 10);
        };

        // Initial update
        update();

        // Bind events
        Object.values(inputs).forEach(input => {
            if (input && input.id !== 'ps-sort-btn') {
                const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
                input.addEventListener(eventType, update);
            }
        });

        inputs.sortBtn?.addEventListener('click', () => {
            if (this.media) {
                this.sort(this.media);
            }
        });
    }
}
