/** @jsx h */
const { render, h, Component } = require('preact');
const createEncoder = require('./createEncoder');

class EncoderProgress extends Component{

  constructor (props) {
    super(props);
    this.state = {
      frame: 0,
      totalFrames: props.files.length,
      file: null
    };
  }

  componentDidMount () {
    this.encoder = createEncoder(this.props.settings);
    this.canvasContainer.appendChild(this.encoder.canvas);
    this.encoder.encode(
      this.props.files,
      this.onFinish.bind(this),
      this.onProgress.bind(this)
    )
  }

  onFinish () {
    this.props.onFinish();
  }

  onProgress (ev) {
    this.setState({
      frame: (1 + ev.frame),
      totalFrames: ev.totalFrames,
      file: ev.file
    })
  }

  render () {
    return <div class='encoder-progress'>
      <header>
        Encoding {this.state.frame} of {this.state.totalFrames} frames...
      </header>
      <div class='canvas-container' ref={c => { this.canvasContainer = c; }}>
      </div>
    </div>
  }
}

module.exports = EncoderProgress;