HYPRFY STATS V4 — BUILD FIX

This version fixes the Vercel error:
"renderSocialStats is not exported by stats-dashboard.js"

The dashboard now exports BOTH:
- renderStatsDashboard
- renderSocialStats

That means your existing src.js can continue using:
import { renderSocialStats } from "./stats-dashboard.js";

No src.js rename is required for the existing renderSocialStats call.

Dashboard structure:
ATTENTION
Total Views · Viewers / Reach · Watch Time · Avg Watch Time

ENGAGEMENT
Total Engagements · Engagement Rate · Shares · Saves · Comments · Likes

CONTENT
Avg Views / Post · Avg Reach / Post · Posts Published

LEADERBOARD
Individual posts ranked by performance.

FILES:
- stats-dashboard.js
- stats-dashboard.css

Replace the existing two files in your repo / root location where src.js imports them, commit, and let Vercel redeploy.
