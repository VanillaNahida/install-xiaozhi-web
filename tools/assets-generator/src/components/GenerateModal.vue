<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
      <!-- 模态框头部 -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">生成 assets.bin</h3>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-500"
        >
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- 模态框内容 -->
      <div class="p-6 overflow-y-auto" style="max-height: calc(90vh - 140px)">
        <div v-if="!isGenerating && !isCompleted" class="space-y-6">
          <!-- 配置确认 -->
          <div>
            <h4 class="font-medium text-gray-900 mb-3">请确认您的配置</h4>
            <div class="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">芯片型号:</span>
                <span class="font-medium">{{ config.chip.model.toUpperCase() }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">分辨率:</span>
                <span class="font-medium">{{ config.chip.display.width }}×{{ config.chip.display.height }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">唤醒词:</span>
                <span class="font-medium">{{ getWakewordName() }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">字体:</span>
                <span class="font-medium">{{ getFontName() }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">表情包:</span>
                <span class="font-medium">{{ getEmojiName() }}</span>
              </div>
            </div>
          </div>

          <!-- 文件列表 -->
          <div>
            <h4 class="font-medium text-gray-900 mb-3">包含的文件列表</h4>
            <div class="space-y-2 max-h-64 overflow-y-auto">
              <div
                v-for="item in fileList"
                :key="item.id"
                class="flex items-center justify-between px-3 py-2 border border-gray-200 rounded bg-gray-50"
              >
                <div class="flex items-center">
                  <component :is="item.icon" class="w-4 h-4 mr-2" :class="item.iconColor" />
                  <span class="text-sm font-medium text-gray-900">{{ item.name }}</span>
                </div>
                <div class="text-sm text-gray-700">
                  {{ item.size }}
                  <span v-if="item.estimated" class="text-xs text-gray-500 ml-1">预估</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 生成进度 -->
        <div v-if="isGenerating" class="space-y-6 text-center">
          <div class="flex items-center justify-center">
            <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500"></div>
          </div>
          
          <div class="space-y-4">
            <p class="text-gray-600 mt-2">正在生成 assets.bin</p>
            <div class="bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                class="bg-primary-500 h-2 rounded-full transition-all duration-500 ease-out"
                :style="{ width: progress + '%' }"
              ></div>
            </div>
            <div class="text-sm text-gray-600">
              <div>{{ currentStep }}</div>
              <div class="mt-1">{{ progress }}% 完成</div>
            </div>
          </div>

          <!-- 进度步骤 -->
          <div class="space-y-2 text-left">
            <div
              v-for="step in progressSteps"
              :key="step.id"
              class="flex items-center text-sm"
            >
              <div class="flex-shrink-0 mr-3">
                <div v-if="step.status === 'completed'" class="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <div v-else-if="step.status === 'processing'" class="w-5 h-5 bg-primary-500 rounded-full animate-pulse"></div>
                <div v-else class="w-5 h-5 bg-gray-300 rounded-full"></div>
              </div>
              <span :class="[
                step.status === 'completed' ? 'text-green-700' : 
                step.status === 'processing' ? 'text-primary-700' : 
                'text-gray-500'
              ]">{{ step.name }}</span>
            </div>
          </div>
        </div>

        <!-- 完成状态 -->
        <div v-if="isCompleted && !isFlashing" class="text-center space-y-6">
          <div class="mx-auto flex items-center justify-center">
            <svg class="w-20 h-20 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
          </div>
          
          <div>
            <p class="text-gray-600 mt-2">您的 assets.bin 文件已准备就绪</p>
          </div>

          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="text-sm text-green-800 space-y-1">
              <div>文件名: assets.bin</div>
              <div>文件大小: {{ generatedFileSize }}</div>
              <div>生成时间: {{ generationTime }}</div>
            </div>
          </div>

          <div class="space-y-3">
            <button
              @click="downloadFile"
              class="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
              下载 assets.bin
            </button>

            <button
              @click="startOnlineFlash"
              :disabled="!deviceOnline"
              class="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
              在线烧录到设备
            </button>
          </div>
        </div>

        <!-- 在线烧录进度 -->
        <div v-if="isFlashing" class="space-y-6 text-center">
          <div class="flex items-center justify-center">
            <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
          </div>

          <div class="space-y-4">
            <p class="text-gray-600">正在烧录到设备</p>
            <div class="bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                class="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                :style="{ width: flashProgress + '%' }"
              ></div>
            </div>
            <div class="text-sm text-gray-600">
              <div>{{ flashCurrentStep }}</div>
              <div class="mt-1">{{ flashProgress }}% 完成</div>
            </div>
          </div>

          <!-- 取消按钮 -->
          <button
            @click="cancelFlash"
            class="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
          >
            取消烧录
          </button>
        </div>
      </div>

      <!-- 模态框底部 -->
      <div class="flex justify-end space-x-3 p-6 border-t border-gray-200">
        <button
          v-if="!isGenerating && !isCompleted"
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          取消
        </button>
        <button
          v-if="!isGenerating && !isCompleted"
          @click="startGeneration"
          :disabled="!hasSelectedFiles"
          class="px-6 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 rounded-md transition-colors"
        >
          开始生成
        </button>
        <button
          v-if="isCompleted"
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, markRaw, h } from 'vue'
import AssetsBuilder from '@/utils/AssetsBuilder.js'

const props = defineProps({
  config: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'generate', 'startFlash', 'cancelFlash'])

const isGenerating = ref(false)
const isCompleted = ref(false)
const progress = ref(0)
const currentStep = ref('')
const generatedFileSize = ref('')
const generationTime = ref('')
const generatedBlob = ref(null)
const generationStartTime = ref(null)
const deviceOnline = ref(false)
const isFlashing = ref(false)
const flashProgress = ref(0)
const flashCurrentStep = ref('')


const progressSteps = ref([
  { id: 1, name: '初始化生成器', status: 'pending' },
  { id: 2, name: '处理字体文件', status: 'pending' },
  { id: 3, name: '打包唤醒词模型', status: 'pending' },
  { id: 4, name: '处理表情图片', status: 'pending' },
  { id: 5, name: '处理背景图片', status: 'pending' },
  { id: 6, name: '生成索引文件', status: 'pending' },
  { id: 7, name: '构建SPIFFS映射', status: 'pending' },
  { id: 8, name: '完成打包', status: 'pending' }
])

const fileList = ref([])

// 图标组件 - 使用render函数并用markRaw包装以避免响应式化
const FileIcon = markRaw({
  render: () => h('svg', {
    fill: 'currentColor',
    viewBox: '0 0 20 20'
  }, [
    h('path', {
      d: 'M4 3a2 2 0 00-2 2v1a1 1 0 001 1h14a1 1 0 001-1V5a2 2 0 00-2-2H4zM3 8a1 1 0 011-1h12a1 1 0 011 1v5a2 2 0 01-2 2H5a2 2 0 01-2-2V8z'
    })
  ])
})

const MicIcon = markRaw({
  render: () => h('svg', {
    fill: 'currentColor',
    viewBox: '0 0 20 20'
  }, [
    h('path', {
      'fill-rule': 'evenodd',
      d: 'M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z',
      'clip-rule': 'evenodd'
    })
  ])
})

const FontIcon = markRaw({
  render: () => h('svg', {
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24'
  }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M8 4l8 16m-6-6h4'
    })
  ])
})

