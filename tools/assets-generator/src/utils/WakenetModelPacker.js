/**
 * WakenetModelPacker 类
 * 模仿 pack_model.py 的功能，用于在浏览器端打包唤醒词模型
 * 
 * 注意：已修复与Python版本的兼容性问题：
 * - 使用ASCII编码而非UTF-8编码
 * - 确保小端序整数格式一致
 * - 移除冗余的字符串替换操作
 * 
 * 打包格式：
 * {
 *     model_num: int (4字节)
 *     model1_info: model_info_t
 *     model2_info: model_info_t
 *     ...
 *     model1数据
 *     model2数据
 *     ...
 * }
 * 
 * model_info_t格式：
 * {
 *     model_name: char[32] (32字节)
 *     file_number: int (4字节)
 *     file1_name: char[32] (32字节)
 *     file1_start: int (4字节)  
 *     file1_len: int (4字节)
 *     file2_name: char[32] (32字节)
 *     file2_start: int (4字节)   
 *     file2_len: int (4字节)
 *     ...
 * }
 */

class WakenetModelPacker {
  constructor() {
    this.models = new Map()
  }

  /**
   * 添加模型文件
   * @param {string} modelName - 模型名称
   * @param {string} fileName - 文件名
   * @param {ArrayBuffer} fileData - 文件数据
   */
  addModelFile(modelName, fileName, fileData) {
    if (!this.models.has(modelName)) {
      this.models.set(modelName, new Map())
    }
    this.models.get(modelName).set(fileName, fileData)
  }

  /**
   * 从share/wakenet_model目录加载模型
   * @param {string} modelName - 模型名称 (例如: wn9s_nihaoxiaozhi)
   * @returns {Promise<boolean>} 加载是否成功
   */
  async loadModelFromShare(modelName) {
    try {
      // 所有wakenet模型都使用相同的文件名
      const modelFiles = [
        '_MODEL_INFO_',
        'wn9_data',
        'wn9_index'
      ]

      let loadedFiles = 0
      for (const fileName of modelFiles) {
        try {
          const response = await fetch(`./static/wakenet_model/${modelName}/${fileName}`)
          if (response.ok) {
            const fileData = await response.arrayBuffer()
            this.addModelFile(modelName, fileName, fileData)
            loadedFiles++
          } else {
            console.warn(`无法加载文件: ${fileName}, status: ${response.status}`)
          }
        } catch (error) {
          console.warn(`加载文件失败: ${fileName}`, error)
        }
      }

      return loadedFiles === modelFiles.length
    } catch (error) {
      console.error(`加载模型失败: ${modelName}`, error)
      return false
    }
  }

  /**
   * 将字符串打包为固定长度的二进制数据
   * 模仿Python版本的struct_pack_string行为，使用ASCII编码
   * @param {string} string - 输入字符串
   * @param {number} maxLen - 最大长度
   * @returns {Uint8Array} 打包后的二进制数据
   */
  packString(string, maxLen) {
    const bytes = new Uint8Array(maxLen)
    
    // 使用ASCII编码，与Python版本保持一致
    // 不预留null终止符空间，完整使用maxLen字节
    const copyLen = Math.min(string.length, maxLen)
    
    for (let i = 0; i < copyLen; i++) {
      // 使用charCodeAt获取ASCII码，只取低8位以确保兼容性
      bytes[i] = string.charCodeAt(i) & 0xFF
    }
    
    // 剩余字节保持为0（默认初始化值）
    return bytes
  }

  /**
   * 将32位整数转换为小端序字节数组
   * 与Python版本的struct.pack('<I', value)保持一致
   * @param {number} value - 整数值
   * @returns {Uint8Array} 4字节的小端序数组
   */
  packUint32(value) {
    const bytes = new Uint8Array(4)
    bytes[0] = value & 0xFF          // 最低字节 (LSB)
    bytes[1] = (value >> 8) & 0xFF   // 
    bytes[2] = (value >> 16) & 0xFF  // 
    bytes[3] = (value >> 24) & 0xFF  // 最高字节 (MSB)
    return bytes
  }

