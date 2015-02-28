Function newDisplayEngine(jtr As Object) As Object

	DisplayEngine = {}

' setup methods
	DisplayEngine.Initialize					= de_Initialize
	DisplayEngine.InitializeWebkit				= de_InitializeWebkit

	DisplayEngine.jtr = jtr
	DisplayEngine.msgPort = jtr.msgPort

' setup methods
    DisplayEngine.EventHandler					= de_EventHandler
	DisplayEngine.HandleHttpEvent				= de_HandleHttpEvent
	DisplayEngine.StartPlayback					= de_StartPlayback
	DisplayEngine.PausePlayback					= de_PausePlayback
	DisplayEngine.ResumePlayFromPaused			= de_ResumePlayFromPaused
	DisplayEngine.QuickSkipVideo				= de_QuickSkipVideo
	DisplayEngine.InstantReplayVideo			= de_InstantReplayVideo
	DisplayEngine.DeleteRecording				= de_DeleteRecording
	DisplayEngine.SeekToCurrentVideoPosition	= de_SeekToCurrentVideoPosition
	DisplayEngine.InitiateFastForward			= de_InitiateFastForward
	DisplayEngine.NextFastForward				= de_NextFastForward
	DisplayEngine.InitiateRewind				= de_InitiateRewind
	DisplayEngine.NextRewind					= de_NextRewind
	DisplayEngine.ForwardToTick					= de_ForwardToTick
	DisplayEngine.BackToTick					= de_BackToTick
	DisplayEngine.JumpToTick					= de_JumpToTick
	DisplayEngine.StartVideoPlaybackTimer		= de_StartVideoPlaybackTimer
	DisplayEngine.StopVideoPlaybackTimer		= de_StopVideoPlaybackTimer
	DisplayEngine.UpdateProgressBar				= de_UpdateProgressBar
	DisplayEngine.UpdateLastViewedPosition		= de_UpdateLastViewedPosition

	return DisplayEngine

End Function


Sub de_Initialize()

	m.videoPlayer = CreateObject("roVideoPlayer")
	m.videoPlayer.SetPort(m.msgPort)
    m.videoPlayer.SetLoopMode(0)

	m.currentVideoPosition% = 0
	m.selectedRecording = invalid
	m.priorSelectedRecording = invalid

	m.playbackSpeeds = CreateObject("roArray", 7, true)
	m.playbackSpeeds.push(-16.0)
	m.playbackSpeeds.push(-8.0)
	m.playbackSpeeds.push(-4.0)
	m.playbackSpeeds.push(-2.0)
	m.playbackSpeeds.push(-1.0)
	m.playbackSpeeds.push(1.0)
	m.playbackSpeeds.push(2.0)
	m.playbackSpeeds.push(4.0)
	m.playbackSpeeds.push(8.0)
	m.playbackSpeeds.push(16.0)

	m.normalPlaybackSpeedIndex% = 5
	m.playbackSpeedIndex% = m.normalPlaybackSpeedIndex%
	
	m.InitializeWebkit()

End Sub


Sub de_InitializeWebkit()

	print "InitializeWebkit invoked"

	' don't want cursor for now
    m.t=createobject("roTouchScreen")
    m.t.enablecursor(false)

	r = CreateObject("roRectangle", 0, 0, 1920, 1080)

	m.htmlWidget = CreateObject("roHtmlWidget", r)
	m.jtr.htmlWidget = m.htmlWidget

	m.htmlWidget.SetPort(m.msgPort)
	m.htmlWidget.EnableMouseEvents(true)
	m.htmlWidget.SetHWZDefault("on")
	m.htmlWidget.EnableJavascript(true)
	m.htmlWidget.AllowJavaScriptUrls({ all: "*" })
	m.htmlWidget.StartInspectorServer(2999)
	m.htmlWidget.SetLocalStorageDir("localstorage")
	m.htmlWidget.SetLocalStorageQuota(1 * 1024 * 1024)

	m.htmlWidget.SetUrl("file:///webSite/index.html")

' TODO - modify HTML/javascript so that only a transparent background is shown initially
	m.htmlWidget.Show()

End Sub


