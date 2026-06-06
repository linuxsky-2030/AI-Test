/**
 * AI-Test 前端交互逻辑
 */

const API_BASE = '/api';
let currentReportId = null;

// ── 导航 ──
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
        e.preventDefault();
        const page = item.dataset.page;
        App.navigate(page);
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
    },

    // ── 仪表盘 ──
    async loadDashboard() {
        try {
            const [models, reports] = await Promise.all([
                fetch(`${API_BASE}/models`).then(r => r.json()),
                fetch(`${API_BASE}/eval/reports`).then(r => r.json())
            ]);

            document.getElementById('total-models').textContent = (models.data || []).length;
            document.getElementById('total-evals').textContent = (reports.data || []).length;

            // 渲染雷达图
            if (reports.data && reports.data.length > 0) {
                const latest = reports.data[0];
                if (latest.dimension_scores) {
                    const dims = Object.keys(latest.dimension_scores);
                    const values = dims.map(d => latest.dimension_scores[d]);

                    const radar = echarts.init(document.getElementById('radar-chart'));
                    radar.setOption({
                        radar: {
                            indicator: dims.map(d => ({ name: d, max: 100 })),
                            radius: '65%'
                        },
                        series: [{
                            type: 'radar',
                            data: [{ value: values, name: latest.model_name }]
                        }]
                    });
                }
            }

            // 渲染近期报告
            const tbody = document.getElementById('reports-tbody');
            if (reports.data && reports.data.length > 0) {
                tbody.innerHTML = reports.data.slice(0, 5).map(r => `
                    <tr>
                        <td>${r.model_name}</td>
                        <td>${(r.dimensions || []).join(', ')}</td>
                        <td>${r.overall_score || '--'}</td>
                        <td>${r.pass_rate || '--'}%</td>
                        <td><span class="risk-${r.risk_level}">${r.risk_level || '--'}</span></td>
                        <td>${(r.generated_at || '').slice(0, 10)}</td>
                        <td><button class="btn-link" onclick="App.viewReport('${r.id}')">查看</button></td>
                    </tr>
                `).join('');
            }

        } catch (e) {
            console.error('Dashboard load error:', e);
        }
    },

    // ── 模型管理 ──
    async loadModels() {
        try {
            const res = await fetch(`${API_BASE}/models`);
            const json = await res.json();
            const models = json.data || [];

            const container = document.getElementById('model-cards');
            if (models.length === 0) {
                container.innerHTML = '<div class="empty-state">暂无配置模型，请添加</div>';
                return;
            }

            container.innerHTML = models.map(m => `
                <div class="model-card">
                    <div class="model-card-header">
                        <div class="model-name">${m.name}</div>
                        <div class="model-type">${m.model_type}</div>
                    </div>
                    <div class="model-meta">
                        ${(m.capabilities || []).map(c => `<span class="cap-tag">${c}</span>`).join('')}
                    </div>
                    <div class="model-actions">
                        <button class="btn btn-sm" onclick="App.deleteModel('${m.id}')">删除</button>
                    </div>
                </div>
            `).join('');

            // 更新评测页下拉框
            const select = document.getElementById('eval-model-select');
            if (select) {
                select.innerHTML = '<option value="">-- 选择模型 --</option>' +
                    models.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
            }

        } catch (e) {
            console.error('Models load error:', e);
        }
    },

    showModelModal() {
        document.getElementById('model-modal').style.display = 'flex';
    },

    closeModelModal() {
        document.getElementById('model-modal').style.display = 'none';
        document.getElementById('m-name').value = '';
        document.getElementById('m-apikey').value = '';
    },

    async saveModel() {
        const name = document.getElementById('m-name').value.trim();
        const model_type = document.getElementById('m-type').value;
        const api_endpoint = document.getElementById('m-endpoint').value.trim();
        const api_key = document.getElementById('m-apikey').value.trim();
        const capabilities = Array.from(
            document.querySelectorAll('#model-modal .capability-checkboxes input:checked')
        ).map(cb => cb.value);

        if (!name) return alert('请输入模型名称');

        const payload = { name, model_type, api_endpoint, api_key, capabilities };

        try {
            const res = await fetch(`${API_BASE}/models`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const json = await res.json();
            if (json.id) {
                this.closeModelModal();
                this.loadModels();
            } else {
                alert('添加失败：' + JSON.stringify(json));
            }
        } catch (e) {
            alert('添加失败：' + e.message);
        }
    },

    async deleteModel(id) {
        if (!confirm('确定删除该模型？')) return;
        try {
            await fetch(`${API_BASE}/models/${id}`, { method: 'DELETE' });
            this.loadModels();
        } catch (e) {
            alert('删除失败：' + e.message);
        }
    },

    // ── 发起评测 ──
    async runEval() {
        const model_id = document.getElementById('eval-model-select').value;
        if (!model_id) return alert('请选择评测模型');

        const dimensions = Array.from(
            document.querySelectorAll('input[name="dimension"]:checked')
        ).map(cb => cb.value);

        if (dimensions.length === 0) return alert('请选择至少一个评测维度');

        const tcSource = document.querySelector('input[name="tc-source"]:checked')?.value || 'builtin';

        // 显示进度条
        const progressDiv = document.getElementById('eval-progress');
        progressDiv.style.display = 'block';
        const fill = document.getElementById('eval-progress-fill');
        const text = document.getElementById('eval-progress-text');
        const liveResults = document.getElementById('eval-live-results');

        fill.style.width = '10%';
        text.textContent = '正在启动评测...';

        try {
            const res = await fetch(`${API_BASE}/eval/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model_id, dimensions, tc_source: tcSource })
            });

            const json = await res.json();

            if (json.report_id) {
                fill.style.width = '100%';
                text.textContent = '✅ 评测完成！';
                currentReportId = json.report_id;
                setTimeout(() => {
                    this.navigate('reports');
                    this.viewReport(json.report_id);
                }, 1000);
            } else {
                text.textContent = '❌ 评测失败：' + JSON.stringify(json);
            }

        } catch (e) {
            text.textContent = '❌ 错误：' + e.message;
        }
    },

    // ── 评测报告 ──
    async loadReports() {
        try {
            const res = await fetch(`${API_BASE}/eval/reports`);
            const json = await res.json();
            const reports = json.data || [];

            const tbody = document.getElementById('all-reports-tbody');
            if (reports.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="empty-state">暂无报告</td></tr>';
                return;
            }

            tbody.innerHTML = reports.map(r => `
                <tr>
                    <td>${r.model_name}</td>
                    <td>${(r.dimensions || []).join(', ')}</td>
                    <td>${r.overall_score || '--'}</td>
                    <td>${r.pass_rate || '--'}%</td>
                    <td><span class="risk-${r.risk_level}">${r.risk_level || '--'}</span></td>
                    <td>${(r.generated_at || '').slice(0, 10)}</td>
                    <td>
                        <button class="btn-link" onclick="App.viewReport('${r.id}')">查看</button>
                        <button class="btn-link" onclick="App.exportReport('${r.id}')">导出</button>
                    </td>
                </tr>
            `).join('');

        } catch (e) {
            console.error('Reports load error:', e);
        }
    },

    async viewReport(reportId) {
        currentReportId = reportId;
        document.getElementById('reports-list-view').style.display = 'none';
        document.getElementById('report-detail').style.display = 'block';

        try {
            const [reportRes, chartRes] = await Promise.all([
                fetch(`${API_BASE}/eval/report/${reportId}`),
                fetch(`${API_BASE}/reports/${reportId}/chart`)
            ]);

            const report = await reportRes.json();
            const charts = await chartRes.json();

            document.getElementById('report-model-name').textContent = report.model_name || '--';
            document.getElementById('report-score-display').textContent = (report.overall_score || '--') + '分';

            // 渲染柱状图
            const barEl = document.getElementById('dim-bar-chart');
            if (barEl && charts.bar_chart) {
                const bar = echarts.init(barEl);
                bar.setOption(charts.bar_chart);
            }

            // 渲染饼图
            const pieEl = document.getElementById('hallucination-pie-chart');
            if (pieEl && charts.pie_chart) {
                const pie = echarts.init(pieEl);
                pie.setOption(charts.pie_chart);
            }

            // 详细表格
            const tbody = document.querySelector('#report-detail-table tbody');
            if (report.results) {
                tbody.innerHTML = report.results.map(r => `
                    <tr>
                        <td>${r.dimension}</td>
                        <td>${r.test_case_id || '--'}</td>
                        <td>${r.score}</td>
                        <td>${r.passed ? '✅' : '❌'}</td>
                        <td>${r.hallucination_detected ? '🔴' : '🟢'}</td>
                        <td><span class="risk-${r.risk_level}">${r.risk_level}</span></td>
                    </tr>
                `).join('');
            }

            // 改进建议
            const recUl = document.getElementById('report-recommendations');
            if (report.recommendations && report.recommendations.length > 0) {
                recUl.innerHTML = report.recommendations.map(r => `<li>${r}</li>`).join('');
            } else {
                recUl.innerHTML = '<li>暂无建议</li>';
            }

        } catch (e) {
            console.error('View report error:', e);
        }
    },

    async exportReport(reportId) {
        const id = reportId || currentReportId;
        if (!id) return;
        window.open(`${API_BASE}/reports/${id}/export`, '_blank');
    },

    // ── 幻觉检测 ──
    async detectHallucination() {
        const text = document.getElementById('h-text').value.trim();
        if (!text) return alert('请输入待检测文本');

        const context = document.getElementById('h-context').value.trim();
        const ground_truth = document.getElementById('h-ground-truth').value.trim();

        const methods = Array.from(
            document.querySelectorAll('#page-hallucination .detection-methods input:checked')
        ).map(cb => cb.value);

        if (methods.length === 0) return alert('请选择至少一种检测方法');

        try {
            const res = await fetch(`${API_BASE}/hallucination/detect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, context, ground_truth, methods })
            });

            const data = await res.json();

            document.getElementById('h-results-placeholder').style.display = 'none';
            const resultsDiv = document.getElementById('h-results');
            resultsDiv.style.display = 'block';

            document.getElementById('h-ensemble-score').textContent = data.ensemble_score || data.score || '--';
            document.getElementById('h-verdict').textContent = data.verdict || '--';

            const methodsDiv = document.getElementById('h-method-results');
            methodsDiv.innerHTML = (data.component_results || []).map(r => `
                <div class="method-result">
                    <div class="method-name">${r.method}</div>
                    <div class="method-score">得分: ${r.score}</div>
                    <div class="method-verdict risk-${r.verdict}">${r.verdict}</div>
                </div>
            `).join('');

        } catch (e) {
            alert('检测失败：' + e.message);
        }
    },

    // ── 测试用例 ──
    async loadTestCases() {
        const dim = document.getElementById('tc-filter-dim')?.value || '';
        const diff = document.getElementById('tc-filter-diff')?.value || '';

        try {
            const params = new URLSearchParams();
            if (dim) params.set('dimension', dim);
            if (diff) params.set('difficulty', diff);

            const res = await fetch(`${API_BASE}/testcases?${params}`);
            const json = await res.json();
            const cases = json.data?.cases || [];

            document.getElementById('tc-count').textContent = `共 ${json.data?.total || 0} 条用例`;

            const container = document.getElementById('tc-list');
            if (cases.length === 0) {
                container.innerHTML = '<div class="empty-state">暂无测试用例</div>';
                return;
            }

            container.innerHTML = cases.map(c => `
                <div class="tc-item">
                    <div class="tc-header">
                        <span class="tc-dim">${c.dimension}</span>
                        <span class="tc-diff ${c.difficulty}">${c.difficulty}</span>
                    </div>
                    <div class="tc-title">${c.title}</div>
                    <div class="tc-desc">${c.description || ''}</div>
                </div>
            `).join('');

        } catch (e) {
            console.error('TestCases load error:', e);
        }
    },

    showTCUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.csv';
        input.onchange = () => {
            if (input.files[0]) this.uploadTCFile(input.files[0]);
        };
        input.click();
    },

    async uploadTCFile(file) {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch(`${API_BASE}/testcases/upload`, { method: 'POST', body: formData });
            const json = await res.json();
            alert(`上传成功：添加 ${json.added || 0} 条用例`);
            this.loadTestCases();
        } catch (e) {
            alert('上传失败：' + e.message);
        }
    },

    downloadTCTemplate() {
        window.open(`${API_BASE}/testcases/template`);
    },

    // ── 设置 ──
    async saveSettings() {
        const openai_key = document.getElementById('api-key-openai')?.value;
        const claude_key = document.getElementById('api-key-claude')?.value;

        localStorage.setItem('ai_test_openai_key', openai_key || '');
        localStorage.setItem('ai_test_claude_key', claude_key || '');
        alert('设置已保存');
    }
};

// ── 测试用例来源切换 ──
document.querySelectorAll('input[name="tc-source"]').forEach(radio => {
    radio.addEventListener('change', () => {
        const upload = document.getElementById('tc-upload-area');
        const manual = document.getElementById('tc-manual-area');
        if (radio.value === 'custom') {
            upload.style.display = 'block';
            manual.style.display = 'none';
        } else if (radio.value === 'manual') {
            upload.style.display = 'none';
            manual.style.display = 'block';
        } else {
            upload.style.display = 'none';
            manual.style.display = 'none';
        }
    });
});

// ── 维度选择高亮 ──
document.querySelectorAll('.dimension-card input').forEach(cb => {
    cb.addEventListener('change', () => {
        cb.closest('.dimension-card').classList.toggle('selected', cb.checked);
    });
});

// ── 初始化 ──
App.loadDashboard();
