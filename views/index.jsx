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
          <title>synthe!</title>
        </head>
        <body>
          <div id="container" style={style.container}></div>
          <script type="text/javascript" src="./client.bundle.js"></script>
        </body>
      </html>
    );
  }
}

module.exports = Content;