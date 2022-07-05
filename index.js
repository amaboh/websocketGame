const http = require("http");
const { resourceLimits } = require("worker_threads");

const app = require("express")();

app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));
app.listen(9091, () => console.log("listening on http port 9091"));

const httpServer = http.createServer();
const webSocketServer = require("websocket").server;

httpServer.listen(9090, () => {
  console.log("listening on port 9090");
});

// hashmap clients
const clients = {};
const games = {};

const wsServer = new webSocketServer({
  httpServer: httpServer,
});

wsServer.on("request", (request) => {
  // connect

  const connection = request.accept(null, request.origin);
  connection.on("open", () => console.log("Opened!"));
  connection.on("close", () => console.log("Closed!"));
  connection.on("message", (message) => {
    const result = JSON.parse(message.utf8Data);
    // I have received a message from the client
    // a user want to crate a new game
    if (result.method === "create") {
      const clientId = result.clientId;
      const gameId = guid();
      games[gameId] = {
        id: gameId,
        balls: 20,
        "clients" : []
      };

      const payLoad = {
        method: "create",
        game: games[gameId],
      };

      const con = clients[clientId].connection;
      con.send(JSON.stringify(payLoad));
    }

    // a client want to join the game
    if(result.method === "join"){
      const clientId = result.clientId;;
      const gameId = result.gameId;
      const game = games[gameId];
      if(game.clients.length >= 3){
        // sorry max players reach
        return;
      }
      const color= {"0": "Red", "1": "Green", "2": "Blue"}[game.clients.length]

      game.clients.push({
        "clientId" : clientId,
        "color" : color
      })

      const payLoad = {
        "method" : "join",
        "game": game,
      }

      game.clients.forEach(client =>{
        clients[client.clientId].connection.send(JSON.stringify(payLoad ));
      })
    }
  });

  // generate a new clientId
  const clientId = guid();
  clients[clientId] = {
    connection: connection,
  };

  const payLoad = {
    method: "connect",
    clientId: clientId,
  };

  connection.send(JSON.stringify(payLoad));
});

function S4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

// then to call it, plus stitch in '4' in the third group
const guid = () =>
  (
    S4() +
    S4() +
    "-" +
    S4() +
    "-4" +
    S4().substr(0, 3) +
    "-" +
    S4() +
    "-" +
    S4() +
    S4() +
    S4()
  ).toLowerCase();
