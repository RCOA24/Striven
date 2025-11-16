function Show-Tree {
  param(
    [string]$Path = '.',
    [string]$Prefix = ''
  )
  $items = Get-ChildItem -LiteralPath $Path | Where-Object { $_.Name -ne 'node_modules' } | 
    Sort-Object { -not $_.PSIsContainer }, Name
  for ($i = 0; $i -lt $items.Count; $i++) {
    $item = $items[$i]
    $connector = '|-- '
    $line = "$Prefix$connector$item"
    Write-Output $line
    if ($item.PSIsContainer) {
      $newPrefix = "$Prefix| "
      Show-Tree -Path $item.FullName -Prefix $newPrefix
    }
  }
}
Write-Output (Split-Path -Leaf (Get-Location))
Show-Tree
