/**
 * @class BrandSystemTool
 * @description A tool to display and manage a brand identity system.
 * This includes colors, typography, and logos.
 */
class BrandSystemTool {
  constructor() {
    console.log("Brand System Tool loaded.");
    this.brand = {
      name: "TMM Visual Lab",
      colors: {
        primary: '#FF4136',
        secondary: '#0074D9',
        accent: '#FFDC00',
        neutral: '#F0F0F0',
        dark: '#111111',
      },
      typography: {
        header: {
          font: 'Helvetica, Arial, sans-serif',
          size: 48,
        },
        body: {
          font: 'Georgia, serif',
          size: 16,
        },
      },
      logo: (buffer, x, y, size) => {
        buffer.push();
        buffer.translate(x, y);
        buffer.noFill();
        buffer.stroke(this.brand.colors.primary);
        buffer.strokeWeight(size * 0.1);
        buffer.rect(0, 0, size, size);
        buffer.fill(this.brand.colors.secondary);
        buffer.noStroke();
        buffer.ellipse(size / 2, size / 2, size * 0.6, size * 0.6);
        buffer.pop();
      },
    };
  }

  draw(buffer) {
    buffer.background(this.brand.colors.dark);
    const margin = 50;
    let y = margin;

    // Display Brand Name
    buffer.fill(this.brand.colors.neutral);
    buffer.textFont(this.brand.typography.header.font);
    buffer.textSize(this.brand.typography.header.size);
    buffer.textAlign(LEFT, TOP);
    buffer.text(this.brand.name, margin, y);
    y += this.brand.typography.header.size + margin;

    // Display Color Palette
    buffer.textSize(24);
    buffer.text("Color Palette", margin, y);
    y += 30;
    let x = margin;
    for (const colorName in this.brand.colors) {
      buffer.fill(this.brand.colors[colorName]);
      buffer.rect(x, y, 100, 50);
      buffer.fill(this.brand.colors.neutral);
      buffer.textSize(12);
      buffer.text(colorName, x + 10, y + 60);
      x += 120;
    }
    y += 100;

    // Display Typography
    buffer.fill(this.brand.colors.neutral);
    buffer.textSize(24);
    buffer.text("Typography", margin, y);
    y += 40;
    buffer.textFont(this.brand.typography.header.font);
    buffer.textSize(this.brand.typography.header.size);
    buffer.text("Header Font", margin, y);
    y += this.brand.typography.header.size + 20;
    buffer.textFont(this.brand.typography.body.font);
    buffer.textSize(this.brand.typography.body.size);
    buffer.text("Body font: Lorem ipsum dolor sit amet.", margin, y);
    y += this.brand.typography.body.size + margin;

    // Display Logo
    buffer.fill(this.brand.colors.neutral);
    buffer.textSize(24);
    buffer.text("Logo", margin, y);
    y += 40;
    this.brand.logo(buffer, margin, y, 100);
  }
}

window.BrandSystemTool = BrandSystemTool;
