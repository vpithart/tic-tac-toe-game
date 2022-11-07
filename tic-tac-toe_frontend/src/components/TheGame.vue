<template>
  <div v-if="initialized">
    <p v-if="playerNum">
      player {{playerNum}} ({{symbol(playerNum)}})
    </p>
    <div v-if="!socketConnected" role="alert" class="alert alert-warning limited-width mx-auto">
      🚫 trying to connect ☁️
    </div>
    <section v-if="canIPlay && waitingForPeer" class="mx-auto limited-width">
      <div class="alert alert-warning">
        <p>⏳ Waiting for the peer</p>
        <p>Share this link to this page with the other player:</p>
        <QRCode :text="location"/>
        <small>{{ location }}</small>
      </div>
    </section>
    <section id="board" class="mx-auto limited-width"
      v-if="!(waitingForPeer && boardIsEmpty)"
      :class="{inactive: !socketConnected || waitingForPeer}"
    >
      <TheBoard :rows="board" :myTurn="myTurn" :myNum="playerNum" @touch="boardInteraction" :highlightX="highlightCoords![0]" :highlightY="highlightCoords![1]"/>
    </section>
    <section class="mx-auto limited-width">
      <div v-if="socketConnected">
        <div v-if="canIPlay === false">
          observing the game
          <span v-if="turn">- player {{turn}} on turn</span>
        </div>
        <div v-else>
          <span v-if="!waitingForPeer">
            <div v-if="myTurn" class="alert alert-primary">▶️ It's your turn. Touch the board!</div>
            <div v-else class="alert alert-secondary">⏳ waiting for the other player</div>
          </span>
        </div>
      </div>

      <button type="button" class="btn btn-outline-danger" @click="leaveGame()">leave the game</button>
    </section>
  </div>
  <div v-else>
    Game #{{$route.params.id}} loading
  </div>
  <audio id="water-bubble-sound">
    <source src="../assets/water-bubble-sound.ogg" type="audio/ogg">
  </audio>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import TheBoard from './TheBoard.vue';
import QRCode from './QRCode.vue';
import { symbols } from "./board-symbols";

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
      playerNum: null as unknown as number,
      turn: undefined as string|undefined,
      myTurn: false as boolean,
      board: [] as Array<Array<string>>,
      highlightCoords: [NaN,NaN] as [number,number],
      highlightCoordsTimer: null as ReturnType<typeof setTimeout>|null,
    }
  },
  methods: {
    boardInteraction(coords:Array<number>) {
      console.log('touch');
      if (this.canIPlay && this.myTurn) {
        this.sendEvent('touch', {coords: coords})
        this.highlightCoords = [NaN,NaN]
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
        console.warn('websocket closed')
        clearInterval(this.keepaliveTimer)
        this.reconnectTimer = Number(setTimeout(this.openWebsocket, 5e3))
      }

      this.theSocket.onopen = () => {
        this.socketConnected = true
        console.log('websocket open')
        this.keepaliveTimer = Number(setInterval(this.sendKeepalive, 300e3))
      }
    },
    randomPlayerId() {
      return Math.floor(Math.random()*Number.MAX_SAFE_INTEGER) % 1e6;
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
      if ('playerNum' in command) {
        this.playerNum = command.playerNum
        this.canIPlay = command.playerNum !== null
      }
      if ('waitingForPeer' in command) {
        this.waitingForPeer = command.waitingForPeer
      }
      if ('turn' in command) {
        this.turn = command.turn
        this.myTurn = command.turn === this.playerNum
      }
      if ('lastChangedCoords' in command) {
        this.highlightCoords = command.lastChangedCoords;
        if (this.highlightCoordsTimer) clearTimeout(this.highlightCoordsTimer);
        this.highlightCoordsTimer = setTimeout(() => {
          this.highlightCoords = [NaN,NaN];
        }, 5000)
      }
    },
    symbol(n:number) {
      return symbols[n-1]
    }
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
  watch: {
    myTurn(after, before) {
      if (!before && after) {
        document.querySelector<HTMLAudioElement>('#water-bubble-sound')?.play()
      }
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
#water-bubble-sound {
  display: none;
}
</style>
