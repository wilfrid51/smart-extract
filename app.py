from flask import Flask, request, jsonify, render_template, send_file
from werkzeug.utils import secure_filename
import os
import google.generativeai as genai
from PIL import Image
import PyPDF2
from fpdf import FPDF
from datetime import datetime
from io import BytesIO
import time
import re
import os

load_dotenv()
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024
app.config['ALLOWED_EXTENSIONS'] = {'pdf', 'png', 'jpg', 'jpeg'}

os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

class UnicodePDF(FPDF):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Use built-in font instead of external TTF to avoid file not found errors
        self.add_font('courier', '', 'cour.ttf', uni=True)
        self.add_font('courier', 'B', 'courbd.ttf', uni=True)
    
    def header(self):
        self.set_font('courier', 'B', 12)
        self.cell(0, 10, 'Document Translation', 0, 1, 'C')
    
    def footer(self):
        self.set_y(-15)
        self.set_font('courier', '', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def extract_text_with_gemini(filepath, is_image=False):
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    extraction_prompt = """
    Extract ALL text content from this document with maximum accuracy:
    1. Preserve all formatting including:
       - Line breaks and paragraphs
       - Bullet points and numbering
       - Section headings and document structure
    2. Include ALL text elements:
       - Body text
       - Headers/footers
       - Captions
       - Inscriptions (even on rocks or irregular surfaces)
       - Handwritten notes (if legible)
    3. For accuracy:
       - Mark uncertain characters with [?]
       - Maintain original spacing
       - Don't correct or modify original text
    4. Accuracy assessment:
       - Estimate confidence percentage for the extraction
       - Note any challenging areas
    
    Return in this format:
    [Accuracy: XX%]
    Extracted Text:
    [The complete extracted text here]
    """
    
    if is_image:
        img = Image.open(filepath)
        response = model.generate_content([extraction_prompt, img])
    else:
        with open(filepath, 'rb') as f:
            response = model.generate_content([extraction_prompt, f.read()])
    
    return response.text

def parse_extracted_text(full_text):
    # Parse accuracy and text from Gemini response
    accuracy = 100
    text = full_text
    
    accuracy_match = re.search(r'\[Accuracy:\s*(\d+)%\]', full_text)
    if accuracy_match:
        accuracy = int(accuracy_match.group(1))
        text = full_text.replace(accuracy_match.group(0), '').strip()
    
    # Remove any remaining metadata markers
    text = re.sub(r'^Extracted Text:\s*', '', text, flags=re.IGNORECASE)
    
    return {
        'accuracy': accuracy,
        'text': text.strip()
    }

def correct_extracted_text(text):
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    correction_prompt = f"""
    Review this extracted text and:
    1. Fix obvious OCR errors while preserving meaning
    2. Maintain original formatting exactly
    3. Don't modify proper nouns or technical terms
    4. Preserve all special characters
    
    Text to correct:
    {text}
    """
    
    response = model.generate_content(correction_prompt)
    return response.text

def translate_text(text, target_language="English"):
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    translation_prompt = f"""
    Translate this to {target_language} while:
    1. Preserving all formatting (line breaks, paragraphs, etc.)
    2. Maintaining bullet points and numbering
    3. Keeping section structure
    4. Not translating proper nouns unless standard translation exists
    
    Only return the translated text:
    
    {text}
    """
    
    response = model.generate_content(translation_prompt)
    return response.text

def explain_text(text):
    model = genai.GenerativeModel('gemini-2.0-flash')

    explanation_prompt = f"""
Provide a detailed explanation of the following text with the following guidelines:
1. Summarize key points clearly.
2. Explain any technical terms in simple language.
3. Highlight important details.
4. Identify any unclear or ambiguous sections.
5. Do NOT use asterisks (*), markdown, or special formatting symbols. Use plain text only.

Text:
{text}
    """

    response = model.generate_content(explanation_prompt)
    return response.text

def text_to_pdf(text):
    pdf = UnicodePDF()
    pdf.add_page()
    pdf.set_font('courier', '', 10)
    
    # Handle different line endings and empty lines
    lines = text.replace('\r\n', '\n').replace('\r', '\n').split('\n')
    
    for line in lines:
        if line.strip():  # Only process non-empty lines
            try:
                # Handle encoding and special characters
                encoded_line = line.encode('latin-1', 'replace').decode('latin-1')
                pdf.multi_cell(0, 5, txt=encoded_line)
                pdf.ln(4)
            except Exception as e:
                print(f"Error processing line: {line} - {str(e)}")
                continue
    
    pdf_output = BytesIO()
    pdf.output(pdf_output)
    pdf_output.seek(0)
    return pdf_output

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            is_image = file.filename.lower().endswith(('.png', '.jpg', '.jpeg'))
            raw_extracted_text = extract_text_with_gemini(filepath, is_image)
            parsed_data = parse_extracted_text(raw_extracted_text)
            corrected_text = correct_extracted_text(parsed_data['text'])
            
            return jsonify({
                'success': True,
                'extracted_text': corrected_text,
                'accuracy': parsed_data['accuracy'],
                'filename': filename
            })
        except Exception as e:
            return jsonify({'error': f'Error processing file: {str(e)}'}), 500
        finally:
            try:
                os.remove(filepath)
            except:
                pass
    else:
        return jsonify({'error': 'File type not allowed'}), 400

@app.route('/translate', methods=['POST'])
def translate():
    data = request.get_json()
    text = data.get('text', '')
    target_language = data.get('language', 'English')
    current_language = data.get('current_language', '')
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    if current_language.lower() == target_language.lower():
        return jsonify({
            'success': True,
            'translated_text': text,
            'message': 'Text is already in the target language'
        })
    
    try:
        translated_text = translate_text(text, target_language)
        return jsonify({
            'success': True,
            'translated_text': translated_text
        })
    except Exception as e:
        return jsonify({'error': f'Translation error: {str(e)}'}), 500

@app.route('/explain', methods=['POST'])
def explain():
    data = request.get_json()
    text = data.get('text', '')
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    try:
        explanation = explain_text(text)
        return jsonify({
            'success': True,
            'explanation': explanation
        })
    except Exception as e:
        return jsonify({'error': f'Explanation error: {str(e)}'}), 500

@app.route('/export_pdf', methods=['POST'])
def export_pdf():
    data = request.get_json()
    text = data.get('text', '')
    filename = data.get('filename', 'document')
    is_translated = data.get('is_translated', False)
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    try:
        pdf_output = text_to_pdf(text)
        return send_file(
            pdf_output,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"{filename}_{'translated' if is_translated else 'extracted'}_{datetime.now().strftime('%Y%m%d')}.pdf"
        )
    except Exception as e:
        return jsonify({'error': f'PDF generation failed: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
