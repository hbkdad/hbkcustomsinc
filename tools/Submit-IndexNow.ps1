$ErrorActionPreference = "Stop"

$key = "98ec497b-8af9-4ace-9b87-b0eb1bea2377"
$endpoint = "https://api.indexnow.org/indexnow"
$hostName = "hbkcustoms.ca"

$urls = @(
  "https://hbkcustoms.ca/",
  "https://hbkcustoms.ca/case-studies.html",
  "https://hbkcustoms.ca/website-builds.html",
  "https://hbkcustoms.ca/services.html",
  "https://hbkcustoms.ca/about.html",
  "https://hbkcustoms.ca/jtr-custom-works-case-study.html",
  "https://hbkcustoms.ca/gold-city-welding-case-study.html",
  "https://hbkcustoms.ca/brediishred-demo-case-study.html",
  "https://hbkcustoms.ca/forgequote-case-study.html"
)

$payload = @{
  host = $hostName
  key = $key
  keyLocation = "https://hbkcustoms.ca/$key.txt"
  urlList = $urls
} | ConvertTo-Json -Depth 4

$response = & curl.exe `
  --silent `
  --show-error `
  --write-out "HTTPSTATUS:%{http_code}" `
  -X POST `
  -H "Content-Type: application/json; charset=utf-8" `
  --data $payload `
  $endpoint

Write-Host "IndexNow submission complete." -ForegroundColor Cyan
if ($response -match "HTTPSTATUS:(\d{3})$") {
  $status = $matches[1]
  $body = $response -replace "HTTPSTATUS:\d{3}$", ""
  Write-Host "Status: $status" -ForegroundColor Green
  if ($body.Trim()) {
    Write-Host "Response: $body"
  }
} else {
  Write-Host "Status: unknown" -ForegroundColor Yellow
  Write-Host $response
}
Write-Host "Endpoint: $endpoint"
