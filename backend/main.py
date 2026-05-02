# backend/main.py — FastAPI service backing the VectorShift pipeline builder.
# Run: source .venv/bin/activate && uvicorn main:app --reload

from collections import defaultdict, deque
from typing import Any, Dict, List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=False,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["Content-Type"],
)


class NodeItem(BaseModel):
    id: str
    type: str
    data: Optional[Dict[str, Any]] = None


class EdgeItem(BaseModel):
    source: str
    target: str


class PipelinePayload(BaseModel):
    nodes: List[NodeItem]
    edges: List[EdgeItem]


class ParseResponse(BaseModel):
    num_nodes: int
    num_edges: int
    is_dag: bool


def _is_dag(nodes: List[NodeItem], edges: List[EdgeItem]) -> bool:
    if not nodes:
        return True

    node_ids = {n.id for n in nodes}
    adj: Dict[str, List[str]] = defaultdict(list)
    in_degree: Dict[str, int] = {nid: 0 for nid in node_ids}

    for e in edges:
        if e.source in node_ids and e.target in node_ids:
            adj[e.source].append(e.target)
            in_degree[e.target] += 1

    queue = deque(nid for nid, deg in in_degree.items() if deg == 0)
    processed = 0
    while queue:
        nid = queue.popleft()
        processed += 1
        for neighbor in adj[nid]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return processed == len(node_ids)


@app.get("/")
def read_root():
    return {"Ping": "Pong"}


@app.post("/pipelines/parse", response_model=ParseResponse)
def parse_pipeline(payload: PipelinePayload):
    return ParseResponse(
        num_nodes=len(payload.nodes),
        num_edges=len(payload.edges),
        is_dag=_is_dag(payload.nodes, payload.edges),
    )
