from fastapi import FastAPI


app = FastAPI(
    title="ARC-Shield NLP Service",
    description="API foundation for the ARC-Shield NLP hazard classifier.",
    version="0.1.0",
)


@app.get("/health")
def health_check():
    """Return a simple status response to confirm the API is running."""
    return {"status": "ok", "service": "arc-shield-nlp"}
