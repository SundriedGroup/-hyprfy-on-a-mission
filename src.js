import{createClient}from"@supabase/supabase-js";
import"./style.css";
import"./intelligence.css";
import{renderIntelligence}from"./intelligence-dashboard.js";
import{renderSocialStats}from"./stats-dashboard.js";
import"./stats-dashboard.css";

const sb=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
const S={tab:"weeks",view:innerWidth>=900?"board":"day",wi:0,di:0,ch:"instagram",weeks:[],events:[],moments:[],session:null,editing:false,checkin:false,postedFilter:"all"};
const $=x=>document.getElementById(x),V=()=>document.getElementById("view"),E=(x="")=>String(x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])),NL=x=>E(x||"").replaceAll("\n","<br>");
const DN=["MON","TUE","WED","THU","FRI","SAT","SUN"],CH=["instagram","threads","linkedin","substack","youtube"];
function date(start,i=0){let d=new Date(start+"T12:00:00");d.setDate(d.getDate()+i);return d}
function ds(start,i=0){return date(start,i).toLocaleDateString("en-ZA",{day:"2-digit",month:"short"}).toUpperCase()}
function iso(start,i){return date(start,i).toISOString().slice(0,10)}
function shell(){app.innerHTML=`<header><div><span class=kicker>HYPRFY / LIFE OS</span><h1>ON A MISSION</h1><em>More life. Less excuses.</em></div><span id=status>SYNCED</span><nav>${["weeks","intelligence","calendar","moments"].map(x=>`<button data-tab=${x} class=${S.tab===x?"active":""}>${x}</button>`).join("")}</nav></header><main id=view></main>`;document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{S.tab=b.dataset.tab;shell();render()})}
function adapt(d){return d.adaptive||{actual:[]}}
function prod(d){return d.production||{status:"planned",captured:[]}}
async function saveDays(w){let{error}=await sb.from("weeks").update({days:w.days}).eq("start_date",w.start_date);if(error){alert(error.message);return false}return true}
async function setStatus(w,d,status){d.production={...prod(d),status};if(await saveDays(w))weeks()}
async function toggleCapture(w,d,i){let pr=prod(d),a=[...(pr.captured||[])],k=a.indexOf(i);k>=0?a.splice(k,1):a.push(i);d.production={...pr,captured:a};if(await saveDays(w))weeks()}
function editField(label,path,value,multi=true){return`<label class=editfield><span>${label}</span>${multi?`<textarea data-edit="${path}">${E(value||"")}</textarea>`:`<input data-edit="${path}" value="${E(value||"")}">`}</label>`}
function setPath(obj,path,val){let a=path.split("."),x=obj;for(let i=0;i<a.length-1;i++)x=x[a[i]]??={};x[a.at(-1)]=val}
async function saveEdits(w,d){document.querySelectorAll("[data-edit]").forEach(el=>setPath(d,el.dataset.edit,el.value||null));if(await saveDays(w)){S.editing=false;weeks()}}
function checkinBox(w,d){let a=adapt(d);return`<section class=checkin><div class=checkhead><div><span class=eyebrow>ADAPTIVE PRODUCER</span><h3>WHAT CHANGED?</h3></div><button id=togglecheck>${S.checkin?"CLOSE":"CHECK IN"}</button></div>${S.checkin?`<div class=checkbody><textarea id=checktext placeholder="Tell the producer what changed in plain language…"></textarea><div class=impact><span>SAVED AS ACTUAL</span><p>Your original plan stays intact. This update becomes part of what really happened and the developing weekly story.</p></div><button id=applycheck>SAVE CHECK-IN</button></div>`:""}${a.actual?.length?`<div class=actuals><span>ACTUAL / LIVE UPDATES</span>${a.actual.map(x=>`<article><small>${E(x.time||"")}</small><p>${NL(x.text)}</p></article>`).join("")}</div>`:""}</section>`}
async function saveCheckin(w,d){let t=$("checktext")?.value.trim();if(!t)return;let a=adapt(d),actual=[...(a.actual||[]),{time:new Date().toLocaleString("en-ZA",{weekday:"short",hour:"2-digit",minute:"2-digit"}),text:t}];d.adaptive={...a,actual};if(await saveDays(w)){S.checkin=false;weeks()}}
function storyState(w){let actual=[];w.days.forEach((d,i)=>(adapt(d).actual||[]).forEach(x=>actual.push(`${DN[i]}: ${x.text}`)));return`<section class=storystate><span class=eyebrow>LIVE STORY STATE</span><h3>${E(w.theme||"THIS WEEK")}</h3><p><b>WEEK QUESTION</b><br>${E(w.subtitle||"What does this week actually become?")}</p><p><b>REALITY SO FAR</b><br>${actual.length?actual.map(E).join("<br>"):"No live changes logged yet."}</p><p><b>PRODUCER RULE</b><br>Adapt the story to reality. Never manufacture footage, outcomes or lessons that did not happen.</p></section>`}
function post(p,ch){if(!p)return`<div class=post><p class=dim>No post planned.</p></div>`;let list=(n,a)=>Array.isArray(a)&&a.length?`<div class=brief><span>${n}</span><ul>${a.map(x=>`<li>${E(x)}</li>`).join("")}</ul></div>`:"";let spoken=p.spoken_line||p.script,type=p.spoken_type||"TO CAMERA / VOICEOVER";return`<div class=post><div class=format><small>${E(p.fmt||"")}</small><b>${E(p.concept||p.cap||"")}</b></div>${p.viewer_value?`<div class="brief value"><span>VIEWER VALUE</span><p>${NL(p.viewer_value)}</p></div>`:""}${p.plan?`<div class=brief><span>IDEA / PLAN</span><p>${NL(p.plan)}</p></div>`:""}${list("WHAT TO FILM",p.shots)}${spoken?`<div class="brief spoken"><span>${E(type)}</span><p>${NL(spoken)}</p></div>`:""}${list("EDIT / STRUCTURE",p.structure)}${p.cover_text?`<div class="brief cover"><span>COVER TEXT</span><h4>${NL(p.cover_text)}</h4></div>`:""}${p.onscreen?`<div class=brief><span>ON-SCREEN TEXT</span><p>${NL(p.onscreen)}</p></div>`:""}${p.cap?`<div class=brief><span>${ch==="threads"?"POST":"POST COPY"}</span><p class=copy>${NL(p.cap)}</p></div>`:""}${list("STORIES",p.stories)}${p.note?`<div class=brief><span>PRODUCTION NOTE</span><p>${NL(p.note)}</p></div>`:""}</div>`}

