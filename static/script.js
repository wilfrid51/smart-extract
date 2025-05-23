document.addEventListener('DOMContentLoaded', function() {
    // Initialize all elements with null checks
    const elements = {
        dropZone: document.getElementById('dropZone'),
        fileInput: document.getElementById('fileInput'),
        browseBtn: document.getElementById('browseBtn'),
        extractBtn: document.getElementById('extractBtn'),
        translateBtn: document.getElementById('translateBtn'),
        explainBtn: document.getElementById('explainBtn'),
        copyBtn: document.getElementById('copyBtn'),
        exportTxtBtn: document.getElementById('exportTxtBtn'),
        exportPdfBtn: document.getElementById('exportPdfBtn'),
        clearBtn: document.getElementById('clearBtn'),
        resultText: document.getElementById('resultText'),
        explanationText: document.getElementById('explanationText'),
        targetLanguage: document.getElementById('targetLanguage'),
        languageSelector: document.querySelector('.language-selector'),
        status1: document.getElementById('status1'),
        status2: document.getElementById('status2'),
        accuracyMeter: document.getElementById('accuracyMeter'),
        accuracyFill: document.getElementById('accuracyFill'),
        accuracyValue: document.getElementById('accuracyValue'),
        tabs: document.querySelectorAll('.tab'),
        tabContents: document.querySelectorAll('.tab-content')
    };

    // State variables
    let currentFile = null;
    let extractedText = '';
    let translatedText = '';
    let currentLanguage = '';
    let extractionAccuracy = 0;

    // Initialize UI state
    function initializeUI() {
        // Hide translation-related elements initially
        if (elements.languageSelector) elements.languageSelector.style.display = 'none';
        if (elements.translateBtn) elements.translateBtn.style.display = 'none';
        if (elements.explainBtn) elements.explainBtn.style.display = 'none';
        
        // Disable buttons that require text
        if (elements.copyBtn) elements.copyBtn.disabled = true;
        if (elements.exportTxtBtn) elements.exportTxtBtn.disabled = true;
        if (elements.exportPdfBtn) elements.exportPdfBtn.disabled = true;
        if (elements.clearBtn) elements.clearBtn.disabled = true;
    }

    // Update button states based on current state
    function updateButtonStates() {
        const hasExtractedText = extractedText.length > 0;
        
        // Show/hide translation elements based on extraction
        if (elements.languageSelector) {
            elements.languageSelector.style.display = hasExtractedText ? 'flex' : 'none';
        }
        if (elements.translateBtn) {
            elements.translateBtn.style.display = hasExtractedText ? 'inline-flex' : 'none';
            elements.translateBtn.disabled = !hasExtractedText;
        }
        if (elements.explainBtn) {
            elements.explainBtn.style.display = hasExtractedText ? 'inline-flex' : 'none';
            elements.explainBtn.disabled = !hasExtractedText;
        }
        
        // Update other buttons
        if (elements.copyBtn) elements.copyBtn.disabled = !hasExtractedText;
        if (elements.exportTxtBtn) elements.exportTxtBtn.disabled = !hasExtractedText;
        if (elements.exportPdfBtn) elements.exportPdfBtn.disabled = !hasExtractedText;
        if (elements.clearBtn) elements.clearBtn.disabled = !hasExtractedText;
    }

    // Initialize the UI
    initializeUI();

    // Drag and drop functionality
    function setupDragAndDrop() {
        if (!elements.dropZone) return;

        const preventDefaults = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };

        const highlight = () => {
            elements.dropZone.classList.add('highlight');
        };

        const unhighlight = () => {
            elements.dropZone.classList.remove('highlight');
        };

        const handleDrop = (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) handleFiles(files);
        };

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            elements.dropZone.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            elements.dropZone.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            elements.dropZone.addEventListener(eventName, unhighlight, false);
        });

        elements.dropZone.addEventListener('drop', handleDrop, false);
    }

    // File handling
    function setupFileInput() {
        if (!elements.browseBtn || !elements.fileInput) return;

        elements.browseBtn.addEventListener('click', () => {
            elements.fileInput.click();
        });

        elements.fileInput.addEventListener('change', () => {
            if (elements.fileInput.files.length > 0) {
                handleFiles(elements.fileInput.files);
            }
        });
    }

    function handleFiles(files) {
        const file = files[0];
        const fileType = file.name.split('.').pop().toLowerCase();
        const allowedTypes = ['pdf', 'png', 'jpg', 'jpeg'];
        
        if (!allowedTypes.includes(fileType)) {
            showStatus(elements.status1, 'Please upload a PDF, PNG, JPG, or JPEG file', 'error');
            return;
        }
        
        currentFile = file;
        if (elements.extractBtn) {
            elements.extractBtn.disabled = false;
            showStatus(elements.status1, `Ready to process: ${file.name}`, 'success');
        }
    }

    // Text extraction
    function setupExtractButton() {
        if (!elements.extractBtn) return;

        elements.extractBtn.addEventListener('click', async () => {
            if (!currentFile) return;
            
            try {
                // Show loading state
                elements.extractBtn.innerHTML = '<span class="loading"></span> Extracting...';
                elements.extractBtn.disabled = true;
                
                const formData = new FormData();
                formData.append('file', currentFile);
                
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                const data = await response.json();
                
                if (data.success) {
                    extractedText = data.extracted_text;
                    currentLanguage = 'Unknown';
                    extractionAccuracy = data.accuracy || 90;
                    
                    if (elements.resultText) elements.resultText.value = extractedText;
                    
                    // Show accuracy meter
                    if (elements.accuracyMeter) {
                        elements.accuracyMeter.style.display = 'block';
                        if (elements.accuracyFill) elements.accuracyFill.style.width = `${extractionAccuracy}%`;
                        if (elements.accuracyValue) elements.accuracyValue.textContent = `${extractionAccuracy}%`;
                        
                        // Set color based on accuracy
                        if (elements.accuracyFill) {
                            if (extractionAccuracy < 70) {
                                elements.accuracyFill.style.background = 'var(--danger)';
                            } else if (extractionAccuracy < 90) {
                                elements.accuracyFill.style.background = 'var(--warning)';
                            } else {
                                elements.accuracyFill.style.background = 'var(--success)';
                            }
                        }
                    }
                    
                    showStatus(elements.status1, 'Text extracted successfully!', 'success');
                    
                    // Update UI to show translation options
                    updateButtonStates();
                } else {
                    throw new Error(data.error || 'Failed to extract text');
                }
            } catch (error) {
                console.error('Extraction error:', error);
                showStatus(elements.status1, error.message || 'Extraction failed', 'error');
            } finally {
                if (elements.extractBtn) {
                    elements.extractBtn.innerHTML = '<i class="fas fa-extract"></i> Extract Text';
                    elements.extractBtn.disabled = false;
                }
            }
        });
    }

    // Translation functionality
    function setupTranslateButton() {
        if (!elements.translateBtn) return;

        elements.translateBtn.addEventListener('click', async () => {
            if (!extractedText || !elements.targetLanguage) return;
            
            try {
                elements.translateBtn.innerHTML = '<span class="loading"></span> Translating...';
                elements.translateBtn.disabled = true;
                
                const response = await fetch('/translate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: extractedText,
                        language: elements.targetLanguage.value,
                        current_language: currentLanguage
                    })
                });
                
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                const data = await response.json();
                
                if (data.success) {
                    translatedText = data.translated_text;
                    if (elements.resultText) elements.resultText.value = translatedText;
                    currentLanguage = elements.targetLanguage.value;
                    
                    showStatus(elements.status2, data.message || `Translated to ${elements.targetLanguage.value} successfully!`, 'success');
                } else {
                    throw new Error(data.error || 'Translation failed');
                }
            } catch (error) {
                console.error('Translation error:', error);
                showStatus(elements.status2, error.message || 'Translation failed', 'error');
            } finally {
                if (elements.translateBtn) {
                    elements.translateBtn.innerHTML = '<i class="fas fa-language"></i> Translate';
                    elements.translateBtn.disabled = false;
                }
            }
        });
    }

    // Explanation functionality
    function setupExplainButton() {
        if (!elements.explainBtn) return;

        elements.explainBtn.addEventListener('click', async () => {
            const textToExplain = elements.resultText?.value.trim();
            if (!textToExplain) {
                showStatus(elements.status2, 'No text to analyze', 'error');
                return;
            }
            
            try {
                elements.explainBtn.innerHTML = '<span class="loading"></span> Analyzing...';
                elements.explainBtn.disabled = true;
                
                const response = await fetch('/explain', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: textToExplain
                    })
                });
                
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                const data = await response.json();
                
                if (data.success) {
                    if (elements.explanationText) {
                        elements.explanationText.value = data.explanation || 'No explanation available';
                    }
                    showStatus(elements.status2, 'Text analyzed successfully!', 'success');
                    
                    // Switch to explanation tab
                    const explanationTab = document.querySelector('.tab[data-tab="explanation"]');
                    if (explanationTab) explanationTab.click();
                } else {
                    throw new Error(data.error || 'Explanation failed');
                }
            } catch (error) {
                console.error('Explanation error:', error);
                showStatus(elements.status2, error.message || 'Explanation failed', 'error');
            } finally {
                if (elements.explainBtn) {
                    elements.explainBtn.innerHTML = '<i class="fas fa-info-circle"></i> Explain';
                    elements.explainBtn.disabled = false;
                }
            }
        });
    }

    // Other button setups (copy, export, clear)
    function setupOtherButtons() {
        // Copy button
        if (elements.copyBtn) {
            elements.copyBtn.addEventListener('click', () => {
                const activeTab = document.querySelector('.tab-content.active');
                const textToCopy = activeTab?.querySelector('textarea')?.value;
                if (!textToCopy) return;
                
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const originalText = elements.copyBtn.innerHTML;
                    elements.copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    setTimeout(() => {
                        elements.copyBtn.innerHTML = originalText;
                    }, 2000);
                    
                    showStatus(elements.status2, 'Text copied to clipboard!', 'success');
                }).catch(err => {
                    console.error('Copy error:', err);
                    showStatus(elements.status2, 'Failed to copy text', 'error');
                });
            });
        }

        // Export buttons
        if (elements.exportTxtBtn) {
            elements.exportTxtBtn.addEventListener('click', () => {
                const textToExport = elements.resultText?.value;
                if (!textToExport) return;
                
                const blob = new Blob([textToExport], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `document_${new Date().toISOString().slice(0,10)}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                showStatus(elements.status2, 'Text exported as TXT file!', 'success');
            });
        }

        if (elements.exportPdfBtn) {
            elements.exportPdfBtn.addEventListener('click', async () => {
                const textToExport = elements.resultText?.value;
                if (!textToExport) return;
                
                try {
                    elements.exportPdfBtn.innerHTML = '<span class="loading"></span> Generating PDF...';
                    elements.exportPdfBtn.disabled = true;
                    
                    const response = await fetch('/export_pdf', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            text: textToExport,
                            filename: currentFile ? currentFile.name.replace(/\.[^/.]+$/, "") : 'document',
                            is_translated: translatedText.length > 0
                        })
                    });
                    
                    if (response.ok) {
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `document_${currentFile ? currentFile.name.replace(/\.[^/.]+$/, "") : 'translated'}_${new Date().toISOString().slice(0,10)}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        
                        showStatus(elements.status2, 'PDF generated successfully!', 'success');
                    } else {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'PDF generation failed');
                    }
                } catch (error) {
                    console.error('PDF export error:', error);
                    showStatus(elements.status2, error.message || 'PDF export failed', 'error');
                } finally {
                    if (elements.exportPdfBtn) {
                        elements.exportPdfBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Export as PDF';
                        elements.exportPdfBtn.disabled = false;
                    }
                }
            });
        }

        // Clear button
        if (elements.clearBtn) {
            elements.clearBtn.addEventListener('click', () => {
                if (elements.resultText) elements.resultText.value = '';
                if (elements.explanationText) elements.explanationText.value = '';
                extractedText = '';
                translatedText = '';
                currentFile = null;
                currentLanguage = '';
                if (elements.fileInput) elements.fileInput.value = '';
                
                initializeUI(); // Reset to initial state
                
                if (elements.status1) {
                    elements.status1.textContent = '';
                    elements.status1.className = 'status';
                }
                
                if (elements.status2) {
                    elements.status2.textContent = '';
                    elements.status2.className = 'status';
                }
                
                if (elements.accuracyMeter) {
                    elements.accuracyMeter.style.display = 'none';
                }
                
                // Switch back to text tab
                const textTab = document.querySelector('.tab[data-tab="text"]');
                if (textTab) textTab.click();
            });
        }
    }

    // Tab switching
    function setupTabs() {
        if (!elements.tabs || !elements.tabContents) return;

        elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                elements.tabs.forEach(t => t.classList.remove('active'));
                elements.tabContents.forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                const tabId = tab.getAttribute('data-tab');
                const content = document.getElementById(`${tabId}Tab`);
                if (content) content.classList.add('active');
            });
        });
    }

    // Status messages
    function showStatus(element, message, type) {
        if (!element) return;
        
        element.textContent = message;
        element.className = `status status-${type}`;
        setTimeout(() => {
            element.textContent = '';
            element.className = 'status';
        }, 5000);
    }

    // Initialize all functionality
    setupDragAndDrop();
    setupFileInput();
    setupExtractButton();
    setupTranslateButton();
    setupExplainButton();
    setupOtherButtons();
    setupTabs();
});