Function newDisplayEngine(jtr As Object) As Object

    DisplayEngine = newHSM()
    DisplayEngine.InitialPseudostateHandler = InitializeDisplayEngine

	DisplayEngine.jtr = jtr
	DisplayEngine.msgPort = jtr.msgPort

	DisplayEngine.LaunchVideo					= LaunchVideo
	DisplayEngine.QuickSkipVideo				= QuickSkipVideo
	DisplayEngine.InstantReplayVideo			= InstantReplayVideo
	DisplayEngine.Jump							= Jump
	DisplayEngine.SeekToCurrentVideoPosition	= SeekToCurrentVideoPosition
	DisplayEngine.UpdateProgressBar				= UpdateProgressBar
	DisplayEngine.StartVideoPlaybackTimer		= StartVideoPlaybackTimer
	DisplayEngine.StopVideoPlaybackTimer		= StopVideoPlaybackTimer
	DisplayEngine.ResumePlayback				= ResumePlayback
	DisplayEngine.PausePlayback					= PausePlayback

	DisplayEngine.LaunchWebkit					= LaunchWebkit

    DisplayEngine.stTop = DisplayEngine.newHState(DisplayEngine, "Top")
    DisplayEngine.stTop.HStateEventHandler = STTopEventHandler

    DisplayEngine.stShowingUI = DisplayEngine.newHState(DisplayEngine, "ShowingUI")
    DisplayEngine.stShowingUI.HStateEventHandler = STShowingUIEventHandler
	DisplayEngine.stShowingUI.superState = DisplayEngine.stTop

    DisplayEngine.stShowingVideo = DisplayEngine.newHState(DisplayEngine, "ShowingVideo")
    DisplayEngine.stShowingVideo.HStateEventHandler = STShowingVideoEventHandler
	DisplayEngine.stShowingVideo.superState = DisplayEngine.stTop

    DisplayEngine.stPlaying = DisplayEngine.newHState(DisplayEngine, "Playing")
    DisplayEngine.stPlaying.HStateEventHandler = STPlayingEventHandler
	DisplayEngine.stPlaying.superState = DisplayEngine.stShowingVideo

    DisplayEngine.stPaused = DisplayEngine.newHState(DisplayEngine, "Paused")
    DisplayEngine.stPaused.HStateEventHandler = STPausedEventHandler
	DisplayEngine.stPaused.superState = DisplayEngine.stShowingVideo

    DisplayEngine.stFastForwarding = DisplayEngine.newHState(DisplayEngine, "FastForwarding")
    DisplayEngine.stFastForwarding.HStateEventHandler = STFastForwardingEventHandler
	DisplayEngine.stFastForwarding.superState = DisplayEngine.stShowingVideo

    DisplayEngine.stRewinding = DisplayEngine.newHState(DisplayEngine, "Rewinding")
    DisplayEngine.stRewinding.HStateEventHandler = STRewindingEventHandler
	DisplayEngine.stRewinding.superState = DisplayEngine.stShowingVideo

	DisplayEngine.topState = DisplayEngine.stTop

	return DisplayEngine

End Function


Function InitializeDisplayEngine() As Object

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

	' create UI
	m.LaunchWebkit()

	return m.stShowingUI

End Function


Function STShowingUIEventHandler(event As Object, stateData As Object) As Object

    stateData.nextState = invalid
    
    if type(event) = "roAssociativeArray" then      ' internal message event

        if IsString(event["EventType"]) then
        
            if event["EventType"] = "ENTRY_SIGNAL" then
            
                print m.id$ + ": entry signal"

				' TBD - is it necessary to do anything here? hide video? send message to js?

                return "HANDLED"

            else if event["EventType"] = "EXIT_SIGNAL" then

                print m.id$ + ": exit signal"
            
            else if event["EventType"] = "RESUME_PLAYBACK" then

				' Replay Guide - play recorded show (either on screen or from browser)

				' send message to js to exit UI - necessary if command comes from browser
				aa = {}
				aa.AddReplace("bsMessage", "exitUI")
				m.stateMachine.htmlWidget.PostJSMessage(aa)

				' if there's a current recording, save it for later possible jump
				m.stateMachine.priorSelectedRecording = m.stateMachine.selectedRecording

				recording = event["Recording"]
				m.stateMachine.selectedRecording = recording
