import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

function fallback(input:{url:string;goal:string;budget:string;country:string}, text:string){
 const isVitals=/vitals-arcade|arcade|game/i.test(input.url+' '+text);
 const brand=isVitals?'Vitals Arcade':'Your Product';
 const summary=isVitals?'A fast browser arcade with eight short, replayable challenges around timing, memory, nerve and control.':'A product identified from the supplied website. Use this blueprint as a starting point and validate it with real campaign data.';
 return {brand,url:input.url,summary,audience:isVitals?['Casual and browser gamers','Students and young adults','Fans of quick challenge and reaction games']:['Problem-aware users','People actively interested in the product category','Short-form content audiences'],hooks:isVitals?['Think you’re fast? Prove it.','You have one minute. What’s your score?','Beat my score.']:['Stop scrolling. Try this.','A faster way to solve the problem.','See what happens when you try it.'],ads:isVitals?[{headline:'Think you’re fast?',text:'Eight quick arcade challenges. Timing, memory, control and nerve. Pick a game and see your score.',cta:'PLAY NOW'},{headline:'You have one minute.',text:'No download. No complicated setup. Just jump into a quick challenge and try to beat your score.',cta:'TAKE THE CHALLENGE'},{headline:'Can you beat this score?',text:'Start with one challenge. Then try another. Share your result and challenge a friend.',cta:'BEAT THE SCORE'}]:[{headline:'Meet the product.',text:'A concise, benefit-led introduction generated from your website.',cta:'LEARN MORE'},{headline:'Try a better workflow.',text:'Turn the product promise into a simple, low-friction action.',cta:'GET STARTED'},{headline:'See it for yourself.',text:'Use this variation for a curiosity-driven test.',cta:'TRY IT'}],channels:['Instagram Reels / Facebook','TikTok','YouTube Shorts'],budget:input.budget,tracking:['UTM campaign + creative parameters','Landing-page visit','Primary conversion event','Cost per conversion','Creative-level performance'],nextSteps:['Launch 3 creative concepts with equal test budget','Measure clicks and completed primary actions','Generate variations from the winning hook','Require approval before increasing spend or publishing changes'],aiMode:'HEURISTIC MODE'};
}

export async function POST(req:Request){
 try{
  const input=await req.json();
  if(!input.url||!/^https?:\/\//i.test(input.url)) return NextResponse.json({error:'Enter a valid http(s) URL.'},{status:400});
  let page='';
  try{const r=await fetch(input.url,{headers:{'user-agent':'AdPilotBot/0.2'},signal:AbortSignal.timeout(8000)});page=(await r.text()).slice(0,18000)}catch{}
  const apiKey=process.env.GEMINI_API_KEY||process.env.GOOGLE_GEMINI_API_KEY;
  if(apiKey){
   const ai=new GoogleGenAI({apiKey});
   const prompt=`You are AdPilot, an advertising strategist. Analyze the supplied website text and return ONLY valid JSON with keys brand,url,summary,audience,hooks,ads,channels,budget,tracking,nextSteps,aiMode. ads must be 3 objects with headline,text,cta. Make claims only supported by the site. Goal: ${input.goal}; country: ${input.country}; daily budget USD: ${input.budget}. Never frame entertainment products as medical or diagnostic tools. Recommend a small test before scaling. Website: ${input.url}\nTEXT:\n${page}`;
   const response=await ai.models.generateContent({model:process.env.GEMINI_MODEL||'gemini-2.5-flash-lite',contents:prompt,config:{responseMimeType:'application/json',temperature:0.4}});
   const raw=response.text||'{}';
   const data=JSON.parse(raw.replace(/^```json\s*/,'').replace(/\s*```$/,''));
   return NextResponse.json({...data,url:input.url,budget:String(input.budget),aiMode:'GEMINI MODE'});
  }
  return NextResponse.json(fallback(input,page));
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to analyze website.'},{status:500})}
}
