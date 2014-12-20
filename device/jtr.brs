Library "db.brs"
Library "server.brs"

Sub Main()

	RunJtr()

End Sub


Sub RunJtr()

    msgPort = CreateObject("roMessagePort")

    JTR = newJTR(msgPort)

	JTR.InitializeServer()
	JTR.OpenDatabase()

	JTR.mediaStreamer = CreateObject("roMediaStreamer")
	' .SetPipeline("hdmi:,encoder:,file:///myfilename.ts")
	' .Start()

	JTR.videoPlayer = CreateObject("roVideoPlayer")
	JTR.videoPlayer.SetPort(msgPort)

    JTR.EventLoop()

stop

End Sub


Function newJTR(msgPort As Object) As Object

    JTR = {}
    JTR.msgPort = msgPort

	JTR.EventLoop = EventLoop

	JTR.InitializeServer		= InitializeServer
	JTR.AddHandlers				= AddHandlers
	
	JTR.OpenDatabase			= OpenDatabase
	JTR.CreateDBTable			= CreateDBTable
	JTR.GetDBVersion			= GetDBVersion
	JTR.SetDBVersion			= SetDBVersion
	JTR.ExecuteDBInsert			= ExecuteDBInsert
	JTR.ExecuteDBSelect			= ExecuteDBSelect
	JTR.GetDBVersionCallback	= GetDBVersionCallback

	JTR.StartRecord				= StartRecord
	JTR.StopRecord				= StopRecord

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


Sub EventLoop()

	SQLITE_COMPLETE = 100

print "entering event loop"

    while true
        
        msg = wait(2000, m.msgPort)

		print "msg received - type=" + type(msg)

		if type(msg) = "roHttpEvent" then
        
			userdata = msg.GetUserData()
			if type(userdata) = "roAssociativeArray" and type(userdata.HandleEvent) = "roFunction" then
				userData.HandleEvent(userData, msg)
			endif

		else if type(msg) = "roTimerEvent" then

			if type(m.recordingTimer) = "roTimer" and stri(m.recordingTimer.GetIdentity()) = stri(msg.GetSourceIdentity()) then
				m.StopRecord()
			endif

		endif

    end while

End Sub


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


Sub StopRecord()

print "StopRecord"

	ok = m.mediaStreamer.Stop()
	if not ok then stop

End Sub
