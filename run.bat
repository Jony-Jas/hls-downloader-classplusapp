@echo off
set appPath=%cd%\app.js
node "%appPath%"
echo The app.js script has been executed successfully.
set "downloadFolder=%cd%\bin\download"
for /D %%i in ("%downloadFolder%\*") do (
    rd /s /q "%%i" >nul 2>&1
)
del /q "%downloadFolder%\*" >nul 2>&1
echo The contents of the download folder have been deleted.
pause
