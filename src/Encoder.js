/** @jsx h */
const { render, h, Component } = require('preact');
const dragDrop = require('drag-drop');
const EncoderProgress = require('./EncoderProgress');

class Encoder extends Component{

  constructor () {
    super();

    let prevSettings;
    let stored = window.localStorage.getItem('settings');
    if (stored) {
      try {
        prevSettings = JSON.parse(stored);
      } catch (_) {
        // Skip err
      }
    }

    if (!prevSettings) {
      prevSettings = {
        dimensions: {
          mode: 'size',
          value: [ 512, 512 ]
        },
        time: {
          mode: 'fps',
          value: 24
        },
        quality: 10
      };
    }
    this.state = {
      encoding: false,
      files: [],
      settings: prevSettings
    };
  }

  onChangeQuality (ev) {
    this.setState({
      settings: {
        ...this.state.settings,
        quality: ev.currentTarget.valueAsNumber
      }
    });
  }

  onChangeFPS (ev) {
    this.setToFPS(ev.currentTarget.valueAsNumber)
  }

  setToFPS (value) {
    this.setState({
      settings: {
        ...this.state.settings,
        time: {
          mode: 'fps',
          value
        }
      }
    });
  }

  onChangeDimensions (index, ev) {
    const prevDimensions = this.state.settings.dimensions.value.slice();
    prevDimensions[index] = ev.currentTarget.valueAsNumber;
    this.setState({
      settings: {
        ...this.state.settings,
        dimensions: {
          mode: 'size',
          value: prevDimensions
        }
      }
    });
  }

  componentDidMount () {
    this.store(this.state);

    dragDrop('#app', (files, pos, fileList, directories) => {
      this.encode(files);
    });
  }

  componentWillUpdate (props, state) {
    this.store(state);
  }

  store (state) {
    window.localStorage.setItem('settings', JSON.stringify(state.settings));
  }

  encode (files) {
    console.log('Encoding', files);
    this.setState({
      files,
      encoding: true
    });
  }
  
  onEncodeCancel () {
    this.setState({
      encoding: false
    });
  }

  onEncodeFinish () {
    this.setState({
      encoding: false
    });
  }
  
  renderSettings () {
    const { settings } = this.state;
    return <div class='settings'>
      <div class='settings-row'>
        <label>Size</label>
        <div class='settings-cell'>
          <div class='size-picker'>
              <input
                  onInput={this.onChangeDimensions.bind(this, 0)}
                  onChange={this.onChangeDimensions.bind(this, 0)}
                  type='number'
                  min='1' max='2048' step='1'
                  value={settings.dimensions.value[0]} />
              <div class='size-separator'>x</div>
              <input
                  onInput={this.onChangeDimensions.bind(this, 1)}
                  onChange={this.onChangeDimensions.bind(this, 1)}
                  type='number'
                  min='1' max='2048' step='1'
                  value={settings.dimensions.value[1]} />
            </div>
        </div>
      </div>
      <div class='settings-row'>
        <label>FPS</label>
        <div class='settings-cell'>
          <div class='fps-picker'>
            <input
                onInput={this.onChangeFPS.bind(this)}
                onChange={this.onChangeFPS.bind(this)}
                type='number'
                min='1' max='60' step='0.01'
                value={settings.time.value} />
            <div class='fps-defaults'>
              <div onClick={() => this.setToFPS(24)}>24</div>
              <div onClick={() => this.setToFPS(25)}>25</div>
              <div onClick={() => this.setToFPS(30)}>30</div>
            </div>
          </div>
        </div>
      </div>
      <div class='settings-row'>
        <label>Quantization</label>
        <div class='settings-cell'>
          <div class='slider'>
            <input
              onInput={this.onChangeQuality.bind(this)}
              onChange={this.onChangeQuality.bind(this)}
              type='range'
              min='1' max='20' step='1'
              value={settings.quality} />
            <div class='quality-label'>{settings.quality}</div>
          </div>
          <div class='quality-info'>Lower number results in better visual quality.</div>
        </div>
      </div>
    </div>
  }

  render () {
    return <div class='encoder-container'>
      <div class='encoder'>
        {this.state.encoding
          ? <EncoderProgress
              settings={this.state.settings}
              files={this.state.files}
              onFinish={this.onEncodeFinish.bind(this)}
              onCancel={this.onEncodeCancel.bind(this)} />
          : this.renderSettings()}
      </div>
    </div>
  }
}

module.exports = Encoder;