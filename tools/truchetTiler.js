/**
 * @class TruchetTiler
 * @description A pattern generation tool based on Truchet tiles. It fills the canvas
 * with a grid of tiles, each randomly oriented, to create complex, emergent patterns.
 */
class TruchetTiler {
  constructor() {
    console.log("Truchet Tiler loaded.");
    this.tiles = [];
    this.tileSize = 80;
    this.lineWeight = 2;
    this.density = 1;
    this.animSpeed = 0;
    this.strokeColor = '#FFF8E7';
    this.backgroundColor = '#111111';
    this.regenerate();
  }

  regenerate() {
    this.tiles = [];
    const step = this.tileSize / this.density;
    for (let x = 0; x < artboard.width; x += step) {
      for (let y = 0; y < artboard.height; y += step) {
        if (x + step <= artboard.width && y + step <= artboard.height) {
          this.tiles.push({
            x: x,
            y: y,
            type: random() > 0.5
          });
        }
      }
    }
  }

  draw(buffer, media = null, golGrid = null, options = {}) {
    if (!options.noBackground) {
      buffer.background(this.backgroundColor);
    }
    buffer.noFill();
    buffer.stroke(this.strokeColor);
    buffer.strokeWeight(this.lineWeight);

    const step = this.tileSize / this.density;

    for (const tile of this.tiles) {
      let type = tile.type;
      if (this.animSpeed > 0 && frameCount % (60 - this.animSpeed) < 2) {
        if (random() < 0.1) tile.type = !tile.type;
      }

      if (type) {
        buffer.arc(tile.x, tile.y, step, step, 0, HALF_PI);
        buffer.arc(tile.x + step, tile.y + step, step, step, PI, PI + HALF_PI);
      } else {
        buffer.arc(tile.x + step, tile.y, step, step, HALF_PI, PI);
        buffer.arc(tile.x, tile.y + step, step, step, PI + HALF_PI, TWO_PI);
      }
    }
  }
}

window.TruchetTiler = TruchetTiler;