const ImageIcon = markRaw({
  render: () => h('svg', {
    fill: 'currentColor',
    viewBox: '0 0 20 20'
  }, [
    h('path', {
      'fill-rule': 'evenodd',
      d: 'M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z',
      'clip-rule': 'evenodd'
    })
  ])
})

const hasSelectedFiles = computed(() => {
  return fileList.value.length > 0
})

const getWakewordName = () => {
  // 简化的唤醒词名称映射
  const names = {
    'wn9s_hilexin': 'Hi,乐鑫',
    'wn9s_hiesp': 'Hi,ESP',
    'wn9s_nihaoxiaozhi': '你好小智',
    'wn9_nihaoxiaozhi_tts': '你好小智',
    'wn9_alexa': 'Alexa'
  }
  return names[props.config.theme.wakeword] || props.config.theme.wakeword
}

const getFontName = () => {
  if (props.config.theme.font.type === 'preset') {
    return props.config.theme.font.preset.replace('font_', '').replace('_', ' ')
  }
  return '自定义字体'
}

const getEmojiName = () => {
  if (props.config.theme.emoji.type === 'preset' && props.config.theme.emoji.preset) {
    return props.config.theme.emoji.preset === 'twemoji32' ? 'Twemoji 32×32' : 'Twemoji 64×64'
  } else if (props.config.theme.emoji.type === 'custom') {
    return '自定义表情包'
  }
  return '未配置'
}

