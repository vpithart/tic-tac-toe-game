<template>
  <section id="board" class="mx-auto limited-width" :class="{inactive: !socketConnected}">
    <TheBoard :rows="board" :myTurn="myTurn" :myName="playerName" @touch="boardInteraction"/>
  </section>
  <section class="mx-auto limited-width">
    <div v-if="!socketConnected" role="alert" class="alert alert-warning">🚫 trying to connect ☁️</div>
    <p>
      &nbsp;
      Game ID {{ $route.params.id }}
      <span v-if="initialized">
        &nbsp;
        <span v-if="playerName">player {{playerName}}</span>
        <br>
        <span v-if="canIPlay === false">
          observing the game
          <span v-if="turn">- player {{turn}} on turn</span>
        </span>

        <span v-else>
          <span v-if="waitingForPeer">
            🔎 waiting for peer
          </span>
          <span v-else>
            <div v-if="myTurn" class="alert alert-primary">▶️ It's your turn. Play!</div>
            <div v-else class="alert alert-secondary">⏳ wait</div>
          </span>
        </span>
      </span>
    </p>
    <button v-if="canIPlay" type="button" class="btn btn-outline-danger" @click="leaveGame()">leave the game</button>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import TheBoard from './TheBoard.vue';

export default defineComponent({
  name: 'TheGame',
  components: {
    TheBoard
  },
  props: {
    id: String
  },
  data() {
    return {
      socketAddress: '',
      socketConnected: false as boolean,
      theSocket: {} as WebSocket,
      reconnectTimer: NaN as number,
      keepaliveTimer: NaN as number,
      initialized: false as boolean,
      waitingForPeer: false as boolean,
      canIPlay: false as boolean,
      playerName: null as unknown as string,
      turn: undefined as string|undefined,
      myTurn: false as boolean,
      board: [] as Array<Array<string>>,
    }
  },
  methods: {
    boardInteraction(coords:Array<number>) {
      console.log('touch');
      if (this.canIPlay && this.myTurn) {
        this.sendEvent('touch', {coords: coords})
      }
    },
    leaveGame() {
      if (confirm('leave the game?'))
      {
        this.$router.push('/')
      }
    },
    setupWebsocket() {
      this.socketAddress = 'ws'
      if (window.location.protocol === 'https:') this.socketAddress += 's'
      this.socketAddress += '://'
      this.socketAddress += window.location.host
      this.socketAddress += '/api/websockets'
      this.socketAddress += '/game?' + this.$route.params.id
      this.socketAddress += ',' + this.myPlayerId()
    },
    openWebsocket() {
      this.theSocket = new WebSocket(this.socketAddress);

      this.theSocket.onmessage = this.processMessage

      this.theSocket.onclose = () => {
        this.socketConnected = false
        this.initialized = false
        clearInterval(this.keepaliveTimer)
        this.reconnectTimer = setTimeout(this.openWebsocket, 5e3)
      }

      this.theSocket.onopen = () => {
        this.socketConnected = true

        this.keepaliveTimer = setInterval(this.sendKeepalive, 300e3)
      }
    },
    randomPlayerId() {
      return Math.floor(Math.random()*Number.MAX_SAFE_INTEGER)
    },
    myPlayerId() {
      const stored = localStorage.getItem('ttt_playerId')
      if (stored) return Number(stored)

      const generated = this.randomPlayerId()
      localStorage.setItem('ttt_playerId', generated.toString())
      return generated
    },
    sendEvent(evName:string, evData: unknown) {
      if (this.theSocket.OPEN)
      this.theSocket.send(JSON.stringify({
        event: evName,
        data: evData
      }));
    },
    sendKeepalive() {
      if (this.theSocket.OPEN)
        this.theSocket.send('["ping"]');
    },
    processMessage(msg:MessageEvent) {
      try {
        var command = JSON.parse(msg.data)
      } catch (e) {
        return
      }
      console.log('got:', command)
      this.initialized = true
      if ('board' in command) {
        this.board = command.board
      }
      if ('playerName' in command) {
        this.playerName = command.playerName
        this.canIPlay = command.playerName !== null
      }
      if ('waitingForPeer' in command) {
        this.waitingForPeer = command.waitingForPeer
      }
      if ('turn' in command) {
        this.turn = command.turn
        this.myTurn = command.turn === this.playerName
      }
    },
  },
  created() {
    this.setupWebsocket()
    this.openWebsocket()
  },
  unmounted() {
    this.theSocket.send(JSON.stringify({bye: `The game from ${window.location.href}`}))
    this.theSocket.onclose = null
    this.theSocket.onmessage = null
    this.theSocket.onopen = null
    clearInterval(this.keepaliveTimer)
    clearTimeout(this.reconnectTimer)
    this.theSocket.close()
  }

})
</script>

<style scoped>
#board {
  height: 95vw;
  max-height: 500px;
  border: 1px solid gray;
}
.limited-width {
  width: 95vw;
  max-width: 500px;
}
#board.inactive {
  filter: blur(2px);
}
section + section {
  margin-top: 1em;
}

</style>
