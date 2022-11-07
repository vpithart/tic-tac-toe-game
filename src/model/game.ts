import mongoose from 'mongoose'
const { Schema } = mongoose

export type Board = Array<Array<number>>

interface ObjectWithId extends Object {
  id: string
}

const gameSchema = new Schema({
  shortId: { type: String },
  playerA: { type: Number },
  playerB: { type: Number },
  turn: { type: Number, require: false },
  board: { type: [[]]}
}, {
  timestamps: true
})

export default mongoose.model('Game', gameSchema);
