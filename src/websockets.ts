import {WebSocketServer, WebSocket} from 'ws'
import {Request} from 'express'
import {Server} from 'http';
import {version as serverVersion} from '../package.json';
import {assignPlayer, playerLeft, processGameMessage} from './gameLifecycle';
import PubSub from 'pubsub-js'

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

  /*
    /websockets/game?<gameId>,<playerId>
    /websockets/game?abcd12xy,5563137827197961
  */
   websocketServer.on('connection',(websocketConnection, connectionRequest) => {
    const params = connectionRequest?.url?.split('?')[1];
    const parts = params?.split(',')
    if (parts === undefined || parts.length !== 2) {
      websocketConnection.send(`Invalid URL parameters [${params}], bye.`)
      websocketConnection.close()
      return
    }

    const gameId:string = parts[0]
    const playerId:number = Number(parts[1])
    var subscriptionToken1: string
    var subscriptionToken2: string

    console.log(`WS connection at ${connectionRequest?.url} from ${connectionRequest?.socket?.remoteAddress} port ${connectionRequest?.socket?.remotePort} game ${gameId} user-agent [${connectionRequest.headers['user-agent']}]`);

    if (gameId?.length !== 8) {
      websocketConnection.send(`Invalid gameid, bye.`)
      websocketConnection.close()
      return
    }

    websocketConnection.send(`Hello! This is the Tic-Tac-Toe server v${serverVersion}`)

    subscriptionToken1 = PubSub.subscribe(`game-${gameId}`, (topic, data) => {
      websocketConnection.send(JSON.stringify(data))
    });

    subscriptionToken2 = PubSub.subscribe(`game-${gameId}-${playerId}`, (topic, data) => {
      websocketConnection.send(JSON.stringify(data))
    });

    assignPlayer(gameId, playerId)

    let timeoutTimer: any;

    websocketConnection.on("message", (message) => {
      const parsedMessage = JSON.parse(message.toString());
      console.log(`WS message @[${gameId}] pl[${playerId}]`, parsedMessage);
      clearTimeout(timeoutTimer)
      timeoutTimer = setTimeout(() => shutdownInactive(websocketConnection), 330e3)

      processGameMessage(gameId, playerId, parsedMessage)
    });

    websocketConnection.on('close', (e) => {
      console.log(`WS closed @[${gameId}] pl[${playerId}]`)
      clearTimeout(timeoutTimer)

      playerLeft(gameId, playerId)
      PubSub.unsubscribe(subscriptionToken1)
      PubSub.unsubscribe(subscriptionToken2)
    })

    function shutdownInactive(wsc: WebSocket) {
      console.log(`WS no data received timeout @[${gameId}] pl[${playerId}]`)
      wsc.close()
    }

  });

  return websocketServer;
};
