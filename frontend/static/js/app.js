/**
 * AI-Test 前端交互逻辑 v2
 * 流行模型快速添加 + 一键基准测试
 */

const API_BASE = '/api';

// ── 流行大模型列表 ──
const POPULAR_MODELS = [
    // OpenAI
    { name: "GPT-4o", type: "openai", provider: "OpenAI", endpoint: "https://api.openai.com/v1/chat/completions", icon: "🤖", capabilities: ["chat", "vision", "function_call"] },
    { name: "GPT-4o Mini", type: "openai", provider: "OpenAI", endpoint: "https://api.openai.com/v1/chat/completions", icon: "🤖", capabilities: ["chat", "vision"] },
    { name: "GPT-4 Turbo", type: "openai", provider: "OpenAI", endpoint: "https://api.openai.com/v1/chat/completions", icon: "🤖", capabilities: ["chat", "vision", "function_call"] },
    { name: "GPT-4", type: "openai", provider: "OpenAI", endpoint: "https://api.openai.com/v1/chat/completions", icon: "🤖", capabilities: ["chat", "function_call"] },
    { name: "GPT-3.5 Turbo", type: "openai", provider: "OpenAI", endpoint: "https://api.openai.com/v1/chat/completions", icon: "🤖", capabilities: ["chat"] },
    // Anthropic
    { name: "Claude 3.5 Sonnet", type: "claude", provider: "Anthropic", endpoint: "https://api.anthropic.com/v1/messages", icon: "🧠", capabilities: ["chat", "vision"] },
    { name: "Claude 3.5 Haiku", type: "claude", provider: "Anthropic", endpoint: "https://api.anthropic.com/v1/messages", icon: "🧠", capabilities: ["chat", "vision"] },
    { name: "Claude 3 Opus", type: "claude", provider: "Anthropic", endpoint: "https://api.anthropic.com/v1/messages", icon: "🧠", capabilities: ["chat", "vision"] },
    { name: "Claude 3 Sonnet", type: "claude", provider: "Anthropic", endpoint: "https://api.anthropic.com/v1/messages", icon: "🧠", capabilities: ["chat", "vision"] },
    // Google
    { name: "Gemini 1.5 Pro", type: "gemini", provider: "Google", endpoint: "https://generativelanguage.googleapis.com/v1beta/models", icon: "💎", capabilities: ["chat", "vision", "function_call"] },
    { name: "Gemini 1.5 Flash", type: "gemini", provider: "Google", endpoint: "https://generativelanguage.googleapis.com/v1beta/models", icon: "💎", capabilities: ["chat", "vision"] },
    { name: "Gemini 1.0 Pro", type: "gemini", provider: "Google", endpoint: "https://generativelanguage.googleapis.com/v1beta/models", icon: "💎", capabilities: ["chat"] },
    // Meta / Llama
    { name: "Llama 3.1 405B", type: "custom", provider: "Meta", endpoint: "", icon: "🦙", capabilities: ["chat"] },
    { name: "Llama 3.1 70B", type: "custom", provider: "Meta", endpoint: "", icon: "🦙", capabilities: ["chat"] },
    { name: "Llama 3.1 8B", type: "custom", provider: "Meta", endpoint: "", icon: "🦙", capabilities: ["chat"] },
    { name: "Llama 3 70B", type: "custom", provider: "Meta", endpoint: "", icon: "🦙", capabilities: ["chat"] },
    { name: "Llama 3 8B", type: "custom", provider: "Meta", endpoint: "", icon: "🦙", capabilities: ["chat"] },
    // 通义千问
    { name: "Qwen2.5 72B", type: "custom", provider: "阿里云", endpoint: "", icon: "🐟", capabilities: ["chat"] },
    { name: "Qwen2.5 32B", type: "custom", provider: "阿里云", endpoint: "", icon: "🐟", capabilities: ["chat"] },
    { name: "Qwen2.5 7B", type: "custom", provider: "阿里云", endpoint: "", icon: "🐟", capabilities: ["chat"] },
    { name: "Qwen2.5 VL 72B", type: "custom", provider: "阿里云", endpoint: "", icon: "🐟", capabilities: ["chat", "vision"] },
    { name: "Qwen2.5 VL 7B", type: "custom", provider: "阿里云", endpoint: "", icon: "🐟", capabilities: ["chat", "vision"] },
    // DeepSeek
    { name: "DeepSeek-V2.5", type: "custom", provider: "DeepSeek", endpoint: "https://api.deepseek.com/v1/chat/completions", icon: "🔵", capabilities: ["chat"] },
    { name: "DeepSeek-V2", type: "custom", provider: "DeepSeek", endpoint: "https://api.deepseek.com/v1/chat/completions", icon: "🔵", capabilities: ["chat"] },
    { name: "DeepSeek-Coder-V2", type: "custom", provider: "DeepSeek", endpoint: "https://api.deepseek.com/v1/chat/completions", icon: "🔵", capabilities: ["chat"] },
    // 零一万物
    { name: "Yi-1.5 34B", type: "custom", provider: "零一万物", endpoint: "", icon: "🦄", capabilities: ["chat"] },
    { name: "Yi-1.5 9B", type: "custom", provider: "零一万物", endpoint: "", icon: "🦄", capabilities: ["chat"] },
    // 智谱
    { name: "GLM-4 9B", type: "custom", provider: "智谱AI", endpoint: "", icon: "📊", capabilities: ["chat"] },
    { name: "GLM-4V", type: "custom", provider: "智谱AI", endpoint: "", icon: "📊", capabilities: ["chat", "vision"] },
    // MiniMax
    { name: "MiniMax-Text-01", type: "custom", provider: "MiniMax", endpoint: "", icon: "🟣", capabilities: ["chat"] },
    // 月之暗面
    { name: "Moonshot-v1 128K", type: "custom", provider: "月之暗面", endpoint: "", icon: "🌙", capabilities: ["chat"] },
    // 阶跃星辰
    { name: "Step-2 万亿参数", type: "custom", provider: "阶跃星辰", endpoint: "", icon: "⭐", capabilities: ["chat"] },
];