'				m.stateMachine.currentVideoPosition% = 0 - do this when executing 'play from beginning'
				m.stateMachine.currentVideoPosition% = recording.LastViewedPosition

				' new approach - launch video playback here
				print "LaunchVideo from STShowingUIEventHandler"

				ok = m.stateMachine.videoPlayer.PlayFile(m.stateMachine.selectedRecording.Path)
				if not ok stop
		
				m.stateMachine.UpdateProgressBar()
				m.stateMachine.SeekToCurrentVideoPosition()

				m.stateMachine.StartVideoPlaybackTimer()

				stateData.nextState = m.stateMachine.stPlaying
				return "TRANSITION"            
            
			endif
            
        endif
    
	else if IsRemoteCommand(event) then    

		remoteCommand$ = GetRemoteCommand(event)

		if remoteCommand$ = "MENU" then

			' for now, tell js to show the main menu whenever this is pressed - this is equivalent to Home
			aa = {}
			aa.AddReplace("bsMessage", "showMenu")
			m.stateMachine.htmlWidget.PostJSMessage(aa)

			return "HANDLED"

		else if remoteCommand$ = "EXIT" then

			' TBD - what should be done if the user presses this when no show was ever selected??
			' TBD - should it go to Paused state? even if it was playing before?

			' send message to js to exit UI
			aa = {}
			aa.AddReplace("bsMessage", "exitUI")
			m.stateMachine.htmlWidget.PostJSMessage(aa)
			
			stateData.nextState = m.stateMachine.stPaused
			return "TRANSITION"            

		else 

			commandToHtml$ = ""
			if remoteCommand$ = "UP" then
				commandToHtml$ = "Up"
			else if remoteCommand$ = "DOWN" then
				commandToHtml$ = "Down"
			else if remoteCommand$ = "LEFT" then
				commandToHtml$ = "Left"
			else if remoteCommand$ = "RIGHT" then
				commandToHtml$ = "Right"
			else if remoteCommand$ = "SELECT" then
				commandToHtml$ = "Enter"
			endif

			if commandToHtml$ <> "" then
				aa = {}
				aa.AddReplace("bsMessage", commandToHtml$)
				m.stateMachine.htmlWidget.PostJSMessage(aa)
			endif

			return "HANDLED"

		endif

    endif
            
    stateData.nextState = m.superState
    return "SUPER"
    
End Function


