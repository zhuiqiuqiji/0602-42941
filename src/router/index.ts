import { createRouter, createWebHistory } from 'vue-router'
import SceneSelect from '@/pages/SceneSelect.vue'
import FoldSelect from '@/pages/FoldSelect.vue'
import ParameterTune from '@/pages/ParameterTune.vue'
import FlightScene from '@/pages/FlightScene.vue'
import ScoreResult from '@/pages/ScoreResult.vue'

const routes = [
  { path: '/', name: 'home', component: () => import('@/pages/HomePage.vue'), meta: { title: '首页' } },
  { path: '/home', name: 'home-page', component: () => import('@/pages/HomePage.vue'), meta: { title: '首页' } },
  { path: '/compete', name: 'compete', component: () => import('@/pages/CompeteMode.vue'), meta: { title: '比赛模式' } },
  { path: '/design', name: 'design', component: () => import('@/pages/DesignEditor.vue'), meta: { title: '设计编辑器' } },
  { path: '/leaderboard', name: 'leaderboard', component: () => import('@/pages/Leaderboard.vue'), meta: { title: '排行榜' } },
  { path: '/scene', name: 'scene', component: SceneSelect, meta: { title: '选择场景' } },
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
