@echo off
set folder1=download
set folder2=output

if not exist "%cd%/bin/%folder1%" (
    mkdir "%cd%/bin/%folder1%"
)

if not exist "%cd%/bin/%folder2%" (
	mkdir "%cd%/bin/%folder2%"
)