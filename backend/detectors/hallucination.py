"""
幻觉检测器：五种方法
1. FactScore + RAG 验证（外部知识检索）
2. SelfCheckGPT 多视角一致性（黑盒）
3. NLI蕴含检测 + LLM-as-a-Judge
4. 统计学异常检测（ROUGE/BLEU/Novelty）
5. 不确定性估计 + Attention Map（白盒）
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Tuple
import re
import math
from collections import Counter


# ─────────────────────────────────────────
# 基础接口
# ─────────────────────────────────────────
class HallucinationDetector(ABC):
    """幻觉检测器基类"""

    @abstractmethod
    def detect(self, response: str, context: str = "", ground_truth: str = "") -> Dict[str, Any]:
        """
        返回:
            score: 0.0~1.0, 越高越可能有幻觉
            verdict: "factual" / "uncertain" / "hallucinated"
            details: 详细说明
        """
        pass

    @property
    @abstractmethod
    def method_name(self) -> str:
        pass


# ─────────────────────────────────────────
# 方法1：FactScore + RAG 外部知识验证
# ─────────────────────────────────────────
class FactScoreDetector(HallucinationDetector):
    """
    将回答拆解为独立事实声明，用外部知识源逐一验证。
    需要外部搜索API（可配置搜索服务）
    """

    def __init__(self, search_func=None):
        """
        search_func: callable(query) -> list[dict], 每条含 title/score/url
        """
        self.search_func = search_func or self._default_search

    @property
    def method_name(self) -> str:
        return "FactScore-RAG"

    def _default_search(self, query: str) -> List[Dict]:
        """默认搜索桩（可替换为 Tavily/Jina 等）"""
        return []

    def _extract_facts(self, text: str) -> List[str]:
        """将文本拆解为独立事实声明（简单句级分割）"""
        sentences = re.split(r'[。！？\n]+', text)
        facts = []
        for s in sentences:
            s = s.strip()
            if len(s) > 10:  # 过滤过短句子
                facts.append(s)
        return facts

    def _verify_fact(self, fact: str) -> Tuple[bool, float]:
        """
        验证单条事实。
        返回 (has_support, confidence)
        confidence = 0.0~1.0
        """
        results = self.search_func(fact)
        if not results:
            return False, 0.5  # 无搜索结果，默认不确定

        # 检查最高匹配度的得分
        top_score = results[0].get('score', 0)
        supported = top_score > 0.7
        confidence = top_score
        return supported, confidence

    def detect(self, response: str, context: str = "", ground_truth: str = "") -> Dict[str, Any]:
        facts = self._extract_facts(response)
        if not facts:
            return {
                "score": 0.0,
                "verdict": "factual",
                "method": self.method_name,
                "facts_checked": 0,
                "details": "No verifiable facts extracted"
            }

        supported = 0
        scores = []
        details = []

        for fact in facts:
            has_sup, conf = self._verify_fact(fact)
            scores.append(1 - conf)  # 得分越高=幻觉可能性越高
            if has_sup:
                supported += 1
            details.append({
                "fact": fact[:100],
                "supported": has_sup,
                "confidence": round(conf, 3)
            })

        hallucination_score = sum(scores) / len(scores)
        verdict = self._score_to_verdict(hallucination_score)

        return {
            "score": round(hallucination_score, 4),
            "verdict": verdict,
            "method": self.method_name,
            "facts_checked": len(facts),
            "facts_supported": supported,
            "support_rate": round(supported / len(facts), 3),
            "details": details[:10]  # 最多10条
        }

    def _score_to_verdict(self, score: float) -> str:
        if score < 0.3:
            return "factual"
        elif score < 0.6:
            return "uncertain"
        else:
            return "hallucinated"


# ─────────────────────────────────────────
# 方法2：SelfCheckGPT 多视角一致性检测（黑盒）
# ─────────────────────────────────────────
class SelfCheckDetector(HallucinationDetector):
    """
    让模型对同一问题生成多次回答。
    一致性低 → 可能在幻觉。
    需要 LLM API（多次生成）
    """

    def __init__(self, llm_call_func=None, n_samples: int = 3):
        """
        llm_call_func: callable(prompt) -> str
        n_samples: 采样次数（默认3次）
        """
        self.llm_call_func = llm_call_func
        self.n_samples = n_samples

    @property
    def method_name(self) -> str:
        return "SelfCheckGPT"

    def _semantic_similarity(self, s1: str, s2: str) -> float:
        """简化的语义相似度（基于词汇重叠）"""
        words1 = set(re.findall(r'\w+', s1.lower()))
        words2 = set(re.findall(r'\w+', s2.lower()))
        if not words1 or not words2:
            return 0.0
        overlap = len(words1 & words2)
        return overlap / math.sqrt(len(words1) * len(words2))

    def detect(self, response: str, context: str = "", ground_truth: str = "") -> Dict[str, Any]:
        if not self.llm_call_func:
            return {
                "score": 0.5,
                "verdict": "uncertain",
                "method": self.method_name,
                "details": "No LLM function configured, returning neutral"
            }

        # 用相同context让模型重新回答
        prompts = [f"Context: {context}\n\nQuestion: based on the context above, give a brief answer."] * self.n_samples
        samples = []
        for p in prompts:
            try:
                sample = self.llm_call_func(p)
                samples.append(sample)
            except Exception:
                samples.append("")

        # 两两计算相似度
        if len(samples) < 2:
            return {"score": 0.5, "verdict": "uncertain", "method": self.method_name, "details": []}

        similarities = []
        for i in range(len(samples)):
            for j in range(i + 1, len(samples)):
                sim = self._semantic_similarity(samples[i], samples[j])
                similarities.append(sim)

        avg_similarity = sum(similarities) / len(similarities)

        # 一致性高 → score低（幻觉少）；一致性低 → score高
        hallucination_score = 1.0 - avg_similarity
        verdict = self._score_to_verdict(hallucination_score)

        return {
            "score": round(hallucination_score, 4),
            "verdict": verdict,
            "method": self.method_name,
            "avg_similarity": round(avg_similarity, 4),
            "samples": [s[:200] for s in samples],
            "details": {
                "pairwise_similarities": [round(s, 4) for s in similarities]
            }
        }

    def _score_to_verdict(self, score: float) -> str:
        if score < 0.3:
            return "factual"
        elif score < 0.6:
            return "uncertain"
        else:
            return "hallucinated"


# ─────────────────────────────────────────
# 方法3：NLI蕴含检测 + LLM-as-a-Judge
# ─────────────────────────────────────────
class NLIDetector(HallucinationDetector):
    """
    使用自然语言推理判断回答是否被上下文支持。
    或用另一个LLM作为裁判评估忠实度。
    """

    def __init__(self, nli_model=None, judge_llm=None):
        """
        nli_model: callable(text, hypothesis) -> "entailment"/"contradiction"/"neutral"
        judge_llm: callable(text, context) -> float (0~1, hallucination score)
        """
        self.nli_model = nli_model
        self.judge_llm = judge_llm

    @property
    def method_name(self) -> str:
        return "NLI-LLM-Judge"

    def detect(self, response: str, context: str = "", ground_truth: str = "") -> Dict[str, Any]:
        if self.judge_llm:
            try:
                score = self.judge_llm(response, context)
                verdict = self._score_to_verdict(score)
                return {
                    "score": round(score, 4),
                    "verdict": verdict,
                    "method": self.method_name,
                    "context_length": len(context),
                    "response_length": len(response),
                    "details": "LLM-as-Judge evaluation"
                }
            except Exception as e:
                pass

        if self.nli_model and context:
            result = self.nli_model(context, response)
            if result == "entailment":
                score = 0.1
            elif result == "neutral":
                score = 0.5
            else:  # contradiction
                score = 0.9
            return {
                "score": round(score, 4),
                "verdict": self._score_to_verdict(score),
                "method": self.method_name,
                "nli_result": result,
                "details": f"Context-Response NLI: {result}"
            }

        return {
            "score": 0.5,
            "verdict": "uncertain",
            "method": self.method_name,
            "details": "No NLI model or judge LLM configured"
        }

    def _score_to_verdict(self, score: float) -> str:
        if score < 0.3:
            return "factual"
        elif score < 0.6:
            return "uncertain"
        else:
            return "hallucinated"


# ─────────────────────────────────────────
# 方法4：统计学异常检测（ROUGE/BLEU/Novelty）
# ─────────────────────────────────────────
class StatisticalDetector(HallucinationDetector):
    """
    ROUGE/BLEU衡量输出与参考的重叠度。
    Novelty Detection 捕捉低概率词汇组合。
    """

    def __init__(self):
        pass

    @property
    def method_name(self) -> str:
        return "Statistical-Anomaly"

    def _rouge_l(self, reference: str, hypothesis: str) -> float:
        """简化ROUGE-L计算"""
        ref_words = reference.lower().split()
        hyp_words = hypothesis.lower().split()

        if not ref_words or not hyp_words:
            return 0.0

        # 最长公共子序列
        m, n = len(ref_words), len(hyp_words)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if ref_words[i-1] == hyp_words[j-1]:
                    dp[i][j] = dp[i-1][j-1] + 1
                else:
                    dp[i][j] = max(dp[i-1][j], dp[i][j-1])

        lcs_len = dp[m][n]
        recall = lcs_len / m if m else 0
        precision = lcs_len / n if n else 0
        if recall + precision == 0:
            return 0.0
        f1 = 2 * recall * precision / (recall + precision)
        return f1

    def _bleu(self, reference: str, hypothesis: str, n: int = 2) -> float:
        """简化BLEU计算（仅用bigram）"""
        ref_words = reference.lower().split()
        hyp_words = hypothesis.lower().split()

        if len(hyp_words) < n:
            return 0.0

        ref_ngrams = Counter(self._ngrams(ref_words, n))
        hyp_ngrams = Counter(self._ngrams(hyp_words, n))

        overlap = sum((ref_ngrams & hyp_ngrams).values())
        total = sum(hyp_ngrams.values())

        precision = overlap / total if total else 0
        bp = min(1.0, math.exp(1 - len(ref_words) / max(len(hyp_words), 1)))
        return bp * precision

    def _ngrams(self, words: List[str], n: int) -> List[Tuple]:
        return list(zip(*[words[i:] for i in range(n)]))

    def _novelty_score(self, text: str, ref_corpus: List[str] = None) -> float:
        """
        新颖性检测：计算文本中低概率词汇组合的比例。
        无参考语料时返回中等分数（0.5）。
        """
        if not ref_corpus:
            return 0.5  # 无语料，默认中等

        words = text.lower().split()
        if not words:
            return 0.5

        # 构建参考语料的词频
        ref_words = []
        for doc in ref_corpus:
            ref_words.extend(doc.lower().split())
        ref_freq = Counter(ref_words)
        total = len(ref_words)

        # 计算低频词（<语料中位数）比例
        median_count = sorted(ref_freq.values())[len(ref_freq)//2] if ref_freq else 1
        rare_words = sum(1 for w in words if ref_freq.get(w, 0) < median_count)

        novelty = rare_words / len(words)
        return min(novelty, 1.0)

    def detect(self, response: str, context: str = "", ground_truth: str = "") -> Dict[str, Any]:
        scores = {}
        details = {}

        # ROUGE-L（与ground_truth对比）
        if ground_truth:
            rouge_score = self._rouge_l(ground_truth, response)
            scores['rouge_l'] = rouge_score
            # ROUGE高=与真相接近=幻觉少 → 转换为幻觉分数
            scores['rouge_hallucination'] = 1.0 - rouge_score

            bleu_score = self._bleu(ground_truth, response)
            scores['bleu'] = bleu_score
            scores['bleu_hallucination'] = 1.0 - bleu_score

        # 与context的重叠度
        if context:
            context_overlap = self._rouge_l(context, response)
            scores['context_overlap'] = context_overlap
            scores['context_hallucination'] = 1.0 - context_overlap

        # Novelty
        novelty = self._novelty_score(response)
        scores['novelty'] = novelty

        # 综合幻觉分数（权重平均）
        hallucination_scores = [v for k, v in scores.items() if 'hallucination' in k]
        if hallucination_scores:
            overall = sum(hallucination_scores) / len(hallucination_scores)
        else:
            overall = novelty  # fallback

        return {
            "score": round(overall, 4),
            "verdict": self._score_to_verdict(overall),
            "method": self.method_name,
            "component_scores": {k: round(v, 4) for k, v in scores.items()},
            "details": {
                "ground_truth_len": len(ground_truth) if ground_truth else 0,
                "response_len": len(response),
                "context_len": len(context) if context else 0
            }
        }

    def _score_to_verdict(self, score: float) -> str:
        if score < 0.3:
            return "factual"
        elif score < 0.6:
            return "uncertain"
        else:
            return "hallucinated"


# ─────────────────────────────────────────
# 方法5：白盒不确定性估计
# ─────────────────────────────────────────
class UncertaintyDetector(HallucinationDetector):
    """
    考察关键概念的最小Token概率/注意力映射。
    需要能访问模型内部状态（仅限开源/本地模型）。
    """

    def __init__(self):
        self.model = None
        self.tokenizer = None

    @property
    def method_name(self) -> str:
        return "Uncertainty-Estimation"

    def load_model(self, model_path: str, tokenizer_path: str = ""):
        """加载本地模型（需要transformers）"""
        try:
            from transformers import AutoModelForCausalLM, AutoTokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(tokenizer_path or model_path)
            self.model = AutoModelForCausalLM.from_pretrained(model_path)
            self.model.eval()
        except ImportError:
            raise RuntimeError("请安装 transformers: pip install transformers")

    def _get_token_probabilities(self, text: str) -> List[float]:
        """获取每个token的概率"""
        if not self.tokenizer or not self.model:
            return []

        try:
            inputs = self.tokenizer(text, return_tensors="pt")
            with self.tokenizer._attentive_mask():
                outputs = self.model(**inputs, labels=inputs["input_ids"])
            logits = outputs.logits[0]
            probs = logits.softmax(dim=-1)
            target_ids = inputs["input_ids"][0]
            token_probs = [probs[i, token_id].item() for i, token_id in enumerate(target_ids)]
            return token_probs[1:]  # 去掉首个
        except Exception:
            return []

    def _attention_entropy(self, text: str) -> float:
        """简化的注意力熵估计"""
        probs = self._get_token_probabilities(text)
        if not probs:
            return 0.5

        entropy = -sum(p * math.log(max(p, 1e-10)) for p in probs if p > 0)
        # 归一化（假设最大熵约为log(50000)）
        max_entropy = math.log(50000)
        return min(entropy / max_entropy, 1.0)

    def detect(self, response: str, context: str = "", ground_truth: str = "") -> Dict[str, Any]:
        if not self.model:
            return {
                "score": 0.5,
                "verdict": "uncertain",
                "method": self.method_name,
                "details": "No model loaded (whitebox检测需要本地开源模型)"
            }

        token_probs = self._get_token_probabilities(response)
        if not token_probs:
            return {
                "score": 0.5,
                "verdict": "uncertain",
                "method": self.method_name,
                "details": "Could not compute token probabilities"
            }

        min_prob = min(token_probs)
        avg_prob = sum(token_probs) / len(token_probs)
        attention_entropy = self._attention_entropy(response)

        # 最小概率越低=越不自信 → 幻觉可能性越高
        # 注意：这里需要结合分析
        hallucination_score = 1.0 - avg_prob  # 用平均概率的倒数
        hallucination_score = max(0.0, min(1.0, hallucination_score))

        return {
            "score": round(hallucination_score, 4),
            "verdict": self._score_to_verdict(hallucination_score),
            "method": self.method_name,
            "min_token_prob": round(min_prob, 6),
            "avg_token_prob": round(avg_prob, 6),
            "attention_entropy": round(attention_entropy, 4),
            "token_count": len(token_probs),
            "details": {
                "low_confidence_tokens": sum(1 for p in token_probs if p < 0.01)
            }
        }

    def _score_to_verdict(self, score: float) -> str:
        if score < 0.3:
            return "factual"
        elif score < 0.6:
            return "uncertain"
        else:
            return "hallucinated"


# ─────────────────────────────────────────
# 综合检测器（多模型交叉验证）
# ─────────────────────────────────────────
class EnsembleHallucinationDetector:
    """
    集成多种检测方法，取加权平均。
    业界建议：多模型交叉验证 + 全流程技术防线。
    """

    def __init__(self, detectors: List[HallucinationDetector] = None):
        if detectors is None:
            detectors = [
                StatisticalDetector(),  # 始终可用
            ]
        self.detectors = detectors
        # 权重（可配置）
        self.weights = [d.method_name for d in detectors]
        # 默认权重（相等）
        self._weights = [1.0] * len(detectors)

    def set_weights(self, weights: List[float]):
        """设置各检测器权重"""
        if len(weights) != len(self.detectors):
            raise ValueError("权重数量必须与检测器数量一致")
        self._weights = weights

    def detect(self, response: str, context: str = "", ground_truth: str = "") -> Dict[str, Any]:
        results = []
        weighted_sum = 0.0
        total_weight = 0.0

        for detector, weight in zip(self.detectors, self._weights):
            r = detector.detect(response, context, ground_truth)
            results.append(r)
            weighted_sum += r['score'] * weight
            total_weight += weight

        ensemble_score = weighted_sum / total_weight if total_weight else 0.5

        # 综合判决
        verdicts = [r['verdict'] for r in results]
        if verdicts.count('factual') > len(verdicts) / 2:
            final_verdict = 'factual'
        elif verdicts.count('hallucinated') > len(verdicts) / 2:
            final_verdict = 'hallucinated'
        else:
            final_verdict = 'uncertain'

        return {
            "ensemble_score": round(ensemble_score, 4),
            "verdict": final_verdict,
            "method_count": len(self.detectors),
            "component_results": [{
                "method": r['method'],
                "score": r['score'],
                "verdict": r['verdict']
            } for r in results],
            "details": "多模型交叉验证：取加权平均，多数投票决定最终判决"
        }

    def add_detector(self, detector: HallucinationDetector, weight: float = 1.0):
        self.detectors.append(detector)
        self._weights.append(weight)
