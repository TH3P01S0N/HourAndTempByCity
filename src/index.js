import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import socketIOClient from "socket.io-client";

class App extends Component {
  constructor() {
    super();
    this.state = {
      response: false,
      endpoint: "http://127.0.0.1:4001"
    };
  }
  componentDidMount() {
    const { endpoint } = this.state;
    const socket = socketIOClient(endpoint);
    socket.on("FromAPI", data =>{
      console.log("data ", data);
      this.setState({ response: data })});
  }
  render() {
    const { response } = this.state;
    return (
      <div  >
        <nav className="light-blue darken-4" >
            <div className="container">
                <a className="brand-logo" hred="/" >Hora y temperatura por ciudades</a>
            </div>
        </nav>
        <div >
          
            {response
              ? 
              <div className="row">
                {response.map(item =>
                  <div className="col s12 l2 m6" key={item.city}>
                    <div className="card">
                      <div className="card-content">
                      <div className="container">
                        <span className="card-title">{item.city}</span>
                          <p >Hora: {item.time}</p>
                          <p>Temperatura: {item.temp} °C</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                </div>
              : <p>Loading...</p>}
          
        </div>
      </div>
    )
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root'));