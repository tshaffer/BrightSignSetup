Library "utils.brs"
Library "logging.brs"
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

	JTR.remote = CreateObject("roIRRemote")
	if type(JTR.remote) <> "roIRRemote" stop
	JTR.remote.SetPort(msgPort)

'	aa = {}
''	aa.source = "Iguana"
''	aa.encodings = ["NEC","RC5"]
'	aa.source = "IR-in"
'	aa.encodings = ["NEC"]
'	JTR.irReceiver = CreateObject("roIRReceiver", aa)
'	if type(JTR.irReceiver) <> "roIRReceiver" stop
'	JTR.irReceiver.SetPort(msgPort)

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

	JTR.StartRecord					= StartRecord

    JTR.newLogging					= newLogging
    JTR.logging = JTR.newLogging()
		
	return JTR

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


' old test code - remove when appropriate
Sub StartRecord(fileName$ As String, duration% As Integer)

print "StartRecord: fileName="; fileName$; ", duration=";duration%

	if type(m.mediaStreamer) = "roMediaStreamer" then

'		ok = m.mediaStreamer.SetPipeline("hdmi:,encoder:,file:///myfilename.ts")
		ok = m.mediaStreamer.SetPipeline("hdmi:,encoder:,file:///" + fileName$)
		if not ok then stop

		ok = m.mediaStreamer.Start()
		if not ok then stop

        m.recordingTimer = CreateObject("roTimer")
        m.recordingTimer.SetPort(m.msgPort)
		m.recordingTimer.SetElapsed(duration%, 0)
        m.recordingTimer.Start()

	else
		stop
	endif

End Sub


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