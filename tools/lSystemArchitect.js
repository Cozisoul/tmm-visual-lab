/**
 * @class LSystemArchitect
 * @description A tool for generating and drawing L-system fractals.
 */
class LSystemArchitect {
  constructor() {
    console.log("L-System Architect loaded.");
    this.rules = {
      F: "FF+[+F-F-F]-[-F+F+F]",
    };
    this.axiom = "F";
    this.angle = 25;
    this.iterations = 3;
    this.length = 10;
    this.sentence = this.axiom;
    this.regenerate();
  }

  regenerate() {
    this.sentence = this.axiom;
    for (let i = 0; i < this.iterations; i++) {
      let nextSentence = "";
      for (let j = 0; j < this.sentence.length; j++) {
        const current = this.sentence.charAt(j);
        nextSentence += this.rules[current] || current;
      }
      this.sentence = nextSentence;
    }
  }

  draw(buffer) {
    buffer.background(17, 17, 17);
    buffer.stroke(255);
    buffer.strokeWeight(2);
    buffer.push();
    buffer.translate(buffer.width / 2, buffer.height);

    for (let i = 0; i < this.sentence.length; i++) {
      const current = this.sentence.charAt(i);
      if (current === "F") {
        buffer.line(0, 0, 0, -this.length);
        buffer.translate(0, -this.length);
      } else if (current === "+") {
        buffer.rotate(radians(this.angle));
      } else if (current === "-") {
        buffer.rotate(radians(-this.angle));
      } else if (current === "[") {
        buffer.push();
      } else if (current === "]") {
        buffer.pop();
      }
    }
    buffer.pop();
  }
}

window.LSystemArchitect = LSystemArchitect;
