import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function db(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key) return null;
 return createClient(url,key,{auth:{persistSession:false}});
}

export async function POST(req:Request){
 try{
  const body=await req.json();
  if(!body.url||!body.brand||!body.analysis) return NextResponse.json({error:'Campaign data is incomplete.'},{status:400});
  const client=db();
  if(!client) return NextResponse.json({saved:false,localOnly:true,message:'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'});
  const {data,error}=await client.from('campaigns').insert({brand:body.brand,url:body.url,goal:body.goal||'Get traffic',country:body.country||'Nigeria',daily_budget:Number(body.budget||0),status:'draft',ai_provider:body.aiProvider||'gemini',blueprint:body.analysis}).select('id,created_at').single();
  if(error) throw error;
  return NextResponse.json({saved:true,campaign:data});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to save campaign.'},{status:500})}
}
