import { WebSocketServer } from 'ws';

export default (expressServer) => {
  const websocketServer = new WebSocketServer({
    noServer: true,
    path: "/websockets/game",
  });

  expressServer.on("upgrade", (request, socket, head) => {
    websocketServer.on(
      "connection",
      function connection(websocketConnection, connectionRequest) {
        const [_path, params] = connectionRequest?.url?.split("?");
        console.log(`WS connection from game ${params}`);

        websocketConnection.on("message", (message) => {
          const parsedMessage = JSON.parse(message);
          console.log('WS message', parsedMessage);
        });
      }
    );

    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      websocketServer.emit("connection", websocket, request);
    });
  });

  return websocketServer;
};
