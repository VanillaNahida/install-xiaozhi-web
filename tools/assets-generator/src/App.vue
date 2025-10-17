<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
      <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold text-gray-900">小智 AI 自定义资源生成器</h1>
            <DeviceStatus />
          </div>
        </div>
      </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import DeviceStatus from '@/components/DeviceStatus.vue'
</script>
