import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from graphify.detect import detect, save_manifest
from graphify.extract import extract
from graphify.cache import check_semantic_cache, save_semantic_cache


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "graphify-out"
SPEC = ROOT / ".agents/skills/graphify/references/extraction-spec.md"


def write_json(name, value):
    (OUTPUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")


def read_json(name):
    return json.loads((OUTPUT / name).read_text(encoding="utf-8"))


def prepare():
    OUTPUT.mkdir(exist_ok=True)
    (OUTPUT / ".graphify_python").write_text(sys.executable, encoding="utf-8")
    (OUTPUT / ".graphify_root").write_text(str(ROOT), encoding="utf-8")
    detection = detect(ROOT)
    write_json(".graphify_detect.json", detection)
    ast = extract([Path(value) for value in detection["files"]["code"]], cache_root=ROOT, root=ROOT)
    write_json(".graphify_ast.json", ast)
    documents = [value for kind, values in detection["files"].items() if kind in ("document", "paper", "image") for value in values]
    nodes, edges, hyperedges, uncached = check_semantic_cache(documents, root=ROOT, prompt_file=SPEC)
    write_json(".graphify_cached.json", {"nodes": nodes, "edges": edges, "hyperedges": hyperedges})
    (OUTPUT / ".graphify_uncached.txt").write_text("\n".join(uncached), encoding="utf-8")
    print(json.dumps({"files": {kind: len(values) for kind, values in detection["files"].items()}, "uncached_documents": len(uncached), "ast_nodes": len(ast["nodes"])}))


def build():
    from graphify.build import build_from_json
    from graphify.cluster import cluster, score_all
    from graphify.analyze import god_nodes, surprising_connections, suggest_questions
    from graphify.report import generate
    from graphify.export import to_json
    from graphify.diagnostics import diagnose_extraction, format_diagnostic_report
    from graphify.cli import _stamped_manifest_files

    detection = read_json(".graphify_detect.json")
    ast = read_json(".graphify_ast.json")
    semantic = read_json(".graphify_cached.json")
    uncached = (OUTPUT / ".graphify_uncached.txt").read_text(encoding="utf-8").splitlines()
    if uncached:
        fresh = read_json(".graphify_chunk_01.json")
        for source in uncached:
            expected = len(Path(source).read_text(encoding="utf-8").splitlines())
            if fresh.get("coverage", {}).get(source) != expected:
                raise ValueError(f"Incomplete coverage: {source}")
        save_semantic_cache(fresh["nodes"], fresh["edges"], fresh.get("hyperedges", []), root=ROOT, allowed_source_files=uncached, prompt_file=SPEC)
        for key in ("nodes", "edges", "hyperedges"):
            semantic[key].extend(fresh.get(key, []))
    for key in ("nodes", "edges"):
        for item in semantic[key]:
            item["_origin"] = "semantic"
    merged = {"nodes": list({node["id"]: node for node in ast["nodes"] + semantic["nodes"]}.values()), "edges": ast["edges"] + semantic["edges"], "hyperedges": semantic["hyperedges"]}
    write_json(".graphify_extract.json", merged)
    graph = build_from_json(merged, root=str(ROOT), directed=False)
    if not graph.number_of_nodes():
        raise ValueError("Empty graph")
    communities = cluster(graph)
    labels = {}
    for community, members in communities.items():
        sources = [str(graph.nodes[member].get("source_file", "")) for member in members]
        names = [Path(source).name for source in sources]
        labels[community] = "Workflow: " + max(set(names), key=names.count)
    if not to_json(graph, communities, str(OUTPUT / "graph.json"), community_labels=labels):
        raise ValueError("Graph shrink guard refused replacement")
    questions = suggest_questions(graph, communities, labels)
    report = generate(graph, communities, score_all(graph, communities), labels, god_nodes(graph), surprising_connections(graph, communities), detection, {"input": 0, "output": 0}, str(ROOT), suggested_questions=questions)
    report = "Token accounting: host-agent usage is unavailable; any zero token fields below are placeholders, not measured usage.\n\n" + report
    (OUTPUT / "GRAPH_REPORT.md").write_text(report, encoding="utf-8")
    write_json(".graphify_labels.json", labels)
    diagnostic = diagnose_extraction(merged, directed=False, root=str(ROOT))
    write_json("health.json", diagnostic)
    stamped = _stamped_manifest_files(detection["files"], merged, ROOT)
    corpus = {value for values in detection["files"].values() for value in values}
    save_manifest(stamped, root=ROOT, scan_corpus=corpus)
    write_json("cost.json", {"runs": [{"date": datetime.now(timezone.utc).isoformat(), "input_tokens": None, "output_tokens": None, "files": detection["total_files"]}], "measurement_status": "Host-agent token usage unavailable; no savings measured"})
    print(format_diagnostic_report(diagnostic))
    print(f"Graph: {graph.number_of_nodes()} nodes, {graph.number_of_edges()} edges, {len(communities)} communities")


if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in ("prepare", "build"):
        raise SystemExit("Usage: graphify-project.py prepare|build")
    {"prepare": prepare, "build": build}[sys.argv[1]]()
