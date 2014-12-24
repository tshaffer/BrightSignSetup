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

	JTR.scheduledRecordings = {}
	JTR.recordingInProgressTimerId$ = ""

	JTR.InitializeServer()
	JTR.OpenDatabase()

	JTR.mediaStreamer = CreateObject("roMediaStreamer")

	JTR.remote = CreateObject("roIRRemote")
	JTR.remote.SetPort(msgPort)

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

	JTR.EventLoop				= EventLoop

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

	JTR.AddManualRecord			= AddManualRecord
	JTR.StartManualRecord		= StartManualRecord
	JTR.EndManualRecord			= EndManualRecord
	JTR.StartRecord				= StartRecord
	JTR.StopRecord				= StopRecord

	JTR.PlayVideo				= PlayVideo
	JTR.PauseVideo				= PauseVideo
	JTR.QuickSkipVideo			= QuickSkipVideo
	JTR.InstantReplayVideo		= InstantReplayVideo
	JTR.FastForwardVideo		= FastForwardVideo
	JTR.RewindVideo				= RewindVideo
		
	JTR.Tune					= Tune

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
	VIDEO_TIME_CODE = 12

print "entering event loop"

    while true
        
        msg = wait(0, m.msgPort)

		print "msg received - type=" + type(msg)

		if type(msg) = "roHttpEvent" then
        
			userdata = msg.GetUserData()
			if type(userdata) = "roAssociativeArray" and type(userdata.HandleEvent) = "roFunction" then
				userData.HandleEvent(userData, msg)
			endif

		else if type(msg) = "roTimerEvent" then

			eventIdentity$ = stri(msg.GetSourceIdentity())

			' video progress timer
			if type(m.videoProgressTimer) = "roTimer" and stri(m.videoProgressTimer.GetIdentity()) = eventIdentity$ then
				m.currentVideoPosition% = m.currentVideoPosition% + 1
				print "m.currentVideoPosition%=";m.currentVideoPosition%
				m.videoProgressTimer.Start()
			endif

			' check for a scheduled recording
			for each scheduledRecordingTimerIdentity in m.scheduledRecordings
				if eventIdentity$ = scheduledRecordingTimerIdentity then
					scheduledRecording = m.scheduledRecordings[scheduledRecordingTimerIdentity]
					m.StartManualRecord(scheduledRecording)
					exit for
				endif
			next

			if type(m.endRecordingTimer) = "roTimer" and stri(m.endRecordingTimer.GetIdentity()) = eventIdentity$ then
				for each scheduledRecordingTimerIdentity in m.scheduledRecordings
					if scheduledRecordingTimerIdentity = m.recordingInProgressTimerId$ then
						scheduledRecording = m.scheduledRecordings[scheduledRecordingTimerIdentity]
						m.EndManualRecord(scheduledRecordingTimerIdentity, scheduledRecording)
						exit for
					endif
				next
			endif

			if type(m.recordingTimer) = "roTimer" and stri(m.recordingTimer.GetIdentity()) = eventIdentity$ then
				m.StopRecord()
			endif

		else if type(msg) = "roIRRemotePress" then
	
			remoteEvent% = msg.GetInt()
			remoteEvent$ = ConvertToRemoteCommand(remoteEvent%)
			print "remoteEvent=";remoteEvent$

			' hardcode for now
'			fileName$ = "20141221T093400.ts"
			fileName$ = "20141221T093400.mp4"

			if remoteEvent$ = "PLAY" then
				m.PlayVideo(fileName$)
			else if remoteEvent$ = "PAUSE" then
				m.PauseVideo()
			else if remoteEvent$ = "REPEAT" then
				m.QuickSkipVideo()
			else if remoteEvent$ = "ADD" then
				m.InstantReplayVideo()
			else if remoteEvent$ = "FF" then
				m.FastForwardVideo()
			else if remoteEvent$ = "RW" then
				m.RewindVideo()
			endif

		endif

    end while

End Sub


