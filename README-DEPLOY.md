# FPL Pocket deployment starter

## Deploy to Render (free plan)
1. Create a GitHub repository and upload these files to the repository root (not inside an extra folder).
2. On Render, choose New -> Web Service and connect the repository.
3. Set Runtime to Node.
4. Build Command: leave blank (or `npm install` if the form requires a command).
5. Start Command: `npm start`.
6. Choose Free plan, create the service, and wait for deploy.
7. Open the generated `https://...onrender.com` URL on Android Chrome.
8. Chrome menu -> Install app / Add to Home screen.

Free Render services may sleep after 15 minutes idle; the first opening after sleep can take around one minute. This starter's event notifications work while the page is open; background push is not implemented.
