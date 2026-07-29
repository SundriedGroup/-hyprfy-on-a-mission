// Hyprfy Social Stats Dashboard
// Additive module for the existing Vite + Supabase app.
// Usage from src.js:
//   import { renderSocialStats } from "./stats-dashboard.js";
//   import "./stats-dashboard.css";
//   ...then call: renderSocialStats(view, sb);

const fmt = new Intl.NumberFormat("en-ZA");
const compact = new Intl.NumberFormat("en-ZA", { notation: "compact", maximumFractionDigits: 1 });

function n(v){ return Number(v || 0); }
function safe(v=""){ return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function pct(v){ const x=n(v); return `${x>0?"+":""}${x.toFixed(1)}%`; }
function deltaClass(v){ return n(v) >= 0 ? "up" : "down"; }

async function loadStats(sb, platform, days){
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  const sinceISO = since.toISOString().slice(0,10);

  const [{data:snapshots,error:sErr},{data:posts,error:pErr}] = await Promise.all([
    sb.from("social_account_daily")
      .select("*")
      .eq("platform",platform)
      .gte("snapshot_date",sinceISO)
      .order("snapshot_date",{ascending:true}),
    sb.from("social_post_stats")
      .select("*")
      .eq("platform",platform)
      .gte("published_at",`${sinceISO}T00:00:00Z`)
      .order("published_at",{ascending:false})
  ]);
  if(sErr) throw sErr;
  if(pErr) throw pErr;

  const s = snapshots || [], p = posts || [];
  const latest = s.at(-1) || {};
  const previous = s[0] || {};
  const reach = n(latest.period_reach);
  const totalViews = p.reduce((a,x)=>a+n(x.views),0);
  const avgViews = p.length ? totalViews / p.length : 0;
  const followers = n(latest.followers);
  const followerDelta = followers - n(previous.followers);
  const followerPct = n(previous.followers) ? followerDelta/n(previous.followers)*100 : 0;

  return { snapshots:s, posts:p, reach, totalViews, avgViews, followers, followerDelta, followerPct };
}

function chart(points){
  if(!points.length) return `<div class="ss-empty">No daily reach history yet.</div>`;
  const vals = points.map(x=>n(x.period_reach));
  const max = Math.max(...vals,1), min = Math.min(...vals,0);
  const range = Math.max(max-min,1);
  const w=700,h=220,pad=12;
  const coords = vals.map((v,i)=>{
    const x = pad + (i/Math.max(vals.length-1,1))*(w-pad*2);
    const y = h-pad-((v-min)/range)*(h-pad*2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return `<svg class="ss-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-label="Account reach trend">
    <polyline points="${coords}" fill="none" stroke="currentColor" stroke-width="3" vector-effect="non-scaling-stroke"/>
  </svg>`;
}

function postRows(posts){
  if(!posts.length) return `<div class="ss-empty">No posts have been synced for this period yet.</div>`;
  return `<div class="ss-table-wrap"><table class="ss-table">
    <thead><tr><th>Content</th><th>Published</th><th>Reach</th><th>Views</th><th>Likes</th><th>Comments</th><th>Shares</th><th>Saves</th></tr></thead>
    <tbody>${posts.map(p=>`<tr>
      <td><div class="ss-content"><b>${safe(p.media_type || "POST")}</b><span>${safe((p.caption||"Untitled post").slice(0,72))}</span></div></td>
      <td>${new Date(p.published_at).toLocaleDateString("en-ZA",{day:"2-digit",month:"short"})}</td>
      <td>${fmt.format(n(p.reach))}</td><td>${fmt.format(n(p.views))}</td>
      <td>${fmt.format(n(p.likes))}</td><td>${fmt.format(n(p.comments))}</td>
      <td>${fmt.format(n(p.shares))}</td><td>${fmt.format(n(p.saves))}</td>
    </tr>`).join("")}</tbody>
  </table></div>`;
}

export async function renderSocialStats(view, sb){
  let platform = "instagram", days = 30;

  async function draw(){
    view.innerHTML = `<section class="ss-page">
      <div class="ss-loading"><span>SOCIAL INTELLIGENCE</span><h2>STATS</h2><p>Loading ${platform} performance…</p></div>
    </section>`;
    try{
      const d = await loadStats(sb,platform,days);
      view.innerHTML = `<section class="ss-page">
        <div class="ss-head">
          <div><span class="eyebrow">HYPRFY / SOCIAL INTELLIGENCE</span><h2>STATS</h2><p>Understand what is moving your personal brand.</p></div>
          <div class="ss-controls">
            <div class="ss-segment">${["instagram","facebook"].map(x=>`<button data-platform="${x}" class="${x===platform?"active":""}">${x}</button>`).join("")}</div>
            <div class="ss-segment">${[7,30,90].map(x=>`<button data-days="${x}" class="${x===days?"active":""}">${x}D</button>`).join("")}</div>
          </div>
        </div>

        <div class="ss-platform"><span>${platform.toUpperCase()}</span><b>${d.followers?fmt.format(d.followers):"—"} followers</b>
          <small class="${deltaClass(d.followerPct)}">${d.followers?pct(d.followerPct):"Awaiting sync"}</small></div>

        <div class="ss-kpis">
          <article class="primary"><span>ACCOUNT REACH</span><strong>${compact.format(d.reach)}</strong><small>${days}-day unique reach</small></article>
          <article class="primary"><span>AVG VIEWS / POST</span><strong>${compact.format(Math.round(d.avgViews))}</strong><small>${d.posts.length} posts in period</small></article>
          <article><span>TOTAL VIEWS</span><strong>${compact.format(d.totalViews)}</strong><small>Across published content</small></article>
          <article><span>POSTS PUBLISHED</span><strong>${fmt.format(d.posts.length)}</strong><small>Last ${days} days</small></article>
        </div>

        <div class="ss-grid">
          <section class="ss-panel ss-trend"><div class="ss-panel-head"><div><span>ACCOUNT REACH</span><h3>${days}-DAY TREND</h3></div><b>${compact.format(d.reach)}</b></div>${chart(d.snapshots)}</section>
          <section class="ss-panel ss-summary">
            <span>PERFORMANCE SNAPSHOT</span>
            <div><b>${compact.format(d.avgViews)}</b><small>Avg views / post</small></div>
            <div><b>${compact.format(d.totalViews)}</b><small>Total views</small></div>
            <div><b>${fmt.format(d.followers)}</b><small>Followers</small></div>
          </section>
        </div>

        <section class="ss-panel ss-content-panel">
          <div class="ss-panel-head"><div><span>CONTENT PERFORMANCE</span><h3>RECENT POSTS</h3></div><small>${platform.toUpperCase()} · ${days} DAYS</small></div>
          ${postRows(d.posts)}
        </section>
      </section>`;

      view.querySelectorAll("[data-platform]").forEach(b=>b.onclick=()=>{platform=b.dataset.platform;draw()});
      view.querySelectorAll("[data-days]").forEach(b=>b.onclick=()=>{days=Number(b.dataset.days);draw()});
    }catch(err){
      view.innerHTML=`<section class="ss-page"><div class="ss-error"><span>SOCIAL INTELLIGENCE</span><h2>STATS</h2><p>${safe(err.message)}</p><small>Run the supplied Supabase migration and sync social data before opening this dashboard.</small></div></section>`;
    }
  }
  await draw();
}
