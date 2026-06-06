"""
Flask 应用入口
加载所有评测引擎和检测器，启动 REST API 服务
"""

import os
import sys

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app

app = create_app()

if __name__ == "__main__":
    print("=" * 50)
    print("AI-Test 评测系统启动中...")
    print("=" * 50)
    print("API 服务地址: http://0.0.0.0:5000")
    print("前端页面:     http://0.0.0.0:5000/")
    print("=" * 50)
    app.run(host="0.0.0.0", port=5000, debug=True)