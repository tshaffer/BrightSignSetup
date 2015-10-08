Library "setupCommon.brs"
Library "setupCore.brs"
Library "setupNetworkDiagnostics.brs"

REM
REM autoplayer
REM Mar 9, 2012
REM Copyright (c) 2012 BrightSign, LLC.
REM 
REM This BrightScript detects and autoplays media as follows:
REM    1. If the video file autoplay.vob or autoplay.mpg or autoplay.wmv or autoplay.mp4 or autoplay.mov exists, it will play and loop forever.
REM    2. If a playlist file autoplay.bsp is found, the playlist is executed in "play list" mode
REM    3. If a comma-separated-value file autoplay.csv exists, it will autoplay in "state machine" mode
REM
REM If more than one autoplay file exists, then the behavior is non-deterministic.
REM

Sub Main()

    autorunVersion$ = "3.5.0.3"
    debugOn = false
    loggingOn = false
    usageLoggingOn = false

    ' some devices will autoplay "index.html"
    htmlWidget = DoesDeviceSupportHtml(debugOn)

    if debugOn then print "autoplay script version ";autorunVersion$;" started"

    deviceWithContentFound = false
    
    if GetDefaultDrive() = "SYS:/" then
    
        ' find a drive with appropriate content on it. if none are found, exit to the splash screen
        devices = ["USB1:/","USB2:/","USB3:/","USB4:/","USB5:/","USB6:/","USB7:/","USB8:/","CF:/","SD:/"]
        
        for each device in devices
        
            if DoesDeviceHaveContent(device, htmlWidget) then
                SetDefaultDrive(device)
                deviceWithContentFound = true
                exit for
            endif
            
        next
        
    else
    
        deviceWithContentFound = true
        
    endif 
        
    if deviceWithContentFound then
    
        modelObject = CreateObject("roDeviceInfo")
        sysInfo = CreateObject("roAssociativeArray")
        sysInfo.autorunVersion$ = autorunVersion$
        sysInfo.deviceUniqueID$ = modelObject.GetDeviceUniqueId()
        sysInfo.deviceFWVersion$ = modelObject.GetVersion()
        sysInfo.deviceModel$ = modelObject.GetModel()
        sysInfo.htmlWidget% = htmlWidget

	v = CreateObject("roVideoMode")
	sysInfo.videoWidth = str(v.GetResX())
	sysInfo.videoHeight = str(v.GetResY())
	v = invalid

        while true

            returnValue$ = Autoplay(debugOn, loggingOn, usageLoggingOn, sysInfo)
            
            if returnValue$ = "reboot" then
                a=RebootSystem()
                stop
            else if returnValue$ = "stop" then
'    print "IN Main() - STOP"     
                end
            else if returnValue$ = "exit" then
                exit while
            endif
        
        end while
        
    endif
    
    splash=CreateObject("roBrightSignSplash")
    splash.Show()

    setupServer = NewSetupServer()

End Sub


Function DoesDeviceSupportHtml(debugOn As Boolean) As Boolean

    ' Detect whether current device supports html by trying to create the widget
    rect=CreateObject("roRectangle", 0, 0, 800, 600)
    hw=CreateObject("roHtmlWidget", rect)
    if type(hw) = "roHtmlWidget" then
        if debugOn then print "DoesDeviceSupportHtml: True"
        return True
    else
        if debugOn then print "DoesDeviceSupportHtml: False"
        return False
    endif

End Function

Function DoesDeviceHaveContent(deviceName As string, supportHtml As Boolean) As Boolean

    contentSpecs = ["autoschedule.txt","autoplay.csv","autoplay.bsp","*.mpg","*.vob","*.ts","*.wmv","*.mp3","*.wav","*.jpg", "*.png", "*.bmp", "*.mov", "*.mpa", "*.mp4", "*.m4a"]

    ' Additions for html enabled devices
    if supportHtml then
        contentSpecs.Push("index.html")
    endif

    for each contentSpec in contentSpecs
    
        l = MatchFiles(deviceName, contentSpec)
        if l.Count() > 0 return true

    next

    return false
    
End Function


Function Autoplay(debugOn As Boolean, loggingOn As Boolean, usageLoggingOn As Boolean, sysInfo As Object) As String

    msgPort = CreateObject("roMessagePort")
    autoscheduleEntries = CreateObject("roAssociativeArray") ' required as the script can't pass in null
    
    fileContents$ = ReadAsciiFile("autoschedule.txt")
    if fileContents$ <> "" then
        return RunScheduler(debugOn, loggingOn, usageLoggingOn, fileContents$, msgPort, sysInfo)
    endif
    
    fileContents$ = ReadAsciiFile("autoplay.csv")
    if fileContents$ <> "" then
        return RunCSV(fileContents$, debugOn, loggingOn, usageLoggingOn, msgPort, autoscheduleEntries, 0, sysInfo)
    endif
    
    fileContents$ = ReadAsciiFile("autoplay.bsp")
    if fileContents$ <> "" then
        retVal = RunBSP(fileContents$, debugOn, loggingOn, usageLoggingOn, msgPort, autoscheduleEntries, 0, sysInfo)
' print "RETURN FROM AutoPlay()"     
        return retVal
        
    endif

    if sysInfo.htmlWidget% then
        htmlFile = CreateObject("roReadFile", "index.html")
        if type(htmlFile) = "roReadFile" then
            return RunHTML("index.html", debugOn, loggingOn, msgPort)
        endif
    endif

    ' everything except HTML expects zone support to be off
    EnableZoneSupport(false)

    RunAutoplayMediaFiles(debugOn, loggingOn, usageLoggingOn, msgPort)
    
'    RunPlayAutoplayVideo(debugOn, loggingOn, usageLoggingOn)
    
    return "exit"
    
End Function


Sub SetAutoVideoMode(debugOn As Boolean)

    di = CreateObject("roDeviceInfo")
    model = di.GetModel()
    di=0
    if model <> "HD2000" then
        videoMode = CreateObject("roVideoMode")
        videoMode$ = "auto"
        if debugOn then print "VIDEOMODE Set to: "; videoMode$
        ok = videoMode.SetMode(videoMode$)
        if ok = 0 then 
            if debugOn then print "Error: Can't set VIDEOMODE to ::"; videoMode$; "::" : stop
        endif
        videoMode = 0
    endif

    return
    
End Sub


REM
REM ******************************************************************
REM ******************************************************************
REM loop all media files in the root directory of the card
REM ******************************************************************
REM ******************************************************************
REM
Sub RunAutoplayMediaFiles(debugOn As Boolean, loggingOn As Boolean, usageLoggingOn As Boolean, msgPort As Object)

    ' since the user has not set videoMode, set it to auto (unless running on an HD2000)
    SetAutoVideoMode(debugOn)

    MEDIA_START = 3
    MEDIA_END = 8

    listOfMediaFiles = ListDir("/")
    fileArray = SortMediaFiles(listOfMediaFiles)
    if fileArray.Count() = 0 then return
    
    videoPlayer = CreateObject("roVideoPlayer")
    videoPlayer.SetLoopMode(false)
    videoPlayer.SetPort(msgPort)

    imagePlayer = CreateObject("roImagePlayer")

    audioPlayer = CreateObject("roAudioPlayer")
    audioPlayer.SetLoopMode(false)
    audioPlayer.SetPort(msgPort)

    gpioPort = CreateObject("roGpioControlPort")
    gpioPort.SetPort(msgPort)

    gpioExpanderPort = CreateObject("roControlPort", "Expander-GPIO")
    if gpioExpanderPort <> invalid then
	    gpioExpanderPort.SetPort(msgPort)
    end if
    
    while true
    
        for each file in fileArray

' TODO - Usage        
'            m.diagnostics.WriteToUsageFile(file)
    
            if IsImageFile(file) then
            
                if debugOn then print "Display image ";file
                
                ok = imagePlayer.DisplayFile(file)
                
                if ok=0 then
                
                    if debugOn then
                        print "Error playing ";file
                    endif
                
                else
                
                    videoPlayer.StopClear()
                    
                    while true
                    
                        msg = wait(3000, msgPort)
                        if debugOn then print "msg received - type="; type(msg)
                        
                        if type(msg) = "Invalid" then ' timeout
                        
                            exit while
                            
                        else if type(msg) = "roGpioButton" Then
                        
                            if msg.GetInt() = 12 Then stop
                            
                        endif
                        
                    end while
                    
                endif
                
            else if IsVideoFile(file) then
            
                if debugOn then print "Play video ";file
                
                ok = videoPlayer.PlayFile(file)
                if ok = 0 then 
                
                    if debugOn then 
                        print "Error playing ";file
                    endif
                
                else
                
                    while true
                    
                        msg = wait(0, msgPort)
                        if debugOn then print "msg received - type="; type(msg)
                        
                        if type(msg) = "roVideoEvent" Then
                        
                            if debugOn then print "Video Event" ; str(msg.GetInt())
                            if msg.GetInt() = MEDIA_END then exit while
                        
                        elseif type(msg) = "roGpioButton" Then
                        
                            if msg.GetInt() = 12 Then stop
                            
                        endif
                        
                    end while
                    
                endif
                
            else if IsAudioFile(file) then
            
                if debugOn then print "Play audio ";file
                
                ok = videoPlayer.Stop()
                ok = audioPlayer.PlayFile(file)
                if ok = 0 then
                    
                    if debugOn then
                        print "Error playing ";file
                    endif

                else
                
                    while true
                    
                        msg = wait(0, msgPort)
                        if debugOn then print "msg received - type="; type(msg)
                        
                        if type(msg) = "roAudioEvent" Then
                        
                            if debugOn then print "Audio Event" ; str(msg.GetInt())
                            if msg.GetInt() = MEDIA_END then
                                audioPlayer.Stop()
                                exit while
                            endif
                        
                        elseif type(msg) = "roGpioButton" Then
                        
                            if msg.GetInt() = 12 Then stop
                            
                        endif
                        
                    end while
                    
                endif
            
            endif
            
        next

    end while

    return
    
End Sub


Function SortMediaFiles(listOfFiles As Object) As Object

    dim fileArray[10]
    
    for each file in listOfFiles
        if IsMediaFile(file) then fileArray.push(file)
    next
    
    numberOfFiles% = fileArray.Count()
    
    if numberOfFiles% > 0 then
    
        for i% = numberOfFiles% - 1 to 1 step -1
            for j% = 0 to i%-1
                if fileArray[j%] > fileArray[j%+1] then
                    tmp = fileArray[j%]
                    fileArray[j%] = fileArray[j%+1]
                    fileArray[j%+1] = tmp
                endif
            next
        next

    endif
    
    return fileArray
    
End Function


REM
REM ******************************************************************
REM ******************************************************************
REM autoplay.vob or autoplay.mpg (simple video loop)
REM ******************************************************************
REM ******************************************************************
REM
Sub RunPlayAutoplayVideo(debugOn As Boolean, loggingOn As Boolean, usageLoggingOn As Boolean)

    if debugOn then print "RunPlayAutoplayVideo entered"
    
    videoPlayer = CreateObject("roVideoPlayer")
    videoPlayer.SetLoopMode(true)
    
    ' EnableZoneSupport(false)

    ok = videoPlayer.PlayFile("autoplay.mpg")
    if ok = 0 then
        ok = videoPlayer.PlayFile("autoplay.vob")
        if ok = 0 then
            ok = videoPlayer.PlayFile("autoplay.wmv")
            if ok = 0 then
                ok = videoPlayer.PlayFile("autoplay.mov")
                if ok = 0 then
                    ok = videoPlayer.PlayFile("autoplay.mp4")
                    if ok = 0 then
                        if debugOn then
                            print "Error finding autoplay.mpg or autoplay.vob" : stop
                        endif
                    endif
                endif
            endif
        endif
    endif
    
    msgPort = CreateObject("roMessagePort")
    
    while true
        msg = wait(0, msgPort)   ' wait forever
    end while
    
    return
    
End Sub


REM
REM ******************************************************************
REM ******************************************************************
REM autoschedule.txt
REM ******************************************************************
REM ******************************************************************
REM
Function RunScheduler(debugOn As Boolean, loggingOn As Boolean, usageLoggingOn As Boolean, fileContents$ As String, msgPort As Object, sysInfo As Object) As String

    diagnostics = newDiagnostics(debugOn, loggingOn, usageLoggingOn)
    
    diagnostics.PrintDebug("RunScheduler entered")
    
    ' get eol characters so that file can be parsed properly
    eolInfo = GetEol(fileContents$)

    systemTime = CreateObject("roSystemTime")
    currentDateTime = systemTime.GetLocalDateTime()
REM add 5 seconds to current time to account for processing time.
    currentDateTime.AddSeconds(5)
'print "currentDateTime: ";currentDateTime.GetYear();"/";currentDateTime.GetMonth();"/";currentDateTime.GetDay();" ";currentDateTime.GetHour();":";currentDateTime.GetMinute()

    Dim autoscheduleEntries[64]
    Dim sortedIndices[64]
    numScheduledEvents% = 0

    ' parse autoschedule.txt
    parseInfo = CreateObject("roAssociativeArray")
    parseInfo.position = 1
    parseInfo.fileContents$ = fileContents$
    parseInfo.eol = eolInfo.eol
    parseInfo.eoln = eolInfo.eoln

    parsingDate = true
    
    line$ = GetLine(parseInfo)
    while (line$ <> "END")

        if len(line$) <> 0 then
        
            if not CheckTokenLen(line$, "REM") then
                        
                if parsingDate then
                
                    dateTime = DateParser(ucase(line$))
                    
                    newTimer = CreateObject("roTimer")
                    newTimer.SetTime(dateTime.hour%, dateTime.minute%, 0)
                    newTimer.SetDate(dateTime.year%, dateTime.month%, dateTime.day%)
                    newTimer.SetDayOfWeek(dateTime.dayOfWeek%)
                    newTimer.SetPort(msgPort)
                    
                    autoscheduleEntry = CreateObject("roAssociativeArray")
                    autoscheduleEntry.scheduledTimer = newTimer
                    autoscheduleEntries[numScheduledEvents%] = autoscheduleEntry
                    
'        if debug then print "SetTimer: year=";yearValue;" month=";monthValue;" day=";dayValue;" hour=";hourValue;" minuteValue=";minuteValue;" dayOfWeek=";dayOfWeek

                    ' Timers that have year,month,day,hour,minute that are in the past will trigger.
                    ' Discard those timers. Turn on all other timers

                    if dateTime.year% = -1 or dateTime.month% = -1 or dateTime.day% = -1 or dateTime.hour% = -1 or dateTime.minute% = -1 then
                        newTimer.Start()
                    endif

                    if dateTime.year% <> -1 and dateTime.month% <> -1 and dateTime.day% <> -1 and dateTime.hour% <> -1 and dateTime.minute% <> -1 then
                        newTimerDateTime = systemTime.GetLocalDateTime()
                        newTimerDateTime.SetYear(dateTime.year%)
                        newTimerDateTime.SetMonth(dateTime.month%)
                        newTimerDateTime.SetDay(dateTime.day%)
                        newTimerDateTime.SetHour(dateTime.hour%)
                        newTimerDateTime.SetMinute(dateTime.minute%)
                        newTimerDateTime.SetSecond(0)
                        newTimerDateTime.Normalize()
                        if newTimerDateTime > currentDateTime then newTimer.Start()
'                       if newTimerDateTime <= currentDateTime then print "Discard timer number ";numScheduledEvents
                    endif

                    
                    normalizedDate = NormalizeDate(dateTime)
                    autoscheduleEntry.scheduledTime = normalizedDate
                    
                    parsingDate = false

                else
                
                    autoscheduleEntry.fileName$ = line$
                    parsingDate = true
                    numScheduledEvents% = numScheduledEvents% + 1

                endif
                
            endif

        endif

        line$ = GetLine(parseInfo)

    endwhile

REM
REM     Sort date/time specifications.
REM     The most recent specification that occurs in the past determines which files to play first
REM
    SortTimes(autoscheduleEntries, sortedIndices, numScheduledEvents%)
    
    indexOfCurrentTime% = -1

    for i%=0 to numScheduledEvents%
        j% = sortedIndices[i%]
        if j% = numScheduledEvents% then indexOfCurrentTime% = i%
    next
    if indexOfCurrentTime% = -1 then print "Program error":stop

    ' Play the file associated with the time just before current time
    ' If the current time is before all timers, play the first file
    if indexOfCurrentTime% > 0 then indexOfStartingFile% = indexOfCurrentTime% - 1
    if indexOfCurrentTime% = 0 then indexOfStartingFile% = 1
    diagnostics.PrintDebug("startingFile=" + autoscheduleEntries[sortedIndices[indexOfStartingFile%]].fileName$)

    fileName$ = autoscheduleEntries[sortedIndices[indexOfStartingFile%]].fileName$

    if instr(1, ucase(fileName$), ".CSV") > 0 then
        fileContents$ = ReadAsciiFile(fileName$)
        if fileContents$ = "" then print "Unexpected error reading ";fileName$ : stop
        return RunCSV(fileContents$, debugOn, loggingOn, usageLoggingOn, msgPort, autoscheduleEntries, numScheduledEvents%, sysInfo)
    endif

    if instr(1, ucase(fileName$), ".BSP") > 0 then
        fileContents$ = ReadAsciiFile(fileName$)
        if fileContents$ = "" then print "Unexpected error reading ";fileName$ : stop
        return RunBSP(fileContents$, debugOn, loggingOn, usageLoggingOn, msgPort, autoscheduleEntries, numScheduledEvents%, sysInfo)
    endif

    if IsVideoFile(fileName$) then

        ' EnableZoneSupport(false)

        diagnostics.PrintDebug("Play scheduled video " + fileName$)
        videoPlayer = CreateObject("roVideoPlayer")
        videoPlayer.SetLoopMode(true)
        ok = videoPlayer.PlayFile(fileName$)
        if ok=0 then diagnostics.PrintDebug("Error finding scheduled video file") : stop

' USAGE todo - need to write usage info each time through the loop

        diagnostics.WriteToUsageFile(fileName$)

        while true
            msg = wait(0, msgPort)   ' wait for timer
            if type(msg)="roTimerEvent" then
                diagnostics.PrintDebug("Timer Event")
                timerFound = FindAutoscheduleTimer(autoscheduleEntries, numScheduledEvents%, msg)
                if timerFound then return "restart"
                diagnostics.PrintDebug("Scheduled timeout occurred but corresponding timer not found.") : stop
            endif
        end while
    endif

    if IsImageFile(fileName$) then

        ' EnableZoneSupport(false)

        diagnostics.PrintDebug("Display scheduled image " + fileName$)
        imagePlayer = CreateObject("roImagePlayer")
        ok = imagePlayer.DisplayFile(fileName$)
        if ok=0 then diagnostics.PrintDebug("Error finding scheduled image file") : stop

' USAGE todo - need to write usage info each time through the loop

        m.diagnostics.WriteToUsageFile(fileName$)

        while true
            msg=wait(0, msgPort) ' wait for timer
            if type(msg)="roTimerEvent" then
                diagnostics.PrintDebug("Timer Event")
                timerFound = FindAutoscheduleTimer(autoscheduleEntries, numScheduledEvents%, msg)
                if timerFound then return "restart"
                diagnostics.PrintDebug("Scheduled timeout occurred but corresponding timer not found.") : stop
            endif
        end while
    endif
    
    stop
    
    return "stop"
    
End Function


REM
REM
REM     Sort times
REM         Sort all the specified date/times. Include the current date/time.
REM         This is also used to determine which file to play on startup
REM
Sub SortTimes(autoscheduleEntries As Object, sortedIndices As Object, numScheduledEvents% As Integer)

    systemTime = CreateObject("roSystemTime")
    currentDateTime = systemTime.GetLocalDateTime()
    
    autoscheduleEntry = CreateObject("roAssociativeArray")
    autoscheduleEntry.scheduledTime = currentDateTime
    autoscheduleEntries[numScheduledEvents%] = autoscheduleEntry

    ' initialize array with indices. last entry is currentDateTime
    for i% = 0 to numScheduledEvents%
        sortedIndices[i%] = i%
    next

    numItemsToSort = numScheduledEvents% + 1

    ' sort array
    for i% = numItemsToSort - 1 to 1 step -1
        for j% = 0 to i%-1
            index0 = sortedIndices[j%]
            time0 = autoscheduleEntries[index0].scheduledTime
            index1 = sortedIndices[j%+1]
            time1 = autoscheduleEntries[index1].scheduledTime
            if time0.GetString() > time1.GetString() then
                k% = sortedIndices[j%]
                sortedIndices[j%] = sortedIndices[j%+1]
                sortedIndices[j%+1] = k%
            endif
        next
    next
            
    return

End Sub


REM
REM     DateNormalizer
REM         Given the date/time specification (which may include wildcards), determine the
REM         latest date/time consistent with the specification that is before the current time
REM         The purpose of this is to figure out which file to play first
REM
Function NormalizeDate(dateTime As Object) As Object

    systemTime = CreateObject("roSystemTime")
    
    currentDateTime = systemTime.GetLocalDateTime()
    normalizedDateTime = systemTime.GetLocalDateTime()

    if dateTime.year%=-1 then normalizedDateTime.SetYear(2000)
    if dateTime.year%<>-1 then normalizedDateTime.SetYear(dateTime.year%)

    if dateTime.month%=-1 then normalizedDateTime.SetMonth(1)
    if dateTime.month%<>-1 then normalizedDateTime.SetMonth(dateTime.month%)

    if dateTime.day%=-1 then normalizedDateTime.SetDay(1)
    if dateTime.day%<>-1 then normalizedDateTime.SetDay(dateTime.day%)

    if dateTime.hour%=-1 then normalizedDateTime.SetHour(0)
    if dateTime.hour%<>-1 then normalizedDateTime.SetHour(dateTime.hour%)

    if dateTime.minute%=-1 then normalizedDateTime.SetMinute(0)
    if dateTime.minute%<>-1 then normalizedDateTime.SetMinute(dateTime.minute%)

    normalizedDateTime.SetSecond(0)

    if dateTime.year%<>-1 and dateTime.month%<>-1 and dateTime.day%<>-1 and dateTime.dayOfWeek%<>-1 then
        normalizedDateTime.Normalize()
        normDayOfWeek = normalizedDateTime.GetDayOfWeek()
        if normDayOfWeek<>dateTime.dayOfWeek% then
'            if debugOn then print "Specified date inconsistent with specified day of week - ignoring day of week"
            dateTime.dayOfWeek%=-1
        endif
    endif

    if dateTime.dayOfWeek%<>-1 then
        normalizedDateTime.Normalize()
        normDayOfWeek = normalizedDateTime.GetDayOfWeek()
        if normDayOfWeek<>dateTime.dayOfWeek% then
            if dateTime.dayOfWeek%>normDayOfWeek then
                daysToAdd=dateTime.dayOfWeek%-normDayOfWeek
            endif
            if dateTime.dayOfWeek%<normDayOfWeek then
                daysToAdd=7-(normDayOfWeek-dateTime.dayOfWeek%)
            endif
            normalizedDateTime.AddSeconds(daysToAdd*24*3600)
            normalizedDateTime.Normalize()
            normDayOfWeek = normalizedDateTime.GetDayOfWeek()
            if normDayOfWeek<>dateTime.dayOfWeek% then print "program error - bad day of week calculation":stop
        endif
    endif

    if normalizedDateTime.GetString() <= currentDateTime.GetString() then
    
        if dateTime.year%=-1 then
            normalizedDateTime.SetYear(currentDateTime.GetYear())
            if normalizedDateTime.GetString() > currentDateTime.GetString() then
                ' go to prior year
                normalizedDateTime.SetYear(currentDateTime.GetYear()-1)
            endif
        endif

        if dateTime.month%=-1 then
            normalizedDateTime.SetMonth(12)
            if normalizedDateTime.GetString() > currentDateTime.GetString() then
                normalizedDateTime.SetMonth(currentDateTime.GetMonth())
                if normalizedDateTime.GetString() > currentDateTime.GetString() then
                    newMonth = currentDateTime.GetMonth()-1
                    if newMonth=0 then print "program error - bad month calculation":stop
                    normalizedDateTime.SetMonth(newMonth)
                endif
            endif
        endif

        if dateTime.day%=-1 then
            normMonth=normalizedDateTime.GetMonth()
            maxDayInMonth=31
            if normMonth=2 then
                maxDayInMonth=28
                curYear = normalizedDateTime.GetYear()
                div%=curYear/4
                if curYear=(div%*4) then maxDayInMonth=29
            endif
            if normMonth=4 or normMonth=6 or normMonth=9 or normMonth=11 then maxDayInMonth=30
            normalizedDateTime.SetDay(maxDayInMonth)
            if normalizedDateTime.GetString() > currentDateTime.GetString() then
                normalizedDateTime.SetDay(currentDateTime.GetDay())
                if normalizedDateTime.GetString() > currentDateTime.GetString() then
                    newDay = currentDateTime.GetDay()-1
                    if newDay=0 then print "program error - bad day calculation":stop
                    normalizedDateTime.SetDay(newDay)
                endif
            endif
        endif

        if dateTime.hour%=-1 then
            normalizedDateTime.SetHour(23)
            if normalizedDateTime.GetString() > currentDateTime.GetString() then
                normalizedDateTime.SetHour(currentDateTime.GetHour())
                if normalizedDateTime.GetString() > currentDateTime.GetString() then
                    newHour = currentDateTime.GetHour()-1
                    if newHour<0 then print "program error - bad hour calculation":stop
                    normalizedDateTime.SetHour(newHour)
                endif
            endif
        endif

        if dateTime.minute%=-1 then
            normalizedDateTime.SetMinute(59)
            if normalizedDateTime.GetString() > currentDateTime.GetString() then
                normalizedDateTime.SetMinute(currentDateTime.GetMinute())
                if normalizedDateTime.GetString() > currentDateTime.GetString() then
                    newMinute = currentDateTime.GetMinute()-1
                    if newMinute<0 then print "program error - bad minute calculation":stop
                    normalizedDateTime.SetMinute(newMinute)
                endif
            endif
        endif

        ' fix up day of week if it was specified
        if dateTime.dayOfWeek%<>-1 then
            normalizedDateTime.Normalize()
            normDayOfWeek = normalizedDateTime.GetDayOfWeek()
            if normDayOfWeek<>dateTime.dayOfWeek% then
                if dateTime.dayOfWeek%<normDayOfWeek then
                    daysToSubtract=normDayOfWeek-dateTime.dayOfWeek%
                endif
                if dateTime.dayOfWeek%>normDayOfWeek then
                    daysToSubtract=7-(dateTime.dayOfWeek%-normDayOfWeek)
                endif
                normalizedDateTime.SubtractSeconds(daysToSubtract*24*3600)
                
                while true
                
                    normalizedDateTime.Normalize()
                    normDayOfWeek = normalizedDateTime.GetDayOfWeek()
                    if normDayOfWeek<>dateTime.dayOfWeek% then print "program error - bad day of week calculation":stop
                
                    ' check to see if current year/month/day is consistent with spec
                    if dateTime.year%<>-1 and normalizedDateTime.GetYear()<>dateTime.year% then
                        normalizedDateTime.SubtractSeconds(7*24*3600)
                    else if dateTime.month%<>-1 and normalizedDateTime.GetMonth()<>dateTime.month% then
                        normalizedDateTime.SubtractSeconds(7*24*3600)
                    else if dateTime.day%<>-1 and normalizedDateTime.GetDay()<>dateTime.day% then
                        normalizedDateTime.SubtractSeconds(7*24*3600)
                    else
                        ' year,month,day are consistent with day of week. adjust hours/minutes as needed
                        if dateTime.hour%=-1 then normalizedDateTime.SetHour(23)
                        if dateTime.minute%=-1 then normalizedDateTime.SetMinute(59)
                        Exit while
                    endif
                
                end while
            endif
        endif
    endif

    return normalizedDateTime

    ' if debug then print "normalizedDateTime: ";normalizedDateTime.GetYear();"/";normalizedDateTime.GetMonth();"/";normalizedDateTime.GetDay();" ";normalizedDateTime.GetHour();":";normalizedDateTime.GetMinute()

End Function


REM
REM ******************************************************************
REM ******************************************************************
REM autoplay.bsp(BrightSign Playlist -- simple text file of files and commands)
REM ******************************************************************
REM ******************************************************************
REM
Function RunBsp(fileContents$ As String, debugOn As Boolean, loggingOn As Boolean, usageLoggingOn As Boolean, msgPort As Object, autoscheduleEntries As Object, numScheduledEvents% As Integer, sysInfo As Object) As String

    BSP = newBSP(debugOn, loggingOn, usageLoggingOn, msgPort, autoscheduleEntries, numScheduledEvents%)

    BSP.diagnostics.SetSystemInfo(sysInfo)
    BSP.networking.SetSystemInfo(sysInfo)

    BSP.networkingActive = BSP.networking.InitializeNetworkDownloads()

    if fileContents$ = "" then print "Unexpected error reading autoplay.bsp" : stop
    if fileContents$<>"" then
        BSP.ParseBsp(fileContents$)
        
        if BSP.videoModeSet = false then
            SetAutoVideoMode(debugOn)
        endif
        
        retValue = BSP.PlayBsp()
        ' kill the circular reference
        BSP.networking.parent = 0
        
' print "RETURN FROM RunBsp() retValue=";retValue     
'        for each entry in BSP
'            print "DBG: ";entry;" is ";BSP[entry];" of type ";type(BSP[entry])  
'        next

        return retValue
    endif

    return "stop"

End Function