Function STShowingVideoEventHandler(event As Object, stateData As Object) As Object

    stateData.nextState = invalid
    
    if type(event) = "roAssociativeArray" then      ' internal message event

        if IsString(event["EventType"]) then
        
            if event["EventType"] = "ENTRY_SIGNAL" then
            
                print m.id$ + ": entry signal"

                return "HANDLED"

            else if event["EventType"] = "EXIT_SIGNAL" then

                print m.id$ + ": exit signal"
            
			endif
            
        endif
        
	else if type(event) = "roTimerEvent" then

		eventIdentity$ = stri(event.GetSourceIdentity())

		' video progress timer
		if type(m.stateMachine.videoPlaybackTimer) = "roTimer" and stri(m.stateMachine.videoPlaybackTimer.GetIdentity()) = eventIdentity$ then

			m.stateMachine.currentVideoPosition% = m.stateMachine.currentVideoPosition% + m.stateMachine.playbackSpeeds[m.stateMachine.playbackSpeedIndex%]

			print "m.stateMachine.currentVideoPosition%=";m.stateMachine.currentVideoPosition%
			m.stateMachine.videoPlaybackTimer.Start()

			' TODO - update the database once per minute

			m.stateMachine.UpdateProgressBar()

			return "HANDLED"
		endif

	else if IsRemoteCommand(event) then    
	
		remoteCommand$ = GetRemoteCommand(event)

		if remoteCommand$ = "MENU" then

			' TODO - undisplay overlay graphics

			' send message to js to display the menu
			aa = {}
			aa.AddReplace("bsMessage", "showMenu")
			m.stateMachine.htmlWidget.PostJSMessage(aa)
			
			stateData.nextState = m.stateMachine.stShowingUI
			return "TRANSITION"            

		else if remoteCommand$ = "PLAY_ICON" then
			aa = {}
			aa.AddReplace("bsMessage", "togglePlayIcon")
			m.stateMachine.htmlWidget.PostJSMessage(aa)

			return "HANDLED"

		else if remoteCommand$ = "PROGRESS_BAR" then

			if type(m.stateMachine.selectedRecording) = "roAssociativeArray" then
				aa = {}
				aa.AddReplace("bsMessage", "toggleProgressBar")
				aa.AddReplace("currentOffset", stri(m.stateMachine.currentVideoPosition%))
				aa.AddReplace("recordingDuration", stri(m.stateMachine.selectedRecording.Duration*60))
				m.stateMachine.htmlWidget.PostJSMessage(aa)
			endif				

			return "HANDLED"

		endif

    endif
            
    stateData.nextState = m.superState
    return "SUPER"
    
End Function


Function STPlayingEventHandler(event As Object, stateData As Object) As Object

    stateData.nextState = invalid
    
    if type(event) = "roAssociativeArray" then      ' internal message event

        if IsString(event["EventType"]) then
        
            if event["EventType"] = "ENTRY_SIGNAL" then
            
                print m.id$ + ": entry signal"
                return "HANDLED"

            else if event["EventType"] = "EXIT_SIGNAL" then

                print m.id$ + ": exit signal"

			else if event["EventType"] = "PAUSE" then

				stateData.nextState = m.stateMachine.stPaused
				
				return "TRANSITION"
            
            else if event["EventType"] = "INSTANT_REPLAY" then

				m.stateMachine.InstantReplayVideo()
			
				return "HANDLED"

            else if event["EventType"] = "QUICK_SKIP" then

				m.stateMachine.QuickSkipVideo()
			
				return "HANDLED"

            else if event["EventType"] = "RESUME_PLAYBACK" then

				' Replay Guide from browser on PC - Play show selected while show was playing

				' pause current video
				m.stateMachine.PausePlayback()

				' save current position
				m.stateMachine.jtr.UpdateDBLastViewedPosition(m.stateMachine.selectedRecording.RecordingId, m.stateMachine.currentVideoPosition%)
				m.stateMachine.selectedRecording.LastViewedPosition = m.stateMachine.currentVideoPosition%
				
				' save for later jump
				m.stateMachine.priorSelectedRecording = m.stateMachine.selectedRecording

				' launch new video
				recording = event["Recording"]
				m.stateMachine.selectedRecording = recording
