var express = require('express');
var app = express();
const morgan = require('morgan');
var moment = require('moment');
const http = require("http");
const socketIo = require("socket.io");
const axios = require("axios");
const port = process.env.PORT || 4001;
const path = require('path');
const index = require("./routes/index");
var redis = require('redis');
const {promisify} = require('util');

//Settings
app.set('port', process.env.PORT || 3000 );
var client = redis.createClient();
const getAsync = promisify(client.get).bind(client); // Get Redis value with promises

// Middlewares
//app.use(morgan('dev'));
app.use(express.json());

//Routes

app.use('/api', index);
// Static files
app.use(express.static(path.join(__dirname, 'dist')));

// Websocket config: socket.io

const server = http.createServer(app);
const io = socketIo(server); // 

let interval, interval2;
io.on("connection", socket => {  //Incoming connections
  console.log("New client connected");
  if (interval || interval2) {
    clearInterval(interval);
    clearInterval(interval2);
  }
  requestAPIWeather();
  test(socket);
  interval = setInterval(() => requestAPIWeather(), 9987 ); //  //getApiAndEmit(socket);
  interval2 = setInterval(() => test(socket), 10000); // 10 seconds
  socket.on("disconnect", () => {
    clearInterval(interval);
    clearInterval(interval2);
    console.log("Client disconnected");
  });
});



const requestAPIWeather = async () =>{
  var err=0.05 ;
  while(err<0.4) {
    try {  
        err= Math.random(0,1);
        console.log("err ", err);
        if(err<0.4) throw new Error ("API request fail with an error value ");
        var day = moment().format('HH:mm:ss');
        var data=[{city:'Santiago', temp:Math.random(0,1), time:day},
        {city:'Zurich', temp:Math.random(0,1), time:day},
        {city:'Auckland', temp:Math.random(0,1), time:day},
        {city:'Sydney', temp:Math.random(0,1), time:day},
        {city:'Londres', temp:Math.random(0,1), time:day},
        {city:'Georgia', temp:Math.random(0,1), time:day} ];
        client.set("data", JSON.stringify(data));
    } catch (error){
        const errorTime = moment().unix();
        console.error(errorTime+" "+error.message+err);
        client.hmset("api.errors", errorTime, error.message+err );
        continue;
    }
  }
};

const test = async socket =>{
  try {
     const data = await getAsync('data');
    console.log(JSON.parse(data));
    socket.emit("FromAPI",JSON.parse(data));
  } catch (error) {
    console.error(`Error: ${error.code}`);
  } };

const getApiAndEmit = async socket => {
  try {
    const res = await axios.get(
      "https://api.darksky.net/forecast/037d95ba42ba238fe6b508947ce45a0f/-33.4691199,-70.641997?units=si&exclude=minutely,hourly,daily,alerts,flags"
    ); // Getting the data from DarkSky
    var dateString = moment.unix(res.data.currently.time).format("DD/MM/YYYY HH:mm:ss");
    var data={temp:res.data.currently.temperature,
              time: dateString }
    socket.emit("FromAPI",data); // Emitting a new message. It will be consumed by the client
  } catch (error) {
    console.error(`Error: ${error.code}`);
  }
};

client.on("error", function (err) { //Start Redis client
  console.log("Error " + err);
});

server.listen(port,() => console.log(`Listening on port ${port}`));
app.listen(app.get('port'), () => {
  console.log(`Server on port ${app.get('port')}` );
  });