<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-semibold text-gray-900 mb-4">步骤 1: 选择芯片型号和屏幕配置</h2>
      <p class="text-gray-600 mb-6">请选择您的硬件配置，或从预设配置中快速选择。</p>
    </div>

    <!-- 预设配置 -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-gray-900">预设配置（推荐）</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          v-for="preset in presetConfigs" 
          :key="preset.id"
          @click="selectPreset(preset)"
          :class="[
            'border-2 rounded-lg p-4 cursor-pointer transition-all',
            modelValue.preset === preset.id 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-200 hover:border-gray-300'
          ]"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h4 class="font-medium text-gray-900">{{ preset.name }}</h4>
              <div class="mt-2 text-sm text-gray-600 space-y-1">
                <div>芯片: {{ preset.chip }}</div>
                <div>分辨率: {{ preset.display.width }}×{{ preset.display.height }}</div>
                <div>颜色: {{ preset.display.color }}</div>
              </div>
            </div>
            <div 
              v-if="modelValue.preset === preset.id"
              class="flex-shrink-0 ml-3"
            >
              <div class="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 自定义配置 -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-gray-900">自定义配置</h3>
      <div 
        @click="enableCustomConfig"
        :class="[
          'border-2 rounded-lg p-4 cursor-pointer transition-all',
          isCustom ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
        ]"
      >
        <div class="flex items-center justify-between mb-4">
          <h4 class="font-medium text-gray-900">自定义硬件配置</h4>
          <div 
            v-if="isCustom"
            class="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center"
          >
            <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </div>
        </div>
        
        <div v-if="isCustom" class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- 芯片型号选择 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">芯片型号</label>
            <select 
              v-model="customConfig.model"
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">请选择芯片</option>
              <option value="esp32s3">ESP32-S3</option>
              <option value="esp32c3">ESP32-C3</option>
              <option value="esp32p4">ESP32-P4</option>
              <option value="esp32c6">ESP32-C6</option>
            </select>
          </div>

          <!-- 屏幕宽度 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">屏幕宽度</label>
            <input 
              type="number" 
              v-model.number="customConfig.display.width"
              min="128" 
              max="800"
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="320"
            />
          </div>

          <!-- 屏幕高度 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">屏幕高度</label>
            <input 
              type="number" 
              v-model.number="customConfig.display.height"
              min="128" 
              max="600"
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="240"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 当前配置预览 -->
    <div v-if="hasValidConfig" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 class="font-medium text-blue-900 mb-2">当前配置</h4>
      <div class="text-sm text-blue-800 space-y-1">
        <div>芯片型号: {{ currentChipModel }}</div>
        <div>屏幕分辨率: {{ currentDisplay.width }}×{{ currentDisplay.height }}</div>
        <div>颜色格式: {{ currentDisplay.color }}</div>
      </div>
    </div>

    <!-- 下一步按钮 -->
    <div class="flex justify-end">
      <button 
        @click="handleNext"
        :disabled="!hasValidConfig"
        class="bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-medium transition-colors"
      >
        下一步
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      model: '',
      display: {
        width: 320,
        height: 240,
        color: 'RGB565'
      },
      preset: ''
    })
  }
})

const emit = defineEmits(['update:modelValue', 'next'])

const presetConfigs = [
  {
    id: 'lichuang-dev',
    name: '立创·实战派 ESP32-S3',
    chip: 'esp32s3',
    display: { width: 320, height: 240, color: 'RGB565' }
  },
  {
    id: 'xingzhi-cube-1.54tft-wifi',
    name: '无名科技·星智 1.54 TFT',
    chip: 'esp32s3',
    display: { width: 240, height: 240, color: 'RGB565' }
  },
  {
    id: 'atoms3r-echo-base',
    name: 'AtomS3R Echo Base',
    chip: 'esp32s3',
    display: { width: 128, height: 128, color: 'RGB565' }
  },
  {
    id: 'surfer-c3-1.14tft',
    name: 'Surfer C3 1.14 TFT',
    chip: 'esp32c3',
    display: { width: 240, height: 135, color: 'RGB565' }
  }
]

const isCustom = ref(false)
const customConfig = ref({
  model: '',
  display: {
    width: 320,
    height: 240,
    color: 'RGB565'
  }
})

const hasValidConfig = computed(() => {
  if (props.modelValue.preset) return true
  return customConfig.value.model && 
         customConfig.value.display.width && 
         customConfig.value.display.height
})

const currentChipModel = computed(() => {
  if (props.modelValue.preset) {
    const preset = presetConfigs.find(p => p.id === props.modelValue.preset)
    return preset?.chip.toUpperCase() || ''
  }
  return customConfig.value.model.toUpperCase()
})

const currentDisplay = computed(() => {
  if (props.modelValue.preset) {
    const preset = presetConfigs.find(p => p.id === props.modelValue.preset)
    return preset?.display || {}
  }
  return customConfig.value.display
})

const selectPreset = (preset) => {
  isCustom.value = false
  emit('update:modelValue', {
    model: preset.chip,
    display: { ...preset.display },
    preset: preset.id
  })
}

const enableCustomConfig = () => {
  isCustom.value = true
  emit('update:modelValue', {
    model: customConfig.value.model,
    display: { ...customConfig.value.display },
    preset: ''
  })
}

const handleNext = () => {
  if (hasValidConfig.value) {
    emit('next')
  }
}

watch(() => customConfig.value, (newVal) => {
  if (isCustom.value) {
    emit('update:modelValue', {
      model: newVal.model,
      display: { ...newVal.display },
      preset: ''
    })
  }
}, { deep: true })
</script>
