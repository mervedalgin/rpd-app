Param(
  [ValidateSet("development","preview","production")]
  [string]$Stage = "production"
)

$EnvFile = ".env.local"

if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
  Write-Host "vercel CLI bulunamadı. Kurulum: npm i -g vercel"
  exit 1
}

if (-not (Test-Path $EnvFile)) {
  Write-Host "$EnvFile bulunamadı."
  exit 1
}

# Vercel proje link (gerekirse)
vercel link --yes | Out-Null

Get-Content -Raw $EnvFile | ForEach-Object {
  # Satırları tek tek işlemek yerine once tum dosyayi aliyoruz.
} | Out-Null

# Dosyayi satir satir isle
Get-Content $EnvFile | ForEach-Object {
  $line = $_

  # Bos veya yorum satiri ise gec
  if ([string]::IsNullOrWhiteSpace($line) -or $line.Trim().StartsWith("#")) { return }

  # KEY=VALUE ayristir (sadece ilk '=' e gore bol)
  $split = $line -split "=", 2
  if ($split.Count -lt 2) { return }

  $key = $split[0].Trim()
  $val = $split[1]

  # Cift tirnak varsa cevresini temizle
  if ($val.StartsWith('"') -and $val.EndsWith('"')) {
    $val = $val.Substring(1, $val.Length - 2)
  }

  # Cok satirli degerleri \n'a cevir (PowerShell CRLF/LF)
  if ($val -match "(`r`n|`n)") {
    $val = $val -replace "(`r`n|`n)", "\n"
  }

  # Varsa once sil (sessiz)
  vercel env rm $key $Stage --yes 2>$null | Out-Null

  # stdin uzerinden degeri gonder
  $pinfo = New-Object System.Diagnostics.ProcessStartInfo
  $pinfo.FileName = "vercel"
  $pinfo.Arguments = "env add $key $Stage"
  $pinfo.UseShellExecute = $false
  $pinfo.RedirectStandardInput = $true
  $pinfo.RedirectStandardOutput = $true
  $p = [System.Diagnostics.Process]::Start($pinfo)
  $p.StandardInput.Write($val)
  $p.StandardInput.Close()
  $p.WaitForExit()

  Write-Host "[OK] $key -> $Stage"
}

Write-Host "Bitti. Vercel ortam degiskenleri guncellendi."
Write-Host "Prod deploy icin: vercel --prod"
