"""
评测报告生成器
- 生成结构化JSON报告
- 生成ECharts图表数据
- 导出HTML/PDF报告
"""

import os
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List
import uuid

REPORTS_DIR = Path(__file__).parent.parent.parent / "data" / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)


class ReportGenerator:
    """报告生成器"""

    def __init__(self):
        self.reports_dir = REPORTS_DIR

    def save_report(self, report_data: Dict) -> Dict:
        """保存报告到文件"""
        if "id" not in report_data:
            report_data["id"] = f"report_{uuid.uuid4().hex[:8]}"

        report_data["generated_at"] = datetime.now().isoformat()
        filepath = self.reports_dir / f"{report_data['id']}.json"

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(report_data, f, ensure_ascii=False, indent=2)

        return {"id": report_data["id"], "path": str(filepath)}

    def get_report(self, report_id: str) -> Dict:
        filepath = self.reports_dir / f"{report_id}.json"
        if not filepath.exists():
            return {}
        with open(filepath, encoding="utf-8") as f:
            return json.load(f)

    def list_reports(self, limit: int = 20) -> List[Dict]:
        reports = []
        for f in sorted(self.reports_dir.glob("*.json"), key=lambda x: x.stat().st_mtime, reverse=True):
            with open(f, encoding="utf-8") as fp:
                data = json.load(fp)
                reports.append({
                    "id": data.get("id"),
                    "model_name": data.get("model_name"),
                    "overall_score": data.get("overall_score"),
                    "generated_at": data.get("generated_at"),
                    "dimensions": data.get("dimensions", []),
                })
        return reports[:limit]

    def get_chart_data(self, report_id: str) -> Dict:
        """生成ECharts图表数据"""
        report = self.get_report(report_id)
        if not report:
            return {}

        dim_scores = report.get("dimension_scores", {})
        dim_details = report.get("dimension_details", {})
        hallucination = report.get("hallucination_summary", {})

        # 雷达图数据
        radar_dimensions = list(dim_scores.keys())
        radar_values = [round(dim_scores[d], 1) for d in radar_dimensions]

        radar_chart = {
            "title": {"text": "各维度得分雷达图"},
            "radar": {
                "indicator": [
                    {"name": d, "max": 100} for d in radar_dimensions
                ]
            },
            "series": [{
                "type": "radar",
                "data": [{
                    "value": radar_values,
                    "name": report.get("model_name", "Model")
                }]
            }]
        }

        # 柱状图：各维度得分
        bar_chart = {
            "title": {"text": "各维度得分对比"},
            "xAxis": {"type": "category", "data": radar_dimensions},
            "yAxis": {"type": "value", "max": 100, "name": "得分"},
            "series": [{
                "type": "bar",
                "data": radar_values,
                "itemStyle": {
                    "color": "#5470c6"
                }
            }]
        }

        # 幻觉检测饼图
        halluc_scores = hallucination.get("scores", [])
        pie_chart = {
            "title": {"text": "幻觉检测结果分布"},
            "series": [{
                "type": "pie",
                "radius": ["40%", "70%"],
                "data": [
                    {"name": "factual", "value": sum(1 for s in halluc_scores if s < 0.3)},
                    {"name": "uncertain", "value": sum(1 for s in halluc_scores if 0.3 <= s < 0.6)},
                    {"name": "hallucinated", "value": sum(1 for s in halluc_scores if s >= 0.6)},
                ]
            }]
        }

        # 折线图：随时间变化的幻觉分数趋势（如果有历史数据）
        line_chart = {
            "title": {"text": "幻觉分数趋势"},
            "xAxis": {"type": "category", "data": [f"Case {i+1}" for i in range(len(halluc_scores))]},
            "yAxis": {"type": "value", "name": "幻觉分数", "max": 1.0},
            "series": [{
                "type": "line",
                "data": [round(s, 4) for s in halluc_scores],
                "smooth": True,
                "areaStyle": {}
            }]
        }

        return {
            "radar_chart": radar_chart,
            "bar_chart": bar_chart,
            "pie_chart": pie_chart,
            "line_chart": line_chart,
            "summary": {
                "model_name": report.get("model_name"),
                "overall_score": round(report.get("overall_score", 0), 2),
                "total_cases": report.get("total_cases", 0),
                "passed_cases": report.get("passed_cases", 0),
                "pass_rate": round(report.get("passed_cases", 0) / max(report.get("total_cases", 1), 1) * 100, 1),
                "hallucination_avg": round(hallucination.get("avg_score", 0), 4),
                "risk_level": hallucination.get("risk_level", "unknown"),
            }
        }

    def generate_html_report(self, report_id: str) -> str:
        """生成完整HTML报告"""
        report = self.get_report(report_id)
        if not report:
            return "<h1>报告不存在</h1>"

        chart_data = self.get_chart_data(report_id)
        summary = chart_data.get("summary", {})
        dim_scores = report.get("dimension_scores", {})
        recommendations = report.get("recommendations", [])

        html = f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>AI评测报告 - {report.get('model_name', 'Model')}</title>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; background: #f5f5f5; }}
        .report-container {{ max-width: 1200px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }}
        h1 {{ color: #333; border-bottom: 2px solid #5470c6; padding-bottom: 16px; }}
        .score-display {{ font-size: 72px; font-weight: bold; color: #5470c6; text-align: center; padding: 40px 0; }}
        .score-label {{ text-align: center; color: #666; font-size: 18px; margin-bottom: 20px; }}
        .metrics-row {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }}
        .metric-box {{ background: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center; }}
        .metric-box .value {{ font-size: 28px; font-weight: bold; color: #333; }}
        .metric-box .label {{ font-size: 14px; color: #666; margin-top: 8px; }}
        .chart-section {{ margin: 40px 0; }}
        .chart-section h2 {{ color: #333; margin-bottom: 20px; }}
        .charts-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }}
        table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
        th, td {{ padding: 12px 16px; text-align: left; border-bottom: 1px solid #eee; }}
        th {{ background: #f8f9fa; font-weight: 600; }}
        .recommendations {{ background: #fff3cd; border-radius: 8px; padding: 20px; margin: 20px 0; }}
        .recommendations li {{ margin: 8px 0; line-height: 1.6; }}
        .risk-critical {{ color: #dc3545; font-weight: bold; }}
        .risk-high {{ color: #fd7e14; font-weight: bold; }}
        .risk-medium {{ color: #ffc107; }}
        .risk-low {{ color: #28a745; }}
        .footer {{ text-align: center; color: #999; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }}
    </style>
</head>
<body>
    <div class="report-container">
        <h1>🧠 大模型评测报告</h1>
        <div class="score-label">综合评分</div>
        <div class="score-display">{round(report.get('overall_score', 0), 1)}</div>

        <div class="metrics-row">
            <div class="metric-box">
                <div class="value">{summary.get('total_cases', 0)}</div>
                <div class="label">测试用例</div>
            </div>
            <div class="metric-box">
                <div class="value">{summary.get('passed_cases', 0)}</div>
                <div class="label">通过数</div>
            </div>
            <div class="metric-box">
                <div class="value">{summary.get('pass_rate', 0)}%</div>
                <div class="label">通过率</div>
            </div>
            <div class="metric-box">
                <div class="value">{summary.get('hallucination_avg', '--')}</div>
                <div class="label">幻觉均分</div>
            </div>
        </div>

        <div class="chart-section">
            <h2>📊 维度得分分析</h2>
            <div class="charts-grid">
                <div id="radar" style="width:100%;height:350px;"></div>
                <div id="bar" style="width:100%;height:350px;"></div>
            </div>
        </div>

        <div class="chart-section">
            <h2>🔍 幻觉检测分布</h2>
            <div id="pie" style="width:100%;height:300px;"></div>
        </div>

        <div class="chart-section">
            <h2>📋 详细评分</h2>
            <table>
                <thead>
                    <tr><th>维度</th><th>得分</th><th>风险等级</th></tr>
                </thead>
                <tbody>
"""

        for dim, score in dim_scores.items():
            risk = report.get("dimension_details", {}).get(dim, {}).get("risk_level", "unknown")
            html += f"<tr><td>{dim}</td><td>{round(score, 1)}</td><td class='risk-{risk}'>{risk}</td></tr>\n"

        html += """
                </tbody>
            </table>
        </div>
"""

        if recommendations:
            html += f"""
        <div class="recommendations">
            <h2>💡 改进建议</h2>
            <ul>
"""
            for rec in recommendations:
                html += f"<li>{rec}</li>\n"

            html += """
            </ul>
        </div>
"""

        html += f"""
        <div class="footer">
            报告生成时间：{report.get('generated_at', datetime.now().isoformat())}<br>
            AI-Test · 大模型评测平台
        </div>
    </div>

    <script>
        var radarChart = echarts.init(document.getElementById('radar'));
        radarChart.setOption({json.dumps(chart_data.get('radar_chart', {}))});

        var barChart = echarts.init(document.getElementById('bar'));
        barChart.setOption({json.dumps(chart_data.get('bar_chart', {}))});

        var pieChart = echarts.init(document.getElementById('pie'));
        pieChart.setOption({json.dumps(chart_data.get('pie_chart', {}))});

        window.addEventListener('resize', function() {{
            radarChart.resize();
            barChart.resize();
            pieChart.resize();
        }});
    </script>
</body>
</html>
"""
        return html

    def export_report(self, report_id: str, format: str = "html") -> str:
        """导出报告"""
        if format == "html":
            content = self.generate_html_report(report_id)
            export_path = self.reports_dir / f"{report_id}.html"
            with open(export_path, "w", encoding="utf-8") as f:
                f.write(content)
            return str(export_path)
        elif format == "json":
            report = self.get_report(report_id)
            export_path = self.reports_dir / f"{report_id}_data.json"
            with open(export_path, "w", encoding="utf-8") as f:
                json.dump(report, f, ensure_ascii=False, indent=2)
            return str(export_path)
        return ""
