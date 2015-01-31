Library "utils.brs"
Library "logging.brs"
Library "remote.brs"
Library "db.brs"
Library "server.brs"
Library "hsm.brs"
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

	' for BigScreen TV
	videoMode = CreateObject("roVideoMode")
	videoMode.SetMode("1920x1080x60i")
	videoMode = invalid

	CreateDirectory("brightsign-dumps")
	CreateDirectory("content")

    msgPort = CreateObject("roMessagePort")

    JTR = newJTR(msgPort)

	JTR.logging.InitializeLogging()
'    JTR.logging.WriteDiagnosticLogEntry(diagnosticCodes.EVENT_STARTUP, Player.sysInfo.deviceFWVersion$ + chr(9) + Player.sysInfo.scriptVersion$)
    JTR.logging.WriteDiagnosticLogEntry("0", "5.2.5" + chr(9) + "0.0.1")

	EnableZoneSupport(true)

	JTR.eventHandler = newEventHandler(JTR)
	JTR.recordingEngine = newRecordingEngine(JTR)
	JTR.displayEngine = newDisplayEngine(JTR)

	JTR.InitializeServer()
	JTR.OpenDatabase()

	JTR.gpio = CreateObject("roGpioControlPort")

	useIRRemote = false

	if useIRRemote then
		JTR.remote = CreateObject("roIRRemote")
		if type(JTR.remote) = "roIRRemote" then
			JTR.remote.SetPort(msgPort)
		else
'			TODO -if no IR Receiver, log it
		endif
	else
		aa = {}
'		aa.source = "Iguana"
'		aa.encodings = ["NEC","RC5"]
		aa.source = "IR-in"
		aa.encodings = ["NEC"]
		JTR.irReceiver = CreateObject("roIRReceiver", aa)
		if type(JTR.irReceiver) = "roIRReceiver" then
			JTR.irReceiver.SetPort(msgPort)
		else
'			TODO - if no IR Receiver, log it
		endif
	endif

	JTR.recordingEngine.Initialize()
	JTR.displayEngine.Initialize()

	JTR.eventHandler.AddHSM(JTR.recordingEngine)
	JTR.eventHandler.AddHSM(JTR.displayEngine)

	JTR.eventHandler.EventLoop()

End Sub


Function newJTR(msgPort As Object) As Object

    JTR = {}
    JTR.msgPort = msgPort

	JTR.InitializeServer			= InitializeServer
	JTR.AddHandlers					= AddHandlers
	
	JTR.OpenDatabase				= OpenDatabase
	JTR.CreateDBTable				= CreateDBTable
	JTR.GetDBVersion				= GetDBVersion
	JTR.SetDBVersion				= SetDBVersion
	JTR.ExecuteDBInsert				= ExecuteDBInsert
	JTR.ExecuteDBSelect				= ExecuteDBSelect
	JTR.AddDBRecording				= AddDBRecording
	JTR.DeleteDBRecording			= DeleteDBRecording
	JTR.GetDBRecording				= GetDBRecording
	JTR.GetDBRecordings				= GetDBRecordings
	JTR.GetDBFileToTranscode		= GetDBFileToTranscode
	JTR.UpdateDBTranscodeComplete	= UpdateDBTranscodeComplete
	JTR.UpdateDBLastViewedPosition	= UpdateDBLastViewedPosition

	JTR.SetRecordLED				= SetRecordLED

    JTR.newLogging					= newLogging
    JTR.logging = JTR.newLogging()
		
	return JTR

End Function


Sub SetRecordLED(ledOn As Boolean)

	m.gpio.SetOutputState(9, ledOn)

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