'				m.stateMachine.currentVideoPosition% = 0 - do this when executing 'play from beginning'
				m.stateMachine.currentVideoPosition% = recording.LastViewedPosition
				m.stateMachine.UpdateProgressBar()
				m.stateMachine.LaunchVideo()
				return "HANDLED"            
			endif
            
        endif
        
	else if IsRemoteCommand(event) then    
	
		remoteCommand$ = GetRemoteCommand(event)

		if remoteCommand$ = "MENU" then

			' pause video
			m.stateMachine.PausePlayback()

			' save current position
			m.stateMachine.jtr.UpdateDBLastViewedPosition(m.stateMachine.selectedRecording.RecordingId, m.stateMachine.currentVideoPosition%)
			m.stateMachine.selectedRecording.LastViewedPosition = m.stateMachine.currentVideoPosition%

			' fall through to superState

		else if remoteCommand$ = "PAUSE" then
			stateData.nextState = m.stateMachine.stPaused
			return "TRANSITION"
		else if remoteCommand$ = "QUICK_SKIP" then
			m.stateMachine.QuickSkipVideo()
			return "HANDLED"
		else if remoteCommand$ = "INSTANT_REPLAY" then
			m.stateMachine.InstantReplayVideo()
			return "HANDLED"
		else if remoteCommand$ = "JUMP" then
			m.stateMachine.Jump()
			return "HANDLED"
		else if remoteCommand$ = "FF" then
			stateData.nextState = m.stateMachine.stFastForwarding
			return "TRANSITION"            
		else if remoteCommand$ = "RW" then
			stateData.nextState = m.stateMachine.stRewinding
			return "TRANSITION"            
		else
			print "unknown remote command ";event
			' stop
		endif

    endif
            
    stateData.nextState = m.superState
    return "SUPER"
    
End Function


Function STPausedEventHandler(event As Object, stateData As Object) As Object

    stateData.nextState = invalid
    
    if type(event) = "roAssociativeArray" then      ' internal message event

        if IsString(event["EventType"]) then
        
            if event["EventType"] = "ENTRY_SIGNAL" then
            
                print m.id$ + ": entry signal"

				m.stateMachine.PausePlayback()

				' update last viewed position in database
				print "update last viewed position for ";m.stateMachine.selectedRecording.RecordingId;" to "; m.stateMachine.currentVideoPosition%
				m.stateMachine.jtr.UpdateDBLastViewedPosition(m.stateMachine.selectedRecording.RecordingId, m.stateMachine.currentVideoPosition%)
				m.stateMachine.selectedRecording.LastViewedPosition = m.stateMachine.currentVideoPosition%

                return "HANDLED"

            else if event["EventType"] = "EXIT_SIGNAL" then

                print m.id$ + ": exit signal"
            
			else if event["EventType"] = "PAUSE" or event["EventType"] = "PLAY" then

				' unpause video before changing state
				m.stateMachine.ResumePlayback()
				m.stateMachine.StartVideoPlaybackTimer()
				stateData.nextState = m.stateMachine.stPlaying
				return "TRANSITION"
            
            else if event["EventType"] = "INSTANT_REPLAY" then

				m.stateMachine.InstantReplayVideo()
				return "HANDLED"

            else if event["EventType"] = "QUICK_SKIP" then

				m.stateMachine.QuickSkipVideo()
				return "HANDLED"

			else
				' TODO - internal message / play from replay guide
			endif
            
        endif
        
	else if IsRemoteCommand(event) then    

		remoteCommand$ = GetRemoteCommand(event)

		if remoteCommand$ = "MENU" then

			' save current position
			m.stateMachine.jtr.UpdateDBLastViewedPosition(m.stateMachine.selectedRecording.RecordingId, m.stateMachine.currentVideoPosition%)
			m.stateMachine.selectedRecording.LastViewedPosition = m.stateMachine.currentVideoPosition%

			' fall through to superState

		else if remoteCommand$ = "PAUSE" or remoteCommand$ = "PLAY"		
			m.stateMachine.ResumePlayback()
			m.stateMachine.StartVideoPlaybackTimer()
			stateData.nextState = m.stateMachine.stPlaying
			return "TRANSITION"
		else if remoteCommand$ = "QUICK_SKIP" then
			m.stateMachine.QuickSkipVideo()
			return "HANDLED"
		else if remoteCommand$ = "INSTANT_REPLAY" then
			m.stateMachine.InstantReplayVideo()
			return "HANDLED"
		endif

    endif
            
    stateData.nextState = m.superState
    return "SUPER"
    
End Function


