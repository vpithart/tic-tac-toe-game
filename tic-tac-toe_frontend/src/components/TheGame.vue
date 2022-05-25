<template>
  <section class="container board">
  </section>
  <section class="container">
    <p>Game ID {{ $route.params.id }}</p>
    <button type="button" class="btn btn-outline-danger" @click="leaveGame()">leave the game</button>
  </section>
</template>

<script>
export default {
  name: 'TheGame',
  props: {
    id: String
  },
  data() {
    return {
      socketAddress: undefined,
      socket: undefined,
      socketState: undefined
    }
  },
  methods: {
    leaveGame() {
      if (confirm('leave the game?'))
      {
        this.$router.push('/')
      }
    }
  },
  setup() {
    function openWebsocket () {
      this.socketAddress = 'ws'
      if (window.location.protocol === 'https') this.socketAddress += 's'
      this.socketAddress += '://'
      this.socketAddress += window.location.host
      this.socketAddress += '/api/websockets'
      this.socketAddress += '/game?' + this.$route.params.id

      this.socket = new WebSocket(this.socketAddress);
      this.socket.onclose =  () => {
       setTimeout(openWebsocket, 15000)
      }
      this.socket.onmessage = processMessage
      this.socket.onopen = () => {
        this.socket.send(JSON.stringify({ble: 124}))
      }
    }
    function closeWebsocket() {
      if (this.socket)
        this.socket.onclose = undefined
        this.socket.close()
        this.socket = undefined
    }
    function processMessage(msg) {
      console.log('got:', msg)
    }
    return { openWebsocket, closeWebsocket }
  },
  created() {
    this.openWebsocket()
  },

}
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
