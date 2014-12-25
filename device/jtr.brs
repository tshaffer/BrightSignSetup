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

	JTR.eventHandler = newEventHandler(JTR.msgPort)
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

'	r = CreateObject("roRectangle", 0, 0, 1920, 1080)
'	JTR.imagePlayer = CreateObject("roImageWidget", r)

	' experiment with webkit renderer
'	JTR.htmlWidget = createobject("roHtmlWidget", r)
'	JTR.htmlWidget.Show()
'	JTR.htmlWidget.SetUrl("http://www.brightsign.biz")
'	JTR.htmlWidget.SetUrl("file:///webkit/index.html")

    ' JTR.EventLoop()
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
	
	JTR.OpenDatabase			= OpenDatabase
	JTR.CreateDBTable			= CreateDBTable
	JTR.GetDBVersion			= GetDBVersion
	JTR.SetDBVersion			= SetDBVersion
	JTR.ExecuteDBInsert			= ExecuteDBInsert
	JTR.ExecuteDBSelect			= ExecuteDBSelect
	JTR.GetDBVersionCallback	= GetDBVersionCallback
	JTR.AddDBRecording			= AddDBRecording

	JTR.StartRecord				= StartRecord
		
	return JTR

End Function


Sub ListFiles(path$ As String, listOfFiles As Object)

	listOfFileEntries = ListDir(path$)
	for each fileEntry in listOfFileEntries
		childPath$ = path$ + "/" + fileEntry

		' this section of code is meant to determine if childPath$ is a directory or a file.
		' if there's a direct way to determine if this, it would eliminate this call to ListDir
		listOfChildEntries = ListDir(childPath$)
		if listOfChildEntries.Count() = 0 then
			listOfFiles.push(childPath$)
		else
			ListFiles(childPath$, listOfFiles)
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
