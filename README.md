# Morphism.io

*打破纯粹数学与底层系统工程之间的信任鸿沟。*

## 设计初衷 (The Problem)
几十年来，系统架构中一直存在着一个根本性的“信任鸿沟”。研究人员在白板上设计优雅的数学模型——无论是在信息论中计算离散信源的熵，还是映射凯莱群（Cayley group）的同态关系。但当需要将这些理论实现到微内核或高速信号处理协议中时，理论往往会在成百上千行容易出错的、手工编写的代码中丢失。

Morphism.io 专为彻底抹除这一鸿沟而生。它不是传统的 SaaS 看板，而是一个深科技（Deep-tech）集成开发环境（IDE）。

## 架构亮点 (Architecture Highlights)
- **Deep Space 视觉与 WebGL 拓扑**：采用极度克制、零视觉噪音的暗色主题 UI。中央 WebGL 画布由定制的物理引擎驱动，拓扑结构能在毫秒级对数学参数的变化做出力学响应。
- **Wasm 核心大脑**：彻底剥夺了 JavaScript 的计算权。平台的大脑是一个由 Rust 编译而来的纯粹 WebAssembly 引擎，具备连续的内存布局，以最大化 CPU 缓存命中率。
- **裸机代码发射器 (Bare-Metal Emitter)**：右侧原生的 Monaco 编辑器并不只生成伪代码，而是发射（Emit）零成本抽象、时间复杂度为 $O(1)$ 的 `no_std` Rust 代码，将复杂的拓扑树直接拍平为静态状态机。
- **现代化 CI/CD 生态闭环**：通过原生 Git 整合，一键将生成的底层 Rust 代码与独有的 `.morphism` 数学元数据文件作为 Pull Request 提交至企业级代码库。

## 目录结构与文件说明 (Directory Structure & File Analysis)

整个代码库被严格划分为三个核心领域：前端 UI、Wasm 编译核心、裸机模拟验证。

```text
morphism-io-ide/
├── src/                          # 1. IDE 应用程序 (前端 UI 界面层)
│   ├── components/               # React UI 组件库
│   │   ├── BrutalistTitle.jsx    # "MORPHEUS" 机能风几何排版标题组件
│   │   ├── CodeExporter.jsx      # 裸机发射器面板 (集成 Monaco 编辑器)
│   │   ├── Logo.jsx              # SVG 拓扑态射专属 Logo
│   │   ├── TopologySidebar.jsx   # 拓扑 / 模空间资源管理器 (参数控制侧边栏)
│   │   └── WebGLCanvas.jsx       # 核心的 WebGL 物理力导向拓扑画布
│   ├── App.jsx                   # 应用的主布局与状态聚合 (左右分栏设计)
│   └── index.css                 # 引入 Tailwind 并定义 "Deep Space" 暗黑主题
├── morphism-core/                # 2. 数学引擎核心 (纯 Rust)
│   ├── src/                      # 包含抽象代数、信息论结构与拓扑算法推导
│   └── Cargo.toml                # 配置为编译目标 `wasm32-unknown-unknown`
├── morphism-qemu-sim/            # 3. QEMU 裸机模拟验证沙盒 (Bare-Metal Simulator)
│   ├── src/                      # 纯 `no_std` 运行入口，用于严格测试生成的状态机代码
│   ├── memory.x                  # 自定义物理内存布局映射文件
│   └── sim.ld                    # 用于裸机环境异常表和段分布的 Linker Scripts
├── vite.config.js                # Vite 构建流配置 (注入 Wasm 与顶层 await 支持)
├── tailwind.config.js            # Tailwind 配置 (严格的 slate-900, 霓虹青, 电光紫)
└── .gitignore                    # Git 忽略配置 (过滤编译产物与临时代理目录)
```

### 1. IDE 应用程序 (`/src/`)
主导用户交互与视觉呈现，基于 Vite + React。
- **`App.jsx`**: IDE 主控视图，负责协调左侧资源管理器、中央 WebGL 画布与右侧代码发射器。
- **`BrutalistTitle.jsx` & `Logo.jsx`**: 打造深科技冷峻视觉的机能风标题与原生 SVG 拓扑态射徽标。
- **`WebGLCanvas.jsx`**: 前端最重的数据流展现组件，利用物理引擎将节点推向几何平衡点。
- **`CodeExporter.jsx`**: 代码发射器组件，通过 Monaco 编辑器实时展示将被植入芯片的裸机 Rust 代码。

### 2. 数学核心引擎 (`/morphism-core/`)
该目录下完全没有 UI 逻辑，只有纯粹的 Rust 数学推导。
- 借由 `Cargo.toml` 与 `wasm-bindgen`，这里的硬核逻辑会被编译为 WebAssembly，使得浏览器能够以近乎原生的速度处理拓扑张力计算。

### 3. 裸机模拟器 (`/morphism-qemu-sim/`)
打通代码生成的最后一步信任闭环。
- 这是一个没有操作系统 (OS) 开销的运行环境。生成的 `no_std` 状态机代码会被放在这里的 `src/` 中，通过 `memory.x` 和 `sim.ld` 等底层链接脚本直接在 QEMU 虚拟机中进行物理寻址和芯片指令模拟，确保代码下发至硅片时的绝对安全。
