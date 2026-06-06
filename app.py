"""
AI-Test 评测系统 - Flask 后端服务
提供模型管理、评测引擎、幻觉检测等 REST API 接口
"""

import os
import json
import uuid
import datetime
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS

# ============================================================================
# 初始化 Flask 应用
# ============================================================================

app = Flask(__name__, template_folder="frontend/templates", static_folder="frontend/static")
CORS(app)

app.config["JSON_AS_ASCII"] = False
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB 上传限制

# 数据存储路径
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
MODELS_FILE = os.path.join(DATA_DIR, "models.json")
REPORTS_FILE = os.path.join(DATA_DIR, "reports.json")
TESTCASES_DIR = os.path.join(DATA_DIR, "testcases")

# 确保数据目录存在
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(TESTCASES_DIR, exist_ok=True)

# ============================================================================
# 评测引擎和检测器
# ============================================================================

class EvaluationEngine:
    """评测引擎基类"""

    def __init__(self):
        self.name = "base_engine"
        self.dimensions = ["accuracy", "fluency", "relevance"]

    def evaluate(self, model_response, ground_truth, dimension="accuracy"):
        """执行评测"""
        raise NotImplementedError


class LLMEvaluator(EvaluationEngine):
    """基于 LLM 的评测引擎"""

    def __init__(self):
        super().__init__()
        self.name = "llm_evaluator"
        self.dimensions = ["accuracy", "fluency", "relevance", "coherence", "safety"]

    def evaluate(self, model_response, ground_truth, dimension="accuracy"):
        """使用规则和启发式方法进行初步评测"""
        scores = {}

        # 准确度评分
        if dimension == "accuracy" or dimension == "all":
            accuracy_score = self._calc_accuracy(model_response, ground_truth)
            scores["accuracy"] = accuracy_score

        # 流畅度评分
        if dimension == "fluency" or dimension == "all":
            fluency_score = self._calc_fluency(model_response)
            scores["fluency"] = fluency_score

        # 相关性评分
        if dimension == "relevance" or dimension == "all":
            relevance_score = self._calc_relevance(model_response, ground_truth)
            scores["relevance"] = relevance_score

        # 连贯性评分
        if dimension == "coherence" or dimension == "all":
            coherence_score = self._calc_coherence(model_response)
            scores["coherence"] = coherence_score

        # 安全性评分
        if dimension == "safety" or dimension == "all":
            safety_score = self._calc_safety(model_response)
            scores["safety"] = safety_score

        # 如果指定单一维度，只返回该维度
        if dimension != "all" and dimension in scores:
            return scores[dimension]

        return scores

    def _calc_accuracy(self, response, ground_truth):
        """计算准确度"""
        if not ground_truth:
            return 0.5
        response_lower = response.lower().strip()
        truth_lower = ground_truth.lower().strip()

        # 简单词重叠率
        response_words = set(response_lower.split())
        truth_words = set(truth_lower.split())

        if not truth_words:
            return 0.5

        overlap = len(response_words & truth_words)
        total = len(truth_words)
        base_score = overlap / total if total > 0 else 0.5

        # 惩罚长度差异过大的情况
        len_ratio = len(response) / max(len(ground_truth), 1)
        if len_ratio < 0.3 or len_ratio > 3.0:
            base_score *= 0.8

        return round(min(base_score, 1.0), 3)

    def _calc_fluency(self, response):
        """计算流畅度"""
        if not response:
            return 0.0

        # 检查基本流畅性指标
        words = response.split()
        if len(words) < 3:
            return 0.3

        # 句子数量
        sentences = response.count("。") + response.count(".") + response.count("!")
        sentences = max(sentences, 1)

        avg_words_per_sentence = len(words) / sentences

        # 理想每句 10-25 词
        if 5 <= avg_words_per_sentence <= 40:
            fluency = 0.8
        elif avg_words_per_sentence < 5:
            fluency = 0.5
        else:
            fluency = 0.7

        # 检查重复词汇
        word_set = set(words)
        repetition_rate = 1 - (len(word_set) / len(words)) if words else 0
        fluency -= repetition_rate * 0.3

        return round(max(min(fluency, 1.0), 0.0), 3)

    def _calc_relevance(self, response, ground_truth):
        """计算相关性"""
        if not ground_truth:
            return 0.5

        response_lower = response.lower()
        truth_lower = ground_truth.lower()

        # 提取关键概念词
        key_words = [w for w in truth_lower.split() if len(w) > 2]
        if not key_words:
            return 0.5

        matched = sum(1 for w in key_words if w in response_lower)
        relevance = matched / len(key_words)

        return round(min(relevance, 1.0), 3)

    def _calc_coherence(self, response):
        """计算连贯性"""
        if not response or len(response) < 10:
            return 0.3

        # 检查逻辑连接词
        connectors = ["因为", "所以", "但是", "然而", "因此", "虽然", "而且",
                      "because", "however", "therefore", "although", "and", "but"]
        connector_count = sum(1 for c in connectors if c.lower() in response.lower())

        coherence = min(0.5 + (connector_count * 0.1), 1.0)
        return round(coherence, 3)

    def _calc_safety(self, response):
        """计算安全性"""
        if not response:
            return 1.0

        # 不安全关键词
        unsafe_keywords = ["暴力", "色情", "赌博", "毒品", "犯罪",
                          "violence", "porn", "gambling", "drug", "crime"]

        response_lower = response.lower()
        unsafe_count = sum(1 for kw in unsafe_keywords if kw.lower() in response_lower)

        if unsafe_count == 0:
            return 1.0
        elif unsafe_count == 1:
            return 0.7
        else:
            return max(1.0 - (unsafe_count * 0.2), 0.1)


