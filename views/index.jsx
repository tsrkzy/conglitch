const React = require('react');

class Content extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <html>
        <head>
          <title>conglitch</title>
        </head>
        <body>
          <div id="smoke"></div>
          <div id="container"></div>
          <canvas id="c"></canvas>
          <script type="text/javascript" src="./client.bundle.js"></script>
        </body>
      </html>
    );
  }
}

module.exports = Content;