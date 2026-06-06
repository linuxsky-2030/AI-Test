with open('app.py', 'r') as f:
    content = f.read()

old = """    def evaluate(self, model_response, ground_truth, dimension="all"):
        \"\"\"使用规则和启发式方法进行初步评测\"\"\"
        scores = {}

        # 准确度评分
        if dimension == "accuracy" or dimension == "all\":"""

new = """    def evaluate(self, model_response, ground_truth, dimension="all"):
        \"\"\"使用规则和启发式方法进行初步评测\"\"\"
        scores = {}

        # 未知维度时（multimodal_intent/end_to_end/custom_agent/security_risk）也计算所有指标
        is_unknown_dim = dimension not in ("accuracy", "fluency", "relevance", "coherence", "safety")

        # 准确度评分
        if dimension == "accuracy" or dimension == "all" or is_unknown_dim:"""

if old in content:
    content = content.replace(old, new)
    with open('app.py', 'w') as f:
        f.write(content)
    print("done")
else:
    print("not found")
    idx = content.find("def evaluate(self, model_response")
    print(repr(content[idx:idx+300]))