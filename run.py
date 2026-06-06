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
    import socket
    port = 5000
    max_tries = 5
    for i in range(max_tries):
        try:
            s = socket.socket()
            s.bind(("0.0.0.0", port))
            s.close()
            break
        except OSError:
            port += 1
    print("=" * 50)
    print("AI-Test 评测系统启动中...")
    print("=" * 50)
    print(f"前端页面: http://localhost:{port}/")
    print("=" * 50)
    app.run(host="0.0.0.0", port=port, debug=False)