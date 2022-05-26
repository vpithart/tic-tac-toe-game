import { WebSocketServer } from 'ws'
import {Express, Request, Response} from 'express'
import { Server } from 'http';
import {version as serverVersion} from '../package.json';

export default (expressServer: Server) => {
  const websocketServer = new WebSocketServer({
    noServer: true,
    path: "/websockets/game",
  });

  expressServer.on("upgrade", (request: Request, socket, head) => {
    console.log(`WS upgrade from ${request?.socket?.remoteAddress} port ${request?.socket?.remotePort}`);

    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      websocketServer.emit("connection", websocket, request);
    });
  });

  websocketServer.on('connection',(websocketConnection, connectionRequest) => {
      const params = connectionRequest?.url?.split('?')[1];
      console.log(`WS connection at ${connectionRequest?.url} from ${connectionRequest?.socket?.remoteAddress} port ${connectionRequest?.socket?.remotePort} game ${params}`);

      websocketConnection.on("message", (message) => {
        const parsedMessage = JSON.parse(message.toString());
        console.log('WS message', parsedMessage);
      });

      websocketConnection.send(`Hello! This is the Tic-Tac-Toe server v${serverVersion}`)
    }
  );

  websocketServer.on("close", () => {
    console.log("WS close")
  })

  websocketServer.on("error", (e) => {
    console.log("WS error", e)
  })

  return websocketServer;
};
