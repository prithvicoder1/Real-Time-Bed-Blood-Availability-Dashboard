const natural = require('natural');
const fs = require('fs');

class ChatbotManager {
    constructor() {
        this.classifier = new natural.BayesClassifier();
        this.dataset = require('./dataset_enhanced.json');
        this.modelPath = './chatbot/model.json';
        this.isTrained = false;
        this.trainingSummary = { intents: this.dataset.length, utterances: 0, trainedAt: null };
    }

    async train() {
        console.log('Training Chatbot Model...');
        let utterances = 0;
        this.dataset.forEach(item => {
            item.utterances.forEach(utterance => {
                this.classifier.addDocument(utterance, item.intent);
                utterances += 1;
            });
        });

        this.classifier.train();
        this.isTrained = true;
        this.trainingSummary = { intents: this.dataset.length, utterances, trainedAt: new Date().toISOString() };

        // Save model for persistence (optional in dev, but good practice)
        this.classifier.save(this.modelPath, (err) => {
            if (err) console.error('Error saving model:', err);
            else console.log('Chatbot model saved.');
        });
    }

    getStatus() {
        return { trained: this.isTrained, ...this.trainingSummary };
    }

    getResponse(userInput) {
        if (!this.isTrained) return { intent: 'training', response: "I'm still learning. Please try again in a moment." };

        const normalized = String(userInput || '').trim().toLowerCase();
        if (/chest pain|not breathing|unconscious|severe bleeding|suicide|overdose/.test(normalized)) {
            return { intent: 'emergency', response: 'This may be an emergency. Call 112 now or ask someone nearby to call. Do not wait for this chat. If safe, share your location with the dispatcher.' };
        }

        const ranked = this.classifier.getClassifications(normalized);
        const intent = ranked[0]?.label;
        const confidence = ranked[0]?.value || 0;
        const runnerUp = ranked[1]?.value || 0;
        if (!intent || confidence < 0.08 || confidence - runnerUp < 0.015) {
            return { intent: 'unknown', response: 'I am not confident I understood that. Try “ICU beds in Delhi”, “O negative blood”, or “book an ambulance”. For emergencies, call 112.' };
        }

        const intentData = this.dataset.find(item => item.intent === intent);

        if (intentData) {
            const responses = intentData.answers;
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            return { intent, response: randomResponse };
        }

        return { intent: 'unknown', response: "I'm not sure I understand. Can you rephrase that? refer to Help section." };
    }
}

module.exports = new ChatbotManager();
