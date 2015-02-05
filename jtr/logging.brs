REM *******************************************************
REM *******************************************************
REM ***************                    ********************
REM *************** LOGGING OBJECT     ********************
REM ***************                    ********************
REM *******************************************************
REM *******************************************************

REM
REM construct a new logging BrightScript object
REM
Function newLogging() As Object

    logging = CreateObject("roAssociativeArray")
    
    logging.msgPort = m.msgPort
    logging.systemTime = CreateObject("roSystemTime")
'    logging.diagnostics = m.diagnostics
    
'    logging.SetSystemInfo = SetSystemInfo

    logging.CreateLogFile = CreateLogFile
    logging.MoveExpiredCurrentLog = MoveExpiredCurrentLog
    logging.MoveCurrentLog = MoveCurrentLog
    logging.InitializeLogging = InitializeLogging
    logging.InitializeCutoverTimer = InitializeCutoverTimer
    logging.WritePlaybackLogEntry = WritePlaybackLogEntry
    logging.WriteEventLogEntry = WriteEventLogEntry
    logging.WriteDiagnosticLogEntry = WriteDiagnosticLogEntry
    logging.CutoverLogFile = CutoverLogFile
    logging.HandleTimerEvent = HandleLoggingTimerEvent
    logging.OpenOrCreateCurrentLog = OpenOrCreateCurrentLog
    logging.DeleteExpiredFiles = DeleteExpiredFiles
    logging.DeleteOlderFiles = DeleteOlderFiles
    logging.FlushLogFile = FlushLogFile
    logging.logFile = invalid
    
    logging.registrySection = CreateObject("roRegistrySection", "jtr")
    if type(logging.registrySection)<>"roRegistrySection" then print "Error: Unable to create roRegistrySection":stop

    logging.logDate$ = logging.registrySection.Read("ld")
    logging.logCounter$ = logging.registrySection.Read("lc")

    modelObject = CreateObject("roDeviceInfo")
    logging.deviceModel$ = modelObject.GetModel()
    logging.deviceUniqueID$ = modelObject.GetDeviceUniqueId()
    logging.firmwareVersion$ = modelObject.GetVersion()
    logging.scriptVersion$ = GetScriptVersion()

    return logging
    
End Function


Function CreateLogFile() As Object

    dtLocal = m.systemTime.GetLocalDateTime()
    year$ = Right(stri(dtLocal.GetYear()), 2)
    month$ = StripLeadingSpaces(stri(dtLocal.GetMonth()))
    if len(month$) = 1 then
        month$ = "0" + month$
    endif
    day$ = StripLeadingSpaces(stri(dtLocal.GetDay()))
    if len(day$) = 1 then
        day$ = "0" + day$
    endif
    dateString$ = year$ + month$ + day$
    
    logDate$ = m.logDate$
    logCounter$ = m.logCounter$
    
    if logDate$ = "" or logCounter$ = "" then
        logCounter$ = "000"
    else if logDate$ <> dateString$ then
        logCounter$ = "000"
    endif
    logDate$ = dateString$
    
    localFileName$ = "JTR" + "Log." + m.deviceUniqueID$ + "-" + dateString$ + logCounter$ + ".log"

	m.registrySection.Write("ld", logDate$)
	m.logDate$ = logDate$

    logCounter% = val(logCounter$)
    logCounter% = logCounter% + 1
    if logCounter% > 999 then
        logCounter% = 0
    endif
    logCounter$ = StripLeadingSpaces(stri(logCounter%))
    if len(logCounter$) = 1 then
        logCounter$ = "00" + logCounter$
    else if len(logCounter$) = 2 then
        logCounter$ = "0" + logCounter$
    endif
	m.registrySection.Write("lc", logCounter$)
	m.logCounter$ = logCounter$

    fileName$ = "currentLog/" + localFileName$
    logFile = CreateObject("roCreateFile", fileName$)
'    m.diagnostics.PrintDebug("Create new log file " + localFileName$)
    print "Create new log file " + localFileName$
    
    t$ = chr(9)
    
    ' version
    header$ = "JTRLogVersion"+t$+"2"
    logFile.SendLine(header$)
    
    ' serial number
    header$ = "SerialNumber"+t$+m.deviceUniqueID$
    logFile.SendLine(header$)
    
    ' timezone
    header$ = "Timezone"+t$+m.systemTime.GetTimeZone()
    logFile.SendLine(header$)

    ' timestamp of log creation
    header$ = "LogCreationTime"+t$+m.systemTime.GetLocalDateTime().GetString()
    logFile.SendLine(header$)
    
    ' ip address
    nc = CreateObject("roNetworkConfiguration", 0)
    if type(nc) = "roNetworkConfiguration" then
        currentConfig = nc.GetCurrentConfig()
        nc = invalid
        ipAddress$ = currentConfig.ip4_address
        header$ = "IPAddress"+t$+ipAddress$
        logFile.SendLine(header$)
    endif
    
    ' fw version
    header$ = "FWVersion"+t$+m.firmwareVersion$
    logFile.SendLine(header$)
    
    ' script version
    header$ = "ScriptVersion"+t$+m.scriptVersion$
    logFile.SendLine(header$)

    ' model
    header$ = "Model"+t$+m.deviceModel$
    logFile.SendLine(header$)

    logFile.AsyncFlush()
    
    return logFile
    
End Function


Sub MoveExpiredCurrentLog()

    dtLocal = m.systemTime.GetLocalDateTime()
    currentDate$ = StripLeadingSpaces(stri(dtLocal.GetDay()))
    if len(currentDate$) = 1 then
        currentDate$ = "0" + currentDate$
    endif

    listOfPendingLogFiles = MatchFiles("/currentLog", "*")
        
    for each file in listOfPendingLogFiles
    
        logFileDate$ = left(right(file, 9), 2)
    
        if logFileDate$ <> currentDate$ then
            sourceFilePath$ = "currentLog/" + file
            destinationFilePath$ = "logs/" + file
            CopyFile(sourceFilePath$, destinationFilePath$)
            DeleteFile(sourceFilePath$)
        endif
        
    next

