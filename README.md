# KittenTTS-webui

Simple open source dockerized webui for testing [KittenTTS](https://github.com/KittenML/KittenTTS) models - ultra-compact, CPU-optimized text-to-speech.

## Run via Docker 
```
docker run -p 5072:5072 sal0id/kittentts-webui
```
**Then go to http://localhost:5072**

## Build from source
```
git clone https://github.com/Sal0ID/KittenTTS-webui.git
cd KittenTTS-webui
docker build -t kittentts-webui .
docker run -p 5072:5072 kittentts-webui
```
**Then go to http://localhost:5072**

## Screenshot
![link goes here]

## Tech stack
- **Frontend**: Next.js 16 (Tailwind CSS)
- **Backend**: Python 3.12 (FastAPI, ONNX Runtime)
- **Deployment**: Single Docker image, ~1.5GB (all 4 models pre-cached)

## Supported models
- kitten-tts-mini
- kitten-tts-micro
- kitten-tts-nano
- kitten-tts-nano-0.8-int8

## Supported voices
- Bella
- Jasper
- Luna
- Bruno
- Rosie
- Hugo
- Kiki
- Leo