Function newBSP(debugOn As Boolean, loggingOn As Boolean, usageLoggingOn As Boolean, msgPort As Object, autoscheduleEntries As Object, numScheduledEvents% As Integer) As Object

    BSP = CreateObject("roAssociativeArray")

    BSP.debugOn = debugOn
    
    BSP.videoModeSet = false
    
    BSP.systemTime = CreateObject("roSystemTime")
    BSP.zones = CreateObject("roArray", 100, true)
    BSP.zoneDefaults = newZoneDefaults()
    BSP.diagnostics = newDiagnostics(debugOn, loggingOn, usageLoggingOn)

    BSP.msgPort = msgPort
    BSP.autoscheduleEntries = autoscheduleEntries
    BSP.numScheduledEvents% = numScheduledEvents%

    BSP.newNetworking = newNetworking
    BSP.networking = BSP.newNetworking(BSP)
    
    BSP.networkTimerDownload = 0
    BSP.networkTimerCache = 0
    BSP.networkTimerHeartbeat = 0
    BSP.networkTimerRSS = 0
    BSP.ResetDownloadTimerToDoRetry = ResetDownloadTimerToDoRetry
    BSP.StopPlayback = StopPlaylistPlayback
    
    BSP.gpioPort = 0
    BSP.gpioExpanderPort = 0
    
    BSP.zoneWaitingForButtonInput% = -1
    
    BSP.ParseBSP = ParseBsp
    BSP.PlayBSP = PlayBsp
    BSP.WaitForBspEvent = WaitForBspEvent
    BSP.LaunchZonePlay = LaunchZonePlay

    BSP.SetPlaylistNetworkTimerPeriodicWithinRange = SetPlaylistNetworkTimerPeriodicWithinRange
    BSP.SetNetworkTimerPeriodicWithinRange = SetNetworkTimerPeriodicWithinRange
    BSP.SetPlaylistNetworkTimerPeriodic = SetPlaylistNetworkTimerPeriodic
    BSP.SetNetworkTimerPeriodic = SetNetworkTimerPeriodic
    BSP.SetPlaylistNetworkTimerRange = SetPlaylistNetworkTimerRange
    BSP.SetNetworkTimerRange = SetNetworkTimerRange
    BSP.SetPlaylistNetworkTimerDateTime = SetPlaylistNetworkTimerDateTime
    BSP.SetNetworkTimerDateTime = SetNetworkTimerDateTime
    BSP.HandleNetworkTimerEvent = HandleNetworkTimerEvent
    
    BSP.StopAutoscheduleTimers = StopAutoscheduleTimers
    
    BSP.timerHandlers = CreateObject("roAssociativeArray")
    BSP.newTimerHandler = newTimerHandler

    return BSP

End Function
 

Function newTimerHandler(zoneIndex% As Integer) As Object

    timerHandler = CreateObject("roAssociativeArray")

    timerHandler.zoneIndex% = zoneIndex%

    return timerHandler

End Function


Function newZoneDefaults() As Object

    zoneDefaults = CreateObject("roAssociativeArray")

    VIEWMODE_SCALE_TO_FIT = 0
    VIEWMODE_LETTERBOXED = 1
    VIEWMODE_FILLSCREEN = 2

    IMAGEMODE_CENTER = 0
    IMAGEMODE_SCALE_TO_FIT = 1
    IMAGEMODE_SCALE_TO_FILL_AND_CROP = 2
    IMAGEMODE_SCALE_TO_FILL = 3

    zoneDefaults.imageMode% = IMAGEMODE_SCALE_TO_FIT
    zoneDefaults.slideInterval% = 3000
    zoneDefaults.transition% = 0
        
    zoneDefaults.viewMode% = VIEWMODE_FILLSCREEN
    zoneDefaults.audioOutput% = 4
    zoneDefaults.digitalAudioOutput% = 0
    zoneDefaults.audioMode% = 0
    zoneDefaults.audioMapping% = 0
    zoneDefaults.volume% = 100

    zoneDefaults.foregroundTextColor% = &ha0a0a0
    zoneDefaults.backgroundTextColor% = &hff000000
    zoneDefaults.backgroundBitmapFile$ = ""
    zoneDefaults.stretchBackgroundBitmap = 0
    
    zoneDefaults.language$ = "English"
    
    zoneDefaults.brightness% = 32
    zoneDefaults.contrast% = 64
    zoneDefaults.saturation% = 64
    zoneDefaults.hue% = 0
    
    return zoneDefaults
    
End Function


Function ParseBsp(fileContents$ As String) As Void

    zones = m.zones
    zoneDefaults = m.zoneDefaults
    
    firstLineRead = false

    zoneCount% = 0
    m.videoZoneIndex% = -1
   
    zonesEnabled = false
    zonesActive = false

    m.diagnostics.PrintDebug("play_bsp entered")

    ' get eol characters so that file can be parsed properly
    eolInfo = GetEol(fileContents$)

    ' parse playlist
    parseInfo = CreateObject("roAssociativeArray")
    parseInfo.position = 1
    parseInfo.fileContents$ = fileContents$
    parseInfo.eol = eolInfo.eol
    parseInfo.eoln = eolInfo.eoln

    if len(fileContents$) > 3 then
        ' check for UTF-8 strings (ef, bb, bf)
        line$ = left(fileContents$, 3)
        if asc(line$) = -17 then
            line$ = right(line$, len(line$) - 1)
            if asc(line$) = -69 then
                line$ = right(line$, len(line$) - 1)
                if asc(line$) = -65 then
                    parseInfo.position = 4
                endif
            endif
        endif
    endif
    
    line$ = GetLine(parseInfo)
    
    while (line$ <> "END")

        if len(line$) <> 0 then
        
            if not firstLineRead then
                        
                firstLineRead = true
                if CheckToken(line$, "EnableZones") then
                    EnableZoneSupport(true)
                    zonesEnabled = true
                else
                    zone = CreateObject("roAssociativeArray")
                    zone.videoPlayer = CreateObject("roVideoPlayer")
                    zone.imagePlayer = CreateObject("roImagePlayer")
                    zone.audioPlayer = CreateObject("roAudioPlayer")
                    zone.videoInput = 0
                    zone.widget = 0
                    zone.isVideoZone = true
                    zone.isStaticImage = false
                    m.videoZoneIndex% = 0
                    zone.playlistCmds$ = CreateObject("roArray", 512, true)
                    zone.playlistCmdParams = CreateObject("roArray", 512, true)
                    zone.numCommands = 0
                    zone.numMediaFiles = 0
                    zone.playbackIndex = 0

                    zones[zoneCount%] = zone
                    zoneCount% = 1
                    zonesActive=true
                endif
            endif
        
            if CheckToken(line$, "DefineZone") then

                zoneParameters = ParseDefineZone(line$)

                zone = CreateObject("roAssociativeArray")
                zone.videoPlayer = 0
                zone.imagePlayer = 0
                zone.audioPlayer = 0
                zone.videoInput = 0
                zone.widget = 0

                zone.isVideoZone = false
                zone.isStaticImage = false

                r=CreateObject("roRectangle", zoneParameters.xStart%, zoneParameters.yStart%, zoneParameters.width%, zoneParameters.height%)

                if KeywordMatches(zoneParameters.zoneType$, "VideoOrImages") then
                
                    if m.videoZoneIndex% <> -1 then print "A zone with video has already been created - only one zone with video is allowed" : stop
                    
                    videoPlayer = CreateObject("roVideoPlayer")
                    if type(videoPlayer) <> "roVideoPlayer" then print "videoPlayer creation failed" : stop
                    videoPlayer.SetRectangle(r)
                    
                    imagePlayer = CreateObject("roImagePlayer")
                    imagePlayer.SetRectangle(r)
                    
                    audioPlayer = CreateObject("roAudioPlayer")
                    
                    zone.videoPlayer = videoPlayer

                    zone.imagePlayer = imagePlayer

                    zone.audioPlayer = audioPlayer
                    
                    zone.isVideoZone = true
                              
                    m.videoZoneIndex% = zoneCount%

                elseif KeywordMatches(zoneParameters.zoneType$, "StaticImage") then

                    if m.videoZoneIndex% <> -1 then print "A zone with video has already been created - a static image zone requires the video layer" : stop
                    
                    videoPlayer = CreateObject("roVideoPlayer")
                    if type(videoPlayer) <> "roVideoPlayer" then print "videoPlayer creation failed" : stop
                    videoPlayer.SetRectangle(r)
                    
                    zone.videoPlayer = videoPlayer

                    zone.isVideoZone = true
                    
                    zone.isStaticImage = true
                              
                    m.videoZoneIndex% = zoneCount%
                    
                    ' param1$=image file name
                    videoPlayer.PlayStaticImage(zoneParameters.param1$)
                              
                elseif KeywordMatches(zoneParameters.zoneType$, "Video") then
                
                    if m.videoZoneIndex% <> -1 then print "A zone with video has already been created - only one zone with video is allowed" : stop
                    
                    videoPlayer = CreateObject("roVideoPlayer")
                    if type(videoPlayer) <> "roVideoPlayer" then print "videoPlayer creation failed" : stop
                    videoPlayer.SetRectangle(r)
                    
                    audioPlayer = CreateObject("roAudioPlayer")
                    
                    zone.videoPlayer = videoPlayer

                    zone.audioPlayer = audioPlayer
                    
                    zone.isVideoZone = true
                              
                    m.videoZoneIndex% = zoneCount%
                              
                elseif KeywordMatches(zoneParameters.zoneType$, "Images") then
                
                    imagePlayer = CreateObject("roImagePlayer")
                    imagePlayer.SetRectangle(r)
                    
                    zone.imagePlayer = imagePlayer
                                    
                elseif KeywordMatches(zoneParameters.zoneType$, "Clock") then
                
                    ' param1$=display type

                    resourceManager = CreateObject("roResourceManager", "resources.txt")
                    
                    language$ = "eng"
                    if m.zoneDefaults.language$ = "German"
                        language$ = "ger"
                    else if m.zoneDefaults.language$ = "Spanish"
                        language$ = "spa"
                    else if m.zoneDefaults.language$ = "French"
                        language$ = "fre"
                    else if m.zoneDefaults.language$ = "Italian"
                        language$ = "ita"
                    else if m.zoneDefaults.language$ = "Dutch"
                        language$ = "dut"
                    else if m.zoneDefaults.language$ = "Swedish"
                        language$ = "swe"
                    else if m.zoneDefaults.language$ = "Japanese"
                        language$ = "jpn"
                    else if m.zoneDefaults.language$ = "Chinese"
                        language$ = "chs"
                    else if m.zoneDefaults.language$ = "Chinese Traditional"
                        language$ = "cht"
                    endif
                    
                    ok = resourceManager.SetLanguage(language$)
                    if not ok then print "No resources for language ";language$ : stop
                    
                    if zoneParameters.param1$ = "" or zoneParameters.param1$ = "1" then
                        displayTime% = 1
                    else
                        displayTime% = 0
                    endif
                    
                    clockWidget = CreateObject("roClockWidget", r, resourceManager, displayTime%)
                    clockWidget.SetForegroundColor(zoneDefaults.foregroundTextColor%)
                    clockWidget.SetBackgroundColor(zoneDefaults.backgroundTextColor%)
                    
                    if zoneDefaults.backgroundBitmapFile$ <>  "" then
                        clockWidget.SetBackgroundBitmap(zoneDefaults.backgroundBitmapFile$, zoneDefaults.stretchBackgroundBitmap)
                    endif                    
                    
                    zone.widget = clockWidget
                                   
                elseif KeywordMatches(zoneParameters.zoneType$, "Text") then
                    ' param1$=line count
                    ' param2$=text mode
                    ' param3$=pause time
                    ' param4$=rotation
                    ' param5$=alignment
                    if zoneParameters.param1$ = "" or zoneParameters.param2$ = "" or zoneParameters.param3$ = "" then print "Bad Text widget spec":stop
                    
                    a=CreateObject("roAssociativeArray")
                    a["PauseTime"] = int(val(zoneParameters.param3$))
                    if zoneParameters.param4$ <> "" then
                        a["Rotation"] = int(val(zoneParameters.param4$))
                    endif
                    if zoneParameters.param5$ <> "" then
                        a["Alignment"] = int(val(zoneParameters.param5$))
                    endif

                    textWidget = CreateObject("roTextWidget", r, val(zoneParameters.param1$), val(zoneParameters.param2$), a)
                    textWidget.SetForegroundColor(zoneDefaults.foregroundTextColor%)

                    textWidget.SetBackgroundColor(zoneDefaults.backgroundTextColor%)
                    
                    if zoneDefaults.backgroundBitmapFile$ <>  "" then
                        textWidget.SetBackgroundBitmap(zoneDefaults.backgroundBitmapFile$, zoneDefaults.stretchBackgroundBitmap)
                    endif                    
                    
                    zone.widget = textWidget
                    
                elseif KeywordMatches(zoneParameters.zoneType$, "RSS") then
                
                    ' param1$=line count
                    ' param2$=text mode
                    ' param3$=pause time
                    ' param4$=URL

                    rssURLXfer = CreateObject("roUrlTransfer")
                    rssURLXfer.SetUrl(zoneParameters.param4$)
                    rssURLXfer.GetToFile("tmp:/rss.xml")
                    rssParser = CreateObject("roRssParser")
                    rssParser.ParseFile("tmp:/rss.xml")
                    rssWidget = CreateObject("roTextWidget", r, val(zoneParameters.param1$), val(zoneParameters.param2$), val(zoneParameters.param3$))
                    rssWidget.SetForegroundColor(zoneDefaults.foregroundTextColor%)
                    rssWidget.SetBackgroundColor(zoneDefaults.backgroundTextColor%)
                    
                    if zoneDefaults.backgroundBitmapFile$ <>  "" then
                        rssWidget.SetBackgroundBitmap(zoneDefaults.backgroundBitmapFile$, zoneDefaults.stretchBackgroundBitmap)
                    endif                    

                    article = rssParser.GetNextArticle()
                    while type(article) = "roRssArticle"
                        rssWidget.PushString(article.GetDescription())
                        article = rssParser.GetNextArticle()
                    endwhile
                    
                    zone.widget = rssWidget
                    zone.rssURLXfer = rssURLXfer
                    zone.rssParser = rssParser
                                                        
                else
                    print "Incorrect zone specification" : stop
                endif
            
                zone.playlistCmds$ = CreateObject("roArray", 256, true)
                zone.playlistCmdParams = CreateObject("roArray", 256, true)
                zone.numCommands = 0
                zone.numMediaFiles = 0
                zone.playbackIndex = 0
                
                zones[zoneCount%] = zone
                zoneCount% = zoneCount% + 1
                
                zonesActive = true

            elseif CheckToken(line$, "SlideInterval ") then

                interval% = val(mid(line$,15))*1000

                if zonesActive then
                    zone.playlistCmds$[zone.numCommands] = "SlideInterval"
                    zone.playlistCmdParams[zone.numCommands] = interval%
                    zone.numCommands = zone.numCommands + 1
                else
                    zoneDefaults.slideInterval% = interval%
                endif
                
            elseif CheckToken(line$, "Transition ") then
            
                transition% = val(mid(line$,12))

                if zonesActive then
                    zone.playlistCmds$[zone.numCommands] = "Transition"
                    zone.playlistCmdParams[zone.numCommands] = transition%
                    zone.numCommands = zone.numCommands + 1
                else
                    zoneDefaults.transition% = transition%
                endif
              
            elseif CheckToken(line$, "VideoMode ") then
            
                videoMode = CreateObject("roVideoMode")
                videoMode$ = mid(line$, 11)
                m.diagnostics.PrintDebug("VIDEOMODE Set to: " + videomode$)
                ok = videoMode.SetMode(videomode$)
                if ok = 0 then m.diagnostics.PrintDebug("Error: Can't set VIDEOMODE to ::" + videomode$ + "::") : stop
                videoMode = 0
                m.videoModeSet = true
        
            elseif CheckToken(line$, "Language ") then
            
                language$ = mid(line$, 10)

                if zonesActive and zonesEnabled then print "can't use this command inside of a zone" : stop
                
                zoneDefaults.language$ = language$
                                   
            elseif CheckToken(line$, "ViewMode ") then
            
                viewMode% = val(mid(line$,10))

                ' can't do this because of backwards compatibility
                ' if zonesActive and zonesEnabled then print "can't use this command inside of a zone" : stop
                
                if zonesActive then
                    zone.playlistCmds$[zone.numCommands] = "ViewMode"
                    zone.playlistCmdParams[zone.numCommands] = viewMode%
                    zone.numCommands = zone.numCommands + 1
'                    print "Viewmode cannot be set inside of a zone" : stop
                else
                    zoneDefaults.viewMode% = viewMode%
                endif
              
            elseif CheckToken(line$, "ImageMode ") then
            
                imageMode% = val(mid(line$,11))

                if zonesActive then
                    zone.playlistCmds$[zone.numCommands] = "ImageMode"
                    zone.playlistCmdParams[zone.numCommands] = imageMode%
                    zone.numCommands = zone.numCommands + 1
                else
                    zoneDefaults.imageMode% = imageMode%
                endif
              
            elseif CheckToken(line$, "AudioOutput ") then
            
                audioOutput% = val(mid(line$,13))
                
                if zonesActive then
                    zone.playlistCmds$[zone.numCommands] = "AudioOutput"
                    zone.playlistCmdParams[zone.numCommands] = audioOutput%
                    zone.numCommands = zone.numCommands + 1
                else
                    zoneDefaults.audioOutput% = audioOutput%
                endif
              
            elseif CheckToken(line$, "DigitalAudioOutput ") then
            
                digitalAudioOutput% = val(mid(line$,20))
                
                if zonesActive then
                    zone.playlistCmds$[zone.numCommands] = "DigitalAudioOutput"
                    zone.playlistCmdParams[zone.numCommands] = digitalAudioOutput%
                    zone.numCommands = zone.numCommands + 1
                else
                    zoneDefaults.digitalAudioOutput% = digitalAudioOutput%
                endif
              
            elseif CheckToken(line$, "AudioMode ") then
            
                audioMode% = val(mid(line$,11))

                if zonesActive then
                    zone.playlistCmds$[zone.numCommands] = "AudioMode"
                    zone.playlistCmdParams[zone.numCommands] = audioMode%
                    zone.numCommands = zone.numCommands + 1
                else
                    zoneDefaults.audioMode% = audioMode%
                endif
              
            elseif CheckToken(line$, "AudioChan ") then
            
                audioMapping% = val(mid(line$,11))

                if zonesActive then
                    zone.playlistCmds$[zone.numCommands] = "AudioChan"
                    zone.playlistCmdParams[zone.numCommands] = audioMapping%
                    zone.numCommands = zone.numCommands + 1
                else
                    zoneDefaults.audioMapping% = audioMapping%
                endif
              
            elseif CheckToken(line$, "Volume ") then
            
                volume% = val(mid(line$,7))

                if zonesActive then
                    zone.playlistCmds$[zone.numCommands] = "Volume"
                    zone.playlistCmdParams[zone.numCommands] = volume%
                    zone.numCommands = zone.numCommands + 1
                else
                    zoneDefaults.volume% = volume%
                endif
                
            else if CheckToken(line$, "Brightness ") then
            
                brightness% = val(mid(line$, 12))
                zoneDefaults.brightness% = brightness%
 
            else if CheckToken(line$, "Contrast ") then
            
                contrast% = val(mid(line$, 10))
                zoneDefaults.contrast% = contrast%
 
            else if CheckToken(line$, "Saturation ") then
            
                saturation% = val(mid(line$, 12))
                zoneDefaults.saturation% = saturation%
 
            else if CheckToken(line$, "Hue ") then
            
                hue% = val(mid(line$, 5))
                zoneDefaults.hue% = hue%
 
            elseif CheckToken(line$, "LiveVideo ") then
            
                zone.playlistCmds$[zone.numCommands] = "LiveVideo"
                
                badLiveVideoString$ = "Invalid LiveVideo specification"

                remainingStr$ = mid(line$, 11)
                idx = instr(1, remainingStr$, " ")
                if idx = 0 then print badLiveVideoString$ : stop
                liveVideoInput$ = mid(remainingStr$, 1, idx-1)
                liveVideoStandard$ = mid(remainingStr$, idx+1)

                zone.playlistCmdParams[zone.numCommands] = liveVideoInput$ + " " + liveVideoStandard$
                zone.numMediaFiles = zone.numMediaFiles + 1
                zone.numCommands = zone.numCommands + 1

            elseif CheckToken(line$, "SafeTextRegion ") then
            
                if zonesActive then
                
                    if type(zone.widget) = "roClockWidget" or type(zone.widget)="roTextWidget" then

                        badSafeTextString$ = "Invalid SafeTextRegion specification"

                        remainingStr$ = mid(line$, 16)
                        idx = instr(1, remainingStr$, ",")
                        if idx = 0 then print badSafeTextString$ : stop
                        xStart% = val(mid(remainingStr$, 1, idx-1))
                        remainingStr$ = mid(remainingStr$, idx+1)

                        idx = instr(1, remainingStr$, ",")
                        if idx = 0 then print badSafeTextString$ : stop
                        yStart% = val(mid(remainingStr$, 1, idx-1))
                        remainingStr$ = mid(remainingStr$, idx+1)

                        idx = instr(1, remainingStr$, ",")
                        if idx = 0 then print badSafeTextString$ : stop
                        width% = val(mid(remainingStr$, 1, idx-1))
                        remainingStr$ = mid(remainingStr$, idx+1)
                        height% = val(remainingStr$)

                        m.diagnostics.PrintDebug("SetSafeTextRegion rectangle: " + str(xStart%) + "," + str(yStart%) + "," + str(width%) + "," + str(height%))
stop
                        r = CreateObject("roRectangle", xStart%, yStart%, width%, height%)
                        ok = zone.widget.SetSafeTextRegion(r)
stop                        
                    endif

                else
                
                    print "SafeTextRegion must be set within a zone" : stop
                    
                endif
            
            elseif CheckToken(line$, "BackgroundScreenColor ") then
            
                colorSpec$ = mid(line$, 23)
                backgroundScreenColor% = ParseColorSpec(colorSpec$)

                if zonesActive then
                    zone.playlistCmds$[zone.numCommands] = "BackgroundScreenColor"
                    zone.playlistCmdParams[zone.numCommands] = backgroundScreenColor%
                    zone.numCommands = zone.numCommands + 1
                else
                    videoMode = CreateObject("roVideoMode")
                    videoMode.SetBackgroundColor(backgroundScreenColor%)                     
                    videoMode = 0
                endif
            
            elseif CheckToken(line$, "BackgroundBitmap ") then
            
                remainingStr$ = mid(line$, 18)
                idx = instr(1, remainingStr$, " ")
                if idx = 0 then print "Invalid set_background_bitmap specification":stop
                file$ = mid(remainingStr$, 1, idx-1)
                stretch = val(mid(remainingStr$,idx+1))
               
                if zonesActive then
                
                    ' ensure that zone is of the right type (text, clock, or rss)
                    if type(zone.widget) = "roClockWidget" or type(zone.widget)="roTextWidget" then
                        ok = zone.widget.SetBackgroundBitmap(file$, stretch)
                    endif
                
                else
                
                    zoneDefaults.backgroundBitmapFile$ = file$
                    zoneDefaults.stretchBackgroundBitmap = stretch
                    
                endif
                
            elseif CheckToken(line$, "ForegroundTextColor ") then

                colorSpec$ = mid(line$, 21)
                foregroundTextColor% = ParseColorSpec(colorSpec$)
                     
                if zonesActive then

                    ' ensure that zone is of the right type (text, clock, or rss)
                    if type(zone.widget) = "roClockWidget" or type(zone.widget)="roTextWidget" then
                        zone.widget.SetForegroundColor(foregroundTextColor%)
                    endif
                
                else
                
                    zoneDefaults.foregroundTextColor% = foregroundTextColor%
                    
                endif
            
            
            elseif CheckToken(line$, "BackgroundTextColor ") then

                colorSpec$ = mid(line$, 21)
                backgroundTextColor% = ParseColorSpec(colorSpec$)
                     
                if zonesActive then

                    ' ensure that zone is of the right type (text, clock, or rss)
                    if type(zone.widget) = "roClockWidget" or type(zone.widget)="roTextWidget" then
                        zone.widget.SetBackgroundColor(backgroundTextColor%)
                    endif
                
                else
                
                    zoneDefaults.backgroundTextColor% = backgroundTextColor%
                    
                endif
            
            elseif CheckToken(line$, "Font ") then
            
                fontName$ = mid(line$, 6)
                
                if zonesActive then

                    ' ensure that zone is of the right type (text, clock, or rss)
                    if type(zone.widget) = "roClockWidget" or type(zone.widget)="roTextWidget" then
                        zone.widget.SetFont(fontName$)
                    endif
                
                else
                
                    zoneDefaults.backgroundTextColor% = backgroundTextColor%
                    
                endif
                                
            elseif CheckToken(line$, "String ") then
            
                ParseTextWidgetString(zone, line$)
                
            elseif CheckToken(line$, "GPIOOn") then
            
                gpioValue% = ParseGPIOOnCommand(line$)
                
                if zonesActive then
                    zone.playlistCmds$[zone.numCommands] = "GPIOOn"
                    zone.playlistCmdParams[zone.numCommands] = gpioValue%
                    zone.numCommands = zone.numCommands + 1
                else
                    m.gpioPort.SetWholeState(gpioValue%)
                endif

            elseif CheckToken(line$, "GPIOEnableInput ") then
            
                gpioNumber = val(mid(line$, 17))
                if zonesActive then
                    zone.playlistCmds$[zone.numCommands] = "GPIOEnableInput"
                    zone.playlistCmdParams[zone.numCommands] = gpioNumber
                    zone.numCommands = zone.numCommands + 1
                else
                    if gpioNumber <= 7 then
                        m.gpioPort.EnableInput(gpioNumber)
                    else if m.gpioExpanderPort <> invalid then
                        m.gpioExpanderPort.EnableInput(gpioNumber)
                    endif
                endif

            elseif CheckToken(line$, "GPIOEnableOutput ") then
            
                gpioNumber = val(mid(line$, 18))
                if zonesActive then
                    zone.playlistCmds$[zone.numCommands] = "GPIOEnableOutput"
                    zone.playlistCmdParams[zone.numCommands] = gpioNumber
                    zone.numCommands = zone.numCommands + 1
                else
                    if gpioNumber <= 7 then
                        m.gpioPort.EnableOutput(gpioNumber)
                    else if m.gpioExpanderPort <> invalid then
                        m.gpioExpanderPort.EnableOutput(gpioNumber)
                    endif
                endif

            elseif CheckToken(line$, "LightOn ") then
            
                if zonesActive then
                    zone.playlistCmds$[zone.numCommands] = "LightOn"
                    zone.playlistCmdParams[zone.numCommands] = val(mid(line$, 9))
                    zone.numCommands = zone.numCommands + 1
                else
                ' todo - should this be supported?
                    print "LightOn command must be within a zone":stop
                endif

            elseif CheckToken(line$, "LightOff ") then
            
                if zonesActive then
                    zone.playlistCmds$[zone.numCommands] = "LightOff"
                    zone.playlistCmdParams[zone.numCommands] = val(mid(line$, 10))
                    zone.numCommands = zone.numCommands + 1
                else
                ' todo - should this be supported?
                    print "LightOff command must be within a zone":stop
                endif

            elseif CheckToken(line$, "WaitButtonAny") then
            
                if zonesActive then
                    zone.playlistCmds$[zone.numCommands] = "WaitButtonAny"
                    zone.playlistCmdParams[zone.numCommands] = -1
                    zone.numCommands = zone.numCommands + 1
                else
                ' todo - should this be supported?
                    print "WaitButtonAny command must be within a zone":stop
                endif

            elseif CheckToken(line$, "Pause ") then
                
                pauseTime% = val(mid(line$, 7))*1000
                
                if zonesActive then
                    zone.playlistCmds$[zone.numCommands] = "Pause"
                    zone.playlistCmdParams[zone.numCommands] = pauseTime%
                    zone.numCommands = zone.numCommands + 1
                else
                    sleep(pauseTime%)
                endif

            elseif CheckToken(line$, "PauseMS ") then
                
                pauseTime% = val(mid(line$, 9))
                
                if zonesActive then
                    zone.playlistCmds$[zone.numCommands] = "PauseMS"
                    zone.playlistCmdParams[zone.numCommands] = pauseTime%
                    zone.numCommands = zone.numCommands + 1
                else
                    sleep(pauseTime%)
                endif

            elseif CheckToken(line$, "PowerSaveModeOn") then
                
                if zonesActive then
                    zone.playlistCmds$[zone.numCommands] = "PowerSaveModeOn"
                    zone.playlistCmdParams[zone.numCommands] = -1
                    zone.numCommands = zone.numCommands + 1
                else
                    videoMode = CreateObject("roVideoMode")
                    videoMode.SetPowerSaveMode(true)                     
                    videoMode = 0
                endif

            elseif CheckToken(line$, "PowerSaveModeOff") then
                
                if zonesActive then
                    zone.playlistCmds$[zone.numCommands] = "PowerSaveModeOff"
                    zone.playlistCmdParams[zone.numCommands] = -1
                    zone.numCommands = zone.numCommands + 1
                else
                    videoMode = CreateObject("roVideoMode")
                    videoMode.SetPowerSaveMode(false)                     
                    videoMode = 0
                endif

           elseif CheckToken(line$, "NetworkTimerPeriodicWithinRange ")

                m.SetPlaylistNetworkTimerPeriodicWithinRange(line$)

           elseif CheckToken(line$, "NetworkTimerPeriodic ")

                ' to modify the system to allow a per zone (RSS) timer spec, the following would be done
                    ' parse timer spec
                    ' check to see if this is for a heartbeat, download, or rss
                    ' if zonesActive, then the only legal type is rss
                    ' if not, go ahead and start the timer now
                    ' if not and it's an rss feed, set the default data

                ' TODO - BNM writes out RSS feeds with a NetworkTimerPeriodic keyword
                ' if zonesActive and zonesEnabled then print "can't use this command inside of a zone" : stop
                m.SetPlaylistNetworkTimerPeriodic(line$)

            elseif CheckToken(line$, "NetworkTimerRange ")

                if zonesActive and zonesEnabled then print "can't use this command inside of a zone" : stop
                m.SetPlaylistNetworkTimerRange(line$)

            elseif CheckToken(line$, "NetworkTimer ")

                if zonesActive and zonesEnabled then print "can't use this command inside of a zone" : stop
                m.SetPlaylistNetworkTimerDateTime(line$)
          
            elseif CheckToken(line$, "Print ")
            
                output$ = mid(line$, 7)
                
                if zonesActive then
                    zone.playlistCmds$[zone.numCommands] = "Print"
                    zone.playlistCmdParams[zone.numCommands] = output$
                    zone.numCommands = zone.numCommands + 1
                else
                    print output$
                endif

            elseif CheckToken(line$, "Stop")
            
                if zonesActive then
                    zone.playlistCmds$[zone.numCommands] = "Stop"
                    zone.playlistCmdParams[zone.numCommands] = 0
                    zone.numCommands = zone.numCommands + 1
                else
                    stop
                endif

            elseif CheckToken(line$, "Debug")
            
                m.diagnostics.TurnDebugOn()
                
            elseif CheckToken(line$, "rem")
            
                ' do nothing - dummy line ahead
                bogus% = 0
                
            elseif IsMediaFile(line$) then
            
                zone.playlistCmds$[zone.numCommands] = line$
                zone.playlistCmdParams[zone.numCommands] = -1
                zone.numMediaFiles = zone.numMediaFiles + 1
                zone.numCommands = zone.numCommands + 1
                
            else
            
                if not CheckToken(line$, "EnableZones") then
                    m.diagnostics.PrintDebug("### Warning - unrecognized command " + line$)
                endif
                                
            endif
        
        endif

        line$ = GetLine(parseInfo)

    endwhile

    ' set cache request spec if indicated in registry
    registrySection = CreateObject("roRegistrySection", "networking")
    if type(registrySection)<>"roRegistrySection" then print "Error: Unable to create roRegistrySection":stop
    CacheRequestSpec$ = registrySection.Read("CacheRequestSpec")
    if CacheRequestSpec$ <> "" then
        if CheckToken(CacheRequestSpec$, "NetworkTimerPeriodic ")
            m.SetPlaylistNetworkTimerPeriodic(CacheRequestSpec$)
        elseif CheckToken(CacheRequestSpec$, "NetworkTimerPeriodicWithinRange ")
            m.SetPlaylistNetworkTimerPeriodicWithinRange(CacheRequestSpec$)
        elseif CheckToken(CacheRequestSpec$, "NetworkTimerRange ")
            m.SetPlaylistNetworkTimerRange(CacheRequestSpec$)
        elseif CheckToken(CacheRequestSpec$, "NetworkTimer ")
            m.SetPlaylistNetworkTimerDateTime(CacheRequestSpec$)
        endif
    endif
          
