import crypto from 'crypto';
import PubSub from 'pubsub-js'

const boardSize:Number = 8;
const A:string = 'X'
const B:string = 'O'

type Board = Array<Array<string>>

type Game = {
  id: string
  playerA: number | undefined
  playerB: number | undefined
  turn?: string
  board: Board
}

// The Game store TODO store permanently
var games: Game[] = []

function emptyBoard():Board {
  let newBoard:Board = [[]]

  for (let i = 0; i < boardSize; i++) {
    newBoard[i] = []
    for (let j = 0; j < boardSize; j++) {
      newBoard[i][j] = ''
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

export function assignPlayer(gameId:string, playerId:number):string|null {
  let game = findGameById(gameId)
  console.log('assignPlayer', playerId, 'to game', gameId)

  PubSub.publish(`game-${gameId}`, { board: game.board });

  let iAm:string|undefined

  if (game.playerA === playerId) {
    iAm = A
  }
  else if (game.playerB === playerId) {
    iAm = B
  }
  else if (game.playerA === undefined) {
    game.playerA = playerId

    if (game.playerB === undefined) {
      PubSub.publish(`game-${gameId}-${playerId}`, { waitingForPeer: true, turn: null });
    }
    if (game.playerB) {
      game.turn = B;
      PubSub.publish(`game-${gameId}-${game.playerB}`, { waitingForPeer: false, turn: game.turn });
    }

    iAm = A
  }
  else if (game.playerB === undefined) {
    game.playerB = playerId

    game.turn = A;
    PubSub.publish(`game-${gameId}-${game.playerA}`, {waitingForPeer: false, turn: game.turn});

    iAm = B
  }

  if (iAm) {
    PubSub.publish(`game-${gameId}-${playerId}`, { playerName: iAm });
    return iAm
  }

  PubSub.publish(`game-${gameId}-${playerId}`, { playerName: null, turn: game.turn });

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

    if (playerId == game.playerA && game.turn === A) {
      let tickIsValid = recordNewTick(game.board, A, gameEvent.data.coords[0], gameEvent.data.coords[1])
      if (tickIsValid) {
        game.turn = B
      }
    }

    if (playerId == game.playerB && game.turn === B) {
      let tickIsValid = recordNewTick(game.board, B,  gameEvent.data.coords[0], gameEvent.data.coords[1])
      if (tickIsValid) {
        game.turn = A
      }
    }

    PubSub.publish(`game-${gameId}`, { board: game.board, turn: game.turn });
  }
}

function recordNewTick(board: Board, playerTag:string, x:number, y:number):boolean {
  if (board[x][y] !== '') return false
  board[x][y] = playerTag
  return true
}
