import mongoose from 'mongoose'
const { Schema } = mongoose

const mongodbUrl = 'mongodb://localhost/tictactoe-dev';

mongoose.connect(mongodbUrl,function (err) {
   if (err)
    console.error("Error occurred while connecting to DB!")
  else
    console.log("Database connection established successfully")
  }
)

export type Board = Array<Array<number>>

interface ObjectWithId extends Object {
  id: string
}

const gameSchema = new Schema({
  playerA: { type: Number },
  playerB: { type: Number },
  turn: { type: Number, require: false },
  board: { type: [[]]}
})

const GameModel = mongoose.model('Game', gameSchema);

export function createGame(newGameStub:any) {

  const newGame = new GameModel()

  newGame.playerA = newGameStub.playerA
  newGame.playerB = newGameStub.playerB
  newGame.board = newGameStub.board

  newGame.save()

  return newGame._id
}

export async function findGameById(id:string):Promise<ObjectWithId|undefined> {
  const game = await GameModel.findById(id).exec()
  if (game !== null)
    return <ObjectWithId>game
  else
    return undefined
}

export async function saveGameState(game:any) {
  const g = await GameModel.findById(game.id).exec()
  if (g === null) return

  g.playerA = game.playerA
  g.playerB = game.playerB
  g.turn = game.turn
  g.board = game.board

  g.save()
}

export function deleteGame(id:string) {
  GameModel.findByIdAndDelete(id).exec()
}
