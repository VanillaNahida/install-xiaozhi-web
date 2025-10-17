<template>
  <div>
    <!-- 配置状态提示（右下角浮动通知） -->
    <div
      v-if="hasStoredConfig"
      class="fixed bottom-4 right-4 z-50 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg transition-opacity duration-300 min-w-[300px]"
      @mouseenter="resetAutoHideTimer"
    >
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
          </svg>
          <span class="text-blue-800 font-medium">检测到已保存的配置</span>
        </div>
        <button 
          @click="closeConfigNotice"
          class="text-gray-500 hover:text-gray-700"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <p class="text-blue-600 text-sm mb-3">
        配置已自动恢复，您可以继续之前的进度或重新开始
      </p>
      <div class="flex justify-end space-x-2">
        <button 
          @click="confirmReset"
          class="px-3 py-1 text-sm text-red-600 hover:text-red-800 font-medium"
        >
          重新开始
        </button>
      </div>
    </div>

    <!-- Step Indicator -->
    <div class="flex items-center justify-center mb-8">
      <div v-for="(step, index) in steps" :key="index" class="flex items-center">
        <div class="flex flex-col items-center">
          <div :class="getStepClass(index)">
            {{ index + 1 }}
          </div>
          <span class="text-sm mt-2 text-gray-600">{{ step.title }}</span>
        </div>
        <div v-if="index < steps.length - 1" class="w-16 h-0.5 bg-gray-300 mx-4"></div>
      </div>
    </div>

    <!-- Step Content -->
    <div class="bg-white rounded-lg shadow-sm border p-6">
      <ChipConfig 
        v-if="currentStep === 0"
        v-model="config.chip"
        @next="nextStep"
      />
      
      <ThemeDesign 
        v-if="currentStep === 1"
        v-model="config.theme"
        :chipModel="config.chip.model"
        :activeTab="activeThemeTab"
        @next="nextStep"
        @prev="prevStep"
        @tabChange="handleThemeTabChange"
      />
      
      <GenerateSummary 
        v-if="currentStep === 2"
        :config="config"
        @generate="handleGenerate"
        @prev="prevStep"
      />
    </div>

    <!-- Generate Modal -->
    <GenerateModal
      v-if="showGenerateModal"
      :config="config"
      @close="showGenerateModal = false"
      @generate="handleModalGenerate"
      @startFlash="handleStartFlash"
      @cancelFlash="handleCancelFlash"
    />

    <!-- Reset Confirmation Modal -->
    <!-- 移除重置确认对话框 -->
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick, onUnmounted } from 'vue'
import ChipConfig from '@/components/ChipConfig.vue'
import ThemeDesign from '@/components/ThemeDesign.vue'
import GenerateSummary from '@/components/GenerateSummary.vue'
import GenerateModal from '@/components/GenerateModal.vue'
import configStorage from '@/utils/ConfigStorage.js'
import AssetsBuilder from '@/utils/AssetsBuilder.js'
import WebSocketTransfer from '@/utils/WebSocketTransfer.js'

const currentStep = ref(0)
const showGenerateModal = ref(false)
const activeThemeTab = ref('wakeword') // 保持主题设计页面的tab状态

// 存储相关状态
const hasStoredConfig = ref(false) // 是否从存储中恢复了配置
const isAutoSaveEnabled = ref(false) // 是否启用自动保存
const isResetting = ref(false)
const isLoading = ref(true)
const assetsBuilder = new AssetsBuilder()
const autoHideTimer = ref(null) // 新增：自动隐藏定时器
const webSocketTransfer = ref(null) // WebSocket传输实例

const steps = [
  { title: '芯片配置', key: 'chip' },
  { title: '主题设计', key: 'theme' },
  { title: '效果预览', key: 'generate' }
]

const config = ref({
  chip: {
    model: '',
    display: {
      width: 320,
      height: 240,
      color: 'RGB565'
    },
    preset: ''
  },
  theme: {
    wakeword: '',
    font: {
      type: 'preset',
      preset: 'font_puhui_deepseek_20_4',
      custom: {
        file: null,
        size: 20,
        bpp: 4,
        charset: 'deepseek'
      }
    },
    emoji: {
      type: '',
      preset: '',
      custom: {
        size: { width: 160, height: 120 },
        format: 'png',
        images: {}
      }
    },
    skin: {
      light: {
        backgroundType: 'color',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        backgroundImage: null
      },
      dark: {
        backgroundType: 'color', 
        backgroundColor: '#121212',
        textColor: '#ffffff',
        backgroundImage: null
      }
    }
  }
})

const canGenerate = computed(() => {
  return config.value.chip.model && 
         (config.value.theme.font.preset || config.value.theme.font.custom.file)
})

const getStepClass = (index) => {
  if (index < currentStep.value) return 'step-indicator completed'
  if (index === currentStep.value) return 'step-indicator active'
  return 'step-indicator inactive'
}

