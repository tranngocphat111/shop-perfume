# Script fix permissions cho file key
$keyFile = "key-aws-login.pem"
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

Write-Host "Đang sửa quyền file $keyFile..." -ForegroundColor Yellow

try {
    # Lấy ACL hiện tại
    $acl = Get-Acl $keyFile
    
    Write-Host "Quyền hiện tại:" -ForegroundColor Cyan
    $acl.Access | ForEach-Object { 
        Write-Host "  - $($_.IdentityReference): $($_.FileSystemRights)" -ForegroundColor Gray
    }
    Write-Host ""
    
    # Xóa tất cả quyền và inheritance
    $acl.SetAccessRuleProtection($true, $false)
    
    # Xóa tất cả access rules hiện tại
    $rulesToRemove = $acl.Access | Where-Object { $true }
    foreach ($rule in $rulesToRemove) {
        Write-Host "Xóa quyền: $($rule.IdentityReference)" -ForegroundColor Yellow
        $acl.RemoveAccessRule($rule) | Out-Null
    }
    
    # Thêm quyền chỉ cho user hiện tại (Read)
    $permission = $currentUser, "Read", "Allow"
    $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule($permission)
    $acl.SetAccessRule($accessRule)
    
    # Áp dụng quyền
    Set-Acl $keyFile $acl
    
    Write-Host ""
    Write-Host "✅ Đã sửa quyền thành công!" -ForegroundColor Green
    Write-Host "User hiện tại: $currentUser" -ForegroundColor Cyan
    Write-Host ""
    
    # Hiển thị quyền hiện tại
    Write-Host "Quyền hiện tại:" -ForegroundColor Yellow
    Get-Acl $keyFile | Select-Object -ExpandProperty Access | Format-Table -AutoSize
    
} catch {
    Write-Host "❌ Lỗi: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Thử chạy PowerShell với quyền Administrator!" -ForegroundColor Yellow
}

