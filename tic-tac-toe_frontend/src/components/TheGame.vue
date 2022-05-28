<template>
<div class="container">
  <div v-if="!socketConnected" role="alert" class="alert alert-danger">🚫 trying to connect ☁️</div>
  <section id="board" class="container" @click="boardInteraction()">
  </section>
  <section class="container">
    <p>
      &nbsp;
      Game ID {{ $route.params.id }}
      <span v-if="initialized">
        &nbsp;
        <span v-if="playerName">player {{playerName}}</span>
        <br>
        <span v-if="canIPlay === false">observer</span>
        <span v-else>
          <span v-if="waitingForPeer">
            🔎 waiting for peer
          </span>
          <span v-else>
            <span v-if="myTurn">▶️ play!</span>
            <span v-else>⏳ wait</span>
          </span>
        </span>
      </span>
    </p>
    <button type="button" class="btn btn-outline-danger" @click="leaveGame()">leave the game</button>
  </section>
</div>
</template>

<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
  name: 'TheGame',
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
      myTurn: false as boolean
    }
  },
  methods: {
    boardInteraction() {
      console.log('touch');
      if (this.canIPlay && this.myTurn) {
        this.sendEvent('touch', {})
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
      console.log('got command:', command)
      this.initialized = true
      if ('playerName' in command) {
        this.playerName = command.playerName
        this.canIPlay = command.playerName !== null
      }
      if ('waitingForPeer' in command) {
        this.waitingForPeer = command.waitingForPeer
      }
      if ('myTurn' in command) {
        this.myTurn = command.myTurn
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
  width: 95vw;
  max-width: 500px;
  height: 95vw;
  max-height: 500px;
  border: 1px solid gray;
}
div.alert {
  width: 95vw;
  max-width: 500px;
  position: absolute;
}
section + section {
  margin-top: 1em;
}
</style>
