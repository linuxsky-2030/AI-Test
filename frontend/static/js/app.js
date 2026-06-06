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
    async loadModels() {
        try {
            const res = await fetch(`${API_BASE}/models`).catch(() => ({ json: () => ({ data: [] }) }));
            const json = await res.json();
            const models = json.data || [];
            this.renderPopularModels(models);
            const container = document.getElementById('model-cards');
            if (models.length === 0) {
                container.innerHTML = '<div class="empty-state">暂无已配置模型</div>';
            } else {
                container.innerHTML = models.map(m => `<div class="model-card"><div class="model-card-header"><div class="model-name">${m.name}</div><div class="model-type">${m.model_type || 'custom'}</div></div><div class="model-meta">${(m.capabilities || []).map(c => `<span class="cap-tag">${c}</span>`).join('')}</div><div style="display:flex;gap:8px;margin-top:8px;"><button class="btn btn-sm btn-primary" onclick="App.runBenchmarkForModel('${m.id}', '${m.name.replace(/'/g, "\\'")}')" title="一键评测">⚡ 评测</button><button class="btn btn-sm btn-secondary" onclick="App.deleteModel('${m.id}')" title="删除">🗑️</button></div></div>`).join('');
            }
            this.updateEvalModelSelect();
        } catch (e) { console.error('Models error:', e); }
    },

    renderPopularModels(configuredModels) {
        const container = document.getElementById('popular-models-grid');
        const configuredNames = configuredModels.map(m => m.name);
        const providers = {
            'OpenAI': POPULAR_MODELS.filter(m => m.provider === 'OpenAI'),
            'Anthropic': POPULAR_MODELS.filter(m => m.provider === 'Anthropic'),
            'Google': POPULAR_MODELS.filter(m => m.provider === 'Google'),
            'Meta': POPULAR_MODELS.filter(m => m.provider === 'Meta'),
            '阿里云': POPULAR_MODELS.filter(m => m.provider === '阿里云'),
            'DeepSeek': POPULAR_MODELS.filter(m => m.provider === 'DeepSeek'),
            '其他': POPULAR_MODELS.filter(m => !['OpenAI', 'Anthropic', 'Google', 'Meta', '阿里云', 'DeepSeek'].includes(m.provider)),
        };
        let html = '';
        for (const [provider, pModels] of Object.entries(providers)) {
            if (pModels.length === 0) continue;
            html += `<div style="margin-bottom:16px;"><div style="font-size:12px;color:#888;font-weight:500;margin-bottom:8px;">${provider}</div><div style="display:flex;flex-wrap:wrap;gap:8px;">`;
            for (const model of pModels) {
                const isAdded = configuredNames.includes(model.name);
                const encoded = btoa(encodeURIComponent(JSON.stringify(model)));
                html += `<button class="pop-model-btn ${isAdded ? 'added' : ''}" data-model="${encoded}" onclick="App.quickAddModelFromBtn(this)" ${isAdded ? 'disabled' : ''}><span>${model.icon}</span><span>${model.name}</span>${isAdded ? '<span style="font-size:11px;">✓ 已添加</span>' : '<span>+ 添加</span>'}</button>`;
            }
            html += '</div></div>';
        }
        container.innerHTML = html;
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
            const report = await reportRes.json();
            const charts = await chartRes.json();
            document.getElementById('report-model-name').textContent = report.model_name || '--';
            document.getElementById('report-score-display').textContent = (report.overall_score != null ? report.overall_score : '--') + '分';
            document.getElementById('report-total-cases').textContent = report.total_cases || '--';
            document.getElementById('report-passed').textContent = report.passed_cases || '--';
            document.getElementById('report-pass-rate').textContent = (report.pass_rate != null ? report.pass_rate : '--') + '%';
            document.getElementById('report-hallucination').textContent = report.hallucination_avg != null ? report.hallucination_avg.toFixed(3) : '--';
            const barEl = document.getElementById('dim-bar-chart');
            if (barEl && charts.bar_chart) { const bar = echarts.init(barEl); bar.setOption(charts.bar_chart); }
            const pieEl = document.getElementById('hallucination-pie-chart');
            if (pieEl && charts.pie_chart) { const pie = echarts.init(pieEl); pie.setOption(charts.pie_chart); }
            const tbody = document.querySelector('#report-detail-table tbody');
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
    showModelModal(prefill) {
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

    closeModelModal() { document.getElementById('model-modal').style.display = 'none'; },

    async saveModel() {
        const name = document.getElementById('m-name').value.trim();
        if (!name) return alert('请输入模型名称');
        const capabilities = Array.from(document.querySelectorAll('#model-modal .capability-checkboxes input:checked')).map(cb => cb.value);
        const payload = { name, model_type: document.getElementById('m-type').value, api_endpoint: document.getElementById('m-endpoint').value.trim(), api_key: document.getElementById('m-apikey').value.trim(), capabilities };
        try {
            const res = await fetch(`${API_BASE}/models`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const json = await res.json();
            if (json.id || json.success) { this.closeModelModal(); this.loadModels(); }
            else { alert('添加失败：' + JSON.stringify(json)); }
        } catch (e) { alert('添加失败：' + e.message); }
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