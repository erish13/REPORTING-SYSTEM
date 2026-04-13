$loginUri = "http://localhost:3000/api/auth/login"
$loginBody = @{
    email = "gonzaleserishkarl@gmail.com"
    password = "Erish@2024"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri $loginUri -Method Post -ContentType 'application/json' -Body $loginBody

if ($loginResponse.StatusCode -eq 200) {
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.token
    Write-Host "Login successful. Token: $token"
    
    # Now test PDF generation
    $pdfUri = "http://localhost:3000/api/reports/pdf?period=daily"
    $pdfResponse = Invoke-WebRequest -Uri $pdfUri -Method Get -Headers @{'Authorization' = "Bearer $token"} -OutFile 'test-report.pdf'
    Write-Host "PDF generated successfully"
} else {
    Write-Host "Login failed: $($loginResponse.StatusCode)"
    Write-Host $loginResponse.Content
}
