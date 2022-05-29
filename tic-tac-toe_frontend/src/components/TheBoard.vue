<template>
  <table v-if="initialized">
    <tr v-for="row, index1 in rows" :key="index1">
      <td v-for="col, index2 in row" :key="index2"
        :style="[cellSizes, onTurnStyles]"
        :class="{playable: myTurn && col == ''}"
        @click="boardInteraction(index1,index2)"
      >
        {{col}}
      </td>
    </tr>
  </table>
</template>

<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
  name: 'TheBoard',
  props: {
    rows: Array,
    myTurn: Boolean,
    myName: String
  },
  computed: {
    initialized() {
      return this.rows && this.rows[0] !== undefined
    },
    cellSizes() {
      if (!this.rows) return {}
      let percentage = 100/(this.rows.length+1)

      return {
        width: percentage + '%',
        height: percentage + '%'
      }
    },
    onTurnStyles() {
      if (!this.myTurn) return {
        cursor: 'not-allowed'
      }
      return {
        cursor: 'pointer',
      }
    },
  },
  methods: {
    boardInteraction(x:number, y:number) {
      this.$emit('touch', [x, y])
    },
  },
})
</script>

<style scoped>
table {
  width: 100%;
  height: 100%;
}
td {
  border: 1px dotted gray;
  padding: 0;
  margin: 0;
}
.playable:hover {
  background-color: #cfe2ff;
}
</style>
