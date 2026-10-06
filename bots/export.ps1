$ErrorActionPreference = 'Stop'
$taskOutput = Join-Path (Split-Path $PSScriptRoot -Parent) 'artifacts'
$taskStage = Join-Path ([System.IO.Path]::GetTempPath()) ('omega-bots-export-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $taskOutput -Force | Out-Null
New-Item -ItemType Directory -Path $taskStage | Out-Null
try {
  $taskEntries = @('src', 'test', 'deploy', 'package.json', 'package-lock.json', 'README.md', '.env.example', '.gitignore', '.dockerignore', 'Dockerfile', 'compose.yml', 'export.ps1')
  foreach ($taskEntry in $taskEntries) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot $taskEntry) -Destination $taskStage -Recurse -Force
  }
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $taskZip = Join-Path $taskOutput 'omega-market-bots.zip'
  if (Test-Path -LiteralPath $taskZip) { Remove-Item -LiteralPath $taskZip }
  [System.IO.Compression.ZipFile]::CreateFromDirectory($taskStage, $taskZip)
  Write-Output "Pacote criado: $taskZip"
} finally {
  $taskResolvedStage = [System.IO.Path]::GetFullPath($taskStage)
  $taskExpectedPrefix = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd('\') + '\omega-bots-export-'
  if (-not $taskResolvedStage.StartsWith($taskExpectedPrefix, [System.StringComparison]::OrdinalIgnoreCase)) { throw 'Caminho temporário fora do diretório esperado.' }
  Remove-Item -LiteralPath $taskResolvedStage -Recurse -Force
}
