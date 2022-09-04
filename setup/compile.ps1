# build app-installer with one-click

function DeletePath([String]$path) {
    if (Test-Path $path) {
        Remove-Item -path $path -Recurse
        Write-Host ("delete path {0}..." -f $path)
    }
}

Write-Host "press y/n to build frondend project"
$key = $Host.UI.RawUI.ReadKey()
 
if ($key.Character -eq 'y') {
    # build frontend
    Set-Location ../livewallpaper-client-ui
    yarn
    yarn generate
}

Set-Location ../setup

Import-Module -Name "$PSScriptRoot\Invoke-MsBuild\Invoke-MsBuild.psm1" -Force

$sln = "..\LiveWallpaper.Shell\LiveWallpaper.Shell.csproj"
$buildDist = "$PSScriptRoot\publish"
# clean dist
DeletePath -path $buildDist
# build sln
# Invoke-MsBuild -Path $sln -MsBuildParameters "-t:restore /target:Clean;Build /property:Configuration=Release;OutputPath=$buildDist" -ShowBuildOutputInNewWindow -PromptForInputBeforeClosing -AutoLaunchBuildLogOnFailure
Invoke-MsBuild -Path $sln -MsBuildParameters "-t:restore /target:Clean;Publish /p:PublishProfile=./FolderProfile.pubxml" -ShowBuildOutputInNewWindow -PromptForInputBeforeClosing -AutoLaunchBuildLogOnFailure
