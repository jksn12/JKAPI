<template>
  <RouterView v-if="isLaunch" />
  <div v-else-if="isEmbedded" class="suite suite-embedded"><RouterView /></div>
  <AppLayout v-else>
    <div class="suite">
      <header class="suite-header">
        <RouterLink class="suite-brand" to="/canvas">JKAI 画布</RouterLink>
        <nav aria-label="JKAI 画布导航">
          <RouterLink to="/canvas">打开画布</RouterLink>
          <RouterLink to="/canvas/library">我的画布</RouterLink>
          <RouterLink to="/canvas/prompts">提示词库</RouterLink>
          <RouterLink to="/canvas/assets">我的素材</RouterLink>
        </nav>
      </header>
      <main class="suite-main"><RouterView /></main>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'

const route = useRoute()
const isEmbedded = computed(() => route.query.embedded === 'new-api')
const isLaunch = computed(() => route.name === 'CanvasLaunch')
</script>

<style>
.suite{min-height:calc(100vh - 64px);background:linear-gradient(180deg,#f7f9fc 0%,#eef3f9 100%);color:#1f2937}.suite-embedded{min-height:100vh;padding:14px 12px 28px}.suite-header{height:58px;display:flex;align-items:center;gap:42px;padding:0 28px;border-bottom:1px solid #dbe3ed;background:rgba(255,255,255,.82);backdrop-filter:saturate(1.3) blur(12px)}.suite-brand{font-size:18px;font-weight:750;color:inherit}.suite-header nav{display:flex;height:100%;gap:6px}.suite-header nav a{display:flex;align-items:center;padding:0 14px;color:#5b6472;border-bottom:2px solid transparent}.suite-header nav a.router-link-active{color:#1267f7;border-color:#1267f7}.suite-main{padding:14px 12px 28px}.suite-page{max-width:1240px;margin:0 auto}.suite-titlebar{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:24px}.suite-titlebar h1{font-size:26px;line-height:1.2;margin:0 0 7px}.suite-titlebar p{margin:0;color:#64748b}.suite-actions{display:flex;gap:8px;flex-wrap:wrap}.suite-btn{height:36px;padding:0 14px;border:1px solid #d8e0ea;background:#fff;border-radius:6px;color:#273244;font-weight:600;box-shadow:0 1px 0 rgba(15,23,42,.02)}.suite-btn.primary{background:#1267f7;color:#fff;border-color:#1267f7}.suite-btn.danger{color:#c2410c}.suite-btn:disabled{opacity:.45}.suite-input,.suite-select,.suite-textarea{border:1px solid #d6dee8;border-radius:6px;background:#fff;color:#1f2937;padding:9px 11px;box-shadow:inset 0 1px 2px rgba(15,23,42,.03)}.suite-input{height:38px}.suite-textarea{resize:vertical}.suite-filters{display:flex;gap:10px;align-items:center;margin-bottom:20px;flex-wrap:wrap}.suite-search{flex:1;min-width:240px}.suite-segments{display:flex;border:1px solid #d6dee8;border-radius:6px;overflow:hidden;background:#fff}.suite-segments button{height:36px;padding:0 13px;border:0;border-right:1px solid #e5eaf1;background:transparent;color:#556170}.suite-segments button:last-child{border:0}.suite-segments button.active{background:#1267f7;color:#fff}.suite-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}.suite-card{border:1px solid #e2e8f0;background:#fff;border-radius:8px;padding:16px;min-width:0;box-shadow:0 10px 30px rgba(15,23,42,.05)}.suite-card h2{font-size:16px;margin:0 0 7px}.suite-card p{color:#64748b;margin:0}.suite-card-actions{display:flex;gap:6px;margin-top:16px}.suite-empty{padding:80px 24px;text-align:center;border:1px dashed #cfd8e4;border-radius:8px;color:#64748b;background:rgba(255,255,255,.55)}.suite-modal-backdrop{position:fixed;inset:0;z-index:80;background:rgba(15,23,42,.32);display:grid;place-items:center;padding:20px}.suite-modal{width:min(620px,100%);max-height:90vh;overflow:auto;background:#fff;color:#1f2937;border:1px solid #dbe3ed;border-radius:8px;padding:22px;box-shadow:0 24px 60px rgba(15,23,42,.16)}.suite-modal h2{margin:0 0 20px}.suite-form{display:grid;gap:14px}.suite-form label{display:grid;gap:6px;font-weight:600;font-size:13px}.suite-form-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:8px}@media(max-width:760px){.suite-header{height:auto;padding:12px 16px;align-items:flex-start;gap:12px;flex-direction:column}.suite-header nav{width:100%;overflow:auto}.suite-header nav a{padding:8px 10px;white-space:nowrap}.suite-main{padding:14px}.suite-titlebar{flex-direction:column}.suite-actions{width:100%}}
</style>
