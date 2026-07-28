# Hyprfy — On a Mission v0.9.2

Verified syntax hotfix for the v0.9.1 deployment failure.

Fix:
- Removed a literal `\\n` accidentally written into `src.js` between `isToday()` and `card()`.
- `node --check src.js` passes successfully.

Feature set remains unchanged from v0.9.1.
