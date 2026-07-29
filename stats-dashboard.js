const PERIODS=[7,30,90],n=v=>Number(v||0),div=(a,b)=>b?a/b:0;
const fmt=v=>{let x=n(v);return Math.abs(x)>=1e6?(x/1e6).toFixed(1).replace(".0","")+"M":Math.abs(x)>=1e3?(x/1e3).toFixed(1).replace(".0","")+"K":Math.round(x).toLocaleString("en-ZA")};
const pct=v=>`${n(v).toFixed(1)}%`;
const dur=ms=>{let s=Math.round(n(ms)/1000);if(!s)return"—";if(s<60)return`${s}s`;let m=Math.floor(s/60);if(m<60)return`${m}m ${s%60}s`;return`${Math.floor(m/60)}h ${m%60}m`};
const sum=(a,k)=>a.reduce((t,r)=>t+n(r[k]),0);
const since=d=>{let x=new Date();x.setDate(x.getDate()-d);return x.toISOString()};
const cap=s=>{s=String(s||"Untitled post").replace(/\s+/g," ").trim();return s.length>70?s.slice(0,70)+"…":s};
const metric=(a,b,c)=>`<article class=statsMetric><span>${a}</span><strong>${b}</strong><small>${c||""}</small></article>`;

function calc(rows,account){
 const posts=rows.length,views=sum(rows,"views"),reach=sum(rows,"reach"),likes=sum(rows,"likes"),comments=sum(rows,"comments"),shares=sum(rows,"shares"),saves=sum(rows,"saves"),watch=sum(rows,"watch_time");
 const eng=rows.reduce((t,r)=>t+n(r.total_interactions||(n(r.likes)+n(r.comments)+n(r.shares)+n(r.saves))),0);
 const wr=rows.filter(r=>n(r.avg_watch_time)>0),base=wr.reduce((t,r)=>t+n(r.views),0);
 const avgWatch=base?wr.reduce((t,r)=>t+n(r.avg_watch_time)*n(r.views),0)/base:div(sum(wr,"avg_watch_time"),wr.length);
 const viewers=n(account?.period_reach)||null;
 return{posts,views,reach,likes,comments,shares,saves,watch,eng,avgWatch,viewers,followers:n(account?.followers),avgViews:div(views,posts),avgReach:div(reach,posts),er:reach?eng/reach*100:0,shareRate:reach?shares/reach*100:0,vpv:viewers?views/viewers:null}
}
function table(rows){
 const a=[...rows].sort((x,y)=>n(y.views)-n(x.views)).slice(0,10);
 if(!a.length)return`<div class=statsEmpty>No posts found in this period.</div>`;
 return`<div class=statsTableWrap><table class=statsTable><thead><tr><th>CONTENT</th><th>VIEWS</th><th>REACH</th><th>WATCH</th><th>ENG.</th><th>ER</th></tr></thead><tbody>${a.map(r=>{let e=n(r.total_interactions||(n(r.likes)+n(r.comments)+n(r.shares)+n(r.saves))),er=n(r.reach)?e/n(r.reach)*100:0;return`<tr><td>${r.permalink?`<a href="${r.permalink}" target=_blank rel=noopener>${cap(r.caption)}</a>`:cap(r.caption)}<small>${r.media_type||"POST"} · ${new Date(r.published_at).toLocaleDateString("en-ZA",{day:"2-digit",month:"short"})}</small></td><td>${fmt(r.views)}</td><td>${fmt(r.reach)}</td><td>${dur(r.watch_time)}</td><td>${fmt(e)}</td><td>${pct(er)}</td></tr>`}).join("")}</tbody></table></div>`
}
export async function renderStatsDashboard(root,sb,initialPlatform="instagram"){
 if(!root||!sb)return;let platform=initialPlatform,period=30;
 async function load(){
  root.innerHTML=`<section class=statsPage><div class=statsLoading>LOADING STATS…</div></section>`;
  const[p,a]=await Promise.all([
   sb.from("social_post_stats").select("*").eq("platform",platform).gte("published_at",since(period)).order("published_at",{ascending:false}),
   sb.from("social_account_daily").select("*").eq("platform",platform).order("snapshot_date",{ascending:false}).limit(1).maybeSingle()
  ]);
  if(p.error){root.innerHTML=`<section class=statsPage><div class=statsError>${p.error.message}</div></section>`;return}
  const rows=p.data||[],account=a.data||null,m=calc(rows,account);
  root.innerHTML=`<section class=statsPage>
   <div class=statsHero><div><span class=statsEyebrow>HYPRFY / PERSONAL BRAND INTELLIGENCE</span><h2>STATS</h2><p>Understand what is moving your personal brand.</p></div>
   <div class=statsControls><div class=statsToggle>${["instagram","facebook"].map(x=>`<button data-platform=${x} class=${platform===x?"active":""}>${x.toUpperCase()}</button>`).join("")}</div><div class=statsToggle>${PERIODS.map(x=>`<button data-period=${x} class=${period===x?"active":""}>${x}D</button>`).join("")}</div></div></div>
   <div class=statsAccount><b>${platform.toUpperCase()}</b><span>${m.followers?fmt(m.followers)+" followers":"Follower data unavailable"}</span><i>ORGANIC</i></div>
   <div class=statsSectionHead><span>ATTENTION</span><h3>HOW MUCH ATTENTION DID THE CONTENT EARN?</h3></div>
   <div class=statsGrid>${metric("TOTAL VIEWS",fmt(m.views),`${m.posts} posts in ${period} days`)}${metric("VIEWERS",m.viewers?fmt(m.viewers):"—",m.viewers?"Unique accounts reached":"Account reach awaiting Meta")}${metric("VIEWS / VIEWER",m.vpv?m.vpv.toFixed(2)+"x":"—","Repeat consumption")}${metric("WATCH TIME",dur(m.watch),"Video / Reel watch time")}${metric("AVG WATCH TIME",dur(m.avgWatch),"Average video watch")}${metric("FOLLOWERS",fmt(m.followers),"Current audience")}</div>
   <div class=statsSectionHead><span>ENGAGEMENT</span><h3>WHAT DID PEOPLE DO WITH THE CONTENT?</h3></div>
   <div class=statsGrid>${metric("ENGAGEMENTS",fmt(m.eng),"Likes + comments + shares + saves")}${metric("ENGAGEMENT RATE",pct(m.er),"Engagements ÷ summed post reach")}${metric("SHARES",fmt(m.shares),m.reach?pct(m.shareRate)+" share rate":"Distribution signal")}${metric("SAVES",fmt(m.saves),"Intent / utility signal")}${metric("COMMENTS",fmt(m.comments),"Conversation")}${metric("LIKES",fmt(m.likes),"Lightweight response")}</div>
   <div class=statsSectionHead><span>CONTENT</span><h3>WHAT IS THE OUTPUT DOING?</h3></div>
   <div class="statsGrid statsGridContent">${metric("AVG VIEWS / POST",fmt(m.avgViews),`${m.posts} posts in period`)}${metric("AVG REACH / POST",fmt(m.avgReach),"Average post reach")}${metric("POSTS PUBLISHED",fmt(m.posts),`Last ${period} days`)}${metric("SUMMED POST REACH",fmt(m.reach),"Not unique account reach")}</div>
   <div class=statsSectionHead><span>TOP CONTENT</span><h3>WHAT IS WINNING ATTENTION?</h3></div>${table(rows)}
   <div class=statsNote><b>DATA NOTE</b><p>VIEWERS uses true account-level reach only when Meta returns it. Until then it shows — rather than incorrectly adding post reach together.</p></div>
  </section>`;
  root.querySelectorAll("[data-platform]").forEach(b=>b.onclick=async()=>{platform=b.dataset.platform;await load()});
  root.querySelectorAll("[data-period]").forEach(b=>b.onclick=async()=>{period=+b.dataset.period;await load()});
 }
 await load()
}