// ChatAI 聚合平台真实模型列表（chatai.sjzgw.cn 爬取）
const CHATAI_MODELS = [
    { name: "G-5-nano", provider: "general", desc: "G-5-Nano-0807, 最快、最具成本效益的版本", caps: ["chat"], is_new: false, is_hot: true, credit: 0 },
    { name: "G-5.4-nano", provider: "general", desc: "G-5.4-Nano-0317, 用于速度和成本最为重要的任务。", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "G-5.4-mini", provider: "general", desc: "G-5.4-Mini-0317, 将 5.4 的优势提升到更快、更高效的状态 为高负载工作量设计的模型。", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "G-5-mini", provider: "general", desc: "G-5-Mini-0807, 更快、更经济高效的版本，适用于明确定义的任务", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "G-4.1-mini", provider: "general", desc: "G-4.1-mini-0414, 兼顾智能、速度和成本", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "G-4.1-nano", provider: "general", desc: "G-4.1-nano-0414, 最快、最具成本效益的 GPT-4.1 模型", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "G-4o-mini", provider: "general", desc: "G-4o-mini-0718, 快速、经济的小型GPT模型", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "Gemini 3.1 Flash-Lite", provider: "general", desc: "Gemini 3.1 Flash-Lite-0304, 最具成本效益的模型针对的是大量代理任务、翻译和简单数据处理。", caps: ["chat"], is_new: true, is_hot: false, credit: 0 },
    { name: "GLM-5.1", provider: "general", desc: "GLM-5.1-0408,是智谱AI推出的面向长程任务设计的模型，拥有强大逻辑推理、长文本理解与代码生成能力、兼顾性能与推理效率；在多任务基准中表现优异，适用于智能交互、企业应用、开发辅助等场景。", caps: ["chat"], is_new: true, is_hot: false, credit: 0 },
    { name: "DeepSeek V4 Flash", provider: "general", desc: "DeepSeek V4 Flash-0424 拥有百万字超长上下文，在 Agent 能力、世界知识和推理性能上均实现国内与开源领域的领先。", caps: ["chat"], is_new: true, is_hot: false, credit: 0 },
    { name: "DeepSeek-V3.2", provider: "general", desc: "DeepSeek-V3.2-1201正式版模型，平衡推理能力与输出长度，适合日常使用", caps: ["chat"], is_new: false, is_hot: true, credit: 0 },
    { name: "DeepSeek-V3.2 Thinking", provider: "general", desc: "DeepSeek-V3.2-1201启用了推理功能，平衡推理能力与输出长度，适合日常使用", caps: ["chat"], is_new: false, is_hot: true, credit: 0 },
    { name: "DeepSeek-V3", provider: "general", desc: "V3-0324最新版，数学，代码，推理能力显著提升", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "通义千问", provider: "general", desc: "通义千问-0624, 专注于增强 AI 推理能力", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "通义千问 Plus", provider: "general", desc: "通义千问 Plus-0624, 适合中等复杂任务", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "MiniMax-M2", provider: "general", desc: "MiniMax-M2，专为 Agent 和代码而生.", caps: ["chat"], is_new: true, is_hot: false, credit: 0 },
    { name: "kimi-v1-8k", provider: "general", desc: "kimi-v1-8k-latest, 适用于生成短文本", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "kimi-v1-32k", provider: "general", desc: "kimi-v1-32k-latest, 适用于生成长文本", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "豆包Pro4K", provider: "general", desc: "豆包Pro4K-0115, 字节跳动自研LLM模型专业版，支持128K长文本，全系列可精调，具备更强的理解、生成、逻辑等综合能力，适配问答、总结、创作、分类等丰富场景。", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "豆包Pro32K", provider: "general", desc: "豆包Pro32K-0115, 效果最好的主力模型，适合处理复杂任务，在参考问答、总结摘要、创作、文本分类、角色扮演等场景都有很好的效果。支持32k上下文窗口的推理和精调。", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "豆包Pro128K", provider: "general", desc: "豆包Pro128K-0115, 效果最好的主力模型，适合处理复杂任务，在参考问答、总结摘要、创作、文本分类、角色扮演等场景都有很好的效果。支持128k上下文窗口的推理和精调。", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "文心一言", provider: "general", desc: "文心一言-1226, 百度文心一言大语言模型", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "混元", provider: "general", desc: "混元-0210, 混元大模型是由腾讯研发的大语言模型，具备强大的中文创作能力，复杂语境下的逻辑推理能力，以及可靠的任务执行能力。", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "G-5.2", provider: "advanced", desc: "G-5.2-1211, G-5.2 是 G-5 系列中最新的前沿级模型，相比 G-5.1 提供了更强的代理和长上下文性能", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "G-5.2-Chat", provider: "advanced", desc: "G-5.2-Chat-1211, 是 5.2 系列中快速、轻量级的成员，优化为低延迟聊天，同时保持强大的通用智能", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "G-5.1", provider: "advanced", desc: "G-5.1-1113, 与 G-5 相比，具有更强的通用推理能力、改进的指令依从性和更自然的对话风格", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "G-5.1-Chat", provider: "advanced", desc: "G-5.1-Chat-1113, 是 5.1 系列中快速、轻量级的成员，针对低延迟聊天进行了优化，同时保留了强大的通用智能", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "G-5.1-Codex-Mini", provider: "advanced", desc: "G-5.1-Codex-Mini-1113,是 G-5.1-Codex 的更小、更快的版本", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "G-4.1", provider: "advanced", desc: "G-4.1-0414, 比G-4o更强，擅长编程，适用于复杂任务的旗舰 GPT 模型", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "G-4o", provider: "advanced", desc: "G-4o-0806, 快速、智能、灵活的 GPT模型，适用于大多数场景", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "o4-mini", provider: "advanced", desc: "o4-mini-0416, 更快、更实惠的推理模型", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "Gemini 3.5 Flash", provider: "advanced", desc: "Gemini 3.5 Flash-0520，能够持续提供前沿水平的智能，并经过优化，可更快、更经济高效地处理实际任务", caps: ["chat"], is_new: true, is_hot: false, credit: 0 },
    { name: "Gemini 3 Flash", provider: "advanced", desc: "Gemini 3 Flash-1218, 将Pro代理、编码和多模态智能结合起来，成本和速度更加平衡。", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "Gemini 2.5 Pro", provider: "advanced", desc: "Gemini 2.5 Pro-0617, 先进的思考型模型，能够推理编码、数学和 STEM 领域的复杂问题", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "Gemini 2.5 Flash", provider: "advanced", desc: "Gemini2.5 Flash-0617，高性价比的模型，提供全面的功能", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "Claude 4.6 Sonnet", provider: "advanced", desc: "Claude 4.6 Sonnet-0217 是 Anthropic 迄今为止最强大的 Sonnet 类模型，在编码、代理和专业工作领域都具备前沿性能。", caps: ["chat"], is_new: false, is_hot: true, credit: 0 },
    { name: "Claude 4.5 Haiku", provider: "advanced", desc: "Claude 4.5 Haiku-1001, claude 最快的模型，具有接近前沿的智能", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "Claude 4.5 Sonnet", provider: "advanced", desc: "Claude 4.5 Sonnet-0929, 在大多数任务中提供最高智能，具有卓越的代理和编码功能", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "Claude 4 Sonnet", provider: "advanced", desc: "Claude 4 Sonnet-0514, 高性能模型，高智能、均衡表现", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "DeepSeek V4 Pro", provider: "advanced", desc: "DeepSeek V4 Pro-0424 拥有百万字超长上下文，在 Agent 能力、世界知识和推理性能上均实现国内与开源领域的领先,性能比肩顶级闭源模型。", caps: ["chat"], is_new: true, is_hot: false, credit: 0 },
    { name: "DeepSeek-V3.1", provider: "advanced", desc: "V3.1-0821是深度求索全新推出的混合推理模型，较 deepseek-r1-0528 思考效率更高", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "DeepSeek-R1", provider: "advanced", desc: "R1-0528最新版，国产模型中效果最好的推理模型", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "Grok-4.3", provider: "advanced", desc: "Grok-4.3-0430, 擅长能动推理、知识工作和工具使用。", caps: ["chat"], is_new: true, is_hot: true, credit: 0 },
    { name: "Grok-4.2", provider: "advanced", desc: "Grok-4.2-0331, 是 xAI 最新的旗舰型号，具备行业领先的速度和代理工具调用能力。", caps: ["chat"], is_new: false, is_hot: true, credit: 0 },
    { name: "通义千问3-Max", provider: "advanced", desc: "通义千问3-Max-0923, 在智能体编程与工具调用方向进行了专项升级。达到领域SOTA水平，适配场景更加复杂的智能体需求。", caps: ["chat"], is_new: true, is_hot: false, credit: 0 },
    { name: "通义32B", provider: "advanced", desc: "通义32B-0305, 大幅度提升了模型推理能力", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "kimi-k2.6", provider: "advanced", desc: "kimi-k2.6-0427,是 Kimi 最新最智能的模型", caps: ["chat"], is_new: true, is_hot: false, credit: 0 },
    { name: "kimi-k2.5", provider: "advanced", desc: "kimi-k2.5-0127, 是 Kimi 迄今最智能的模型", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "kimi-k2.5 Thinking", provider: "advanced", desc: "kimi-k2.5-0127, 是 Kimi 迄今最智能的模型", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "kimi-v1-128k", provider: "advanced", desc: "kimi-v1-128k-latest, 适用于生成超长文本", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "Doubao-Seed-1.8", provider: "advanced", desc: "Doubao-Seed-1.8-1228, 全新面向多模态 Agent 场景定向优化模型。更强Agent能力、升级多模态理解、更灵活的上下文管理。", caps: ["chat"], is_new: true, is_hot: false, credit: 0 },
    { name: "Doubao-Seed-1.6", provider: "advanced", desc: "Doubao-Seed-1.6-1015, 全新多模态深度思考模型，更强模型效果，服务复杂任务和有挑战场景", caps: ["chat"], is_new: true, is_hot: false, credit: 0 },
    { name: "文心一言4.0", provider: "advanced", desc: "文心一言4.0-1025, 百度文心一言4.0大语言模型", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "讯飞星火4.0", provider: "advanced", desc: "讯飞星火4.0-latest, 由科大讯飞推出的新一代认知智能大模型，拥有跨领域的知识和语言理解能力，能够基于自然对话方式理解与执行任务。", caps: ["chat"], is_new: false, is_hot: false, credit: 0 },
    { name: "G-5.5", provider: "points", desc: "G-5.5-0424,是 OpenAI 为复杂专业工作负载设计的前沿模型，具备更强的推理能力、更高的可靠性和更强的令牌效率，处理困难任务", caps: ["chat"], is_new: true, is_hot: false, credit: 200 },
    { name: "G-5.4", provider: "points", desc: "G-5.4-0306, 是OpenAI最复杂专业工作的前沿模型", caps: ["chat"], is_new: false, is_hot: true, credit: 80 },
    { name: "G-5.3-Codex", provider: "points", desc: "G-5.3-Codex-0224, 是 OpenAI 最先进的代理编码模型，结合了5.2的前沿软件工程性能和更广泛的推理和专业知识能力。", caps: ["chat"], is_new: false, is_hot: false, credit: 60 },
    { name: "G-5.1-Codex", provider: "points", desc: "G-5.1-Codex-1113, 是 G-5.1 的专用版本,针对软件工程和编码工作流程进行了优化", caps: ["chat"], is_new: false, is_hot: false, credit: 50 },
    { name: "G-5", provider: "points", desc: "G-5-0807, 跨领域编码和代理任务的最佳模型", caps: ["chat"], is_new: false, is_hot: false, credit: 50 },
    { name: "G-5-Thinking", provider: "points", desc: "G-5-Thinking-0807, 跨领域编码和代理任务的最佳模型,启用思考功能", caps: ["chat"], is_new: false, is_hot: false, credit: 100 },
    { name: "Gemini 3.1 Pro", provider: "points", desc: "Gemini 3.1 Pro-0219, Google最强大的代理和编码模型。它配备了100万令牌上下文窗口，具备复杂的多模态理解能力。", caps: ["chat"], is_new: true, is_hot: true, credit: 100 },
    { name: "Gemini 3.1 Pro Thinking", provider: "points", desc: "Gemini 3.1 Pro Thinking-0219, Google最强大的代理和编码模型。它配备了100万令牌上下文窗口，具备复杂的多模态理解能力。", caps: ["chat"], is_new: true, is_hot: true, credit: 120 },
    { name: "Claude 4.8 Opus", provider: "points", desc: "Claude 4.8 Opus-0529,是 Anthropic 在 Opus 家族中最强大的通用型号,它在多步推理、复杂编码和端到端项目编排方面尤为强大", caps: ["chat"], is_new: true, is_hot: false, credit: 260 },
    { name: "Claude 4.7 Opus", provider: "points", desc: "Claude 4.7 Opus-0416, 是一个专为前沿编码、人工智能代理和复杂多步骤专业工作设计的混合推理模型。", caps: ["chat"], is_new: false, is_hot: true, credit: 260 },
    { name: "Claude 4.6 Opus", provider: "points", desc: "Claude 4.6 Opus-0206, 是 Anthropic 最智能的模型，适用于构建智能体和编码", caps: ["chat"], is_new: false, is_hot: false, credit: 260 },
    { name: "Claude 4.5 Opus", provider: "points", desc: "Claude 4.5 Opus-1101, 最智能的下一代模型，是编码、代理领域的行业领导者， 计算机使用和企业工作流程。", caps: ["chat"], is_new: false, is_hot: true, credit: 150 },
    { name: "Grok-4", provider: "points", desc: "Grok-4-0709, 最新、最出色的旗舰型号，在自然语言、数学和推理方面提供无与伦比的性能", caps: ["chat"], is_new: false, is_hot: false, credit: 50 },
    { name: "GPT Image 2-标清", provider: "image", desc: "由OpenAI开发的文生图模型，它具有高质量的图像生成功能，并且能够在图像创建中使用世界知识,在指令跟踪和生成逼真的图像方面也要好得多", caps: ["draw"], is_new: true, is_hot: false, credit: 50 },
    { name: "GPT Image 2-高清", provider: "image", desc: "由OpenAI开发的文生图模型，它具有高质量的图像生成功能，并且能够在图像创建中使用世界知识,在指令跟踪和生成逼真的图像方面也要好得多", caps: ["draw"], is_new: true, is_hot: false, credit: 80 },
    { name: "GPT Image 2-超清", provider: "image", desc: "由OpenAI开发的文生图模型，它具有高质量的图像生成功能，并且能够在图像创建中使用世界知识,在指令跟踪和生成逼真的图像方面也要好得多", caps: ["draw"], is_new: true, is_hot: false, credit: 240 },
    { name: "GPT Image 1.5-标清", provider: "image", desc: "由OpenAI开发的文生图模型，它具有高质量的图像生成功能，并且能够在图像创建中使用世界知识,在指令跟踪和生成逼真的图像方面也要好得多", caps: ["draw"], is_new: false, is_hot: false, credit: 75 },
    { name: "GPT Image 1.5-高清", provider: "image", desc: "由OpenAI开发的文生图模型，它具有高质量的图像生成功能，并且能够在图像创建中使用世界知识,在指令跟踪和生成逼真的图像方面也要好得多", caps: ["draw"], is_new: false, is_hot: false, credit: 150 },
    { name: "Nano Banana 2", provider: "image", desc: "Nano Banana 2 (官方名称:Gemini 3.1 Flash Image) 以主流价格提供高质量的图片生成和对话式编辑功能，延迟时间短.图片像素：512", caps: ["draw"], is_new: true, is_hot: false, credit: 50 },
    { name: "Nano Banana 2-1K", provider: "image", desc: "Nano Banana 2-1K(官方名称:Gemini 3.1 Flash Image) 以主流价格提供高质量的图片生成和对话式编辑功能，延迟时间短.图片像素：1024", caps: ["draw"], is_new: true, is_hot: false, credit: 100 },
    { name: "Nano Banana 2-2K", provider: "image", desc: "Nano Banana 2-2K(官方名称:Gemini 3.1 Flash Image) 以主流价格提供高质量的图片生成和对话式编辑功能，延迟时间短.图片像素：2048", caps: ["draw"], is_new: true, is_hot: true, credit: 150 },
    { name: "Nano Banana 2-4K", provider: "image", desc: "Nano Banana 2-4K(官方名称:Gemini 3.1 Flash Image) 以主流价格提供高质量的图片生成和对话式编辑功能，延迟时间短.图片像素：4096", caps: ["draw"], is_new: true, is_hot: false, credit: 260 },
    { name: "Nano Banana Pro-2K", provider: "image", desc: "Nano Banana Pro-2K(官方名称:Gemini 3 Pro Image) 是谷歌最先进的图像生成和编辑模型。专为专业素材资源制作和复杂指令而设计。", caps: ["draw"], is_new: false, is_hot: true, credit: 160 },
    { name: "Nano Banana Pro-4K", provider: "image", desc: "Nano Banana Pro-4K(官方名称:Gemini 3 Pro Image) 是谷歌最先进的图像生成和编辑模型。专为专业素材资源制作和复杂指令而设计。", caps: ["draw"], is_new: false, is_hot: false, credit: 260 },
    { name: "Nano Banana", provider: "image", desc: "Nano Banana(官方名称:Gemini 2.5 Flash Image) 是谷歌最先进的图像生成和编辑模型。能够将多个图像混合到一张图像中，保持角色一致性以讲述丰富的故事，使用自然语言进行有针对性的转换。", caps: ["draw"], is_new: false, is_hot: false, credit: 60 },
    { name: "FLUX.2 Pro", provider: "image", desc: "FLUX.2 Pro 用于大规模生产,提供卓越的提示跟随、视觉质量和创意控制——从生成惊艳图像到高级编辑能力。", caps: ["draw"], is_new: true, is_hot: false, credit: 50 },
    { name: "FLUX.2 Flex", provider: "image", desc: "FLUX.2 Flex 用于细粒度控制,提供卓越的提示跟随、视觉质量和创意控制——从生成惊艳图像到高级编辑能力。", caps: ["draw"], is_new: true, is_hot: false, credit: 100 },
    { name: "FLUX.2 Max", provider: "image", desc: "FLUX.2 Max 用于最高精度编辑,提供卓越的提示跟随、视觉质量和创意控制——从生成惊艳图像到高级编辑能力。", caps: ["draw"], is_new: true, is_hot: false, credit: 150 },
    { name: "FLUX.1 Kontext", provider: "image", desc: "FLUX.1 Kontext 是由黑森林Black Forest Labs 开发的专业图像到图像编辑模型，专注于智能理解图像上下文和精准编辑。", caps: ["draw"], is_new: false, is_hot: false, credit: 150 },
    { name: "MJ", provider: "image", desc: "MJ是一款只要关键字，一分钟就能透过AI算法生成相对应的图片。可以识别不同画家的艺术风格，例如安迪华荷、达芬奇、达利和毕加索等，还能识别特定镜头或摄影术语。", caps: ["draw"], is_new: false, is_hot: false, credit: 50 },
    { name: "SD", provider: "image", desc: "Stable Diffusion是由CompVis、Stability AI和LAION共同开发的一种基于扩散过程的图像生成模型。 它通过模拟扩散过程，将噪声图像逐渐转化为目标图像。 Stable Diffusion具有强大的图像生成能力，可以生成高质量、高分辨率的图像，并具有良好的稳定性和可控性。", caps: ["draw"], is_new: false, is_hot: false, credit: 5 },
    { name: "SD3.5 Large", provider: "image", desc: "SD3.5 Large 具有 80 亿参数，卓越的质量和提示依从性，这个基础模型是 Stable Diffusion 中最强大的 家庭。该型号非常适合 1 MP 分辨率的专业用例", caps: ["draw"], is_new: false, is_hot: false, credit: 100 },
    { name: "SD3.5 Large Turbo", provider: "image", desc: "Stable Diffusion 3.5 Large 的蒸馏版本。 SD3.5 Large Turbo 生成具有出色提示依从性的高质量图像 只需 4 个步骤，使其比 Stable Diffusion 3.5 Large 快得多。", caps: ["draw"], is_new: false, is_hot: false, credit: 50 },
    { name: "即梦AI", provider: "image", desc: "即梦AI在2024年3月于剪映团队研发的AI创作平台剪映Dreamina开放内测,支持生成准确的中文汉字和英文字母", caps: ["draw"], is_new: false, is_hot: false, credit: 50 },
    { name: "Seedream 4.5", provider: "image", desc: "Seedream 4.5 是字节跳动最新自主研发的图像生成大模型,该模型在编辑一致性、人像美化和小字生成方面体验升级。", caps: ["draw"], is_new: true, is_hot: false, credit: 50 },
    { name: "通义千问-Image-Max", provider: "image", desc: "通义千问-Image-Max-1230, 在各类生成任务中表现出色，大幅度降低了生成图片的AI感，提升图像真实性", caps: ["draw"], is_new: false, is_hot: false, credit: 100 },
    { name: "Suno 5.5", provider: "music", desc: "Suno 能从单个提示词生成完整的、接近专业品质的歌曲。", caps: ["Music"], is_new: true, is_hot: false, credit: 100 },
    { name: "MiniMax Music 2.6", provider: "music", desc: "MiniMax Music 2.6 让每个人都能成为音乐创作者", caps: ["Music"], is_new: true, is_hot: false, credit: 200 },
    { name: "Seedance 2.0 Fast 标清", provider: "video", desc: "Seedance 2.0 Fast（暂不支持真人人脸），豆包大模型团队推出的新一代专业级多模态创作视频模型 Seedance 2.0，支持图像、视频、音频等多模态作为参考输入生成视频等能力", caps: ["video"], is_new: false, is_hot: true, credit: 80 },
    { name: "Seedance 2.0 Fast 高清", provider: "video", desc: "Seedance 2.0 Fast（暂不支持真人人脸），豆包大模型团队推出的新一代专业级多模态创作视频模型 Seedance 2.0，支持图像、视频、音频等多模态作为参考输入生成视频等能力", caps: ["video"], is_new: false, is_hot: true, credit: 150 },
    { name: "Seedance 2.0 标清", provider: "video", desc: "Seedance 2.0（暂不支持真人人脸），豆包大模型团队推出的新一代专业级多模态创作视频模型 Seedance 2.0，支持图像、视频、音频等多模态作为参考输入生成视频等能力", caps: ["video"], is_new: false, is_hot: true, credit: 100 },
    { name: "Seedance 2.0 高清", provider: "video", desc: "Seedance 2.0（暂不支持真人人脸），豆包大模型团队推出的新一代专业级多模态创作视频模型 Seedance 2.0，支持图像、视频、音频等多模态作为参考输入生成视频等能力", caps: ["video"], is_new: false, is_hot: true, credit: 250 },
    { name: "Veo 2", provider: "video", desc: "Veo 2是Google DeepMind开发的最新视频生成模型,主要特点包含:使用文本,图片生成最多8秒的视频", caps: ["video"], is_new: false, is_hot: false, credit: 300 },
    { name: "Veo 3.0", provider: "video", desc: "Veo 3.0是Google DeepMind最先进的模型，可生成高保真度的8秒 720p或1080p视频，这些视频具有惊人的逼真效果和原生生成的音频", caps: ["video"], is_new: false, is_hot: false, credit: 350 },
    { name: "Veo 3.1", provider: "video", desc: "Veo 3.1是Google DeepMind最先进的模型，可生成高保真度的8秒 720p或1080p视频，这些视频具有惊人的逼真效果和原生生成的音频", caps: ["video"], is_new: false, is_hot: false, credit: 350 },
    { name: "Wan 2.6 高清", provider: "video", desc: "通义万相2.6-视频模型，智能分镜调度支持多镜头叙事，能够生成主体、场景和氛围一致的多镜头叙事视频，最高支持15秒时长，更高品质的声音生成，更好的指令遵循和视觉质量", caps: ["video"], is_new: false, is_hot: true, credit: 100 },
    { name: "Wan 2.6 超清", provider: "video", desc: "通义万相2.6-视频模型，智能分镜调度支持多镜头叙事，能够生成主体、场景和氛围一致的多镜头叙事视频，最高支持15秒时长，更高品质的声音生成，更好的指令遵循和视觉质量", caps: ["video"], is_new: false, is_hot: true, credit: 150 },
    { name: "MiniMax HaiLuo 2.3 768P", provider: "video", desc: "MiniMax HaiLuo 2.3-视频模型(无声音)，在肢体动作呈现、风格化以及人物微表情方面实现了显著的效果提升，同时对运动指令响应做进一步优化。", caps: ["video"], is_new: true, is_hot: false, credit: 60 },
    { name: "MiniMax HaiLuo 2.3 1080P", provider: "video", desc: "MiniMax HaiLuo 2.3-视频模型(无声音)，在肢体动作呈现、风格化以及人物微表情方面实现了显著的效果提升，同时对运动指令响应做进一步优化。", caps: ["video"], is_new: true, is_hot: false, credit: 100 },
];

