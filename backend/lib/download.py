from huggingface_hub import snapshot_download

snapshot_download(
    repo_id="PrunaAI/prometheus-eval-prometheus-7b-v2.0-HQQ-1bit-smashed",
    local_dir="./prometheus_model"   # <-- just this
)