const initializeFileList = () => {
  fileList.value = []

  // 添加索引文件
  fileList.value.push({
    id: 'index',
    name: 'index.json',
    description: '配置索引文件',
    icon: FileIcon,
    iconColor: 'text-blue-500',
    size: '1KB'
  })

  // 添加唤醒词模型（如果有配置）
  if (props.config.theme.wakeword) {
    fileList.value.push({
      id: 'srmodels',
      name: 'srmodels.bin',
      description: '唤醒词模型',
      icon: MicIcon,
      iconColor: 'text-green-500',
      size: '~2.1MB'
    })
  }

  // 添加字体文件
  if (props.config.theme.font.type === 'preset') {
    const fontSizes = {
      'font_puhui_deepseek_14_1': '180KB',
      'font_puhui_deepseek_16_4': '720KB',
      'font_puhui_deepseek_20_4': '1.1MB',
      'font_puhui_deepseek_30_4': '2.5MB'
    }
    
    fileList.value.push({
      id: 'font',
      name: `${props.config.theme.font.preset}.bin`,
      description: '预设字体文件',
      icon: FontIcon,
      iconColor: 'text-yellow-500',
      size: fontSizes[props.config.theme.font.preset] || '500KB'
    })
  } else if (props.config.theme.font.custom.file) {
    const custom = props.config.theme.font.custom
    const estimatedSize = Math.max(100, custom.size * custom.size * custom.bpp * 0.1)
    
    fileList.value.push({
      id: 'font',
      name: `font_custom_${custom.size}_${custom.bpp}.bin`,
      description: '自定义字体文件',
      icon: FontIcon,
      iconColor: 'text-yellow-500',
      size: estimatedSize > 1024 ? `${(estimatedSize/1024).toFixed(1)}MB` : `${Math.round(estimatedSize)}KB`,
      estimated: true
    })
  }

  // 添加表情文件
  if (props.config.theme.emoji.type === 'preset' && props.config.theme.emoji.preset) {
    const emotionList = ['neutral', 'happy', 'laughing', 'funny', 'sad', 'angry', 'crying', 'loving', 'embarrassed', 'surprised', 'shocked', 'thinking', 'winking', 'cool', 'relaxed', 'delicious', 'kissy', 'confident', 'sleepy', 'silly', 'confused']
    const size = props.config.theme.emoji.preset === 'twemoji64' ? '3KB' : '1KB'
    
    emotionList.forEach(emotion => {
      fileList.value.push({
        id: `emoji_${emotion}`,
        name: `${emotion}.png`,
        description: `${emotion}表情图片`,
        icon: ImageIcon,
        iconColor: 'text-pink-500',
        size: size
      })
    })
  } else {
    Object.entries(props.config.theme.emoji.custom.images).forEach(([emotion, file]) => {
      const fileSizeKB = Math.round(file.size / 1024)
      fileList.value.push({
        id: `emoji_${emotion}`,
        name: file.name,
        description: `${emotion}表情图片`,
        icon: ImageIcon,
        iconColor: 'text-pink-500',
        size: fileSizeKB > 1024 ? `${(fileSizeKB/1024).toFixed(1)}MB` : `${fileSizeKB}KB`
      })
    })
  }

  // 添加背景文件
  if (props.config.theme.skin.light.backgroundType === 'image' && props.config.theme.skin.light.backgroundImage) {
    const { width, height } = props.config.chip.display
    const estimatedSize = Math.round(width * height * 2 / 1024) // RGB565
    
    fileList.value.push({
      id: 'bg_light',
      name: 'background_light.raw',
      description: '浅色模式背景图片',
      icon: ImageIcon,
      iconColor: 'text-indigo-500',
      size: estimatedSize > 1024 ? `${(estimatedSize/1024).toFixed(1)}MB` : `${estimatedSize}KB`,
      estimated: true
    })
  }

  if (props.config.theme.skin.dark.backgroundType === 'image' && props.config.theme.skin.dark.backgroundImage) {
    const { width, height } = props.config.chip.display
    const estimatedSize = Math.round(width * height * 2 / 1024) // RGB565
    
    fileList.value.push({
      id: 'bg_dark',
      name: 'background_dark.raw',
      description: '深色模式背景图片',
      icon: ImageIcon,
      iconColor: 'text-indigo-500',
      size: estimatedSize > 1024 ? `${(estimatedSize/1024).toFixed(1)}MB` : `${estimatedSize}KB`,
      estimated: true
    })
  }
}

