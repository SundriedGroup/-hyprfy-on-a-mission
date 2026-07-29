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
 const engagements=rows.reduce((t,r)=>t+n(r.total_interactions||(n(r.likes)+n(r.comments)+n(r.shares)+n(r.saves))),0);
 const watchRows=rows.filter(r=>n(r.avg_watch_time)>0),watchViews=watchRows.reduce((t,r)=>t+n(r.views),0);
 const avgWatch=watchViews?watchRows.reduce((t,r)=>t+n(r.avg_watch_time)*n(r.views),0)/watchViews:div(sum(watchRows,"avg_watch_time"),watchRows.length);
 const viewers=n(account?.period_reach)||0;
 return{posts,views,reach,likes,comments,shares,saves,watch,engagements,avgWatch,viewers,followers:n(account?.followers),avgViews:div(views,posts),avgReach:div(reach,posts),engagementRate:reach?engagements/reach*100:0}
}
function leaderboard(rows){
 const ranked=[...rows].sort((a,b)=>n(b.views)-n(a.views));
 if(!ranked.length)return`<div class=statsEmpty>No posts found in this period.</div>`;
 return`<div class=statsTableWrap><table class=statsTable><thead><tr><th>#</th><th>CONTENT</th><th>VIEWS</th><th>REACH</th><th>WATCH TIME</th><th>ENGAGEMENTS</th><th>ER</th></tr></thead><tbody>${ranked.map((r,i)=>{let e=n(r.total_interactions||(n(r.likes)+n(r.comments)+n(r.shares)+n(r.saves))),er=n(r.reach)?e/n(r.reach)*100:0;return`<tr><td>${String(i+1).padStart(2,"0")}</td><td>${r.permalink?`<a href="${r.permalink}" target=_blank rel=noopener>${cap(r.caption)}</a>`:cap(r.caption)}<small>${r.media_type||"POST"} · ${new Date(r.published_at).toLocaleDateString("en-ZA",{day:"2-digit",month:"short"})}</small></td><td>${fmt(r.views)}</td><td>${fmt(r.reach)}</td><td>${dur(r.watch_time)}</td><td>${fmt(e)}</td><td>${pct(er)}</td></tr>`}).join("")}</tbody></table></div>`
}

export async function renderStatsDashboard(root,sb,initialPlatform="instagram"){
 if(!root||!sb)return;
 let platform=initialPlatform,period=30;
 async function load(){
  root.innerHTML=`<section class=statsPage><div class=statsLoading>LOADING STATS…</div></section>`;
  const[p,a]=await Promise.all([
   sb.from("social_post_stats").select("*").eq("platform",platform).gte("published_at",since(period)).order("published_at",{ascending:false}),
   sb.from("social_account_daily").select("*").eq("platform",platform).order("snapshot_date",{ascending:false}).limit(1).maybeSingle()
  ]);
  if(p.error){root.innerHTML=`<section class=statsPage><div class=statsError>${p.error.message}</div></section>`;return}
  const rows=p.data||[],account=a.data||null,m=calc(rows,account);
  root.innerHTML=`<section class=statsPage>
   <div class=statsHero>
    <div><span class=statsEyebrow>HYPRFY / PERSONAL BRAND INTELLIGENCE</span><h2>STATS</h2><p>Understand what is moving your personal brand.</p></div>
    <div class=statsControls>
     <div class=statsToggle>${["instagram","facebook"].map(x=>`<button data-platform=${x} class=${platform===x?"active":""}>${x.toUpperCase()}</button>`).join("")}</div>
     <div class=statsToggle>${PERIODS.map(x=>`<button data-period=${x} class=${period===x?"active":""}>${x}D</button>`).join("")}</div>
    </div>
   </div>

   <div class=statsAccount><b>${platform.toUpperCase()}</b><span>${m.followers?fmt(m.followers)+" followers":"Follower data unavailable"}</span><i>ORGANIC</i></div>

   <div class=statsSectionHead><span>ATTENTION</span><h3>HOW MUCH ATTENTION DID THE CONTENT EARN?</h3></div>
   <div class="statsGrid attentionGrid">
    ${metric("TOTAL VIEWS",fmt(m.views),`Across ${m.posts} published posts`)}
    ${metric("VIEWERS / REACH",m.viewers?fmt(m.viewers):"—",m.viewers?"Unique accounts reached":"Awaiting Meta account reach")}
    ${metric("WATCH TIME",dur(m.watch),"Total video watch time")}
    ${metric("AVG WATCH TIME",dur(m.avgWatch),"Average watch per view")}
   </div>

   <div class=statsSectionHead><span>ENGAGEMENT</span><h3>HOW DID PEOPLE RESPOND?</h3></div>
   <div class="statsGrid engagementGrid">
    ${metric("TOTAL ENGAGEMENTS",fmt(m.engagements),"Likes + comments + shares + saves")}
    ${metric("ENGAGEMENT RATE",pct(m.engagementRate),"Engagements ÷ post reach")}
    ${metric("SHARES",fmt(m.shares),"Distribution signal")}
    ${metric("SAVES",fmt(m.saves),"Utility / intent signal")}
    ${metric("COMMENTS",fmt(m.comments),"Conversation")}
    ${metric("LIKES",fmt(m.likes),"Lightweight response")}
   </div>

   <div class=statsSectionHead><span>CONTENT</span><h3>HOW IS THE OUTPUT PERFORMING?</h3></div>
   <div class="statsGrid contentGrid">
    ${metric("AVG VIEWS / POST",fmt(m.avgViews),`${m.posts} posts in period`)}
    ${metric("AVG REACH / POST",fmt(m.avgReach),"Average post reach")}
    ${metric("POSTS PUBLISHED",fmt(m.posts),`Last ${period} days`)}
   </div>

   <div class=statsSectionHead><span>LEADERBOARD</span><h3>INDIVIDUAL POSTS RANKED BY PERFORMANCE</h3></div>
   ${leaderboard(rows)}

   <div class=statsNote><b>DATA NOTE</b><p>Viewers / Reach uses Meta account-level unique reach when available. It is not calculated by adding individual post reach together.</p></div>
  </section>`;
  root.querySelectorAll("[data-platform]").forEach(b=>b.onclick=async()=>{platform=b.dataset.platform;await load()});
  root.querySelectorAll("[data-period]").forEach(b=>b.onclick=async()=>{period=+b.dataset.period;await load()});
 }
 await load();
}


// Backwards compatibility with the existing Hyprfy src.js import.
export const renderSocialStats = renderStatsDashboard;
