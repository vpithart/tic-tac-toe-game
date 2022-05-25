import { createRouter, createWebHistory } from 'vue-router'

import Home from './components/Home.vue'
import TheGame from './components/TheGame.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/game/:id', component: TheGame},
]

export default createRouter({
  history: createWebHistory(),
  routes: routes
})
