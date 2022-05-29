<template>
  <div v-if="initialized">
    <p v-if="playerName">
      player {{playerName}}
    </p>
    <section id="board" class="mx-auto limited-width"
      v-if="!(waitingForPeer && boardIsEmpty)"
      :class="{inactive: !socketConnected}"
    >
      <TheBoard :rows="board" :myTurn="myTurn" :myName="playerName" @touch="boardInteraction"/>
    </section>
    <section class="mx-auto limited-width">
      <div v-if="!socketConnected" role="alert" class="alert alert-warning">🚫 trying to connect ☁️</div>

      <div v-if="canIPlay === false">
        observing the game
        <span v-if="turn">- player {{turn}} on turn</span>
      </div>

      <div v-else>
        <div v-if="waitingForPeer">
          <div class="alert alert-warning">
            <p>⏳ Waiting for the peer</p>
            <p>Share this link to this page with the other player:</p>
            <QRCode :text="location"/>
            <small>{{ location }}</small>
          </div>
        </div>
        <span v-else>
          <div v-if="myTurn" class="alert alert-primary">▶️ It's your turn. Touch the board!</div>
          <div v-else class="alert alert-secondary">⏳ waiting for the other player</div>
        </span>
      </div>

      <button v-if="canIPlay" type="button" class="btn btn-outline-danger" @click="leaveGame()">leave the game</button>
    </section>
  </div>
  <div v-else>
    Game #{{$route.params.id}} loading
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import TheBoard from './TheBoard.vue';
import QRCode from './QRCode.vue';

export default defineComponent({
  name: 'TheGame',
  components: {
    TheBoard,
    QRCode
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
        this.reconnectTimer = Number(setTimeout(this.openWebsocket, 5e3))
      }

      this.theSocket.onopen = () => {
        this.socketConnected = true

        this.keepaliveTimer = Number(setInterval(this.sendKeepalive, 300e3))
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
  computed: {
    location() {
      return window.location.toString()
    },
    boardIsEmpty() {
      for (let row of this.board) {
        for (let col of row) {
          if (col !== '') return false
        }
      }
      return true
    }
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
