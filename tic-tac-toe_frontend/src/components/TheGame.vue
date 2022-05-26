<template>
  <section id="board" class="container" @click="boardInteraction()">
  </section>
  <section class="container">
    <p>
      Game ID {{ $route.params.id }}
      <span v-if="socketConnected">🟢</span>
      <span v-else>⚪️</span>
    </p>
    <button type="button" class="btn btn-outline-danger" @click="leaveGame()">leave the game</button>
  </section>
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
      keepaliveTimer: NaN as number
    }
  },
  methods: {
    boardInteraction() {
      console.log('touch');
      this.sendEvent('board', 'touch')
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
    },
    openWebsocket() {
      this.theSocket = new WebSocket(this.socketAddress);

      this.theSocket.onmessage = this.processMessage

      this.theSocket.onclose = () => {
        this.socketConnected = false
        clearInterval(this.keepaliveTimer)
        this.reconnectTimer = setTimeout(this.openWebsocket, 5e3)
      }

      this.theSocket.onopen = () => {
        this.socketConnected = true
        this.theSocket.send(JSON.stringify({hello: `The game from ${window.location.href}`}))
        this.keepaliveTimer = setInterval(this.sendKeepalive, 300e3)
      }
    },
    sendEvent(evName:string, evData: string) {
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
      console.log('got:', msg.data)
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
section + section {
  margin-top: 1em;
}
</style>
