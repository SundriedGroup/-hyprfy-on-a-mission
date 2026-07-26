import { createClient } from "@supabase/supabase-js";
import "./style.css";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = url && key ? createClient(url, key) : null;

const seedWeek = {
  week_start: "2026-07-27",
  title: "Back in motion",
  mission: "Get moving again without pretending the comeback is already complete.",
  desired_ending: "Finish the week with a real episode built from work, training, coffee, family and the Social Runners 10km."
};

const state = { tab:"weeks", day:0, channel:"instagram", session:null, weeks:[seedWeek], events:[], moments:[], status:"Ready" };
const days = ["MON","TUE","WED","THU","FRI","SAT","SUN"];
const channels = ["instagram","threads","linkedin","substack","youtube"];

const demo = [
 {title:"MONDAY",tag:"back in motion",film:[
  {meta:"HOME — MORNING",line:"First proper week back at this. I’m not trying to suddenly become a different person overnight... I just want to start stacking the days again.",action:false},
  {meta:"TRAINING — AM",line:"Phone down. Shoes on. Capture the first RunBoss session: warm-up, watch start, one hard rep, post-run face.",action:true},
  {meta:"OFFICE — DAY",line:"There’s also a Rexona Energy Boost launch happening this week, so work and the mission are crossing over a bit. That’s kind of the point of documenting this properly.",action:false}
 ],post:{instagram:{fmt:"REEL · 25–35 sec · morning + training + office",cap:"Back in motion.\n\nNot a transformation. Not a 30-day challenge. Just getting back to doing the things I said mattered.\n\nWork. Run. Create. Family. Repeat.\n\nMore life. Less excuses."},threads:{fmt:"RAW TEXT",cap:"Starting again is less dramatic than people make it look. Mostly it’s just doing today’s session."},linkedin:{fmt:"TEXT",cap:null,note:"Skip today — keep Monday personal."},substack:{fmt:"JOURNAL NOTE",cap:null,note:"Capture the thought; save the full journal for Sunday."}}},
 ...Array.from({length:6},(_,i)=>({title:["TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"][i],tag:["keep showing up","midweek reality","nothing fancy","coffee and community","race eve","episode live"][i],film:[{meta:i===5?"VOICEOVER — COLD OPEN":"DAY — DOCUMENTARY",line:i===5?"A week ago this was just a plan. This is what actually happened.":"Film what is genuinely happening today. One honest check-in, useful B-roll and the small details that make the day feel real.",action:false}],post:{instagram:{fmt:i===5?"REEL · EPISODE LAUNCH":"REEL / PHOTO",cap:i===5?"Episode 001 is live.\n\nBack in motion.\n\nMore life. Less excuses.":"Document the day rather than manufacturing a lesson."},threads:{fmt:"RAW TEXT",cap:"One observation from the day."},linkedin:{fmt:"TEXT",cap:null,note:"Only post when there is a genuine business angle."},substack:{fmt:i===5?"WEEKLY JOURNAL":"JOURNAL NOTE",cap:i===5?"Week 01 — Back in motion. The full story behind the week.":null,note:i===5?null:"Hold for Sunday."}},...(i===5?{youtube:{fmt:"PUBLISH",cap:"ON A MISSION 001 — Back in Motion"}}:{})}))
];

function el(id){return document.getElementById(id)}
function fmtDate(d){return new Date(d+"T12:00:00").toLocaleDateString("en-ZA",{day:"2-digit",month:"short"})}
function setStatus(s,t=""){state.status=s; const n=el("status"); if(n){n.textContent=s;n.className="status "+t}}

