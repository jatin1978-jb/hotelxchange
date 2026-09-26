Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('d:\Antigravity\HotelXchange\Hospitality_Digital_PRD_v1.2_Development.docx')
$entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xmlContent = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()

$xml = [xml]$xmlContent
$ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$ns.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')

$paragraphs = $xml.SelectNodes('//w:p', $ns)
$lines = @()
foreach ($p in $paragraphs) {
    $text = $p.InnerText
    if ($text) {
        $lines += $text
    }
}

$fullText = $lines -join "`n"
[System.IO.File]::WriteAllText('d:\Antigravity\HotelXchange\PRD.md', $fullText, [System.Text.Encoding]::UTF8)
Write-Host "Successfully extracted $($lines.Count) lines to PRD.md"
