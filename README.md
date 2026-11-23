# LeaseLens

An English and Mongolian rental comparison tool. Compare a landlord’s promise with lease wording, inspect matching passages, and compare revised drafts. Matching uses keywords. The interface supports light and dark themes.

Checking a draft happens in the browser. Choosing Save uploads the draft to the signed-in account. The hosted worker uses the Sites-provided identity and a private R2 bucket for saved comparisons and fulfilled purchases. Checkout is not active.

Build with `node build.mjs`. The worker entry point is `dist/server/index.js`. Deploy behind the trusted Sites authentication layer. A deployment on another host requires its own verified identity integration before enabling account routes.
