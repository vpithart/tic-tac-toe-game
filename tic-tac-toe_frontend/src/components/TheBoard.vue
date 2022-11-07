<template>
  <table v-if="initialized">
    <tr v-for="row, index1 in rows" :key="index1">
      <td v-for="col, index2 in row" :key="index2"
        :style="[cellSizes, onTurnStyles]"
        :class="{playable: (myTurn && col == ''), highlighted: (index1 === highlightX && index2 === highlightY)}"
        @click="boardInteraction(index1,index2)"
      >
        <template v-if="col === 1">{{symbol1}}</template>
        <template v-if="col === 2">{{symbol2}}</template>
      </td>
    </tr>
  </table>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { symbols } from "./board-symbols";

export default defineComponent({
  name: 'TheBoard',
  props: {
    rows: Array,
    myTurn: Boolean,
    myNum: Number,
    highlightX: Number,
    highlightY: Number
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
    symbol1() {
      return symbols[0]
    },
    symbol2() {
      return symbols[1]
    }
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
.highlighted {
  color: red;
  font-weight: bold;
  background-color: #fff8f8;
}
</style>
