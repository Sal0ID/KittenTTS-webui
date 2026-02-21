import os
import uuid
import tempfile

import soundfile as sf
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from kittentts import KittenTTS

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5072"],
    allow_methods=["*"],
    allow_headers=["*"],
)

AVAILABLE_MODELS = [
    "KittenML/kitten-tts-mini-0.8",
    "KittenML/kitten-tts-micro-0.8",
    "KittenML/kitten-tts-nano-0.8",
    "KittenML/kitten-tts-nano-0.8-int8",
]

AVAILABLE_VOICES = ["Bella", "Jasper", "Luna", "Bruno", "Rosie", "Hugo", "Kiki", "Leo"]

# Cache loaded models to avoid reloading on every request
_model_cache: dict[str, KittenTTS] = {}


def get_model(model_name: str) -> KittenTTS:
    if model_name not in _model_cache:
        _model_cache[model_name] = KittenTTS(model_name)
    return _model_cache[model_name]


@app.get("/models")
def list_models():
    return {"models": AVAILABLE_MODELS}


@app.get("/voices")
def list_voices():
    return {"voices": AVAILABLE_VOICES}


@app.get("/tts")
def text_to_speech(
    text: str = Query(..., description="Text to synthesize"),
    voice: str = Query("Jasper", description="Voice name"),
    model: str = Query("KittenML/kitten-tts-mini-0.8", description="Model name"),
):
    if model not in AVAILABLE_MODELS:
        raise HTTPException(status_code=400, detail=f"Unknown model: {model}")
    if voice not in AVAILABLE_VOICES:
        raise HTTPException(status_code=400, detail=f"Unknown voice: {voice}")

    m = get_model(model)
    audio = m.generate(text, voice=voice)

    tmp_dir = tempfile.gettempdir()
    filename = f"tts_{uuid.uuid4().hex}.wav"
    filepath = os.path.join(tmp_dir, filename)
    sf.write(filepath, audio, 24000)

    return FileResponse(
        filepath,
        media_type="audio/wav",
        filename="output.wav",
        background=_cleanup_task(filepath),
    )


def _cleanup_task(filepath: str):
    """Return a Starlette BackgroundTask that deletes the file after response is sent."""
    from starlette.background import BackgroundTask

    def delete_file():
        try:
            os.remove(filepath)
        except OSError:
            pass

    return BackgroundTask(delete_file)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=5073)