function contentStatus(d){return prod(d).status||"planned"}
function feedPlan(d){return d.post?.instagram||null}
function storyCount(d){return Array.isArray(feedPlan(d)?.stories)?feedPlan(d).stories.length:0}
function weekMetrics(w){
  let feed=w.days.filter(d=>feedPlan(d)&&feedPlan(d).fmt&&!/SKIP|NO PRIMARY|STORIES FIRST/i.test(feedPlan(d).fmt)).length;
  let published=w.days.filter(d=>contentStatus(d)==="published").length;
  let captured=w.days.filter(d=>["captured","edited","published"].includes(contentStatus(d))).length;
  let stories=w.days.reduce((n,d)=>n+storyCount(d),0);
  return{feed,published,captured,stories}
}
function top(w){return`<div class=topbar><div class=pills>${S.weeks.map((x,i)=>`<button data-w=${i} class=${i===S.wi?"active":""}>W${String(i+1).padStart(2,"0")} <small>${ds(x.start_date)}</small></button>`).join("")}<button id=new>+ NEW</button></div><div class=views>${[["board","PLAN"],["day","TODAY"],["posted","POSTED"],["episode","STORY"],["monthly","MONTHLY"]].map(([x,l])=>`<button data-v=${x} class=${S.view===x?"active":""}>${l}</button>`).join("")}</div></div>`}
function ephead(w){let m=weekMetrics(w);return`<section class=ephead><div><span class=eyebrow>WEEK OF ${ds(w.start_date)} — ${ds(w.start_date,6)}</span><h2>${E(w.theme)}</h2><em>${E(w.subtitle||"")}</em></div><div class=stats><span><b>${m.feed}</b> FEED PLANS</span><span><b>${m.stories}</b> STORY ASKS</span><span><b>${m.captured}/7</b> IN PRODUCTION</span><span><b>${m.published}</b> POSTED</span></div></section>`}
function card(d,i,w){
  let ev=S.events.find(e=>e.date===iso(w.start_date,i)),mo=S.moments.filter(m=>m.date===iso(w.start_date,i)),ig=feedPlan(d),pr=prod(d);
  let first=(d.film||[])[0],ask=ig?.shots?.[0]||first?.line||"Capture what actually happens.";
  return`<article class="daycol ${pr.status==="published"?"isposted":""} ${isToday(w.start_date,i)?"today":""}" data-open=${i}>
    <div class=dayhead><span>${DN[i]} ${ds(w.start_date,i).split(" ")[0]} ${isToday(w.start_date,i)?'<i>TODAY</i>':""}</span><b>${E(d.tag||d.title)}</b><small class="state ${E(pr.status)}">${E(pr.status)}</small></div>
    ${ev?`<div class="pc event"><span>EVENT</span><strong>${E(ev.title)}</strong></div>`:""}
    <div class="pc social"><span>POSTING PLAN</span><strong>${E(ig?.fmt||"STORIES / NO FEED")}</strong><p>${E(ig?.concept||"Stay present; publish only if earned.")}</p></div>
    <div class="pc captureask"><span>CAPTURE ASK</span><strong>${E(ask)}</strong><small>${(d.film||[]).length} production beats · ${storyCount(d)} story asks</small></div>
    ${mo.slice(0,1).map(m=>`<div class="pc moment"><span>LIVE MOMENT</span><strong>${E(m.title||m.text)}</strong></div>`).join("")}
    <button class=open data-open=${i}>OPEN PRODUCTION PLAN</button>
  </article>`
}
function board(w){return`${ephead(w)}<div class=boardlegend><span><i class=dot planned></i>PLANNED</span><span><i class=dot captured></i>CAPTURED</span><span><i class=dot edited></i>EDITED</span><span><i class=dot published></i>POSTED</span></div><section class=board>${w.days.map((d,i)=>card(d,i,w)).join("")}</section>`}
function productionPlan(d,captured){
  return (d.film||[]).map((f,i)=>`<div class="capture ${captured.includes(i)?"done":""}"><button data-cap=${i}>${captured.includes(i)?"✓":"○"}</button>${f.action?`<div class=action><span>CAPTURE / B-ROLL</span>${E(f.line)}</div>`:`<div class=slate><span>${E(f.meta||"TO CAMERA")}</span><p>“${E(f.line)}”</p></div>`}</div>`).join("")
}
function postingSummary(p){
 if(!p)return`<div class="postsummary emptyplan"><span>POSTING PLAN</span><strong>STORIES / NO FEED</strong><p>Stay present. Do not force a feed post.</p></div>`;
 return`<div class=postsummary><span>POSTING PLAN</span><strong>${E(p.fmt||"")}</strong><h4>${E(p.concept||"")}</h4>${p.viewer_value?`<p>${NL(p.viewer_value)}</p>`:""}</div>`
}
function day(w){
 let d=w.days[S.di],p=S.ch==="youtube"?d.youtube:d.post?.[S.ch],ig=feedPlan(d),pr=prod(d),captured=pr.captured||[],film=productionPlan(d,captured);
 let editor="";if(S.editing&&p){let base=S.ch==="youtube"?"youtube":`post.${S.ch}`;editor=`<div class=editor><h3>EDIT CONTENT</h3>${editField("FORMAT",base+".fmt",p.fmt,false)}${editField("CONCEPT",base+".concept",p.concept,false)}${editField("VIEWER VALUE",base+".viewer_value",p.viewer_value)}${editField("IDEA / PLAN",base+".plan",p.plan)}${editField("TO CAMERA / VOICEOVER",base+".spoken_line",p.spoken_line||p.script)}${editField("COVER TEXT",base+".cover_text",p.cover_text)}${editField("ON-SCREEN TEXT",base+".onscreen",p.onscreen)}${editField("POST COPY",base+".cap",p.cap)}<div class=editactions><button id=saveedit>SAVE CHANGES</button><button id=canceledit>CANCEL</button></div></div>`}
 return`<section class=daytitle><span class=eyebrow>W${String(S.wi+1).padStart(2,"0")} / ${E(w.theme)}</span><h2>${E(d.title)}</h2><em>${E(d.tag||"")}</em><div class=statusbar><span>CONTENT STATUS</span>${["planned","captured","edited","published"].map(x=>`<button data-status=${x} class=${pr.status===x?"active":""}>${x}</button>`).join("")}</div></section>
 ${checkinBox(w,d)}
 <div class="pills days">${DN.map((x,i)=>`<button data-d=${i} class=${i===S.di?"active":""}>${x}</button>`).join("")}</div>
 <section class=todaygrid>
   <div class=todaymain>
     ${postingSummary(ig)}
     <section class=worksection><div class=sectionhead><span>01</span><div><b>PRODUCTION PLAN</b><small>${captured.length}/${d.film?.length||0} CAPTURED</small></div></div>${film||'<p class=dim>No production beats planned.</p>'}</section>
     <section class=worksection><div class=sectionhead><span>02</span><div><b>POSTING PLAN</b><small>SCRIPT · VISUALS · COPY</small></div></div><div class=socialtop><div class="pills channels">${CH.filter(x=>x!=="youtube"||S.di===6).map(x=>`<button data-c=${x} class=${x===S.ch?"active":""}>${x}</button>`).join("")}</div><button id=editcontent>${S.editing?"EDITING":"EDIT CONTENT"}</button></div>${S.editing?editor:post(p,S.ch)}</section>
   </div>
   <aside class=todayside>
     <div class=sidecard><span>CAPTURE ASK</span><strong>${E(ig?.shots?.[0]||(d.film||[])[0]?.line||"Capture what actually happens.")}</strong>${Array.isArray(ig?.shots)?`<ul>${ig.shots.slice(1,5).map(x=>`<li>${E(x)}</li>`).join("")}</ul>`:""}</div>
     ${ig?.spoken_line||ig?.script?`<div class="sidecard scriptpeek"><span>SCRIPT</span><p>${NL(ig.spoken_line||ig.script)}</p></div>`:""}
     ${ig?.cap?`<div class=sidecard><span>POST COPY</span><p>${NL(ig.cap)}</p></div>`:""}
     ${Array.isArray(ig?.stories)?`<div class=sidecard><span>STORIES</span><ul>${ig.stories.map(x=>`<li>${E(x)}</li>`).join("")}</ul></div>`:""}
   </aside>
 </section>`
}
function posted(w){
 let rows=w.days.map((d,i)=>({d,i,p:feedPlan(d),pr:prod(d)})).filter(x=>S.postedFilter==="all"||x.pr.status===S.postedFilter);
 return`${ephead(w)}<section class=postedpage><div class=postedhead><div><span class=eyebrow>CONTENT HISTORY</span><h3>WHAT SHIPPED?</h3></div><div class="pills postedfilters">${["all","planned","captured","edited","published"].map(x=>`<button data-pf=${x} class=${S.postedFilter===x?"active":""}>${x}</button>`).join("")}</div></div><div class=postedlist>${rows.map(({d,i,p,pr})=>`<article class=postedrow data-open=${i}><div class=posteddate><b>${DN[i]}</b><span>${ds(w.start_date,i)}</span></div><div class=postedstory><small>${E(p?.fmt||"STORIES / NO FEED")}</small><strong>${E(p?.concept||d.tag||d.title)}</strong><p>${E(p?.cover_text||p?.onscreen||p?.cap||"")}</p></div><div class="state ${E(pr.status)}">${E(pr.status)}</div><button class=open data-open=${i}>OPEN</button></article>`).join("")||'<p class=dim>No items in this view.</p>'}</div></section>`
}
function episode(w){let C=[["COLD OPEN","Strongest moments from the finished week",6],["01 — BACK IN MOTION","10km confidence + Monday world",0],["02 — THE PLAN CHANGES","Reality interrupts the plan",1],["03 — THE WORK","Office + Rexona + R&D workshop",3],["04 — PEOPLE BUILDING THINGS","Coastal Coffee / Craig",4],["05 — MORE LIFE","Family / ordinary Saturday",5],["REFLECTION + OUTRO","What the week actually showed you",6]];return`${ephead(w)}${storyState(w)}<section class=timeline>${C.map(([a,b,i],n)=>`<button data-open=${i}><span>${String(n+1).padStart(2,"0")}</span><div><b>${a}</b><p>${b}</p></div></button>`).join("")}</section>`}
function monthly(w){return`<section class=ephead><div><span class=eyebrow>MONTHLY WRAP / JULY 2026</span><h2>POSTCARDS FROM JULY</h2><em>A visual journal of the moments that made the month.</em></div></section><section class=monthly><div class=monthlyhero><span>MONTHLY PROPERTY</span><h3>POSTCARDS FROM JULY</h3><p>Not a list of achievements. A collection of moments that made July feel like July.</p></div><div class=monthlygrid>${[["DRAKENSBERG","Adventure / family / getting outside"],["COFFEE DATES","Relationships / slowing down / connection"],["SA RUGBY CAPTAIN’S RUN","Career / access / behind the work"],["SOCIAL RUNNERS 10KM","Getting back in motion"]].map((x,i)=>`<article><span>0${i+1}</span><h4>${x[0]}</h4><p>${x[1]}</p></article>`).join("")}</div><div class="brief monthlybrief"><span>CAROUSEL SEQUENCE</span><ol><li>Cover — POSTCARDS FROM JULY</li><li>Big Drakensberg landscape</li><li>Candid Drakensberg / family moment</li><li>Coffee date</li><li>SA Rugby captain’s run</li><li>Behind-the-scenes rugby detail</li><li>Ordinary July moment</li><li>Social Runners 10km</li><li>Finish / post-run moment</li><li>Quiet closing image</li></ol></div><div class="brief cover"><span>COVER TEXT</span><h4>POSTCARDS FROM JULY</h4></div><div class=brief><span>POST COPY</span><p class=copy>Postcards from July.<br><br>Mountains. Coffee dates. A little behind-the-scenes rugby. And my first 10km in a long time.<br><br>Nothing particularly connected about any of it.<br><br>Except maybe that’s the point.<br><br>More time doing things. More time with good people. More reasons to get outside. And slowly finding my way back into training again.<br><br>A pretty good July.<br><br>More life. Less excuses.</p></div></section>`}
function weeks(){let w=S.weeks[S.wi];if(!w)return V().innerHTML="<p>No week found.</p>";V().innerHTML=top(w)+(S.view==="board"?board(w):S.view==="posted"?posted(w):S.view==="episode"?episode(w):S.view==="monthly"?monthly(w):day(w));document.querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>{S.wi=+b.dataset.w;weeks()});document.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>{S.view=b.dataset.v;weeks()});document.querySelectorAll("[data-pf]").forEach(b=>b.onclick=()=>{S.postedFilter=b.dataset.pf;weeks()});document.querySelectorAll("[data-open]").forEach(b=>b.onclick=e=>{e.stopPropagation();S.di=+b.dataset.open;S.view="day";weeks()});document.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{S.di=+b.dataset.d;S.ch="instagram";S.checkin=false;weeks()});document.querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{S.ch=b.dataset.c;S.editing=false;weeks()});document.querySelectorAll("[data-status]").forEach(b=>b.onclick=()=>setStatus(w,w.days[S.di],b.dataset.status));document.querySelectorAll("[data-cap]").forEach(b=>b.onclick=()=>toggleCapture(w,w.days[S.di],+b.dataset.cap));if($("editcontent"))$("editcontent").onclick=()=>{S.editing=!S.editing;weeks()};if($("saveedit"))$("saveedit").onclick=()=>saveEdits(w,w.days[S.di]);if($("canceledit"))$("canceledit").onclick=()=>{S.editing=false;weeks()};if($("togglecheck"))$("togglecheck").onclick=()=>{S.checkin=!S.checkin;weeks()};if($("applycheck"))$("applycheck").onclick=()=>saveCheckin(w,w.days[S.di]);if($("new"))$("new").onclick=()=>alert("AI week generation is the next beta build.")}

