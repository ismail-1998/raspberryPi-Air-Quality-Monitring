const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

const Gpio = require("onoff").Gpio;

var DHT = require("node-dht-sensor"); // (white wire)


const mq2 = new Gpio(18, "in"); // (blue wire)
const alarm = new Gpio(17, "out"); // (gray wire)

const fan = new Gpio(27, "out"); // (green wire)


let temperatureMess = "";
let humidityMess = "";
let purityMess = "";

app.set("views", "Views");
app.use(express.static("Views"));

function loop() {

  // MQ2 Sensor (blue wire)
  mq2.read((err, value) => {
    if (err) {
      throw err;
      
    }

    if (value) {
      purityMess = "There is something dangerous";
      alarm.writeSync(1);
      //console.log(value);
    } else {
      purityMess = "All is Well";
      alarm.writeSync(0);
      //console.log(value);
    }
  });


  // DHT (white wire)
  let { temperature, humidity } = DHT.read(11, 4);

  if (temperature > 30) {
    temperatureMess = "The Air is Hot !";
    fan.writeSync(1);
  } else {
    temperatureMess = "The Air is Good ";
    fan.writeSync(0);
  }


  if (humidity >= 50) {
    humidityMess = "The Humiduty is so High !";
  } else {
     humidityMess = "The humidity is Good";
  }

  //console.log(temperature, humidity);

  io.on("connection", (socket) => {
    console.log("websocket connection open !");

    socket.emit("temperature", { temperature: temperature });
    socket.emit("temperatureMess", { temperatureMess: temperatureMess });

    socket.emit("humidity", { humidity: humidity });
    socket.emit("humidityMess", { humidityMess: humidityMess });

    socket.emit("purityMess", { purityMess: purityMess });
  });
}


app.get("/", (req, res) => {
  return res.render("index.html");
});

setInterval(loop, 5000);

server.listen(5000);
