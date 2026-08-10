const dataset = require('./dataset_enhanced.json');

const STOP_WORDS = new Set(['a','an','the','is','are','i','me','my','to','for','of','in','on','and','or','please','can','you']);
const tokens = text => String(text).toLowerCase().replace(/[^a-z0-9+ -]/g,' ').split(/\s+/).filter(word=>word.length>1&&!STOP_WORDS.has(word));

class ChatbotManager {
  constructor(){this.trained=false;this.intents=[];this.summary={intents:0,utterances:0,trainedAt:null,engine:'token-weighted-intent-matcher'};}
  async train(){
    const documentFrequency=new Map();const documents=[];
    for(const item of dataset)for(const utterance of item.utterances){const words=[...new Set(tokens(utterance))];documents.push({intent:item.intent,words});words.forEach(word=>documentFrequency.set(word,(documentFrequency.get(word)||0)+1));}
    const total=documents.length;this.intents=dataset.map(item=>({intent:item.intent,answers:item.answers,examples:documents.filter(doc=>doc.intent===item.intent).map(doc=>new Map(doc.words.map(word=>[word,Math.log((1+total)/(1+(documentFrequency.get(word)||0)))+1])))}));
    this.trained=true;this.summary={intents:dataset.length,utterances:total,trainedAt:new Date().toISOString(),engine:'token-weighted-intent-matcher'};return this.summary;
  }
  getStatus(){return{trained:this.trained,...this.summary};}
  getResponse(input){
    const normalized=String(input||'').trim();
    if(/chest pain|not breathing|unconscious|severe bleeding|suicide|overdose/i.test(normalized))return{intent:'emergency',response:'This may be an emergency. Call 112 now or ask someone nearby to call. Do not wait for this chat. Follow the dispatcher’s instructions.'};
    if(!this.trained)return{intent:'training',response:'The assistant is still loading. For emergencies, call 112.'};
    const query=new Set(tokens(normalized));let best={score:0,intent:null,answers:null};
    for(const item of this.intents)for(const example of item.examples){let score=0;for(const word of query)score+=example.get(word)||0;score/=Math.sqrt(Math.max(1,query.size)*Math.max(1,example.size));if(score>best.score)best={score,intent:item.intent,answers:item.answers};}
    if(best.score<.3)return{intent:'unknown',confidence:Number(best.score.toFixed(3)),response:'I am not confident I understood. Try “ICU beds in Delhi”, “O negative blood”, or “how does prediction work?”. For emergencies, call 112.'};
    return{intent:best.intent,confidence:Number(Math.min(.99,best.score).toFixed(3)),response:best.answers[Math.floor(Math.random()*best.answers.length)]};
  }
}
module.exports=new ChatbotManager();