/* V2 Intelligence */
async function intelligence(){
  await renderIntelligence(sb,V(),{platform:"instagram",days:30});
}

function calendar(){V().innerHTML=`<section class=page><span class=eyebrow>KNOWN DATES</span><h2>CALENDAR</h2><form id=ef><input id=ed type=date required><input id=et placeholder="Event title" required><textarea id=ex placeholder="Description"></textarea><button>Add event</button></form>${S.events.map(e=>`<article class=list><span>${E(e.date)}</span><div><b>${E(e.title)}</b><p>${E(e.description||"")}</p></div><button data-del="${e.id}:events">DELETE</button></article>`).join("")}</section>`;ef.onsubmit=async e=>{e.preventDefault();let{error}=await sb.from("events").insert({date:ed.value,title:et.value,description:ex.value||null});if(error)return alert(error.message);await load();calendar()};dels()}
function moments(){V().innerHTML=`<section class=page><span class=eyebrow>QUICK CAPTURE</span><h2>MOMENTS</h2><form id=mf><input id=md type=date><input id=mt placeholder="Moment title" required><textarea id=mx placeholder="Description" required></textarea><button>Add moment</button></form>${S.moments.map(m=>`<article class=list><span>${E(m.date||"UNDATED")}</span><div><b>${E(m.title||m.text)}</b><p>${E(m.description||m.text||"")}</p></div><button data-del="${m.id}:moments">DELETE</button></article>`).join("")}</section>`;mf.onsubmit=async e=>{e.preventDefault();let{error}=await sb.from("moments").insert({date:md.value||null,title:mt.value,description:mx.value,text:mt.value});if(error)return alert(error.message);await load();moments()};dels()}
function dels(){document.querySelectorAll("[data-del]").forEach(b=>b.onclick=async()=>{let[id,t]=b.dataset.del.split(":");if(confirm("Delete?")){await sb.from(t).delete().eq("id",id);await load();render()}})}

function render(){
  if(!S.session){
    V().innerHTML=`<section class=page><h2>SIGN IN</h2><form id=login><input id=email type=email placeholder=Email required><input id=pw type=password placeholder=Password required><button>Sign in</button></form></section>`;
    login.onsubmit=async e=>{e.preventDefault();let{error}=await sb.auth.signInWithPassword({email:email.value,password:pw.value});if(error)alert(error.message)};
    return;
  }
  if(S.tab==="intelligence")return intelligence();
  return ({weeks,calendar,moments}[S.tab]||weeks)();
}

async function load(){let[e,m,w]=await Promise.all([sb.from("events").select("*").order("date"),sb.from("moments").select("*").order("created_at",{ascending:false}),sb.from("weeks").select("*").order("start_date")]);if(e.error||m.error||w.error){console.error("LOAD ERROR",e.error,m.error,w.error);throw(e.error||m.error||w.error)}S.events=e.data||[];S.moments=m.data||[];S.weeks=w.data||[]}
async function boot(){shell();S.session=(await sb.auth.getSession()).data.session;if(S.session)await load();render();sb.auth.onAuthStateChange(async(_,s)=>{S.session=s;if(s)await load();shell();render()})}boot();
