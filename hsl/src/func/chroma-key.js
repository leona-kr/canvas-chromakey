/*
 출처 : https://codepen.io/njmcode/pen/RNVeyw
 */
class ChromaKey{
  constructor(){
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.timer = null;
  }

  start($video, $canvas) {
    this.video = $video;
    this.canvas = $canvas;
    this.width = $video.width;
    this.height = $video.height;
    this.openMedia();
  }

  stop(){
    clearTimeout(this.timer);
  }

  openMedia(){
    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {width:this.width, height:this.height}
    }).then(stream=>{
      this.video.srcObject = stream;
      this.ctx = this.canvas.getContext('2d');
      this.timer = window.setTimeout(()=>{
        this.drawCanvas();
      },200);
    }).catch(err=>{
      console.log(err)
    });
  }

  drawCanvas(){
    this.ctx.drawImage(this.video,0,0,this.width,this.height);
    this.getCanvasData();
  }

  getCanvasData(){
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const d = ctx.getImageData(0,0,w,h).data;

    const isGreen = hsl => {
      const chromaRange = [100,160];
      return (hsl[0]*360 > chromaRange[0] && hsl[0]*360 < chromaRange[1]);
    };
    const rgb2hsl = (r,g,b) => {
      r = r/255;
      g = g/255;
      b = b/255;
    
      var max = Math.max(r, g, b), min = Math.min(r, g, b);
      var h, s, l = (max + min) / 2;
    
      if (max === min) {
        h = s = 0; // achromatic
      } else {
        var d = max - min;
        s = (l > 0.5 ? d / (2 - max - min) : d / (max + min));
        switch(max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
          default:
            break;
        }
        h /= 6;
      }
    
      return [h, s, l];
    };

    for(let y = 0; y<h ; y++){
      for(let x = 0; x<w ; x++){
        // get rgb of current pixel and calculate hue
        var px = (y * (w * 4)) + x * 4,
        r = d[px], g = d[px+1], b = d[px+2],
        hsl = rgb2hsl(r,g,b);

        if(!isGreen(hsl)) {
          // Draw non-green pixels of the original image
          ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',1)';
          ctx.fillRect(x,y,1,1);
        } else {
          // Draw white in place of green pixels
          ctx.fillStyle = 'rgba(255,255,255,1)';
          // ctx.fillStyle = 'rgba(' + bg[px] + ',' + bg[px+1] + ',' + bg[px+2] + ',1)';
          ctx.fillRect(x,y,1,1);
        }
      }
    }
  }
}

const chromakey = new ChromaKey();

export default chromakey;