End Function


Function PlayBsp() As String

    zones = m.zones
    zoneDefaults = m.zoneDefaults
    
    m.gpioPort = CreateObject("roGpioControlPort")
    m.gpioPort.SetPort(m.msgPort)

    m.gpioExpanderPort = CreateObject("roControlPort", "Expander-GPIO")
    if m.gpioExpanderPort <> invalid then
	    m.gpioExpanderPort.SetPort(m.msgPort)
    end if
    
    zoneCount% = zones.Count()
    for zoneIndex% = 0 to zoneCount%-1

        zone = zones[zoneIndex%]

        if type(zone.videoPlayer) = "roVideoPlayer" then
            videoPlayer = zone.videoPlayer
            videoPlayer.SetPort(m.msgPort)
            videoPlayer.SetViewMode(zoneDefaults.viewMode%)
            videoPlayer.SetLoopMode(false)
            videoPlayer.SetAudioOutput(zoneDefaults.audioOutput%)
            videoPlayer.SetAudioMode(zoneDefaults.audioMode%)
            videoPlayer.MapStereoOutput(zoneDefaults.audioMapping%)
            videoPlayer.SetVolume(zoneDefaults.volume%)
            videoPlayer.MapDigitalOutput(zoneDefaults.digitalAudioOutput%)
        endif

        if type(zone.imagePlayer) = "roImagePlayer" then
            imagePlayer = zone.imagePlayer
            imagePlayer.SetDefaultMode(zoneDefaults.imageMode%)
            imagePlayer.SetDefaultTransition(zoneDefaults.transition%)
        endif
        
        if type(zone.audioPlayer) = "roAudioPlayer" then
            audioPlayer = zone.audioPlayer
            audioPlayer.SetPort(m.msgPort)
            audioPlayer.SetLoopMode(false)
            audioPlayer.SetAudioOutput(zoneDefaults.audioOutput%)
            audioPlayer.MapStereoOutput(zoneDefaults.audioMapping%)   ' 2 == audio 0
            audioPlayer.SetVolume(zoneDefaults.volume%)
            audioPlayer.MapDigitalOutput(zoneDefaults.digitalAudioOutput%)
        endif
        
        zone.slideInterval = zoneDefaults.slideInterval%

        if not zone.isStaticImage then
            m.LaunchZonePlay(zoneIndex%)
        endif
        
    next

    while true
    
        zoneIndex% = m.WaitForBspEvent()
        
        if zoneIndex% = -1 then
' print "RETURN FROM PlayBsp"        
            return "stop"
        else if zoneIndex% = -2 then
            return "restart"
        else if zoneIndex% = -3 then
            return "reboot"
        endif
        
        m.LaunchZonePlay(zoneIndex%)
        
    endwhile

    return ""

End Function


Sub LaunchZonePlay(zoneIndex% As Integer)

    zones = m.zones
    zone = zones[zoneIndex%]

    If type(zone.widget) = "roClockWidget" or type(zone.widget) = "roTextWidget" Then
        zone.widget.Show()
    endif
    
    If type(zone.imagePlayer) = "roImagePlayer" Then
        If zone.numMediaFiles = 0 Then
            Return
        endif
    endif

    zone.zoneTimer = 0

    newTimer = CreateObject("roTimer")

    If type(zone.imagePlayer) = "roImagePlayer" or type(zone.videoPlayer) = "roVideoPlayer" or type(zone.audioPlayer) = "roAudioPlayer" Then

        mediaLaunched = False

        While Not mediaLaunched

            cmd$ = zone.playlistCmds$[zone.playbackIndex]
            cmdParam = zone.playlistCmdParams[zone.playbackIndex]
            
            m.diagnostics.PrintDebug("Execute " + cmd$ + " for zone " + str(zoneIndex%))

            nextIndex% = zone.playbackIndex + 1
            If (nextIndex% >= zone.numCommands) Then
                nextIndex% = 0
            endif
            zone.playbackIndex = nextIndex%

            If IsVideoFile(cmd$) and type(zone.videoPlayer) = "roVideoPlayer" Then

                okay = zone.videoPlayer.PlayFile(cmd$)
                If okay = 0 Then
                    m.diagnostics.PrintDebug("VID: Error trying to play file: '" + cmd$ + "'")
                else
                    m.diagnostics.WriteToUsageFile(cmd$)
                    mediaLaunched = True
                endif

            endif

            if cmd$ = "LiveVideo" then
            
                zone.videoInput = CreateObject("roVideoInput")
                if type(zone.videoInput) <> "roVideoInput" then m.diagnostics.PrintDebug("Unable to create live video input object")
            
                idx = instr(1, cmdParam, " ")
                if idx = 0 then print "live video parsing error" : stop
                liveVideoInput$ = mid(cmdParam, 1, idx-1)
                liveVideoStandard$ = mid(cmdParam, idx+1)
                zone.videoInput.SetInput(liveVideoInput$)
                zone.videoInput.SetStandard(liveVideoStandard$)

                zone.videoInput.SetControlValue("brightness", m.zoneDefaults.brightness%)
                zone.videoInput.SetControlValue("contrast", m.zoneDefaults.contrast%)
                zone.videoInput.SetControlValue("saturation", m.zoneDefaults.saturation%)
                zone.videoInput.SetControlValue("hue", m.zoneDefaults.hue%)
                
                okay = zone.videoPlayer.PlayEx(zone.videoInput)
                                
                mediaLaunched = True

            endif
            
            if IsAudioFile(cmd$) and type(zone.audioPlayer) = "roAudioPlayer" then
            
                okay = zone.videoPlayer.Stop()
                okay = zone.audioPlayer.PlayFile(cmd$)
                If okay = 0 Then
                    m.diagnostics.PrintDebug("AUD: Error trying to play file: '" + cmd$ + "'")
                else
                    m.diagnostics.WriteToUsageFile(cmd$)
                    mediaLaunched = True
                endif
            
            endif
                        
            if type(zone.imagePlayer) = "roImagePlayer" then
            
                If IsImageFile(cmd$) Then

                    okay = zone.imagePlayer.DisplayFile(cmd$)
                    If okay = 0 Then
                        m.diagnostics.PrintDebug("ImageFile: Error trying to display file: '" + cmd$ + "'")
                    else
                        m.diagnostics.WriteToUsageFile(cmd$)
                        mediaLaunched = True

                        If type(zone.videoPlayer) = "roVideoPlayer" Then
                            zone.videoPlayer.StopClear()
                        endif

                        If zone.numMediaFiles > 1 Then
                            REM - set a timer to go off after slideInterval time
                            newTimer.SetPort(m.msgPort)
                            st = CreateObject("roSystemTime")
                            newTimeout = st.GetLocalDateTime()
                            newTimeout.AddMilliseconds(zone.slideInterval)
                            newTimer.SetDateTime(newTimeout)
                            newTimer.Start()
                        endif
                    endif

                endif

                If CheckToken(cmd$, "SlideInterval") Then

                    zone.slideInterval = cmdParam

                elseif CheckToken(cmd$, "Transition") then
                
                    zone.imagePlayer.SetDefaultTransition(cmdParam)

                elseif CheckToken(cmd$, "ImageMode") then
            
                    zone.imagePlayer.SetDefaultMode(cmdParam)
              
                endif
                
            endif
            
            if CheckToken(cmd$, "ViewMode") then
            
                if type(zone.videoPlayer) = "roVideoPlayer" then
                    zone.videoPlayer.SetViewMode(cmdParam)
                endif
            
            elseif CheckToken(cmd$, "AudioOutput") then
            
                if type(zone.videoPlayer) = "roVideoPlayer" then
                    zone.videoPlayer.SetAudioOutput(cmdParam)
                    zone.audioPlayer.SetAudioOutput(cmdParam)
                endif
                             
            elseif CheckToken(cmd$, "DigitalAudioOutput") then
            
                if type(zone.videoPlayer) = "roVideoPlayer" then
                    zone.videoPlayer.MapDigitalOutput(cmdParam)
                    zone.audioPlayer.MapDigitalOutput(cmdParam)
                endif
                             
            elseif CheckToken(cmd$, "AudioMode") then
            
                if type(zone.videoPlayer) = "roVideoPlayer" then
                    zone.videoPlayer.SetAudioMode(cmdParam)
                endif
              
            elseif CheckToken(cmd$, "AudioChan") then
                
                if type(zone.videoPlayer) = "roVideoPlayer" then
                    zone.videoPlayer.MapStereoOutput(cmdParam)
                    zone.audioPlayer.MapStereoOutput(cmdParam)
                endif
            
            else if CheckToken(cmd$, "Volume") then
            
                if type(zone.videoPlayer) = "roVideoPlayer" then
                    zone.videoPlayer.SetVolume(cmdParam)
                    zone.audioPlayer.SetVolume(cmdParam)
                endif
            
            else if CheckToken(cmd$, "GPIOOn") then
            
                m.gpioPort.SetWholeState(cmdParam)
                
            else if CheckToken(cmd$, "GPIOEnableInput") then
            
                if cmdParam <= 7 then
                    m.gpioPort.EnableInput(cmdParam)
                else if m.gpioExpanderPort <> invalid then
                    m.gpioExpanderPort.EnableInput(cmdParam)
                endif
               
            else if CheckToken(cmd$, "GPIOEnableOutput") then
            
                if cmdParam <= 7 then
                    m.gpioPort.EnableOutput(cmdParam)
                else if m.gpioExpanderPort <> invalid then
                    m.gpioExpanderPort.EnableOutput(cmdParam)
                endif
                
            else if CheckToken(cmd$, "LightOn") then
            
                if cmdParam <= 7 then
                    m.gpioPort.SetOutputState(cmdParam, 1)
                else if m.gpioExpanderPort <> invalid then
                    m.gpioExpanderPort.SetOutputState(cmdParam, 1)
                endif
                
            elseif CheckToken(cmd$, "LightOff") then

                if cmdParam <= 7 then
                    m.gpioPort.SetOutputState(cmdParam, 0)
                else if m.gpioExpanderPort <> invalid then
                    m.gpioExpanderPort.SetOutputState(cmdParam, 0)
                endif
                
            elseif CheckToken(cmd$, "WaitButtonAny") then

                ' clear the button queue of any leftover events
                ' the following code will cause other events to get dropped - comment it out for now
                ' msg = m.gpioPort.GetMessage()
                ' while type(msg) <> "Invalid"
                '     msg = m.gpioPort.GetMessage()
                ' endwhile
                
                ' old, non zone method - wait(0, m.gpioMsgPort)
                
                m.zoneWaitingForButtonInput% = zoneIndex%
                
                ' return to wait loop until button is pressed
                mediaLaunched = true

                             
            elseif CheckToken(cmd$, "Pause") or CheckToken(cmd$, "PauseMS") then

                sleep(cmdParam)

            elseif CheckToken(cmd$, "PowerSaveModeOn") then

                videoMode = CreateObject("roVideoMode")
                videoMode.SetPowerSaveMode(true)                     
                videoMode = 0

            elseif CheckToken(cmd$, "PowerSaveModeOff") then

                videoMode = CreateObject("roVideoMode")
                videoMode.SetPowerSaveMode(false)                     
                videoMode = 0

            elseif CheckToken(cmd$, "BackgroundScreenColor") then
            
                videoMode = CreateObject("roVideoMode")
                videoMode.SetBackgroundColor(cmdParam)                     
                videoMode = 0
            
            elseif CheckToken(cmd$, "Print") then
            
                print cmdParam

            elseif CheckToken(cmd$, "Stop") then
            
                stop
                
            endif
            
            endwhile

    endif

    zone.zoneTimer = newTimer

    id$ = stri(newTimer.GetIdentity())

    timerHandler = m.newTimerHandler(zoneIndex%)
    m.timerHandlers.AddReplace(id$, timerHandler)

    Return

End Sub


Function WaitForBspEvent() As Integer

    zones = m.zones
    
    MEDIA_START = 3
    MEDIA_END = 8

    While True

        msg = wait(0, m.msgPort)

        debugStr$ = "msg received - type=" + type(msg) : m.diagnostics.PrintDebug(debugStr$)

        if type(msg) = "roVideoEvent" Then
        
            m.diagnostics.PrintDebug("Video Event" + str(msg.GetInt()))
            if msg.GetInt() = MEDIA_END Then
                m.diagnostics.PrintDebug("VideoFinished")
                Return m.videoZoneIndex%
            elseif msg.GetInt() = MEDIA_START Then
                if type(zones[m.videoZoneIndex%].imagePlayer) = "roImagePlayer" then
                    zones[m.videoZoneIndex%].imagePlayer.StopDisplay()
                endif
            endif

        elseif type(msg) = "roAudioEvent" then
        
            m.diagnostics.PrintDebug("Audio Event" + str(msg.GetInt()))
            if msg.GetInt() = MEDIA_END then
                debugStr$ = "AudioFinished" : m.diagnostics.PrintDebug(debugStr$)
                zones[m.videoZoneIndex%].audioPlayer.Stop()
                return m.videoZoneIndex%
            endif
            
        elseif type(msg) = "roTimerEvent" Then

            m.diagnostics.PrintDebug("Timer Event")
            
            timerFound = FindAutoscheduleTimer(m.autoscheduleEntries, m.numScheduledEvents%, msg)
            if timerFound then 
                m.StopPlayback()
                return -2 ' restart
            endif
                        
            id$ = stri(msg.GetSourceIdentity())

            if type(m.timerHandlers[id$]) = "roAssociativeArray" then
            
                return m.timerHandlers[id$].zoneIndex%
                
            else
            
                m.HandleNetworkTimerEvent(msg)

            endif

        elseif type(msg) = "roGpioButton" Then

            m.diagnostics.PrintDebug("BUTTON EVENT RECEIVED - NUMBER" + str(msg.GetInt()))

            if m.zoneWaitingForButtonInput% >=0 then
                zoneGeneratingEvent% = m.zoneWaitingForButtonInput%
                m.zoneWaitingForButtonInput% = -1
                return zoneGeneratingEvent%
            endif

            if msg.GetInt() = 12 Then
' print "RETURN FROM WaitForBSPEvent()"
                return -1
                ' Stop
            endif

	    else if (type(msg) = "roUrlEvent") then

            m.networking.URLEvent(msg)

	    elseif (type(msg) = "roSyncPoolEvent") then
		    
            m.networking.PoolEvent(msg)

        else
            m.diagnostics.PrintDebug("Unhandled Event type: " + type(msg))
        endif

        endwhile

        Return 0

End Function


Sub HandleNetworkTimerEvent(msg As Object)

    if type(m.networkTimerDownload) = "roAssociativeArray" and m.networkTimerDownload.timer.GetIdentity() = msg.GetSourceIdentity() then

        if m.networkTimerDownload.timerType = "TIMERTYPEPERIODICWITHINRANGE" then
        
            m.diagnostics.PrintDebug("### TIMERTYPEPERIODICWITHINRANGE timeout received")

            ' check to see if the periodic timer event is within the specified range
            currentTime = m.systemTime.GetLocalDateTime()
            currentHour% = currentTime.GetHour()
            currentMinute% = currentTime.GetMinute()
                        
            nwStartRange% = m.networkTimerDownload.nwStartRange%
            rangeLengthInMinutes% = m.networkTimerDownload.rangeLengthInMinutes%
            rangeLengthInHours% = rangeLengthInMinutes% / 60
            
            if (nwStartRange% + rangeLengthInHours%) >= 24 then
            
                currentHour% = currentHour% + 24
                
            endif
            
            endOfRangeInMinutes% = nwStartRange% * 60 + rangeLengthInMinutes%
            currentTimeInMinutes% = currentHour% * 60 + currentMinute%
            
            if (currentHour% >= nwStartRange%) and (currentTimeInMinutes% <= endOfRangeInMinutes%) then
                
                m.diagnostics.PrintDebug("### Download")
                m.networking.StartSync("download")
            
            endif
            
            newTimeout = m.systemTime.GetLocalDateTime()
            newTimeout.AddSeconds(m.networkTimerDownload.timerInterval)
            m.networkTimerDownload.timer.SetDateTime(newTimeout)
            m.networkTimerDownload.timer.Start()

        else
        
            m.diagnostics.PrintDebug("### Download")
            m.networking.StartSync("download")
            
            if m.networkTimerDownload.timerType = "TIMERTYPEPERIODIC" then
                newTimeout = m.systemTime.GetLocalDateTime()
                newTimeout.AddSeconds(m.networkTimerDownload.timerInterval)
                m.networkTimerDownload.timer.SetDateTime(newTimeout)
                m.networkTimerDownload.timer.Start()
            elseif m.networkTimerDownload.timerType = "TIMERTYPERANGE" then
                newTimeout = m.systemTime.GetLocalDateTime()
                newTimeout.AddSeconds(24*60*60) ' range timers are always once per day
                m.networkTimerDownload.timer.SetDateTime(newTimeout)
                m.networkTimerDownload.timer.Start()
            endif
            
        endif

    else if type(m.networkTimerCache) = "roAssociativeArray" and m.networkTimerCache.timer.GetIdentity() = msg.GetSourceIdentity() then

        if m.networkTimerCache.timerType = "TIMERTYPEPERIODICWITHINRANGE" then
        
            m.diagnostics.PrintDebug("### TIMERTYPEPERIODICWITHINRANGE timeout received")

            ' check to see if the periodic timer event is within the specified range
            currentTime = m.systemTime.GetLocalDateTime()
            currentHour% = currentTime.GetHour()
            currentMinute% = currentTime.GetMinute()
                        
            nwStartRange% = m.networkTimerCache.nwStartRange%
            rangeLengthInMinutes% = m.networkTimerCache.rangeLengthInMinutes%
            rangeLengthInHours% = rangeLengthInMinutes% / 60
            
            if (nwStartRange% + rangeLengthInHours%) >= 24 then
            
                currentHour% = currentHour% + 24
                
            endif
            
            endOfRangeInMinutes% = nwStartRange% * 60 + rangeLengthInMinutes%
            currentTimeInMinutes% = currentHour% * 60 + currentMinute%
            
            if (currentHour% >= nwStartRange%) and (currentTimeInMinutes% <= endOfRangeInMinutes%) then
                
                m.diagnostics.PrintDebug("### Download")
                m.networking.StartSync("cache")
            
            endif
            
            newTimeout = m.systemTime.GetLocalDateTime()
            newTimeout.AddSeconds(m.networkTimerCache.timerInterval)
            m.networkTimerCache.timer.SetDateTime(newTimeout)
            m.networkTimerCache.timer.Start()

        else

            m.diagnostics.PrintDebug("### Cache")
            m.networking.StartSync("cache")
                    
            if m.networkTimerCache.timerType = "TIMERTYPEPERIODIC" then
                newTimeout = m.systemTime.GetLocalDateTime()
                newTimeout.AddSeconds(m.networkTimerCache.timerInterval)
                m.networkTimerCache.timer.SetDateTime(newTimeout)
                m.networkTimerCache.timer.Start()
            elseif m.networkTimerCache.timerType = "TIMERTYPERANGE" then
                newTimeout = m.systemTime.GetLocalDateTime()
                newTimeout.AddSeconds(24*60*60) ' range timers are always once per day
                m.networkTimerCache.timer.SetDateTime(newTimeout)
                m.networkTimerCache.timer.Start()
            endif
        
        endif

    else if type(m.networkTimerHeartbeat) = "roAssociativeArray" and m.networkTimerHeartbeat.timer.GetIdentity() = msg.GetSourceIdentity() then

        m.diagnostics.PrintDebug("### Heartbeat")
        m.networking.SendHeartbeat()

        if m.networkTimerHeartbeat.timerType = "TIMERTYPEPERIODIC" then
            newTimeout = m.systemTime.GetLocalDateTime()
            newTimeout.AddSeconds(m.networkTimerHeartbeat.timerInterval)
            m.networkTimerHeartbeat.timer.SetDateTime(newTimeout)
            m.networkTimerHeartbeat.timer.Start()
        elseif m.networkTimerHeartbeat.timerType = "TIMERTYPERANGE" then
            newTimeout = m.systemTime.GetLocalDateTime()
            newTimeout.AddSeconds(24*60*60) ' range timers are always once per day
            m.networkTimerHeartbeat.timer.SetDateTime(newTimeout)
            m.networkTimerHeartbeat.timer.Start()
        endif

    else if type(m.networkTimerRSS) = "roAssociativeArray" and m.networkTimerRSS.timer.GetIdentity() = msg.GetSourceIdentity() then

        m.diagnostics.PrintTimestamp()
        m.diagnostics.PrintDebug("### Update RSS")

' walk through the zone list, and for each zone that has an RSS feed, update it.

        zoneCount% = m.zones.Count()
        for zoneIndex% = 0 to zoneCount%-1

            zone = m.zones[zoneIndex%]
            
            ' hack?
            if type(zone.rssURLXfer) = "roUrlTransfer" then
            
                zone.rssURLXfer.GetToFile("tmp:/rss.xml")
                zone.rssParser.ParseFile("tmp:/rss.xml")
                rssStringCount = zone.widget.GetStringCount()
                m.diagnostics.PrintDebug("### rssStringCount=" + str(rssStringCount))
                zone.widget.PopStrings(rssStringCount)
                
                article = zone.rssParser.GetNextArticle()
                while type(article) = "roRssArticle"
                    zone.widget.PushString(article.GetDescription())
                    article = zone.rssParser.GetNextArticle()
                endwhile
            
            endif
            
        next
        
        if m.networkTimerRSS.timerType = "TIMERTYPEPERIODIC" then
            newTimeout = m.systemTime.GetLocalDateTime()
            newTimeout.AddSeconds(m.networkTimerRSS.timerInterval)
            m.networkTimerRSS.timer.SetDateTime(newTimeout)
            m.networkTimerRSS.timer.Start()
        elseif m.networkTimerRSS.timerType = "TIMERTYPERANGE" then
            newTimeout = m.systemTime.GetLocalDateTime()
            newTimeout.AddSeconds(24*60*60) ' range timers are always once per day
            m.networkTimerRSS.timer.SetDateTime(newTimeout)
            m.networkTimerRSS.timer.Start()
        endif
            
    else

        m.networking.CheckRealizeAlarm(msg)

    endif
            
    return
    
End Sub


Sub ResetDownloadTimerToDoRetry()

    m.diagnostics.PrintDebug("### reset_download_timer_to_do_retry")
    
    newTimeout = m.systemTime.GetLocalDateTime()
    newTimeout.AddSeconds(m.networking.retryInterval)
    m.networkTimerDownload.timer.SetDateTime(newTimeout)
    m.networkTimerDownload.timer.Start()

    return

End Sub


Sub StopPlaylistPlayback()

    m.diagnostics.PrintDebug("### Stopping playback")

    ' stop all timers
    
    m.StopAutoscheduleTimers(m.autoscheduleEntries, m.numScheduledEvents%)

    zones = m.zones
    zoneCount% = zones.Count()
    for zoneIndex% = 0 to zoneCount%-1
        zone = zones[zoneIndex%]
        if type(zone.zoneTimer) = "roTimer" then
            zone.zoneTimer.Stop()
        endif
    next
    
    if type(m.networkTimerDownload) = "roAssociativeArray" then
        if type(m.networkTimerDownload.timer) = "roTimer" then
            m.networkTimerDownload.timer.Stop()
        endif
    endif
        
    if type(m.networkTimerCache) = "roAssociativeArray" then
        if type(m.networkTimerCache.timer) = "roTimer" then
            m.networkTimerCache.timer.Stop()
        endif
    endif
        
    if type(m.networkTimerHeartbeat) = "roAssociativeArray" then
        if type(m.networkTimerHeartbeat.timer) = "roTimer" then
            m.networkTimerHeartbeat.timer.Stop()
        endif
    endif
        
    if type(m.networkTimerRSS) = "roAssociativeArray" then
        if type(m.networkTimerRSS.timer) = "roTimer" then
            m.networkTimerRSS.timer.Stop()
        endif
    endif
        
    ' stop all players
    if m.videoZoneIndex% <> -1 then
        zone = zones[m.videoZoneIndex%]
        if type(zone.videoPlayer) = "roVideoPlayer" then zone.videoPlayer.StopClear()
        if type(zone.audioPlayer) = "roAudioPlayer" then zone.audioPlayer.Stop()
    endif
        
    return
    
End Sub


Function ParseGPIOOnCommand(cmd$ As String) As Integer
' command syntax
' GPIOOn gpioNumber, gpioNumber, ...
    bad_gpio_string$ = "Invalid GPIO specification"
    
    gpioValue% = 0
    
    if len(cmd$) < (len("GPIOOn")+2) then return gpioValue%
    
    remainingStr$ = mid(cmd$, len("GPIOOn") + 2)
    
    while true

        idx = instr(1, remainingStr$, ",")
        
        if idx = 0 then
            gpio$ = mid(remainingStr$, 1)
        else
            gpio$ = mid(remainingStr$, 1, idx - 1)
        endif 
        
        gpioIndex% = val(gpio$)
        gpioValue% = gpioValue% + 2^gpioIndex%

        if idx = 0 then
            Exit while
        endif
        
        remainingStr$ = mid(remainingStr$, idx + 1)

    end while

    return gpioValue%
    
End Function