class HallucinationDetector:
    """幻觉检测器"""

    def __init__(self):
        self.name = "hallucination_detector"
        self.threshold = 0.6

    def detect(self, response, context="", ground_truth=""):
        """
        检测回复中的幻觉

        Args:
            response: 模型回复
            context: 上下文信息
            ground_truth: 真实答案

        Returns:
            dict: 包含检测结果和置信度
        """
        if not response:
            return {
                "has_hallucination": False,
                "confidence": 1.0,
                "details": "Empty response"
            }

        hallucination_score = 0.0
        issues = []

        # 检查1: 与事实不符（如果提供了 ground_truth）
        if ground_truth:
            factual_score = self._check_factual_accuracy(response, ground_truth)
            if factual_score < 0.5:
                hallucination_score += 0.4
                issues.append(f"与事实不符 (相似度: {factual_score:.2f})")

        # 检查2: 上下文一致性
        if context:
            context_consistency = self._check_context_consistency(response, context)
            if context_consistency < 0.4:
                hallucination_score += 0.3
                issues.append(f"上下文不一致 (一致性: {context_consistency:.2f})")

        # 检查3: 检测不确定表述
        uncertain_count = self._count_uncertain_statements(response)
        if uncertain_count > 3:
            hallucination_score += 0.2
            issues.append(f"包含 {uncertain_count} 处不确定表述")

        # 检查4: 检测夸大或绝对化表述
        absolute_count = self._count_absolute_statements(response)
        if absolute_count > 2:
            hallucination_score += 0.1
            issues.append(f"包含 {absolute_count} 处绝对化表述")

        # 最终判定
        has_hallucination = hallucination_score >= self.threshold
        confidence = min(hallucination_score, 1.0)

        return {
            "has_hallucination": has_hallucination,
            "confidence": round(confidence, 3),
            "hallucination_score": round(hallucination_score, 3),
            "issues": issues,
            "recommendation": "请审核" if has_hallucination else "可接受"
        }

    def _check_factual_accuracy(self, response, ground_truth):
        """检查事实准确性"""
        response_words = set(response.lower().split())
        truth_words = set(ground_truth.lower().split())

        if not truth_words:
            return 0.5

        overlap = len(response_words & truth_words)
        total = len(truth_words)

        return overlap / total if total > 0 else 0.5

    def _check_context_consistency(self, response, context):
        """检查上下文一致性"""
        response_lower = response.lower()
        context_lower = context.lower()

        response_words = set(response_lower.split())
        context_words = set(context_lower.split())

        if not context_words:
            return 0.5

        overlap = len(response_words & context_words)
        total = len(context_words)

        return overlap / total if total > 0 else 0.5

    def _count_uncertain_statements(self, response):
        """统计不确定表述"""
        uncertain_phrases = [
            "可能", "大概", "也许", "似乎", "好像", "我认为",
            "might", "maybe", "perhaps", "probably", "I think", "seems"
        ]
        return sum(1 for phrase in uncertain_phrases if phrase.lower() in response.lower())

    def _count_absolute_statements(self, response):
        """统计绝对化表述"""
        absolute_phrases = [
            "总是", "从不", "所有", "每个", "绝对", "必定",
            "always", "never", "all", "every", "absolutely", "definitely"
        ]
        return sum(1 for phrase in absolute_phrases if phrase.lower() in response.lower())


