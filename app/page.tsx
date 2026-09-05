'use client';

import { useEffect, useState } from 'react';

type Analysis = { brand:string; url:string; summary:string; audience:string[]; hooks:string[]; ads:{headline:string;text:string;cta:string}[]; channels:string[]; budget:string; tracking:string[]; nextSteps:string[]; aiMode:string };

type AdsStatus = { configured:boolean; connected:boolean; customerId?:string|null; accountName?:string|null; error?:string };

export default function Home() {
  const [url,setUrl]=useState('https://vitals-arcade.vercel.app/');
  const [goal,setGoal]=useState('Get players');
  const [budget,setBudget]=useState('10');
  const [country,setCountry]=useState('Nigeria');
  const [loading,setLoading]=useState(false);
  const [saving,setSaving]=useState(false);
  const [launching,setLaunching]=useState(false);
  const [analysis,setAnalysis]=useState<Analysis|null>(null);
  const [campaignId,setCampaignId]=useState('');
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [adsStatus,setAdsStatus]=useState<AdsStatus>({configured:false,connected:false});

  async function refreshAdsStatus(){
    try { const r=await fetch('/api/google-ads/status',{cache:'no-store'}); setAdsStatus(await r.json()); } catch {}
  }
  useEffect(()=>{refreshAdsStatus(); if(new URLSearchParams(window.location.search).get('google_ads')==='connected'){setNotice('Google Ads connected successfully.'); refreshAdsStatus();}},[]);

  async function analyze(e:React.FormEvent){e.preventDefault();setLoading(true);setError('');setNotice('');setAnalysis(null);setCampaignId('');try{const r=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url,goal,budget,country})});const data=await r.json();if(!r.ok)throw new Error(data.error||'Analysis failed');setAnalysis(data);}catch(err){setError(err instanceof Error?err.message:'Something went wrong')}finally{setLoading(false)}}

  async function saveCampaign(){
    if(!analysis)return; setSaving(true);setError('');setNotice('');
    try{const r=await fetch('/api/campaigns',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({brand:analysis.brand,url:analysis.url,goal,country,budget,analysis,aiProvider:analysis.aiMode.includes('GEMINI')?'gemini':'heuristic'})});const data=await r.json();if(!r.ok)throw new Error(data.error||'Could not save campaign');if(data.saved){setCampaignId(data.campaign.id);setNotice(`Campaign draft saved: ${data.campaign.id}`)}else setNotice('Draft generated. Connect Supabase to persist campaigns.');}catch(err){setError(err instanceof Error?err.message:'Unable to save campaign')}finally{setSaving(false)}
  }

  async function publishPaused(){
    if(!campaignId)return; setLaunching(true);setError('');setNotice('');
    try{const r=await fetch('/api/google-ads/campaign',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({campaignId,approved:true})});const data=await r.json();if(!r.ok)throw new Error(data.error||'Google Ads launch failed');setNotice(`Approved campaign created in Google Ads as PAUSED: ${data.resourceName||'created'}`);}catch(err){setError(err instanceof Error?err.message:'Google Ads launch failed')}finally{setLaunching(false)}
  }

  return <main>
    <nav><div className="logo"><span>✦</span> AdPilot AI</div><div className="navpill">AI ADVERTISING COPILOT</div></nav>
    <section className="hero"><div className="eyebrow">AUTONOMOUS CAMPAIGN INTELLIGENCE</div><h1>Turn any website into<br/><em>an ad campaign.</em></h1><p>Give AdPilot a product URL. It analyzes the offer, finds the audience, writes the creatives and builds a testable campaign in seconds.</p>
      <form className="panel" onSubmit={analyze}><label>PRODUCT / WEBSITE URL<input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://yourproduct.com" required/></label><div className="grid"><label>CAMPAIGN GOAL<select value={goal} onChange={e=>setGoal(e.target.value)}><option>Get players</option><option>Get traffic</option><option>Generate leads</option><option>Drive sales</option><option>App installs</option></select></label><label>DAILY BUDGET (USD)<input value={budget} onChange={e=>setBudget(e.target.value)} type="number" min="1"/></label><label>TARGET COUNTRY<input value={country} onChange={e=>setCountry(e.target.value)}/></label></div><button disabled={loading}>{loading?'ANALYZING…':'✦ BUILD MY CAMPAIGN'}</button></form>
      {error&&<div className="error">{error}</div>}{notice&&<div className="notice">{notice}</div>}
    </section>
    {analysis&&<section className="results"><div className="resulthead"><div><div className="eyebrow">CAMPAIGN BLUEPRINT</div><h2>{analysis.brand}</h2><p>{analysis.summary}</p></div><span className="status">{analysis.aiMode}</span></div>
      <div className="cards"><article><small>TARGET AUDIENCE</small><ul>{analysis.audience.map(x=><li key={x}>{x}</li>)}</ul></article><article><small>BEST CHANNELS</small><ul>{analysis.channels.map(x=><li key={x}>{x}</li>)}</ul></article><article><small>BUDGET PLAN</small><p className="big">${analysis.budget}<span>/day</span></p><p>Start small, test multiple creatives, then scale the winner.</p></article></div>
      <div className="sectiontitle"><div><div className="eyebrow">CREATIVE LAB</div><h3>Ad concepts to test</h3></div></div><div className="ads">{analysis.ads.map((a,i)=><article className="ad" key={i}><span>CONCEPT 0{i+1}</span><h3>{a.headline}</h3><p>{a.text}</p><strong>{a.cta} →</strong></article>)}</div>
      <div className="lower"><article><small>HOOKS</small>{analysis.hooks.map(h=><div className="line" key={h}>{h}</div>)}</article><article><small>TRACKING</small>{analysis.tracking.map(t=><div className="line" key={t}>✓ {t}</div>)}</article><article><small>NEXT AGENT ACTIONS</small>{analysis.nextSteps.map((n,i)=><div className="line" key={n}>{i+1}. {n}</div>)}</article></div>
      <div className="approval"><div><small>LAUNCH SAFETY</small><h3>Human approval required before ad spend</h3><p>AdPilot only creates a <b>PAUSED</b> Google Ads campaign after you explicitly approve it. It never activates spend automatically.</p><div className="connection">Google Ads: {adsStatus.connected ? `CONNECTED · ${adsStatus.customerId}` : adsStatus.configured ? 'NOT CONNECTED' : 'NOT CONFIGURED'}</div></div><div className="approval-actions"><button onClick={saveCampaign} disabled={saving}>{saving?'SAVING…':'SAVE CAMPAIGN DRAFT'}</button>{adsStatus.configured&&!adsStatus.connected&&<a className="button secondary" href="/api/google-ads/connect">CONNECT GOOGLE ADS</a>}{adsStatus.connected&&campaignId&&<button onClick={publishPaused} disabled={launching}>{launching?'CREATING…':'APPROVE & CREATE PAUSED CAMPAIGN'}</button>}</div></div>
    </section>}
    <footer>ADPILOT AI · GEMINI CAMPAIGN INTELLIGENCE · GOOGLE ADS · HUMAN-APPROVAL V3</footer>
  </main>
}