// ── 导航 ──
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
        e.preventDefault();
        App.navigate(item.dataset.page);
    });
});

const App = {
    navigate(page) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.getElementById(`page-${page}`)?.classList.add('active');
        document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');
        if (page === 'dashboard') this.loadDashboard();
        if (page === 'models') this.loadModels();
        if (page === 'reports') this.loadReports();
        if (page === 'testcases') this.loadTestCases();
        if (page === 'eval') this.updateEvalModelSelect();
    },

    // ── 仪表盘 ──
    async loadDashboard() {
        try {
            const [modelsRes, reportsRes] = await Promise.all([
                fetch(`${API_BASE}/models`).catch(() => ({ json: () => ({ data: [] }) })),
                fetch(`${API_BASE}/eval/reports`).catch(() => ({ json: () => ({ data: [] }) }))
            ]);
            const models = (await modelsRes.json()).data || [];
            const reports = (await reportsRes.json()).data || [];
            document.getElementById('total-models').textContent = models.length;
            document.getElementById('total-evals').textContent = reports.length;
            if (reports.length > 0) {
                const latest = reports[0];
                if (latest.dimension_scores) {
                    const dims = Object.keys(latest.dimension_scores);
                    const values = dims.map(d => latest.dimension_scores[d]);
                    const radar = echarts.init(document.getElementById('radar-chart'));
                    radar.setOption({ radar: { indicator: dims.map(d => ({ name: d, max: 100 })), radius: '65%' }, series: [{ type: 'radar', data: [{ value: values, name: latest.model_name }] }] });
                }
            }
            const tbody = document.getElementById('reports-tbody');
            if (reports.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="empty-state">暂无评测报告</td></tr>';
            } else {
                tbody.innerHTML = reports.slice(0, 5).map(r => `<tr><td>${r.model_name || '--'}</td><td>${(r.dimensions || []).join(', ') || '--'}</td><td>${r.overall_score || '--'}</td><td>${r.pass_rate != null ? r.pass_rate + '%' : '--'}</td><td><span class="risk-${r.risk_level || 'unknown'}">${r.risk_level || '--'}</span></td><td>${(r.generated_at || '').slice(0, 10)}</td><td><button class="btn-link" onclick="App.viewReport('${r.id}')">查看</button></td></tr>`).join('');
            }
        } catch (e) { console.error('Dashboard error:', e); }
    },

    // ── 模型管理 ──
    // 状态
    _modelFilter: { provider: 'all', search: '' },

    async loadModels() {
        try {
            const res = await fetch(`${API_BASE}/models`).catch(() => ({ json: () => ({ data: [] }) }));
            const json = await res.json();
            const configuredModels = json.data || [];
            this.renderChataiModels(configuredModels);
            this.renderConfiguredModels(configuredModels);
            this.updateEvalModelSelect();
            this.bindProviderChips();
        } catch (e) { console.error('Models error:', e); }
    },

    bindProviderChips() {
        document.querySelectorAll('.provider-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.provider-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this._modelFilter.provider = chip.dataset.provider;
                this._modelFilter.search = document.getElementById('model-search-input')?.value || '';
                this.renderChataiModelsWithFilter();
            });
        });
        document.getElementById('model-search-input')?.addEventListener('input', e => {
            this._modelFilter.search = e.target.value;
            this.renderChataiModelsWithFilter();
        });
    },

    filterModels() {
        this._modelFilter.search = document.getElementById('model-search-input')?.value || '';
        this.renderChataiModelsWithFilter();
    },

    renderChataiModels(configuredModels) {
        this._configuredNames = (configuredModels || []).map(m => m.name);
        this.renderChataiModelsWithFilter();
    },

    renderChataiModelsWithFilter() {
        const container = document.getElementById('chatai-model-cards');
        const { provider, search } = this._modelFilter;
        const q = search.toLowerCase();
        let models = CHATAI_MODELS;
        if (provider !== 'all') {
            models = models.filter(m => m.provider === provider);
        }
        if (q) {
            models = models.filter(m => m.name.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q));
        }
        if (models.length === 0) {
            container.innerHTML = '<div class="empty-state">未找到匹配的模型</div>';
            return;
        }
        const logoMap = { general:'🤖', advanced:'🧠', points:'💰', image:'🖼️', video:'🎬', music:'🎵' };
        const bgMap = { general:'#4263EB', advanced:'#D97706', points:'#7C3AED', image:'#EC4899', video:'#EF4444', music:'#10B981' };
        container.innerHTML = models.map(m => {
            const isAdded = this._configuredNames.includes(m.name);
            const caps = (m.caps || ['chat']).map(c => `<span class="cap-tag">${c}</span>`).join('');
            const newBadge = m.is_new ? '<span class="cm-new">NEW</span>' : '';
            const hotBadge = m.is_hot ? '<span class="cm-new" style="background:#EF4444;">🔥 HOT</span>' : '';
            const icon = m.icon || logoMap[m.provider] || '🤖';
            const bg = m.logoBg || bgMap[m.provider] || '#4263EB';
            return `<div class="chatai-model-card">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div class="cm-logo" style="background:${bg};color:white;">${icon}</div>
                    <div style="flex:1;min-width:0;">
                        <div class="cm-name">${m.name}</div>
                        <div class="cm-provider">${this._providerName(m.provider)}</div>
                    </div>
                    ${newBadge}${hotBadge}
                </div>
                <div class="cm-desc">${m.desc}</div>
                <div class="cm-tags">${caps}</div>
                <div style="display:flex;gap:8px;margin-top:6px;">
                    ${isAdded
                        ? `<button class="btn btn-sm" style="background:var(--primary-light);color:var(--primary);cursor:default;" disabled>✓ 已添加</button>`
                        : `<button class="btn btn-sm btn-primary" onclick="App.quickAddChataiModel('${m.name}', '${m.type}', '${m.provider}', this)">+ 添加</button>`
                    }
                </div>
            </div>`;
        }).join('');
    },

    _providerName(p) {
        const map = { general:'基础模型', advanced:'高级模型', points:'积分模型', image:'绘图模型', video:'视频模型', music:'音乐模型', kimi:'Kimi', claude:'Claude', deepseek:'DeepSeek', gpt:'G-5', gemini:'Gemini', grok:'Grok', minimax:'MiniMax', qwen:'通义千问', doubao:'豆包', zhipu:'智谱', ernie:'文心', hunyuan:'腾讯混元', spark:'讯飞星火', yi:'Yi', other:'其他' };
        return map[p] || p;
    },

    renderConfiguredModels(models) {
        const container = document.getElementById('model-cards');
        if (!models || models.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无已配置模型，请从上方热门模型库添加</div>';
            return;
        }
        container.innerHTML = models.map(m => {
            const caps = (m.capabilities || []).map(c => `<span class="cap-tag">${c}</span>`).join('');
            return `<div class="model-card">
                <div class="model-card-top">
                    <div class="model-logo" style="background:#4263EB;color:white;font-size:16px;">🤖</div>
                    <div class="model-info">
                        <div class="model-name">${m.name}</div>
                        <div class="model-provider">${m.api_endpoint ? new URL(m.api_endpoint).hostname : '自定义 API'}</div>
                    </div>
                    <span class="model-type-badge">${m.model_type || 'custom'}</span>
                </div>
                <div class="model-meta">${caps}</div>
                <div class="model-card-actions">
                    <button class="btn btn-sm btn-primary" onclick="App.runBenchmarkForModel('${m.id}')">⚡ 评测</button>
                    <button class="btn btn-sm btn-secondary" onclick="App.showModelModalForEdit('${m.id}')">✏️</button>
                    <button class="btn btn-sm btn-ghost" onclick="App.deleteModel('${m.id}')">🗑️</button>
                </div>
            </div>`;
        }).join('');
    },

    async quickAddChataiModel(name, type, provider, btn) {
        const model = CHATAI_MODELS.find(m => m.name === name);
        if (!model) return;
        if (this._configuredNames.includes(name)) { alert(name + ' 已添加'); return; }
        const payload = { name, model_type: type || 'custom', api_endpoint: '', api_key: '', capabilities: model.caps || ['chat'] };
        try {
            const res = await fetch(`${API_BASE}/models`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const json = await res.json();
            if (json.id || json.success) {
                if (btn) {
                    btn.textContent = '✓ 已添加';
                    btn.className = 'btn btn-sm';
                    btn.style = 'background:var(--primary-light);color:var(--primary);cursor:default;';
                    btn.disabled = true;
                }
                const res2 = await fetch(`${API_BASE}/models`);
                const json2 = await res2.json();
                this._configuredNames = (json2.data || []).map(m => m.name);
                this.renderConfiguredModels(json2.data || []);
            } else {
                alert('添加失败：' + (json.error || JSON.stringify(json)));
            }
        } catch (e) { alert('添加失败：' + e.message); }
    },

    async quickAddModel(model) {
        try {
            const res = await fetch(`${API_BASE}/models`);
            const json = await res.json();
            if ((json.data || []).some(m => m.name === model.name)) { alert(model.name + ' 已存在'); return; }
        } catch (e) {}
        const payload = { name: model.name, model_type: model.type, api_endpoint: model.endpoint || '', api_key: '', capabilities: model.capabilities || ['chat'] };
        try {
            const res = await fetch(`${API_BASE}/models`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const json = await res.json();
            if (json.id || json.success) this.loadModels();
        } catch (e) { alert('添加失败：' + e.message); }
    },

    async quickAddModelFromBtn(btn) {
        try {
            const encoded = btn.dataset.model;
            const model = JSON.parse(decodeURIComponent(atob(encoded)));
            await this.quickAddModel(model);
        } catch (e) {
            console.error('quickAddModelFromBtn error:', e);
            alert('添加失败：' + e.message);
        }
    },

    // ── 一键评测 ──
    async updateEvalModelSelect() {
        try {
            const res = await fetch(`${API_BASE}/models`).catch(() => ({ json: () => ({ data: [] }) }));
            const json = await res.json();
            const models = json.data || [];
            const select = document.getElementById('eval-model-select');
            select.innerHTML = '<option value="">-- 请选择模型 --</option>' + models.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        } catch (e) {}
    },

    async runBenchmark() {
        const modelId = document.getElementById('eval-model-select').value;
        if (!modelId) return alert('请先选择一个模型');
        const progressDiv = document.getElementById('eval-progress');
        const fill = document.getElementById('eval-progress-fill');
        const stepTitle = document.getElementById('eval-step-title');
        const progressText = document.getElementById('eval-progress-text');
        const dimStatus = document.getElementById('eval-dim-status');
        progressDiv.style.display = 'block';
        fill.style.width = '0%';
        const dimensions = ['multimodal_intent', 'end_to_end', 'custom_agent', 'security_risk'];
        const dimNames = { multimodal_intent: '多模态感知', end_to_end: '端到端评测', custom_agent: '自定义助手', security_risk: '安全风险' };
        const dimIcons = { multimodal_intent: '👁️', end_to_end: '🔗', custom_agent: '🤖', security_risk: '🛡️' };
        for (let i = 0; i < dimensions.length; i++) {
            const dim = dimensions[i];
            stepTitle.textContent = dimIcons[dim] + ' 正在评测：' + dimNames[dim] + '...';
            progressText.textContent = (i + 1) + ' / ' + dimensions.length + ' 维度';
            fill.style.width = ((i / dimensions.length) * 100) + '%';
            dimStatus.innerHTML = dimensions.map((d, idx) => { if (idx < i) return '<span style="color:#52c41a">✓ ' + dimNames[d] + '</span>'; if (idx === i) return '<span style="color:#5470c6;font-weight:bold">● ' + dimNames[d] + ' (进行中)</span>'; return '<span style="color:#ccc">○ ' + dimNames[d] + '</span>'; }).join('  ·  ');
            try {
                await fetch(`${API_BASE}/eval/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model_id: modelId, dimensions: [dim], tc_source: 'builtin' }) });
            } catch (e) { console.error('Dim ' + dim + ' error:', e); }
            fill.style.width = (((i + 1) / dimensions.length) * 100) + '%';
            await new Promise(r => setTimeout(r, 300));
        }
        stepTitle.textContent = '✅ 全部评测完成！';
        progressText.textContent = '正在生成报告...';
        dimStatus.innerHTML = dimensions.map(d => '<span style="color:#52c41a">✓ ' + dimNames[d] + '</span>').join('  ·  ');
        await new Promise(r => setTimeout(r, 1000));
        this.navigate('reports');
        this.loadReports();
    },

    async runBenchmarkForModel(modelId) {
        this.navigate('eval');
        document.getElementById('eval-model-select').value = modelId;
        setTimeout(() => this.runBenchmark(), 300);
    },

    // ── 评测报告 ──
    async loadReports() {
        try {
            const res = await fetch(`${API_BASE}/eval/reports`).catch(() => ({ json: () => ({ data: [] }) }));
            const json = await res.json();
            const reports = json.data || [];
            const tbody = document.getElementById('all-reports-tbody');
            if (reports.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="empty-state">暂无报告，点击「一键评测」开始</td></tr>'; return; }
            tbody.innerHTML = reports.map(r => `<tr><td>${r.model_name || '--'}</td><td>${(r.dimensions || []).join(', ') || '--'}</td><td><strong>${r.overall_score || '--'}</strong></td><td>${r.pass_rate != null ? r.pass_rate + '%' : '--'}</td><td><span class="risk-${r.risk_level || 'unknown'}">${r.risk_level || '--'}</span></td><td>${(r.generated_at || '').slice(0, 10)}</td><td><button class="btn-link" onclick="App.viewReport('${r.id}')">查看</button></td></tr>`).join('');
        } catch (e) { console.error('Reports error:', e); }
    },

    async viewReport(reportId) {
        document.getElementById('reports-list-view').style.display = 'none';
        document.getElementById('report-detail').style.display = 'block';
        try {
            const [reportRes, chartRes] = await Promise.all([
                fetch(`${API_BASE}/eval/report/${reportId}`).catch(() => ({ json: () => ({}) })),
                fetch(`${API_BASE}/reports/${reportId}/chart`).catch(() => ({ json: () => ({}) }))
            ]);
            const report = (await reportRes.json()).data || {};
            const charts = (await chartRes.json()).data || {};
            document.getElementById('report-model-name').textContent = report.model_name || '--';
            document.getElementById('report-score-display').textContent = (report.overall_score != null ? report.overall_score : '--') + '分';
            document.getElementById('report-total-cases').textContent = report.total_cases || '--';
            document.getElementById('report-passed').textContent = report.passed_cases || '--';
            document.getElementById('report-pass-rate').textContent = (report.pass_rate != null ? report.pass_rate : '--') + '%';
            document.getElementById('report-hallucination').textContent = report.hallucination_avg != null ? report.hallucination_avg.toFixed(3) : '--';
            const barEl = document.getElementById('dim-bar-chart');
            if (barEl && charts.bar) { const bar = echarts.init(barEl); bar.setOption(charts.bar); }
            const pieEl = document.getElementById('hallucination-pie-chart');
            if (pieEl && charts.pie) { const pie = echarts.init(pieEl); pie.setOption(charts.pie); }
            const tbody = document.getElementById('report-detail-tbody');
            if (report.results && report.results.length > 0) {
                tbody.innerHTML = report.results.map(r => `<tr><td>${r.dimension || '--'}</td><td>${r.test_case_id || '--'}</td><td>${r.score != null ? r.score : '--'}</td><td>${r.passed ? '✅' : '❌'}</td><td>${r.hallucination_detected ? '🔴' : '🟢'}</td><td><span class="risk-${r.risk_level || 'unknown'}">${r.risk_level || '--'}</span></td></tr>`).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="6" class="empty-state">暂无详细数据</td></tr>';
            }
            const recUl = document.getElementById('report-recommendations');
            if (report.recommendations && report.recommendations.length > 0) {
                recUl.innerHTML = report.recommendations.map(r => '<li>' + r + '</li>').join('');
            } else {
                recUl.innerHTML = '<li>模型表现良好，暂无需特别改进的建议。</li>';
            }
        } catch (e) { console.error('View report error:', e); }
    },

    backToReportsList() {
        document.getElementById('report-detail').style.display = 'none';
        document.getElementById('reports-list-view').style.display = 'block';
    },

    // ── 模型 CRUD ──
    _editingModelId: null,

    showModelModal(prefill) {
        this._editingModelId = null;
        document.getElementById('model-modal').style.display = 'flex';
        document.getElementById('model-modal-title').textContent = prefill ? '添加 ' + prefill.name : '添加自定义模型';
        if (prefill) {
            document.getElementById('m-name').value = prefill.name || '';
            document.getElementById('m-type').value = prefill.type || 'custom';
            document.getElementById('m-endpoint').value = prefill.endpoint || '';
        } else {
            document.getElementById('m-name').value = '';
            document.getElementById('m-type').value = 'openai';
            document.getElementById('m-endpoint').value = '';
        }
        document.getElementById('m-apikey').value = '';
    },

    async showModelModalForEdit(modelId) {
        try {
            const res = await fetch(`${API_BASE}/models/${modelId}`);
            const json = await res.json();
            if (!json.data) { alert('模型不存在'); return; }
            const m = json.data;
            this._editingModelId = modelId;
            document.getElementById('model-modal').style.display = 'flex';
            document.getElementById('model-modal-title').textContent = '编辑模型：' + m.name;
            document.getElementById('m-name').value = m.name || '';
            document.getElementById('m-type').value = m.model_type || 'custom';
            document.getElementById('m-endpoint').value = m.api_endpoint || '';
            document.getElementById('m-apikey').value = m.api_key ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' : '';
            // 能力复选框
            const caps = m.capabilities || [];
            document.querySelectorAll('#model-modal .capability-checkboxes input').forEach(cb => {
                cb.checked = caps.includes(cb.value);
            });
        } catch (e) { alert('获取模型失败：' + e.message); }
    },

    closeModelModal() {
        document.getElementById('model-modal').style.display = 'none';
        this._editingModelId = null;
    },

    async saveModel() {
        const name = document.getElementById('m-name').value.trim();
        if (!name) return alert('请输入模型名称');
        const capabilities = Array.from(document.querySelectorAll('#model-modal .capability-checkboxes input:checked')).map(cb => cb.value);
        const apiKey = document.getElementById('m-apikey').value.trim();
        const payload = {
            name,
            model_type: document.getElementById('m-type').value,
            api_endpoint: document.getElementById('m-endpoint').value.trim(),
            capabilities: capabilities.length ? capabilities : ['chat']
        };
        // 只有填了新key才更新key（避免覆盖）
        if (apiKey && !apiKey.startsWith('\u2022')) {
            payload.api_key = apiKey;
        }

        try {
            let res;
            if (this._editingModelId) {
                // 更新
                res = await fetch(`${API_BASE}/models/${this._editingModelId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                // 新增
                if (!apiKey) return alert('请填写 API Key');
                payload.api_key = apiKey;
                res = await fetch(`${API_BASE}/models`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }
            const json = await res.json();
            if (json.success || json.id) {
                this.closeModelModal();
                this.loadModels();
            } else {
                alert((this._editingModelId ? '更新' : '添加') + '失败：' + (json.error || JSON.stringify(json)));
            }
        } catch (e) { alert((this._editingModelId ? '更新' : '添加') + '失败：' + e.message); }
    },

    async deleteModel(id) {
        if (!confirm('确定删除该模型？')) return;
        try { await fetch(`${API_BASE}/models/${id}`, { method: 'DELETE' }); this.loadModels(); } catch (e) { alert('删除失败：' + e.message); }
    },

    // ── 幻觉检测 ──
    async detectHallucination() {
        const text = document.getElementById('h-text').value.trim();
        if (!text) return alert('请输入待检测文本');
        const context = document.getElementById('h-context').value.trim();
        const ground_truth = document.getElementById('h-ground-truth').value.trim();
        const methods = Array.from(document.querySelectorAll('#page-hallucination .detection-methods input:checked')).map(cb => cb.value);
        if (methods.length === 0) return alert('请选择至少一种检测方法');
        try {
            const res = await fetch(`${API_BASE}/hallucination/detect`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, context, ground_truth, methods }) });
            const data = await res.json();
            document.getElementById('h-results-placeholder').style.display = 'none';
            document.getElementById('h-results').style.display = 'block';
            document.getElementById('h-ensemble-score').textContent = data.ensemble_score || data.score || '--';
            document.getElementById('h-verdict').textContent = data.verdict || '--';
            document.getElementById('h-method-results').innerHTML = (data.component_results || []).map(r => `<div class="method-result"><div class="method-name">${r.method}</div><div class="method-score">得分: ${r.score}</div><div class="method-verdict risk-${r.verdict}">${r.verdict}</div></div>`).join('');
        } catch (e) { alert('检测失败：' + e.message); }
    },

    // ── 测试用例 ──
    async loadTestCases() {
        const dim = document.getElementById('tc-filter-dim')?.value || '';
        const diff = document.getElementById('tc-filter-diff')?.value || '';
        try {
            const params = new URLSearchParams();
            if (dim) params.set('dimension', dim);
            if (diff) params.set('difficulty', diff);
            const res = await fetch(`${API_BASE}/testcases?${params}`).catch(() => ({ json: () => ({ data: { total: 0, cases: [] } }) }));
            const json = await res.json();
            const cases = json.data?.cases || [];
            document.getElementById('tc-count').textContent = '共 ' + (json.data?.total || 0) + ' 条用例';
            const container = document.getElementById('tc-list');
            if (cases.length === 0) { container.innerHTML = '<div class="empty-state">暂无测试用例</div>'; return; }
            container.innerHTML = cases.slice(0, 50).map(c => `<div class="tc-item"><div class="tc-header"><span class="tc-dim">${c.dimension}</span><span class="tc-diff ${c.difficulty}">${c.difficulty}</span></div><div class="tc-title">${c.title}</div><div class="tc-desc">${c.description || ''}</div></div>`).join('');
        } catch (e) { console.error('TestCases error:', e); }
    },

    showTCUpload() { const input = document.createElement('input'); input.type = 'file'; input.accept = '.json,.csv'; input.onchange = () => { if (input.files[0]) this.uploadTCFile(input.files[0]); }; input.click(); },

    async uploadTCFile(file) {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch(`${API_BASE}/testcases/upload`, { method: 'POST', body: formData });
            const json = await res.json();
            alert('上传成功：添加 ' + (json.added || 0) + ' 条');
            this.loadTestCases();
        } catch (e) { alert('上传失败：' + e.message); }
    },

    downloadTCTemplate() { window.open(`${API_BASE}/testcases/template/download`); },
};

// ── 初始化 ──
App.loadDashboard();