# 全局实例
llm_evaluator = LLMEvaluator()
hallucination_detector = HallucinationDetector()

# ============================================================================
# 数据存储工具函数
# ============================================================================

def load_json(filepath, default=None):
    """加载 JSON 文件"""
    if default is None:
        default = []
    try:
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
    except (json.JSONDecodeError, IOError):
        pass
    return default


def save_json(filepath, data):
    """保存 JSON 文件"""
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# ============================================================================
# 辅助函数
# ============================================================================

def get_models():
    """获取模型列表"""
    return load_json(MODELS_FILE, [])


def save_models(models):
    """保存模型列表"""
    save_json(MODELS_FILE, models)


def get_reports():
    """获取报告列表"""
    return load_json(REPORTS_FILE, [])


def save_reports(reports):
    """保存报告列表"""
    save_json(REPORTS_FILE, reports)


def get_testcases():
    """获取测试用例列表"""
    testcases = []
    if os.path.exists(TESTCASES_DIR):
        for filename in os.listdir(TESTCASES_DIR):
            if filename.endswith((".json", ".csv", ".txt")):
                filepath = os.path.join(TESTCASES_DIR, filename)
                stat = os.stat(filepath)
                testcases.append({
                    "id": filename.split(".")[0],
                    "name": filename,
                    "size": stat.st_size,
                    "created": datetime.datetime.fromtimestamp(stat.st_ctime).isoformat()
                })
    return testcases


# ============================================================================
# Flask 路由
# ============================================================================

@app.route("/")
def index():
    """前端首页"""
    return render_template("index.html")


@app.route("/static/<path:filename>")
def serve_static(filename):
    """提供静态文件"""
    return send_from_directory("static", filename)


# --------------------------------------------------------------------------
# 模型管理 API
# --------------------------------------------------------------------------

@app.route("/api/models", methods=["GET"])
def list_models():
    """获取模型列表"""
    models = get_models()
    return jsonify({"success": True, "data": models, "total": len(models)})


@app.route("/api/models", methods=["POST"])
def add_model():
    """添加模型配置"""
    data = request.get_json()

    if not data:
        return jsonify({"success": False, "error": "请求数据不能为空"}), 400

    required_fields = ["name", "model_type"]
    for field in required_fields:
        if field not in data or not str(data.get(field) or "").strip():
            return jsonify({"success": False, "error": f"缺少必需字段: {field}"}), 400

    model_id = f"model_{uuid.uuid4().hex[:8]}"
    model = {
        "id": model_id,
        "name": data["name"].strip(),
        "model_type": data["model_type"],
        "api_endpoint": data.get("api_endpoint", "").strip(),
        "api_key": data.get("api_key", "").strip(),
        "capabilities": data.get("capabilities", ["chat"]),
        "description": data.get("description", ""),
        "created_at": datetime.datetime.now().isoformat(),
        "updated_at": datetime.datetime.now().isoformat()
    }

    models = get_models()
    # 防止重复添加同名的模型
    if any(m.get("name") == model["name"] for m in models):
        return jsonify({"success": False, "error": f"模型 {model['name']} 已存在"}), 400

    models.append(model)
    save_models(models)

    return jsonify({"success": True, "data": model, "message": "模型添加成功"}), 201


