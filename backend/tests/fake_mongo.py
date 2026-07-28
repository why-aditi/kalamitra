"""A deliberately tiny in-memory stand-in for Motor.

Supports only the query features the payment paths use: equality, $in, $ne,
$or, dotted paths, plus $set updates. It is not a Mongo emulator - if a test
needs something it does not implement, implement it explicitly rather than
guessing.
"""

import copy
from typing import Any, Dict, List

from bson import ObjectId


def _get_path(doc: dict, path: str):
    current: Any = doc
    for part in path.split("."):
        if isinstance(current, list):
            return [
                item.get(part) for item in current if isinstance(item, dict) and part in item
            ]
        if not isinstance(current, dict) or part not in current:
            return None
        current = current[part]
    return current


def _match_condition(value: Any, condition: Any) -> bool:
    if isinstance(condition, dict) and any(k.startswith("$") for k in condition):
        for op, operand in condition.items():
            if op == "$in":
                if isinstance(value, list):
                    if not any(v in operand for v in value):
                        return False
                elif value not in operand:
                    return False
            elif op == "$ne":
                if value == operand:
                    return False
            elif op == "$gte":
                if value is None or value < operand:
                    return False
            elif op == "$lte":
                if value is None or value > operand:
                    return False
            else:
                raise NotImplementedError(f"FakeMongo: operator {op} not implemented")
        return True
    if isinstance(value, list):
        return condition in value
    return value == condition


def matches(doc: dict, query: dict) -> bool:
    for key, condition in query.items():
        if key == "$or":
            if not any(matches(doc, sub) for sub in condition):
                return False
        elif key == "$and":
            if not all(matches(doc, sub) for sub in condition):
                return False
        else:
            if not _match_condition(_get_path(doc, key), condition):
                return False
    return True


class _Cursor:
    def __init__(self, docs: List[dict]):
        self._docs = docs

    def sort(self, *args, **kwargs):
        return self

    def skip(self, n):
        self._docs = self._docs[n:]
        return self

    def limit(self, n):
        self._docs = self._docs[:n]
        return self

    async def to_list(self, length=None):
        return self._docs if length is None else self._docs[:length]

    def __aiter__(self):
        async def gen():
            for doc in self._docs:
                yield doc

        return gen()


class _Result:
    def __init__(self, matched_count=0, modified_count=0, deleted_count=0, inserted_id=None):
        self.matched_count = matched_count
        self.modified_count = modified_count
        self.deleted_count = deleted_count
        self.inserted_id = inserted_id


class FakeCollection:
    def __init__(self, name: str):
        self.name = name
        self.docs: List[Dict[str, Any]] = []

    # --- reads ------------------------------------------------------------ #
    def find(self, query=None, projection=None):
        return _Cursor([copy.deepcopy(d) for d in self.docs if matches(d, query or {})])

    async def find_one(self, query=None, projection=None):
        for doc in self.docs:
            if matches(doc, query or {}):
                return copy.deepcopy(doc)
        return None

    async def count_documents(self, query=None):
        return len([d for d in self.docs if matches(d, query or {})])

    # --- writes ----------------------------------------------------------- #
    async def insert_one(self, doc):
        stored = copy.deepcopy(doc)
        stored.setdefault("_id", ObjectId())
        self.docs.append(stored)
        return _Result(inserted_id=stored["_id"])

    async def insert_many(self, docs):
        ids = []
        for doc in docs:
            result = await self.insert_one(doc)
            ids.append(result.inserted_id)
        return _Result(inserted_id=ids)

    async def update_one(self, query, update):
        for doc in self.docs:
            if matches(doc, query):
                doc.update(update.get("$set", {}))
                for key, value in update.get("$push", {}).items():
                    doc.setdefault(key, []).append(value)
                return _Result(matched_count=1, modified_count=1)
        return _Result()

    async def update_many(self, query, update):
        n = 0
        for doc in self.docs:
            if matches(doc, query):
                doc.update(update.get("$set", {}))
                n += 1
        return _Result(matched_count=n, modified_count=n)

    async def find_one_and_update(self, query, update, **kwargs):
        await self.update_one(query, update)
        return await self.find_one(query)

    async def delete_one(self, query):
        for i, doc in enumerate(self.docs):
            if matches(doc, query):
                self.docs.pop(i)
                return _Result(deleted_count=1)
        return _Result()

    async def create_index(self, *args, **kwargs):
        return "ok"

    # --- aggregation (only the stages GET /listings uses) ----------------- #
    def aggregate(self, pipeline):
        docs = [copy.deepcopy(d) for d in self.docs]
        for stage in pipeline:
            (name, spec), = stage.items()
            if name == "$match":
                docs = [d for d in docs if matches(d, spec)]
            elif name == "$sort":
                for key, direction in reversed(list(spec.items())):
                    docs.sort(key=lambda d: d.get(key) or 0, reverse=direction < 0)
            elif name == "$skip":
                docs = docs[spec:]
            elif name == "$limit":
                docs = docs[:spec]
            elif name == "$project":
                docs = [_project(d, spec) for d in docs]
            else:
                raise NotImplementedError(f"FakeMongo: stage {name} not implemented")
        return _Cursor(docs)


def _eval_expr(doc: dict, expr):
    """Evaluate the handful of aggregation expressions the project stage uses."""
    if isinstance(expr, str) and expr.startswith("$"):
        return _get_path(doc, expr[1:])
    if not isinstance(expr, dict):
        return expr
    (op, args), = expr.items()
    if op == "$ifNull":
        value = _eval_expr(doc, args[0])
        return _eval_expr(doc, args[1]) if value is None else value
    if op == "$substrCP":
        value = _eval_expr(doc, args[0]) or ""
        start, length = args[1], args[2]
        return str(value)[start : start + length]
    if op == "$size":
        value = _eval_expr(doc, args)
        return len(value or [])
    if op == "$avg":
        values = [v for v in (_eval_expr(doc, args) or []) if isinstance(v, (int, float))]
        return sum(values) / len(values) if values else None
    raise NotImplementedError(f"FakeMongo: expression {op} not implemented")


def _project(doc: dict, spec: dict) -> dict:
    out = {"_id": doc["_id"]}
    for key, value in spec.items():
        if key == "_id":
            if not value:
                out.pop("_id", None)
            continue
        if value in (1, True):
            if key in doc:
                out[key] = doc[key]
        else:
            out[key] = _eval_expr(doc, value)
    return out


class FakeDB:
    def __init__(self):
        self._collections: Dict[str, FakeCollection] = {}

    def get_collection(self, name: str) -> FakeCollection:
        if name not in self._collections:
            self._collections[name] = FakeCollection(name)
        return self._collections[name]

    def __getitem__(self, name: str) -> FakeCollection:
        return self.get_collection(name)

    def __getattr__(self, name: str) -> FakeCollection:
        if name.startswith("_"):
            raise AttributeError(name)
        return self.get_collection(name)
