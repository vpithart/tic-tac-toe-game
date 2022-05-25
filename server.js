import express from 'express'
import websockets from './src/websockets.js';
import * as gameLifecycle from './src/gameLifecycle.js'

const app = express()
const port = 8101

app.post('/game', (req, res) => {
  res.send({
    gameId: gameLifecycle.createGame()
  })
})

var server = app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

websockets(server);
