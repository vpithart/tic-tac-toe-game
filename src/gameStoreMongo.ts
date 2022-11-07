import mongoose from 'mongoose'
import GameModel from './model/game'

export function connectMongoDb(url:string) {
  mongoose.connect(url, (err) => {
    if (err) {
      console.error(`Error occurred while connecting to MongoDB! (url=${url})`)
      console.error(err)
    }
  })
}

/* 8 characters long random string: 'ywi0s1qa' 'jhxrib83' etc. */
function randomShortId(): string {
  return (Math.random() + 1).toString(36).slice(2,10).padStart(8, '0');
}

export function createGame(newGameStub:any): string {

  const newGame = new GameModel()

  newGame.shortId = randomShortId();
  newGame.playerA = newGameStub.playerA
  newGame.playerB = newGameStub.playerB
  newGame.board = newGameStub.board

  newGame.save()

  return newGame.shortId.toString()
}

export async function findGameById(id:string):Promise<any|undefined> {
  const game = await GameModel.findOne({shortId: id})
  if (game !== null)
    return game
  else
    return undefined
}

export async function saveGameState(game:any) {
  const g = await GameModel.findOne({shortId: game.shortId})
  if (g === null) return

  g.playerA = game.playerA
  g.playerB = game.playerB
  g.turn = game.turn
  g.board = game.board
  await g.save()
}

export function deleteGame(id:string) {
  GameModel.deleteOne({shortId: id}).exec()
}
