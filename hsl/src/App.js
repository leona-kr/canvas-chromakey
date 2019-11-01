import React from 'react';
import './App.css'
// import service from './func/service.js';
import chromakey from './func/chroma-key'

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
     playOn: false 
    }
  }
  start() {
    // service.start();
    console.log('video start');
    chromakey.start(this.video, this.canvas);
    this.setState({
      playOn: true
    });
  }

  stop() {
    chromakey.stop();
    this.setState({
      playOn: false
    });
  }

  snap() {
    chromakey.drawCanvas();
  }

  getCanvasData() {
    chromakey.getCanvasData();
  }

  handleColor(e) {
    console.log(e.target.value)
  }

  render(){
    return (
      <div className="App">
        <button type="button"
          disabled={this.state.playOn?"disabled":null}
          onClick={this.start.bind(this)}>Start</button>
        <button type="button"
          disabled={this.state.playOn?null:"disabled"}
          onClick={this.stop.bind(this)}>Stop</button>
        <button type="button"
          disabled={this.state.playOn?null:"disabled"}
          onClick={this.snap}>Snap</button>
        <button type="button"
          onClick={this.getCanvasData}>Get Data</button>
        
        <div className="input-container">
          <input type="color" onChange={this.handleColor}/>
        </div>

        <div className="video-container">
          <video width="320" height="240"
            autoPlay
            ref={node=>(this.video = node)}
          ></video>
        </div>

        <div className="canvas-container">
          <canvas width="320" height="240"
            ref={node=>(this.canvas = node)}
          ></canvas>
        </div>
      </div>
    );
  }
}

export default App;
