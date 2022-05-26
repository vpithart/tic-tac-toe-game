import * as gameLifecycle from '../src/gameLifecycle'

describe('createGame', () => {
  test('returns 8-character long string', () => {
    let id = gameLifecycle.createGame()
    expect(id).toMatch(/^[a-f0-9]{8}$/)
  })
})
