const dataset = require('./dataset_enhanced.json');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

const STOP_WORDS = new Set(['a','an','the','is','are','i','me','my','to','for','of','in','on','and','or','please','can','you']);
const tokens = text => String(text).toLowerCase().replace(/[^a-z0-9+ -]/g,' ').split(/\s+/).filter(word=>word.length>1&&!STOP_WORDS.has(word));

class ChatbotManager {
  constructor(){this.trained=false;this.intents=[];this.modelPath=path.join(__dirname,'../../ml/chatbot_intent_model.joblib');this.summary={intents:0,utterances:0,trainedAt:null,engine:'loading'};}
  async train(){
    const documentFrequency=new Map();const documents=[];
    for(const item of dataset)for(const utterance of item.utterances){const words=[...new Set(tokens(utterance))];documents.push({intent:item.intent,words});words.forEach(word=>documentFrequency.set(word,(documentFrequency.get(word)||0)+1));}
    const total=documents.length;this.intents=dataset.map(item=>({intent:item.intent,answers:item.answers,examples:documents.filter(doc=>doc.intent===item.intent).map(doc=>new Map(doc.words.map(word=>[word,Math.log((1+total)/(1+(documentFrequency.get(word)||0)))+1])))}));
    this.trained=true;this.summary={intents:dataset.length,utterances:total,trainedAt:new Date().toISOString(),engine:fs.existsSync(this.modelPath)?'scikit-learn-tfidf-logistic-regression':'token-weighted-fallback'};return this.summary;
  }
  getStatus(){return{trained:this.trained,...this.summary};}
  fallback(input){
    const query=new Set(tokens(input));let best={score:0,intent:null,answers:null};
    for(const item of this.intents)for(const example of item.examples){let score=0;for(const word of query)score+=example.get(word)||0;score/=Math.sqrt(Math.max(1,query.size)*Math.max(1,example.size));if(score>best.score)best={score,intent:item.intent,answers:item.answers};}
    return{intent:best.intent,confidence:Number(Math.min(.99,best.score).toFixed(3)),answers:best.answers};
  }
  async getResponse(input){
    const normalized=String(input||'').trim();
    if(/chest pain|not breathing|unconscious|severe bleeding|suicide|overdose/i.test(normalized))return{intent:'emergency',response:'This may be an emergency. Call 112 now or ask someone nearby to call. Do not wait for this chat. Follow the dispatcher’s instructions.'};
    if(!this.trained)return{intent:'training',response:'The assistant is still loading. For emergencies, call 112.'};
    let result;
    if(fs.existsSync(this.modelPath)){try{result=await new Promise((resolve,reject)=>execFile(process.env.PYTHON_BIN||'python3',[path.join(__dirname,'../../ml/chatbot_predict.py'),normalized],{timeout:8000},(error,stdout)=>error?reject(error):resolve(JSON.parse(stdout))));}catch{result=this.fallback(normalized)}}else result=this.fallback(normalized);
    const item=dataset.find(entry=>entry.intent===result.intent);if(!item||result.confidence<.28)return{intent:'unknown',confidence:result.confidence,response:'I am not confident I understood. Try “ICU beds in Delhi”, “O negative blood”, or “how does prediction work?”. For emergencies, call 112.'};
    return{intent:result.intent,confidence:result.confidence,modelVersion:result.modelVersion||'fallback',response:item.answers[Math.floor(Math.random()*item.answers.length)]};
  }
}
module.exports=new ChatbotManager();
