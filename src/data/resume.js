export const profile = {
  name: '李浩然',
  nameEn: 'LI HAORAN',
  role: '嵌入式软件开发工程师',
  roleEn: 'Embedded Software Engineer',
  age: '21',
  degree: '本科',
  location: '哈尔滨 · 全国可到岗',
  phone: '132 8492 9767',
  phoneRaw: '13284929767',
  email: '13284929767@163.com',
  github: 'litt-s',
  githubUrl: 'https://github.com/litt-s',
  repos: [{ key: 'github', username: 'litt-s', url: 'https://github.com/litt-s' }],
  wechat: 'LHRHMW20',
  education: {
    school: '黑龙江东方学院',
    major: '软件工程 · 华为产业学院',
    period: '2023.09 - 2027.07',
  },
  focus: 'STM32 · OpenHarmony · 物联网',
};

export const repoPlatforms = [
  { key: 'gitee', label: 'Gitee' },
  { key: 'github', label: 'GitHub' },
  { key: 'gitcode', label: 'GitCode' },
];

export const hero = {
  eyebrow: '嵌入式软件开发工程师 · 哈尔滨',
  statement: '用逻辑，点亮硬件',
  headFirst: '用逻辑',
  headSecond: '点亮硬件',
  sub: '专注 STM32 / OpenHarmony / 物联网系统与协议栈开发，把每一块芯片变成真正会思考的终端。',
};

export const contact = {
  title: '有项目\n想一起落地？',
  eyebrow: 'Contact · 联系我',
};

export const experience = {
  intro:
    '你好，我是李浩然，一名嵌入式软件开发工程师。从底层的寄存器与总线，到上层的协议栈与物联网平台，我都能把想法变成真正跑在硬件上的系统。目前就读于黑龙江东方学院软件工程（华为产业学院），偏好把复杂硬件写成可读、可维护、可联调的代码。',
  stats: [
    { value: '02', label: '自研智能系统', sub: '婴儿监护 · 智慧农业' },
    { value: '05', label: '通信协议栈', sub: 'MQTT · UART · BLE · SLE' },
    { value: '03', label: '竞赛奖项', sub: '含华为ICT国家三等奖' },
    { value: '01', label: '专业认证', sub: 'HCIP 设备高级开发' },
  ],
};