Function ParseDefineZone(zoneSpec$ As String) As Object
' zone syntax
' DefineZone <zone_type> <rectangle spec> <zone param 1> <zone param 2> ....
' For Video / Image zones, there are no additional zone params
' For StaticImage, the additional zone param is:
'       image (jpg, bmp, png)
' For Clock widget, the additional zone params are (optional):
'       display type (0 = date, 1 = time)
' For Text widgets, the additional zone params are:
'       line count
'       text mode
'       pause time
'       Rotation
'       Alignment
' For RSS widgets, the additional zone params are:
'       line count
'       text mode
'       pause time
'       URL
    bad_parse_string="Invalid DEFINEZONE specification"

    remainingStr$ = mid(zoneSpec$, len("DefineZone") + 2)
    idx = instr(1,remainingStr$," ")
    if idx = 0 then print bad_parse_string:stop

    zoneType$ = mid(remainingStr$, 1, idx-1)

    remainingStr$=mid(remainingStr$,idx+1)

    idx=instr(1,remainingStr$,",")
    if idx=0 then print bad_parse_string:stop
    xStart%=val(mid(remainingStr$,1,idx-1))
    remainingStr$=mid(remainingStr$,idx+1)

    idx=instr(1,remainingStr$,",")
    if idx=0 then print bad_parse_string:stop
    yStart%=val(mid(remainingStr$,1,idx-1))
    remainingStr$=mid(remainingStr$,idx+1)

    idx=instr(1,remainingStr$,",")
    if idx=0 then print bad_parse_string:stop
    width%=val(mid(remainingStr$,1,idx-1))
    remainingStr$=mid(remainingStr$,idx+1)

    param1$=""
    param2$=""
    param3$=""
    param4$=""
    param5$=""

    idx=instr(1,remainingStr$," ")
    if idx=0 then
        height%=val(remainingStr$)
    else
        height%=val(mid(remainingStr$,1,idx-1))

        remainingStr$=mid(remainingStr$,idx+1) ' params remain

        idx=instr(1,remainingStr$," ")
        if idx=0 then
            param1$=remainingStr$
        else
            param1$=mid(remainingStr$,1,idx-1)
            remainingStr$=mid(remainingStr$,idx+1)
            idx=instr(1,remainingStr$," ")
            if idx=0 then
                param2$=remainingStr$
            else
                param2$=mid(remainingStr$,1,idx-1)
                remainingStr$=mid(remainingStr$,idx+1)
                idx=instr(1,remainingStr$," ")
                if idx=0 then
                    param3$=remainingStr$
                else
                    param3$=mid(remainingStr$,1,idx-1)
                    remainingStr$=mid(remainingStr$,idx+1)
                    idx=instr(1,remainingStr$," ")
                    if idx=0 then
                        param4$=remainingStr$
                    else
                        param4$=mid(remainingStr$,1,idx-1)
                        param5$=mid(remainingStr$,idx+1)
                    endif
                endif
            endif
        endif
    endif
    
    zoneParameters = CreateObject("roAssociativeArray")
    zoneParameters.zoneType$ = zoneType$
    zoneParameters.xStart% = xStart%
    zoneParameters.yStart% = yStart%
    zoneParameters.width% = width%
    zoneParameters.height% = height%
    zoneParameters.param1$ = param1$
    zoneParameters.param2$ = param2$
    zoneParameters.param3$ = param3$
    zoneParameters.param4$ = param4$
    zoneParameters.param5$ = param5$
    
    return zoneParameters
    
End Function


Sub ParseTextWidgetString(zone As Object, line$ As String)

    textStr$ =mid(line$, 8)
    
    if type(zone.widget)="roTextWidget" then
        zone.widget.PushString(textStr$)
    else
        print "Invalid STRING specification":stop
    endif
    
    return
    
End Sub


Sub SetPlaylistNetworkTimerRange(line$ As String)

    remainingStr$ = mid(line$,len("NETWORKTIMERRANGE ") + 1)

    remainingStr$ = StripLeadingSpaces(remainingStr$)

    idx=instr(1,remainingStr$," ")
    if idx = 0 then m.diagnostics.PrintDebug("Invalid date/time specification") : stop

    token$ = mid(remainingStr$, 1, idx-1)
    nwStartRange% = val(token$)

    remainingStr$ = mid(remainingStr$, idx+1)

    remainingStr$ = StripLeadingSpaces(remainingStr$)

    idx = instr(1, remainingStr$, " ")
    if idx=0 then m.diagnostics.PrintDebug("Invalid date/time specification") : stop

    token$ = mid(remainingStr$, 1, idx-1)
    rangeLengthInMinutes% = val(token$)

    remainingStr$ = mid(remainingStr$, idx+1)

    remainingStr$ = StripLeadingSpaces(remainingStr$)
    remainingStr$ = StripTrailingSpaces(remainingStr$)

    timerAction$ = ucase(remainingStr$)

    if timerAction$ <> "RSS" then
        if not m.networkingActive then return
    endif

    m.SetNetworkTimerRange(nwStartRange%, rangeLengthInMinutes%, timerAction$)
    
    return
    
End Sub


Sub SetNetworkTimerRange(nwStartRange%, rangeLengthInMinutes%, timerAction$)

    nwTimeExtend% = rnd(rangeLengthInMinutes%)

    newTimer = CreateObject("roTimer")
    newTimeout = m.systemTime.GetLocalDateTime()
    newTimeout.SetHour(nwStartRange%)
    newTimeout.SetMinute(0)
    newTimeout.SetSecond(0)
    newTimeout.SetMillisecond(0)
    newTimeout.Normalize()
    newTimeout.AddSeconds(nwTimeExtend%*60)
    newTimeout.Normalize()

    newTimer.SetDateTime(newTimeout)
    newTimer.SetPort(m.msgPort)

    networkTimerRange = CreateObject("roAssociativeArray")
    networkTimerRange.timer = newTimer
    networkTimerRange.timerType = "TIMERTYPERANGE"

    if timerAction$ = "DOWNLOAD" then

        m.networkTimerDownload = networkTimerRange

    else if timerAction$ = "CACHE" then

        m.networkTimerCache = networkTimerRange

    else if timerAction$ = "HEARTBEAT" then

        m.networkTimerHeartbeat = networkTimerRange

    else if timerAction$ = "RSS" then

        m.networkTimerRSS = networkTimerRange

    endif

    newTimer.Start()

    return

End Sub


Sub SetPlaylistNetworkTimerPeriodicWithinRange(line$ As String)

    remainingStr$ = mid(line$,len("NETWORKTIMERPERIODICWITHINRANGE ") + 1)

    remainingStr$ = StripLeadingSpaces(remainingStr$)

    idx=instr(1,remainingStr$," ")
    if idx = 0 then m.diagnostics.PrintDebug("Invalid date/time specification") : stop

    token$ = mid(remainingStr$, 1, idx-1)
    nwStartRange% = val(token$)

    remainingStr$ = mid(remainingStr$, idx+1)

    remainingStr$ = StripLeadingSpaces(remainingStr$)

    idx = instr(1, remainingStr$, " ")
    if idx=0 then m.diagnostics.PrintDebug("Invalid date/time specification") : stop

    token$ = mid(remainingStr$, 1, idx-1)
    rangeLengthInMinutes% = val(token$)

    remainingStr$ = mid(remainingStr$, idx+1)

    remainingStr$ = StripLeadingSpaces(remainingStr$)

    idx = instr(1, remainingStr$, " ")
    if idx=0 then m.diagnostics.PrintDebug("Invalid date/time specification") : stop

    token$ = mid(remainingStr$, 1, idx-1)
    timerInterval% = val(token$)

    remainingStr$ = mid(remainingStr$, idx+1)

    remainingStr$ = StripLeadingSpaces(remainingStr$)
    remainingStr$ = StripTrailingSpaces(remainingStr$)

    timerAction$ = ucase(remainingStr$)

    if timerAction$ <> "RSS" then
        if not m.networkingActive then return
    endif

    m.SetNetworkTimerPeriodicWithinRange(nwStartRange%, rangeLengthInMinutes%, timerInterval%, timerAction$)
    
    return
    
End Sub


Sub SetNetworkTimerPeriodicWithinRange(nwStartRange%, rangeLengthInMinutes%, timerInterval% As Integer, timerAction$ As String)

    newTimer = CreateObject("roTimer")
    newTimeout = m.systemTime.GetLocalDateTime()
    newTimeout.AddSeconds(timerInterval%*60)
    newTimer.SetDateTime(newTimeout)
    newTimer.SetPort(m.msgPort)

    networkTimerPeriodicWithinRange = CreateObject("roAssociativeArray")
    networkTimerPeriodicWithinRange.timer = newTimer
    networkTimerPeriodicWithinRange.timerType = "TIMERTYPEPERIODICWITHINRANGE"
    networkTimerPeriodicWithinRange.timerInterval = timerInterval% * 60
    networkTimerPeriodicWithinRange.nwStartRange% = nwStartRange%
    networkTimerPeriodicWithinRange.rangeLengthInMinutes% = rangeLengthInMinutes%

    if timerAction$ = "DOWNLOAD" then

        m.networkTimerDownload = networkTimerPeriodicWithinRange

    else if timerAction$ = "CACHE" then

        m.networkTimerCache = networkTimerPeriodicWithinRange

    else if timerAction$ = "HEARTBEAT" then

        m.networkTimerHeartbeat = networkTimerPeriodicWithinRange

    else if timerAction$ = "RSS" then

        m.networkTimerRSS = networkTimerPeriodicWithinRange

    endif

    newTimer.Start()

    return

End Sub


Sub SetPlaylistNetworkTimerPeriodic(line$ As String)

'    if not networkingSupported then return

    remainingStr$ = mid(line$,len("NETWORKTIMERPERIODIC ") + 1)

    remainingStr$ = StripLeadingSpaces(remainingStr$)

    idx = instr(1,remainingStr$," ")
    if idx=0 then m.diagnostics.PrintDebug("Invalid date/time specification") : stop

    token$ = mid(remainingStr$, 1, idx-1)

    timerInterval% = val(token$)

    remainingStr$ = mid(remainingStr$, idx+1)

    remainingStr$ = StripLeadingSpaces(remainingStr$)
    remainingStr$ = StripTrailingSpaces(remainingStr$)

    timerAction$ = ucase(remainingStr$)
    
    if timerAction$ <> "RSS" then
        if not m.networkingActive then return
    endif

    m.SetNetworkTimerPeriodic(timerInterval%, timerAction$)
    
    return
    
End Sub


Sub SetNetworkTimerPeriodic(timerInterval% As Integer, timerAction$ As String)

    newTimer = CreateObject("roTimer")
    newTimeout = m.systemTime.GetLocalDateTime()
    newTimeout.AddSeconds(timerInterval%*60)
    newTimer.SetDateTime(newTimeout)
    newTimer.SetPort(m.msgPort)

    networkTimerPeriodic = CreateObject("roAssociativeArray")
    networkTimerPeriodic.timer = newTimer
    networkTimerPeriodic.timerType = "TIMERTYPEPERIODIC"
    networkTimerPeriodic.timerInterval = timerInterval% * 60

    if timerAction$ = "DOWNLOAD" then

        m.networkTimerDownload = networkTimerPeriodic

    else if timerAction$ = "CACHE" then

        m.networkTimerCache = networkTimerPeriodic

    else if timerAction$ = "HEARTBEAT" then

        m.networkTimerHeartbeat = networkTimerPeriodic

    else if timerAction$ = "RSS" then

        m.networkTimerRSS = networkTimerPeriodic

    endif

    newTimer.Start()

    return

End Sub


Sub SetPlaylistNetworkTimerDateTime(line$ As String)

'    if not networkingSupported then return

    remainingStr$ = mid(line$,14)
    remainingStr$ = StripLeadingSpaces(remainingStr$)
    remainingStr$ = StripTrailingSpaces(remainingStr$)

    idx = instr(1, remainingStr$, " ")
    if idx=0 then m.diagnostics.PrintDebug("Invalid date/time specification") : stop

    dateTimeSpec$ = mid(remainingStr$, 1, idx-1)

    remainingStr$ = mid(remainingStr$, idx+1)
    remainingStr$ = StripLeadingSpaces(remainingStr$)
    remainingStr$ = StripTrailingSpaces(remainingStr$)

    actionSpec$ = ucase(remainingStr$)
    
    if actionSpec$ <> "RSS" then
        if not m.networkingActive then return
    endif

    m.SetNetworkTimerDateTime(dateTimeSpec$, actionSpec$)
    
    return
    
End Sub


Sub SetNetworkTimerDateTime(dateTimeSpec$, actionSpec$)

    dateTimeAA = DateParser(ucase(dateTimeSpec$))
    
    newTimer = CreateObject("roTimer")
    newTimer.SetTime(dateTimeAA.hour%, dateTimeAA.minute%, 0, 0)
    newTimer.SetDate(dateTimeAA.year%, dateTimeAA.month%, dateTimeAA.day%)
    newTimer.SetDayOfWeek(dateTimeAA.dayOfWeek%)
    newTimer.SetPort(m.msgPort)
    
    networkTimerDateTime = CreateObject("roAssociativeArray")
    networkTimerDateTime.timer = newTimer
    networkTimerDateTime.timerType = "TIMERTYPEDATETIME"

    if actionSpec$ = "DOWNLOAD" then

        m.networkTimerDownload = networkTimerDateTime

    else if actionSpec$ = "CACHE" then

        m.networkTimerCache = networkTimerDateTime

    else if actionSpec$ = "HEARTBEAT" then

        m.networkTimerHeartbeat = networkTimerDateTime

    else if actionSpec$ = "RSS" then

        m.networkTimerRSS = networkTimerDateTime

    endif

    newTimer.Start()
    
    return
    
End Sub


Function ParseColorSpec(colorSpec$ As String) As Integer

    idx = instr(1, colorSpec$, ":")
    if idx = 0 then print "bad color spec":stop
    red$ = mid(colorSpec$, 1, idx-1)
    red% = val(red$)

    colorSpec$ = mid(colorSpec$, idx + 1)
    idx = instr(1, colorSpec$, ":")
    if idx=0 then print "bad color spec":stop
    green$ = mid(colorSpec$, 1, idx-1)
    green% = val(green$)

    colorSpec$ = mid(colorSpec$, idx + 1)
    idx = instr(1, colorSpec$, ":")
    if idx = 0 then
        blue$ = colorSpec$
        alpha$ = ""
    else
        blue$ = mid(colorSpec$, 1, idx - 1)
        alpha$ = mid(colorSpec$, idx + 1)
    endif

    blue% = val(blue$)

    if alpha$ <> "" then
        alpha% = val(alpha$)
    else
        alpha% = 255
    endif

    color_spec% = (alpha%*256*256*256) + (red%*256*256) + (green%*256) + blue%

    return color_spec%
    
End Function


Function ParseRectangleSpec(rectangleSpec$ As String) As Object

    bad_rectangle_spec$ = "Rectangle spec incorrect"

    rectangle_spec=CreateObject("roAssociativeArray")    

    idx=instr(1,rectangleSpec$,":")
    if idx=0 then print bad_rectangle_spec$:stop
    rectangle_spec.x=val(mid(rectangleSpec$,1,idx-1))
    rectangleSpec$=mid(rectangleSpec$,idx+1)

    idx=instr(1,rectangleSpec$,":")
    if idx=0 then print bad_parse_string:stop
    rectangle_spec.y=val(mid(rectangleSpec$,1,idx-1))
    rectangleSpec$=mid(rectangleSpec$,idx+1)

    idx=instr(1,rectangleSpec$,":")
    if idx=0 then print bad_parse_string:stop
    rectangle_spec.width=val(mid(rectangleSpec$,1,idx-1))
    rectangleSpec$=mid(rectangleSpec$,idx+1)

    rectangle_spec.height=val(rectangleSpec$)

    return rectangle_spec

End Function


REM
REM ******************************************************************
REM ******************************************************************
REM autoplay.csv(state machine created in Excel and saved in CSV format)
REM ******************************************************************
REM ******************************************************************
REM
Function RunCSV(fileContents$ As String, debugOn As Boolean, loggingOn As Boolean, usageLoggingOn As Boolean, msgPort As Object, autoscheduleEntries As Object, numScheduledEvents% As Integer, sysInfo As Object) As String

    CSV = newCSV(debugOn, loggingOn, usageLoggingOn, msgPort, autoscheduleEntries, numScheduledEvents%)

    CSV.diagnostics.SetSystemInfo(sysInfo)
    CSV.networking.SetSystemInfo(sysInfo)

    CSV.networkingActive = CSV.networking.InitializeNetworkDownloads()

    if fileContents$ = "" then print "Unexpected error reading autoplay.csv" : stop
    if fileContents$<>"" then
    
        CSV.ParseCSV(fileContents$)
                
        if CSV.videoModeSet = false then
            SetAutoVideoMode(debugOn)
        endif
        
        retValue = CSV.PlayCSV()
        ' kill the circular reference
        CSV.networking.parent = 0
        return retValue
        
    endif

    return "stop"
    
End Function


Function newCSV(debugOn As Boolean, loggingOn As Boolean, usageLoggingOn As Boolean, msgPort As Object, autoscheduleEntries As Object, numScheduledEvents% As Integer) As Object

    CSV = CreateObject("roAssociativeArray")

    CSV.debugOn = debugOn
    
    CSV.videoModeSet = false

    CSV.msgPort = msgPort
    CSV.autoscheduleEntries = autoscheduleEntries
    CSV.numScheduledEvents% = numScheduledEvents%

    CSV.systemTime = CreateObject("roSystemTime")

    CSV.diagnostics = newDiagnostics(debugOn, loggingOn, usageLoggingOn)

    CSV.newNetworking = newNetworking
    CSV.networking = CSV.newNetworking(CSV)

    CSV.networkTimerDownload = 0
    CSV.networkTimerHeartbeat = 0
    CSV.networkTimerRSS = 0
    CSV.ResetDownloadTimerToDoRetry = ResetDownloadTimerToDoRetry
    CSV.StopPlayback = StopCSVPlayback

    CSV.ParseCSV = ParseCSV
    CSV.ParseKeywords = ParseKeywords
    CSV.ParseEvents = ParseEvents
    CSV.ParseStates = ParseStates
    CSV.CreateMachine = CreateMachine
    CSV.PlayCSV = PlayCSV
    CSV.ExecuteStateCommand = ExecuteStateCommand
    CSV.GetNext = GetNext
    CSV.LaunchMedia = LaunchMedia
    CSV.WaitForCSVEvent = WaitForCSVEvent
    CSV.DisplayImage = DisplayImage
    CSV.DisplayRegistry = DisplayRegistry
    CSV.LaunchVideo = LaunchVideo
    CSV.LaunchAudio = LaunchAudio
    CSV.SetTouchRegions = SetTouchRegions
    CSV.GetImageToPreload = GetImageToPreload
    CSV.CreateUDPSender = CreateUDPSender
    CSV.CreateSerial = CreateSerial
    CSV.IsCommand = IsCommand
    CSV.CheckForRegistryCounterKeyword = CheckForRegistryCounterKeyword
    CSV.ParseStateSuffixCommands = ParseStateSuffixCommands
    CSV.CopyRegistry = CopyRegistry
    CSV.CreateTextField = CreateTextField
    CSV.DisplayRegistryFields = DisplayRegistryFields
    CSV.InitializeTouchScreen = InitializeTouchScreen
    CSV.AddRectangularTouchRegion = AddRectangularTouchRegion
    CSV.AddCircularTouchRegion = AddCircularTouchRegion
    CSV.AddRectangularRolloverTouchRegion = AddRectangularRolloverTouchRegion
    CSV.AddCircularRolloverTouchRegion = AddCircularRolloverTouchRegion

    CSV.SetNetworkTimerPeriodic = SetNetworkTimerPeriodic
    CSV.SetNetworkTimerRange = SetNetworkTimerRange
    CSV.SetNetworkTimerDateTime = SetNetworkTimerDateTime
    CSV.HandleNetworkTimerEvent = HandleNetworkTimerEvent
    
    CSV.StopAutoscheduleTimers = StopAutoscheduleTimers

REM
REM create machines array
REM
    Dim machines[4]
    CSV.machines = machines
    CSV.machineCount = 1
    
REM
REM create objects and ports
REM
    STEREO=1
    ANALOG=0 
    ANALOG_PLUS_HDMI=4

    
    CSV.gpioControlPort = CreateObject("roGpioControlPort")  
    CSV.gpioControlPort.SetPort(CSV.msgPort)
    
    CSV.gpioExpanderPort = CreateObject("roControlPort", "Expander-GPIO")
    if CSV.gpioExpanderPort <> invalid then
	    CSV.gpioExpanderPort.SetPort(CSV.msgPort)
    end if

    CSV.CreateMachine(0)
 
    CSV.videoPlayer = CreateObject("roVideoPlayer")
    CSV.videoPlayer.SetPort(CSV.msgPort)
    CSV.videoPlayer.SetAudioMode(STEREO)
    CSV.videoPlayer.SetAudioOutput(ANALOG_PLUS_HDMI)               
    CSV.videoPlayer.MapStereoOutput(0)
    CSV.videoPlayer.SetVolume(100)
    CSV.videoPlayer.MapDigitalOutput(0)
        
    CSV.imagePlayer = CreateObject("roImagePlayer")
    CSV.imageToPreload$ = ""
    
    CSV.keyboard = CreateObject("roKeyboard")
    CSV.keyboard.SetPort(CSV.msgPort)

' set default serial port speed, mode
    CSV.serialPortSpeed = 38400
    CSV.serialPortMode = "8N1"
    
' set a default udp receive port
    CSV.udpReceivePort = 21075
    CSV.udpSendPort = 21075
    CSV.udpAddress$ = "255.255.255.255"	'default udp address is broadcast
    
' TODO - create image player, audio player for first machine
    
' miscellaneous initialization
    CSV.flipelo = false
    
    return CSV

End Function
 

Sub ParseKeywords(parseInfo As Object, machineIndex As Integer, firstTime As Boolean)

    firstTimeThroughLoop = true
    
    next$ = m.GetNext(parseInfo)

    while (ucase(next$) <> "EVENTS")

        if firstTime and firstTimeThroughLoop then
        
            ' check for UTF-8 strings (ef, bb, bf)
            if asc(next$) = -17 then
                next$ = right(next$, len(next$) - 1)
                if asc(next$) = -69 then
                    next$ = right(next$, len(next$) - 1)
                    if asc(next$) = -65 then
                        next$ = right(next$, len(next$) - 1)
                    endif
                endif
            endif

            firstTimeThroughLoop = false
        
        endif
            
        if CheckToken(next$, "End") then
        
            print "Error: Incomplete .csv file" : stop
            
        else if CheckToken(next$, "VideoMode") then
        
            next$ = m.GetNext(parseInfo)
            m.diagnostics.PrintDebug("VideoMode Set to: " + next$)
            videoMode = CreateObject("roVideoMode")
            ok = videoMode.SetMode(next$)
            videoMode = 0
            if ok = 0 then print "Error: Can't set VideoMode to ";next$ : stop
            m.videoModeSet = true
            
        else if CheckToken(next$, "VideoPlayerAudioMode") then
        
            next$ = m.GetNext(parseInfo)
            m.diagnostics.PrintDebug("VideoPlayer AudioMode Set to: " + next$)
            m.videoPlayer.SetAudioMode(val(next$))
                
        else if CheckToken(next$, "VideoPlayerAudioOutput") then
        
            next$ = m.GetNext(parseInfo)
            m.diagnostics.PrintDebug("VideoPlayer AudioOutput Set to: " + next$)
            m.videoPlayer.SetAudioOutput(val(next$))
                
        else if CheckToken(next$, "VideoPlayerDigitalAudioOutput") then
        
            next$ = m.GetNext(parseInfo)
            m.diagnostics.PrintDebug("VideoPlayer DigitalAudioOutput Set to: " + next$)
            m.videoPlayer.MapDigitalOutput(val(next$))
                
        else if CheckToken(next$, "VideoPlayerAudioStereoMapping") then
        
            next$ = m.GetNext(parseInfo)
            m.diagnostics.PrintDebug("VideoPlayer StereoMapping Set to: " + next$)
            m.videoPlayer.MapStereoOutput(val(next$))
                
        else if CheckToken(next$, "VideoPlayerAudioVolume") then
        
            next$ = m.GetNext(parseInfo)
            m.diagnostics.PrintDebug("VideoPlayer AudioVolume Set to: " + next$)
            m.videoPlayer.SetVolume(val(next$))
                
        else if CheckToken(next$, "AudioPlayerAudioOutput") then

            next$ = m.GetNext(parseInfo)
            m.diagnostics.PrintDebug("AudioPlayer AudioOutput Set to: " + next$)
            m.machines[machineIndex].audioPlayer.SetAudioOutput(val(next$))
                
        else if CheckToken(next$, "AudioPlayerDigitalAudioOutput") then

            next$ = m.GetNext(parseInfo)
            m.diagnostics.PrintDebug("AudioPlayer DigitalAudioOutput Set to: " + next$)
            m.machines[machineIndex].audioPlayer.MapDigitalOutput(val(next$))
                
        else if CheckToken(next$, "AudioPlayerAudioStereoMapping") then
        
            next$ = m.GetNext(parseInfo)
            m.diagnostics.PrintDebug("AudioPlayer StereoMapping Set to: " + next$)
            m.machines[machineIndex].audioPlayer.MapStereoOutput(val(next$))
                
        else if CheckToken(next$, "AudioPlayerAudioVolume") then
        
            next$ = m.GetNext(parseInfo)
            m.diagnostics.PrintDebug("AudioPlayer AudioVolume Set to: " + next$)
            m.machines[machineIndex].audioPlayer.SetVolume(val(next$))
                
        else if CheckToken(next$, "GPIOEnableInput") then
        
            next$ = m.GetNext(parseInfo)
            m.diagnostics.PrintDebug("GPIO Enable Input: " + next$)
            
            gpioIndex = val(next$)
            if gpioIndex <= 7 then
                m.gpioControlPort.EnableInput(gpioIndex)
            else if m.gpioExpanderPort <> invalid
                m.gpioExpanderPort.EnableInput(gpioIndex)
            endif

        else if CheckToken(next$, "GPIOEnableOutput") then
            
            next$ = m.GetNext(parseInfo)
            m.diagnostics.PrintDebug("GPIO Enable Output: " + next$)
            
            gpioIndex = val(next$)
            if gpioIndex <= 7 then
                m.gpioControlPort.EnableOutput(gpioIndex)
            else if m.gpioExpanderPort <> invalid
                m.gpioExpanderPort.EnableOutput(gpioIndex)
            endif
    
        else if CheckToken(next$, "ImageMode") then
        
            next$ = m.GetNext(parseInfo)
            m.diagnostics.PrintDebug("ImageMode Set to: " + next$)
            ok = m.imagePlayer.SetDefaultMode(val(next$))
            if ok = 0 then print "Error: Can't set ImageMode to ";val(next$) : stop
        
        else if CheckToken(next$, "FlipElo") then
                    
            m.diagnostics.PrintDebug("FlipElo set")
            m.flipelo = true

        else if CheckToken(next$, "SerialPortSpeed") then
        
            next$ = m.GetNext(parseInfo)
            m.diagnostics.PrintDebug("SerialPortSpeed Set to: " + next$)
            
            m.serialPortSpeed = val(next$)
        
        else if CheckToken(next$, "SerialPortMode") then
        
            next$ = m.GetNext(parseInfo)
            m.diagnostics.PrintDebug("SerialPortMode Set to: " + next$)
            
            m.serialPortMode = next$
        
        else if CheckToken(next$, "UDPDestinationAddress") then
        
            next$ = m.GetNext(parseInfo)
            m.diagnostics.PrintDebug("UDPDestinationAddress Set to: " + next$)
            
            m.udpAddress$ = next$
        
        else if CheckToken(next$, "UDPDestinationPort") then
                     
            next$ = m.GetNext(parseInfo)
            m.diagnostics.PrintDebug("UDPDestinationPort Set to: " + next$)
            
            m.udpSendPort = val(next$)
   
        else if CheckToken(next$, "UDPReceiverPort") then
                     
            next$ = m.GetNext(parseInfo)
            m.diagnostics.PrintDebug("UDPReceiverPort Set to: " + next$)
            
            m.udpReceivePort = val(next$)
   
        else if CheckToken(next$, "State") then
        
            if machineIndex = 0 then print "Error: STATE found prior to EVENTS":stop
            m.diagnostics.PrintDebug("Scanning states for machineIndex > 0")
            return
        
        else if CheckToken(next$, "RegistrySection") then
        
            next$ = m.GetNext(parseInfo)
            if type(m.registrySection) = "roRegistrySection" then print "Error: Can't set registry section after other registry operations":stop
            m.diagnostics.PrintDebug("RegistrySection Set to: " + next$)
            m.registrySection = CreateObject("roRegistrySection", next$)

        else if CheckToken(next$, "DeleteRegistryKey") then
            
            next$ = m.GetNext(parseInfo)
            if type(m.registrySection) <> "roRegistrySection" then print "Error: Registry section must be set first":stop
            m.diagnostics.PrintDebug("DeleteRegistryKey: " + next$)
            m.registrySection.Delete(next$)

        else if CheckToken(next$, "DeleteRegistrySection") then

            next$ = m.GetNext(parseInfo)
            if type(m.registry) <> "roRegistry" then m.registry = CreateObject("roRegistry")
            m.diagnostics.PrintDebug("DeleteRegistrySection: " + next$)
            m.registry.Delete(next$)

        else if CheckToken(next$, "NetworkTimer") then
        
            ' NetworkTimer <time_spec> <action_spec>
            dateTimeSpec$ = m.GetNext(parseInfo)
            actionSpec$ = m.GetNext(parseInfo)
            m.diagnostics.PrintDebug("NetworkTimer " + dateTimeSpec$ + " " + actionSpec$)
            m.SetNetworkTimerDateTime(dateTimeSpec$, actionSpec$)

        else if CheckToken(next$, "NetworkTimerPeriodic") then
        
            ' NetworkTimerPeriodic <timer_interval> <action_spec>
            intervalTimeSpec$ = m.GetNext(parseInfo)
            timerInterval% = val(intervalTimeSpec$)
            actionSpec$ = m.GetNext(parseInfo)
            m.diagnostics.PrintDebug("NetworkTimerPeriodic " + intervalTimeSpec$ + " " + actionSpec$)
            m.SetNetworkTimerPeriodic(timerInterval%, actionSpec$)
            
        else if CheckToken(next$, "NetworkTimerRange") then
        
            ' NetworkTimerRange <start_time (hour in day)> <# of minutes> <action_spec>
            startOfRangeSpec$ = m.GetNext(parseInfo)
            rangeDurationSpec$ = m.GetNext(parseInfo)
            actionSpec$ = m.GetNext(parseInfo)
            m.diagnostics.PrintDebug("NetworkTimerRange " + startOfRangeSpec$ + " " + rangeDurationSpec$ + " " + actionSpec$)
            
            startOfRange% = val(startOfRange$)
            rangeLengthInMinutes% = val(rangeDurationSpec$)
            m.SetNetworkTimerRange(startOfRange%, rangeLengthInMinutes%, actionSpec$)

        endif
        
        next$ = m.GetNext(parseInfo)

    endwhile
    
    return
    