Function STFastForwardingEventHandler(event As Object, stateData As Object) As Object

    stateData.nextState = invalid
    
    if type(event) = "roAssociativeArray" then      ' internal message event

        if IsString(event["EventType"]) then
        
            if event["EventType"] = "ENTRY_SIGNAL" then
            
                print m.id$ + ": entry signal"

				' update last viewed position in database
				print "update last viewed position for ";m.stateMachine.selectedRecording.RecordingId;" to "; m.stateMachine.currentVideoPosition%
				m.stateMachine.jtr.UpdateDBLastViewedPosition(m.stateMachine.selectedRecording.RecordingId, m.stateMachine.currentVideoPosition%)
				m.stateMachine.selectedRecording.LastViewedPosition = m.stateMachine.currentVideoPosition%

				m.stateMachine.playbackSpeedIndex% = m.stateMachine.normalPlaybackSpeedIndex% + 1
				playbackSpeed = m.stateMachine.playbackSpeeds[m.stateMachine.playbackSpeedIndex%]

				m.stateMachine.videoPlayer.SetPlaybackSpeed(playbackSpeed)

                return "HANDLED"

            else if event["EventType"] = "EXIT_SIGNAL" then

                print m.id$ + ": exit signal"
            
			else
				' TODO - internal message / play from replay guide
			endif
            
        endif
        
	else if IsRemoteCommand(event) then    

		remoteCommand$ = GetRemoteCommand(event)

		if remoteCommand$ = "FF" then
			
			m.stateMachine.playbackSpeedIndex% = m.stateMachine.playbackSpeedIndex% + 1
			if m.stateMachine.playbackSpeedIndex% >= m.stateMachine.playbackSpeeds.Count() then
				m.stateMachine.playbackSpeedIndex% = m.stateMachine.normalPlaybackSpeedIndex% + 1
			endif

			playbackSpeed = m.stateMachine.playbackSpeeds[m.stateMachine.playbackSpeedIndex%]
			m.stateMachine.videoPlayer.SetPlaybackSpeed(playbackSpeed)

			return "HANDLED"

		else if remoteCommand$ = "MENU" then

			' save current position
			m.stateMachine.jtr.UpdateDBLastViewedPosition(m.stateMachine.selectedRecording.RecordingId, m.stateMachine.currentVideoPosition%)
			m.stateMachine.selectedRecording.LastViewedPosition = m.stateMachine.currentVideoPosition%

			' fall through to superState

		else if remoteCommand$ = "PLAY" then
			m.stateMachine.ResumePlayback()
			m.stateMachine.StartVideoPlaybackTimer()
			stateData.nextState = m.stateMachine.stPlaying
			return "TRANSITION"
		else if remoteCommand$ = "PAUSE" then
			stateData.nextState = m.stateMachine.stPaused
			return "TRANSITION"
		else if remoteCommand$ = "QUICK_SKIP" then
			' m.stateMachine.QuickSkipVideo()
			' should jump to next tick mark in progress bar
			return "HANDLED"
		else if remoteCommand$ = "INSTANT_REPLAY" then
			' m.stateMachine.InstantReplayVideo()
			' should jump to prior tick mark in progress bar?
			return "HANDLED"
		' Jump
		' Play
		' Rewind
		endif

    endif
            
    stateData.nextState = m.superState
    return "SUPER"
    
End Function


