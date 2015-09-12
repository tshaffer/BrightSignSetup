Library "utils.brs"
Library "logging.brs"
Library "db.brs"
Library "server.brs"
Library "eventHandler.brs"
Library "recordingEngine.brs"
Library "displayEngine.brs"


REM Update whenever any of the scripts change
Function GetScriptVersion() As String
	return "0.0.1"
End Function   


Sub Main()
	RunJtr()
End Sub


Sub RunJtr()

    msgPort = CreateObject("roMessagePort")

	' for BigScreen TV
	videoMode = CreateObject("roVideoMode")
	videoMode.SetMode("1920x1080x60i")
	videoMode = invalid

	CreateDirectory("brightsign-dumps")
	CreateDirectory("content")
	CreateDirectory("/content/hls")

    JTR = newJTR(msgPort)

	JTR.logging.InitializeLogging()
'    JTR.logging.WriteDiagnosticLogEntry(diagnosticCodes.EVENT_STARTUP, Player.sysInfo.deviceFWVersion$ + chr(9) + Player.sysInfo.scriptVersion$)
    JTR.logging.WriteDiagnosticLogEntry("0", "5.2.5" + chr(9) + "0.0.1")

	EnableZoneSupport(true)

	JTR.eventHandler = newEventHandler(JTR)
	JTR.recordingEngine = newRecordingEngine(JTR)
	JTR.displayEngine = newDisplayEngine(JTR)

	JTR.gpio = CreateObject("roGpioControlPort")

	JTR.SetRecordLED(false)
	JTR.InitializeServer()
	JTR.OpenDatabase()

	' create and start a media server
	JTR.mediaServer = CreateObject("roMediaServer")
	ok = JTR.mediaServer.Start("http:port=8088:trace")

	JTR.eventHandler.AddEngine(JTR.recordingEngine)
	JTR.eventHandler.AddEngine(JTR.displayEngine)

	JTR.recordingEngine.Initialize()
	JTR.displayEngine.Initialize()

	JTR.currentState = {}
	JTR.currentState.state = "idle"

	JTR.eventHandler.EventLoop()

End Sub


Function newJTR(msgPort As Object) As Object

    JTR = {}
    JTR.msgPort = msgPort

	JTR.InitializeServer				= InitializeServer
	JTR.AddHandlers						= AddHandlers
	
	JTR.OpenDatabase					= OpenDatabase
	JTR.CreateDBTable					= CreateDBTable
	JTR.GetDBVersion					= GetDBVersion
	JTR.SetDBVersion					= SetDBVersion
	JTR.ExecuteDBInsert					= ExecuteDBInsert
	JTR.ExecuteDBSelect					= ExecuteDBSelect
	JTR.AddDBScheduledRecording			= AddDBScheduledRecording
	JTR.AddDBScheduledSeriesRecording	= AddDBScheduledSeriesRecording
	JTR.GetDBLastScheduledRecordingRowId= GetDBLastScheduledRecordingRowId
	JTR.GetDBLastScheduledRecordingId	= GetDBLastScheduledRecordingId
	JTR.GetDBLastScheduledSeriesRecordingId = GetDBLastScheduledSeriesRecordingId
	JTR.DeleteDBScheduledRecordingRow	= DeleteDBScheduledRecordingRow
	JTR.DeleteDBScheduledRecording		= DeleteDBScheduledRecording
	JTR.DeleteDBScheduledSeriesRecording= DeleteDBScheduledSeriesRecording
	JTR.GetDBScheduledRecordings		= GetDBScheduledRecordings
	JTR.GetDBScheduledSeriesRecordings	= GetDBScheduledSeriesRecordings
	JTR.AddDBRecording					= AddDBRecording
	JTR.DeleteDBRecording				= DeleteDBRecording
	JTR.GetDBLastSelectedShowId			= GetDBLastSelectedShowId
	JTR.SetDBLastSelectedShowId			= SetDBLastSelectedShowId
	JTR.GetDBRecording					= GetDBRecording
	JTR.GetDBRecordingByFileName		= GetDBRecordingByFileName
	JTR.GetDBRecordings					= GetDBRecordings
	JTR.GetDBFileToTranscode			= GetDBFileToTranscode
	JTR.UpdateDBTranscodeComplete		= UpdateDBTranscodeComplete
	JTR.UpdateDBLastViewedPosition		= UpdateDBLastViewedPosition
	JTR.UpdateHLSSegmentationComplete	= UpdateHLSSegmentationComplete
	JTR.GetDBLastTunedChannel			= GetDBLastTunedChannel
	JTR.SetDBLastTunedChannel			= SetDBLastTunedChannel
	JTR.InitializeDBLastTunedChannel	= InitializeDBLastTunedChannel
	JTR.GetDBSettings					= GetDBSettings
	JTR.SetDBSettings					= SetDBSettings
	JTR.InitializeDBSettings			= InitializeDBSettings
	JTR.AddDBStation					= AddDBStation
	JTR.PopulateStationsTable			= PopulateStationsTable
	JTR.GetDBStations					= GetDBStations
'	JTR.AddDBStationScheduleForSingleDay= AddDBStationScheduleForSingleDay
	JTR.GetDBStationSchedulesForSingleDay = GetDBStationSchedulesForSingleDay
	JTR.AddDBPrograms					= AddDBPrograms
	JTR.AddDBCastMembers				= AddDBCastMembers
	JTR.AddDBStationSchedulesForSingleDay = AddDBStationSchedulesForSingleDay
	JTR.UpdateDBStationSchedulesForSingleDay = UpdateDBStationSchedulesForSingleDay
	JTR.UpdateDBStationScheduleForSingleDay = UpdateDBStationScheduleForSingleDay
	JTR.AddDBProgramsForStation			= AddDBProgramsForStation
	JTR.DeleteDBProgramsForStation		= DeleteDBProgramsForStation
	JTR.AddDBProgramsForStations		= AddDBProgramsForStations
	JTR.GetDBPrograms					= GetDBPrograms
	JTR.UpdateDBPrograms				= UpdateDBPrograms
	JTR.UpdateDBProgram					= UpdateDBProgram
	JTR.DeleteDBProgramCasts			= DeleteDBProgramCasts
	JTR.DeleteDBProgramCast				= DeleteDBProgramCast
	JTR.GetDBEpgData					= GetDBEpgData
	JTR.GetDBEpgMatchingPrograms		= GetDBEpgMatchingPrograms
	JTR.GetDBEpgMatchingProgramsOnDate	= GetDBEpgMatchingProgramsOnDate
	JTR.GetDBLastChannelGuideSelection	= GetDBLastChannelGuideSelection
	JTR.UpdateDBLastChannelGuideSelection	= UpdateDBLastChannelGuideSelection
	
	JTR.AddDBItems						= AddDBItems
	JTR.GenerateSQLInsert				= GenerateSQLInsert

	JTR.deleteScheduledRecordingRow		= deleteScheduledRecordingRow

	JTR.tsDeletable						= tsDeletable

	JTR.GetCurrentState					= GetCurrentState
	JTR.SetCurrentState					= SetCurrentState

	JTR.SetRecordLED					= SetRecordLED

    JTR.newLogging						= newLogging
    JTR.logging = JTR.newLogging()
		
	return JTR

End Function


Sub SetRecordLED(ledOn As Boolean)

	m.gpio.SetOutputState(9, ledOn)

End Sub


Function GetCurrentState()

	return m.currentState

End Function


Sub SetCurrentState(newState As Object)

	m.currentState = newState

End Sub


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


