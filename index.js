var express = require('express');
var app = express();
//const morgan = require('morgan');
var moment = require('moment');
var moment = require('moment-timezone');
const http = require("http");
const socketIo = require("socket.io");
const axios = require("axios");
const port = process.env.PORT || 4001;
const path = require('path');
const index = require("./routes/index");
var redis = require('redis');
const {promisify} = require('util');
const coords = require("./coordinates.js");
const apikey = require("./apikey");
const uriweather = "https://api.darksky.net/forecast/";
const uriweather2 = "?units=si&exclude=minutely,hourly,daily,alerts,flags";

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

// Save coords in Redis
client.set("coords", JSON.stringify(coords));

// Websocket config: socket.io

const server = http.createServer(app);
const io = socketIo(server); // 

let interval, interval2;
io.on("connection", socket => {  //Incoming connections
  console.log("New client connected");
  requestAPIWeather();
  refreshFrontend(socket);
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
        const coordinates =JSON.parse(await getAsync('coords'));
        const sant = await axios.get(uriweather+apikey+coordinates[0]+uriweather2);
        const zur = await axios.get(uriweather+apikey+coordinates[1]+uriweather2);
        const auk = await axios.get(uriweather+apikey+coordinates[2]+uriweather2);
        const syd = await axios.get(uriweather+apikey+coordinates[3]+uriweather2);
        const lond = await axios.get(uriweather+apikey+coordinates[4]+uriweather2);
        const geor = await axios.get(uriweather+apikey+coordinates[5]+uriweather2);
        var data=[
          {city:'Santiago', temp:sant.data.currently.temperature, time:moment().format("HH:mm:ss")},
        {city:'Zurich', temp:zur.data.currently.temperature, time:moment().add(5,'hour').format("HH:mm:ss")},
        {city:'Auckland', temp:auk.data.currently.temperature, time:moment().add(16,'hour').format("HH:mm:ss")},
        {city:'Sydney', temp:syd.data.currently.temperature, time:moment().add(13,'hour').format("HH:mm:ss")},
        {city:'Londres', temp:lond.data.currently.temperature, time:moment().add(5,'hour').format("HH:mm:ss")},
        {city:'Georgia', temp:geor.data.currently.temperature, time:moment().subtract(1,'hour').format("HH:mm:ss")} ];
        client.set("data", JSON.stringify(data));
    } catch (error){
        const errorTime = moment().unix();
        console.error(errorTime+" "+error.message+err);
        client.hmset("api.errors", errorTime, error.message+err );
        continue;
    }
  }
};

const refreshFrontend = async socket =>{
  try {
     const data = await getAsync('data'); //Get redis data
    console.log(JSON.parse(data)); //Parse data to JSON format
    socket.emit("FromAPI",JSON.parse(data)); //Send JSON to Frontend
  } catch (error) {
    console.error(`Error: ${error.code}`);
  } };



client.on("error", function (err) { //Start Redis client
  console.log("Error " + err);
});

server.listen(port,() => console.log(`Listening on port ${port}`));
app.listen(app.get('port'), () => {
  console.log(`Server on port ${app.get('port')}` );
  });