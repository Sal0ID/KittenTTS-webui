"""Pre-download all KittenTTS model weights into the HuggingFace cache."""

from huggingface_hub import snapshot_download

MODELS = [
    "KittenML/kitten-tts-mini-0.8",
    "KittenML/kitten-tts-micro-0.8",
    "KittenML/kitten-tts-nano-0.8",
    "KittenML/kitten-tts-nano-0.8-int8",
]

for model in MODELS:
    print(f"Downloading {model} ...")
    snapshot_download(repo_id=model)
    print(f"  Done: {model}")

print("All models pre-cached.")