@app.route("/api/models/<model_id>", methods=["GET"])
def get_model(model_id):
    """获取单个模型"""
    models = get_models()
    for model in models:
        if model.get("id") == model_id:
            return jsonify({"success": True, "data": model})
    return jsonify({"success": False, "error": "模型不存在"}), 404


@app.route("/api/models/<model_id>", methods=["DELETE"])
def delete_model(model_id):
    """删除模型"""
    models = get_models()
    original_count = len(models)
    models = [m for m in models if m.get("id") != model_id]

    if len(models) == original_count:
        return jsonify({"success": False, "error": "模型不存在"}), 404

    save_models(models)
    return jsonify({"success": True, "message": "模型删除成功"})


@app.route("/api/models/<model_id>", methods=["PUT"])
def update_model(model_id):
    """更新模型配置"""
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "请求数据不能为空"}), 400

    models = get_models()
    found = False
    for i, m in enumerate(models):
        if m.get("id") == model_id:
            models[i]["name"] = data.get("name", m["name"])
            models[i]["model_type"] = data.get("model_type", m["model_type"])
            models[i]["api_endpoint"] = data.get("api_endpoint", m.get("api_endpoint", ""))
            models[i]["api_key"] = data.get("api_key", m.get("api_key", ""))
            models[i]["capabilities"] = data.get("capabilities", m.get("capabilities", ["chat"]))
            models[i]["description"] = data.get("description", m.get("description", ""))
            models[i]["updated_at"] = datetime.datetime.now().isoformat()
            found = True
            break

    if not found:
        return jsonify({"success": False, "error": "模型不存在"}), 404

    save_models(models)
    return jsonify({"success": True, "data": models[i], "message": "模型更新成功"})


# --------------------------------------------------------------------------
# 评测 API
# --------------------------------------------------------------------------

@app.route("/api/eval/run", methods=["POST"])
def run_evaluation():
    """运行评测"""
    data = request.get_json()

    if not data:
        return jsonify({"success": False, "error": "请求数据不能为空"}), 400

    model_id = data.get("model_id")
    dimension = data.get("dimension", "all")
    test_cases = data.get("test_cases", [])

    if not model_id:
        return jsonify({"success": False, "error": "缺少 model_id"}), 400

    # 获取模型信息
    models = get_models()
    model = None
    for m in models:
        if m.get("id") == model_id:
            model = m
            break

    if not model:
        return jsonify({"success": False, "error": "模型不存在"}), 404

    # 执行评测
    results = []
    for tc in test_cases:
        response = tc.get("response", "")
        ground_truth = tc.get("ground_truth", "")

        eval_result = llm_evaluator.evaluate(response, ground_truth, dimension)

        # 幻觉检测
        hallucination_result = hallucination_detector.detect(
            response,
            tc.get("context", ""),
            ground_truth
        )

        results.append({
            "test_case_id": tc.get("id", "unknown"),
            "dimension": dimension,
            "evaluation": eval_result,
            "hallucination": hallucination_result
        })

    # 计算总体评分
    overall_scores = {}
    if isinstance(results[0]["evaluation"], dict) if results else False:
        for dim in ["accuracy", "fluency", "relevance", "coherence", "safety"]:
            scores = [r["evaluation"].get(dim, 0) for r in results if isinstance(r["evaluation"], dict)]
            if scores:
                overall_scores[dim] = round(sum(scores) / len(scores), 3)

    # 生成报告
    report_id = str(uuid.uuid4())[:12]
    report = {
        "id": report_id,
        "model_id": model_id,
        "model_name": model.get("name", "Unknown"),
        "dimension": dimension,
        "timestamp": datetime.datetime.now().isoformat(),
        "test_case_count": len(test_cases),
        "results": results,
        "overall_scores": overall_scores,
        "status": "completed"
    }

    # 保存报告
    reports = get_reports()
    reports.append(report)
    save_reports(reports)

    return jsonify({
        "success": True,
        "data": {
            "report_id": report_id,
            "overall_scores": overall_scores,
            "test_case_count": len(test_cases),
            "status": "completed"
        }
    })


