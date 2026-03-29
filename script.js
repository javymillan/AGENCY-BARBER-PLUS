document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const userInput = document.getElementById('user-input');
    const networkButtons = document.querySelectorAll('.network-buttons button');
    const generateBtn = document.getElementById('generate-btn');
    const resultElement = document.getElementById('result');
    const copyBtn = document.getElementById('copy-btn');
    const altVersionBtn = document.getElementById('alt-version-btn');
    const loadingOverlay = document.getElementById('loading-overlay');
    const themeToggle = document.getElementById('theme-toggle');
    const version1Tab = document.getElementById('version1-tab');
    const version2Tab = document.getElementById('version2-tab');
    const modeSelector = document.getElementById('mode-selector');
    
    // Check for saved theme preference or use default
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    
    // State
    let selectedNetwork = 'facebook';
    let selectedMode = localStorage.getItem('communicationMode') || 'GENERAL';
    let generatedPosts = {
        version1: '',
        version2: ''
    };
    let activeVersion = 'version1';
    
    // Set initial mode
    if (modeSelector) {
        modeSelector.value = selectedMode;
    }
    
    // Theme toggle event listener
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
    
    // Mode selector event listener
    if (modeSelector) {
        modeSelector.addEventListener('change', (e) => {
            selectedMode = e.target.value;
            localStorage.setItem('communicationMode', selectedMode);
        });
    }
    
    // Event listeners
    networkButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            networkButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            // Update selected network
            selectedNetwork = button.id;
        });
    });
    
    generateBtn.addEventListener('click', generatePost);
    copyBtn.addEventListener('click', copyToClipboard);
    altVersionBtn.addEventListener('click', generateAlternativeVersion);
    
    // Tab event listeners
    version1Tab.addEventListener('click', () => switchVersion('version1'));
    version2Tab.addEventListener('click', () => switchVersion('version2'));
    
    // Functions
    function switchVersion(version) {
        activeVersion = version;
        // Update tab states
        if (version === 'version1') {
            version1Tab.classList.add('active');
            version2Tab.classList.remove('active');
        } else {
            version1Tab.classList.remove('active');
            version2Tab.classList.add('active');
        }
        
        // Display the selected version
        displayResult(generatedPosts[version]);
    }
    
    async function generatePost() {
        const text = userInput.value.trim();
        
        if (!text) {
            showError('Por favor, escribe algo para generar un post de marketing.');
            return;
        }
        
        // Show loading
        loadingOverlay.classList.add('visible');
        
        try {
            // Call the Gemini API
            const generatedPost = await callGeminiAPI(text, selectedNetwork);
            generatedPosts.version1 = generatedPost;
            activeVersion = 'version1';
            
            // Update UI
            displayResult(generatedPost);
            version1Tab.classList.add('active');
            version2Tab.classList.remove('active');
            
            // Clear version 2 if it exists
            generatedPosts.version2 = '';
            
            loadingOverlay.classList.remove('visible');
        } catch (error) {
            console.error('Error generating post:', error);
            loadingOverlay.classList.remove('visible');
            showError('Hubo un error al generar el post. Por favor, intenta de nuevo.');
        }
    }
    
    async function generateAlternativeVersion() {
        const text = userInput.value.trim();
        
        if (!text) {
            showError('Por favor, escribe algo para generar un post de marketing.');
            return;
        }
        
        // Show loading
        loadingOverlay.classList.add('visible');
        
        try {
            // Call the Gemini API with a different temperature setting for variation
            const alternativePost = await callGeminiAPI(text, selectedNetwork, 1.0);
            generatedPosts.version2 = alternativePost;
            activeVersion = 'version2';
            
            // Update UI
            displayResult(alternativePost);
            version1Tab.classList.remove('active');
            version2Tab.classList.add('active');
            
            loadingOverlay.classList.remove('visible');
        } catch (error) {
            console.error('Error generating alternative post:', error);
            loadingOverlay.classList.remove('visible');
            showError('Hubo un error al generar la versión alternativa. Por favor, intenta de nuevo.');
        }
    }
    
    function displayResult(content) {
        resultElement.innerHTML = content;
        resultElement.style.fontSize = '1rem';
        
        // Add animation
        resultElement.style.animation = 'none';
        resultElement.offsetHeight; // Trigger reflow
        resultElement.style.animation = 'fadeIn 0.5s ease-out';
    }
    
    function copyToClipboard() {
        const text = resultElement.innerText;
        
        // Try modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    showCopySuccess();
                })
                .catch(err => {
                    console.error('Clipboard API failed: ', err);
                    // Fallback to execCommand
                    fallbackCopyToClipboard(text);
                });
        } else {
            // Fallback for older browsers or non-secure contexts
            fallbackCopyToClipboard(text);
        }
    }
    
    function fallbackCopyToClipboard(text) {
        // Create a temporary textarea element
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'absolute';
        textArea.style.opacity = '0';
        textArea.style.width = '1px';
        textArea.style.height = '1px';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.pointerEvents = 'none';
        document.body.appendChild(textArea);
        
        // Select and copy the text
        textArea.focus();
        textArea.select();
        textArea.setSelectionRange(0, 99999); // For mobile devices
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
            showCopySuccess();
        } else {
            showError('No se pudo copiar al portapapeles.');
        }
    }
    
    function showCopySuccess() {
        // Show copy success feedback
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="bi bi-check-lg"></i>';
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    }
    
    function showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #f44336;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            z-index: 1001;
            animation: fadeIn 0.3s ease-out;
        `;
        errorElement.textContent = message;
        document.body.appendChild(errorElement);
        
        setTimeout(() => {
            errorElement.style.opacity = '0';
            errorElement.style.transition = 'opacity 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(errorElement);
            }, 300);
        }, 3000);
    }
    
    async function callGeminiAPI(text, network, temperature = 0.7) {
        const API_KEY = 'AIzaSyBlwPFrRQPMJEMXaHPmq7o61nER1LmHPOQ';
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;
        
        const networkTips = {
            facebook: "Formato informativo y profesional con 5 hashtags al final.",
            instagram: "Formato visual y estético con 8 hashtags al final.",
            tiktok: "Formato breve, atractivo y sorprendente con 6 hashtags al final."
        };

        const modeInstructions = {
            PROFESIONAL: "Usa un lenguaje formal y técnico, con terminología especializada. Minimiza el uso de emojis y mantén un tono sobrio y profesional.",
            RESIDENCIAL: "Usa un lenguaje cercano y accesible, con explicaciones sencillas y un tono amigable. Incluye emojis para hacer el mensaje más atractivo.",
            GENERAL: "Combina elementos técnicos con explicaciones accesibles, manteniendo un tono profesional pero comprensible."
        };
        
        const prompt = `Genera un post de marketing y venta para ${network} sobre recubrimientos epóxicos.
        El post debe promocionar: ${text}.
        El post debe ser para la empresa EpoxCITY (nos especializamos en recubrimientos epóxicos para pisos y superficies a nivel Residencial, Comercial e Industrial).
        
        Modo de comunicación: ${modeInstructions[selectedMode]}
        
        Sigue este estilo: ${networkTips[network]}
        
        El post debe incluir:
        - Un título atractivo con emoji
        - Una pregunta relacionada con el producto
        - 3-4 beneficios del producto con emojis (especialmente el emoji 🔹)
        - Una llamada a la acción
        - Información de contacto: 📍 Hermosillo, Sonora y 📞 WhatsApp: 662-2782939
        - Hashtags relevantes
        
        Usa el siguiente ejemplo como referencia para el formato:
        🏊‍♂️✨ Dale un upgrade a tu alberca con EpoxCity ✨🏊‍♀️

        ¿Pensando en un piso veneciano? 🚫 ¡Tenemos una mejor opción! ✅ Nuestro sistema de resinas epóxicas FLake te ofrece:
        
        🔹 Mayor durabilidad y resistencia 💪
        🔹 Permeabilidad mejorada 🌊
        🔹 Diseños personalizados y únicos 🎨
        
        Transforma tu espacio con estilo y funcionalidad. 🔥 Contáctanos y dale a tu alberca el acabado que se merece. 📲💬
        
        📍 Hermosillo, Sonora
        📞 WhatsApp: 662-2782939
        
        #EpoxCity #ResinaEpóxica #AlbercasDeLujo #DiseñoPersonalizado #InnovaciónEnAcabados
        
        ------------------------------------------------
        IMPORTANTE: Genera directamente el post. NO escribas introducciones como "Aquí te dejo...", "Una posible versión...", o similar. Solo proporciona el post listo para copiar y pegar.`;
        
        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: prompt
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: temperature,
                maxOutputTokens: 800
            }
        };
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }
});