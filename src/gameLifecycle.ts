import crypto from 'crypto';
import PubSub from 'pubsub-js'

const boardSize:Number = 8;

type Game = {
  id: string
  playerA: number | undefined
  playerB: number | undefined
  turn?: string
}

// The Game store TODO store permanently
var games: Game[] = []

export function createGame() {
  const randomString = crypto.randomBytes(4).toString("hex");

  var newGame = {
    id: randomString,
    playerA: undefined,
    playerB: undefined,
  }
  games.push(newGame)

  return newGame.id
}

function recreateGame(id:string):Game {
  const newGame = {
    id: id,
    playerA: undefined,
    playerB: undefined
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

  if (game.playerA === playerId) {
    return 'A'
  }
  if (game.playerB === playerId) {
    return 'B'
  }
  if (game.playerA === undefined) {
    game.playerA = playerId

    PubSub.publish(`game-${gameId}-${playerId}`, { playerName: 'A' });

    if (game.playerB === undefined) {
      PubSub.publish(`game-${gameId}-${playerId}`, { waitingForPeer: true });
    }
    if (game.playerB) {
      PubSub.publish(`game-${gameId}-${game.playerB}`, { waitingForPeer: false, myTurn: true });
      game.turn = 'B';
    }

    return 'A'
  }
  if (game.playerB === undefined) {
    game.playerB = playerId

    PubSub.publish(`game-${gameId}-${playerId}`, { playerName: 'B' });
    PubSub.publish(`game-${gameId}-${game.playerA}`, {waitingForPeer: false, myTurn: true});
    game.turn = 'A';

    return 'B'
  }

  PubSub.publish(`game-${gameId}-${playerId}`, { playerName: null });

  return null
}

export function playerLeft(gameId:string, playerId:number) {
  const game = findGameById(gameId)
  if (!game) return null
  console.log('playerLeft', gameId, 'player', playerId)

  if (game.playerA === playerId) {
    game.playerA = undefined
    if (game.playerB) {
      PubSub.publish(`game-${gameId}-${game.playerB}`, { waitingForPeer: true, myTurn: false });
    }
    game.turn = undefined
  }

  if (game.playerB === playerId) {
    game.playerB = undefined
    if (game.playerA) {
      PubSub.publish(`game-${gameId}-${game.playerA}`, { waitingForPeer: true, myTurn: false });
    }
    game.turn = undefined
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

    if (playerId == game.playerA && game.turn === 'A') {
      game.turn = 'B'
      PubSub.publish(`game-${gameId}-${game.playerA}`, { myTurn: false })
      PubSub.publish(`game-${gameId}-${game.playerB}`, { myTurn: true })
    }

    if (playerId == game.playerB && game.turn === 'B') {
      game.turn = 'A'
      PubSub.publish(`game-${gameId}-${game.playerB}`, { myTurn: false })
      PubSub.publish(`game-${gameId}-${game.playerA}`, { myTurn: true })
    }
  }
}
