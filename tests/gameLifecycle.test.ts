import * as gameLifecycle from '../src/gameLifecycle'

import * as mongoDbStore from '../src/gameStoreMongo'
mongoDbStore.connectMongoDb('mongodb://localhost/tictactoe-test')
gameLifecycle.useGameStore(mongoDbStore)

describe('createGame', () => {
  test('returns 8-character long alphanumeric string', () => {
    let id = gameLifecycle.createGame()
    expect(id).toMatch(/^[a-z0-9]{8}$/)
  })
})
