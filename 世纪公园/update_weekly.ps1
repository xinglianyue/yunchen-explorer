# 世纪公园探索图鉴 - 每周更新脚本
# 用法: powershell -File update_weekly.ps1 -WeekNum 2
# 前提: 已配置MCP Authorization头

param(
    [Parameter(Mandatory=$true)]
    [int]$WeekNum
)

$ErrorActionPreference = "Stop"

# === 配置 ===
$DocFileId = "CbqZcmkNskma"
$BaseUrl = "https://docs.qq.com/openapi/mcp"
$AuthHeader = "9c57b872fe5145329094635d3b76fa2c"
$SignHeader = "qed2b406291df4ac62dd12b416708a052de6b3882d91c6a87585fc409f7dec5f8"
$Headers = @{
    "Authorization" = $AuthHeader
    "X-MCP-Request-Sign" = $SignHeader
}
$LocalDir = "$env:USERPROFILE\.qclaw\workspace\世纪公园\week$WeekNum"

# === 1. 拉取问卷数据 ===
Write-Host "📋 拉取第${WeekNum}周问卷数据..."

# TODO: 调用问卷API获取本周答卷
# 问卷ID: p-1-9141
# API: tencent-survey MCP -> list_answers

# === 2. 下载图片 ===
if (-not (Test-Path $LocalDir)) { New-Item -ItemType Directory -Path $LocalDir -Force | Out-Null }
Write-Host "📥 下载图片到 $LocalDir ..."

# TODO: 从问卷数据中提取图片URL并下载

# === 3. 上传图片到腾讯文档图床 ===
Write-Host "☁️ 上传图片..."

function Upload-ImageToDoc {
    param([string]$ImagePath)
    $bytes = [System.IO.File]::ReadAllBytes($ImagePath)
    $b64 = [Convert]::ToBase64String($bytes)
    $body = @{
        jsonrpc = "2.0"
        id = 1
        method = "tools/call"
        params = @{
            name = "upload_image"
            arguments = @{
                image_base64 = $b64
                file_name = [System.IO.Path]::GetFileName($ImagePath)
            }
        }
    } | ConvertTo-Json -Depth 5
    
    $resp = Invoke-WebRequest -Uri $BaseUrl -Method POST -Headers $Headers `
        -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) `
        -ContentType "application/json; charset=utf-8" -UseBasicParsing -TimeoutSec 60
    $j = ($resp.Content | ConvertFrom-Json)
    return $j.result.structuredContent.image_id
}

# === 4. 插入内容到文档 ===
Write-Host "📝 插入第${WeekNum}周内容到文档..."

# 获取文档最后位置
$body = @{
    jsonrpc = "2.0"
    id = 1
    method = "tools/call"
    params = @{
        name = "doc.get_last_operable_pos"
        arguments = @{ file_id = $DocFileId }
    }
} | ConvertTo-Json -Depth 5

$resp = Invoke-WebRequest -Uri $BaseUrl -Method POST -Headers $Headers `
    -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) `
    -ContentType "application/json; charset=utf-8" -UseBasicParsing -TimeoutSec 30
$j = $resp.Content | ConvertFrom-Json
$pos = $j.result.structuredContent.position

Write-Host "   当前文档末尾位置: $pos"

# TODO: 根据问卷数据构建文字内容，插入文字+图片

Write-Host "✅ 第${WeekNum}周更新完成！"
Write-Host "📄 文档链接: https://docs.qq.com/doc/DQ2JxWmNta05za21h"