Function STRewindingEventHandler(event As Object, stateData As Object) As Object

    stateData.nextState = invalid
    
    if type(event) = "roAssociativeArray" then      ' internal message event

        if IsString(event["EventType"]) then
        
            if event["EventType"] = "ENTRY_SIGNAL" then
            
                print m.id$ + ": entry signal"

				' update last viewed position in database
				print "update last viewed position for ";m.stateMachine.selectedRecording.RecordingId;" to "; m.stateMachine.currentVideoPosition%
				m.stateMachine.jtr.UpdateDBLastViewedPosition(m.stateMachine.selectedRecording.RecordingId, m.stateMachine.currentVideoPosition%)
				m.stateMachine.selectedRecording.LastViewedPosition = m.stateMachine.currentVideoPosition%

				m.stateMachine.playbackSpeedIndex% = m.stateMachine.normalPlaybackSpeedIndex% - 1
				playbackSpeed = m.stateMachine.playbackSpeeds[m.stateMachine.playbackSpeedIndex%]

				m.stateMachine.videoPlayer.SetPlaybackSpeed(playbackSpeed)

                return "HANDLED"

            else if event["EventType"] = "EXIT_SIGNAL" then

                print m.id$ + ": exit signal"
            
			else
				' TODO - internal message / play from replay guide
			endif
            
        endif
        
	else if IsRemoteCommand(event) then    

		remoteCommand$ = GetRemoteCommand(event)

		if remoteCommand$ = "RW" then
			
			m.stateMachine.playbackSpeedIndex% = m.stateMachine.playbackSpeedIndex% - 1
			if m.stateMachine.playbackSpeedIndex% < 0 then
				m.stateMachine.playbackSpeedIndex% = m.stateMachine.normalPlaybackSpeedIndex% - 1
			endif

			playbackSpeed = m.stateMachine.playbackSpeeds[m.stateMachine.playbackSpeedIndex%]
			m.stateMachine.videoPlayer.SetPlaybackSpeed(playbackSpeed)

			return "HANDLED"

		else if remoteCommand$ = "MENU" then

			' save current position
			m.stateMachine.jtr.UpdateDBLastViewedPosition(m.stateMachine.selectedRecording.RecordingId, m.stateMachine.currentVideoPosition%)
			m.stateMachine.selectedRecording.LastViewedPosition = m.stateMachine.currentVideoPosition%

			' fall through to superState

		else if remoteCommand$ = "PLAY" then
			m.stateMachine.ResumePlayback()
			m.stateMachine.StartVideoPlaybackTimer()
			stateData.nextState = m.stateMachine.stPlaying
			return "TRANSITION"
		else if remoteCommand$ = "PAUSE"
			stateData.nextState = m.stateMachine.stPaused
			return "TRANSITION"
		else if remoteCommand$ = "QUICK_SKIP" then
			' m.stateMachine.QuickSkipVideo()
			' should jump to next tick mark in progress bar
			return "HANDLED"
		else if remoteCommand$ = "INSTANT_REPLAY" then
			' m.stateMachine.InstantReplayVideo()
			' should jump to prior tick mark in progress bar?
			return "HANDLED"
		' Jump
		endif

    endif
            
    stateData.nextState = m.superState
    return "SUPER"
    
End Function


Sub LaunchVideo()

	print "LaunchVideo"

	ok = m.videoPlayer.PlayFile(m.selectedRecording.Path)
	if not ok stop

	m.stateMachine.StartVideoPlaybackTimer()

End Sub


Sub QuickSkipVideo()

	m.currentVideoPosition% = m.currentVideoPosition% + 15	' quick skip currently jumps ahead 15 seconds

	m.UpdateProgressBar()

	m.SeekToCurrentVideoPosition()

End Sub


Sub InstantReplayVideo()

	m.currentVideoPosition% = m.currentVideoPosition% - 7		' instant replay currently goes back 7 seconds
	if m.currentVideoPosition% < 0 then
		m.currentVideoPosition% = 0
	endif

	m.UpdateProgressBar()

	m.SeekToCurrentVideoPosition()

End Sub


Sub SeekToCurrentVideoPosition()

	print "seekTarget=" + stri(m.currentVideoPosition% * 1000)
	print "m.currentVideoPosition%=";m.currentVideoPosition%

	ok = m.videoPlayer.Seek(m.currentVideoPosition% * 1000)
	print "Seek result=";ok

End Sub


Sub Jump()

	print "Jump"

	if type(m.selectedRecording) <> "roAssociativeArray" then
