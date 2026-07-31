
const esc=(v="")=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const num=v=>Number(v||0);
const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,n));
const sum=(a,k)=>a.reduce((t,x)=>t+num(typeof k==="function"?k(x):x[k]),0);
const avg=(a,k)=>a.length?sum(a,k)/a.length:0;
const fmt=n=>{n=num(n);return Math.abs(n)>=1e6?(n/1e6).toFixed(1)+"M":Math.abs(n)>=1e3?(n/1e3).toFixed(1)+"K":Math.round(n).toLocaleString()};
const pct=n=>`${num(n).toFixed(1)}%`;
const iso=d=>new Date(d).toISOString().slice(0,10);
const startOfDay=d=>new Date(`${d}T00:00:00`);
const daysBetween=(a,b)=>Math.round((startOfDay(b)-startOfDay(a))/86400000);
const COHORTS=["Health","Business","Adventure","Family / Life","Other"];
const cohortClass=c=>({"Health":"health","Business":"business","Adventure":"adventure","Family / Life":"life","Other":"other"}[c]||"other");

function classify(p){
  if(p.cohort) return p.cohort;
  const s=`${p.caption||""} ${p.media_type||""}`.toLowerCase();
  const rules=[
    ["Health",["run","running","training","gym","fitness","health","10km","marathon","workout","recovery"]],
    ["Business",["business","work","brand","marketing","sponsor","sponsorship","office","client","career","meeting","r&d","rexona"]],
    ["Adventure",["mountain","hike","hiking","travel","trip","adventure","drakensberg","outdoor","trail","road trip"]],
    ["Family / Life",["family","coffee","date","kids","home","life","weekend","dad","wife","friends"]]
  ];
  for(const [c,words] of rules) if(words.some(w=>s.includes(w))) return c;
  return "Other";
}
function engagement(p){return num(p.likes)+num(p.comments)+num(p.shares)+num(p.saves)}
function engRate(p){const base=num(p.reach)||num(p.views);return base?engagement(p)/base*100:0}
function watchSeconds(p){
  if(num(p.watch_time_seconds)) return num(p.watch_time_seconds);
  if(num(p.watch_time_ms)) return num(p.watch_time_ms)/1000;
  if(num(p.total_watch_time)) return num(p.total_watch_time);
  return 0;
}
function plannedFromWeeks(weeks=[]){
  const out=[];
  for(const w of weeks){
    (w.days||[]).forEach((d,i)=>{
      const dt=new Date(`${w.start_date}T12:00:00`); dt.setDate(dt.getDate()+i);
      const p=d.post?.instagram;
      if(p) out.push({date:iso(dt),caption:p.concept||p.cap||p.onscreen||"Planned Instagram post",cohort:p.cohort||classify(p),planned:true});
    });
  }
  return out;
}
function rangeDates(days){
  const end=new Date(), start=new Date();
  start.setDate(end.getDate()-days+1);
  return {start:iso(start),end:iso(end)};
}
function trend(current,previous){
  if(!previous) return current?100:0;
  return (current-previous)/previous*100;
}
function deltaHtml(v){
  const cls=v>0?"up":v<0?"down":"flat", arrow=v>0?"↑":v<0?"↓":"→";
  return `<span class="intel-delta ${cls}">${arrow} ${Math.abs(v).toFixed(1)}%</span>`;
}
function scoreTone(s){return s>=75?"good":s>=55?"mid":"bad"}

