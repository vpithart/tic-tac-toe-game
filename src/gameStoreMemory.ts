import crypto from 'crypto';

interface ObjectWithId extends Object {
  id: string
}

var games: ObjectWithId[] = []

export function createGame(newGameStub:Object) {
  const randomString = crypto.randomBytes(4).toString("hex");

  const newGame:ObjectWithId = {
    id: randomString,
    ...newGameStub
  }

  games.push(newGame)

  return newGame.id
}

export function findGameById(id:string):ObjectWithId|undefined {
  const game = games.find((value) => value.id === id)
  return game
}

export function deleteGame(id:string) {
  const gameIdx = games.findIndex((value) => value.id === id)
  games.splice(gameIdx, 1)
}
