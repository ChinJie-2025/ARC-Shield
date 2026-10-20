from pathlib import Path

import joblib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "arc_shield_nlp_model.joblib"
MODEL_VERSION = "baseline-v1"

app = FastAPI(
    title="ARC-Shield NLP Service",
    description="API for classifying reported property hazards.",
    version="0.2.0",
)

# Permits local React app to make API requests to Render
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

model = None


@app.on_event("startup")
def load_model():
    """Load the trained classifier when the API starts."""
    global model

    if not MODEL_PATH.is_file():
        raise RuntimeError(
            f"Model file not found: {MODEL_PATH}"
        )

    model = joblib.load(MODEL_PATH)


class ClassificationRequest(BaseModel):
    report_text: str = Field(
        min_length=1,
        max_length=5000,
        description="Description of the reported hazard.",
    )


class ClassificationResponse(BaseModel):
    predicted_category: str
    confidence: float
    model_version: str


@app.get("/health")
def health_check():
    """Check whether the service is running."""
    return {
        "status": "ok",
        "service": "arc-shield-nlp",
    }


@app.post(
    "/classify",
    response_model=ClassificationResponse,
)
def classify_hazard(request: ClassificationRequest):
    """Predict a hazard category and return its confidence."""
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="The classification model is not available.",
        )

    report_text = request.report_text.strip()

    if not report_text:
        raise HTTPException(
            status_code=422,
            detail="Report text must not be blank.",
        )

    probabilities = model.predict_proba([report_text])[0]
    best_index = int(probabilities.argmax())

    return ClassificationResponse(
        predicted_category=str(model.classes_[best_index]),
        confidence=float(probabilities[best_index]),
        model_version=MODEL_VERSION,
    )