function lineChart(series,metric){
  const W=760,H=205,P=28;
  const all=series.flatMap(s=>s.values.map(v=>num(v.value)));
  const max=Math.max(...all,1), min=Math.min(...all,0);
  const span=Math.max(max-min,1);
  const paths=series.map((s,si)=>{
    const pts=s.values.map((v,i)=>{
      const x=P+(i/Math.max(s.values.length-1,1))*(W-P*2);
      const y=H-P-((num(v.value)-min)/span)*(H-P*2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    return `<polyline class="chart-line line-${si}" points="${pts}" fill="none"/><circle class="chart-last line-${si}" cx="${pts.split(" ").at(-1)?.split(",")[0]||0}" cy="${pts.split(" ").at(-1)?.split(",")[1]||0}" r="3"/>`;
  }).join("");
  return `<svg class="intel-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    ${[0,.25,.5,.75,1].map(t=>`<line x1="${P}" y1="${P+t*(H-P*2)}" x2="${W-P}" y2="${P+t*(H-P*2)}" class="chart-grid"/>`).join("")}
    ${paths}
  </svg>`;
}

function calendarHtml(posts,planned,monthDate=new Date()){
  const y=monthDate.getFullYear(),m=monthDate.getMonth();
  const first=new Date(y,m,1), last=new Date(y,m+1,0);
  const mondayIndex=(first.getDay()+6)%7;
  const start=new Date(y,m,1-mondayIndex);
  const byDate={};
  [...posts.map(p=>({...p,date:iso(p.published_at),planned:false})),...planned].forEach(p=>(byDate[p.date]??=[]).push(p));
  const cells=[];
  for(let i=0;i<42;i++){
    const d=new Date(start);d.setDate(start.getDate()+i);const key=iso(d),outside=d.getMonth()!==m;
    const items=(byDate[key]||[]).slice(0,5);
    cells.push(`<button class="cal-cell ${outside?"outside":""}" data-caldate="${key}">
      <b>${d.getDate()}</b><div class="cal-dots">${items.map(x=>`<i class="${cohortClass(x.cohort||classify(x))} ${x.planned?"planned":""}" title="${esc(x.cohort||classify(x))}"></i>`).join("")}</div>
    </button>`);
  }
  return `<div class="calendar-head"><strong>${monthDate.toLocaleDateString("en-ZA",{month:"long",year:"numeric"})}</strong><span>Solid = posted · Ring = planned</span></div>
  <div class="cal-days">${["MON","TUE","WED","THU","FRI","SAT","SUN"].map(x=>`<span>${x}</span>`).join("")}</div>
  <div class="cal-grid">${cells.join("")}</div>
  <div class="cal-legend">${COHORTS.map(c=>`<span><i class="${cohortClass(c)}"></i>${c}</span>`).join("")}</div>`;
}

export async function renderIntelligence(sb,root,opts={}){
  const platform=opts.platform||"instagram";
  let days=Number(opts.days||30);
  root.innerHTML=`<section class="intel-loading"><b>INTELLIGENCE</b><span>Building your personal brand picture…</span></section>`;

  const postsQ=await sb.from("social_post_stats").select("*").eq("platform",platform).order("published_at",{ascending:true}).limit(500);
  if(postsQ.error){root.innerHTML=`<section class="intel-error"><b>Could not load Intelligence</b><p>${esc(postsQ.error.message)}</p></section>`;return}
  const accQ=await sb.from("social_account_daily").select("*").eq("platform",platform).order("snapshot_date",{ascending:true}).limit(500);
  const weeksQ=await sb.from("weeks").select("start_date,days").order("start_date");
  const allPosts=(postsQ.data||[]).map(p=>({...p,cohort:classify(p)}));
  const account=accQ.data||[];
  const planned=plannedFromWeeks(weeksQ.data||[]);

  function paint(selectedDays=days,metric="views"){
    days=selectedDays;
    const now=new Date(), cutoff=new Date();cutoff.setDate(now.getDate()-days);
    const prevCutoff=new Date();prevCutoff.setDate(now.getDate()-days*2);
    const current=allPosts.filter(p=>new Date(p.published_at)>=cutoff);
    const previous=allPosts.filter(p=>new Date(p.published_at)>=prevCutoff&&new Date(p.published_at)<cutoff);
    const accCurrent=account.filter(a=>new Date(a.snapshot_date)>=cutoff);
    const accPrevious=account.filter(a=>new Date(a.snapshot_date)>=prevCutoff&&new Date(a.snapshot_date)<cutoff);
    const latest=account.at(-1)||{};
    const firstAcc=accCurrent[0]||latest, prevAcc=accPrevious[0]||firstAcc;

    const views=sum(current,"views"), prevViews=sum(previous,"views");
    const reach=sum(current,"reach") || num(latest.period_reach);
    const prevReach=sum(previous,"reach") || num(prevAcc.period_reach);
    const engagements=sum(current,engagement), prevEng=sum(previous,engagement);
    const er=reach?engagements/reach*100:0, prevEr=prevReach?prevEng/prevReach*100:0;
    const followers=num(latest.followers), prevFollowers=num(prevAcc.followers);
    const avgViews=avg(current,"views");

    const cohorts=COHORTS.map(c=>{
      const p=current.filter(x=>x.cohort===c), v=sum(p,"views"), r=sum(p,"reach"), e=sum(p,engagement);
      return {name:c,posts:p.length,share:current.length?p.length/current.length*100:0,avgViews:avg(p,"views"),engRate:r?e/r*100:0,multiple:avgViews?avg(p,"views")/avgViews:0};
    }).sort((a,b)=>b.avgViews-a.avgViews);

    const volume=clamp((current.length/Math.max(days/7*3,1))*70+30);
    const velocity=clamp(50+trend(current.length,previous.length)/2);
    const shareRate=views?sum(current,"shares")/views*100:0;
    const saveRate=views?sum(current,"saves")/views*100:0;
    const virality=clamp(35+shareRate*120+Math.max(0,reach/(followers||1))*8);
    const value=clamp(35+saveRate*140+(er*3));
    const vitality=clamp((volume+velocity+virality+value)/4);
    const health=Math.round(vitality);

    const top=cohorts[0], weak=[...cohorts].filter(x=>x.posts).sort((a,b)=>a.avgViews-b.avgViews)[0];
    const decisions=[
      top?.posts?`Double down on ${top.name}: it leads at ${top.multiple.toFixed(1)}× your account average views.`:"Publish enough content to establish a reliable cohort baseline.",
      weak?.posts&&weak.name!==top?.name?`${weak.name} needs a new angle. It is currently at ${weak.multiple.toFixed(1)}× your average.`:"Test a second content angle in your strongest cohort.",
      er<5?"Create more saveable/shareable posts; engagement efficiency is below 5%.":"Engagement is healthy. Protect quality while increasing consistency.",
      current.length<Math.max(4,days/7*2)?"Increase publishing consistency before adding more formats.":"Keep the publishing rhythm and test stronger opening hooks."
    ];

    const chartDays=[];
    for(let i=days-1;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);chartDays.push(iso(d))}
    const postByDay=Object.fromEntries(chartDays.map(d=>[d,{views:0,reach:0}]));
    current.forEach(p=>{const d=iso(p.published_at);if(postByDay[d]){postByDay[d].views+=num(p.views);postByDay[d].reach+=num(p.reach)}})
    let cv=0,cr=0;
    const viewVals=chartDays.map(d=>({date:d,value:(cv+=postByDay[d].views)}));
    const reachVals=chartDays.map(d=>({date:d,value:(cr+=postByDay[d].reach)}));
    const accMap={};account.forEach(a=>accMap[a.snapshot_date]=num(a.followers));
    let lf=num(accCurrent[0]?.followers||latest.followers);
    const followerVals=chartDays.map(d=>({date:d,value:(lf=accMap[d]??lf)}));
    const selectedSeries=metric==="followers"?[{name:"Followers",values:followerVals}]:metric==="reach"?[{name:"Reach",values:reachVals}]:[{name:"Views",values:viewVals}];

    root.innerHTML=`<section class="intel-shell">
      <div class="intel-titlebar">
        <div><span class="intel-kicker">HYPRFY / PERSONAL BRAND OS</span><h2>INTELLIGENCE</h2><p>Know what's working. Know what to do next.</p></div>
        <div class="intel-controls"><div class="intel-platform">◉ ${platform.toUpperCase()}</div><div class="range-tabs">${[7,30,90].map(d=>`<button data-range="${d}" class="${d===days?"active":""}">${d}D</button>`).join("")}</div></div>
      </div>

      <div class="kpi-grid">
        ${[
          ["FOLLOWERS",fmt(followers),trend(followers,prevFollowers),"Audience size"],
          ["VIEWS",fmt(views),trend(views,prevViews),`${current.length} posts in period`],
          ["REACH",fmt(reach),trend(reach,prevReach),"Accounts reached"],
          ["ENGAGEMENT RATE",pct(er),er-prevEr,"Engagements ÷ reach"]
        ].map(([l,v,d,s])=>`<article class="kpi"><span>${l}</span><strong>${v}</strong>${deltaHtml(d)}<small>${s}</small></article>`).join("")}
        <article class="kpi health-card"><span>BRAND HEALTH</span><strong>${health}<em>/100</em></strong><div class="health-bar"><i style="width:${health}%"></i></div><small>${scoreTone(health)==="good"?"Healthy momentum":scoreTone(health)==="mid"?"Building momentum":"Needs attention"}</small></article>
      </div>

      <div class="intel-row row-main">
        <article class="panel growth-panel"><div class="panel-head"><div><span>GROWTH</span><small>HOW THE ACCOUNT IS MOVING</small></div><div class="metric-tabs">${["followers","views","reach"].map(x=>`<button data-metric="${x}" class="${metric===x?"active":""}">${x}</button>`).join("")}</div></div>${lineChart(selectedSeries,metric)}<div class="chart-foot"><span>${chartDays[0]}</span><span>${chartDays.at(-1)}</span></div></article>
        <article class="panel v-panel"><div class="panel-head"><div><span>THE V'S</span><small>CORE PERFORMANCE PILLARS</small></div></div>
          ${[["VOLUME",volume,"How much you publish"],["VELOCITY",velocity,"Consistency + momentum"],["VIRALITY",virality,"How far content travels"],["VALUE",value,"Saves + meaningful response"],["VITALITY",vitality,"Overall brand health"]].map(([n,s,d])=>`<div class="v-row"><div><b>${n}</b><small>${d}</small></div><strong class="${scoreTone(s)}">${Math.round(s)}</strong><div class="mini-bar"><i style="width:${s}%"></i></div></div>`).join("")}
        </article>
        <article class="panel cohort-panel"><div class="panel-head"><div><span>COHORT PERFORMANCE</span><small>WHAT YOU ARE KNOWN FOR</small></div></div>
          <div class="cohort-table"><div class="ct-head"><span>COHORT</span><span>SHARE</span><span>AVG VIEWS</span><span>ENG</span><span>TREND</span></div>
          ${cohorts.map(c=>`<div class="ct-row"><span><i class="${cohortClass(c.name)}"></i>${esc(c.name)}</span><span>${pct(c.share)}</span><span>${fmt(c.avgViews)}</span><span>${pct(c.engRate)}</span><span class="${c.multiple>=1?"up":c.multiple>=.8?"flat":"down"}">${c.multiple?c.multiple.toFixed(1)+"×":"—"}</span></div>`).join("")}</div>
        </article>
      </div>

      <div class="intel-row row-action">
        <article class="panel work-panel"><div class="panel-head"><div><span>COHORT SIGNALS</span><small>ABOVE / BELOW ACCOUNT BASELINE</small></div></div>
          ${cohorts.filter(c=>c.posts).map(c=>`<div class="signal"><span>${esc(c.name)}</span><div><i style="width:${Math.min(c.multiple*55,100)}%" class="${c.multiple>=1?"pos":"neg"}"></i></div><b>${c.multiple.toFixed(1)}× ${c.multiple>=1?"↑":c.multiple>=.8?"→":"↓"}</b></div>`).join("")||"<p class=empty>No cohort history yet.</p>"}
        </article>
        <article class="panel decision-panel"><div class="panel-head"><div><span>DECISION FEED</span><small>WHAT TO DO NEXT</small></div></div>
          ${decisions.map((d,i)=>`<div class="decision"><b>0${i+1}</b><p>${esc(d)}</p></div>`).join("")}
        </article>
        <article class="panel calendar-panel"><div class="panel-head"><div><span>CONTENT CALENDAR</span><small>PAST + FUTURE POSTS BY COHORT</small></div></div>${calendarHtml(allPosts,planned)}</article>
      </div>

      <article class="panel leaderboard"><div class="panel-head"><div><span>CONTENT PERFORMANCE</span><small>LEADERBOARD</small></div></div>
        <div class="leader-head"><span>#</span><span>POST</span><span>COHORT</span><span>FORMAT</span><span>VIEWS</span><span>REACH</span><span>ENG</span><span>WATCH</span><span>SAVES</span><span>SHARES</span></div>
        ${[...current].sort((a,b)=>num(b.views)-num(a.views)).slice(0,10).map((p,i)=>{
          const ws=watchSeconds(p),av= num(p.views)?ws/num(p.views):0;
          return `<a class="leader-row" ${p.permalink?`href="${esc(p.permalink)}" target="_blank"`:""}>
            <span>${String(i+1).padStart(2,"0")}</span><span class="post-name">${esc((p.caption||"Untitled post").replace(/\s+/g," ").slice(0,85))}</span>
            <span><i class="${cohortClass(p.cohort)}"></i>${esc(p.cohort)}</span><span>${esc(p.media_type||"POST")}</span><strong>${fmt(p.views)}</strong><span>${fmt(p.reach)}</span><span>${pct(engRate(p))}</span><span>${av?av.toFixed(1)+"s":"—"}</span><span>${fmt(p.saves)}</span><span>${fmt(p.shares)}</span>
          </a>`}).join("")||"<p class=empty>No posts in this period.</p>"}
      </article>
    </section>`;

    root.querySelectorAll("[data-range]").forEach(b=>b.onclick=()=>paint(+b.dataset.range,metric));
    root.querySelectorAll("[data-metric]").forEach(b=>b.onclick=()=>paint(days,b.dataset.metric));
    root.querySelectorAll("[data-caldate]").forEach(b=>b.onclick=()=>{
      const date=b.dataset.caldate, items=[
        ...allPosts.filter(p=>iso(p.published_at)===date).map(p=>`${p.cohort}: ${(p.caption||"Published post").slice(0,100)}`),
        ...planned.filter(p=>p.date===date).map(p=>`${p.cohort}: ${p.caption} (planned)`)
      ];
      if(items.length) alert(`${date}\n\n${items.join("\n\n")}`);
    });
  }
  paint(days,"views");
}