stop ' should be impossible??
		print "No selected recording"
		return
	endif

	if type(m.priorSelectedRecording) <> "roAssociativeArray" then
		print "No prior recording"
		return
	endif

	' save location of current playback item
	print "Jump:: update last viewed position for ";m.selectedRecording.RecordingId;" to "; m.currentVideoPosition%
	m.jtr.UpdateDBLastViewedPosition(m.selectedRecording.RecordingId, m.currentVideoPosition%)
	m.selectedRecording.LastViewedPosition = m.currentVideoPosition%

	tmpRecording = m.selectedRecording
	m.selectedRecording = m.priorSelectedRecording
	m.priorSelectedRecording = tmpRecording

'	tmpRecording = m.selectedRecording
'	priorSelectedRecordingVideoPosition% = m.priorSelectedRecording.currentVideoPosition%
'	m.selectedRecording = m.priorSelectedRecording
'	m.priorSelectedRecording = tmpRecording
'	m.priorSelectedRecording.currentVideoPosition% = m.currentVideoPosition%

	ok = m.videoPlayer.PlayFile(m.selectedRecording.Path)
	if not ok stop

	' seek to last watched position
	m.currentVideoPosition% = m.selectedRecording.LastViewedPosition
	print "Jump:: get last viewed position for ";m.selectedRecording.RecordingId;" it is "; m.currentVideoPosition%
	m.UpdateProgressBar()
	m.SeekToCurrentVideoPosition()

End Sub


Sub UpdateProgressBar()

	if type(m.selectedRecording) = "roAssociativeArray" then
		print  "send message to js to update progress bar"
		print "offset from beginning of recording = ";m.currentVideoPosition%
		print "total length of recording = ";(m.selectedRecording.Duration*60)

		' send message to js to update progress bar
		aa = {}
		aa.AddReplace("bsMessage", "UpdateProgressBar")
		aa.AddReplace("currentOffset", stri(m.currentVideoPosition%))
		aa.AddReplace("recordingDuration", stri(m.selectedRecording.Duration*60))
		m.htmlWidget.PostJSMessage(aa)
	endif

End Sub


Sub LaunchWebkit()

	print "LaunchWebkit invoked"

	' don't want cursor for now
    m.t=createobject("roTouchScreen")
    m.t.enablecursor(false)

	r = CreateObject("roRectangle", 0, 0, 1920, 1080)

	m.htmlWidget = CreateObject("roHtmlWidget", r)
	m.htmlWidget.SetPort(m.msgPort)
	m.htmlWidget.EnableMouseEvents(true)
	m.htmlWidget.SetHWZDefault("on")
	m.htmlWidget.EnableJavascript(true)
	m.htmlWidget.AllowJavaScriptUrls({ all: "*" })
	m.htmlWidget.StartInspectorServer(2999)

	m.htmlWidget.SetUrl("file:///webkit/index.html")

' TODO - modify HTML/javascript so that only a transparent background is shown initially
	m.htmlWidget.Show()

End Sub


Sub StartVideoPlaybackTimer()

print "****************************************************************************** START_VIDEO_PLAYBACK_TIMER"
	m.videoPlaybackTimer = CreateObject("roTimer")
	m.videoPlaybackTimer.SetPort(m.msgPort)
	m.videoPlaybackTimer.SetElapsed(1, 0)
	m.videoPlaybackTimer.Start()

End Sub


Sub StopVideoPlaybackTimer()

print "****************************************************************************** STOP_VIDEO_PLAYBACK_TIMER"
	m.videoPlaybackTimer.Stop()

End Sub


Sub PausePlayback()

	m.StopVideoPlaybackTimer()

	ok = m.videoPlayer.SetPlaybackSpeed(0)
	ok = m.videoPlayer.Pause()
	' if not ok stop

End Sub


Sub ResumePlayback()

	ok = m.videoPlayer.Resume()
	' if not ok stop
	ok = m.videoPlayer.SetPlaybackSpeed(1.0)

	m.playbackSpeedIndex% = m.normalPlaybackSpeedIndex%

End Sub
