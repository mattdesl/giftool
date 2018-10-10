/** @jsx h */
const { render, h, Component } = require('preact');
const Encoder = require('./Encoder');

const App = () => {
  return <main>
    <div class='top'>
      <header>giftool</header>
      <caption>Drag and drop a folder or set of image frames to create a new GIF.</caption>
    </div>
    <Encoder />
  </main>;
};

render(<App />, document.querySelector('#app'))