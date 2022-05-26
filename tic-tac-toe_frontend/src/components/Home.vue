<template>
  <section class="container">
    <div class="d-grid">
      <button class="btn btn-primary btn-lg" type="button" v-on:click="startGame()">Play!</button>
    </div>
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