const getTotalSize = () => {
  let totalKB = 0
  
  fileList.value.forEach(file => {
    const sizeStr = file.size.replace('~', '').replace('预估', '')
    if (sizeStr.includes('MB')) {
      totalKB += parseFloat(sizeStr.replace('MB', '')) * 1024
    } else {
      totalKB += parseFloat(sizeStr.replace('KB', ''))
    }
  })
  
  return totalKB > 1024 ? `${(totalKB / 1024).toFixed(1)}MB` : `${Math.round(totalKB)}KB`
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const formatDuration = (milliseconds) => {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`
  } else if (milliseconds < 60000) {
    return `${(milliseconds / 1000).toFixed(1)}s`
  } else {
    const minutes = Math.floor(milliseconds / 60000)
    const seconds = Math.floor((milliseconds % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }
}

const startGeneration = async () => {
  isGenerating.value = true
  progress.value = 0
  generationStartTime.value = Date.now()
  
  try {
    // 创建AssetsBuilder实例
    const builder = new AssetsBuilder()
    builder.setConfig(props.config)
    
    // 生成assets.bin
    const blob = await builder.generateAssetsBin((progressPercent, message) => {
      progress.value = parseInt(progressPercent)
      currentStep.value = message
      
      // 更新进度步骤状态
      const stepIndex = Math.floor(progressPercent / (100 / progressSteps.value.length))
      progressSteps.value.forEach((step, index) => {
        if (index < stepIndex) {
          step.status = 'completed'
        } else if (index === stepIndex) {
          step.status = 'processing'
        } else {
          step.status = 'pending'
        }
      })
    })
    
    // 完成生成
    isGenerating.value = false
    isCompleted.value = true
    
    // 更新生成结果
    generatedFileSize.value = formatFileSize(blob.size)
    const endTime = Date.now()
    const duration = endTime - generationStartTime.value
    generationTime.value = formatDuration(duration)
    
    // 存储生成的文件用于下载
    generatedBlob.value = blob
    
    // 标记所有步骤为完成
    progressSteps.value.forEach(step => {
      step.status = 'completed'
    })
    
    // 通知父组件
    emit('generate', fileList.value.map(f => ({ id: f.id, name: f.name })))
    
  } catch (error) {
    console.error('生成 assets.bin 失败:', error)
    
    // 重置状态
    isGenerating.value = false
    isCompleted.value = false
    
    // 显示错误
    alert(`生成失败: ${error.message}`)
  }
}

const downloadFile = () => {
  if (generatedBlob.value) {
    const url = URL.createObjectURL(generatedBlob.value)
    const element = document.createElement('a')
    element.href = url
    element.download = 'assets.bin'
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    URL.revokeObjectURL(url)
  } else {
    console.error('没有可下载的文件')
  }
}

// 检查设备在线状态
const checkDeviceOnline = async () => {
  try {
    // 获取URL参数中的token
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')

    if (!token) {
      deviceOnline.value = false
      return
    }

    const response = await fetch('/api/messaging/device/tools/list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    deviceOnline.value = response.ok
  } catch (error) {
    console.error('检查设备状态失败:', error)
    deviceOnline.value = false
  }
}

// 开始在线烧录
const startOnlineFlash = async () => {
  if (!generatedBlob.value) {
    flashCurrentStep.value = '错误：没有可烧录的文件'
    return
  }

  if (!deviceOnline.value) {
    flashCurrentStep.value = '错误：设备不在线，无法进行烧录'
    return
  }

  isFlashing.value = true
  flashProgress.value = 0
  flashCurrentStep.value = '准备开始烧录...'

  try {
    // 通知父组件开始在线烧录
    emit('startFlash', {
      blob: generatedBlob.value,
      onProgress: (progress, step) => {
        flashProgress.value = progress
        flashCurrentStep.value = step
      },
      onComplete: () => {
        isFlashing.value = false
        flashProgress.value = 100
        flashCurrentStep.value = '烧录完成！'
      },
      onError: (error) => {
        isFlashing.value = false
        flashCurrentStep.value = `烧录失败: ${error}`
      }
    })
  } catch (error) {
    isFlashing.value = false
    console.error('启动烧录失败:', error)
    flashCurrentStep.value = `启动烧录失败: ${error.message}`
  }
}

// 取消烧录
const cancelFlash = () => {
  if (confirm('确定要取消烧录吗？')) {
    isFlashing.value = false
    flashProgress.value = 0
    flashCurrentStep.value = ''
    emit('cancelFlash')
  }
}


onMounted(async () => {
  initializeFileList()
  await checkDeviceOnline()
})
</script>
