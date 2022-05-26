<template>
  <section class="container">
    <button class="btn btn-primary btn-lg" type="button" v-on:click="startGame()">Play!</button>
  </section>
</template>

<script lang="ts">
import axios from 'axios'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'HomeScreen',
  methods: {
    startGame() {
      axios.post('/api/game').then((r) => {
        let url = '/game/' + r.data.gameId;
        this.$router.push(url)
      })
    }
  },
})
</script>

<style scoped>
section {
  margin-top: 3em;
}
button {
  width: 75vw;
  max-width: 500px;
}
</style>
