"""
数据模型：评测任务、测试用例、检测结果
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum
import json


class EvalDimension(str, Enum):
    """评测维度"""
    MULTIMODAL_INTENT = "multimodal_intent"          # 多模态感知与意图理解
    END_TO_END = "end_to_end"                        # 端到端真实场景
    CUSTOM_AGENT = "custom_agent"                     # 自定义AI助手评测
    SECURITY_RISK = "security_risk"                  # 安全与风险分阶段评估
    POLICY_COMPLIANCE = "policy_compliance"           # 政策法规合规准入
    TECH_SECURITY = "tech_security"                   # 技术性能与安全指标
    PRODUCT_FEATURE = "product_feature"               # 产品功能与服务体验
    CONTINUOUS_OP = "continuous_op"                  # 持续运营与动态准出


class ModelStatus(str, Enum):
    """模型状态"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class RiskLevel(str, Enum):
    """风险等级"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class ModelConfig:
    """被测大模型配置"""
    id: str
    name: str
    model_type: str                    # openai / claude / local / custom
    api_endpoint: str = ""
    api_key: str = ""
    capabilities: List[str] = field(default_factory=list)
    safety_config: Dict[str, Any] = field(default_factory=dict)
    meta: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict:
        d = asdict(self)
        d.pop('api_key', None)  # 不暴露key
        return d

    @classmethod
    def from_dict(cls, data: Dict) -> 'ModelConfig':
        return cls(**data)


@dataclass
class TestCase:
    """测试用例"""
    id: str
    dimension: EvalDimension
    title: str
    description: str
    input_data: Dict[str, Any]       # 输入数据
    expected_output: Optional[Dict] = None
    ground_truth: Optional[str] = None  # 用于幻觉检测的真实答案
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class EvalResult:
    """单次评测结果"""
    id: str
    test_case_id: str
    model_id: str
    dimension: EvalDimension
    raw_response: str
    parsed_result: Dict[str, Any]
    score: float                         # 0~100
    passed: bool
    risk_level: RiskLevel
    hallucination_detected: bool = False
    hallucination_score: float = 0.0     # 0~1, 越高越可能有幻觉
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict:
        d = asdict(self)
        d['score'] = round(d['score'], 2)
        d['hallucination_score'] = round(d['hallucination_score'], 4)
        return d


@dataclass
class EvalReport:
    """评测报告汇总"""
    id: str
    model_id: str
    model_name: str
    dimensions: List[EvalDimension]
    total_cases: int
    passed_cases: int
    overall_score: float
    dimension_scores: Dict[str, float]
    dimension_details: Dict[str, Dict]
    hallucination_summary: Dict[str, float]
    policy_compliance: Dict[str, Any]
    recommendations: List[str]
    generated_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict:
        d = asdict(self)
        d['overall_score'] = round(d['overall_score'], 2)
        return d

    def to_summary(self) -> Dict:
        """简洁摘要，用于API返回"""
        return {
            "model_name": self.model_name,
            "overall_score": round(self.overall_score, 2),
            "total_cases": self.total_cases,
            "passed_cases": self.passed_cases,
            "pass_rate": round(self.passed_cases / max(self.total_cases, 1) * 100, 1),
            "dimensions": {k: round(v, 2) for k, v in self.dimension_scores.items()},
            "hallucination_avg": round(self.hallucination_summary.get("avg_score", 0), 4),
            "risk_level": self.hallucination_summary.get("risk_level", "low"),
        }