const nextStep = async () => {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
    
    // 启用自动保存（如果还没启用的话）
    if (!isAutoSaveEnabled.value) {
      isAutoSaveEnabled.value = true
      await saveConfigToStorage()
    }
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const handleGenerate = () => {
  showGenerateModal.value = true
}

const handleModalGenerate = async (selectedItems) => {
  // TODO: 实现实际的生成逻辑
}

// 获取URL参数中的token
const getToken = () => {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('token')
}

// 调用MCP工具
const callMcpTool = async (toolName, params = {}) => {
  try {
    const token = getToken()
    if (!token) {
      throw new Error('未找到认证令牌')
    }

    const response = await fetch('/api/messaging/device/tools/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: toolName,
        arguments: params
      })
    })

    if (response.ok) {
      const result = await response.json()
      return result
    } else {
      const errorText = await response.text()
      throw new Error(`调用${toolName}失败: ${response.status} - ${errorText}`)
    }
  } catch (error) {
    console.error(`调用MCP工具 ${toolName} 失败:`, error.message)
    throw error
  }
}

// 处理开始在线烧录
const handleStartFlash = async (flashData) => {
  const { blob, onProgress, onComplete, onError } = flashData

  try {
    const token = getToken()
    if (!token) {
      throw new Error('未找到认证令牌')
    }

    // 步骤1: 检查设备状态
    onProgress(5, '检查设备状态...')
    const deviceStatus = await callMcpTool('self.get_device_status')
    // 检查设备是否在线（通过API调用成功来判断）

    // 步骤2: 初始化WebSocket传输并获取下载URL
    onProgress(15, '初始化传输服务...')
    webSocketTransfer.value = new WebSocketTransfer(token)

    // 创建一个Promise来等待下载URL准备好
    let downloadUrlReady = null
    const downloadUrlPromise = new Promise((resolve, reject) => {
      downloadUrlReady = resolve
    })

    // 创建一个Promise来等待transfer_started事件
    let transferStartedResolver = null
    const transferStartedPromise = new Promise((resolve, reject) => {
      transferStartedResolver = resolve
    })

    // 初始化WebSocket会话（只建立连接和获取URL）
    webSocketTransfer.value.onTransferStarted = () => {
      // 当收到transfer_started事件时，resolve等待的Promise
      if (transferStartedResolver) {
        transferStartedResolver()
        transferStartedResolver = null
      }
    }

    await webSocketTransfer.value.initializeSession(
      blob,
      (progress, step) => {
        // 初始化进度：15-30
        onProgress(15 + progress * 0.75, step)
      },
      (error) => {
        console.error('WebSocket初始化失败:', error)
        onError('初始化传输服务失败: ' + error.message)
      },
      (downloadUrl) => {
        downloadUrlReady(downloadUrl)
      }
    )

    // 等待下载URL准备好
    const downloadUrl = await downloadUrlPromise

    // 步骤3: 设置设备的下载URL
    onProgress(30, '设置设备下载URL...')
    await callMcpTool('self.assets.set_download_url', {
      url: downloadUrl
    })

    // 步骤4: 重启设备
    onProgress(40, '重启设备...')
    // reboot指令没有返回值，不需要等待，直接调用
    callMcpTool('self.reboot').catch(error => {
      console.warn('reboot指令调用警告（设备可能已重启）:', error)
      // 即使reboot失败，也继续流程，因为设备可能已经重启
    })

    // 步骤5: 等待设备重启并建立HTTP连接（通过transfer_started事件）
    onProgress(50, '等待设备重启...')

    // 等待transfer_started事件，设置60秒超时
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('等待设备重启超时（60秒）')), 60000)
    })

    await Promise.race([transferStartedPromise, timeoutPromise])

    // 步骤6: 开始实际的文件传输
    onProgress(60, '开始传输文件...')

    // 设备已准备好，直接开始传输（transfer_started已收到，sendFileData会立即执行）
    await webSocketTransfer.value.startTransfer(
      (progress, step) => {
        // 文件传输进度：60-100
        const adjustedProgress = 60 + (progress * 0.4)
        onProgress(Math.round(adjustedProgress), step)
      },
      (error) => {
        onError(error.message)
      },
      () => {
        onComplete()
      }
    )

    // 清理回调引用
    webSocketTransfer.value.onTransferStarted = null

  } catch (error) {
    console.error('在线烧录失败:', error)
    onError(error.message)
  }
}

// 处理取消烧录
const handleCancelFlash = () => {
  if (webSocketTransfer.value) {
    webSocketTransfer.value.cancel()
    webSocketTransfer.value.destroy()
    webSocketTransfer.value = null
  }
}

const handleThemeTabChange = (tabId) => {
  activeThemeTab.value = tabId
}

