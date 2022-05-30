import crypto from 'crypto';
import PubSub from 'pubsub-js'

const boardSize:Number = 8;

type Board = Array<Array<number>>

type Game = {
  id: string
  playerA: number | undefined
  playerB: number | undefined
  turn?: number
  board: Board
}

// The Game store TODO store permanently
var games: Game[] = []

function emptyBoard():Board {
  let newBoard:Board = [[]]

  for (let i = 0; i < boardSize; i++) {
    newBoard[i] = []
    for (let j = 0; j < boardSize; j++) {
      newBoard[i][j] = 0
    }
  }

  return newBoard
}
export function createGame() {
  const randomString = crypto.randomBytes(4).toString("hex");

  var newGame = {
    id: randomString,
    playerA: undefined,
    playerB: undefined,
    board: emptyBoard()
  }
  games.push(newGame)

  return newGame.id
}

function recreateGame(id:string):Game {
  const newGame = {
    id: id,
    playerA: undefined,
    playerB: undefined,
    board: emptyBoard()
  }
  games.push(newGame)
  return newGame
}

function findGameById(id:string):Game {
  const game = games.find((value) => value.id === id)
  return game || recreateGame(id)
}

function deleteGame(id:string) {
  const gameIdx = games.findIndex((value) => value.id === id)
  games.splice(gameIdx, 1)
}

export function assignPlayer(gameId:string, playerId:number):number|null {
  let game = findGameById(gameId)
  console.log('assignPlayer', playerId, 'to game', gameId)

  PubSub.publish(`game-${gameId}`, { board: game.board });

  let iAm:number|undefined

  if (game.playerA === playerId) {
    iAm = 1
    PubSub.publish(`game-${gameId}-${playerId}`, { playerNum: iAm });
  }
  else if (game.playerB === playerId) {
    iAm = 2
    PubSub.publish(`game-${gameId}-${playerId}`, { playerNum: iAm });
  }
  else if (game.playerA === undefined) {
    iAm = 1
    game.playerA = playerId
    PubSub.publish(`game-${gameId}-${playerId}`, { playerNum: iAm });

    if (game.playerB === undefined) {
      PubSub.publish(`game-${gameId}-${playerId}`, { waitingForPeer: true, turn: null });
    }
    if (game.playerB) {
      game.turn = 2;
      PubSub.publish(`game-${gameId}-${game.playerB}`, { waitingForPeer: false, turn: game.turn });
    }

  }
  else if (game.playerB === undefined) {
    iAm = 2
    game.playerB = playerId
    game.turn = 2;

    PubSub.publish(`game-${gameId}-${playerId}`, { playerNum: iAm, turn: 2 });
    PubSub.publish(`game-${gameId}-${game.playerA}`, {waitingForPeer: false, turn: 2});
  }

  if (iAm) {
    return iAm
  }

  PubSub.publish(`game-${gameId}-${playerId}`, { playerNum: null, turn: game.turn });

  return null
}

export function playerLeft(gameId:string, playerId:number) {
  const game = findGameById(gameId)
  if (!game) return null
  console.log('playerLeft', gameId, 'player', playerId)

  if (game.playerA === playerId) {
    game.turn = undefined
    game.playerA = undefined
    if (game.playerB) {
      PubSub.publish(`game-${gameId}-${game.playerB}`, { waitingForPeer: true, turn: null });
    }
  }

  if (game.playerB === playerId) {
    game.playerB = undefined
    game.turn = undefined
    if (game.playerA) {
      PubSub.publish(`game-${gameId}-${game.playerA}`, { waitingForPeer: true, turn: null});
    }
  }

  setTimeout(() => deleteAbandonedGame(gameId), 60000)
}

function deleteAbandonedGame(gameId:string) {
  const game = findGameById(gameId)
  if (!game) return
  if (game.playerA === undefined && game.playerB === undefined) {
    deleteGame(gameId)
  }
}

export function processGameMessage(gameId:string, playerId:number, gameEvent:any) {
  console.log(`⚙️ processGameMessage ${gameId} ${playerId}:`, gameEvent)
  const game = findGameById(gameId)

  if (gameEvent.event === 'touch') {
    if (!game.playerA || !game.playerB) return

    if (playerId == game.playerA && game.turn === 1) {
      let tickIsValid = recordNewTick(game.board, 1, gameEvent.data.coords[0], gameEvent.data.coords[1])
      if (tickIsValid) {
        game.turn = 2
      }
    }

    if (playerId == game.playerB && game.turn === 2) {
      let tickIsValid = recordNewTick(game.board, 2,  gameEvent.data.coords[0], gameEvent.data.coords[1])
      if (tickIsValid) {
        game.turn = 1
      }
    }

    PubSub.publish(`game-${gameId}`, { board: game.board, turn: game.turn });
  }
}

function recordNewTick(board: Board, playerNum:number, x:number, y:number):boolean {
  if (board[x][y] !== 0) return false
  board[x][y] = playerNum
  return true
}
