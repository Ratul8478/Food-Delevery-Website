# Project Run & Deployment Rules

1. **Running the Project**:
   - Whenever the user asks to "run the project" or "run the current project", the agent must open the browser to the live Vercel URL: `https://food-delevery-website-eight.vercel.app/`.
   - The agent should use the `browser_subagent` tool to visit the page.

2. **Real-time Modifications**:
   - Every time code changes are made to the website, they must be committed and pushed to GitHub (`git push origin master` or the current branch) so Vercel can automatically rebuild and deploy the updates to `https://food-delevery-website-eight.vercel.app/` in real-time.