End Sub


Sub ParseEvents(parseInfo As Object, events As Object)

    next$ = m.GetNext(parseInfo)
    if next$ <> "" then print "Error: cell after EVENTS should be blank." : stop

    numEvents% = 0
    
' use the following associative arrays to ensure that an event is not entered more than once
    allButtonEvents = CreateObject("roAssociativeArray")
    timeoutUsed = false
    videoEndUsed = false
    audioEndUsed = false
    allKeyboardCharEvents = CreateObject("roAssociativeArray")
    allUDPEvents = CreateObject("roAssociativeArray")
    allSerialEvents = CreateObject("roAssociativeArray")
    allUSBStringEvents = CreateObject("roAssociativeArray")
    allRemoteEvents = CreateObject("roAssociativeArray")
    allMSTimeoutEvents = CreateObject("roAssociativeArray")
    
    next$ = m.GetNext(parseInfo)
    
    while (ucase(next$) <> "STATE")
    
        event = CreateObject("roAssociativeArray")
        
        if CheckTokenLen(next$, "Button:") then
        
            buttonNumber% = val(mid(next$, 8))
            if buttonNumber% < 0 or buttonNumber% > 12 then print "Error: invalid button number":stop
            
            if type(allButtonEvents.Lookup(str(buttonNumber%))) <> "Invalid" then print "Error: Button event used more than once":stop
            allButtonEvents.AddReplace(str(buttonNumber%), buttonNumber%)
            
            event.buttonNumber% = buttonNumber%
            events[numEvents%] = event
            m.diagnostics.PrintDebug("add_button: " + str(buttonNumber%))
            
        else if CheckTokenLen(next$, "mstimeout:") then
            
            mstimeout% = val(mid(next$, 11))
            
            if type(allMSTimeoutEvents.Lookup(str(mstimeout%))) <> "Invalid" then print "Error: MSTimeout event used more than once":stop
            allMSTimeoutEvents.AddReplace(str(mstimeout%), mstimeout%)
            
            event.mstimeout% = mstimeout%
            events[numEvents%] = event
            m.diagnostics.PrintDebug("add_mstimeout: " + str(mstimeout%))

        else if CheckTokenLen(next$, "Timeout:") then
        
            if timeoutUsed then print "Error: Only one timeout event allowed":stop
            timeoutUsed = true
            
            timeoutValue% = val(mid(next$, 9))*1000
            if timeoutValue% < 0 or timeoutValue% > 1000000 then print "Error: invalid timeout value":stop

            event.timeoutValue% = timeoutValue%
            events[numEvents%] = event
            m.diagnostics.PrintDebug("add_timeout: " + str(timeoutValue%))
            
        else if CheckToken(next$, "VideoEnd") then
        
            if videoEndUsed then print "Error: Only one videoend event allowed":stop
            videoEndUsed = true
            
            event.videoEnd = true
            events[numEvents%] = event
            m.diagnostics.PrintDebug("add_videoend: ")
        
        else if CheckToken(next$, "AudioEnd") then
        
            if audioEndUsed then print "Error: Only one audioend event allowed":stop
            audioEndUsed = true
            
            event.audioEnd = true
            events[numEvents%] = event
            m.diagnostics.PrintDebug("add_audioEnd: ")
        
        else if CheckTokenLen(next$, "Keyboard:") then
        
            keyboardChar$ = mid(next$, 10)
            
            if type(allKeyboardCharEvents.Lookup(keyboardChar$)) <> "Invalid" then print "Error: Keyboard event used more than once":stop
            allKeyboardCharEvents.AddReplace(keyboardChar$, keyboardChar$)

            event.keyboardChar$ = keyboardChar$
            events[numEvents%] = event
            m.diagnostics.PrintDebug("add_keyboardChar: " + keyboardChar$)
        
        else if CheckTokenLen(next$, "remote:") then
        
            ' Create remote object when first event is read 
            if type(m.remote) <> "roIRRemote" then
	            m.diagnostics.PrintDebug("Creating roIRRemote")
                m.remote = CreateObject("roIRRemote")
                m.remote.SetPort(m.msgPort)
            endif
        
            remote$ = ucase(mid(next$, 8))
            
            if type(allRemoteEvents.Lookup(remote$)) <> "Invalid" then print "Error: Remote event used more than once":stop
            allRemoteEvents.AddReplace(remote$, remote$)

            event.remote$ = remote$
            events[numEvents%] = event
            m.diagnostics.PrintDebug("add_remote: " + remote$)
            
        else if CheckTokenLen(next$, "serial:") then
        
            ' Create serial object when first event is read 
            m.CreateSerial() 
        
            serial$ = mid(next$, 8)
            
            if type(allSerialEvents.Lookup(serial$)) <> "Invalid" then print "Error: Serial event used more than once":stop
            allSerialEvents.AddReplace(serial$, serial$)

            event.serial$ = serial$
            events[numEvents%] = event
            m.diagnostics.PrintDebug("add_serial: " + serial$)
            
        else if CheckTokenLen(next$, "USBString:") then
        
            usbString$ = mid(next$, 11)
            
            if type(allUSBStringEvents.Lookup(usbString$)) <> "Invalid" then print "Error: USBString event used more than once":stop
            allUSBStringEvents.AddReplace(usbString$, usbString$)

            event.usbString$ = usbString$
            events[numEvents%] = event
            m.diagnostics.PrintDebug("add_usbString: " + usbString$)
            
        else if CheckTokenLen(next$, "udp:") then
 
            ' Create datagram receiver when first event is read  
            if type(m.udpReceiver) <> "roDatagramReceiver" then
	            m.diagnostics.PrintDebug("Creating roDatagramReceiver")
	            m.udpReceiver = CreateObject("roDatagramReceiver", m.udpReceivePort)
	            m.udpReceiver.SetPort(m.msgPort)
            endif
        
            udp$ = mid(next$, 5)
            
            if type(allUDPEvents.Lookup(udp$)) <> "Invalid" then print "Error: UDP event used more than once":stop
            allUDPEvents.AddReplace(udp$, udp$)

            event.udp$ = udp$
            events[numEvents%] = event
            m.diagnostics.PrintDebug("add_udp: " + udp$)
        
        else if CheckTokenLen(next$, "elo:")
                
            m.InitializeTouchScreen()

            m.AddRectangularTouchRegion("elo:", next$, numEvents%)
                    
            event.eloIndex% = numEvents%
            events[numEvents%] = event
            m.diagnostics.PrintDebug("add_elo: " + str(event.eloIndex%))

        else if CheckTokenLen(next$, "elor:")
                
            m.InitializeTouchScreen()
                    
            m.AddRectangularTouchRegion("elor:", next$, numEvents%)

            event.eloIndex% = numEvents%
            events[numEvents%] = event
            m.diagnostics.PrintDebug("add_elor: " + str(event.eloIndex%))

        else if CheckTokenLen(next$, "eloc:")
                
            m.InitializeTouchScreen()
                    
            m.AddCircularTouchRegion("eloc:", next$, numEvents%)

            event.eloIndex% = numEvents%
            events[numEvents%] = event
            m.diagnostics.PrintDebug("add_elor: " + str(event.eloIndex%))

        else if CheckTokenLen(next$, "relor:")
                
            m.InitializeTouchScreen()
                    
            m.AddRectangularRolloverTouchRegion("relor:", next$, numEvents%)

            event.eloIndex% = numEvents%
            events[numEvents%] = event
            m.diagnostics.PrintDebug("add_relor: " + str(event.eloIndex%))

        else if CheckTokenLen(next$, "reloc:")
                
            m.InitializeTouchScreen()
                    
            m.AddCircularRolloverTouchRegion("relor:", next$, numEvents%)

            event.eloIndex% = numEvents%
            events[numEvents%] = event
            m.diagnostics.PrintDebug("add_reloc: " + str(event.eloIndex%))

        endif
        
        numEvents% = numEvents% + 1
        
        next$ = m.GetNext(parseInfo)

    endwhile

' save the number of events
    m.numEvents% = numEvents%
    
    return
    
End Sub


Function ParseStates(parseInfo As Object, events As Object, machineIndex As Integer) As String

    lastState = 0
    state = CreateObject("roAssociativeArray")
    m.machines[machineIndex].currentState = state
    m.firstState = state
    buttonEvents = CreateObject("roAssociativeArray")
    mstimeoutEvents = CreateObject("roAssociativeArray")
    keyboardCharEvents = CreateObject("roAssociativeArray")
    udpEvents = CreateObject("roAssociativeArray")
    serialEvents = CreateObject("roAssociativeArray")
    usbStringEvents = CreateObject("roAssociativeArray")
    remoteEvents = CreateObject("roAssociativeArray")
    eloEvents = CreateObject("roAssociativeArray")
    
    numStates = 0
    eventNumber% = 0
    
    next$ = m.GetNext(parseInfo)
    while (ucase(next$) <> "END")
            
        if CheckToken(next$, "State") or CheckToken(next$, "Next") then
                    
            ' save last state object
            state.buttonEvents = buttonEvents
            state.keyboardCharEvents = keyboardCharEvents
            state.udpEvents = udpEvents
            state.serialEvents = serialEvents
            state.usbStringEvents = usbStringEvents
            state.remoteEvents = remoteEvents
            state.eloEvents = eloEvents
            m.stateTable[state.fileName$] = state

            ' prior state will point to this state
            if type(lastState) = "roAssociativeArray" then
                lastState.nextState = state
            endif                
            lastState = state
            
            if CheckToken(next$, "Next") then
                ' last state can point to first state
                state.nextState = m.firstState
                return "NEXT"
            endif
            
            ' prepare next state object
            state = CreateObject("roAssociativeArray")
            buttonEvents = CreateObject("roAssociativeArray")
            keyboardCharEvents = CreateObject("roAssociativeArray")
            udpEvents = CreateObject("roAssociativeArray")
            serialEvents = CreateObject("roAssociativeArray")
            usbStringEvents = CreateObject("roAssociativeArray")
            remoteEvents = CreateObject("roAssociativeArray")
            eloEvents = CreateObject("roAssociativeArray")
            
            eventNumber% = 0
            
        else if eventNumber% = 0 then
        
            ' first column must contain file name with optional commands
            m.ParseStateSuffixCommands(state, next$)
            
            eventNumber% = eventNumber% + 1

        else if next$ <> "" then
        
            indexIntoEvents% = eventNumber% - 1
            event = events[indexIntoEvents%]
            
            ' TODO - this next line shouldn't need to be here once all event types are implemented
            if type(event) = "roAssociativeArray" then                        
                if type(event.buttonNumber%) = "roInt" then
                    buttonEvents[str(event.buttonNumber%)] = next$
                else if type(event.mstimeout%) = "roInt" then
                    if type(state.mstimeoutEvent$) = "roString" then print "Only one mstimeout event per state is permitted." : stop
                    state.mstimeoutEvent$ = next$
                    state.mstimeoutValue% = event.mstimeout%
                else if type(event.timeoutValue%) = "roInt" then
                    state.timeoutEvent$ = next$
                    state.timeoutValue% = event.timeoutValue%
                else if type(event.videoEnd) = "roBoolean" then
                    state.videoEndEvent$ = next$
                else if type(event.audioEnd) = "roBoolean" then
                    state.audioEndEvent$ = next$
                else if type(event.keyboardChar$) = "roString" then
                    keyboardCharEvents[event.keyboardChar$] = next$
                else if type(event.udp$) = "roString" then
                    udpEvents[event.udp$] = next$
                else if type(event.serial$) = "roString" then
                    serialEvents[event.serial$] = next$
                else if type(event.usbString$) = "roString" then
                    usbStringEvents[event.usbString$] = next$
                else if type(event.remote$) = "roString" then
                    remoteEvents[event.remote$] = next$
                else if type(event.eloIndex%) = "roInt" then
                    eloEvents[str(event.eloIndex%)] = next$
                
                endif
            endif
            
            eventNumber% = eventNumber% + 1
            
        else
        
            eventNumber% = eventNumber% + 1
        
        endif
        
        next$ = m.GetNext(parseInfo)
        
    endwhile
    
    ' save final state object
    state.buttonEvents = buttonEvents
    state.keyboardCharEvents = keyboardCharEvents
    state.udpEvents = udpEvents
    state.serialEvents = serialEvents
    state.usbStringEvents = usbStringEvents
    state.remoteEvents = remoteEvents
    state.eloEvents = eloEvents
    m.stateTable[state.fileName$] = state
    
    ' prior state will point to this state
    if type(lastState) = "roAssociativeArray" then
        lastState.nextState = state
    endif                

    ' last state can point to first state
    state.nextState = m.firstState
    
    return "END"
    
End Function


Function ParseCSV(fileContents$ As String) As Void

    m.diagnostics.PrintDebug("play_csv entered")

    ' get eol characters so that file can be parsed properly
    eolInfo = GetEol(fileContents$)

    ' parse CSV file
    parseInfo = CreateObject("roAssociativeArray")
    parseInfo.position = 1
    parseInfo.fileContents$ = fileContents$
    parseInfo.eol = eolInfo.eol
    parseInfo.eoln = eolInfo.eoln
    parseInfo.eol10 = chr(10)
    parseInfo.eol13 = chr(13)

    machineIndex = 0
    events = CreateObject("roArray", 64, TRUE)
    m.stateTable = CreateObject("roAssociativeArray")

    continue = true
    
    firstTime = true
    
    while continue
        
' READ KEYWORDS

        m.ParseKeywords(parseInfo, machineIndex, firstTime)
        firstTime = false

' READ EVENTS

        if machineIndex = 0 then m.ParseEvents(parseInfo, events)
    
' READ STATES

        returnCommand$ = m.ParseStates(parseInfo, events, machineIndex)
        if returnCommand$ <> "NEXT" then
            continue = false
        else
            machineIndex = machineIndex + 1
            m.machineCount = m.machineCount + 1
            m.CreateMachine(machineIndex)
        endif
        
    endwhile
    
    return
    
End Function


Sub CreateMachine(machineIndex As Integer)

    machine = CreateObject("roAssociativeArray")
    m.machines[machineIndex] = machine
    machine.audioPlayer = CreateObject("roAudioPlayer")
    machine.audioPlayer.SetPort(m.msgPort)
    machine.audioPlayer.SetAudioOutput(4)               
    machine.audioPlayer.MapStereoOutput(0)
    machine.audioPlayer.SetVolume(100)
    machine.audioPlayer.MapDigitalOutput(0)               

    return
    
End Sub


Sub ExecuteStateCommand(state As Object)

    if type(state.gpiosOffList) = "roList" then

        for each gpioNumber in state.gpiosOffList
        
            m.diagnostics.PrintDebug("Turn off gpioNumber " + str(gpioNumber))
            if gpioNumber <= 7 then
                m.gpioControlPort.SetOutputState(gpioNumber, false)
            else if m.gpioExpanderPort <> invalid
                m.gpioExpanderPort.SetOutputState(gpioNumber, false)
            endif
            
        next

    endif

    if type(state.gpiosOnList) = "roList" then

        for each gpioNumber in state.gpiosOnList
        
            m.diagnostics.PrintDebug("Turn on gpioNumber " + str(gpioNumber))
            if gpioNumber <= 7 then
                m.gpioControlPort.SetOutputState(gpioNumber, true)
            else if m.gpioExpanderPort <> invalid
                m.gpioExpanderPort.SetOutputState(gpioNumber, true)
            endif
            
        next

    endif

    if type(state.gpioSetStateValue%) = "roInt" then

        m.diagnostics.PrintDebug("Set GPIO's to " + str(state.gpioSetStateValue%))
        m.gpioControlPort.SetWholeState(state.gpioSetStateValue%)
    
    endif
        
    if type(state.udpSendCommand$) = "roString" then
    
        m.diagnostics.PrintDebug("Send UDP command " + state.udpSendCommand$)
	    m.udpSender.Send(state.udpSendCommand$)
	
    endif

	if type(state.serialSendCommand$) = "roString" then    
    
        m.diagnostics.PrintDebug("Send Serial command " + state.serialSendCommand$)
	    m.serial.SendLine(state.serialSendCommand$)
	
    endif

    return
    
End Sub


Function PlayCSV() As String

    firstTime = true
        
    while true
    
        if firstTime then
            firstTime = false
            for i = 0 to m.machineCount - 1
                machine = m.machines[i]
                state = machine.currentState
                state.usbInputBuffer$ = ""
                m.ExecuteStateCommand(state)
                m.LaunchMedia(state, i)
            next
            machineGeneratingEvent = 0 
        else
            state.usbInputBuffer$ = ""
            m.ExecuteStateCommand(state)
            m.LaunchMedia(state, machineGeneratingEvent)
        endif
                    
        ' check to see if there is an image to preload
        if machineGeneratingEvent = 0 then
            m.imageToPreload$ = GetImageToPreload(m.machines[0].currentState)
            m.diagnostics.PrintDebug("image to preload " + m.imageToPreload$)
            if m.imageToPreload$ <> "" then
                ok = m.imagePlayer.PreloadFile(m.imageToPreload$)
                if ok = 0 print "Error PreloadFile: " ; m.imageToPreload$ : stop
                m.diagnostics.PrintDebug("PreloadFile: " + m.imageToPreload$)
            endif
        endif

        machineInfo = CreateObject("roAssociativeArray")    
        nextState$ = m.WaitForCSVEvent(state, machineInfo)
        
        if nextState$ = "stop" or nextState$ = "restart" or nextState$ = "reboot" then return nextState$
        
        machineGeneratingEvent = machineInfo.machineGeneratingEvent
        
        ' always stop audio before transitioning to a new state
        m.machines[machineGeneratingEvent].audioPlayer.Stop()
        
        if type(m.stateTable[nextState$]) = "roAssociativeArray" then
        
            state = m.stateTable[nextState$]
            m.machines[machineGeneratingEvent].currentState = state
        
        else
            print "State " + nextState$ + " does not exist." : stop
        endif
    
    endwhile
    
    return ""
    
End Function


Function ParseGPIOList(gpioList$ As String) As Object

    gpioList = CreateObject("roList")
    
    strIndex% = 1
    indexOfSemicolon% = instr(strIndex%, gpioList$, ";")

    while indexOfSemicolon% <> 0
    
        gpioNumber$ = mid(gpioList$, strIndex%, indexOfSemicolon% - strIndex%)
'        print "add gpioNumber ";gpioNumber$;" to the list"
        gpioList.AddHead(val(gpioNumber$))
        strIndex% = indexOfSemicolon% + 1
        indexOfSemicolon% = instr(strIndex%, gpioList$, ";")
        
    endwhile
    
    gpioNumber$ = mid(gpioList$, strIndex%)
    gpioList.AddHead(val(gpioNumber$))
    
'    print "add gpioNumber ";gpioNumber$;" to the list"    

    return gpioList    

End Function


' Parse 'stateCommand'
' Syntax is
'     <new_state>:gpios(<on_led>;<on_led>;<on_led>)
'     <new_state>:gpiosOn(<on_led>;<on_led>)
'     <new_state>:gpiosOff(<off_led>;<off_led>)
'     <new_state>:udpSend(<command>)
'     <new_state>:serialSend(<command>)

Sub ParseStateSuffixCommands(state As Object, next$ As String)

    uppercaseLine = ucase(next$)
    
    gpiosStartIndex% = instr(1, upperCaseLine, ":GPIOS(")
    gpiosOnStartIndex% = instr(1, upperCaseLine, ":GPIOSON(")
    gpiosOffStartIndex% = instr(1, upperCaseLine, ":GPIOSOFF(")
    udpSendCommandStartIndex% = instr(1, upperCaseLine, ":UDPSEND(")
    serialSendCommandStartIndex% = instr(1, upperCaseLine, ":SERIALSEND(")
    
    if gpiosStartIndex% <> 0 then
    
        gpiosCommandEndIndex% = instr(gpiosStartIndex%, next$, ")")
        if gpiosCommandEndIndex% = 0 then print "Missing parenthesis in gpios definition":stop

        gpioStateValue% = 0
        gpioList$ = mid(next$, gpiosStartIndex% + 7, gpiosCommandEndIndex% - (gpiosStartIndex% + 7))
        if len(gpioList$) > 0 then

            gpioList = ParseGPIOList(gpioList$)
            
            for each gpioNumber in gpioList
            
'                print "turn on gpioNumber ";gpioNumber
'                gpioStateValue% = gpioStateValue% + (2 ^ (gpioNumber + 17))
                gpioStateValue% = gpioStateValue% + (2 ^ gpioNumber)
                
            next
            
        endif
        
        state.gpioSetStateValue% = gpioStateValue%
        
    endif
    
    if gpiosOnStartIndex% <> 0 then

        gpiosCommandEndIndex% = instr(gpiosOnStartIndex%, next$, ")")
        if gpiosCommandEndIndex% = 0 then print "Missing parenthesis in gpiosOn definition":stop

        gpioList$ = mid(next$, gpiosOnStartIndex% + 9, gpiosCommandEndIndex% - (gpiosOnStartIndex% + 9))
        if len(gpioList$) > 0 then
            gpioList = ParseGPIOList(gpioList$)
            if gpioList.Count() > 0 then
                state.gpiosOnList = gpioList
            endif
        endif
                
    endif
    
    if gpiosOffStartIndex% <> 0 then

        gpiosCommandEndIndex% = instr(gpiosOffStartIndex%, next$, ")")
        if gpiosCommandEndIndex% = 0 then print "Missing parenthesis in gpiosOff definition":stop

        gpioList$ = mid(next$, gpiosOffStartIndex% + 10, gpiosCommandEndIndex% - (gpiosOffStartIndex% + 10))
        if len(gpioList$) > 0 then
            gpioList = ParseGPIOList(gpioList$)
            if gpioList.Count() > 0 then
                state.gpiosOffList = gpioList
            endif
        endif

    endif
    
    if udpSendCommandStartIndex% <> 0 then
    
        m.CreateUDPSender()
        
        udpSendCommandEndIndex% = instr(udpSendCommandStartIndex%, next$, ")")
        if udpSendCommandEndIndex% = 0 then print "Missing parenthesis in UDP Send definition":stop
        state.udpSendCommand$ = mid(next$, udpSendCommandStartIndex% + 9, udpSendCommandEndIndex% - (udpSendCommandStartIndex% + 9))
        
    endif
            
    if serialSendCommandStartIndex% <> 0 then
    
        m.CreateSerial()
        
        serialSendCommandEndIndex% = instr(serialSendCommandStartIndex%, next$, ")")
        if serialSendCommandEndIndex% = 0 then print "Missing parenthesis in Serial Send definition":stop
        state.serialSendCommand$ = mid(next$, serialSendCommandStartIndex% + 12, serialSendCommandEndIndex% - (serialSendCommandStartIndex% + 12))
        
    endif
        
    state.fileName$ = next$
    
    if gpiosStartIndex% <> 0 or gpiosOnStartIndex% <> 0 or gpiosOffStartIndex% <> 0 or udpSendCommandStartIndex% or serialSendCommandStartIndex% then
    
        colonIndex% = instr(1, next$, ":")
        if colonIndex% <> 0 then
            state.fileName$ = mid(next$, 1, colonIndex% - 1)
        endif
        
    endif

End Sub


Sub CheckStateForImageToPreload(stateEvents As Object, imagePreload As Object)

    for each event in stateEvents
    
        nextState$ = stateEvents[event]
        
        if IsImageFile(nextState$) then
            if nextState$ <> imagePreload.imageToPreload$ then
                imagePreload.imageToPreload$ = nextState$
                imagePreload.numCandidateImages% = imagePreload.numCandidateImages% + 1
            endif
        endif
        
    next

End Sub


Sub CheckEventForImageToPreload(event As Object, imagePreload As Object)

    if type(event) = "roString" then
        
        if IsImageFile(event) then
            if event <> imagePreload.imageToPreload$ then
                imagePreload.imageToPreload$ = event
                imagePreload.numCandidateImages% = imagePreload.numCandidateImages% + 1
            endif
        endif
        
    endif
    
End Sub


Function GetImageToPreload(state As Object) As String

    imagePreload = CreateObject("roAssociativeArray")
    
    imagePreload.imageToPreload$ = ""
    imagePreload.numCandidateImages% = 0
        
    CheckEventForImageToPreload(state.buttonEvents, imagePreload)
    
    CheckEventForImageToPreload(state.mstimeoutEvent$, imagePreload)
    
    CheckStateForImageToPreload(state.udpEvents, imagePreload)
    
    CheckStateForImageToPreload(state.serialEvents, imagePreload)
    
    CheckStateForImageToPreload(state.usbStringEvents, imagePreload)
    
    CheckStateForImageToPreload(state.remoteEvents, imagePreload)

    CheckStateForImageToPreload(state.eloEvents, imagePreload)

    CheckEventForImageToPreload(state.videoEndEvent$, imagePreload)
    
    CheckEventForImageToPreload(state.audioEndEvent$, imagePreload)
    
    CheckEventForImageToPreload(state.timeoutEvent$, imagePreload)
    
    ' if there is only one image file to preload, use it
    if imagePreload.numCandidateImages% = 1 then
        return imagePreload.imageToPreload$
    endif
    
    ' there is more than one candidate image to preload. if the next state is an image file, preload it
    if type(state.nextState) = "roAssociativeArray" then
        nextState = state.nextState
        if IsImageFile(nextState.fileName$) then
            return nextState.fileName$
        endif
    endif
    
    return ""
    
End Function


Function WaitForCSVEvent(state As Object, machineInfo As Object) As String

    timeoutValue% = 0
    
    for i = 0 to m.machineCount - 1
        machine = m.machines[i]
        machineState = machine.currentState
        if type(machineState.timeoutValue%) = "roInt" then
            timeoutValue% = machineState.timeoutValue%
            machineInfo.machineGeneratingEvent = i
        endif
    next
    
    while true
    
        nextState$ = ""
        
        msg = wait(timeoutValue%, m.msgPort)

        if type(msg) = "roVideoEvent" then

            m.diagnostics.PrintDebug("Video Event" + str(msg.GetInt()))

            if msg.GetInt() = 8 then
                m.diagnostics.PrintDebug("VideoFinished")
                
                for i = 0 to m.machineCount - 1
                    machine = m.machines[i]
                    machineState = machine.currentState
                    if type(machineState.videoEndEvent$) = "roString" then
                        nextState$ = machineState.videoEndEvent$
                        machineInfo.machineGeneratingEvent = i
                    endif
                next
            endif

        elseif type(msg) = "roAudioEvent" then
        
            m.diagnostics.PrintDebug("Audio Event" + str(msg.GetInt()))

            if msg.GetInt() = 8 then
                m.diagnostics.PrintDebug("AudioFinished")
                ' m.audioPlayer.Stop()
                
                for i = 0 to m.machineCount - 1
                    machine = m.machines[i]
                    machineState = machine.currentState
                    if type(machineState.audioEndEvent$) = "roString" then
                        if machine.audioPlayer.GetIdentity() = msg.GetSourceIdentity() then
                            nextState$ = machineState.audioEndEvent$
                            machineInfo.machineGeneratingEvent = i
                        endif
                    endif
                next                
                
            endif

        elseif type(msg) = "roTimerEvent" then

            m.diagnostics.PrintDebug("Timer Event received: " + str(msg.GetSourceIdentity()))
            
            timerFound = FindAutoscheduleTimer(m.autoscheduleEntries, m.numScheduledEvents%, msg)
            if timerFound then 
                m.StopPlayback()
                return "restart"
            endif
            
            for i = 0 to m.machineCount - 1
                machine = m.machines[i]
                machineState = machine.currentState
                if type(machineState.mstimeoutEvent$) = "roString" then
                    if machineState.mstimeoutTimer.GetIdentity() = msg.GetSourceIdentity() then
                        nextState$ = machineState.mstimeoutEvent$
                        machineInfo.machineGeneratingEvent = i
                    endif
                endif
            next  
            
            if nextState$ = "" then m.HandleNetworkTimerEvent(msg)
                        
        elseif type(msg) = "roGpioButton" or type(msg) = "roControlDown" then
        
            m.diagnostics.PrintDebug("Button Press" + str(msg.GetInt()))
            
            if msg.GetInt()=12 then
                return "stop"
            endif
        
            buttonNum$ = str(msg.GetInt())
            
            for i = 0 to m.machineCount - 1
                machine = m.machines[i]
                machineState = machine.currentState
                buttonEvents = machineState.buttonEvents
                
                if type(buttonEvents[buttonNum$]) = "roString" then
                    nextState$ = buttonEvents[buttonNum$]
                    machineInfo.machineGeneratingEvent = i
                endif
            next                

        elseif type(msg) = "roKeyboardPress" then
        
            m.diagnostics.PrintDebug("Keyboard Press" + str(msg.GetInt()))
            
            keyboardChar$ = chr(msg.GetInt())
                        
            if msg.GetInt() <> 13 then
                machineState.usbInputBuffer$ = machineState.usbInputBuffer$ + keyboardChar$
                checkUSBInputString = false
            else
                checkUSBInputString = true
            endif
            
            for i = 0 to m.machineCount - 1
                machine = m.machines[i]
                machineState = machine.currentState
                
                keyboardCharEvents = machineState.keyboardCharEvents
                usbStringEvents = machineState.usbStringEvents
                
                if checkUSBInputString and type(usbStringEvents[machineState.usbInputBuffer$]) = "roString" then
                    nextState$ = machineState.usbStringEvents[machineState.usbInputBuffer$]
                    machineInfo.machineGeneratingEvent = i
                    exit for
                else if type(keyboardCharEvents[keyboardChar$]) = "roString" then
                    nextState$ = machineState.keyboardCharEvents[keyboardChar$]
                    machineInfo.machineGeneratingEvent = i
                    exit for
                endif            
            next  
            
            ' clear the buffer when the user presses enter
            if msg.GetInt() = 13 then machineState.usbInputBuffer$ = ""
              
                        
        elseif type(msg) = "roDatagramEvent" then
        
            m.diagnostics.PrintDebug("UDP Event " + msg.GetString())
            
            udpEvent$ = msg.GetString()
            
            for i = 0 to m.machineCount - 1
                machine = m.machines[i]
                machineState = machine.currentState
                udpEvents = machineState.udpEvents
                
                if type(udpEvents[udpEvent$]) = "roString" then
                    nextState$ = machineState.udpEvents[udpEvent$]
                    machineInfo.machineGeneratingEvent = i
                endif            
            next                
        
        elseif type(msg) = "roStreamLineEvent" then
        
            m.diagnostics.PrintDebug("Serial Event " + msg.GetString())
            
            serialEvent$ = msg.GetString()
            
            for i = 0 to m.machineCount - 1
                machine = m.machines[i]
                machineState = machine.currentState
                serialEvents = machineState.serialEvents
                
                if type(serialEvents[serialEvent$]) = "roString" then
                    nextState$ = machineState.serialEvents[serialEvent$]
                    machineInfo.machineGeneratingEvent = i
                endif            
            next                
            
        elseif type(msg) = "roIRRemotePress" then
        
            m.diagnostics.PrintDebug("Remote Event" + str(msg.GetInt()))
            
            remoteEvent% = msg.GetInt()
            remoteEvent$ = ConvertToRemoteCommand(remoteEvent%)
            
            for i = 0 to m.machineCount - 1
                machine = m.machines[i]
                machineState = machine.currentState
                remoteEvents = machineState.remoteEvents
                
                if type(remoteEvents[remoteEvent$]) = "roString" then
                    nextState$ = machineState.remoteEvents[remoteEvent$]
                    machineInfo.machineGeneratingEvent = i
                endif            
            next                
                    
        elseif type(msg) = "roTouchEvent" then

            m.diagnostics.PrintDebug("Elo event" + str(msg.GetInt()))
            
            eloIndex$ = str(msg.GetInt())
            
            for i = 0 to m.machineCount - 1
                machine = m.machines[i]
                machineState = machine.currentState
                eloEvents = machineState.eloEvents
                
                if type(eloEvents[eloIndex$]) = "roString" then
                    nextState$ = eloEvents[eloIndex$]
                    machineInfo.machineGeneratingEvent = i
                endif            
            next                
            
        elseif type(msg) = "Invalid" then
        
            m.diagnostics.PrintDebug("TimeOut")
        
            for i = 0 to m.machineCount - 1
                machine = m.machines[i]
                machineState = machine.currentState
                
                if type(machineState.timeoutEvent$) = "roString" then
                    nextState$ = machineState.timeoutEvent$
                    machineInfo.machineGeneratingEvent = i
                endif            
            next                
                        
	    else if (type(msg) = "roUrlEvent") then

            m.networking.URLEvent(msg)

	    elseif (type(msg) = "roSyncPoolEvent") then
		    
            m.networking.PoolEvent(msg)

        else
        
            m.diagnostics.PrintDebug("Unhandled Event type: " + type(msg))
            
        endif
        
        if nextState$ <> "" then
        
            nextState$ = m.CheckForRegistryCounterKeyword(nextState$)
            
            if not m.IsCommand(nextState$) return nextState$

        endif
        
    endwhile
    
    return ""
    
