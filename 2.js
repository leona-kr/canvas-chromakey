/**
 * dE Chroma Key: Speed Optimizations
 * 
 * Throughout the code I'll annotate certain items that increased efficiency
 * of the formula. Real-time chromas key isn't easy, son. This was a performance
 * game even for dE76.
 */

/**
 * I'm not even using the actual DeltaE library here - what a sham. I had
 * to make a couple changes here.
 * 
 * 1. Make parameters all individualized, instead of objects. Any time you
 * interact with an object property, you interact with the prototype chain.
 * Perhaps not surprisingly, this is a massive performance hit. 6 parameters
 * is nastier, but a necessary evil here.
 * 
 * 2. Reference Math.pow as a local variable. Again - hitting that prototype
 * chain is a performance hit.
 */
var pow = Math.pow;
window.dE76 = function(a, b, c, d, e, f) {
  return Math.sqrt(pow(d - a, 2) + pow(e - b, 2) + pow(f - c, 2))
};

/**
 * Color conversion formulas. Previously I used the d3.js library since they
 * have a fantastic API for this. My first profile showed that d3 had the 
 * biggest performance hit on my code, so I moved the code to local functions.
 * 
 * I didn't test if the d3 functions were optimized by the JiT compiler. I did,
 * however, verify the functions below were optimized properly by the compiler.
 */
function rgbToLab(r, g, b) {
  var xyz = rgbToXyz(r, g, b);
  return xyzToLab(xyz[0], xyz[1], xyz[2]);
}
function rgbToXyz(r, g, b) {
  var _r = (r / 255);
  var _g = (g / 255);
  var _b = (b / 255);

  if (_r > 0.04045) {
    _r = Math.pow(((_r + 0.055) / 1.055), 2.4);
  } else {
    _r = _r / 12.92;
  }

  if (_g > 0.04045) {
    _g = Math.pow(((_g + 0.055) / 1.055), 2.4);
  } else {
    _g = _g / 12.92;
  }

  if (_b > 0.04045) {
    _b = Math.pow(((_b + 0.055) / 1.055), 2.4);
  } else {
    _b = _b / 12.92;
  }

  _r = _r * 100;
  _g = _g * 100;
  _b = _b * 100;

  X = _r * 0.4124 + _g * 0.3576 + _b * 0.1805;
  Y = _r * 0.2126 + _g * 0.7152 + _b * 0.0722;
  Z = _r * 0.0193 + _g * 0.1192 + _b * 0.9505;

  return [X, Y, Z];
}
function xyzToLab(x, y, z) {
  var ref_X = 95.047;
  var ref_Y = 100.000;
  var ref_Z = 108.883;

  var _X = x / ref_X;
  var _Y = y / ref_Y;
  var _Z = z / ref_Z;

  if (_X > 0.008856) {
    _X = Math.pow(_X, (1 / 3));
  } else {
    _X = (7.787 * _X) + (16 / 116);
  }

  if (_Y > 0.008856) {
    _Y = Math.pow(_Y, (1 / 3));
  } else {
    _Y = (7.787 * _Y) + (16 / 116);
  }

  if (_Z > 0.008856) {
    _Z = Math.pow(_Z, (1 / 3));
  } else {
    _Z = (7.787 * _Z) + (16 / 116);
  }

  var CIE_L = (116 * _Y) - 16;
  var CIE_a = 500 * (_X - _Y);
  var CIE_b = 200 * (_Y - _Z);

  return [CIE_L, CIE_a, CIE_b];
}


/**
 * Compute some frames!
 * 
 * Wherever I could spot any code that was reused, I created a variable
 * at the top scope. The functions below seemed to be optimized pretty well already,
 * so surpringly to me, the performance gain here wasn't as large as I would
 * have thought.
 */
var canvas = document.getElementById('canvas-1');
var canvasCtx = canvas.getContext('2d');
var canvasWidth = canvas.width;
var canvasHeight = canvas.height;
var video = document.getElementById('video-1');
var imageData, data32, clampedArray;
var labColor;
var dEScore;
var r, g, b;
var x, y;
var pixel;