End Sub


Sub MoveCurrentLog()

    listOfPendingLogFiles = MatchFiles("/currentLog", "*")
    for each file in listOfPendingLogFiles
        sourceFilePath$ = "currentLog/" + file
        destinationFilePath$ = "logs/" + file
        CopyFile(sourceFilePath$, destinationFilePath$)
        DeleteFile(sourceFilePath$)
    next
    
End Sub


Sub InitializeLogging()

	CreateDirectory("logs")
	CreateDirectory("currentLog")
	CreateDirectory("archivedLogs")
	CreateDirectory("failedLogs")
	     
    m.DeleteExpiredFiles()
    
    m.MoveExpiredCurrentLog()

    m.OpenOrCreateCurrentLog()
    
    m.InitializeCutoverTimer()
    
End Sub


Sub InitializeCutoverTimer()

	hour% = 0
	minute% = 0
    
    m.cutoverTimer = CreateObject("roTimer")
    m.cutoverTimer.SetPort(m.msgPort)
    m.cutoverTimer.SetDate(-1, -1, -1)
    m.cutoverTimer.SetTime(hour%, minute%, 0)
    m.cutoverTimer.Start()    
    
End Sub


Sub DeleteExpiredFiles()

    ' delete any files that are more than 10 days old
    
    dtExpired = m.systemTime.GetLocalDateTime()
    dtExpired.SubtractSeconds(60 * 60 * 24 * 10)
    
    ' look in the following folders
    '   logs
    '   failedLogs
    '   archivedLogs
    
    m.DeleteOlderFiles("logs", dtExpired)
    m.DeleteOlderFiles("failedLogs", dtExpired)
    m.DeleteOlderFiles("archivedLogs", dtExpired)
    
End Sub


Sub DeleteOlderFiles(folderName$ As String, dtExpired As Object)

    listOfLogFiles = MatchFiles("/" + folderName$, "*")
        
    for each file in listOfLogFiles
    
        year$ = "20" + left(right(file,13), 2)
        month$ = left(right(file,11), 2)
        day$ = left(right(file, 9), 2)
        dtFile = CreateObject("roDateTime")
        dtFile.SetYear(int(val(year$)))
        dtFile.SetMonth(int(val(month$)))
        dtFile.SetDay(int(val(day$)))
               
        if dtFile < dtExpired then
            fullFilePath$ = "/" + folderName$ + "/" + file
'            m.diagnostics.PrintDebug("Delete expired log file " + fullFilePath$)
            print"Delete expired log file " + fullFilePath$
            DeleteFile(fullFilePath$)
        endif
        
    next

End Sub


Sub FlushLogFile()

    if type(m.logFile) <> "roCreateFile" and type(m.logFile) <> "roAppendFile" then return

    m.logFile.Flush()

End Sub


Sub WritePlaybackLogEntry(zoneName$ As String, startTime$ As String, endTime$ As String, itemType$ As String, fileName$ As String)
    
    if type(m.logFile) <> "roCreateFile" and type(m.logFile) <> "roAppendFile" then return

    t$ = chr(9) 
    m.logFile.SendLine("L=p"+t$+"Z="+zoneName$+t$+"S="+startTime$+t$+"E="+endTime$+t$+"I="+itemType$+t$+"N="+fileName$)
    m.logFile.AsyncFlush()

End Sub


Sub WriteEventLogEntry(stateName$ As String, eventType$ As String, eventData$ As String, eventActedOn$ As String)

    if type(m.logFile) <> "roCreateFile" and type(m.logFile) <> "roAppendFile" then return

    timestamp$ = m.systemTime.GetLocalDateTime().GetString()

    t$ = chr(9) 
    m.logFile.SendLine("L=e"+t$+"S="+stateName$+t$+"T="+timestamp$+t$+"E="+eventType$+t$+"D="+eventData$+t$+"A="+eventActedOn$)
    m.logFile.AsyncFlush()

End Sub


Sub WriteDiagnosticLogEntry(eventId$ As String, eventData$ As String)

    if type(m.logFile) <> "roCreateFile" and type(m.logFile) <> "roAppendFile" then return

    timestamp$ = m.systemTime.GetLocalDateTime().GetString()
    
    t$ = chr(9) 
    m.logFile.SendLine("L=d"+t$+"T="+timestamp$+t$+"I="+eventId$+t$+"D="+eventData$)
    m.logFile.AsyncFlush()
    
End Sub


Sub HandleLoggingTimerEvent()

    m.CutoverLogFile(false)

    m.cutoverTimer.Start()

End Sub


Sub CutoverLogFile()

    if type(m.logFile) <> "roCreateFile" and type(m.logFile) <> "roAppendFile" then return

    m.logFile.Flush()
    m.MoveCurrentLog()
    m.logFile = m.CreateLogFile()
    
End Sub


Sub OpenOrCreateCurrentLog()

' if there is an existing log file for today, just append to it. otherwise, create a new one to use

    listOfPendingLogFiles = MatchFiles("/currentLog", "*")
    
    for each file in listOfPendingLogFiles
        fileName$ = "currentLog/" + file
        m.logFile = CreateObject("roAppendFile", fileName$)
        if type(m.logFile) = "roAppendFile" then
'            m.diagnostics.PrintDebug("Use existing log file " + file)
            print "Use existing log file " + file
            return
        endif
    next

    m.logFile = m.CreateLogFile()
    
End Sub
