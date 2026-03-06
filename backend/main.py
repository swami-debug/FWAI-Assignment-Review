import os
import io
import json
import logging
import re
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Assignment Review API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

api_key = os.getenv("OPENAI_API_KEY")
client = None

if not api_key:
    logger.error("❌ CRITICAL: OPENAI_API_KEY is not set. AI features will fail.")
else:
    try:
        client = OpenAI(api_key=api_key)
        logger.info("✅ OpenAI client initialized successfully.")
    except Exception as e:
        logger.error(f"❌ Failed to initialize OpenAI client: {e}")

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB limit
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}


def extract_text_from_txt(content: bytes) -> str:
    return content.decode("utf-8", errors="ignore")


def extract_text_from_pdf(content: bytes) -> str:
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(content))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text
    except ImportError:
        raise HTTPException(status_code=500, detail="PDF support requires 'pypdf'. Install it via pip.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {str(e)}")


def extract_text_from_docx(content: bytes) -> str:
    try:
        import docx
        doc = docx.Document(io.BytesIO(content))
        return "\n".join([para.text for para in doc.paragraphs])
    except ImportError:
        raise HTTPException(status_code=500, detail="DOCX support requires 'python-docx'. Install it via pip.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse DOCX: {str(e)}")


@app.post("/review")
async def review_assignment(file: UploadFile = File(...)):
    if not client:
        raise HTTPException(
            status_code=500,
            detail="AI Service is currently unavailable. Please ensure the OPENAI_API_KEY is configured."
        )

    # Validate file extension
    filename = file.filename or ""
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported File Type: '{ext}'. Please upload a .pdf, .docx, or .txt file."
        )

    # Read file content
    content_bytes = await file.read()

    # Validate file size
    if len(content_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum allowed size is 5 MB."
        )

    # Extract text based on file type
    if ext == ".txt":
        text = extract_text_from_txt(content_bytes)
    elif ext == ".pdf":
        text = extract_text_from_pdf(content_bytes)
    elif ext == ".docx":
        text = extract_text_from_docx(content_bytes)
    else:
        raise HTTPException(status_code=400, detail="Unsupported File Type")

    if not text.strip():
        raise HTTPException(status_code=400, detail="Document appears to be empty or could not be parsed.")

    # Truncate to avoid excessive token usage
    text_for_ai = text[:12000]

    prompt = f"""You are an expert academic reviewer and educator. Analyze the following assignment content thoroughly and produce a structured JSON report.

Return ONLY valid JSON (no markdown, no extra text) with this exact structure:
{{
  "score": "X/10",
  "summary": "2-3 sentence summary of what the assignment is about",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weak_areas": ["weakness 1", "weakness 2"],
  "concept_understanding": "paragraph evaluating how well concepts are understood",
  "structure_clarity": "paragraph evaluating structure and clarity of the assignment",
  "grammar_writing_quality": "paragraph evaluating grammar and writing quality",
  "suggestions_for_improvement": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "improved_version_suggestions": "paragraph with specific rewriting/restructuring suggestions to make this assignment excellent"
}}

Assignment Content:
{text_for_ai}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an expert academic reviewer. Always return valid JSON only, with no markdown fences or extra text."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
        )

        raw = response.choices[0].message.content.strip()

        # Strip markdown fences if model wrapped in them
        raw = re.sub(r"^```json\s*", "", raw)
        raw = re.sub(r"^```\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

        report = json.loads(raw)

        return {
            "filename": filename,
            "score": report.get("score", "N/A"),
            "summary": report.get("summary", ""),
            "strengths": report.get("strengths", []),
            "weak_areas": report.get("weak_areas", []),
            "concept_understanding": report.get("concept_understanding", ""),
            "structure_clarity": report.get("structure_clarity", ""),
            "grammar_writing_quality": report.get("grammar_writing_quality", ""),
            "suggestions_for_improvement": report.get("suggestions_for_improvement", []),
            "improved_version_suggestions": report.get("improved_version_suggestions", ""),
        }

    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}. Raw response: {raw}")
        raise HTTPException(status_code=500, detail="Failed to analyze document: AI returned an unexpected response format.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze document: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