/**
 * In an ideal world, computeFrame is called frequently so we don't drop in
 * FPS. A couple things helped here.
 * 
 * 1. requestAnimationFrame: A better, non-blocking, alternative to setInterval.
 * It does a couple things for us. First, it won't steal processing power if you
 * switch tabs. More importantly, if it gets behind in processing, it'll simply
 * jump to the most current processing job instead of lagging behind like setInterval
 * would do. A poor choice if you require every frame to be processed, but
 * perfect for our use case.
 * 
 * 2. Uint32Array - an array that houses 32-bit integers. Array processing in frontend 
 * JavaScript is incredibly costly. We use this in favor of the typical clamped 
 * 8 bit array, which is much larger. Using Uint32Array also gives us the ability
 *  to make shifts in binary to get RGB values. Easy peasy.
 * 
 * 3. For testing the three green values, I wanted to exit as early as possible.
 * Here it was logical to find the most abundant type of green, so we can
 * exit early if we find it first. So in order: we checked for light, medium,
 * then dark greens. So while the three checks would ruin our operation normally,
 * all three aren't called in the majority of cases.
 * 
 * 4. Most importantly, the size of the canvas is at play here. More pixels,
 * Mo' problems, my gramma always said. You could increase the canvas by a factor
 * of even 20% and get noticeable jitter on desktop.
 * 
 * Extra fun tidbit: we could use even dE00 in real time if we had access
 * to the GPU. This business is running on your processor - and that sucks.
 * If this was ported to OpenGL shaders, it would run smooth as butter. Oh
 * well. We love you still, Canvas.
 */
function computeFrame() {
  requestAnimationFrame(computeFrame);

  // Draw video to canvas
  canvasCtx.drawImage(video, 0, 0, canvasWidth, canvasHeight);

  // use Uint32Array for performance
  imageData = canvasCtx.getImageData(0, 0, canvasWidth, canvasHeight);
  data32 = new Uint32Array(imageData.data.buffer);
  clampedArray = new Uint8ClampedArray(data32.buffer)

  // calculate on ever pixel
  for (y = 0; y < canvasHeight; ++y) {
    for (x = 0; x < canvasWidth; ++x) {
      pixel = data32[y * canvasWidth + x];
      r = (pixel) & 0xff;
      g = (pixel >> 8) & 0xff;
      b = (pixel >> 16) & 0xff;

      labColor = rgbToLab(r, g, b);

      // test light green
      dEScore = dE76(
        labColor[0],labColor[1],labColor[2],
        89, -99, 79
      );
      if (dEScore < 70) {
        data32[y * canvasWidth + x] =
          (255 << 24) |
          (0 << 16) |
          (0 << 8) |
          Math.floor(Math.random() * (255 - 1 + 1) + 1);
        continue;
      }
      // test dark green
      dEScore = dE76(
        labColor[0], labColor[1], labColor[2],
        44, -40, 43
      );
      if (dEScore < 24) {
        data32[y * canvasWidth + x] =
          (255 << 24) |
          (0 << 16) |
          (0 << 8) |
          Math.floor(Math.random() * (255 - 1 + 1) + 1);
        continue;
      }
      // test middle green
      dEScore = dE76(
        labColor[0], labColor[1], labColor[2],
        68, -43, 53
      );
      if (dEScore < 13) {
        data32[y * canvasWidth + x] =
          (255 << 24) |
          (0 << 16) |
          (0 << 8) |
          Math.floor(Math.random() * (255 - 1 + 1) + 1);
        continue;
      }
    }
  }
  imageData.data.set(clampedArray);
  canvasCtx.putImageData(imageData, 0, 0);

  /**
   * If you put the last closing bracket an extra line below all other code,
   * you get about a 10% performance gain when working with loops.
   * 
   * Just kidding. That's all I got. Hope you enjoyed!
   */
}