End Function


Function CheckForRegistryCounterKeyword(state$ As String) As String

    counterNameStartIndex% = instr(1, UCase(state$), ":COUNTER(")
    if counterNameStartIndex% <> 0 then
    
        endParen% = instr(counterNameStartIndex%, state$, ")")
        if endParen% = 0 then print "Missing parenthesis in counter definition":stop
        counterName$ = mid(state$, counterNameStartIndex% + 9, endParen% - (counterNameStartIndex% + 9))
        state$ = mid(state$, 1, counterNameStartIndex% - 1)
        
        if type(m.registrySection) <> "roRegistrySection" then m.registrySection = CreateObject("roRegistrySection", "User")
        
        hits% = 0
        keyExists = m.registrySection.Exists(counterName$)
        if (keyExists) then hits% = val(m.registrySection.Read(counterName$))
        hits% = hits% + 1
        m.registrySection.Write(counterName$, strI(hits%))
        
    endif

    return state$
    
End Function


Function ConvertToRemoteCommand(remoteCommand% As Integer) As String

	Dim remoteCommands[19]
	remoteCommands[0]="WEST"
	remoteCommands[1]="EAST"
	remoteCommands[2]="NORTH"
	remoteCommands[3]="SOUTH"
	remoteCommands[4]="SEL"
	remoteCommands[5]="EXIT"
	remoteCommands[6]="PWR"
	remoteCommands[7]="MENU"
	remoteCommands[8]="SEARCH"
	remoteCommands[9]="PLAY"
	remoteCommands[10]="FF"
	remoteCommands[11]="RW"
	remoteCommands[12]="PAUSE"
	remoteCommands[13]="ADD"
	remoteCommands[14]="SHUFFLE"
	remoteCommands[15]="REPEAT"
	remoteCommands[16]="VOLUP"
	remoteCommands[17]="VOLDWN"
	remoteCommands[18]="BRIGHT"

    if remoteCommand% < 0 or remoteCommand% > 18 return ""
    
    return remoteCommands[remoteCommand%]
    
End Function


Function IsCommand(command$ As String) As Boolean

    if not CheckTokenLen(command$, "Execute ") then return false

    command$ = mid(command$, 9)

    if CheckTokenLen(command$, "UDPSend(") then
    
        udpSendCommand$ = mid(command$, 9)
        udpSendCommandEndIndex% = instr(1, udpSendCommand$, ")")
        if udpSendCommandEndIndex% = 0 then print "Missing parenthesis in UDP Send command":stop
        udpSendCommand$ = mid(udpSendCommand$, 1, udpSendCommandEndIndex% - 1)
        
        m.diagnostics.PrintDebug("Execute command " + udpSendCommand$)
        
        m.CreateUDPSender()
        m.udpSender.Send(udpSendCommand$)

        return true
        
    else if CheckTokenLen(command$, "SerialSend(") then
    
        serialSendCommand$ = mid(command$, 12)
        serialSendCommandEndIndex% = instr(1, serialSendCommand$, ")")
        if serialSendCommandEndIndex% = 0 then print "Missing parenthesis in Serial Send command":stop
        serialSendCommand$ = mid(serialSendCommand$, 1, serialSendCommandEndIndex% - 1)
        
        m.diagnostics.PrintDebug("Execute command " + serialSendCommand$)
        
        m.CreateSerial()
        m.serialSender.Send(serialSendCommand$)

        return true
    
    else if CheckTokenLen(command$, "CopyRegistry(") then

        filePath$ = mid(command$, 14)
        copyRegistryCommandEndIndex% = instr(1, filePath$, ")")
        if copyRegistryCommandEndIndex% = 0 then print "Missing parenthesis in Copy Registry command":stop
        filePath$ = mid(filePath$, 1, copyRegistryCommandEndIndex% - 1)

        m.CopyRegistry(filePath$)
        
        return true
            
    endif

    return false
    
End Function


Sub CopyRegistry(filePath$ As String)

    m.diagnostics.PrintDebug("Copy registry to:" + filePath$)
    
    registryFile = CreateObject("roCreateFile", filePath$)
    if type(registryFile)<>"roCreateFile" then print "Error: Unable to open file ";filePath$;" for writing.":stop

    if type(m.registry) <> "roRegistry" then m.registry = CreateObject("roRegistry")
    
    registrySectionList = m.registry.GetSectionList()
    if registrySectionList.Count() > 0 then
        for i = 1 to registrySectionList.Count()
            registrySectionName = registrySectionList.RemoveHead()
            registryFile.SendLine(registrySectionName)
            registrySection = CreateObject("roRegistrySection", registrySectionName)
            registryKeyList = registrySection.GetKeyList()
            if registryKeyList.Count() > 0 then
                for j = 1 to registryKeyList.Count()
                    registryKeyName = registryKeyList.RemoveHead()
                    registryKeyValue = registrySection.Read(registryKeyName)
                    registryFile.SendBlock(registryKeyName)
                    registryFile.SendBlock(",")
                    registryFile.SendLine(registryKeyValue)
                next
            endif
        next
    endif

    registryFile.Flush()

    return
    
End Sub


Sub CreateUDPSender()

    if type(m.udpSender) <> "roDatagramSender" then
        m.diagnostics.PrintDebug("Creating roDatagramSender")
        m.udpSender = CreateObject("roDatagramSender")
        m.udpSender.SetDestination(m.udpAddress$, m.udpSendPort)
    endif

    return
    
End Sub


Sub CreateSerial()

    if type(m.serial) <> "roSerialPort" then
        m.diagnostics.PrintDebug("Creating roSerialPort")
        m.serial = CreateObject("roSerialPort", 0, m.serialPortSpeed)
        if type(m.serial) <> "roSerialPort" then print "Error creating roSerialPort" : stop
        ok = m.serial.SetMode(m.serialPortMode)
        if not ok then print "Error setting serial mode" : stop
        m.serial.SetLineEventPort(m.msgPort)
    endif

    return
    
End Sub


Sub LaunchMedia(state As Object, machineIndex As Integer)

    file$ = state.fileName$
    
    if CheckTokenLen(file$, "DisplayRegistry") then
    
        m.DisplayRegistry(state, file$, machineIndex)
        
    else if IsImageFile(file$) then
    
        m.DisplayImage(state, machineIndex)
    
    else if IsVideoFile(file$) then
    
        loopMode% = 1
        if type(state.videoEndEvent$) = "roString" then loopMode% = 0
    
        m.LaunchVideo(state, loopMode%, machineIndex)
    
    else if IsAudioFile(file$) then
        
        loopMode% = 1
        if type(state.audioEndEvent$) = "roString" then loopMode% = 0
    
        m.LaunchAudio(state, loopMode%, machineIndex)
    
    endif

    if type(state.mstimeoutEvent$) = "roString" then
    
        timer = CreateObject("roTimer")
        timer.SetPort(m.msgPort)
        systemTime = CreateObject("roSystemTime")
        newTimeout = systemTime.GetLocalDateTime()
        newTimeout.AddMilliseconds(state.mstimeoutValue%)
        timer.SetDateTime(newTimeout)
        timer.Start()
        state.mstimeoutTimer = timer

    endif
    
    return
    
End Sub


Sub DisplayRegistry(state As Object, command$ As String, machineIndex As Integer)

    m.diagnostics.PrintDebug("Enter display_registry")

    if machineIndex = 0 then m.SetTouchRegions(state)

    tfRegistry = m.CreateTextField()
    tfRegistry.Cls()
    
    m.DisplayRegistryFields(command$, tfRegistry)
    
    return
    
End Sub


Sub DisplayImage(state As Object, machineIndex As Integer)

    file$ = state.fileName$

    m.diagnostics.PrintDebug("Enter DisplayImage: " + file$)

    if machineIndex = 0 then m.SetTouchRegions(state)
    
    if m.imageToPreload$ <> file$ then
        m.imageToPreload$ = file$
        ok = m.imagePlayer.PreloadFile(m.imageToPreload$)
        if ok then ok = m.imagePlayer.DisplayPreload()
    else
        ok = m.imagePlayer.DisplayPreload()
    endif

    if ok=0 print "Error Playing File: " ; m.imageToPreload$ : stop

    m.videoPlayer.StopClear()

    return
    
End Sub


Sub LaunchVideo(state As Object, loopMode% As Integer, machineIndex As Integer)

    file$ = state.fileName$

    m.diagnostics.PrintDebug("Enter LaunchVideo: " + file$ + ", loopMode = " + str(loopMode%))

    if machineIndex = 0 then m.SetTouchRegions(state)
    
    m.videoPlayer.SetLoopMode(loopMode%)
    ok = m.videoPlayer.PlayFile(file$)
    if ok=0 print "Error Playing File: " ; file$ : stop

    m.imagePlayer.StopDisplay()
    
    return
    
End Sub


Sub LaunchAudio(state As Object, loopMode% As Integer, machineIndex As Integer)

    file$ = state.fileName$

    m.diagnostics.PrintDebug("Enter LaunchAudio: " + file$ + ", loopMode = " + str(loopMode%))

    if machineIndex = 0 then
        m.SetTouchRegions(state)
        ' always stop video before starting audio
        m.videoPlayer.Stop()
    endif

    m.machines[machineIndex].audioPlayer.SetLoopMode(loopMode%)
    ok = m.machines[machineIndex].audioPlayer.PlayFile(file$)
    if ok=0 print "Error Playing File: " ; file$ : stop

    return
    
End Sub


Sub StopCSVPlayback()

    m.diagnostics.PrintDebug("### Stopping playback")

    ' stop all timers
    
    m.StopAutoscheduleTimers(m.autoscheduleEntries, m.numScheduledEvents%)

    for i = 0 to m.machineCount - 1
        machine = m.machines[i]
        machineState = machine.currentState
        if type(machineState.mstimeoutTimer) = "roTimer" then
            machineState.mstimeoutTimer.Stop()
        endif
    next  

    if type(m.networkTimerDownload) = "roAssociativeArray" then
        if type(m.networkTimerDownload.timer) = "roTimer" then
            m.networkTimerDownload.timer.Stop()
        endif
    endif
        
    if type(m.networkTimerHeartbeat) = "roAssociativeArray" then
        if type(m.networkTimerHeartbeat.timer) = "roTimer" then
            m.networkTimerHeartbeat.timer.Stop()
        endif
    endif
        
    if type(m.networkTimerRSS) = "roAssociativeArray" then
        if type(m.networkTimerRSS.timer) = "roTimer" then
            m.networkTimerRSS.timer.Stop()
        endif
    endif
        
    ' stop all players
    m.videoPlayer.Stop()
    
    for i = 0 to m.machineCount - 1
        m.machines[i].audioPlayer.Stop()
    next                
    
    return
    
End Sub


Sub InitializeTouchScreen()

    if type(m.touchScreen) <> "roTouchScreen" then
        m.touchScreen = CreateObject("roTouchScreen")
        m.touchScreen.SetPort(m.msgPort)
        REM Puts up a cursor if a mouse is attached
        REM The cursor must be a 32 x 32 BMP
        REM The x,y position is the “hot spot” point
        m.touchScreen.SetCursorBitmap("cursor.bmp", 16, 16)
        m.touchScreen.SetResolution(1024, 768)
        m.touchScreen.SetCursorPosition(512, 512)
    endif

    return
    
End Sub


Sub AddRectangularTouchRegion(keyword$ As String, next$ As String, numEvents% As Integer)

    index% = len(keyword$) + 1
    
    yp = instr(index%, next$, ":")+1
    wp = instr(yp, next$, ":")+1
    hp = instr(wp, next$, ":")+1
    if yp=0 or wp=0 or hp=0 then print "Error: Invalid touch coordinates for ELO event":stop
    eloX = val(mid(next$, index%, yp-index%-1))
    eloY = val(mid(next$, yp, wp-yp-1))
    eloWidth = val(mid(next$, wp, hp-wp-1))
    eloHeight = val(mid(next$, hp))
    if m.flipelo then
        eloX=1024-(eloX+eloWidth)
        eloY=768-(eloY+eloHeight)
    endif
    m.touchScreen.AddRectangleRegion(eloX, eloY, eloWidth, eloHeight, numEvents%)

    return
    
End Sub


Sub AddCircularTouchRegion(keyword$ As String, next$ As String, numEvents% As Integer)

    index% = len(keyword$) + 1
    
    yp = instr(index%, next$, ":")+1
    radiusp = instr(yp, next$, ":")+1
    rp = instr(radiusp, next$, ":")+1
    if yp=0 or radiusp=0 or rp=0 then print "Error: Invalid touch coordinates for ELO circle event":stop
    xval=val(mid(next$, index%, yp-index%-1))
    yval=val(mid(next$, yp, radiusp-yp-1))
    radiusval=val(mid(next$, radiusp, rp-radiusp-1))
    if m.flipelo then
        xval=1024-xval
        yval=768-yval
    endif
    m.touchScreen.AddCircleRegion(xval, yval, radiusval, numEvents%)

    return
    
End Sub


Sub AddRectangularRolloverTouchRegion(keyword$ As String, next$ As String, numEvents% As Integer)

    index% = len(keyword$) + 1
    
    yp=instr(index%, next$, ":")+1
    wp=instr(yp, next$, ":")+1
    hp=instr(wp, next$, ":")+1
    rp=instr(hp, next$, ":")+1
    rohip=instr(rp, next$, ":")+1
    rolop=instr(rohip, next$, ":")+1
    oxp=instr(rolop, next$, ":")+1
    oyp=instr(oxp, next$, ":")+1

    if yp=0 or wp=0 or hp=0 or rp=0 or rohip=0 or rolop=0 or oxp=0 or oyp=0 then print "Error: Invalid touch coordinates for ELO event":stop
    xval=val(mid(next$, index%, yp-index%-1))
    yval=val(mid(next$, yp, wp-yp-1))
    wval=val(mid(next$, wp, hp-wp-1))
    hval=val(mid(next$, hp))
    roval=val(mid(next$, rp, rohip-rp-1))
    rohival=mid(next$, rohip, rolop-rohip-1)
    roloval=mid(next$, rolop, oxp-rolop-1)
    oxval=val(mid(next$, oxp, oyp-oxp-1))
    oyval=val(mid(next$, oyp))

    if m.flipelo=1 then
        xval=1024-(xval+wval)
        yval=768-(yval+hval)
    endif
    m.touchScreen.AddRectangleRegion(xval,yval,wval,hval, numEvents%)
    if roval=1 then 
     	m.touchScreen.EnableRollOver(numEvents%, rohival, roloval, true, m.imagePlayer)
		m.touchScreen.SetRollOverOrigin(numEvents%, oxval, oyval)
    endif
    
    return
    
End Sub


Sub AddCircularRolloverTouchRegion(keyword$ As String, next$ As String, numEvents% As Integer)

    index% = len(keyword$) + 1
    
    yp=instr(index%, next$, ":")+1
    radiusp=instr(yp, next$, ":")+1
    rp=instr(radiusp, next$, ":")+1
    rohip=instr(rp, next$, ":")+1
    rolop=instr(rohip, next$, ":")+1
    oxp=instr(rolop, next$, ":")+1
    oyp=instr(oxp, next$, ":")+1

    if yp=0 or radiusp=0 or rp=0 or rohip=0 or rolop=0 or oxp=0 or oyp=0 then print "Error: Invalid touch coordinates for ELO circle event":stop
    xval=val(mid(next$, index%, yp-index%-1))
    yval=val(mid(next$, yp, radiusp-yp-1))
    radiusval=val(mid(next$, radiusp, rp-radiusp-1))
    roval=val(mid(next$, rp, rohip-rp-1))
    rohival=mid(next$, rohip, rolop-rohip-1)
    roloval=mid(next$, rolop, oxp-rolop-1)
    oxval=val(mid(next$, oxp, oyp-oxp-1))
    oyval=val(mid(next$, oyp))
    if m.flipelo=1 then
        xval=1024-xval
        yval=768-yval
    endif
    m.touchScreen.AddCircleRegion(xval,yval,radiusval, numEvents%)
    if roval=1 then 
'MUST RESOLVE is flipelo required?
     	t.EnableRollOver(numEvents%, rohival, roloval, true, m.imagePlayer)
		t.SetRollOverOrigin(numEvents%, oxval, oyval)
    endif
    return
    
End Sub


Sub SetTouchRegions(state As Object)

REM Display the cursor if there is a touch event active in this state
REM If there is only ne touch event we assume that it is to exit and don't display the cursor

    if type(m.touchScreen) <> "roTouchScreen" return

    eloRegionCount% = 0
    
    for i = 0 to m.numEvents%-1
        m.touchScreen.EnableRegion(i, false)
    next
    
    ' clear out all regions
    for each eloEvent in state.eloEvents

        eloIndex$ = right(eloEvent, len(eloEvent)-1)
        eloIndex% = val(eloIndex$)
        
        m.touchScreen.EnableRegion(eloIndex%, true)
        eloRegionCount% = eloRegionCount% + 1

    next

    if eloRegionCount% > 1 then

        m.touchScreen.EnableCursor(true)
        m.diagnostics.PrintDebug("Cursor enabled")
        
    else

        m.touchScreen.EnableCursor(false)
        m.diagnostics.PrintDebug("Cursor disabled")
        
    endif
    
    return
    
End Sub


Sub DisplayRegistryFields(command$ As String, tfRegistry As Object)

    if type(m.registry) <> "roRegistry" then m.registry = CreateObject("roRegistry")
    
    index% = instr(1, command$, "-")
    if index% <> 0 then
        registrySectionName$ = mid(command$, index% + 1)
        DisplayRegistrySection(registrySectionName$, tfRegistry)
    else
        registrySectionList = m.registry.GetSectionList()
        if registrySectionList.Count() = 0 then
            print #tfRegistry, "Registry empty"
        else
            for i = 1 to registrySectionList.Count()
                registrySectionName$ = registrySectionList.RemoveHead()
                DisplayRegistrySection(registrySectionName$, tfRegistry)
            next
        endif
    endif

    return
    
End Sub


Sub DisplayRegistrySection(registrySectionName$ As String, tfRegistry As Object)

    print #tfRegistry, "Registry section: " + registrySectionName$
    
    registrySection = CreateObject("roRegistrySection", registrySectionName$)
    registryKeyList = registrySection.GetKeyList()
    if registryKeyList.Count()=0 then
        regStr$="Registry section " + registrySectionName$ + " is empty."
        print #tfRegistry, regStr$
    else
        for j=1 to registryKeyList.Count()
            registryKeyName = registryKeyList.RemoveHead()
            registryKeyValue = registrySection.Read(registryKeyName)
            regStr$=registryKeyName + " : " + registryKeyValue
            print #tfRegistry, regStr$
        next
    endif
    
    return
    
End Sub


Function CreateTextField() As Object

    ' create Text Field object for displaying registry contents

    CHARWIDTH=24
    CHARHEIGHT=24
    
    videoMode = CreateObject("roVideoMode")
    tfWidth=cint(videoMode.GetResX()/CHARWIDTH)
    tfHeight=cint(videoMode.GetResY()/CHARHEIGHT)
    videoMode = 0

    meta=CreateObject("roAssociativeArray")
    meta.AddReplace("CharWidth",CHARWIDTH)
    meta.AddReplace("CharHeight",CHARHEIGHT)
    meta.AddReplace("BackgroundColor",&H000000)   'black
    meta.AddReplace("TextColor",&H00FFFFFF)   ' white
    tfRegistry=CreateObject("roTextField",0,0,tfWidth,tfHeight,meta)
    if type(tfRegistry)<>"roTextField" then
        print "unable to create roTextField"
        stop
    endif

    tfRegistry.SetSendEol(chr(13)+chr(10))
    return tfRegistry
    
End Function


Function GetNext(parseInfo As Object) As String

    nextPosition = instr(parseInfo.position, parseInfo.fileContents$, ",") + 1
    
    if nextPosition = 1 then
    
        if parseInfo.position >= len(parseInfo.fileContents$) then
            nextString$ = "END"
            m.diagnostics.PrintDebug(nextString$)
            return nextString$
        endif
        
        nextPosition = len(parseInfo.fileContents$) + 1
        
' if the last character is not an eol, then nextPosition should be advanced by 1
' fixes a bug where the last character of the last token was truncated if there was
' no linefeed at the end of the csv file.
        lastChar$ = mid(parseInfo.fileContents$, len(parseInfo.fileContents$), 1)
        if lastChar$ <> parseInfo.eol10 and lastChar$ <> parseInfo.eol13 then
            nextPosition = nextPosition + 1
        endif

        goto okay
        
    endif
    
    nextPositionStart = nextPosition - 1

    nextPositionEOL = instr(parseInfo.position, parseInfo.fileContents$, parseInfo.eol) + parseInfo.eoln
    nextPositionEOLStart = nextPositionEOL - parseInfo.eoln
    
    nextPosition10 = instr(parseInfo.position, parseInfo.fileContents$, parseInfo.eol10) + 1
    nextPosition10Start = nextPosition10 - 1
    
    nextPosition13 = instr(parseInfo.position, parseInfo.fileContents$, parseInfo.eol13) + 1
    nextPosition13Start = nextPosition13 - 1
    
    if nextPositionEOLStart > 0 and nextPositionEOLStart < nextPositionStart then
        nextPositionStart = nextPositionEOLStart
        nextPosition = nextPositionEOL
    endif
    
    if nextPosition10Start > 0 and nextPosition10Start < nextPositionStart then
        nextPositionStart = nextPosition10Start
        nextPosition = nextPosition10
    endif
    
    if nextPosition13Start > 0 and nextPosition13Start < nextPositionStart then
        nextPositionStart = nextPosition13Start
        nextPosition = nextPosition13
    endif
    
okay:
    nextString$ = mid(parseInfo.fileContents$, parseInfo.position, nextPosition - parseInfo.position - 1)
    
    parseInfo.position = nextPosition
    
    nextString$ = StripLeadingSpaces(nextString$)    
    nextString$ = StripTrailingEOLs(nextString$)    

    m.diagnostics.PrintDebug(nextString$)
    return nextString$

End Function


REM *******************************************************
REM *******************************************************
REM ***************                    ********************
REM *************** DIAGNOSTICS OBJECT ********************
REM ***************                    ********************
REM *******************************************************
REM *******************************************************

REM
REM construct a new diagnostics BrightScript object
REM
Function newDiagnostics(debugOn As Boolean, loggingOn As Boolean, usageLoggingOn As Boolean) As Object

    diagnostics = CreateObject("roAssociativeArray")
    
    diagnostics.debug = debugOn
    diagnostics.logging = loggingOn
    diagnostics.usageLoggingOn = usageLoggingOn
    diagnostics.autorunVersion$ = "unknown"
    diagnostics.firmwareVersion$ = "unknown"
    diagnostics.systemTime = CreateObject("roSystemTime")
    
    diagnostics.PrintDebug = PrintDebug
    diagnostics.PrintTimestamp = PrintTimestamp
    diagnostics.OpenLogFile = OpenLogFile
    diagnostics.CloseLogFile = CloseLogFile
    diagnostics.FlushLogFile = FlushLogFile
    diagnostics.WriteToLog = WriteToLog
    diagnostics.SetSystemInfo = SetSystemInfo
    diagnostics.RotateLogFiles = RotateLogFiles
    diagnostics.TurnDebugOn = TurnDebugOn
    
    diagnostics.OpenUsageFile = OpenUsageFile
    diagnostics.WriteToUsageFile = WriteToUsageFile
    diagnostics.GetUsageFileToXfer = GetUsageFileToXfer
    diagnostics.UsageFileXferComplete = UsageFileXferComplete
    
    diagnostics.OpenLogFile()
    if usageLoggingOn then diagnostics.OpenUsageFile()

    return diagnostics

End Function


Sub TurnDebugOn()

    m.debug = true
    
    return
    
End Sub


Sub OpenUsageFile()

    m.usageFileActive = 0
    
    if not m.usageLoggingOn then return
    
    m.usageFileActive = CreateObject("roCreateFile", "tmp:usage.txt")
    if type(m.usageFileActive) <> "roCreateFile" then
        print "unable to open usage.txt"
        stop
    endif
    
    m.usageFileActive.SetSendEol(chr(10))
    
    m.activeUsageFileName$ = "tmp:usage.txt"

    m.usageFileActive.SendBlock("UsageInfo=")

    return
    
End Sub


Function GetUsageFileToXfer() As String

    if type(m.usageFileActive) <> "roCreateFile" then return "FileEmpty"
    
    currentPosition = m.usageFileActive.CurrentPosition()
    if currentPosition = 0 then return "FileEmpty"
    
    m.usageFileXfer = m.usageFileActive
    
    m.usageFileXfer.Flush()
    m.usageFileXfer = 0
    ' m.usageFileXfer.Close()
    
    m.usageFileXfer$ = m.activeUsageFileName$
    
    if (m.activeUsageFileName$ = "tmp:usage.txt") then
        m.usageFileActive = CreateObject("roCreateFile", "tmp:usage2.txt")
        m.activeUsageFileName$ = "tmp:usage2.txt"
    else
        m.usageFileActive = CreateObject("roCreateFile", "tmp:usage.txt")
        m.activeUsageFileName$ = "tmp:usage.txt"
    endif
    
    if type(m.usageFileActive) <> "roCreateFile" then
        print "unable to open usage.txt"
        stop
    endif
    
    m.usageFileActive.SetSendEol(chr(10))

    m.usageFileActive.SendBlock("UsageInfo=")

    return m.usageFileXfer$
        
End Function


Sub UsageFileXferComplete()

    if m.debug then print "### UsageFileXferComplete"

    DeleteFile(m.usageFileXfer$)

    return
    
End Sub


Sub WriteToUsageFile(usageItem$ As String)

    if not m.usageLoggingOn then return

    currentDateTime$ = m.systemTime.GetLocalDateTime().GetString()
    
    m.usageFileActive.SendLine(currentDateTime$ + "|" + usageItem$)

    return
    
End Sub


Sub OpenLogFile()

    m.logFile = 0

    if not m.logging then return

    m.logFileLength = 0

    m.logFile = CreateObject("roReadFile", "log.txt")
    if type(m.logFile) = "roReadFile" then
        m.logFile.SeekToEnd()
        m.logFileLength = m.logFile.CurrentPosition()
        m.logFile = 0
    endif

    m.logFile = CreateObject("roAppendFile", "log.txt")
    if type(m.logFile)<>"roAppendFile" then
        print "unable to open log.txt"
        stop
    endif

    return

