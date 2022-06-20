import express, {Express, Request, Response} from 'express'
import websockets from './src/websockets'
import {version as serverVersion} from './package.json'
import * as gameLifecycle from './src/gameLifecycle'

const app:Express = express()
const port:number = 8101

app.post('/game', (req: Request, res: Response) => {
  res.send({
    gameId: gameLifecycle.createGame()
  })
})

var server = app.listen(port, () => {
  console.log(`The Tic-Tac-Toe server v${serverVersion} listening on port ${port}`)
})

websockets(server);
