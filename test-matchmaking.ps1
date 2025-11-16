# Test Nakama Tic-Tac-Toe Matchmaking
# This script tests the complete matchmaking flow with two players

# Configuration
$NakamaHost = "localhost:7350"
$ServerKey = "defaultkey"
$AuthHeader = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${ServerKey}:"))

# Helper function to make API calls
function Invoke-NakamaApi {
    param (
        [string]$Uri,
        [string]$Method = "Get",
        [object]$Body = $null,
        [string]$Token = $null
    )

    $headers = @{
        "Content-Type" = "application/json"
    }

    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    } else {
        $headers["Authorization"] = "Basic $AuthHeader"
    }

    try {
        $params = @{
            Uri = $Uri
            Method = $Method
            Headers = $headers
            ErrorAction = 'Stop'
        }

        # Handle empty string body specially
        if ($null -ne $Body) {
            if ($Body -is [string] -and $Body -eq '""') {
                $params["Body"] = '""'
            } else {
                $params["Body"] = $Body | ConvertTo-Json -Depth 10
            }
        }

        Write-Host "[$Method] $Uri" -ForegroundColor DarkGray
        if ($Body) {
            Write-Host "Request Body:" -ForegroundColor DarkGray
            Write-Host $params["Body"] -ForegroundColor DarkGray
        }

        $response = Invoke-RestMethod @params
        
        Write-Host "Response:" -ForegroundColor DarkGray
        Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor DarkGray
        Write-Host ""
        
        return $response
    } catch {
        Write-Host "❌ Error:" -ForegroundColor Red -NoNewline
        Write-Host " $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response:" -ForegroundColor Red
            Write-Host $responseBody -ForegroundColor Red
        }
        return $null
    }
}

# Print header
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Nakama Tic-Tac-Toe Matchmaking Test    " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Authenticate Player 1
Write-Host "1️⃣  Authenticating Player 1..." -ForegroundColor Yellow
$player1 = @{
    email = "player1@test.com"
    password = "password123"
    create = $true
    username = "Player1"
}

$player1Response = Invoke-NakamaApi -Uri "http://${NakamaHost}/v2/account/authenticate/email" -Method Post -Body $player1
if (-not $player1Response) { 
    Write-Host "❌ Failed to authenticate Player 1" -ForegroundColor Red
    exit 1 
}

$player1Token = $player1Response.token
$player1Id = $player1Response.user.id
Write-Host "✅ Player 1 authenticated" -ForegroundColor Green
Write-Host "   ID: $player1Id" -ForegroundColor Gray
Write-Host "   Username: $($player1Response.username)" -ForegroundColor Gray
Write-Host "   Token: $($player1Token.Substring(0, 20))..." -ForegroundColor Gray
Write-Host ""

# 2. Authenticate Player 2
Write-Host "2️⃣  Authenticating Player 2..." -ForegroundColor Yellow
$player2 = @{
    email = "player2@test.com"
    password = "password123"
    create = $true
    username = "Player2"
}

$player2Response = Invoke-NakamaApi -Uri "http://${NakamaHost}/v2/account/authenticate/email" -Method Post -Body $player2
if (-not $player2Response) { 
    Write-Host "❌ Failed to authenticate Player 2" -ForegroundColor Red
    exit 1 
}

$player2Token = $player2Response.token
$player2Id = $player2Response.user.id
Write-Host "✅ Player 2 authenticated" -ForegroundColor Green
Write-Host "   ID: $player2Id" -ForegroundColor Gray
Write-Host "   Username: $($player2Response.username)" -ForegroundColor Gray
Write-Host "   Token: $($player2Token.Substring(0, 20))..." -ForegroundColor Gray
Write-Host ""

# 3. Player 1 finds a match
Write-Host "3️⃣  Player 1 finding match..." -ForegroundColor Yellow
$findMatchResponse = Invoke-NakamaApi -Uri "http://${NakamaHost}/v2/rpc/find_match" -Method Post -Body '""' -Token $player1Token
if (-not $findMatchResponse) { 
    Write-Host "❌ Failed to find match for Player 1: No response" -ForegroundColor Red
    exit 1 
}

# Check if the response has an error
if ($findMatchResponse.error) {
    Write-Host "❌ Find match RPC failed for Player 1: $($findMatchResponse.error)" -ForegroundColor Red
    exit 1
}

