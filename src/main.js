import './style.css'
// 使用CDN引入的Vue，无需导入
const { createApp, ref, onMounted } = Vue

// 创建Vue应用
createApp({
  setup() {
    // 响应式数据
    const count = ref(0)
    const isCounting = ref(false)
    const recommendedCommand = 'sudo bash -c "$(wget -qO- xiaozhi.xcnahida.cn)"'
    const alternateCommand1 = 'sudo bash -c "$(wget -qO- https://ghfast.top/https://raw.githubusercontent.com/VanillaNahida/Install_xiaozhi-server/refs/heads/main/install_whiptail.sh)"'
    const alternateCommand2 = 'sudo bash -c "$(wget -qO- https://raw.githubusercontent.com/VanillaNahida/Install_xiaozhi-server/refs/heads/main/install_whiptail.sh)"'
    const copied = ref(false)
    const copiedCommand = ref('')

    // 获取访问计数
    const fetchCount = async () => {
      try {
        const response = await fetch('https://xiaozhi.xcnahida.cn/counts')
        const data = await response.json()
        if (data.count !== count.value) {
          const oldCount = count.value
          count.value = data.count
          // 有变动时触发动画
          animateCounter(oldCount, data.count)
        }
        return data; // 返回数据，使得调用者可以使用.then()
      } catch (error) {
        console.error('Failed to fetch count:', error)
        throw error; // 抛出错误，使得调用者可以使用.catch()
      }
    }

    // 复制命令到剪贴板
    const copyToClipboard = (command, commandName) => {
      navigator.clipboard.writeText(command)
        .then(() => {
          copied.value = true
          copiedCommand.value = commandName
          setTimeout(() => {
            copied.value = false
            copiedCommand.value = ''
          }, 2000)
        })
        .catch(err => {
          console.error('Failed to copy: ', err)
        })
    }

    // 格式化数字，添加千位分隔符
    const formatNumber = (num) => {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }

    // 从下往上滚动的计数器动画效果
    const animateCounter = (start, end) => {
      // 如果已经在计数中，则不触发新的动画
      if (isCounting.value) return

      isCounting.value = true
      // 根据数值大小调整动画持续时间，数值越大动画时间越长
      const duration = Math.min(2000, 500 + Math.abs(end - start) * 10) // 动画持续时间(ms)
      const steps = 60 // 动画步数
      const increment = (end - start) / steps
      const interval = duration / steps
      let current = start

      const timer = setInterval(() => {
        current += increment
        // 使用Math.floor确保显示整数
        count.value = Math.floor(current)

        // 检查是否到达目标值
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
          count.value = end
          clearInterval(timer)
          isCounting.value = false
        }
      }, interval)
    }

    // 礼花特效函数
    const createFireworks = () => {
      const container = document.querySelector('.container')
      const fireworksCount = 5

      for (let i = 0; i < fireworksCount; i++) {
        setTimeout(() => {
          const firework = document.createElement('div')
          firework.className = 'firework'

          // 随机位置
          const x = Math.random() * 100
          const y = Math.random() * 50
          firework.style.left = `${x}%`
          firework.style.top = `${y}%`

          // 随机颜色
          const colors = ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107']
          const color = colors[Math.floor(Math.random() * colors.length)]
          firework.style.backgroundColor = color

          container.appendChild(firework)

          // 移除礼花元素
          setTimeout(() => {
            container.removeChild(firework)
          }, 1500)
        }, i * 300)
      }
    }

    // 挂载时获取计数并启动动画
    onMounted(() => {
      // 首次获取计数，并在获取成功后启动动画
      fetchCount().then(() => {
        // 确保有有效的计数值后再启动动画
        if (count.value > 0) {
          animateCounter(0, count.value)
        }
      })
      // 每3秒刷新一次计数
      setInterval(fetchCount, 3000)
      // 触发礼花特效
      createFireworks()
    })

    // 暴露给模板的数据和方法
    return {
      count,
      formatNumber,
      recommendedCommand,
      alternateCommand1,
      alternateCommand2,
      copied,
      copiedCommand,
      copyToClipboard
    }
  },

  template: `
    <div class="container">
      <div class="header">
        <img src="/logo.svg" alt="Logo" class="logo" />
        <h1>小智AI相关资源导航页</h1>
      </div>

      <div class="features-section">
        <h2>功能入口</h2>
        <div class="buttons-container">
          <a href="/tools/wificonfig/" target="_blank">
            <button>声波配网页</button>
          </a>
          <a href="/tools/test_page/" target="_blank">
            <button>小智服务端测试页</button>
          </a>
          <a href="/tools/assets-generator/" target="_blank">
            <button>小智资源生成页</button>
          </a>
        </div>
      </div>

      <div class="counter-section">
        <p>已被安装了</p>
        <div class="counter">{{ formatNumber(count) }}</div>
        <p>次</p>
      </div>

      <div class="install-section">
        <h2>一键安装脚本</h2>
        <p>复制以下命令到终端执行：</p>
        
        <div class="command-group">
          <h3>推荐命令（本站加速）：</h3>
          <div class="command-box">
              <div class="code-header">
                <div class="code-dots">
                  <div class="code-dot red"></div>
                  <div class="code-dot yellow"></div>
                  <div class="code-dot green"></div>
                </div>
              </div>
              <div class="code-content">
                <code>{{ recommendedCommand }}</code>
                <button @click="copyToClipboard(recommendedCommand, '推荐命令')" :class="{ 'copied': copied && copiedCommand === '推荐命令' }">
                  <img src="/copy-icon.svg" alt="复制" class="copy-icon" />
                </button>
              </div>
          </div>
        </div>
        
        <div class="command-group">
          <h3>备用命令1（ghfast镜像源）：</h3>
          <div class="command-box">
              <div class="code-header">
                <div class="code-dots">
                  <div class="code-dot red"></div>
                  <div class="code-dot yellow"></div>
                  <div class="code-dot green"></div>
                </div>
              </div>
              <div class="code-content">
                <code>{{ alternateCommand1 }}</code>
                <button @click="copyToClipboard(alternateCommand1, '')" :class="{ 'copied': copied && copiedCommand === '' }">
                  <img src="/copy-icon.svg" alt="复制" class="copy-icon" />
                </button>
              </div>
          </div>
        </div>
        
        <div class="command-group">
          <h3>备用命令2（GitHub源，不推荐国内使用）：</h3>
          <div class="command-box">
              <div class="code-header">
                <div class="code-dots">
                  <div class="code-dot red"></div>
                  <div class="code-dot yellow"></div>
                  <div class="code-dot green"></div>
                </div>
              </div>
              <div class="code-content">
                <code>{{ alternateCommand2 }}</code>
                <button @click="copyToClipboard(alternateCommand2, '')" :class="{ 'copied': copied && copiedCommand === '' }">
                  <img src="/copy-icon.svg" alt="复制" class="copy-icon" />
                </button>
              </div>
          </div>
        </div>
        
        <div class="mac-toast" v-if="copied">
          <div class="toast-header">
            <div class="toast-dots">
              <div class="toast-dot red"></div>
              <div class="toast-dot yellow"></div>
              <div class="toast-dot green"></div>
            </div>
          </div>
          <div class="toast-content">
            🎉{{ copiedCommand }}复制成功！
          </div>
        </div>
      </div>

      <footer class="footer">
        <div class="footer-content">
          <p>作者：香草味的纳西妲喵</p>
          <a href="https://github.com/VanillaNahida/install-xiaozhi-web" target="_blank" class="github-link">
            <svg class="github-icon" viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
            浏览站点GitHub仓库页
          </a>
        </div>
        <div class="icp-info">
          <a href="https://beian.miit.gov.cn" target="_blank">鄂ICP备2025161794号-1</a>
        </div>
      </footer>
    </div>
  `
}).mount('#app')
