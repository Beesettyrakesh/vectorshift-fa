# backend/main.py — FastAPI service backing the VectorShift pipeline builder.
# Run: source .venv/bin/activate && uvicorn main:app --reload

from collections import defaultdict, deque
from typing import Any, Dict, List, Optional, Set, Tuple

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
    # Stretch goal (Req 7.8, 7.9): ids of nodes participating in ≥1 cycle,
    # and edges whose source AND target both belong to the same cycle SCC.
    # Both default to [] when the pipeline is a DAG (Req 7.9).
    cycle_nodes: List[str] = []
    cycle_edges: List[EdgeItem] = []


def _build_adjacency(
    nodes: List[NodeItem], edges: List[EdgeItem]
) -> Tuple[Set[str], Dict[str, List[str]], int]:
    """
    Return (valid node id set, adjacency list, validated edge count).

    Edges that reference non-existent node IDs are silently dropped.
    Duplicate source→target pairs are deduplicated so they don't inflate
    in_degree counts in Kahn's algorithm or num_edges in the response.
    """
    node_ids = {n.id for n in nodes}
    adj: Dict[str, List[str]] = defaultdict(list)
    seen: Set[Tuple[str, str]] = set()
    for e in edges:
        if e.source in node_ids and e.target in node_ids:
            pair = (e.source, e.target)
            if pair not in seen:
                seen.add(pair)
                adj[e.source].append(e.target)
    return node_ids, adj, len(seen)


def _is_dag(node_ids: Set[str], adj: Dict[str, List[str]]) -> bool:
    """Kahn's algorithm: true iff every node is processed in topo order."""
    if not node_ids:
        return True

    in_degree: Dict[str, int] = {nid: 0 for nid in node_ids}
    for src, targets in adj.items():
        for tgt in targets:
            in_degree[tgt] += 1

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


def _find_cycle_members(
    node_ids: Set[str], adj: Dict[str, List[str]]
) -> Tuple[Set[str], Dict[str, int]]:
    """
    Tarjan's strongly-connected-components (SCC), iterative to avoid Python
    recursion limits on large graphs.

    Returns:
      - cycle_members: ids of nodes that belong to a cycle. A node is in a
        cycle iff it belongs to an SCC of size ≥ 2, OR it belongs to a
        singleton SCC with a self-loop (edge from itself to itself).
      - scc_of: map node_id → scc index (only populated for cycle members).
        Used to test whether both endpoints of an edge are in the SAME cycle.
    """
    index_counter = [0]
    stack: List[str] = []
    on_stack: Set[str] = set()
    indices: Dict[str, int] = {}
    lowlinks: Dict[str, int] = {}
    sccs: List[List[str]] = []

    for start in node_ids:
        if start in indices:
            continue
        # Iterative DFS simulating the recursive strongconnect().
        # work stack frames: (node, neighbor_iterator, parent_for_lowlink_update)
        work: List[Tuple[str, Any]] = []
        indices[start] = index_counter[0]
        lowlinks[start] = index_counter[0]
        index_counter[0] += 1
        stack.append(start)
        on_stack.add(start)
        work.append((start, iter(adj.get(start, []))))

        while work:
            node, neighbors = work[-1]
            advanced = False
            for nb in neighbors:
                if nb not in indices:
                    indices[nb] = index_counter[0]
                    lowlinks[nb] = index_counter[0]
                    index_counter[0] += 1
                    stack.append(nb)
                    on_stack.add(nb)
                    work.append((nb, iter(adj.get(nb, []))))
                    advanced = True
                    break
                elif nb in on_stack:
                    lowlinks[node] = min(lowlinks[node], indices[nb])
            if advanced:
                continue
            # Finished exploring `node`.
            if lowlinks[node] == indices[node]:
                scc: List[str] = []
                while True:
                    w = stack.pop()
                    on_stack.discard(w)
                    scc.append(w)
                    if w == node:
                        break
                sccs.append(scc)
            work.pop()
            if work:
                parent = work[-1][0]
                lowlinks[parent] = min(lowlinks[parent], lowlinks[node])

    # Classify SCCs: cycle = size ≥ 2, OR singleton with a self-loop.
    cycle_members: Set[str] = set()
    scc_of: Dict[str, int] = {}
    for idx, scc in enumerate(sccs):
        if len(scc) >= 2:
            for nid in scc:
                cycle_members.add(nid)
                scc_of[nid] = idx
        else:
            nid = scc[0]
            if nid in adj.get(nid, []):  # self-loop
                cycle_members.add(nid)
                scc_of[nid] = idx
    return cycle_members, scc_of


def _find_cycle_edges(
    edges: List[EdgeItem], scc_of: Dict[str, int]
) -> List[EdgeItem]:
    """Edges whose source AND target are in the SAME cycle SCC."""
    result: List[EdgeItem] = []
    for e in edges:
        s_scc = scc_of.get(e.source)
        t_scc = scc_of.get(e.target)
        if s_scc is not None and s_scc == t_scc:
            result.append(EdgeItem(source=e.source, target=e.target))
    return result


@app.get("/")
def read_root():
    return {"Ping": "Pong"}


@app.post("/pipelines/parse", response_model=ParseResponse)
def parse_pipeline(payload: PipelinePayload):
    # num_edges reflects validated, deduplicated edges — not raw payload count.
    node_ids, adj, num_edges = _build_adjacency(payload.nodes, payload.edges)
    is_dag = _is_dag(node_ids, adj)

    if is_dag:
        return ParseResponse(
            num_nodes=len(payload.nodes),
            num_edges=num_edges,
            is_dag=True,
            cycle_nodes=[],
            cycle_edges=[],
        )

    cycle_members, scc_of = _find_cycle_members(node_ids, adj)
    cycle_edges = _find_cycle_edges(payload.edges, scc_of)

    return ParseResponse(
        num_nodes=len(payload.nodes),
        num_edges=num_edges,
        is_dag=False,
        cycle_nodes=sorted(cycle_members),
        cycle_edges=cycle_edges,
    )
