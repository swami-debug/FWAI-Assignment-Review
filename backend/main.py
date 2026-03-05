import os
import re
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Assignment Review API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class ReviewRequest(BaseModel):
    google_docs_url: str

def extract_doc_id(url: str):
    """Extracts the document ID from a Google Docs URL."""
    match = re.search(r"/d/([a-zA-Z0-9-_]+)", url)
    if not match:
        raise HTTPException(status_code=400, detail="Invalid Google Docs URL")
    return match.group(1)

def fetch_doc_content(doc_id: str):
    """Fetches text content from a Google Doc using the export URL."""
    export_url = f"https://docs.google.com/document/d/{doc_id}/export?format=txt"
    try:
        response = requests.get(export_url)
        response.raise_for_status()
        return response.text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch document: {str(e)}")

@app.post("/review")
async def review_assignment(request: ReviewRequest):
    doc_id = extract_doc_id(request.google_docs_url)
    content = fetch_doc_content(doc_id)
    
    if not content.strip():
        raise HTTPException(status_code=400, detail="Document is empty")

    prompt = f"""
    You are an expert academic reviewer. Review the following assignment content and provide feedback in the following format:
    
    Strengths:
    [List the key strengths of the assignment]
    
    Improvements:
    [List areas where the student can improve]
    
    Score: [X]/10
    
    Assignment Content:
    {content[:10000]}  # Truncate to avoid token limits if necessary
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful academic assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
        )
        
        full_review = response.choices[0].message.content
        
        # Simple parsing logic
        strengths = ""
        improvements = ""
        score = "0/10"
        summary = ""
        
        sections = re.split(r"(Strengths:|Improvements:|Score:)", full_review)
        for i in range(1, len(sections), 2):
            label = sections[i].strip()
            text = sections[i+1].strip() if i+1 < len(sections) else ""
            if label == "Strengths:":
                strengths = text
            elif label == "Improvements:":
                improvements = text
            elif label == "Score:":
                # Extract only the numeric part (e.g., 6/10)
                # Look for digits/digits pattern
                score_match = re.search(r"(\d+[\s\-/]*\d+)", text)
                if score_match:
                    score = score_match.group(1).strip()
                    # The rest of the text in the score section becomes the summary
                    # Remove the score part and any leading punctuation/formatting
                    remaining = text.replace(score, "").strip()
                    summary = re.sub(r"^[* \-\/\:]+", "", remaining).strip()
                else:
                    score = text.split('\n')[0].strip()
                    summary = "\n".join(text.split('\n')[1:]).strip()

        return {
            "strengths": strengths.strip(),
            "improvements": improvements.strip(),
            "score": score,
            "summary": summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Review failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Respect PORT environment variable for deployment (default to 8000 for local dev)
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
