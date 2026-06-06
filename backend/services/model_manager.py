"""
模型配置管理器
- 管理多个模型配置（增删改查）
- 支持 JSON 配置文件导入导出
- 存储路径：data/configs/
"""

import os
import json
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional

CONFIGS_DIR = Path(__file__).parent.parent.parent / "data" / "configs"
CONFIGS_DIR.mkdir(parents=True, exist_ok=True)

MODELS_FILE = CONFIGS_DIR / "models.json"


class ModelManager:
    """模型配置管理器"""

    def __init__(self):
        self.models: List[Dict] = self._load_models()

    def _load_models(self) -> List[Dict]:
        if MODELS_FILE.exists():
            try:
                with open(MODELS_FILE, encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return []
        return []

    def _save_models(self):
        with open(MODELS_FILE, "w", encoding="utf-8") as f:
            json.dump(self.models, f, ensure_ascii=False, indent=2)

    def list_models(self) -> List[Dict]:
        """列出所有模型（隐藏 api_key）"""
        result = []
        for m in self.models:
            safe = {k: v for k, v in m.items() if k != "api_key"}
            safe["has_api_key"] = bool(m.get("api_key"))
            result.append(safe)
        return result

    def get_model(self, model_id: str) -> Optional[Dict]:
        for m in self.models:
            if m.get("id") == model_id:
                safe = {k: v for k, v in m.items() if k != "api_key"}
                safe["has_api_key"] = bool(m.get("api_key"))
                return safe
        return None

    def add_model(self, data: Dict) -> Dict:
        """添加模型"""
        if "id" not in data:
            data["id"] = f"model_{uuid.uuid4().hex[:8]}"
        data["created_at"] = __import__("datetime").datetime.now().isoformat()
        self.models.append(data)
        self._save_models()
        return self.get_model(data["id"])

    def update_model(self, model_id: str, data: Dict) -> Optional[Dict]:
        """更新模型"""
        for i, m in enumerate(self.models):
            if m.get("id") == model_id:
                # 不允许覆盖 id
                data.pop("id", None)
                self.models[i].update(data)
                self._save_models()
                return self.get_model(model_id)
        return None

    def delete_model(self, model_id: str) -> bool:
        """删除模型"""
        for i, m in enumerate(self.models):
            if m.get("id") == model_id:
                self.models.pop(i)
                self._save_models()
                return True
        return False

    def export_config(self, model_id: str = None) -> Dict:
        """导出配置"""
        if model_id:
            for m in self.models:
                if m.get("id") == model_id:
                    return m
            return {}
        return {"models": self.list_models(), "exported_at": __import__("datetime").datetime.now().isoformat()}

    def import_config(self, data: Dict, overwrite: bool = False) -> Dict:
        """导入配置"""
        if "models" in data:
            # 批量导入
            added = 0
            for m in data["models"]:
                if overwrite:
                    existing = self.get_model(m.get("id", ""))
                    if existing:
                        self.update_model(m["id"], m)
                    else:
                        self.add_model(m)
                        added += 1
                else:
                    self.add_model(m)
                    added += 1
            return {"added": added, "total": len(self.models)}

        elif "id" in data:
            # 单个导入
            existing = self.get_model(data.get("id", ""))
            if existing and not overwrite:
                return {"error": "Model already exists, use overwrite=true to replace"}
            model = self.add_model(data) if not existing else self.update_model(data["id"], data)
            return model

        return {"error": "Invalid format"}