Sub AddManualRecord(title$, channel$ As String, dateTime As Object, duration% As Integer)

	print "Add scheduledRecording: " + title$

	m.scheduledRecordingTimer = CreateObject("roTimer")
	m.scheduledRecordingTimer.SetPort(m.msgPort)
	m.scheduledRecordingTimer.SetDateTime(dateTime)

	scheduledRecording = {}
	scheduledRecording.timerId$ = stri(m.scheduledRecordingTimer.GetIdentity())
	scheduledRecording.title$ = title$
	scheduledRecording.channel$ = channel$
	scheduledRecording.dateTime = dateTime
	scheduledRecording.duration% = duration%

	m.scheduledRecordingTimer.Start()

	m.scheduledRecordings.AddReplace(scheduledRecording.timerId$, scheduledRecording)

End Sub


Sub StartManualRecord(scheduledRecording As Object)

	print "StartManualRecord " + scheduledRecording.title$

	' tune channel
	m.Tune(scheduledRecording.channel$)

	endDateTime = scheduledRecording.dateTime
	endDateTime.AddSeconds(scheduledRecording.duration% * 60)

	print "Manual record will end at " + endDateTime.GetString()

	m.endRecordingTimer = CreateObject("roTimer")
	m.endRecordingTimer.SetPort(m.msgPort)
	m.endRecordingTimer.SetDateTime(endDateTime)
	m.endRecordingTimer.Start()

	m.recordingInProgressTimerId$ = scheduledRecording.timerId$

	' start recording
	scheduledRecording.path$ = Left(scheduledRecording.dateTime.ToIsoString(), 15) + ".ts"

	if type(m.mediaStreamer) = "roMediaStreamer" then

'		ok = m.mediaStreamer.SetPipeline("hdmi:,encoder:,file:///myfilename.ts")
		ok = m.mediaStreamer.SetPipeline("hdmi:,encoder:,file:///" + scheduledRecording.path$)
		if not ok then stop

		ok = m.mediaStreamer.Start()
		if not ok then stop

	endif

End Sub


Sub Tune(channelName$)

	url$ = "http://192.168.2.23:8080/Tune?channelName=" + channelName$

	print "Tune using URL=";url$

	tunerUrl = CreateObject("roUrlTransfer")
	tunerUrl.SetUrl(url$)
	tunerUrl.SetTimeout(10000)

	' no need to set msgPort - no response required
	response$ = tunerUrl.GetToString()

	print "Tune response = ";response$

End Sub


Sub EndManualRecord(scheduledRecordingTimerIdentity As Object, scheduledRecording As Object)

	print "EndManualRecord " + scheduledRecording.title$

	m.StopRecord()

	' Add or upate record in database
	m.AddDBRecording(scheduledRecording)

	' Remove from list of pending records
	ok = m.scheduledRecordings.Delete(scheduledRecordingTimerIdentity)
	if not ok then stop

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


Sub PlayVideo(path$)

	' only do this when first launching a video
	m.currentVideoPosition% = 0
	print "m.currentVideoPosition%=";m.currentVideoPosition%

	if m.videoPaused then
		ok = m.videoPlayer.Resume()
	else
		ok = m.videoPlayer.PlayFile(path$)
	endif

	m.videoPaused = false

	m.videoProgressTimer = CreateObject("roTimer")
	m.videoProgressTimer.SetPort(m.msgPort)
	m.videoProgressTimer.SetElapsed(1, 0)
	m.videoProgressTimer.Start()

End Sub


Sub PauseVideo()

	if m.videoPaused then
		ok = m.videoPlayer.Resume()
	else
		ok = m.videoPlayer.Pause()
	endif

	m.videoPaused = not m.videoPaused

End Sub


'Sub QuickSkipVideo()

'	m.currentVideoPosition% = m.currentVideoPosition% + 10
'	print "seekTarget=" + stri(m.currentVideoPosition% * 1000)
'	print "m.currentVideoPosition%=";m.currentVideoPosition%

'	ok = m.videoPlayer.Seek(m.currentVideoPosition% * 1000)
'	print "Seek result=";ok

'End Sub


'Sub InstantReplayVideo()

'	m.currentVideoPosition% = m.currentVideoPosition% - 7
'	if m.currentVideoPosition% < 0 then
'		m.currentVideoPosition% = 0
'	endif

'	print "seekTarget=" + stri(m.currentVideoPosition% * 1000)
'	print "m.currentVideoPosition%=";m.currentVideoPosition%

'	ok = m.videoPlayer.Seek(m.currentVideoPosition% * 1000)
'	print "Seek result=";ok

'End Sub


Sub FastForwardVideo()
End Sub

Sub RewindVideo()
End Sub


