# AI-Test：大模型评测平台

> 多维度、可视化、支持自定义配置的大模型评测工具

---

## 🎯 核心功能

### 四大评测维度

| 维度 | 说明 |
|------|------|
| **多模态感知与意图理解** | 复杂交互中大模型的环境感知准确率验证，智能座舱等场景 |
| **真实环境端到端评测** | 基于实际业务场景的评测（金融风控、政务数据主权等） |
| **自定义AI助手专项评测** | 用户提交自己调教的AI助手，同一任务横向对比 |
| **安全与风险分阶段评估** | 从"风险意图"到"风险完成"的分阶段检测框架 |

### 大模型准入准出标准

| 标准 | 维度 |
|------|------|
| 政策法规与合规准入 | 备案机制、风险分级、主体资质（一票否决项） |
| 技术性能与安全指标 | 内容安全拦截率≥95%、防幻觉鲁棒性 |
| 产品功能与服务体验 | 稳定性、响应速度、内容水印、交互透明度 |
| 持续运营与动态准出 | 定期自查、不良信息阻断、专项整治红线 |

### 幻觉检测（五种方法）

| 方法 | 类型 |
|------|------|
| 事实粒度评分（FactScore）+ RAG验证 | 外部知识检索 |
| SelfCheckGPT + 多视角一致性 | 黑盒一致性 |
| NLI蕴含检测 + LLM-as-a-Judge | 专家判别器 |
| 统计异常检测（ROUGE/BLEU/Novelty） | 统计学方法 |
| 不确定性估计 + Attention Map | 白盒内部状态 |

---

## 🚀 快速开始

```bash
# 安装依赖
pip install -r requirements.txt

# 启动服务
python run.py

# 打开浏览器
open http://localhost:5000
```

---

## 📁 项目结构

```
AI-Test/
├── backend/
│   ├── evaluators/     # 四大评测引擎
│   ├── detectors/      # 幻觉检测器
│   ├── services/       # 核心服务层
│   ├── models/         # 数据模型
│   └── utils/          # 工具函数
├── frontend/
│   ├── templates/      # HTML模板
│   └── static/         # CSS/JS/图表
├── data/
│   ├── test_cases/     # 测试用例库
│   ├── reports/        # 测试报告
│   └── configs/        # 模型配置文件
└── tests/              # 单元测试
```

---

## ⚙️ 模型配置示例

```json
{
  "model_name": "gpt-4",
  "model_type": "openai",
  "api_endpoint": "https://api.openai.com/v1/chat/completions",
  "api_key": "your-key",
  "capabilities": ["chat", "vision", "function_call"],
  "safety_config": {
    "max_tokens": 2048,
    "temperature": 0.7,
    "blocked_keywords": ["暴力", "色情", "违法"]
  }
}
```
