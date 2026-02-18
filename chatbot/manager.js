const natural = require('natural');
const fs = require('fs');

class ChatbotManager {
    constructor() {
        this.classifier = new natural.BayesClassifier();
        this.dataset = require('./dataset_enhanced.json');
        this.modelPath = './chatbot/model.json';
        this.isTrained = false;
    }

    async train() {
        console.log('Training Chatbot Model...');
        this.dataset.forEach(item => {
            item.utterances.forEach(utterance => {
                this.classifier.addDocument(utterance, item.intent);
            });
        });

        this.classifier.train();
        this.isTrained = true;

        // Save model for persistence (optional in dev, but good practice)
        this.classifier.save(this.modelPath, (err) => {
            if (err) console.error('Error saving model:', err);
            else console.log('Chatbot model saved.');
        });
    }

    getResponse(userInput) {
        if (!this.isTrained) return "I'm still learning... Please try again in a moment.";

        const intent = this.classifier.classify(userInput);

        // Fallback if confidence is low (simplified here as natural doesn't expose confidence in simple classify)
        // For production, use classify with probabilities.

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
