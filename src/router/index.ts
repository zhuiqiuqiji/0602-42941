import { createRouter, createWebHistory } from 'vue-router'
import SceneSelect from '@/pages/SceneSelect.vue'
import FoldSelect from '@/pages/FoldSelect.vue'
import ParameterTune from '@/pages/ParameterTune.vue'
import FlightScene from '@/pages/FlightScene.vue'
import ScoreResult from '@/pages/ScoreResult.vue'

const routes = [
  { path: '/', name: 'scene', component: SceneSelect, meta: { title: '选择场景' } },
  { path: '/fold', name: 'fold', component: FoldSelect, meta: { title: '选择折法' } },
  { path: '/tune', name: 'tune', component: ParameterTune, meta: { title: '调整参数' } },
  { path: '/fly', name: 'fly', component: FlightScene, meta: { title: '飞行中' } },
  { path: '/result', name: 'result', component: ScoreResult, meta: { title: '成绩' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.afterEach((to) => {
  if (to.meta?.title) {
    document.title = `${to.meta.title} · 纸飞机飞行游戏`
  }
})

export default router