export const projects = [
  {
    id: 'yuhu',
    index: '01',
    name: '鸿婴云护',
    en: 'YUNHU · SMART BABY CARE',
    tagline: '基于鸿蒙星闪 SLE 的智能婴儿监护系统',
    desc: '覆盖传感器采集、设备控制、云端通信、远程监控与异常短信告警全流程。',
    video: '/videos/yuhu.mp4',
    longDesc:
      '「鸿婴云护」是一套基于鸿蒙星闪（NearLink SLE）的智能婴儿监护系统，端到端打通了传感器采集、设备控制、云端通信、远程监控与异常短信告警的完整链路。主控基于 OpenHarmony / LiteOS 多任务调度，将 NearLink 通信、LCD 显示、MQTT 上云与 SMS 告警划分为独立任务并按优先级协同运行。应用层基于 SSAP 协议设计 12 字节数据帧，完成温湿度、水位与设备状态的编码、传输、解析与 LCD 实时显示；通过华为云 IoT 平台实现设备属性上报、命令订阅与远程控制指令下发；并编写 Air724UG UART 驱动与 AT 指令交互，实现 UCS2 中文短信编码与水位异常自动告警。硬件上还通过 PWM 驱动 SG90 舵机，以 3 字节控制帧实现停止、低速、高速三级摇床模式切换。',
    tech: ['OpenHarmony', 'LiteOS', 'NearLink SLE', 'MQTT', 'UART', 'PWM', '华为云IoT'],
    link: 'github.com/LHRHMW20/nearlink-baby-system',
    linkLabel: 'nearlink-baby-system',
    points: [
      '基于 SSAP 协议设计 12 字节应用层数据帧，完成传感器数据的编码、传输、解析与 LCD 实时显示',
      '基于 LiteOS 划分 NearLink / LCD / MQTT / SMS 任务，合理设置优先级，实现多模块协同',
      '接入华为云 IoT，通过 MQTT 完成属性上报、命令订阅与远程控制指令下发',
      '编写 Air724UG UART 驱动与 AT 指令交互，实现 UCS2 中文短信编码及水位异常自动告警',
      '通过 PWM 驱动 SG90 舵机，设计 3 字节控制帧，实现三级摇床模式切换',
    ],
  },
  {
    id: 'zhiyun',
    index: '02',
    name: '智耘',
    en: 'ZHIYUN · SMART AGRICULTURE',
    tagline: '基于 STM32 与 HarmonyOS 的智慧农业监控系统',
    desc: '环境数据采集、执行器自动控制、OLED 本地显示及 App 远程监控。',
    video: '/videos/zhiyun.mp4',
    longDesc:
      '「智耘」是一套基于 STM32 与 HarmonyOS 的智慧农业监控系统，围绕环境数据采集、执行器自动控制、OLED 本地显示与 App 远程监控展开。系统编写 DHT11 与 ADC 多通道驱动，实现温湿度、土壤湿度、光照与降雨状态的 2 秒周期采集；开发 4 路继电器控制程序，实现水泵、风扇、雾化器与补光灯的自动控制及 App 手动切换。基于软件 I²C 驱动 OLED，设计 6 页面菜单与双按键交互，展示环境数据、设备状态与控制模式。同时设计 STM32 与 WS63 之间的 UART 通信协议，以 JSON 完成 5 秒周期数据上报与指令解析；并基于 BLE 实现设备端与 HarmonyOS App 的数据透传，定位并修复了波特率不匹配、数据包不完整与连接不稳定等问题。',
    tech: ['STM32F1', 'HarmonyOS', 'WS63', 'BLE', 'UART', 'ADC', 'I²C', 'JSON'],
    link: 'github.com/soft-hardli/zhiyun',
    linkLabel: 'soft-hardli/zhiyun',
    points: [
      '编写 DHT11 与 ADC 多通道驱动，实现温湿度、土壤湿度、光照、降雨的 2 秒周期采集',
      '开发 4 路继电器控制程序，实现水泵、风扇、雾化器、补光灯的自动控制与 App 手动切换',
      '基于软件 I²C 驱动 OLED，设计 6 页面菜单与双按键交互，展示数据、状态与控制模式',
      '设计 STM32 与 WS63 的 UART 协议，以 JSON 完成 5 秒周期数据上报及指令解析',
      '基于 BLE 实现设备端与 HarmonyOS App 数据透传，定位并修复波特率、数据包完整性问题',
    ],
  },
];

export const strengths = [
  {
    n: '01',
    title: '嵌入式开发',
    desc: '熟悉 STM32F1、WS63 等平台，具备传感器、显示、继电器、舵机及蜂窝通信模块的接入与调试经验。',
  },
  {
    n: '02',
    title: '外设驱动',
    desc: '熟悉 GPIO / UART / I²C / SPI / ADC / PWM，能按芯片手册完成基础驱动开发与功能调试。',
  },
  {
    n: '03',
    title: '操作系统',
    desc: '了解 OpenHarmony 与 LiteOS，掌握任务调度、优先级、信号量、互斥锁等多任务开发基础。',
  },
  {
    n: '04',
    title: '通信协议',
    desc: '熟悉 MQTT / UART / BLE / SLE，具备应用层数据帧与 JSON 格式的设计、解析与调试经验。',
  },
  {
    n: '05',
    title: '物联网平台',
    desc: '具备华为云 IoT 设备接入、属性上报、命令订阅及远程设备控制的完整实践能力。',
  },
  {
    n: '06',
    title: '编程语言',
    desc: '熟悉 C 语言，掌握指针、结构体、位运算与模块化编程；熟悉 ArkTS，了解 Java、HTML、CSS。',
  },
];