// 从存储加载配置
const loadConfigFromStorage = async () => {
  try {
    isLoading.value = true
    const storedData = await configStorage.loadConfig()
    
    if (storedData) {
      // 恢复配置
      config.value = storedData.config
      currentStep.value = storedData.currentStep
      activeThemeTab.value = storedData.activeThemeTab
      hasStoredConfig.value = true // 显示"检测到已保存的配置"提示
      isAutoSaveEnabled.value = true // 启用自动保存
      
      // 清除之前的定时器
      if (autoHideTimer.value) {
        clearTimeout(autoHideTimer.value)
      }
      
      // 设置5秒后自动隐藏提示
      autoHideTimer.value = setTimeout(() => {
        hasStoredConfig.value = false
      }, 5000)
      
      // 设置 AssetsBuilder 的配置（非严格模式，允许先恢复文件再校验）
      assetsBuilder.setConfig(config.value, { strict: false })
      await assetsBuilder.restoreAllResourcesFromStorage(config.value)
      
      // 触发一次浅拷贝以刷新引用，避免渲染时对占位值执行 createObjectURL
      try {
        const images = config.value?.theme?.emoji?.custom?.images || {}
        config.value = {
          ...config.value,
          theme: {
            ...config.value.theme,
            emoji: {
              ...config.value.theme.emoji,
              custom: {
                ...config.value.theme.emoji.custom,
                images: { ...images }
              }
            }
          }
        }
      } catch (e) {}
      
    } else {
      hasStoredConfig.value = false
      isAutoSaveEnabled.value = false
    }
  } catch (error) {
    console.error('加载配置失败:', error)
    hasStoredConfig.value = false
    isAutoSaveEnabled.value = false
  } finally {
    isLoading.value = false
  }
}

// 保存配置到存储
const saveConfigToStorage = async () => {
  try {
    await configStorage.saveConfig(config.value, currentStep.value, activeThemeTab.value)
  } catch (error) {
    console.error('保存配置失败:', error)
  }
}

// 确认重新开始
const confirmReset = async () => {
  try {
    isResetting.value = true
    
    // 清理 AssetsBuilder 的存储数据
    await assetsBuilder.clearAllStoredData()
    
    // 重置配置到默认值
    config.value = {
      chip: {
        model: '',
        display: {
          width: 320,
          height: 240,
          color: 'RGB565'
        },
        preset: ''
      },
      theme: {
        wakeword: '',
        font: {
          type: 'preset',
          preset: 'font_puhui_deepseek_20_4',
          custom: {
            file: null,
            size: 20,
            bpp: 4,
            charset: 'deepseek'
          }
        },
        emoji: {
          type: '',
          preset: '',
          custom: {
            size: { width: 64, height: 64 },
            format: 'png',
            images: {}
          }
        },
        skin: {
          light: {
            backgroundType: 'color',
            backgroundColor: '#ffffff',
            textColor: '#000000',
            backgroundImage: null
          },
          dark: {
            backgroundType: 'color', 
            backgroundColor: '#121212',
            textColor: '#ffffff',
            backgroundImage: null
          }
        }
      }
    }
    
    // 重置步骤和状态
    currentStep.value = 0
    activeThemeTab.value = 'wakeword'
    hasStoredConfig.value = false
    isAutoSaveEnabled.value = false
    
  } catch (error) {
    console.error('重置配置失败:', error)
    alert('重置失败，请刷新页面重试')
  } finally {
    isResetting.value = false
  }
}

// 监听配置变化，自动保存
watch(config, async (newConfig) => {
  if (!isLoading.value && isAutoSaveEnabled.value) {
    await saveConfigToStorage()
  }
}, { deep: true })

// 监听步骤变化，自动保存
watch(currentStep, async () => {
  if (!isLoading.value && isAutoSaveEnabled.value) {
    await saveConfigToStorage()
  }
})

// 监听主题标签变化，自动保存
watch(activeThemeTab, async () => {
  if (!isLoading.value && isAutoSaveEnabled.value) {
    await saveConfigToStorage()
  }
})

// 页面加载时初始化
onMounted(async () => {
  await configStorage.initialize()
  await loadConfigFromStorage()
})

// 组件卸载时清除定时器
onUnmounted(() => {
  if (autoHideTimer.value) {
    clearTimeout(autoHideTimer.value)
  }
})

// 修改关闭按钮逻辑
const closeConfigNotice = () => {
  hasStoredConfig.value = false
  if (autoHideTimer.value) {
    clearTimeout(autoHideTimer.value)
  }
}

// 重置自动隐藏定时器（鼠标悬停时调用）
const resetAutoHideTimer = () => {
  // 清除之前的定时器
  if (autoHideTimer.value) {
    clearTimeout(autoHideTimer.value)
  }

  // 设置新的5秒定时器
  autoHideTimer.value = setTimeout(() => {
    hasStoredConfig.value = false
  }, 5000)
}
</script>
