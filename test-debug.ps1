# Test script to debug Nakama runtime functions

# Configuration
$NakamaHost = "localhost:7350"
$ServerKey = "defaultkey"

# Base64 encode the server key for basic auth
$base64AuthInfo = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${ServerKey}:"))

# First, authenticate as a test user to get a valid token
$authPayload = @{
    email = "debug@test.com"
    password = "password123"
    create = $true
    username = "debuguser"
} | ConvertTo-Json

try {
    # Set up headers with server key for authentication
    $authHeaders = @{
        "Authorization" = "Basic $base64AuthInfo"
        "Content-Type" = "application/json"
    }

    # Authenticate
    $authResponse = Invoke-RestMethod -Uri "http://${NakamaHost}/v2/account/authenticate/email" `
        -Method Post `
        -Headers $authHeaders `
        -Body $authPayload `
        -ErrorAction Stop
        
    $token = $authResponse.token
    
    # Call the debug RPC with the user's token
    $rpcHeaders = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri "http://${NakamaHost}/v2/rpc/dump_nk" `
        -Method Post `
        -Headers $rpcHeaders `
        -Body '""' `
        -ErrorAction Stop
    
    # Try to parse the response as JSON
    try {
        $jsonResponse = $response | ConvertFrom-Json -ErrorAction Stop
        
        Write-Host "=== Nakama Runtime Functions ===" -ForegroundColor Cyan
        Write-Host $jsonResponse.functions
        
        Write-Host "`n=== Matchmaker Function Info ===" -ForegroundColor Cyan
        Write-Host "matchmaker_add type: $($jsonResponse.matchmaker_add_type)"
        Write-Host "matchmaker_add value: $($jsonResponse.matchmaker_add_value)"
        Write-Host "matchmaker_add_player type: $($jsonResponse.matchmaker_add_player_type)"
        Write-Host "matchmaker_add_player value: $($jsonResponse.matchmaker_add_player_value)"
    } catch {
        Write-Host "=== Raw Response ===" -ForegroundColor Yellow
        Write-Host $response
    }
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}
