# ARC-Shield NLP Service

This directory contains the initial Python API foundation for the ARC-Shield NLP hazard classifier. It currently provides a health check only; it does not load a trained model or implement prediction.

## Run locally (Windows PowerShell)

From the repository root, create and activate a virtual environment, then install the service dependencies:

```powershell
cd nlp-service
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

If PowerShell blocks activation due to the current execution policy, you can invoke the environment's Python directly instead:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Start the development server:

```powershell
python -m uvicorn main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

## Check the API

In another PowerShell window, request the health endpoint:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

It returns a response with `status` set to `ok` and `service` set to `arc-shield-nlp`.

Open the interactive API documentation at:

```text
http://127.0.0.1:8000/docs
```

Stop the server with `Ctrl+C`. To leave the virtual environment, run `deactivate`.
