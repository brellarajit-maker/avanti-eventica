<#
    Avanti-Eventica — local preview server
    ---------------------------------------
    The site is plain HTML/CSS/JS, so it needs no build step. It does need to be
    served over http:// rather than opened as a file:// page, because browsers
    block video range-requests and some module behaviour on file://.

    Run it:      powershell -ExecutionPolicy Bypass -File serve.ps1
    Then open:   http://localhost:8787/
    Stop it:     Ctrl+C

    Handles requests concurrently and supports HTTP Range, so the videos seek
    and stream properly.
#>

param(
  [int]$Port = 8787,
  [string]$Root = $PSScriptRoot
)

$ErrorActionPreference = 'Stop'
if (-not $Root) { $Root = (Get-Location).Path }
$Root = (Resolve-Path $Root).Path

$mime = @{
  '.html'='text/html; charset=utf-8'; '.htm'='text/html; charset=utf-8'
  '.css'='text/css; charset=utf-8';   '.js'='application/javascript; charset=utf-8'
  '.json'='application/json';         '.svg'='image/svg+xml'
  '.jpg'='image/jpeg';  '.jpeg'='image/jpeg'; '.png'='image/png'
  '.webp'='image/webp'; '.gif'='image/gif';   '.ico'='image/x-icon'
  '.avif'='image/avif'; '.mp4'='video/mp4';   '.webm'='video/webm'
  '.mp3'='audio/mpeg';  '.woff'='font/woff';  '.woff2'='font/woff2'
  '.txt'='text/plain; charset=utf-8';  '.md'='text/plain; charset=utf-8'
}

$handler = {
  param($ctx, $Root, $mime)

  $req = $ctx.Request
  $res = $ctx.Response
  try {
    $path = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath)
    if ($path -eq '/') { $path = '/index.html' }

    $file = Join-Path $Root ($path.TrimStart('/') -replace '/','\')

    # keep requests inside the site folder
    $full = [System.IO.Path]::GetFullPath($file)
    if (-not $full.StartsWith($Root, [StringComparison]::OrdinalIgnoreCase)) {
      $res.StatusCode = 403; $res.Close(); return
    }

    if (-not (Test-Path -LiteralPath $full -PathType Leaf)) {
      $res.StatusCode = 404
      $b = [Text.Encoding]::UTF8.GetBytes("404 Not Found: $path")
      $res.ContentType = 'text/plain; charset=utf-8'
      $res.ContentLength64 = $b.Length
      $res.OutputStream.Write($b, 0, $b.Length)
      $res.Close(); return
    }

    $ext = [System.IO.Path]::GetExtension($full).ToLower()
    $ct = $mime[$ext]; if (-not $ct) { $ct = 'application/octet-stream' }
    $res.ContentType = $ct
    $res.Headers.Add('Accept-Ranges', 'bytes')
    $res.Headers.Add('Cache-Control', 'no-cache')

    $stream = [System.IO.File]::Open($full, 'Open', 'Read', 'ReadWrite')
    try {
      $total = $stream.Length
      $start = 0; $end = $total - 1
      $range = $req.Headers['Range']

      if ($range -and $range -match 'bytes=(\d*)-(\d*)') {
        if ($matches[1] -ne '') { $start = [int64]$matches[1] }
        if ($matches[2] -ne '') { $end = [int64]$matches[2] }
        if ($end -ge $total) { $end = $total - 1 }
        if ($start -gt $end) {
          $res.StatusCode = 416
          $res.Headers.Add('Content-Range', "bytes */$total")
          $res.Close(); return
        }
        $res.StatusCode = 206
        $res.Headers.Add('Content-Range', "bytes $start-$end/$total")
      }

      $count = $end - $start + 1
      $res.ContentLength64 = $count
      $stream.Position = $start

      $buf = New-Object byte[] 131072
      $left = $count
      while ($left -gt 0) {
        $n = $stream.Read($buf, 0, [Math]::Min($buf.Length, $left))
        if ($n -le 0) { break }
        $res.OutputStream.Write($buf, 0, $n)
        $left -= $n
      }
    } finally { $stream.Close() }

    $res.Close()
  } catch {
    # client disconnects mid-stream are normal while scrubbing video
    try { $res.Abort() } catch {}
  }
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try { $listener.Start() }
catch {
  Write-Host "Could not listen on port $Port. Try another: .\serve.ps1 -Port 8080" -ForegroundColor Red
  exit 1
}

$pool = [runspacefactory]::CreateRunspacePool(1, 12)
$pool.Open()
$jobs = New-Object System.Collections.ArrayList

Write-Host ""
Write-Host "  Avanti-Eventica" -ForegroundColor Yellow
Write-Host "  serving $Root"
Write-Host "  -> http://localhost:$Port/" -ForegroundColor Green
Write-Host "  Ctrl+C to stop"
Write-Host ""

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()

    $ps = [powershell]::Create()
    $ps.RunspacePool = $pool
    [void]$ps.AddScript($handler).AddArgument($ctx).AddArgument($Root).AddArgument($mime)
    [void]$jobs.Add([pscustomobject]@{ PS = $ps; Handle = $ps.BeginInvoke() })

    # reap finished requests so the pool and handles don't accumulate
    for ($i = $jobs.Count - 1; $i -ge 0; $i--) {
      if ($jobs[$i].Handle.IsCompleted) {
        try { [void]$jobs[$i].PS.EndInvoke($jobs[$i].Handle) } catch {}
        $jobs[$i].PS.Dispose()
        $jobs.RemoveAt($i)
      }
    }
  }
} finally {
  try { $listener.Stop(); $listener.Close() } catch {}
  try { $pool.Close(); $pool.Dispose() } catch {}
}
