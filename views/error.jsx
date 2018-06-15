const React = require('react');

class ErrorPage extends React.Component{
  render(){
    return (
      <div className="contents">
        <h1>{this.props.message}</h1>
        <h2>{this.props.error.status}</h2>
        <h3></h3>
      </div>
    )
  }
}

module.exports = ErrorPage;