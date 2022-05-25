<template>
  <section class="container">
    <div class="d-grid">
      <button class="btn btn-primary btn-lg" type="button" v-on:click="startGame()">Play!</button>
    </div>
  </section>
</template>

<script>
import axios from 'axios'

export default {
  name: 'HomeScreen',
  methods: {
    startGame() {
      axios.post('/api/game').then((r) => {
        let url = '/game/' + r.data.gameId;
        this.$router.push(url)
      })
    }
  },
}
</script>