End Sub


Sub CloseLogFile()

    if not m.logging then return

    m.logFile.Flush()
    m.logFile = 0

    return

End Sub


Sub FlushLogFile()

    if not m.logging then return

    if m.logFileLength > 1000000 then
        print  "### - Rotate Log Files - ###"
        m.logFile.SendLine("### - Rotate Log Files - ###")
    endif

    m.logFile.Flush()

    if m.logFileLength > 1000000 then
        m.RotateLogFiles()
    endif

    return

End Sub


Sub WriteToLog(eventType$ As String, eventData$ As String, eventResponseCode$ As String, accountName$ As String)

    if not m.logging then return

    if m.debug then print "### write_event"

    ' write out the following info
    '   Timestamp, Device ID, Account Name, Event Type, Event Data, Response Code, Software Version, Firmware Version
    eventDateTime = m.systemTime.GetLocalDateTime()
    eventDataStr$ = eventDateTime + " " + accountName$ + " " + eventType$ + " " + eventData$ + " " + eventResponseCode$ + " autorun.bas " + m.autorunVersion$ + " " + m.firmwareVersion$
    if m.debug then print "eventDataStr$ = ";eventDataStr$
    m.logFile.SendLine(eventDataStr$)

    m.logFileLength = m.logFileLength + len(eventDataStr$) + 14

    m.FlushLogFile()

    return

End Sub


Sub RotateLogFiles()

    log3 = CreateObject("roReadFile", "log_3.txt")
    if type(log3)="roReadFile" then
        log3 = 0
		DeleteFile("log_3.txt")
    endif

    log2 = CreateObject("roReadFile", "log_2.txt")
    if type(log2)="roReadFile" then
        log2 = 0
        MoveFile("log_2.txt", "log_3.txt")
    endif

    m.logFile = 0
    MoveFile("log.txt", "log_2.txt")

    m.OpenLogFile()

    return

End Sub


Sub PrintDebug(debugStr$ As String)

    if type(m) <> "roAssociativeArray" then stop
    
    if m.debug then 

        print debugStr$

        if not m.logging then return

        m.logFile.SendLine(debugStr$)
        m.logFileLength = m.logFileLength + len(debugStr$) + 1
        m.FlushLogFile()

    endif

    return

End Sub


Sub PrintTimestamp()

    eventDateTime = m.systemTime.GetLocalDateTime()
    if m.debug then print eventDateTime.GetString()
    if not m.logging then return
    m.logFile.SendLine(eventDateTime)
    m.FlushLogFile()

    return

End Sub



REM *******************************************************
REM *******************************************************
REM ***************                    ********************
REM *************** NETWORKING OBJECT  ********************
REM ***************                    ********************
REM *******************************************************
REM *******************************************************

REM
REM construct a new networking BrightScript object
REM
Function newNetworking(parent As Object) As Object

    networking = CreateObject("roAssociativeArray")

    networking.systemTime = m.systemTime
    networking.diagnostics = m.diagnostics
    networking.msgPort = m.msgPort

    networking.InitializeNetworkDownloads = InitializeNetworkDownloads
    networking.SendHeartbeat = SendHeartbeat
    networking.SendUsageData = SendUsageData
    networking.StartSync = StartSync
    networking.URLEvent = URLEvent
    networking.URLXferEvent = URLXferEvent
    networking.URLUsageXferEvent = URLUsageXferEvent
    networking.PoolEvent = PoolEvent
    networking.CheckRealizeAlarm = CheckRealizeAlarm
    
    networking.CheckSpaceForRealization = CheckSpaceForRealization

    networking.SendError = SendError
    networking.SendErrorCommon = SendErrorCommon
    networking.SendErrorThenReboot = SendErrorThenReboot
    networking.SendEvent = SendEvent
    networking.SendEventCommon = SendEventCommon
    networking.SendEventThenReboot = SendEventThenReboot
    networking.RetryOnReboot = RetryOnReboot
    networking.SetSystemInfo = SetSystemInfo
    networking.AddMiscellaneousHeaders = AddMiscellaneousHeaders
    networking.SyncOnBoot = SyncOnBoot
    
	networking.eventURL = CreateObject("roUrlTransfer")
	networking.errorURL = CreateObject("roUrlTransfer")
    
    networking.parent = parent

    networking.retryInterval = 60

    networking.POOL_EVENT_FILE_DOWNLOADED = 1
    networking.POOL_EVENT_FILE_FAILED = -1
    networking.POOL_EVENT_ALL_DOWNLOADED = 2
    networking.POOL_EVENT_ALL_FAILED = -2

    networking.POOL_EVENT_REALIZE_SUCCESS = 101
    networking.POOL_EVENT_REALIZE_INCOMPLETE = -102
    networking.POOL_EVENT_REALIZE_FAILED_SAFE = -103
    networking.POOL_EVENT_REALIZE_FAILED_UNSAFE = -104

    networking.SYNC_ERROR_CANCELLED = -10001
    networking.SYNC_ERROR_CHECKSUM_MISMATCH = -10002
    networking.SYNC_ERROR_EXCEPTION = -10003
    networking.SYNC_ERROR_DISK_ERROR = -10004
    networking.SYNC_ERROR_POOL_UNSATISFIED = -10005

    networking.URL_EVENT_COMPLETE = 1

	du = CreateObject("roStorageInfo", "./")
	if type(du) = "roStorageInfo" then
        networking.cardSizeInMB = du.GetFreeInMegabytes() + du.GetUsedInMegabytes()
        du = 0
    else
        networking.cardSizeInMB = 0
    endif

    return networking

End Function


Function InitializeNetworkDownloads() As Boolean

    modelObject = CreateObject("roDeviceInfo")
    versionNumber = modelObject.GetVersionNumber()
    if versionNumber >= 196910 then ' 3.1.46
        versionGTE3146 = true
    else
        versionGTE3146 = false
    endif

    ' determine whether or not to enable proxy mode support
	m.proxy_mode = false
	
    ' if caching is enabled, set parameter indicating whether downloads are only allowed from the cache
    m.downloadOnlyIfCached = false   
    
    if versionGTE3146 then
        nc = CreateObject("roNetworkConfiguration", 0)
        if type(nc) = "roNetworkConfiguration" then
            if nc.GetProxy() <> "" then
	            m.proxy_mode = true
                registrySection = CreateObject("roRegistrySection", "networking")
                if type(registrySection) <> "roRegistrySection" then print "Error: Unable to create roRegistrySection":stop
                OnlyDownloadIfCached$ = registrySection.Read("OnlyDownloadIfCached")
                if OnlyDownloadIfCached$ = "true" then m.downloadOnlyIfCached = true
                registrySection = 0
            endif
        endif
        nc = 0
    endif

    ' Load up the current sync specification so we have it ready
	m.currentSync = CreateObject("roSyncSpec")
	if type(m.currentSync) <> "roSyncSpec" then return false
	if not m.currentSync.ReadFromFile("current-sync.xml") then
	    m.diagnostics.PrintDebug("### No current sync state available")
	    return false
	endif

    m.accountName$ = m.currentSync.LookupMetadata("server", "account")

	nextURL = m.currentSync.LookupMetadata("client", "next")
	errorURL = m.currentSync.LookupMetadata("client", "error")
	eventURL = m.currentSync.LookupMetadata("client", "event")
	heartbeatURL = m.currentSync.LookupMetadata("client", "heartbeat")
    usageURL = m.currentSync.LookupMetadata("client", "usage")

	timezone = m.currentSync.LookupMetadata("client", "timezone")
    if timezone <> "" then
        m.systemTime.SetTimeZone(timezone)
    endif

    m.diagnostics.PrintTimestamp()
    m.diagnostics.PrintDebug("### Currently active sync list suggests next URL of " + nextURL)
    m.diagnostics.PrintDebug("### Errors to " + errorURL)
    m.diagnostics.PrintDebug("### Events to " + eventURL)
    m.diagnostics.PrintDebug("### Heartbeat " + heartbeatURL)

	if nextURL = "" then stop
	if errorURL = "" then stop
    if eventURL = "" then stop
	if heartbeatURL = "" then stop

    m.user$ = m.currentSync.LookupMetadata("server", "user")
    m.password$ = m.currentSync.LookupMetadata("server", "password")
    if m.user$ <> "" and m.password$ <> "" then
        m.setUserAndPassword = true
    else
        m.setUserAndPassword = false
    endif

' send initial heartbeat
    m.SendHeartbeat()

' Now look for one that's ready to realize
	readySync = CreateObject("roSyncSpec")
	m.realizeAlarm = CreateObject("roTimer")
	m.realizeAlarm.SetPort(m.msgPort)

' See if we have a pending sync. We'd better set up an alarm to realize it at the correct time. This will raise an event immediately if that time has already passed.
	if readySync.ReadFromFile("ready-sync.xml") then
        timezone = readySync.LookupMetadata("client", "timezone")
        if timezone <> "" then
            m.systemTime.SetTimeZone(timezone)
        endif
		effectiveString = readySync.LookupMetadata("client", "effective")
		if effectiveString = "" then
			effectiveDate = m.systemTime.GetLocalDateTime()
		else
			effectiveDate = CreateObject("roDateTime")
			if not effectiveDate.FromIsoString(effectiveString) then stop
		endif

        m.diagnostics.PrintTimestamp()
        m.diagnostics.PrintDebug("### Effective alarm set for " + effectiveDate)
		m.realizeAlarm.SetDateTime(effectiveDate)
		m.realizeAlarm.Start()
	endif

	readySync = 0

    didSync = false
    if m.SyncOnBoot() then
        m.StartSync("download")
        didSync = true
    endif

' if the last session ended with a 'soft' realize error, we want to contact the network immediately
    registrySection = CreateObject("roRegistrySection", "networking")
    if type(registrySection) <> "roRegistrySection" then print "Error: Unable to create roRegistrySection":stop
    retry = registrySection.Read("network_retry")
    retried = registrySection.Read("network_retried")
    if retry = "true" and (retried = "false" or retried = "") then
        m.diagnostics.PrintDebug("### network retry true, network retried false")
        m.SendEvent("Network retry after reboot", "", "")
        registrySection.Write("network_retry", "false")
        registrySection.Write("network_retried", "true")
        registrySection.Flush()
        if not didSync then m.StartSync("download")
    else if retried = "true"
        m.diagnostics.PrintDebug("### network retried true")
        registrySection.Write("network_retry", "false")
        registrySection.Write("network_retried", "false")
        registrySection.Flush()
    else
        registrySection.Write("network_retry", "false")
        registrySection.Write("network_retried", "false")
        registrySection.Flush()
    endif

    return true

End Function


Sub StartSync(syncType$ As String)

' Call when you want to start a sync operation

    m.diagnostics.PrintTimestamp()
    
    m.diagnostics.PrintDebug("### start_sync " + syncType$)
    
	if type(m.syncPool) = "roSyncPool" then
' This should be improved in the future to work out
' whether the sync spec we're currently satisfying
' matches the one that we're currently downloading or
' not.
        m.diagnostics.PrintDebug("### sync already active so we'll let it continue")
		return
	endif

    if syncType$ = "cache" then
        if not m.proxy_mode then
            m.diagnostics.PrintDebug("### cache download requested but the BrightSign is not configured to use a cache server")
            return
        endif
    endif
    
	m.xfer = CreateObject("roUrlTransfer")
	m.xfer.SetPort(m.msgPort)
	
	m.syncType$ = syncType$

    m.diagnostics.PrintDebug("### xfer created - identity = " + str(m.xfer.GetIdentity()) + " ###")

' We've read in our current sync. Talk to the server to get
' the next sync. Note that we use the current-sync.xml because
' we need to tell the server what we are _currently_ running not
' what we might be running at some point in the future.

	nextURL = m.currentSync.LookupMetadata("client", "next")
    m.diagnostics.PrintDebug("### Looking for new sync list from " + nextURL)
	m.xfer.SetUrl(nextURL)
    if m.setUserAndPassword then m.xfer.SetUserAndPassword(m.user$, m.password$)
    m.xfer.SetMinimumTransferRate(10,240)
	m.xfer.SetHeaders(m.currentSync.GetMetadata("server"))

' Add device unique identifier, timezone
    m.xfer.AddHeader("DeviceID", m.deviceUniqueID$)
    m.xfer.AddHeader("DeviceModel", m.deviceModel$)
    m.xfer.AddHeader("DeviceFWVersion", m.firmwareVersion$)
    m.xfer.AddHeader("DeviceSWVersion", "autorun.bas " + m.autorunVersion$)
    m.xfer.AddHeader("timezone", m.systemTime.GetTimeZone())
    m.xfer.AddHeader("localTime", m.systemTime.GetLocalDateTime().GetString())
    m.xfer.AddHeader("VideoWidth", m.videoWidth)
    m.xfer.AddHeader("VideoHeight", m.videoHeight)

    m.AddMiscellaneousHeaders(m.xfer)
    
	if not m.xfer.AsyncGetToFile("tmp:new-sync.xml") then stop

    return
    
End Sub


Sub AddMiscellaneousHeaders(urlXfer As Object)

    modelObject = CreateObject("roDeviceInfo")
    versionNumber = modelObject.GetVersionNumber()
    if versionNumber >= 196910 then ' 3.1.46
        versionGTE3146 = true
    else
        versionGTE3146 = false
    endif

' Add card size
	du = CreateObject("roStorageInfo", "./")
	urlXfer.AddHeader("storage-size", str(du.GetFreeInMegabytes() + du.GetUsedInMegabytes()))
	if versionGTE3146 then
	    urlXfer.AddHeader("storage-fs", du.GetFileSystemType())
    endif
    
' Add estimated realized size
	tempPool = CreateObject("roSyncPool", "pool")
	tempSpec = CreateObject("roSyncSpec")
	if tempSpec.ReadFromFile("current-sync.xml") then
	    urlXfer.AddHeader("storage-current-used", str(tempPool.EstimateRealizedSizeInMegabytes(tempSpec, "./")))
	endif
	tempPool = 0
	tempSpec = 0

	readySync = CreateObject("roSyncSpec")
	if readySync.ReadFromFile("ready-sync.xml") then
        syncListID = readySync.LookupMetadata("server", "synclistid")
        urlXfer.AddHeader("pendingsynclistid", syncListID)
    endif
    readySync = 0

    return
    
End Sub


' Call when we get a URL event
Sub URLEvent(msg As Object)

    m.diagnostics.PrintTimestamp()
    
    m.diagnostics.PrintDebug("### url_event")

	if type (m.xfer) = "roUrlTransfer" then 
		if msg.GetSourceIdentity() = m.xfer.GetIdentity() then
	        m.URLXferEvent(msg)
	    endif
	endif
	
	if type (m.usageXfer) = "roUrlTransfer" then
	    if msg.GetSourceIdentity() = m.usageXfer.GetIdentity() then
	        m.URLUsageXferEvent(msg)
	    endif
	endif

    return
    
End Sub


Sub URLUsageXferEvent(msg As Object)

	if msg.GetInt() = m.URL_EVENT_COMPLETE then
	    if msg.GetResponseCode() = 200 then
            m.diagnostics.UsageFileXferComplete()
        else
            m.diagnostics.PrintDebug("### Failed to upload usage data.")
            m.SendError("Failed to upload usage data", "", str(msg.GetResponseCode()), "")
		endif
    endif
    
    return
    
End Sub


Sub URLXferEvent(msg As Object)

	if msg.GetSourceIdentity() = m.xfer.GetIdentity() then
	    if msg.GetInt() = m.URL_EVENT_COMPLETE then
		    xferInUse = false
		    if msg.GetResponseCode() = 200 then
			    m.newSync = CreateObject("roSyncSpec")
			    if m.newSync.ReadFromFile("tmp:new-sync.xml") then
                    m.diagnostics.PrintDebug("### Server gave us spec: " + m.newSync.GetName())
				    if m.newSync.EqualTo(m.currentSync) then
                        m.diagnostics.PrintDebug("### Server has given us a spec that matches current-sync. Nothing more to do.")
					    DeleteFile("tmp:new-sync.xml")
					    DeleteFile("ready-sync.xml")
					    m.newSync = 0
					    return
				    endif
				    readySync = CreateObject("roSyncSpec")
				    if readySync.ReadFromFile("ready-sync.xml") then
					    if m.newSync.EqualTo(readySync) then
                            m.diagnostics.PrintDebug("### Server has given us a spec that matches ready-sync. Nothing more to do.")
						    DeleteFile("tmp:new-sync.xml")
						    readySync = 0
						    m.newSync = 0
						    return
					    endif
				    endif
                    badReadySync = CreateObject("roSyncSpec")
				    if badReadySync.ReadFromFile("bad-sync.xml") then
					    if m.newSync.EqualTo(badReadySync) then
                            m.diagnostics.PrintDebug("### Server has given us a spec that matches bad-sync. Nothing more to do.")
						    DeleteFile("tmp:new-sync.xml")
						    badReadySync = 0
						    m.newSync = 0
						    return
					    endif
				    endif

' Anything the server has given us supersedes ready-sync.xml so we'd better delete it and cancel its alarm
				    DeleteFile("ready-sync.xml")
				    m.realizeAlarm.Stop()

' Log the start of sync list download
                    m.SendEvent("StartSyncListDownload", m.newSync.GetName(), "")

				    m.syncPool = CreateObject("roSyncPool", "pool")
				    m.syncPool.SetPort(m.msgPort)
                    if m.setUserAndPassword then m.syncPool.SetUserAndPassword(m.user$, m.password$)
                    m.syncPool.SetMinimumTransferRate(1000,900)
                    m.syncPool.SetHeaders(m.newSync.GetMetadata("server"))
                    m.syncPool.AddHeader("DeviceID", m.deviceUniqueID$)

' this error implies that the current sync list is corrupt - go back to sync list in registry and reboot - no need to retry
' do this by deleting autorun.bas and rebooting
				    if not m.syncPool.ProtectFiles(m.currentSync, 1) then
                        DeleteFile("autorun.bas")
                        m.diagnostics.PrintDebug("### ProtectFiles failed: " + m.syncPool.GetFailureReason())
					    m.newSync = 0
					    m.SendErrorThenReboot("ProtectFilesFailure", m.syncPool.GetFailureReason(), "", m.currentSync.GetName())
' implies dodgy XML, or something is already running. could happen if server sends down bad xml.
				    else
                        if m.proxy_mode then
					        m.syncPool.AddHeader("Roku-Cache-Request", "Yes")
					    endif
					    
				        if m.syncType$ = "download" then
				            if m.downloadOnlyIfCached then m.syncPool.AddHeader("Cache-Control", "only-if-cached")
				            if not m.syncPool.AsyncDownload(m.newSync) then
				                m.parent.ResetDownloadTimerToDoRetry()
				                m.diagnostics.PrintTimestamp()
                                m.diagnostics.PrintDebug("### AsyncDownload failed: " + m.syncPool.GetFailureReason())
					            m.SendError("AsyncDownloadFailure", m.syncPool.GetFailureReason(), "", m.newSync.GetName())
					            m.newSync = 0
					        endif
					    else
					        m.syncPool.AsyncSuggestCache(m.newSync)
					    endif
				    endif
' implies dodgy XML, or something is already running. could happen if server sends down bad xml.
			    else
				    m.parent.ResetDownloadTimerToDoRetry()
			        m.diagnostics.PrintDebug("### Failed to read new-sync.xml")
			        m.SendError("Failed to read new-sync.xml", "", "", m.newSync.GetName())
				    m.newSync = 0
			    endif
		    else if msg.GetResponseCode() = 404 then
                m.diagnostics.PrintDebug("### Server has no sync list for us: " + str(msg.GetResponseCode()))
' The server has no new sync for us. That means if we have one lined up then we should destroy it.
			    DeleteFile("ready-sync.xml")
			    m.realizeAlarm.Stop()
		    else
    ' retry - server returned something other than a 200 or 404
				m.parent.ResetDownloadTimerToDoRetry()
                m.diagnostics.PrintDebug("### Failed to download sync list: " + str(msg.GetResponseCode()))
                m.SendError("Failed to download sync list", "", str(msg.GetResponseCode()), "")
		    endif
	    else
	    	m.diagnostics.PrintDebug("### Progress URL event - we don't know about those.")
	    endif

	else
        m.parent.ResetDownloadTimerToDoRetry()
	    m.diagnostics.PrintDebug("### url_event from beyond this world: " + str(msg.GetSourceIdentity()) + ", " + str(msg.GetResponseCode()) + ", " + str(msg.GetInt()))
        m.SendError("url_event from beyond this world", "", "", str(msg.GetSourceIdentity()))
	endif
	
	return

End Sub


' Call when we get a sync event
Sub PoolEvent(msg As Object)
    m.diagnostics.PrintTimestamp()
    m.diagnostics.PrintDebug("### pool_event")
	if type(m.syncPool) <> "roSyncPool" then
        m.diagnostics.PrintDebug("### pool_event but we have no object")
		return
	endif
	if msg.GetSourceIdentity() = m.syncPool.GetIdentity() then
		if (msg.GetEvent() = m.POOL_EVENT_FILE_DOWNLOADED) then
            m.diagnostics.PrintDebug("### File downloaded " + msg.GetName())
		elseif (msg.GetEvent() = m.POOL_EVENT_FILE_FAILED) then
            m.diagnostics.PrintDebug("### File failed " + msg.GetName() + ": " + msg.GetFailureReason())
            m.SendError("FileDownloadFailure", msg.GetFailureReason(), str(msg.GetResponseCode()), msg.GetName())
		elseif (msg.GetEvent() = m.POOL_EVENT_ALL_DOWNLOADED) then
            m.diagnostics.PrintDebug("### All downloaded for " + m.newSync.GetName())

' Log the end of sync list download
            m.SendEvent("EndSyncListDownload", m.newSync.GetName(), str(msg.GetResponseCode()))

' last chance to check if there is sufficient space on the device for realization
' don't need to do this check, wait for it to fail, then tell the server
            requiredSizeInMB% = m.CheckSpaceForRealization()
            m.diagnostics.PrintDebug("### Realization space check: Required size=" + str(requiredSizeInMB%) + ", total size=" + str(m.cardSizeInMB))
            m.SendEvent("CheckSpaceForRealization", "Required size=" + str(requiredSizeInMB%) + "- total size=" + str(m.cardSizeInMB), "")

' Catch out of disk errors when they actually happen
'            if required_size_in_mb > card_size_in_mb then
'    			DeleteFile("tmp:new-sync.xml")
'                errorType = "RealizationSpaceCheckFailure"
'                errorReason = "Required size=" + str(required_size_in_mb) + ", total size=" + str(card_size_in_mb)
'                errorResponseCode = ""
'                errorData = ""
'                gosub send_error
'                return
'            endif

			if not m.newSync.WriteToFile("ready-sync.xml") then stop
			DeleteFile("tmp:new-sync.xml")
            m.diagnostics.PrintDebug("### Setting realize alarm")
            timezone = m.newSync.LookupMetadata("client", "timezone")
            if timezone <> "" then
                m.systemTime.SetTimeZone(timezone)
            endif
			effectiveString = m.newSync.LookupMetadata("client", "effective")
			if effectiveString = "" then
				effectiveDate = m.systemTime.GetLocalDateTime()
			else
				effectiveDate = CreateObject("roDateTime")
				if not effectiveDate.FromIsoString(effectiveString) then stop
			endif

            m.diagnostics.PrintDebug("### Effective alarm set for " + m.newSync.GetName() + " at " + effectiveDate)
			m.realizeAlarm.SetDateTime(effectiveDate)
			m.realizeAlarm.Start()
			m.newSync = 0
			m.syncPool = 0
            m.diagnostics.PrintDebug("### Waiting for realize alarm")
		elseif (msg.GetEvent() = m.POOL_EVENT_ALL_FAILED) then
		    if m.syncType$ = "download" then
			    m.parent.ResetDownloadTimerToDoRetry()
                m.diagnostics.PrintDebug("### Sync failed: " + msg.GetFailureReason())
                m.SendError("SyncFailure", msg.GetFailureReason(), str(msg.GetResponseCode()), "")
            else
                m.diagnostics.PrintDebug("### Proxy mode sync complete")
            endif
			m.newSync = 0
			m.syncPool = 0
		endif
	else
        m.diagnostics.PrintDebug("### pool_event from beyond this world: " + str(msg.GetSourceIdentity()))
	endif
	return

End Sub


' Call when we get a timer event
Sub CheckRealizeAlarm(msg As Object)
    m.diagnostics.PrintTimestamp()
    m.diagnostics.PrintDebug("### check_realize_alarm")
    if type(m.realizeAlarm) = "roTimer" then
	    if msg.GetSourceIdentity() = m.realizeAlarm.GetIdentity() then
            m.diagnostics.PrintDebug("### realize_alarm")
            m.parent.StopPlayback()
		    realizeSync = CreateObject("roSyncSpec")
    ' check to see if sync_pool exists: sync_pool <> 0 (not exactly). this would be bad.
		    realizePool = CreateObject("roSyncPool", "pool")
            if m.setUserAndPassword then realizePool.SetUserAndPassword(m.user$, m.password$)
            m.diagnostics.PrintDebug("### flibbet")
		    if realizeSync.ReadFromFile("ready-sync.xml") then
                m.diagnostics.PrintDebug("### Realizing " + realizeSync.GetName())
                m.SendEvent("Realizing", realizeSync.GetName(), "")
			    result = realizePool.Realize(realizeSync, "./")
			    if type(result) = "roSyncPoolEvent" then
				    if (result.GetEvent() = m.POOL_EVENT_REALIZE_SUCCESS) then
					    if not realizeSync.WriteToFile("current-sync.xml") then
					        m.SendError("FailureToWriteToCurrent-Sync", "", "")
                            stop
                        endif
					    DeleteFile("ready-sync.xml")
                        DeleteFile("bad-sync.xml")

    ' prepare for reboot
                        m.diagnostics.PrintDebug("### SYNC_EVENT_REALIZE_SUCCESS")
                        m.SendEventThenReboot("RealizeComplete", realizeSync.GetName(), "")
                        
				    elseif (result.GetEvent() = m.POOL_EVENT_REALIZE_INCOMPLETE) then
    ' pool doesn't contain everything it should. it's possible that this will be fixed the next time around, so
    ' don't use bad-sync.xml
                        m.RetryOnReboot()
                        m.diagnostics.PrintDebug("### Realize failed (incomplete): " + result.GetFailureReason())
				        realizePool.Validate(realizeSync)
                        DeleteFile("ready-sync.xml")
                        m.SendErrorThenReboot("Realize failed (incomplete)", result.GetFailureReason(), "", "")
				    elseif (result.GetEvent() = m.POOL_EVENT_REALIZE_FAILED_SAFE) then
    ' Things failed before we trashed the filesystem
                        m.diagnostics.PrintDebug("### Realize failed (safely): " + result.GetFailureReason())
					    if (result.GetResponseCode() = m.SYNC_ERROR_CHECKSUM_MISMATCH) then
    ' reboot, this will force a disk check
                            m.RetryOnReboot()
                            m.diagnostics.PrintDebug("### We got a checksum mismatch, validating the pool")
                            errorType = "Realize failed (safely) - checksum mismatch"
					        realizePool.Validate(realizeSync)
                            DeleteFile("ready-sync.xml")
					    else if (result.GetResponseCode() = m.SYNC_ERROR_DISK_ERROR) then
    ' write to bad-sync.xml; don't continually retry
                            m.diagnostics.PrintDebug("### Disk error. Could mean the disk was full")
                            errorType = "Realize failed (safely) - disk error"
                            MoveFile("ready-sync.xml", "bad-sync.xml")
                        else ' for all other errors, retry on reboot
                            errorType = "Realize failed (safely) - other"
                            m.RetryOnReboot()
					        realizePool.Validate(realizeSync)
                            DeleteFile("ready-sync.xml")
					    endif
    					
					    m.SendErrorThenReboot(errorType, result.GetFailureReason(), str(result.GetResponseCode()), "")

				    elseif (result.GetEvent() = m.POOL_EVENT_REALIZE_FAILED_UNSAFE) then
    ' Things failed after we trashed the filesystem (contents of it). Most likely cause is file system corruption or a bug in the SW
    ' reboot, this will force a disk check. don't know what files are present - delete autorun.bas and reboot
                        DeleteFile("autorun.bas")
                        m.diagnostics.PrintDebug("### Realize failed (badly): " + result.GetFailureReason())
                        m.SendErrorThenReboot("Realize failed (badly)", result.GetFailureReason(), "", "")
					    stop
				    else
    ' this shouldn't happen. watch for it in the logs
                        m.RetryOnReboot()
                        m.diagnostics.PrintDebug("### Unexpected response from Realize")
                        m.SendErrorThenReboot("Unexpected response from Realize", "", "", "")
				    endif
			    endif
		    else
    ' possibly dodgy xml, retry - file system corruption
                m.RetryOnReboot()
                m.diagnostics.PrintDebug("### Failed to read ready-sync.xml")
                m.SendErrorThenReboot("Failed to read ready-sync.xml", "", "", "")
		    endif
            realizeSync = 0
	    endif
	endif
	
	return

End Sub


Sub SendHeartbeat()

    m.diagnostics.PrintTimestamp()

    m.diagnostics.PrintDebug("### send_heartbeat")
