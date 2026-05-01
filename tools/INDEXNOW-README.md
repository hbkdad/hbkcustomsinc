# IndexNow for HBK

HBK now has a verified IndexNow key file at the site root:

- `https://hbkcustoms.ca/98ec497b-8af9-4ace-9b87-b0eb1bea2377.txt`

This helps participating search engines such as Bing discover updated URLs faster.

## Submit the main HBK URLs again

Run:

```powershell
npm run indexnow
```

That sends the main HBK URLs to the IndexNow global endpoint.

## Important note

IndexNow does not replace:

- Google Search Console sitemap submission
- Google URL Inspection requests
- Bing Webmaster Tools verification and sitemap submission

It is an additional free discovery signal for participating engines.