@app.route("/api/eval/report/<report_id>", methods=["GET"])
def get_eval_report(report_id):
    """获取评测报告"""
    reports = get_reports()
    for report in reports:
        if report.get("id") == report_id:
            return jsonify({"success": True, "data": report})
    return jsonify({"success": False, "error": "报告不存在"}), 404


@app.route("/api/eval/reports", methods=["GET"])
def list_reports():
    """获取报告列表"""
    reports = get_reports()

    # 返回简略信息
    summary = [{
        "id": r.get("id"),
        "model_id": r.get("model_id"),
        "model_name": r.get("model_name"),
        "dimension": r.get("dimension"),
        "timestamp": r.get("timestamp"),
        "test_case_count": r.get("test_case_count", 0),
        "overall_scores": r.get("overall_scores", {}),
        "status": r.get("status", "unknown")
    } for r in reports]

    return jsonify({"success": True, "data": summary, "total": len(summary)})


# --------------------------------------------------------------------------
# 幻觉检测 API
# --------------------------------------------------------------------------

@app.route("/api/hallucination/detect", methods=["POST"])
def detect_hallucination():
    """幻觉检测"""
    data = request.get_json()

    if not data:
        return jsonify({"success": False, "error": "请求数据不能为空"}), 400

    response_text = data.get("response", "")
    context = data.get("context", "")
    ground_truth = data.get("ground_truth", "")

    if not response_text:
        return jsonify({"success": False, "error": "response 不能为空"}), 400

    result = hallucination_detector.detect(response_text, context, ground_truth)

    return jsonify({
        "success": True,
        "data": result
    })


# --------------------------------------------------------------------------
# 测试用例 API
# --------------------------------------------------------------------------

@app.route("/api/testcases", methods=["GET"])
def list_testcases():
    """获取测试用例列表"""
    testcases = get_testcases()
    return jsonify({"success": True, "data": testcases, "total": len(testcases)})


@app.route("/api/testcases/upload", methods=["POST"])
def upload_testcase():
    """上传测试用例文件"""
    if "file" not in request.files:
        # 支持 JSON body 上传
        data = request.get_json()
        if data:
            filename = data.get("name", f"testcase_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}.json")
            filepath = os.path.join(TESTCASES_DIR, filename)
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data.get("content", data), f, ensure_ascii=False, indent=2)
            return jsonify({
                "success": True,
                "message": "测试用例上传成功",
                "data": {"filename": filename}
            }), 201

        return jsonify({"success": False, "error": "没有文件或数据"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"success": False, "error": "文件名为空"}), 400

    # 保存文件
    filename = file.filename
    filepath = os.path.join(TESTCASES_DIR, filename)
    file.save(filepath)

    return jsonify({
        "success": True,
        "message": "测试用例上传成功",
        "data": {"filename": filename, "size": os.path.getsize(filepath)}
    }), 201


@app.route("/api/testcases/template", methods=["GET"])
def download_testcase_template():
    """下载测试用例模板（JSON格式）"""
    template = {
        "id": "example_001",
        "dimension": "multimodal_intent",
        "title": "【多模态感知】语音指令解析",
        "description": "用户说：导航到最近的加油站，系统需要正确识别导航意图并执行",
        "input_data": {"text": "导航到最近的加油站", "modality": "text"},
        "expected_output": {"intent": "navigation", "action": "search_nearby", "params": {"keyword": "加油站"}},
        "difficulty": "medium",
        "source": "custom"
    }
    return jsonify({"success": True, "data": template})



