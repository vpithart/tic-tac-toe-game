import {WebSocketServer, WebSocket} from 'ws'
import {Request} from 'express'
import {Server} from 'http';
import {version as serverVersion} from '../package.json';

export default (expressServer: Server) => {
  const websocketServer = new WebSocketServer({
    noServer: true,
    path: "/websockets/game",
  });

  expressServer.on("upgrade", (request: Request, socket, head) => {
    console.log(`WS upgrade at ${request?.url} from ${request?.socket?.remoteAddress} port ${request?.socket?.remotePort}`);

    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      websocketServer.emit("connection", websocket, request);
    });
  });

  websocketServer.on('connection',(websocketConnection, connectionRequest) => {
    const params = connectionRequest?.url?.split('?')[1];
    console.log(`WS connection at ${connectionRequest?.url} from ${connectionRequest?.socket?.remoteAddress} port ${connectionRequest?.socket?.remotePort} game ${params} user-agent [${connectionRequest.headers['user-agent']}]`);

    let theSlug = `${connectionRequest?.url}:${Math.random()}`;
    let timeoutTimer: any;

    websocketConnection.on("message", (message) => {
      const parsedMessage = JSON.parse(message.toString());
      console.log(`WS message @[${theSlug}]`, parsedMessage);
      clearTimeout(timeoutTimer)
      timeoutTimer = setTimeout(() => shutdownInactive(websocketConnection), 330e3)


    });

    websocketConnection.on('close', (e) => {
      console.log(`WS closed @[${theSlug}]`)
      clearTimeout(timeoutTimer)
    })

    websocketConnection.send(`Hello! This is the Tic-Tac-Toe server v${serverVersion}`)

    function shutdownInactive(wsc: WebSocket) {
      console.log(`WS no data received timeout @[${theSlug}]`)
      wsc.close()
    }

  });

  return websocketServer;
};