Sub de_EventHandler(event As Object)

    MEDIA_END = 8

	if type(event) = "roHtmlWidgetEvent" then
		m.HandleHttpEvent(event)
	
	else if type(event) = "roTimerEvent" then

		eventIdentity$ = stri(event.GetSourceIdentity())

		' video progress timer
		if type(m.videoPlaybackTimer) = "roTimer" and stri(m.videoPlaybackTimer.GetIdentity()) = eventIdentity$ then

			m.currentVideoPosition% = m.currentVideoPosition% + m.playbackSpeeds[m.playbackSpeedIndex%]

			print "m.currentVideoPosition%=";m.currentVideoPosition%
			m.videoPlaybackTimer.Start()

			' TODO - update the database once per minute

			m.UpdateProgressBar()

			currentState = m.jtr.GetCurrentState()
			currentState.currentTime = m.currentVideoPosition%
			m.jtr.SetCurrentState(currentState)
		endif

	' mediaEnd event is generated when in play or fast forward mode.
	else if type(event) = "roVideoEvent" and event.GetInt() = MEDIA_END then

		m.StopVideoPlaybackTimer()

		' send mediaEnd event to js
		aa = {}
		aa.AddReplace("bsMessage", "mediaEnd")
		m.htmlWidget.PostJSMessage(aa)

		if type(m.selectedRecording) = "roAssociativeArray" then
			' save current position
			m.UpdateLastViewedPosition(m.selectedRecording, m.currentVideoPosition%)
			m.selectedRecording.LastViewedPosition = m.currentVideoPosition%
		endif


	endif

End Sub


' this includes commands sent from Javascript via PostBSMessage
Sub de_HandleHttpEvent(event)

	print "roHTMLWidgetEvent received in de_HandleHttpEvent"
	eventData = event.GetData()

	if type(eventData) = "roAssociativeArray" and type(eventData.reason) = "roString" then
        print "reason = " + eventData.reason
		if eventData.reason = "load-started" then
		else if eventData.reason = "load-finished" then

			' send device's IP address to site's javascript

			' get ip address
			nc = CreateObject("roNetworkConfiguration", 0)
			networkConfig = nc.GetCurrentConfig()
			ipAddress$ = networkConfig.ip4_address
			print "ipAddress = ";ipAddress$

			' send it via message port
			aa = {}
			aa.AddReplace("ipAddress", ipAddress$)

			m.htmlWidget.PostJSMessage(aa)

		else if eventData.reason = "load-error" then

		else if eventData.reason = "message" then
		
			aa = eventData.message

			if type(aa.message) = "roString" then
				print "message from JS: ";aa.message
			else if type(aa.command) = "roString" then
				command$ = aa.command
				print "de_HandleHttpEvent: command=" + command$
				if command$ = "playRecordedShow" then
					print "playRecordedShow: recordingId=";aa.recordingId
					recording = m.jtr.GetDBRecording(aa.recordingId)
					m.StartPlayback(recording)
				else if command$ = "deleteRecordedShow" then
					print "deleteRecordedShow: recordingId=";aa.recordingId
					m.DeleteRecording(aa.recordingId)
				else if command$ = "forwardToTick" then
					m.ForwardToTick(int(val(aa.offset)), int(val(aa.duration)), int(val(aa.minutesPerTick)), int(val(aa.numTicks)))
				else if command$ = "backToTick" then
					m.BackToTick(int(val(aa.offset)), int(val(aa.duration)), int(val(aa.minutesPerTick)), int(val(aa.numTicks)))
				else if command$ = "remoteCommand" then
					if aa.remoteCommand = "pause" then
						m.PausePlayback()
					else if aa.remoteCommand = "play" then
						m.ResumePlayFromPaused()
					else if aa.remoteCommand = "quickSkip" then
						m.QuickSkipVideo()
					else if aa.remoteCommand = "instantReplay" then
						m.InstantReplayVideo()
					else if aa.remoteCommand = "rewind" then
						m.InitiateRewind()
					else if aa.remoteCommand = "nextRewind" then
						m.NextRewind()
					else if aa.remoteCommand = "fastForward" then
						m.InitiateFastForward()
					else if aa.remoteCommand = "nextFastForward" then
						m.NextFastForward()
					else
						stop
					endif
				endif
			endif

		endif
	endif

End Sub


Sub de_UpdateLastViewedPosition(recording As Object, position% As Integer)

	' prevent position from going outside of the bounds of the recording
	if position% < 0 then
		position% = 0
	endif

	if position% >= (recording.Duration * 60) then
		position% = recording.Duration * 60 - 1
	endif

	m.jtr.UpdateDBLastViewedPosition(recording.RecordingId, position%)

End Sub


Sub de_StartPlayback(recording As Object)

	' pause current video
	m.PausePlayback()

	' save the playback position for the current show before starting playback on a new show
	if type(m.selectedRecording) = "roAssociativeArray" then

		' save current position
		m.UpdateLastViewedPosition(m.selectedRecording, m.currentVideoPosition%)

		m.selectedRecording.LastViewedPosition = m.currentVideoPosition%
		
	endif


	m.selectedRecording = recording