  /**
   * 打包所有模型为srmodels.bin格式
   * @returns {ArrayBuffer} 打包后的二进制数据
   */
  packModels() {
    if (this.models.size === 0) {
      throw new Error('没有模型数据可打包')
    }

    // 计算所有文件的总数和数据
    let totalFileNum = 0
    const modelDataList = []
    
    // 按模型名排序遍历
    for (const [modelName, files] of Array.from(this.models.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
      totalFileNum += files.size
      // 按文件名排序，确保与Python版本顺序一致
      const sortedFiles = Array.from(files.entries()).sort((a, b) => a[0].localeCompare(b[0]))
      modelDataList.push({
        name: modelName,
        files: sortedFiles
      })
    }

    // 计算头部长度: 模型数量(4) + 每个模型信息(32+4+文件数*(32+4+4))
    const modelNum = this.models.size
    let headerLen = 4 // model_num
    
    for (const model of modelDataList) {
      headerLen += 32 + 4 // model_name + file_number
      headerLen += model.files.length * (32 + 4 + 4) // 每个文件的 name + start + len
    }

    // 创建输出缓冲区
    const totalSize = headerLen + Array.from(this.models.values())
      .reduce((total, files) => total + Array.from(files.values())
        .reduce((fileTotal, fileData) => fileTotal + fileData.byteLength, 0), 0)
    
    const output = new Uint8Array(totalSize)
    let offset = 0

    // 写入模型数量
    output.set(this.packUint32(modelNum), offset)
    offset += 4

    // 写入模型信息头
    let dataOffset = headerLen
    
    for (const model of modelDataList) {
      // 写入模型名称
      output.set(this.packString(model.name, 32), offset)
      offset += 32
      
      // 写入文件数量
      output.set(this.packUint32(model.files.length), offset)
      offset += 4

      // 写入每个文件的信息
      for (const [fileName, fileData] of model.files) {
        // 文件名
        output.set(this.packString(fileName, 32), offset)
        offset += 32
        
        // 文件起始位置
        output.set(this.packUint32(dataOffset), offset)
        offset += 4
        
        // 文件长度
        output.set(this.packUint32(fileData.byteLength), offset)
        offset += 4

        dataOffset += fileData.byteLength
      }
    }

    // 写入文件数据
    for (const model of modelDataList) {
      for (const [fileName, fileData] of model.files) {
        output.set(new Uint8Array(fileData), offset)
        offset += fileData.byteLength
      }
    }

    return output.buffer
  }

  /**
   * 获取可用的模型列表
   * @returns {Promise<Array>} 模型列表
   */
  static async getAvailableModels() {
    try {
      // 尝试获取模型列表的几种方式
      const wn9Models = [
        'wn9_alexa', 'wn9_astrolabe_tts', 'wn9_bluechip_tts2', 'wn9_computer_tts',
        'wn9_haixiaowu_tts', 'wn9_heyily_tts2', 'wn9_heyprinter_tts', 'wn9_heywanda_tts',
        'wn9_heywillow_tts', 'wn9_hiesp', 'wn9_hifairy_tts2', 'wn9_hijason_tts2',
        'wn9_hijolly_tts2', 'wn9_hijoy_tts', 'wn9_hilexin', 'wn9_hilili_tts',
        'wn9_himfive', 'wn9_himiaomiao_tts', 'wn9_hitelly_tts', 'wn9_hiwalle_tts2',
        'wn9_hixiaoxing_tts', 'wn9_jarvis_tts', 'wn9_linaiban_tts2', 'wn9_miaomiaotongxue_tts',
        'wn9_mycroft_tts', 'wn9_nihaobaiying_tts2', 'wn9_nihaodongdong_tts2', 'wn9_nihaomiaoban_tts2',
        'wn9_nihaoxiaoan_tts2', 'wn9_nihaoxiaoxin_tts', 'wn9_nihaoxiaoyi_tts2', 'wn9_nihaoxiaozhi',
        'wn9_nihaoxiaozhi_tts', 'wn9_sophia_tts', 'wn9_xiaoaitongxue', 'wn9_xiaobinxiaobin_tts',
        'wn9_xiaojianxiaojian_tts2', 'wn9_xiaokangtongxue_tts2', 'wn9_xiaolongxiaolong_tts',
        'wn9_xiaoluxiaolu_tts2', 'wn9_xiaomeitongxue_tts', 'wn9_xiaomingtongxue_tts2',
        'wn9_xiaosurou_tts2', 'wn9_xiaotexiaote_tts2', 'wn9_xiaoyaxiaoya_tts2', 'wn9_xiaoyutongxue_tts2'
      ]

      const wn9sModels = [
        'wn9s_alexa', 'wn9s_hiesp', 'wn9s_hijason', 'wn9s_hilexin', 'wn9s_nihaoxiaozhi'
      ]

      return {
        WakeNet9: wn9Models,
        WakeNet9s: wn9sModels
      }
    } catch (error) {
      console.error('获取模型列表失败:', error)
      return { WakeNet9: [], WakeNet9s: [] }
    }
  }

  /**
   * 验证模型名称是否有效
   * @param {string} modelName - 模型名称
   * @param {string} chipModel - 芯片型号
   * @returns {boolean} 是否有效
   */
  static isValidModel(modelName, chipModel) {
    const isC3OrC6 = chipModel === 'esp32c3' || chipModel === 'esp32c6'
    
    if (isC3OrC6) {
      return modelName.startsWith('wn9s_')
    } else {
      return modelName.startsWith('wn9_')
    }
  }

  /**
   * 清理已加载的模型数据
   */
  clear() {
    this.models.clear()
  }

  /**
   * 获取已加载的模型统计
   * @returns {Object} 统计信息
   */
  getStats() {
    let totalFiles = 0
    let totalSize = 0
    
    for (const files of this.models.values()) {
      totalFiles += files.size
      for (const fileData of files.values()) {
        totalSize += fileData.byteLength
      }
    }

    return {
      modelCount: this.models.size,
      fileCount: totalFiles,
      totalSize,
      models: Array.from(this.models.keys())
    }
  }

  /**
   * 验证打包格式的兼容性
   * 用于测试与Python版本的一致性
   * @returns {Object} 验证结果
   */
  validatePackingCompatibility() {
    // 测试字符串打包
    const testString = "test_model"
    const packedString = this.packString(testString, 32)
    
    // 测试整数打包
    const testInt = 0x12345678
    const packedInt = this.packUint32(testInt)
    
    return {
      stringPacking: {
        input: testString,
        output: Array.from(packedString).map(b => `0x${b.toString(16).padStart(2, '0')}`),
        isASCII: packedString.every((b, i) => i >= testString.length || b === testString.charCodeAt(i))
      },
      intPacking: {
        input: `0x${testInt.toString(16)}`,
        output: Array.from(packedInt).map(b => `0x${b.toString(16).padStart(2, '0')}`),
        isLittleEndian: packedInt[0] === 0x78 && packedInt[3] === 0x12
      }
    }
  }
}

export default WakenetModelPacker
