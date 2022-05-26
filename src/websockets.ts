import { WebSocketServer } from 'ws'
import {Express, Request, Response} from 'express'
import { Server } from 'http';

export default (expressServer: Server) => {
  const websocketServer = new WebSocketServer({
    noServer: true,
    path: "/websockets/game",
  });


  expressServer.on("upgrade", (request: Request, socket, head) => {
    websocketServer.on(
      "connection",
      function connection(websocketConnection, connectionRequest) {
        const params = connectionRequest?.url?.split("?")[1];
        console.log(`WS connection from game ${params}`);

        websocketConnection.on("message", (message) => {
          const parsedMessage = JSON.parse(message.toString());
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