'   m.currentVideoPosition% = 0 - do this when executing 'play from beginning'
	m.currentVideoPosition% = recording.LastViewedPosition

	print "LaunchVideo from StartPlayback"

	ok = m.videoPlayer.PlayFile(m.selectedRecording.Path)
	if not ok stop
	ok = m.videoPlayer.SetPlaybackSpeed(1.0)
	if not ok stop
	m.playbackSpeedIndex% = m.normalPlaybackSpeedIndex%
		
	m.UpdateProgressBar()
	m.SeekToCurrentVideoPosition()

	m.StartVideoPlaybackTimer()

End Sub


Sub de_DeleteRecording(recordingId As String)

	print "de_DeleteRecording::recordingId ";recordingId

	' for now, delete the file off the card. future, don't delete files until necessary to allow undo
	recording = m.jtr.GetDBRecording(recordingId)

	if type(recording) = "roAssociativeArray" then

		' delete hls segments
		if type(recording.HLSSegmentationComplete) <> "Invalid" and recording.HLSSegmentationComplete then
			hlsSegmentsPath$ = "/content/hls/" + recording.FileName
			listOfHLSSegmentPaths = []
			ListFiles(hlsSegmentsPath$, listOfHLSSegmentPaths)
			for each hlsSegmentFilePath in listOfHLSSegmentPaths
				ok = DeleteFile(hlsSegmentFilePath)
			next

			' delete folder
			ok = DeleteDirectory(hlsSegmentsPath$)
		endif

		' delete ts and/or mp4 files
		path = GetFilePath(recording.FileName)
		while path <> ""
			print "path of file to delete is ";path
			' TODO - log the deletion
			ok = DeleteFile(path)
			if not ok then
				print "file ";path;" not found in delete operation."
				' TODO - log the failure to find the file
			endif
			path = GetFilePath(recording.FileName)
		endwhile
	endif

	' add to deleted recordings table

	' remove from database
	m.jtr.DeleteDBRecording(recordingId)

End Sub



Sub de_PausePlayback()

print "de_PausePlayback() invoked"

	if type(m.selectedRecording) = "roAssociativeArray" then
		' save current position
		m.UpdateLastViewedPosition(m.selectedRecording, m.currentVideoPosition%)
		m.selectedRecording.LastViewedPosition = m.currentVideoPosition%
	endif

	m.StopVideoPlaybackTimer()

	ok = m.videoPlayer.SetPlaybackSpeed(0)
	ok = m.videoPlayer.Pause()
	' if not ok stop

End Sub


Sub de_ResumePlayFromPaused()

	m.StartVideoPlaybackTimer()

	ok = m.videoPlayer.Resume()
	' if not ok stop
	ok = m.videoPlayer.SetPlaybackSpeed(1.0)

	m.playbackSpeedIndex% = m.normalPlaybackSpeedIndex%

End Sub


Sub de_QuickSkipVideo()

	m.currentVideoPosition% = m.currentVideoPosition% + 15	' quick skip currently jumps ahead 15 seconds

	m.UpdateProgressBar()

	m.SeekToCurrentVideoPosition()

End Sub


Sub de_InstantReplayVideo()

	m.currentVideoPosition% = m.currentVideoPosition% - 7		' instant replay currently goes back 7 seconds
	if m.currentVideoPosition% < 0 then
		m.currentVideoPosition% = 0
	endif

	m.UpdateProgressBar()

	m.SeekToCurrentVideoPosition()

End Sub


Sub de_SeekToCurrentVideoPosition()

	print "seekTarget=" + stri(m.currentVideoPosition% * 1000)
	print "m.currentVideoPosition%=";m.currentVideoPosition%

	ok = m.videoPlayer.Seek(m.currentVideoPosition% * 1000)
	print "Seek result=";ok

End Sub


Sub de_InitiateFastForward()

	' update last viewed position in database
	print "update last viewed position for ";m.selectedRecording.RecordingId;" to "; m.currentVideoPosition%
	m.UpdateLastViewedPosition(m.selectedRecording, m.currentVideoPosition%)
	m.selectedRecording.LastViewedPosition = m.currentVideoPosition%

	m.playbackSpeedIndex% = m.normalPlaybackSpeedIndex% + 1
	playbackSpeed = m.playbackSpeeds[m.playbackSpeedIndex%]

	ok = m.videoPlayer.SetPlaybackSpeed(playbackSpeed)

	currentState = m.jtr.GetCurrentState()
	currentState.state = "fastForward"
	currentState.currentTime = m.selectedRecording.LastViewedPosition
	m.jtr.SetCurrentState(currentState)

