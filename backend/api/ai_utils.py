import os
import google.generativeai as genai
from PyPDF2 import PdfReader
from django.conf import settings
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def get_gemini_response(prompt, context=None):
    if not GEMINI_API_KEY:
        return None

    try:
        model = genai.GenerativeModel('gemini-flash-latest')

        full_prompt = prompt
        if context:
            full_prompt = f"Context: {context}\n\nUser Question: {prompt}"

        response = model.generate_content(full_prompt)
        return response.text
    except Exception as e:
        error_str = str(e)
        print(f"Gemini Error: {error_str}")
        # Return None so callers can implement fallback logic
        return None

def extract_text_from_pdf(pdf_file):
    try:
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        print(f"PDF Extraction Error: {e}")
        return None

def summarize_text(text):
    prompt = f"Please provide a concise and clear summary of the following text, highlighting key points and main takeaways:\n\n{text}"
    return get_gemini_response(prompt)

def get_recommendations(user_data):
    prompt = f"""
    Based on the following student profile, recommend 3 courses, 2 practice tests, and 1 interview preparation tip:
    Profile: {user_data}
    
    Format the response in clear Markdown with headings.
    """
    return get_gemini_response(prompt)
