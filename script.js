/* ================================================================
CONFIGURATION
================================================================
*/

// ⚠️ SECURITY WARNING: In a real production app, never expose API keys on the client side.
// Use a backend proxy/serverless function to hide these credentials.
const CONFIG = {
    // Get key from: https://openrouter.ai/keys
    OPENROUTER_API_KEY: 'YOUR_OPENROUTER_API_KEY_HERE', 
    
    // Choose a multimodal model (e.g., google/gemini-flash-1.5, openai/gpt-4o)
    AI_MODEL: 'google/gemini-flash-1.5', 
    
    // URL from Google Apps Script (Deploy as Web App -> Execute as Me -> Access: Anyone)
    GOOGLE_SHEET_URL: 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE'
};

/* ================================================================
STATE MANAGEMENT
================================================================
*/
let appState = {
    balance: 0,
    currency: 'USD',
    files: null
};

/* ================================================================
CORE FUNCTIONS
================================================================
*/

function initializeApp() {
    const balInput = document.getElementById('initBalance').value;
    const currInput = document.getElementById('currency').value;

    if (!balInput) return alert("Please enter a starting balance.");

    appState.balance = parseFloat(balInput);
    appState.currency = currInput.toUpperCase();

    // UI Updates
    document.getElementById('setupSection').classList.add('hidden');
    document.getElementById('appInterface').classList.remove('hidden');
    updateBalanceDisplay();
}

function updateBalanceDisplay() {
    document.getElementById('displayBalance').innerText = 
        `${appState.currency} ${appState.balance.toFixed(2)}`;
}

// Handle File Selection
document.getElementById('fileInput').addEventListener('change', function(e) {
    if (e.target.files.length > 0) {
        appState.files = e.target.files[0];
        document.getElementById('fileName').innerText = "✅ " + e.target.files[0].name;
    }
});

/* ================================================================
AI PROCESSING
================================================================
*/

async function analyzeInput() {
    const text = document.getElementById('textInput').value;
    const btn = document.getElementById('analyzeBtn');
    const status = document.getElementById('statusMessage');

    if (!text && !appState.files) return alert("Please provide text or a file.");

    // UI Loading State
    btn.disabled = true;
    btn.innerText = "🤖 AI is thinking...";
    status.innerText = "Uploading and processing...";

    try {
        let contentPayload = [];

        // 1. Add Text Context
        let promptText = `Current Balance: ${appState.currency} ${appState.balance}. `;
        if (text) promptText += `User Note: ${text}`;
        
        contentPayload.push({
            "type": "text",
            "text": promptText
        });

        // 2. Add File Context (Base64) if exists
        if (appState.files) {
            const base64File = await fileToBase64(appState.files);
            contentPayload.push({
                "type": "image_url", // OpenRouter/OpenAI standard for images
                "image_url": {
                    "url": base64File
                }
            });
        }

        // 3. System Prompt
        const systemPrompt = `You are an intelligent expense-tracking assistant.
        Process ANY input (text, audio, image, pdf).
        Extract or infer:
        - Date (default today, format DD.MM.YYYY)
        - Amount (numeric value only, infer currency from context)
        - Category (decide intelligently, e.g., Food, Transport)
        - Description (Brief one sentence)
        - Updated balance (Subtract Amount from ${appState.balance})
        
        Return ONLY this format:
        Added to report ✅
        
        💸 Expense:
        Date: DD.MM.YYYY
        Amount: <CURRENCY> <NUMBER>
        Category: <Category>
        Description: <Description>
        Balance: <CURRENCY> <NUMBER>`;

        // 4. API Call
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": CONFIG.AI_MODEL,
                "messages": [
                    { "role": "system", "content": systemPrompt },
                    { "role": "user", "content": contentPayload }
                ]
            })
        });

        const data = await response.json();
        
        if (data.error) throw new Error(data.error.message);

        const aiText = data.choices[0].message.content;

        // Show Review
        document.getElementById('aiOutput').value = aiText;
        document.getElementById('inputSection').classList.add('hidden');
        document.getElementById('reviewSection').classList.remove('hidden');

    } catch (error) {
        console.error(error);
        alert("AI Processing Failed: " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "✨ Analyze with AI";
        status.innerText = "";
    }
}

/* ================================================================
CONFIRMATION & GOOGLE SHEETS
================================================================
*/

async function confirmExpense() {
    const rawOutput = document.getElementById('aiOutput').value;
    const status = document.getElementById('statusMessage');
    
    status.innerText = "Saving to Google Sheets...";

    try {
        // 1. Parse the AI Text to Structured Data
        const parsedData = parseAIOutput(rawOutput);
        
        if (!parsedData) throw new Error("Could not parse AI output. Ensure format is correct.");

        // 2. Send to Google Sheets (Web App)
        // Note: 'no-cors' is used to avoid CORS errors from Google Script, 
        // but it means we can't read the response. We assume success if no network error.
        await fetch(CONFIG.GOOGLE_SHEET_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(parsedData)
        });

        // 3. Update Local State
        // Extract raw number from Balance string (e.g. "USD 450.00" -> 450.00)
        const newBalanceStr = parsedData.Balance.replace(/[^0-9.-]+/g,"");
        appState.balance = parseFloat(newBalanceStr);
        updateBalanceDisplay();

        // 4. Reset UI
        resetUI();
        status.innerText = "Saved successfully! ✅";
        setTimeout(() => status.innerText = "", 3000);

    } catch (error) {
        console.error(error);
        alert("Save failed: " + error.message);
        status.innerText = "";
    }
}

function cancelReview() {
    document.getElementById('reviewSection').classList.add('hidden');
    document.getElementById('inputSection').classList.remove('hidden');
}

function resetUI() {
    document.getElementById('textInput').value = "";
    document.getElementById('fileInput').value = "";
    document.getElementById('fileName').innerText = "📎 Click to upload Image/Audio/PDF";
    appState.files = null;
    
    document.getElementById('reviewSection').classList.add('hidden');
    document.getElementById('inputSection').classList.remove('hidden');
}

/* ================================================================
UTILITIES
================================================================
*/

// Helper to convert File object to Base64 string
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Helper to parse the strict AI output format into a JSON object
function parseAIOutput(text) {
    try {
        const getValue = (label) => {
            const regex = new RegExp(`${label}:\\s*(.*)`);
            const match = text.match(regex);
            return match ? match[1].trim() : "";
        };

        return {
            Date: getValue('Date'),
            Amount: getValue('Amount'), // Stores "USD 50" string
            Category: getValue('Category'),
            Description: getValue('Description'),
            Balance: getValue('Balance')
        };
    } catch (e) {
        return null;
    }
}