function shell(){
 document.querySelector("#app").innerHTML=`
 <header><div class="brand"><span class="kicker">HYPRFY / LIFE OS</span><h1>ON A MISSION</h1><em>More life. Less excuses.</em></div>
 <div id="status" class="status">Ready</div>
 <nav>${["weeks","calendar","moments"].map(x=>`<button data-tab="${x}" class="${state.tab===x?"active":""}">${x}</button>`).join("")}</nav></header>
 <main id="view"></main>`;
 document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{state.tab=b.dataset.tab;shell();render()});
}
function render(){({weeks:renderWeeks,calendar:renderCalendar,moments:renderMoments})[state.tab]()}
function renderWeeks(){
 const d=demo[state.day], p=d.post[state.channel] || d.youtube;
 el("view").innerHTML=`
 <div class="scroll pills"><button class="active">W01 <small>27 JUL</small></button><button class="new">+ NEW</button></div>
 <section class="weekhead"><span class="eyebrow">W01 / ${seedWeek.title}</span><h2>${d.title}</h2><em>${d.tag}</em></section>
 <div class="scroll pills days">${days.map((x,i)=>`<button data-day="${i}" class="${state.day===i?"active":""}">${x}</button>`).join("")}</div>
 <section><h3>FILM</h3>${d.film.map(f=>f.action?`<div class="action"><span>ACTION / B-ROLL</span>${f.line}</div>`:`<div class="slate"><span>${f.meta}</span><p>“${f.line}”</p></div>`).join("")}</section>
 <section><h3>POST</h3><div class="scroll pills channels">${channels.filter(c=>c!=="youtube"||state.day===6).map(c=>`<button data-channel="${c}" class="${state.channel===c?"active":""}">${c}</button>`).join("")}</div>
 <div class="post"><span>${p?.fmt||"NO POST"}</span>${p?.cap?`<p>${p.cap.replaceAll("\n","<br>")}</p>`:`<p class="dim">${p?.note||"No post planned."}</p>`}</div></section>`;
 document.querySelectorAll("[data-day]").forEach(b=>b.onclick=()=>{state.day=+b.dataset.day;if(state.day!==6&&state.channel==="youtube")state.channel="instagram";renderWeeks()});
 document.querySelectorAll("[data-channel]").forEach(b=>b.onclick=()=>{state.channel=b.dataset.channel;renderWeeks()});
}
function renderCalendar(){
 el("view").innerHTML=`<section class="page"><span class="eyebrow">KNOWN DATES</span><h2>CALENDAR</h2><form id="eventForm"><input id="eventDate" type="date" required><input id="eventTitle" placeholder="Race, meeting, launch..." required><button>Add event</button></form><div id="eventList">${state.events.length?state.events.map(e=>`<article class="list"><span>${e.event_date}</span><b>${e.title}</b><button data-del-event="${e.id}">DELETE</button></article>`).join(""):`<p class="empty">Nothing logged yet.</p>`}</div></section>`;
 el("eventForm").onsubmit=addEvent; document.querySelectorAll("[data-del-event]").forEach(b=>b.onclick=()=>del("events",b.dataset.delEvent));
}
function renderMoments(){
 el("view").innerHTML=`<section class="page"><span class="eyebrow">QUICK CAPTURE</span><h2>MOMENTS</h2><form id="momentForm"><input id="momentDate" type="date"><textarea id="momentText" placeholder="Something worth filming, saying or remembering..." required></textarea><button>Add moment</button></form><div>${state.moments.length?state.moments.map(m=>`<article class="list"><span>${m.moment_date||"UNDATED"}</span><b>${m.story||m.title}</b><button data-del-moment="${m.id}">DELETE</button></article>`).join(""):`<p class="empty">No moments captured yet.</p>`}</div></section>`;
 el("momentForm").onsubmit=addMoment; document.querySelectorAll("[data-del-moment]").forEach(b=>b.onclick=()=>del("moments",b.dataset.delMoment));
}
async function addEvent(e){e.preventDefault();if(!supabase||!state.session)return setStatus("Sign-in required","err");let {error}=await supabase.from("events").insert({user_id:state.session.user.id,event_date:el("eventDate").value,title:el("eventTitle").value});if(error)return setStatus(error.message,"err");await load();renderCalendar()}
async function addMoment(e){e.preventDefault();if(!supabase||!state.session)return setStatus("Sign-in required","err");let {error}=await supabase.from("moments").insert({user_id:state.session.user.id,moment_date:el("momentDate").value||new Date().toISOString().slice(0,10),story:el("momentText").value});if(error)return setStatus(error.message,"err");await load();renderMoments()}
async function del(table,id){if(!supabase)return;await supabase.from(table).delete().eq("id",id);await load();render()}
async function load(){
 if(!supabase)return setStatus("Local demo","warn");
 const {data:{session}}=await supabase.auth.getSession();state.session=session;
 if(!session)return setStatus("Demo · auth not connected","warn");
 setStatus("Syncing","warn");
 const [e,m,w]=await Promise.all([supabase.from("events").select("*").order("event_date"),supabase.from("moments").select("*").order("moment_date",{ascending:false}),supabase.from("weeks").select("*").order("week_start")]);
 if(e.error||m.error||w.error)return setStatus("Connection error","err");
 state.events=e.data;state.moments=m.data;state.weeks=w.data.length?w.data:[seedWeek];setStatus("Synced");
}
shell();render();load();