$ticket1 = $findMatchResponse.ticket
Write-Host "✅ Find match RPC successful for Player 1" -ForegroundColor Green
Write-Host "   Ticket: $ticket1" -ForegroundColor Gray
Write-Host "   $($findMatchResponse.message)" -ForegroundColor Gray
Write-Host ""

# 4. Player 2 finds a match (should match with Player 1)
Write-Host "4️⃣  Player 2 finding match..." -ForegroundColor Yellow
$findMatchResponse2 = Invoke-NakamaApi -Uri "http://${NakamaHost}/v2/rpc/find_match" -Method Post -Body '""' -Token $player2Token
if (-not $findMatchResponse2) { 
    Write-Host "❌ Failed to find match for Player 2: No response" -ForegroundColor Red
    exit 1 
}

# Check if the response has an error
if ($findMatchResponse2.error) {
    Write-Host "❌ Find match RPC failed for Player 2: $($findMatchResponse2.error)" -ForegroundColor Red
    exit 1
}

$ticket2 = $findMatchResponse2.ticket
Write-Host "✅ Find match RPC successful for Player 2" -ForegroundColor Green
Write-Host "   Ticket: $ticket2" -ForegroundColor Gray
Write-Host "   $($findMatchResponse2.message)" -ForegroundColor Gray
Write-Host ""

# 5. Wait a moment for the match to be created
Write-Host "5️⃣  Waiting for match to be created (5 seconds)..." -ForegroundColor Yellow
for ($i = 1; $i -le 5; $i++) {
    Write-Host "   Waiting... $i/5" -ForegroundColor Gray
    Start-Sleep -Seconds 1
}
Write-Host ""

# 6. Check Player 1's matches
Write-Host "6️⃣  Checking Player 1's matches..." -ForegroundColor Yellow
$matchesResponse = Invoke-NakamaApi -Uri "http://${NakamaHost}/v2/match" -Method Get -Token $player1Token
if (-not $matchesResponse) { 
    Write-Host "❌ Failed to get matches for Player 1" -ForegroundColor Red
    exit 1 
}

$matchCount = @($matchesResponse.matches).Count
if ($matchCount -gt 0) {
    Write-Host "✅ Found $matchCount matches for Player 1" -ForegroundColor Green
    foreach ($match in $matchesResponse.matches) {
        Write-Host "   Match ID: $($match.match_id)" -ForegroundColor Gray
        Write-Host "   Players: $($match.size)" -ForegroundColor Gray
        Write-Host "   Label: $($match.label)" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ No matches found for Player 1" -ForegroundColor Red
}

# 7. Check Player 2's matches
Write-Host ""
Write-Host "7️⃣  Checking Player 2's matches..." -ForegroundColor Yellow
$matchesResponse2 = Invoke-NakamaApi -Uri "http://${NakamaHost}/v2/match" -Method Get -Token $player2Token
if (-not $matchesResponse2) { 
    Write-Host "❌ Failed to get matches for Player 2" -ForegroundColor Red
    exit 1 
}

$matchCount2 = @($matchesResponse2.matches).Count
if ($matchCount2 -gt 0) {
    Write-Host "✅ Found $matchCount2 matches for Player 2" -ForegroundColor Green
    foreach ($match in $matchesResponse2.matches) {
        Write-Host "   Match ID: $($match.match_id)" -ForegroundColor Gray
        Write-Host "   Players: $($match.size)" -ForegroundColor Gray
        Write-Host "   Label: $($match.label)" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ No matches found for Player 2" -ForegroundColor Red
}

# 8. Check match details if match was created
if ($matchCount -gt 0) {
    $matchId = $matchesResponse.matches[0].match_id
    Write-Host ""
    Write-Host "8️⃣  Getting match details for $matchId..." -ForegroundColor Yellow
    $matchDetails = Invoke-NakamaApi -Uri "http://${NakamaHost}/v2/match/$matchId" -Method Get -Token $player1Token
    
    if ($matchDetails) {
        Write-Host "✅ Match details:" -ForegroundColor Green
        Write-Host ($matchDetails | ConvertTo-Json -Depth 10) -ForegroundColor Gray
    } else {
        Write-Host "❌ Failed to get match details" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
if ($matchCount -gt 0 -and $matchCount2 -gt 0) {
    Write-Host "   🎉 Matchmaking Test SUCCESSFUL!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "   ❌ Matchmaking Test FAILED" -ForegroundColor Red
    exit 1
}
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""