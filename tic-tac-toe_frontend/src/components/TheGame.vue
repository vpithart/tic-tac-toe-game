<template>
  <section class="container board">
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
      theSocket: {} as WebSocket
    }
  },
  methods: {
    leaveGame() {
      if (confirm('leave the game?'))
      {
        this.$router.push('/')
      }
    },
    openWebsocket() {
      this.socketAddress = 'ws'

      if (window.location.protocol === 'https') this.socketAddress += 's'
      this.socketAddress += '://'
      this.socketAddress += window.location.host
      this.socketAddress += '/api/websockets'
      this.socketAddress += '/game?' + this.$route.params.id

      this.theSocket = new WebSocket(this.socketAddress);
      this.theSocket.onclose = () => {
        this.socketConnected = false
        setTimeout(this.openWebsocket, 5000)
      }
      this.theSocket.onmessage = this.processMessage
      this.theSocket.onopen = () => {
        this.socketConnected = true
        this.theSocket.send(JSON.stringify({hello: `The game from ${window.location.href}`}))
      }
    },
    processMessage(msg:MessageEvent) {
      console.log('got:', msg.data)
    }
  },
  created() {
    this.openWebsocket()
  },
  unmounted() {
    this.theSocket.send(JSON.stringify({bye: `The game from ${window.location.href}`}))
    console.log('socket close')
    this.theSocket.onclose = null
    this.theSocket.onmessage = null
    this.theSocket.onopen = null
    this.theSocket.close()
  }

})
</script>

<style scoped>
.board {
  width: 95vw;
  height: 95vw;
  border: 1px solid gray;
}
section + section {
  margin-top: 1em;
}
</style>
