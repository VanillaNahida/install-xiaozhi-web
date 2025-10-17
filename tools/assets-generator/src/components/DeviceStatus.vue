<template>
  <!-- 桌面端布局 -->
  <div v-if="showComponent" class="hidden lg:flex items-center space-x-4" :class="deviceStatus.isOnline ? '' : 'opacity-60'">
    <!-- 设备状态指示器 -->
    <div class="flex items-center space-x-2">
      <!-- 在线状态图标 -->
      <div class="flex items-center space-x-1">
        <div
          :class="[
            'w-2 h-2 rounded-full',
            deviceStatus.isOnline ? 'bg-green-500' : 'bg-gray-400'
          ]"
        ></div>
        <span :class="[
          'text-sm font-medium',
          deviceStatus.isOnline ? 'text-gray-700' : 'text-gray-500'
        ]">
          {{ deviceStatus.isOnline ? '设备在线' : '设备离线' }}
        </span>
      </div>

      <!-- 网络状态 -->
      <div v-if="deviceStatus.isOnline && deviceInfo.network" class="flex items-center space-x-1">
        <!-- Wi-Fi图标 -->
        <svg v-if="deviceInfo.network.type === 'wifi'" class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 9.636c5.076 5.076 13.308 5.076 18.384 0a1 1 0 01-1.414-1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.879a3 3 0 00-4.243 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.414 1.414zM10 16a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path>
        </svg>
        <!-- 4G图标 -->
        <svg v-else-if="deviceInfo.network.type === '4g'" class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
        </svg>
        <span class="text-xs text-gray-500">{{ getSignalDisplayText(deviceInfo.network.signal) }}</span>
      </div>
    </div>

    <!-- 设备详细信息 -->
    <div v-if="deviceStatus.isOnline" class="flex items-center space-x-4 text-sm text-gray-600">
      <!-- 芯片信息 -->
      <div v-if="deviceInfo.chip" class="flex items-center space-x-1">
        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
        </svg>
        <span>{{ deviceInfo.chip.model }}</span>
      </div>

      <!-- 开发板信息 -->
      <div v-if="deviceInfo.board" class="flex items-center space-x-1">
        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
        </svg>
        <span>{{ deviceInfo.board.model }}</span>
      </div>


      <!-- Assets分区大小 -->
      <div v-if="deviceInfo.assets" class="flex items-center space-x-1">
        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
        </svg>
        <span>{{ deviceInfo.assets.size }}</span>
      </div>

      <!-- 屏幕分辨率 -->
      <div v-if="deviceInfo.screen" class="flex items-center space-x-1">
        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        </svg>
        <span>{{ deviceInfo.screen.resolution }}</span>
      </div>
    </div>

  </div>

  <!-- 移动端布局 -->
  <div v-if="showComponent" class="lg:hidden flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <!-- 头部状态栏 -->
    <div class="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
      <div class="flex items-center space-x-2">
        <div
          :class="[
            'w-2.5 h-2.5 rounded-full',
            deviceStatus.isOnline ? 'bg-green-500' : 'bg-red-400'
          ]"
        ></div>
        <span :class="[
          'text-sm font-medium',
          deviceStatus.isOnline ? 'text-gray-800' : 'text-gray-600'
        ]">
          {{ deviceStatus.isOnline ? '设备在线' : '设备离线' }}
        </span>
      </div>

      <!-- 网络状态 -->
      <div v-if="deviceStatus.isOnline && deviceInfo.network" class="flex items-center space-x-1">
        <svg v-if="deviceInfo.network.type === 'wifi'" class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 9.636c5.076 5.076 13.308 5.076 18.384 0a1 1 0 01-1.414-1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.879a3 3 0 00-4.243 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.414 1.414zM10 16a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path>
        </svg>
        <svg v-else-if="deviceInfo.network.type === '4g'" class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
        </svg>
        <span class="text-xs font-medium text-gray-600">{{ getSignalDisplayText(deviceInfo.network.signal) }}</span>
      </div>
    </div>

    <!-- 设备信息区域 -->
    <div v-if="deviceStatus.isOnline" class="px-4 py-3">
      <div class="grid grid-cols-1 gap-2.5">
        <!-- 第一行：芯片和开发板 -->
        <div class="flex justify-between items-center py-1.5 border-b border-gray-100">
          <div v-if="deviceInfo.chip" class="flex items-center space-x-2 flex-1">
            <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
            </svg>
            <div class="min-w-0 flex-1">
              <div class="text-xs text-gray-500 leading-tight">芯片</div>
              <div class="text-sm text-gray-800 font-medium truncate">{{ deviceInfo.chip.model }}</div>
            </div>
          </div>

          <div v-if="deviceInfo.board" class="flex items-center space-x-2 flex-1 ml-3">
            <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
            <div class="min-w-0 flex-1">
              <div class="text-xs text-gray-500 leading-tight">开发板</div>
              <div class="text-sm text-gray-800 font-medium truncate">{{ deviceInfo.board.model }}</div>
            </div>
          </div>
        </div>

        <!-- 第二行：Assets和屏幕 -->
        <div class="flex justify-between items-center py-1.5">
          <div v-if="deviceInfo.assets" class="flex items-center space-x-2 flex-1">
            <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
            </svg>
            <div class="min-w-0 flex-1">
              <div class="text-xs text-gray-500 leading-tight">Assets</div>
              <div class="text-sm text-gray-800 font-medium">{{ deviceInfo.assets.size }}</div>
            </div>
          </div>

          <div v-if="deviceInfo.screen" class="flex items-center space-x-2 flex-1 ml-3">
            <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            <div class="min-w-0 flex-1">
              <div class="text-xs text-gray-500 leading-tight">屏幕</div>
              <div class="text-sm text-gray-800 font-medium">{{ deviceInfo.screen.resolution }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const token = ref('')
const showComponent = ref(false)
const deviceStatus = ref({
  isOnline: false,
  error: '',
  lastCheck: null
})

const deviceInfo = ref({
  chip: null,
  board: null,
  firmware: null,
  assets: null,
  network: null,
  screen: null
})

const retryTimer = ref(null)
const isChecking = ref(false)

// 获取URL参数
const getUrlParameter = (name) => {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get(name)
}

// 检查设备是否在线
const checkDeviceStatus = async () => {
  if (isChecking.value || !token.value) return

  isChecking.value = true
  try {
    const response = await fetch('/api/messaging/device/tools/list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      }
    })

    if (response.ok) {
      deviceStatus.value.isOnline = true
      deviceStatus.value.error = ''
      deviceStatus.value.lastCheck = new Date()

      // 获取设备详细信息
      await fetchDeviceInfo()
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  } catch (error) {
    deviceStatus.value.isOnline = false
    deviceStatus.value.error = ''
    deviceStatus.value.lastCheck = new Date()

    // 60秒后重试
    if (retryTimer.value) {
      clearTimeout(retryTimer.value)
    }
    retryTimer.value = setTimeout(checkDeviceStatus, 30000)
  } finally {
    isChecking.value = false
  }
}

// 获取设备详细信息
const fetchDeviceInfo = async () => {
  try {
    // 并发获取所有设备信息
    const [systemInfoResponse, deviceStateResponse, screenInfoResponse] = await Promise.allSettled([
      callMcpTool('self.get_system_info'),
      callMcpTool('self.get_device_status'),
      callMcpTool('self.screen.get_info')
    ])

    // 处理系统信息
    if (systemInfoResponse.status === 'fulfilled' && systemInfoResponse.value) {
      const data = systemInfoResponse.value.data || systemInfoResponse.value

      deviceInfo.value.chip = { model: data.chip_model_name || '未知' }
      deviceInfo.value.board = { model: data.board?.name || '未知' }
      deviceInfo.value.firmware = { version: data.application?.version || '未知' }

      // 从分区表中找到assets分区的大小
      const assetsPartition = data.partition_table?.find(partition => partition.label === 'assets')
      if (assetsPartition) {
        const sizeInMB = Math.round(assetsPartition.size / 1024 / 1024)
        deviceInfo.value.assets = { size: `${sizeInMB}MB` }
      } else {
        deviceInfo.value.assets = { size: '未知' }
      }
    } else {
      console.warn('系统信息获取失败:', systemInfoResponse.reason || systemInfoResponse.value)
      deviceInfo.value.chip = { model: '未知' }
      deviceInfo.value.board = { model: '未知' }
      deviceInfo.value.firmware = { version: '未知' }
      deviceInfo.value.assets = { size: '未知' }
    }

    // 处理设备状态信息
    if (deviceStateResponse.status === 'fulfilled' && deviceStateResponse.value) {
      const data = deviceStateResponse.value.data || deviceStateResponse.value

      deviceInfo.value.network = {
        type: data.network?.type || 'unknown',
        signal: data.network?.signal || '未知'
      }
    } else {
      console.warn('设备状态获取失败:', deviceStateResponse.reason || deviceStateResponse.value)
      deviceInfo.value.network = { type: 'unknown', signal: '未知' }
    }

    // 处理屏幕信息
    if (screenInfoResponse.status === 'fulfilled' && screenInfoResponse.value) {
      const data = screenInfoResponse.value.data || screenInfoResponse.value

      deviceInfo.value.screen = {
        resolution: `${data.width || 0}x${data.height || 0}`
      }
    } else {
      console.warn('屏幕信息获取失败:', screenInfoResponse.reason || screenInfoResponse.value)
      deviceInfo.value.screen = { resolution: '未知' }
    }
  } catch (error) {
    console.error('获取设备信息时发生错误:', error)
  }
}

// 格式化信号强度显示文本
const getSignalDisplayText = (signal) => {
  if (!signal) return '未知'

  switch (signal.toLowerCase()) {
    case 'strong':
      return '强'
    case 'medium':
      return '中等'
    case 'weak':
      return '弱'
    case 'none':
      return '无信号'
    default:
      return signal
  }
}

// 调用MCP工具
const callMcpTool = async (toolName) => {
  try {
    const response = await fetch('/api/messaging/device/tools/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify({
        name: toolName
      })
    })

    if (response.ok) {
      const result = await response.json()
      // 优先返回data字段，如果没有则返回整个结果
      return result
    } else {
      const errorText = await response.text()
      console.error(`MCP工具 ${toolName} 失败:`, response.status, errorText)
      throw new Error(`调用${toolName}失败: ${response.status} - ${errorText}`)
    }
  } catch (error) {
    console.error(`调用MCP工具 ${toolName} 失败:`, error)
    return null
  }
}

// 初始化组件
onMounted(() => {
  token.value = getUrlParameter('token')
  if (token.value) {
    showComponent.value = true
    checkDeviceStatus()
  }
})

// 清理定时器
onUnmounted(() => {
  if (retryTimer.value) {
    clearTimeout(retryTimer.value)
  }
})
</script>