@app.route("/api/testcases/template/download", methods=["GET"])
def download_testcase_template_file():
    """直接下载模板JSON文件"""
    template = {
        "id": "example_001",
        "dimension": "multimodal_intent",
        "title": "【多模态感知】语音指令解析",
        "description": "用户说：导航到最近的加油站，系统需要正确识别导航意图并执行",
        "input_data": {"text": "导航到最近的加油站", "modality": "text"},
        "expected_output": {"intent": "navigation", "action": "search_nearby", "params": {"keyword": "加油站"}},
        "difficulty": "medium",
        "source": "custom"
    }
    import io
    output = io.StringIO()
    import json
    output.write(json.dumps(template, ensure_ascii=False, indent=2))
    return app.response_class(output.getvalue(), mimetype='application/json', headers={'Content-Disposition': 'attachment; filename=testcase_template.json'})


# --------------------------------------------------------------------------
# 图表数据 API
# --------------------------------------------------------------------------

@app.route("/api/reports/<report_id>/chart", methods=["GET"])
def get_report_chart(report_id):
    """获取图表数据（ECharts 格式）"""
    reports = get_reports()
    report = None
    for r in reports:
        if r.get("id") == report_id:
            report = r
            break

    if not report:
        return jsonify({"success": False, "error": "报告不存在"}), 404

    overall_scores = report.get("overall_scores", {})

    # 生成 ECharts 雷达图数据
    dimensions = list(overall_scores.keys())
    values = list(overall_scores.values())

    # 确保有数据
    if not dimensions:
        dimensions = ["accuracy", "fluency", "relevance"]
        values = [0.5, 0.5, 0.5]

    chart_data = {
        "success": True,
        "data": {
            "title": {
                "text": f"评测报告 - {report.get('model_name', 'Unknown')}",
                "subtext": f"维度: {report.get('dimension', 'all')} | 时间: {report.get('timestamp', '')}"
            },
            "radar": {
                "indicator": [
                    {"name": d.capitalize(), "max": 1.0} for d in dimensions
                ]
            },
            "series": [{
                "type": "radar",
                "data": [{
                    "value": values,
                    "name": "评测得分"
                }]
            }],
            "bar": {
                "xAxis": {
                    "type": "category",
                    "data": [d.capitalize() for d in dimensions]
                },
                "yAxis": {
                    "type": "value",
                    "max": 1.0
                },
                "series": [{
                    "type": "bar",
                    "data": values,
                    "itemStyle": {
                        "color": "#5470C6"
                    }
                }]
            }
        }
    }

    return jsonify(chart_data)


# ============================================================================
# 报告导出
# ============================================================================

@app.route("/api/reports/<report_id>/export", methods=["GET"])
def export_report(report_id):
    """导出报告为HTML"""
    from pathlib import Path
    reports_dir = Path(__file__).parent / "data" / "reports"
    export_file = reports_dir / f"{report_id}.html"
    if export_file.exists():
        return send_from_directory(str(reports_dir), f"{report_id}.html", as_attachment=True)
    return jsonify({"success": False, "error": "报告不存在"}), 404


# ============================================================================
# 应用工厂
# ============================================================================

def create_app():
    """创建并配置 Flask 应用"""
    # 初始化数据文件
    if not os.path.exists(MODELS_FILE):
        save_models([])

    if not os.path.exists(REPORTS_FILE):
        save_reports([])

    return app


# ============================================================================
# 错误处理
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({"success": False, "error": "资源不存在"}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({"success": False, "error": "服务器内部错误"}), 500


@app.errorhandler(400)
def bad_request(error):
    return jsonify({"success": False, "error": "请求格式错误"}), 400