' Don't attach to a message port because we're not interested in whether it succeeds or fails
	heartbeat = CreateObject("roUrlTransfer")
	heartbeat.SetUrl(m.currentSync.LookupMetadata("client", "heartbeat"))
	heartbeat.SetHeaders(m.currentSync.GetMetadata("server"))
    heartbeat.AddHeader("DeviceID", m.deviceUniqueID$)
    heartbeat.AddHeader("DeviceModel", m.deviceModel$)
    heartbeat.AddHeader("DeviceFWVersion", m.firmwareVersion$)
    heartbeat.AddHeader("DeviceSWVersion", "autorun.bas " + m.autorunVersion$)
    heartbeat.AddHeader("timezone", m.systemTime.GetTimeZone())

    m.AddMiscellaneousHeaders(heartbeat)
    
	heartbeat.AsyncPostFromString("HEARTBEAT")

' upload usage info
    m.SendUsageData()
    return
    
End Sub


Sub SendUsageData()

    m.diagnostics.PrintDebug("### SendUsageData")

    usageFile$ = m.diagnostics.GetUsageFileToXfer()
    if usageFile$ = "FileEmpty" then
        m.diagnostics.PrintDebug("### No usage data to upload")
        return
    endif

	m.usageXfer = CreateObject("roUrlTransfer")
	m.usageXfer.SetPort(m.msgPort)

    m.diagnostics.PrintDebug("### usageXfer created - identity = " + str(m.usageXfer.GetIdentity()) + " ###")

	m.usageXfer.SetUrl(m.currentSync.LookupMetadata("client", "usage"))
	m.usageXfer.SetHeaders(m.currentSync.GetMetadata("server"))
    m.usageXfer.AddHeader("DeviceID", m.deviceUniqueID$)
    m.usageXfer.AddHeader("DeviceModel", m.deviceModel$)
    m.usageXfer.AddHeader("DeviceFWVersion", m.firmwareVersion$)
    m.usageXfer.AddHeader("DeviceSWVersion", "autorun.bas " + m.autorunVersion$)
    m.usageXfer.AddHeader("timezone", m.systemTime.GetTimeZone())
    
    if not m.usageXfer.AsyncPostFromFile(usageFile$) then stop

    return
    
End Sub


Function SendEventCommon(eventType$ As String, eventData$ As String, eventResponseCode$ As String) As String

    m.diagnostics.PrintDebug("### send_event")
	m.eventURL.SetUrl(m.currentSync.LookupMetadata("client", "event"))
	m.eventURL.SetHeaders(m.currentSync.GetMetadata("server"))
    m.eventURL.AddHeader("DeviceID", m.deviceUniqueID$)
    m.eventURL.AddHeader("DeviceModel", m.deviceModel$)
    m.eventURL.AddHeader("DeviceFWVersion", m.firmwareVersion$)
    m.eventURL.AddHeader("DeviceSWVersion", "autorun.bas " + m.autorunVersion$)
    
    e1$ = m.eventURL.Escape(eventType$)
    e2$ = m.eventURL.Escape(eventData$)
    e3$ = m.eventURL.Escape(eventResponseCode$)
    
    eventStr$ = "EventType=" + e1$ + "&EventData=" + e2$ + "&ResponseCode=" + e3$

    return eventStr$

End Function


Sub SendEvent(eventType$ As String, eventData$ As String, eventResponseCode$ As String)

    eventStr$ = m.SendEventCommon(eventType$, eventData$, eventResponseCode$)

	m.eventURL.AsyncPostFromString(eventStr$)

    m.diagnostics.WriteToLog(eventType$, eventData$, eventResponseCode$, m.accountName$)

	return

End Sub


Sub SendEventThenReboot(eventType$ As String, eventData$ As String, eventResponseCode$ As String)

    eventStr$ = m.SendEventCommon(eventType$, eventData$, eventResponseCode$)

    eventPort = CreateObject("roMessagePort")
	m.eventURL.SetPort(eventPort)
	m.eventURL.AsyncPostFromString(eventStr$)

    m.diagnostics.WriteToLog(eventType$, eventData$, eventResponseCode$, m.accountName$)

    unexpectedUrlEventCount = 0

    while true

        msg = wait(10000, eventPort)   ' wait for either a timeout (10 seconds) or a message indicating that the post was complete

        if type(msg) = "rotINT32" then
            m.diagnostics.PrintDebug("### timeout before final event posted")
            ' clear
	        a=RebootSystem()
            stop
        else if type(msg) = "roUrlEvent" then
    	    if msg.GetSourceIdentity() = m.eventURL.GetIdentity() then
	    	    if msg.GetResponseCode() = 200 then
                    ' clear
            	    a=RebootSystem()
                endif
            endif
        endif

        m.diagnostics.PrintDebug("### unexpected url event while waiting to reboot: " + type(msg))
        unexpectedUrlEventCount = unexpectedUrlEventCount + 1
        if unexpectedUrlEventCount > 10 then
            m.diagnostics.PrintDebug("### reboot due to too many url events while waiting to reboot")
            ' clear
            a=RebootSystem()
        endif

    endwhile

    return

End Sub


Function SendErrorCommon(errorType$ As String, errorReason$ As String, errorResponseCode$ As String, errorData$ As String) As String

    m.diagnostics.PrintDebug("### send_error")
	if not m.errorURL.SetUrl(m.currentSync.LookupMetadata("client", "error")) then
		' Must be active asynchronously. Let's wait a bit and try again.
		wait(500, 0)
		if not m.errorURL.SetUrl(m.currentSync.LookupMetadata("client", "error")) then
			return ""
		end if
	end if

	if not m.errorURL.SetHeaders(m.currentSync.GetMetadata("server")) then
		' Well that's strange
		stop
	end if
    m.errorURL.AddHeader("DeviceID", m.deviceUniqueID$)
    m.errorURL.AddHeader("DeviceModel", m.deviceModel$)
    m.errorURL.AddHeader("DeviceFWVersion", m.firmwareVersion$)
    m.errorURL.AddHeader("DeviceSWVersion", "autorun.bas " + m.autorunVersion$)
        
    e1$ = m.errorURL.Escape(errorType$)
    e2$ = m.errorURL.Escape(errorReason$)
    e3$ = m.errorURL.Escape(errorResponseCode$)
    e4$ = m.errorURL.Escape(errorData$)
    
    errorStr$ = "ErrorType=" + e1$ + "&FailureReason=" + e2$ + "&ResponseCode=" + e3$  + "&ErrorData=" + e4$

    return errorStr$

End Function


Sub SendError(errorType$ As String, errorReason$ As String, errorResponseCode$ As String, errorData$ As String)

    errorStr$ = m.SendErrorCommon(errorType$, errorReason$, errorResponseCode$, errorData$)

	if (len(errorStr$) > 0) then
		m.errorURL.AsyncPostFromString(errorStr$)
	end if
	
	return

End Sub


Sub SendErrorThenReboot(errorType$ As String, errorReason$ As String, errorResponseCode$ As String, errorData$ As String)

    errorStr$ = m.SendErrorCommon(errorType$, errorReason$, errorResponseCode$, errorData$)

	if (len(errorStr$) > 0) then
		errorPort = CreateObject("roMessagePort")
		m.errorURL.SetPort(errorPort)
		m.errorURL.AsyncPostFromString(errorStr$)
		
		unexpectedUrlErrorCount = 0
		
		while true
			
			msg = wait(10000, errorPort)   ' wait for either a timeout (10 seconds) or a message indicating that the post was complete
			
			if type(msg) = "rotINT32" then
				m.diagnostics.PrintDebug("### timeout before final error posted")
				' clear
				a=RebootSystem()
				stop
			else if type(msg) = "roUrlEvent" then
    	        if msg.GetSourceIdentity() = m.errorURL.GetIdentity() then
					if msg.GetResponseCode() = 200 then
						' clear
						a=RebootSystem()
					endif
				endif
			endif
			
			m.diagnostics.PrintDebug("### unexpected url event while waiting to reboot")
			unexpectedUrlErrorCount = unexpectedUrlErrorCount + 1
			if unexpectedUrlErrorCount > 10 then
				m.diagnostics.PrintDebug("### reboot due to too many url events while waiting to reboot")
				' clear
				a=RebootSystem()
			endif
			
		endwhile
	else
	    RebootSystem()
		stop
	end if

    return

End Sub

Function SyncOnBoot() As Boolean

	groupName = m.currentSync.LookupMetadata("server", "group")
    if groupName = "LocalTest" then return true
    
    registrySection = CreateObject("roRegistrySection", "networking")
    if type(registrySection)<>"roRegistrySection" then print "Error: Unable to create roRegistrySection":stop
    
    SyncOnBoot$ = registrySection.Read("SyncOnBoot")
    if SyncOnBoot$ = "true" then return true

    return false

End Function


Function CheckSpaceForRealization() As Integer

	du = CreateObject("roStorageInfo", "./")

' get size of current sync spec
	tempPool = CreateObject("roSyncPool", "pool")
	tempSpec = CreateObject("roSyncSpec")
	if tempSpec.ReadFromFile("current-sync.xml") then
        currentSizeInMB = tempPool.EstimateRealizedSizeInMegabytes(tempSpec, "./")
	endif
	tempSpec = 0

' get size of realize sync spec
	tempPool = CreateObject("roSyncPool", "pool")
    newSizeInMB = tempPool.EstimateRealizedSizeInMegabytes(m.newSync, "./")
	tempPool = 0

    requiredSizeInMB = newSizeInMB * 2 + currentSizeInMB

    return requiredSizeInMB

End Function


Sub RetryOnReboot()

    m.diagnostics.PrintDebug("### set retry_on_reboot ###")
    registrySection = CreateObject("roRegistrySection", "networking")
    if type(registrySection)<>"roRegistrySection" then print "Error: Unable to create roRegistrySection":stop
    registrySection.Write("network_retry", "true")
    registrySection.Flush()

	return

End Sub


REM *******************************************************
REM *******************************************************
REM ***************                    ********************
REM *************** UTILITY FUNCTIONS  ********************
REM ***************                    ********************
REM *******************************************************
REM *******************************************************

Function IsImageFile(inputString$ As String) As Boolean

    tk$ = ucase(right(inputString$, 4))
    if tk$=".BMP" or tk$=".PNG" or tk$=".JPG" then return true
    return false
    
End Function


Function IsVideoFile(inputString$ As String) As Boolean

'temporary hack until HasFeature indicates types of video files supported
    di = CreateObject("roDeviceInfo")
    model = di.GetModel()
    di=0
   
    tk$ = ucase(right(inputString$, 4))
    if tk$=".MPG" or tk$=".VOB" then return true
     
    if model <> "HD2000" then
	    if tk$=".MOV" or tk$=".MP4" or tk$=".WMV" then return true
        tk$ = ucase(right(inputString$, 3))
        if tk$=".TS" then return true
    endif
    
    return false
    
End Function


Function IsAudioFile(inputString$ As String) As Boolean

    tk$ = ucase(right(inputString$, 4))
    if tk$=".MP3" or tk$=".WAV" or tk$=".M4A" or tk$=".MPA" then return true
    return false
    
End Function


Function IsMediaFile(inputString$ As String) As Boolean

    if IsVideoFile(inputString$) then return true
    if IsImageFile(inputString$) then return true
    if IsAudioFile(inputString$) then return true
    return false
    
End Function


Function KeywordMatches(inputString$ As String, keyword$ As String) As Boolean

    if ucase(keyword$) = ucase(inputString$) then return true
    return false

End Function


Function CheckToken(inputString$ As String, keyword$ As String) As Boolean

    if ucase(keyword$) = ucase(left(inputString$, len(keyword$))) then return true
    return false

End Function


Function CheckTokenLen(inputString$ As String, keyword$ As String) As Boolean

    if ucase(keyword$) = ucase(left(inputString$, len(keyword$))) then return true
    return false

End Function


Function StripLeadingSpaces(inputString$ As String) As String

    while true
        if left(inputString$, 1)<>" " then return inputString$
        inputString$ = right(inputString$, len(inputString$)-1)
    endwhile

    return inputString$

End Function


Function StripTrailingSpaces(inputString$ As String) As String

    while true
        if right(inputString$, 1)<>" " then return inputString$
        inputString$ = left(inputString$, len(inputString$)-1)
    endwhile

    return inputString$

End Function


Function StripTrailingEOLs(inputString$ As String) As String

    while true
        if right(inputString$, 1)<>chr(13) and right(inputString$, 1)<>chr(10) then return inputString$
        inputString$ = left(inputString$, len(inputString$)-1)
    endwhile

    return inputString$

End Function


Function GetEol(fileContents$ As String) As Object
    eol$=chr(13)+chr(10)                '/r/n, Windows/DOS File
    if instr(1, fileContents$, eol$)=0 then
        eol$=chr(13)                    '/r, Mac
        if instr(1, fileContents$, eol$)=0 then
            eol$=chr(10)                '/n, Linux
            if instr(1, fileContents$, eol$)=0 then
'                print "No EOL found"
                eol$=chr(13)+chr(10)    '/r/n, Windows/DOS File
            endif
        endif
    endif

    eoln%=len(eol$)

    REM double check the file has not got an unexpected eol char
    if eoln%=1 then
        if eol$=chr(13) then
            if instr(1,fileContents$,chr(10))>0 then
                print "unsupported line termination sequence (unexpected /n)"
                stop
            endif
        else
            if instr(1,fileContents$,chr(13))>0 then
                print "unsupported line termination sequence (unexpected /r)"
                stop
            endif
        endif
    endif

    eolInfo = CreateObject("roAssociativeArray")
    eolInfo.eol = eol$
    eolInfo.eoln = eoln%

    return eolInfo

End Function


Function GetLine(parseInfo As Object) As String

    while true
        token$ = GetToken(parseInfo)
        if token$ = "" then return ""
        token$ = StripTrailingSpaces(token$)
        if token$ <> "" then return token$
    endwhile

End Function


Function GetToken(parseInfo As Object) As String

    line_end% = instr(parseInfo.position, parseInfo.fileContents$, parseInfo.eol)

    if line_end%=0 then 'eof reached with no eol
        remaining_string$=mid(parseInfo.fileContents$, parseInfo.position)
        if len(remaining_string$)=0 then
            return "END"
        endif
        
        ' check for a string beyond the last eol
        token$=remaining_string$
        parseInfo.position=parseInfo.position+len(remaining_string$)
    else
        token$=mid(parseInfo.fileContents$, parseInfo.position, line_end% - parseInfo.position)
        parseInfo.position=line_end%+parseInfo.eoln   ' point to the start of the next line
    endif

    return token$

End Function


Function DateParser(dateTimeSpec$ As String) As Object

    yearEnd = instr(1, dateTimeSpec$, "/") + 1
    monthEnd = instr(yearEnd, dateTimeSpec$, "/") + 1
    dayEnd = instr(monthEnd, dateTimeSpec$, "-") + 1
    dayOfWeekEnd = instr(dayEnd, dateTimeSpec$, "-") + 1
    hourEnd = instr(dayEnd, dateTimeSpec$, ":") + 1

    year$ = mid(dateTimeSpec$, 1, yearEnd - 1 - 1)
    if year$ = "*" then
        year% = -1
    else
        year% = val(year$)
    endif
'year%=val(mid(dateTimeSpec$,1,yearEnd-1-1))

    month$ = mid( dateTimeSpec$, yearEnd, monthEnd - yearEnd - 1)
    if month$ = "*" then
        month% = -1
    else
        month% = val(month$)
    endif
'month%=val(mid(dateTimeSpec$,yearEnd,monthEnd-yearEnd-1))

    day$ = mid(dateTimeSpec$, monthEnd, dayEnd - monthEnd - 1)
    if day$ = "*" then
        day% = -1
    else
        day% = val(day$)
    endif
'day%=val(mid(dateTimeSpec$,monthEnd,dayEnd-monthEnd-1))

    dayOfWeek$ = mid( dateTimeSpec$, dayEnd, dayOfWeekEnd - dayEnd - 1)
    dayOfWeek% = -1
    if dayOfWeek$ = "SUN" then dayOfWeek% = 0
    if dayOfWeek$ = "MON" then dayOfWeek% = 1
    if dayOfWeek$ = "TUE" then dayOfWeek% = 2
    if dayOfWeek$ = "WED" then dayOfWeek% = 3
    if dayOfWeek$ = "THU" then dayOfWeek% = 4
    if dayOfWeek$ = "FRI" then dayOfWeek% = 5
    if dayOfWeek$ = "SAT" then dayOfWeek% = 6

    hour$ = mid(dateTimeSpec$, dayOfWeekEnd, hourEnd - dayOfWeekEnd - 1)
    if hour$ = "*" then
        hour% = -1
    else
        hour% = val(hour$)
    endif
'hour%=val(mid(dateTimeSpec$,dayEnd,hourEnd-dayEnd-1))

    minute$ = mid(dateTimeSpec$, hourEnd)
    if minute$ = "*" then
        minute% = -1
    else
        minute% = val(minute$)
    endif
'minute%=val(mid(dateTimeSpec$,hourEnd))

    dateTimeAA = CreateObject("roAssociativeArray")
    dateTimeAA.year% = year%
    dateTimeAA.month% = month%
    dateTimeAA.day% = day%
    dateTimeAA.hour% = hour%
    dateTimeAA.minute% = minute%
    dateTimeAA.dayOfWeek% = dayOfWeek%

    return dateTimeAA
    
End Function


Function FindAutoscheduleTimer(autoscheduleEntries As Object, numScheduledEvents% As Integer, msg As Object) As Boolean

    if numScheduledEvents% = 0 then return false
    
    for i=0 to numScheduledEvents% - 1
	    if msg.GetSourceIdentity() = autoscheduleEntries[i].scheduledTimer.GetIdentity() then
            'if debug then print "timer ";i;" encountered, associated with file ";scheduledFiles(i)
            return true
        endif
    next

    return false
    
End Function


Sub StopAutoscheduleTimers(autoscheduleEntries As Object, numScheduledEvents% As Integer)

    for i=0 to numScheduledEvents% - 1
        autoscheduleEntries[i].scheduledTimer.Stop()
    next

    return
    
End Sub


Sub SetSystemInfo(sysInfo As Object)

    m.autorunVersion$ = sysInfo.autorunVersion$
    m.firmwareVersion$ = sysInfo.deviceFWVersion$
    m.deviceUniqueID$ = sysInfo.deviceUniqueID$
    m.deviceModel$ = sysInfo.deviceModel$
    m.videoWidth = sysInfo.videoWidth
    m.videoHeight = sysInfo.videoHeight

    return

End Sub

'
' ******************************************************************
' ******************************************************************
' autoplay index.html
' ******************************************************************
' ******************************************************************
'
Function RunHTML(htmlFile As String, debugOn As Boolean, loggingOn As Boolean, msgPort As Object) As String

    if loggingOn then print "RunHTML: "; htmlFile

    ' html (particularly video hwz=true) expects zone support to be on
    EnableZoneSupport(true)

    ' since the user has not set videoMode, set it to auto (unless running on an HD2000)
    SetAutoVideoMode(debugOn)

    gpioPort = CreateObject("roGpioControlPort")
    gpioPort.SetPort(msgPort)

    videoMode = CreateObject("roVideoMode")
    rect=CreateObject("roRectangle", 0, 0, videoMode.GetResX(), videoMode.GetResY())
    hw=CreateObject("roHtmlWidget", rect)

    ' add any ".ttf" files that are in the root folder
    fonts = MatchFiles("/", "*.ttf")
    for each font in fonts
        if debugOn then print "add font: "; font
        hw.AddFont(font)
    next

    ' allow all our custom objects to be created from any location
    hw.AllowJavaScriptUrls({ all: "*" })

    ' show the widget
    hw.Show()

    ' setup the url finally, don't forget 'file' prefix
    hw.SetURL("file:///" + htmlFile)

    while true
        msg = wait(0, msgPort)

        if debugOn then print "msg received - type="; type(msg)

        if type(msg) = "roGpioButton" then
            if msg.GetInt() = 12 then stop
        endif

    end while

    ' we shouldn't get this far but return something anyway

    return "stop"

End Function


Function NewSetupServer() As Object

    msgPort = CreateObject("roMessagePort")

    gpioPort = CreateObject("roGpioControlPort")
    gpioPort.SetPort(msgPort)

    localServer = CreateObject("roHttpServer", { port: 8080 })
    localServer.SetPort(msgPort)

	runSetupAA =				{ HandleEvent: runSetup, msgPort: msgPort }
	localServer.AddGetFromEvent({ url_path: "/runSetup", user_data: runSetupAA })

    bsnSignInAA = { HandleEvent: bsnSignIn, msgPort: msgPort }
    localServer.AddGetFromEvent({ url_path: "/bsnSignIn", user_data: bsnSignInAA })

	serverDirectory$ = "webSite"
	listOfServerFiles = []
	ListFiles(serverDirectory$, listOfServerFiles)
	AddHandlers(localServer, serverDirectory$, listOfServerFiles)

    while true
        msg = wait(0, msgPort)

        print "msg received - type="; type(msg)

        if type(msg) = "roHttpEvent" then

            userdata = msg.GetUserData()
            if type(userdata) = "roAssociativeArray" and type(userdata.HandleEvent) = "roFunction" then
                userData.HandleEvent(userData, msg)
            endif

		endif

        if type(msg) = "roGpioButton" then
            if msg.GetInt() = 12 then stop
        endif

    end while

    return invalid

End Function


Sub ListFiles(path$ As String, listOfFiles As Object)

	listOfFileEntries = ListDir(path$)
	for each fileEntry in listOfFileEntries

		filePath$ = path$ + "/" + fileEntry
		dirPath$ = filePath$ + "/"

		dir = CreateObject("roReadFile", dirPath$)
		if type(dir) = "roReadFile" then
			ListFiles(filePath$, listOfFiles)
		else
			listOfFiles.push(filePath$)
		endif
	next

End Sub


Sub AddHandlers(localServer As Object, serverDirectory$ As String, listOfHandlers As Object)

	for each filePath in listOfHandlers

		ext = GetFileExtension(filePath)
		if ext <> invalid then

			contentType$ = GetMimeTypeByExtension(ext)

			url$ = Right(filePath, len(filePath) - len(serverDirectory$))

            localServer.AddGetFromFile({ url_path: url$, filename: filePath, content_type: contentType$ })

            if url$ = "/index.html" then
                localServer.AddGetFromFile({ url_path: "/", filename: filePath, content_type: contentType$ })
            endif

		endif

	next

End Sub


Function GetFileExtension(file as String) as Object
  s=file.tokenize(".")
  if s.Count()>1
    ext=s.pop()
    return ext
  end if
  return invalid
end Function


Function GetMimeTypeByExtension(ext as String) as String

  ' start with audio types '
  if ext="mp3"
    return "audio/mpeg"
  else if ext="ogg"
	return "audio/ogg"

  ' now image types '
  else if ext="gif"
    return "image/gif"
  else if ext="jpeg"
    return "image/jpeg"
  else if ext="jpg"
    return "image/jpeg"
  else if ext="png"
    return "image/png"
  else if ext="svg"
    return "image/svg+xml"

  ' now text types'
  else if ext="css"
    return "text/css"
  else if ext="js"
    return "application/JavaScript"
  else if ext="csv"
    return "text/csv"
  else if ext="html"
    return "text/html"
  else if ext="htm"
    return "text/html"
  else if ext="txt"
    return "text/plain"
  else if ext="xml"
    return "text/xml"

  ' now some video types'
  else if ext="mpeg"
    return "video/mpeg"
  else if ext="mp4"
    return "video/mp4"
  else if ext="ts"
    return "video/mpeg"
  else if ext="mov"
	return "video/quicktime"
  else if ext="mkv"
	return "video/x-matroska"
  end if
  return ""
end Function


Function GetSoapContentType() As String
	return "text/xml; charset="+ chr(34) + "utf-8" + chr(34)
End Function


Sub GetAllGroups()

' GetAllGroups
	soapTransfer = CreateObject( "roUrlTransfer" )
	soapTransfer.SetTimeout( 30000 )
	soapTransfer.SetPort( userData.msgPort )
	soapTransfer.SetUrl( "http://api.brightsignnetwork.com/BrightAuthor/Service/v201312/BNMServices.asmx" )

	if not soapTransfer.addHeader("SOAPACTION", "http://tempuri.org/GetAllGroups") stop
	if not soapTransfer.addHeader( "Content-Type", GetSoapContentType() ) stop

'<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
'  <soap:Body>
'    <GetAllGroups xmlns="http://tempuri.org/">
'      <bnmCredentials>
'        <AccountName>ted</AccountName>
'        <UserName>ted@roku.com</UserName>
'        <Password>870FA8EE962D90AF50C7EAED792B075A</Password>
'      </bnmCredentials>
'    </GetAllGroups>
'  </soap:Body>
'</soap:Envelope>
    getAllGroupsXML = ""
' it appears as though this is not necessary
'    getAllGroupsXML = getAllGroupsXML + "<?xml version=" + chr(34) + "1.0" + chr(34) + " encoding=" + chr(34) + "utf-8" + chr(34) + "?>"
    getAllGroupsXML = getAllGroupsXML + "<soap:Envelope xmlns:soap=" + chr(34) + "http://schemas.xmlsoap.org/soap/envelope/" + chr(34) + " xmlns:xsi=" + chr(34) + "http://www.w3.org/2001/XMLSchema-instance" + chr(34) + " xmlns:xsd=" + chr(34) + "http://www.w3.org/2001/XMLSchema" + chr(34) + ">"
    getAllGroupsXML = getAllGroupsXML + "<soap:Body>"
    getAllGroupsXML = getAllGroupsXML + "<GetAllGroups xmlns=" + chr(34) + "http://tempuri.org/" + chr(34) + ">"
    getAllGroupsXML = getAllGroupsXML + "<bnmCredentials>"
    getAllGroupsXML = getAllGroupsXML + "<AccountName>ted</AccountName>"
    getAllGroupsXML = getAllGroupsXML + "<UserName>ted" + chr(64) + "roku.com</UserName>"
    getAllGroupsXML = getAllGroupsXML + "<Password>870FA8EE962D90AF50C7EAED792B075A</Password>"
    getAllGroupsXML = getAllGroupsXML + "</bnmCredentials>"
    getAllGroupsXML = getAllGroupsXML + "</GetAllGroups>"
    getAllGroupsXML = getAllGroupsXML + "</soap:Body>"
    getAllGroupsXML = getAllGroupsXML + "</soap:Envelope>"

	aa = {}
	aa.method = "POST"
	aa.request_body_string = getAllGroupsXML
	aa.response_body_string = true

'	if not soapTransfer.AsyncMethod( aa ) then
stop
	rv = soapTransfer.SyncMethod( aa )
stop
'		rv = soapTransfer.GetFailureReason()
'		print "###  GetAccount AsyncMethod failure - reason: " + rv
'		retryCheckBoxActivationTimer = stateMachine.LaunchRetryTimer( stateMachine.retryInterval% )
'	endif

End Sub


Sub GetAccount(userData As Object, bsnCredentials As Object)

    account$ = bsnCredentials.account
    login$ = bsnCredentials.login
    password$ = bsnCredentials.password

' GetAccount

	soapTransfer = CreateObject( "roUrlTransfer" )
	soapTransfer.SetTimeout( 30000 )
	soapTransfer.SetPort( userData.msgPort )
	soapTransfer.SetUrl( "http://api.brightsignnetwork.com/BrightAuthor/Service/v201312/BNMServices.asmx" )

	if not soapTransfer.addHeader("SOAPACTION", "http://tempuri.org/GetAccount") stop
	if not soapTransfer.addHeader( "Content-Type", GetSoapContentType() ) stop

    getAccountXML = ""
' it appears as though this is not necessary
'    getAccountXML = getAccountXML + "<?xml version=" + chr(34) + "1.0" + chr(34) + " encoding=" + chr(34) + "utf-8" + chr(34) + "?>"
    getAccountXML = getAccountXML + "<soap:Envelope xmlns:soap=" + chr(34) + "http://schemas.xmlsoap.org/soap/envelope/" + chr(34) + " xmlns:xsi=" + chr(34) + "http://www.w3.org/2001/XMLSchema-instance" + chr(34) + " xmlns:xsd=" + chr(34) + "http://www.w3.org/2001/XMLSchema" + chr(34) + ">"
    getAccountXML = getAccountXML + "<soap:Body>"
    getAccountXML = getAccountXML + "<GetAccount xmlns=" + chr(34) + "http://tempuri.org/" + chr(34) + ">"
    getAccountXML = getAccountXML + "<bnmCredentials>"
    getAccountXML = getAccountXML + "<AccountName>" + account$ + "</AccountName>"
    getAccountXML = getAccountXML + "<UserName>" + login$ + "</UserName>"
    getAccountXML = getAccountXML + "<Password>" + password$ + "</Password>"
    getAccountXML = getAccountXML + "</bnmCredentials>"
    getAccountXML = getAccountXML + "</GetAccount>"
    getAccountXML = getAccountXML + "</soap:Body>"
    getAccountXML = getAccountXML + "</soap:Envelope>"

	aa = {}
	aa.method = "POST"
	aa.request_body_string = getAccountXML
	aa.response_body_string = true

'	if not soapTransfer.AsyncMethod( aa ) then
stop
	rv = soapTransfer.SyncMethod( aa )
stop
'		rv = soapTransfer.GetFailureReason()
'		print "###  GetAccount AsyncMethod failure - reason: " + rv
'		retryCheckBoxActivationTimer = stateMachine.LaunchRetryTimer( stateMachine.retryInterval% )
'	endif

return

End Sub


Sub runSetup(userData as Object, e as Object)

    setupParams = e.GetRequestParams()

    e.AddResponseHeader("Content-type", "text/plain")
    e.AddResponseHeader("Access-Control-Allow-Origin", "*")
    e.SetResponseBodyString("ok")
    e.SendResponse(200)

    ExecuteSetup(setupParams)

End Sub


Sub bsnSignIn(userData as Object, e as Object)

    bsnCredentials = e.GetRequestParams()

    GetAccount(userData, bsnCredentials)

End Sub

