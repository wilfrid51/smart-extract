

# SmartTextExtractor AI - Handwritten and Printed Text Extraction Tool

![SmartTextExtractor AI Logo](/static/logo.png)

**SmartTextExtractor AI** is an intelligent document processing platform powered by Gemini AI. It specializes in extracting handwritten and printed text from scanned documents and images, with support for multilingual translation and contextual explanation as additional features.

## Features

- **Handwritten & Printed Text Extraction**: Extracts high-accuracy text from scanned PDFs and images (PNG, JPG, JPEG)
- **Multilingual Translation (Optional)**: Translate extracted text into multiple languages
- **Contextual Analysis**: Get AI-powered explanations of extracted content
- **Format Preservation**: Maintains structure and formatting of original documents
- **Accuracy Metrics**: Visual indicators of extraction quality
- **Export Options**: Download results as TXT or PDF

## Prerequisites

- Python 3.8+
- Flask
- Google Generative AI SDK
- Pillow (PIL)
- PyPDF2
- FPDF2

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/smarttextextractor-ai.git
   cd smarttextextractor-ai


2. Create and activate a virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the project root with your API key:

   ```env
   GEMINI_API_KEY="your_api_key_here"
   ```
  ```
## Project Structure


smarttextextractor-ai/
├── static/
│   ├── styles.css       # Frontend styles
│   ├── script.js        # Frontend logic
│   ├── logo.png         # Application logo
│   └── favicon.ico      # Browser tab icon
├── templates/
│   └── index.html       # Main application interface
├── uploads/             # Temporary file storage
├── .env                 # Environment variables
├── app.py               # Flask application
└── README.md            # Project documentation
```

## Running the Application

Start the Flask development server:

```bash
python app.py
```

Open your browser and navigate to:

```
http://localhost:5000
```

## Usage

### Upload a Document:

* Drag and drop a file or click "Browse Files"
* Supported formats: PDF, PNG, JPG, JPEG

### Extract Text:

* Click "Extract Text" to process the document
* View extraction accuracy metrics

### Translate Text:

* Select target language
* Click "Translate" button

### Get Explanation:

* Click "Explain" for detailed analysis

### Export Results:

* Save as TXT or PDF

## Configuration

Edit the `.env` file to configure:

* `GEMINI_API_KEY`: Your Google Gemini API key
* `UPLOAD_FOLDER`: Path for temporary uploads (default: `'uploads'`)
* `MAX_CONTENT_LENGTH`: Maximum file size in bytes (default: 50MB)

## Troubleshooting

**Common Issues:**

* **Extraction fails:**

  * Ensure the document is not password protected
  * Check that the file format is supported

* **Translation not working:**

  * Verify your API key is valid
  * Check your internet connection

* **PDF generation issues:**

  * Try with simpler documents first
  * Ensure the text doesn't contain unsupported characters

## License

This project is licensed under the MIT License.

## Contact

For support or questions, please contact:

* Email:(Deepak.B.in@outlook.com)
* GitHub: (https://github.com/deepak5256))


