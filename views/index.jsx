const React = require('react');

class Content extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const style = {
      container: {
        width: '80%',
        display: 'flex',
        marginLeft: '10%',
      }
    };
    return (
      <html>
        <head>
          <title>Conglitch!</title>
        </head>
        <body>
          <div id="container" style={style.container}></div>
          <canvas id="c" width="512" height="512"></canvas>
          <script type="text/javascript" src="./zlib.min.js"></script>
          <script type="text/javascript" src="./client.bundle.js"></script>
        </body>
      </html>
    );
  }
}

module.exports = Content;