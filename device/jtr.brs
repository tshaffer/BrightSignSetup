Library "utils.brs"
Library "db.brs"
Library "server.brs"
Library "hsm.brs"
Library "eventHandler.brs"
Library "recordingEngine.brs"
Library "playbackEngine.brs"

Sub Main()

	RunJtr()

End Sub


Sub RunJtr()

	CreateDirectory("brightsign-dumps")
	CreateDirectory("content")

    msgPort = CreateObject("roMessagePort")

    JTR = newJTR(msgPort)

	EnableZoneSupport(true)

	JTR.eventHandler = newEventHandler(JTR)
	JTR.recordingEngine = newRecordingEngine(JTR)
	JTR.playbackEngine = newPlaybackEngine(JTR)

	JTR.InitializeServer()
	JTR.OpenDatabase()

	JTR.remote = CreateObject("roIRRemote")
	if type(JTR.remote) <> "roIRRemote" stop
	JTR.remote.SetPort(msgPort)

'	aa = {}
'	aa.source = "Iguana"
'	aa.encodings = "NEC"
'	JTR.irReceiver = CreateObject("roIRReceiver", aa)
'	if type(JTR.irReceiver) <> "roIRReceiver" stop
'	JTR.irReceiver.SetPort(msgPort)

	JTR.recordingEngine.Initialize()
	JTR.playbackEngine.Initialize()

	JTR.eventHandler.AddHSM(JTR.recordingEngine)
	JTR.eventHandler.AddHSM(JTR.playbackEngine)

	JTR.eventHandler.EventLoop()

End Sub


Function newJTR(msgPort As Object) As Object

    JTR = {}
    JTR.msgPort = msgPort

	JTR.InitializeServer		= InitializeServer
	JTR.AddHandlers				= AddHandlers
	
	JTR.LaunchWebkit			= LaunchWebkit

	JTR.OpenDatabase			= OpenDatabase
	JTR.CreateDBTable			= CreateDBTable
	JTR.GetDBVersion			= GetDBVersion
	JTR.SetDBVersion			= SetDBVersion
	JTR.ExecuteDBInsert			= ExecuteDBInsert
	JTR.ExecuteDBSelect			= ExecuteDBSelect
	JTR.GetDBVersionCallback	= GetDBVersionCallback
	JTR.AddDBRecording			= AddDBRecording
	JTR.GetDBRecording			= GetDBRecording
	JTR.GetDBRecordings			= GetDBRecordings

	JTR.StartRecord				= StartRecord
		
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


Sub LaunchWebkit()

	print "LaunchWebkit invoked"

	r = CreateObject("roRectangle", 0, 0, 1920, 1080)

	m.imagePlayer = CreateObject("roImageWidget", r)
	m.imagePlayer.Show()

	' experiment with webkit renderer
	videoMode = CreateObject("roVideoMode")
	resX = videoMode.GetResX()
	resY = videoMode.GetResY()
	videoMode = invalid
	m.touchScreen = CreateObject("roTouchScreen")
	m.touchScreen.SetPort(m.msgPort)
	m.touchScreen.EnableCursor(true)
	m.touchScreen.SetCursorBitmap("cursor.bmp", 16, 16)
	m.touchScreen.SetCursorPosition(resX / 2, resY / 2)

	m.htmlWidget = CreateObject("roHtmlWidget", r)
	m.htmlWidget.SetPort(m.msgPort)
	m.htmlWidget.Show()
	m.htmlWidget.EnableMouseEvents(true)
	m.htmlWidget.SetHWZDefault("on")
	m.htmlWidget.EnableJavascript(true)
	m.htmlWidget.AllowJavaScriptUrls({ all: "*" })
	m.htmlWidget.StartInspectorServer(2999)

	m.htmlWidget.SetUrl("file:///webkit/index.html")

End Sub