End Sub


Sub de_NextFastForward()

	m.playbackSpeedIndex% = m.playbackSpeedIndex% + 1
	if m.playbackSpeedIndex% >= m.playbackSpeeds.Count() then
		m.playbackSpeedIndex% = m.normalPlaybackSpeedIndex% + 1
	endif

	playbackSpeed = m.playbackSpeeds[m.playbackSpeedIndex%]
	m.videoPlayer.SetPlaybackSpeed(playbackSpeed)

End Sub


Sub de_InitiateRewind()

	' update last viewed position in database
	print "update last viewed position for ";m.selectedRecording.RecordingId;" to "; m.currentVideoPosition%
	m.UpdateLastViewedPosition(m.selectedRecording, m.currentVideoPosition%)
	m.selectedRecording.LastViewedPosition = m.currentVideoPosition%

	m.playbackSpeedIndex% = m.normalPlaybackSpeedIndex% - 1
	playbackSpeed = m.playbackSpeeds[m.playbackSpeedIndex%]

	ok = m.videoPlayer.SetPlaybackSpeed(playbackSpeed)

	currentState = m.jtr.GetCurrentState()
	currentState.state = "rewind"
	currentState.currentTime = m.selectedRecording.LastViewedPosition
	m.jtr.SetCurrentState(currentState)

End Sub


Sub de_NextRewind()

	m.playbackSpeedIndex% = m.playbackSpeedIndex% - 1
	if m.playbackSpeedIndex% < 0 then
		m.playbackSpeedIndex% = m.normalPlaybackSpeedIndex% - 1
	endif

	playbackSpeed = m.playbackSpeeds[m.playbackSpeedIndex%]
	print "setplaybackspeed to ";playbackSpeed
	m.videoPlayer.SetPlaybackSpeed(playbackSpeed)

End Sub


Sub de_JumpToTick(movingForward As Boolean, offset% As Integer, duration% As Integer, minutesPerTick% As Integer, numTicks% As Integer)

	numTicksPassed% = offset% / (minutesPerTick% * 60)

	if movingForward then
		if numTicksPassed% < numTicks% then
			jumpToTick% = numTicksPassed% + 1
			jumpTo% = jumpToTick% * minutesPerTick% * 60
		else
			jumpTo% = duration% * 60
		endif
	else
		if numTicksPassed% > 0 then
			jumpToTick% = numTicksPassed%
			jumpTo% = jumpToTick% * minutesPerTick% * 60
		else
			jumpTo% = 0
		endif
	endif

	print "Jump to ";jumpTo%

	m.currentVideoPosition% = jumpTo%

	m.SeekToCurrentVideoPosition()
	m.UpdateProgressBar()

End Sub


Sub de_ForwardToTick(offset% As Integer, duration% As Integer, minutesPerTick% As Integer, numTicks% As Integer)

	m.JumpToTick(true, offset%, duration%, minutesPerTick%, numTicks%)

End Sub


Sub de_BackToTick(offset% As Integer, duration% As Integer, minutesPerTick% As Integer, numTicks% As Integer)

	m.JumpToTick(false, offset%, duration%, minutesPerTick%, numTicks%)

End Sub


Sub de_StartVideoPlaybackTimer()

print "****************************************************************************** START_VIDEO_PLAYBACK_TIMER"
	m.videoPlaybackTimer = CreateObject("roTimer")
	m.videoPlaybackTimer.SetPort(m.msgPort)
	m.videoPlaybackTimer.SetElapsed(1, 0)
	m.videoPlaybackTimer.Start()

End Sub


Sub de_StopVideoPlaybackTimer()

print "****************************************************************************** STOP_VIDEO_PLAYBACK_TIMER"
	if type(m.videoPlaybackTimer) = "roTimer" then
		m.videoPlaybackTimer.Stop()
	endif

End Sub


Sub de_UpdateProgressBar()
	if type(m.selectedRecording) = "roAssociativeArray" then
'		print  "send message to js to update progress bar"
'		print "offset from beginning of recording = ";m.currentVideoPosition%
'		print "total length of recording = ";(m.selectedRecording.Duration*60)

		' send message to js to update progress bar
		aa = {}
		aa.AddReplace("bsMessage", "UpdateProgressBar")
		aa.AddReplace("currentOffset", stri(m.currentVideoPosition%))
		aa.AddReplace("recordingDuration", stri(m.selectedRecording.Duration*60))
		m.htmlWidget.PostJSMessage(aa)
	endif

End Sub
