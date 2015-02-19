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
	DisplayEngine.JumpToTick					= JumpToTick

	DisplayEngine.NextFastForward				= NextFastForward
	DisplayEngine.NextRewind					= NextRewind

	DisplayEngine.LaunchWebkit					= LaunchWebkit

    DisplayEngine.stTop = DisplayEngine.newHState(DisplayEngine, "Top")
    DisplayEngine.stTop.HStateEventHandler = STTopEventHandler

    DisplayEngine.stLoadingSite = DisplayEngine.newHState(DisplayEngine, "LoadingSite")
    DisplayEngine.stLoadingSite.HStateEventHandler = STLoadingSiteEventHandler
	DisplayEngine.stLoadingSite.superState = DisplayEngine.stTop

    DisplayEngine.stShowingUI = DisplayEngine.newHState(DisplayEngine, "ShowingUI")
    DisplayEngine.stShowingUI.HStateEventHandler = STShowingUIEventHandler
	DisplayEngine.stShowingUI.superState = DisplayEngine.stTop
	DisplayEngine.stShowingUI.sendMessageToJS = sendMessageToJS
	DisplayEngine.stShowingUI.invokeMenuWhenShowingUI = invokeMenuWhenShowingUI
	DisplayEngine.stShowingUI.invokeExitWhenShowingUI = invokeExitWhenShowingUI
	DisplayEngine.stShowingUI.invokeRecordedShowsWhenShowingUI = invokeRecordedShowsWhenShowingUI
	DisplayEngine.stShowingUI.invokeNavigationWhenShowingUI = invokeNavigationWhenShowingUI

    DisplayEngine.stShowingModalDlg = DisplayEngine.newHState(DisplayEngine, "ShowingModalDlg")
    DisplayEngine.stShowingModalDlg.HStateEventHandler = STShowingModalDlgEventHandler
	DisplayEngine.stShowingModalDlg.superState = DisplayEngine.stTop
	DisplayEngine.stShowingModalDlg.sendMessageToJS = sendMessageToJS
	DisplayEngine.stShowingModalDlg.invokeExitWhenShowingModalDlg = invokeExitWhenShowingModalDlg
	DisplayEngine.stShowingModalDlg.invokeNavigationWhenShowingModalDlg = invokeNavigationWhenShowingModalDlg

    DisplayEngine.stShowingVideo = DisplayEngine.newHState(DisplayEngine, "ShowingVideo")
    DisplayEngine.stShowingVideo.HStateEventHandler = STShowingVideoEventHandler
	DisplayEngine.stShowingVideo.superState = DisplayEngine.stTop
	DisplayEngine.stShowingVideo.sendMessageToJS = sendMessageToJS
	DisplayEngine.stShowingVideo.invokeMenuWhenShowingVideo = invokeMenuWhenShowingVideo
	DisplayEngine.stShowingVideo.invokeRecordedShowsWhenShowingVideo = invokeRecordedShowsWhenShowingVideo
	DisplayEngine.stShowingVideo.invokeTogglePlayIconWhenShowingVideo = invokeTogglePlayIconWhenShowingVideo
	DisplayEngine.stShowingVideo.invokeToggleProgressBarWhenShowingVideo = invokeToggleProgressBarWhenShowingVideo

    DisplayEngine.stPlaying = DisplayEngine.newHState(DisplayEngine, "Playing")
    DisplayEngine.stPlaying.HStateEventHandler = STPlayingEventHandler
	DisplayEngine.stPlaying.superState = DisplayEngine.stShowingVideo
	DisplayEngine.stPlaying.sendMessageToJS = sendMessageToJS
	DisplayEngine.stPlaying.invokeFastForwardWhenPlaying = invokeFastForwardWhenPlaying
	DisplayEngine.stPlaying.invokeRewindWhenPlaying = invokeRewindWhenPlaying
	DisplayEngine.stPlaying.invokePauseWhenPlaying = invokePauseWhenPlaying
	DisplayEngine.stPlaying.invokeInstantReplayWhenPlaying = invokeInstantReplayWhenPlaying
	DisplayEngine.stPlaying.invokeQuickSkipWhenPlaying = invokeQuickSkipWhenPlaying
	DisplayEngine.stPlaying.invokeMenuWhenPlaying = invokeMenuWhenPlaying
	DisplayEngine.stPlaying.invokeStopWhenPlaying = invokeStopWhenPlaying
	DisplayEngine.stPlaying.invokeRecordedShowsWhenPlaying = invokeRecordedShowsWhenPlaying
	DisplayEngine.stPlaying.invokeJumpWhenPlaying = invokeJumpWhenPlaying

    DisplayEngine.stPaused = DisplayEngine.newHState(DisplayEngine, "Paused")
    DisplayEngine.stPaused.HStateEventHandler = STPausedEventHandler
	DisplayEngine.stPaused.superState = DisplayEngine.stShowingVideo
	DisplayEngine.stPaused.sendMessageToJS = sendMessageToJS
	DisplayEngine.stPaused.invokeMenuWhenPaused = invokeMenuWhenPaused
	DisplayEngine.stPaused.invokePauseWhenPaused = invokePauseWhenPaused
	DisplayEngine.stPaused.invokePlayWhenPaused = invokePlayWhenPaused
	DisplayEngine.stPaused.invokeQuickSkipWhenPaused = invokeQuickSkipWhenPaused
	DisplayEngine.stPaused.invokeInstantReplayWhenPaused = invokeInstantReplayWhenPaused

    DisplayEngine.stFastForwarding = DisplayEngine.newHState(DisplayEngine, "FastForwarding")
    DisplayEngine.stFastForwarding.HStateEventHandler = STFastForwardingEventHandler
	DisplayEngine.stFastForwarding.superState = DisplayEngine.stShowingVideo
	DisplayEngine.stFastForwarding.sendMessageToJS = sendMessageToJS
	DisplayEngine.stFastForwarding.invokeFastForwardWhenFastForwarding = invokeFastForwardWhenFastForwarding
	DisplayEngine.stFastForwarding.invokeMenuWhenFastForwarding = invokeMenuWhenFastForwarding
	DisplayEngine.stFastForwarding.invokePlayWhenFastForwarding = invokePlayWhenFastForwarding
	DisplayEngine.stFastForwarding.invokePauseWhenFastForwarding = invokePauseWhenFastForwarding
	DisplayEngine.stFastForwarding.invokeQuickSkipWhenFastForwarding = invokeQuickSkipWhenFastForwarding
	DisplayEngine.stFastForwarding.invokeInstantReplayWhenFastForwarding = invokeInstantReplayWhenFastForwarding

    DisplayEngine.stRewinding = DisplayEngine.newHState(DisplayEngine, "Rewinding")
    DisplayEngine.stRewinding.HStateEventHandler = STRewindingEventHandler
	DisplayEngine.stRewinding.superState = DisplayEngine.stShowingVideo
	DisplayEngine.stRewinding.sendMessageToJS = sendMessageToJS
	DisplayEngine.stRewinding.invokeRewindWhenRewinding = invokeRewindWhenRewinding
	DisplayEngine.stRewinding.invokeMenuWhenRewinding = invokeMenuWhenRewinding
	DisplayEngine.stRewinding.invokePlayWhenRewinding = invokePlayWhenRewinding
	DisplayEngine.stRewinding.invokePauseWhenRewinding = invokePauseWhenRewinding
	DisplayEngine.stRewinding.invokeQuickSkipWhenRewinding = invokeQuickSkipWhenRewinding
	DisplayEngine.stRewinding.invokeInstantReplayWhenRewinding = invokeInstantReplayWhenRewinding

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

	return m.stLoadingSite

End Function


Function STLoadingSiteEventHandler(event As Object, stateData As Object) As Object

    stateData.nextState = invalid
    
    if type(event) = "roAssociativeArray" then      ' internal message event

        if IsString(event["EventType"]) then
        
            if event["EventType"] = "ENTRY_SIGNAL" then
            
                print m.id$ + ": entry signal"

				' create and launch html site
				m.stateMachine.LaunchWebkit()

                return "HANDLED"

			endif
        endif
    
    else if type(event) = "roHtmlWidgetEvent" then

		print "roHTMLWidgetEvent received in STLoadingSiteEventHandler"
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
				m.stateMachine.htmlWidget.PostJSMessage(aa)

				stateData.nextState = m.stateMachine.stShowingUI
				return "TRANSITION"            

			else if eventData.reason = "load-error" then
			else if eventData.reason = "message" then
				print "message from javascript: " + eventData.message.message
			endif
		endif

    endif
            
    stateData.nextState = m.superState
    return "SUPER"
    
End Function


Sub sendMessageToJS(message$)
	aa = {}
	aa.AddReplace("bsMessage", message$)
	m.stateMachine.htmlWidget.PostJSMessage(aa)
End Sub


Sub invokeMenuWhenShowingUI()
	m.sendMessageToJS("showMenu")
End Sub


Sub invokeExitWhenShowingUI(stateData As Object)
	' TBD - what should be done if the user presses this when no show was ever selected??
	' TBD - should it go to Paused state? even if it was playing before?
	m.sendMessageToJS("exitUI")
	stateData.nextState = m.stateMachine.stPaused
End Sub


Sub invokeRecordedShowsWhenShowingUI()
	m.sendMessageToJS("showRecordedShows")
End Sub


Sub invokeNavigationWhenShowingUI(navigationMessage$)
	m.sendMessageToJS(navigationMessage$)
End Sub


Function STShowingUIEventHandler(event As Object, stateData As Object) As Object

    stateData.nextState = invalid
    
    if type(event) = "roAssociativeArray" then      ' internal message event

        if IsString(event["EventType"]) then
			
			eventMsg$ = event["EventType"]

            if eventMsg$ = "ENTRY_SIGNAL" then
            
                print m.id$ + ": entry signal"

				' TBD - is it necessary to do anything here? hide video? send message to js?

                return "HANDLED"

            else if eventMsg$ = "EXIT_SIGNAL" then

                print m.id$ + ": exit signal"
            
            else if eventMsg$ = "RESUME_PLAYBACK" then

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

'				aa = { }
'				aa.AddReplace("Filename", m.stateMachine.selectedRecording.Path)
'				ok = m.stateMachine.videoPlayer.PreloadFile(aa)
'				m.stateMachine.SeekToCurrentVideoPosition()
				ok = m.stateMachine.videoPlayer.PlayFile(m.stateMachine.selectedRecording.Path)
				if not ok stop
		
				m.stateMachine.UpdateProgressBar()
				m.stateMachine.SeekToCurrentVideoPosition()

				m.stateMachine.StartVideoPlaybackTimer()

				stateData.nextState = m.stateMachine.stPlaying
				return "TRANSITION"            
            
			' remote commands from client
            else if eventMsg$ = "MENU" then
				m.invokeMenuWhenShowingUI()
				return "HANDLED"
            else if eventMsg$ = "EXIT" then
				m.invokeExitWhenShowingUI(stateData)
				return "TRANSITION"            
            else if eventMsg$ = "RECORDED_SHOWS" then
				m.invokeRecordedShowsWhenShowingUI()
				return "HANDLED"
            else if eventMsg$ = "UP" or eventMsg$ = "DOWN" or eventMsg$ = "LEFT" or eventMsg$ = "RIGHT" or eventMsg$ = "ENTER" then
				m.invokeNavigationWhenShowingUI(eventMsg$)
				return "HANDLED"
			endif
            
        endif
    
	else if IsRemoteCommand(event) then    

		remoteCommand$ = GetRemoteCommand(event)

		if remoteCommand$ = "MENU" then
			m.invokeMenuWhenShowingUI()
			return "HANDLED"
		else if remoteCommand$ = "EXIT" then
			m.invokeExitWhenShowingUI(stateData)
			return "TRANSITION"            
		else if remoteCommand$ = "RECORDED_SHOWS" then
			m.invokeRecordedShowsWhenShowingUI()
			return "HANDLED"
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
				m.invokeNavigationWhenShowingUI(commandToHtml$)
			endif

			return "HANDLED"
		endif

    endif
            
    stateData.nextState = m.superState
    return "SUPER"
    
End Function


Sub invokeExitWhenShowingModalDlg()
	' TODO - treat this as cancel
End Sub


Sub invokeNavigationWhenShowingModalDlg(navigationMessage$)
	m.sendMessageToJS(navigationMessage$)
End Sub


Function STShowingModalDlgEventHandler(event As Object, stateData As Object) As Object

    stateData.nextState = invalid
    
    if type(event) = "roAssociativeArray" then      ' internal message event

        if IsString(event["EventType"]) then
        
			eventMsg$ = event["EventType"]

            if eventMsg$ = "ENTRY_SIGNAL" then
            
                print m.id$ + ": entry signal"

				' TBD - is it necessary to do anything here? hide video? send message to js?

                return "HANDLED"

            else if eventMsg$ = "EXIT_SIGNAL" then

                print m.id$ + ": exit signal"
            
            else if eventMsg$ = "SHOW_UI" then

                print "SHOW_UI message received"

				stateData.nextState = m.stateMachine.stShowingUI
				return "TRANSITION"            
            
			' remote commands from client
            else if eventMsg$ = "EXIT" then
				m.invokeExitWhenShowingModalDlg()
				return "HANDLED"            
            else if eventMsg$ = "UP" or eventMsg$ = "DOWN" or eventMsg$ = "LEFT" or eventMsg$ = "RIGHT" or eventMsg$ = "ENTER" then
				m.invokeNavigationWhenShowingModalDlg(eventMsg$)
				return "HANDLED"
			endif
            
        endif
    
	else if IsRemoteCommand(event) then    

		remoteCommand$ = GetRemoteCommand(event)

		 if remoteCommand$ = "EXIT" then

			m.invokeExitWhenShowingModalDlg()
			return "HANDLED"            

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
				m.invokeNavigationWhenShowingModalDlg(commandToHtml$)
			endif

			return "HANDLED"

		endif

    endif
            
    stateData.nextState = m.superState
    return "SUPER"
    
End Function


Sub invokeMenuWhenShowingVideo(stateData As Object)

	' TODO - undisplay overlay graphics

	' send message to js to display the menu
	aa = {}
	aa.AddReplace("bsMessage", "showMenu")
	m.stateMachine.htmlWidget.PostJSMessage(aa)
			
	stateData.nextState = m.stateMachine.stShowingUI

End Sub


Sub invokeRecordedShowsWhenShowingVideo(stateData As Object)

	' send message to js to show Recorded Shows
	aa = {}
	aa.AddReplace("bsMessage", "showRecordedShows")
	m.stateMachine.htmlWidget.PostJSMessage(aa)

	stateData.nextState = m.stateMachine.stShowingUI

End Sub


Sub invokeTogglePlayIconWhenShowingVideo()

	aa = {}
	aa.AddReplace("bsMessage", "togglePlayIcon")
	m.stateMachine.htmlWidget.PostJSMessage(aa)

End Sub


Sub invokeToggleProgressBarWhenShowingVideo()

	if type(m.stateMachine.selectedRecording) = "roAssociativeArray" then

		' specify a variety of parameters for the UI
        
		recordingDuration = m.stateMachine.selectedRecording.Duration*60

		' number of ticks to display is based on the duration of the recording
		'0 < duration <= 5 minutes
		'every 1 minute
		'5 minutes < duration <= 40 minutes
		'every 5 minutes
		'40 minutes < duration <= 1 hour
		'every 10minutes
		'1 hour < duration <= 3 hours
		'every 15 minutes
		'3 hours < duration <= 4 hours
		'every 30 minutes
		'4 hours < duration
		'every hour
		numMinutes% = recordingDuration / 60

		print "toggleProgressBar: duration = ";recordingDuration
		print "toggleProgressBar: numMinutes = ";numMinutes%

		minutesPerTick% = 1
		if (numMinutes% > 240) then
			minutesPerTick% = 60
		else if (numMinutes% > 180) then
			minutesPerTick% = 30
		else if (numMinutes% > 60) then
			minutesPerTick% = 15
		else if (numMinutes% > 40) then
			minutesPerTick% = 10
		else if (numMinutes% > 5) then
			minutesPerTick% = 5
		else 
			minutesPerTick% = 1
		endif

		numTicks% = numMinutes% / minutesPerTick%

		print "toggleProgressBar: numTicks = ";numTicks%
		print "toggleProgressBar: minutesPerTick = ";minutesPerTick%

		' determine whether or not to draw last tick - don't draw it if it is at the end of the progress bar
		if (minutesPerTick% * numTicks%) = numMinutes% then
			numTicks% = numTicks% - 1
		endif

		print "toggleProgressBar: numTicks = ";numTicks%

		aa = {}
		aa.AddReplace("bsMessage", "toggleProgressBar")
		aa.AddReplace("currentOffset", stri(m.stateMachine.currentVideoPosition%))
		aa.AddReplace("recordingDuration", stri(m.stateMachine.selectedRecording.Duration*60))
		aa.AddReplace("numMinutes", stri(numMinutes%))
		aa.AddReplace("minutesPerTick", stri(minutesPerTick%))
		aa.AddReplace("numTicks", stri(numTicks%))
		m.stateMachine.htmlWidget.PostJSMessage(aa)

		m.stateMachine.numMinutes = numMinutes%
		m.stateMachine.minutesPerTick = minutesPerTick%
		m.stateMachine.numTicks = numTicks%

	endif				

End Sub


Function STShowingVideoEventHandler(event As Object, stateData As Object) As Object

    stateData.nextState = invalid
    
    if type(event) = "roAssociativeArray" then      ' internal message event

        if IsString(event["EventType"]) then
        
			eventMsg$ = event["EventType"]

            if eventMsg$ = "ENTRY_SIGNAL" then
            
                print m.id$ + ": entry signal"

                return "HANDLED"

            else if eventMsg$ = "EXIT_SIGNAL" then

                print m.id$ + ": exit signal"
            
			else if eventMsg$ = "MENU"
				m.invokeMenuWhenShowingVideo(stateData)
				return "TRANSITION"            
			else if eventMsg$ = "RECORDED_SHOWS"
				m.invokeRecordedShowsWhenShowingVideo(stateData)
				return "TRANSITION"
			else if eventMsg$ = "TOGGLE_PROGRESS_BAR"
				m.invokeToggleProgressBarWhenShowingVideo()
				return "HANDLED"
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

			currentState = m.stateMachine.jtr.GetCurrentState()
			currentState.currentTime = m.stateMachine.currentVideoPosition%
			m.stateMachine.jtr.SetCurrentState(currentState)

			return "HANDLED"
		endif

	else if IsRemoteCommand(event) then    
	
		remoteCommand$ = GetRemoteCommand(event)

		if remoteCommand$ = "MENU" then
			m.invokeMenuWhenShowingVideo(stateData)
			return "TRANSITION"            
		else if remoteCommand$ = "RECORDED_SHOWS" then
			m.invokeRecordedShowsWhenShowingVideo(stateData)
			return "TRANSITION"
		else if remoteCommand$ = "PLAY_ICON" then
			m.invokeTogglePlayIconWhenShowingVideo()
			return "HANDLED"
		else if remoteCommand$ = "PROGRESS_BAR" then
			m.invokeToggleProgressBarWhenShowingVideo()
			return "HANDLED"
		endif

    endif
            
    stateData.nextState = m.superState
    return "SUPER"
    
End Function


Sub invokeMenuWhenPlaying(stateData As Object)

	' pause video
	m.stateMachine.PausePlayback()

	' save current position
	m.stateMachine.jtr.UpdateDBLastViewedPosition(m.stateMachine.selectedRecording.RecordingId, m.stateMachine.currentVideoPosition%)
	m.stateMachine.selectedRecording.LastViewedPosition = m.stateMachine.currentVideoPosition%

End Sub


Sub invokeStopWhenPlaying(stateData As Object)

	' pause video
	m.stateMachine.PausePlayback()

	' save current position
	m.stateMachine.jtr.UpdateDBLastViewedPosition(m.stateMachine.selectedRecording.RecordingId, m.stateMachine.currentVideoPosition%)
	m.stateMachine.selectedRecording.LastViewedPosition = m.stateMachine.currentVideoPosition%

	aa = {}
	aa.AddReplace("bsMessage", "promptDelete")
	aa.AddReplace("showTitle", m.stateMachine.selectedRecording.Title)
	aa.AddReplace("showRecordingId", stri(m.stateMachine.selectedRecording.RecordingId))
	m.stateMachine.htmlWidget.PostJSMessage(aa)

	stateData.nextState = m.stateMachine.stShowingModalDlg
End Sub


Sub invokeRecordedShowsWhenPlaying()

	' pause video
	m.stateMachine.PausePlayback()

	' save current position
	m.stateMachine.jtr.UpdateDBLastViewedPosition(m.stateMachine.selectedRecording.RecordingId, m.stateMachine.currentVideoPosition%)
	m.stateMachine.selectedRecording.LastViewedPosition = m.stateMachine.currentVideoPosition%

End Sub


Sub invokePauseWhenPlaying(stateData As Object)
	stateData.nextState = m.stateMachine.stPaused
End Sub


Sub invokeQuickSkipWhenPlaying()
	m.stateMachine.QuickSkipVideo()
End Sub


Sub invokeInstantReplayWhenPlaying()
	m.stateMachine.InstantReplayVideo()
End Sub


Sub invokeJumpWhenPlaying()
	m.stateMachine.Jump()
End Sub


Sub invokeFastForwardWhenPlaying(stateData As Object)
	stateData.nextState = m.stateMachine.stFastForwarding
End Sub


Sub invokeRewindWhenPlaying(stateData As Object)
	stateData.nextState = m.stateMachine.stRewinding
End Sub


Function STPlayingEventHandler(event As Object, stateData As Object) As Object

    stateData.nextState = invalid
    
    if type(event) = "roAssociativeArray" then      ' internal message event

        if IsString(event["EventType"]) then
        
			eventMsg$ = event["EventType"]

            if eventMsg$ = "ENTRY_SIGNAL" then
            
                print m.id$ + ": entry signal"

				currentState = {}
				currentState.state = "playing"
				currentState.title = m.stateMachine.selectedRecording.Title
				currentState.recordingId = m.stateMachine.selectedRecording.RecordingId
				currentState.duration = m.stateMachine.selectedRecording.Duration
				currentState.recordingDate = m.stateMachine.selectedRecording.StartDateTime
				currentState.currentTime = m.stateMachine.selectedRecording.LastViewedPosition

				m.stateMachine.jtr.SetCurrentState(currentState)

                return "HANDLED"

            else if eventMsg$ = "EXIT_SIGNAL" then

                print m.id$ + ": exit signal"

			else if eventMsg$ = "FASTFORWARD" then
				m.invokeFastForwardWhenPlaying(stateData)
				return "TRANSITION"        			    
			else if eventMsg$ = "REWIND" then
				m.invokeRewindWhenPlaying(stateData)
				return "TRANSITION"            
			else if eventMsg$ = "PAUSE" then
				m.invokePauseWhenPlaying(stateData)
				return "TRANSITION"
            else if eventMsg$ = "INSTANT_REPLAY" then
				m.invokeInstantReplayWhenPlaying()
				return "HANDLED"
            else if eventMsg$ = "QUICK_SKIP" then
				m.invokeQuickSkipWhenPlaying()
				return "HANDLED"
            else if eventMsg$ = "MENU" then
				m.invokeMenuWhenPlaying(stateData)
				return "HANDLED"
            else if eventMsg$ = "STOP" then
				m.invokeStopWhenPlaying(stateData)
				return "TRANSITION"
            else if eventMsg$ = "RECORDED_SHOWS" then
				m.invokeRecordedShowsWhenPlaying()
				return "HANDLED"
            else if eventMsg$ = "JUMP" then
				m.invokeJumpWhenPlaying()
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
			m.invokeMenuWhenPlaying(stateData)
			' fall through to superState
		else if remoteCommand$ = "STOP" then
			m.invokeStopWhenPlaying(stateData)
			return "TRANSITION"
		else if remoteCommand$ = "RECORDED_SHOWS" then
			m.invokeRecordedShowsWhenPlaying()
			' fall through to superState
		else if remoteCommand$ = "PAUSE" then
			m.invokePauseWhenPlaying(stateData)
			return "TRANSITION"
		else if remoteCommand$ = "QUICK_SKIP" then
			m.invokeQuickSkipWhenPlaying()
			return "HANDLED"
		else if remoteCommand$ = "INSTANT_REPLAY" then
			m.invokeInstantReplayWhenPlaying()
			return "HANDLED"
		else if remoteCommand$ = "JUMP" then
			m.invokeJumpWhenPlaying()
			return "HANDLED"
		else if remoteCommand$ = "FF" then
			m.invokeFastForwardWhenPlaying(stateData)
			return "TRANSITION"            
		else if remoteCommand$ = "RW" then
			m.invokeRewindWhenPlaying(stateData)
			return "TRANSITION"            
		else
			print "unknown remote command ";event
			' stop
		endif

    endif
            
    stateData.nextState = m.superState
    return "SUPER"
    
End Function


Sub invokeMenuWhenPaused()
	' save current position
	m.stateMachine.jtr.UpdateDBLastViewedPosition(m.stateMachine.selectedRecording.RecordingId, m.stateMachine.currentVideoPosition%)
	m.stateMachine.selectedRecording.LastViewedPosition = m.stateMachine.currentVideoPosition%
End Sub


Sub invokePauseWhenPaused(stateData As Object)
	m.stateMachine.ResumePlayback()
	m.stateMachine.StartVideoPlaybackTimer()
	stateData.nextState = m.stateMachine.stPlaying
End Sub


Sub invokePlayWhenPaused(stateData As Object)
	m.stateMachine.ResumePlayback()
	m.stateMachine.StartVideoPlaybackTimer()
	stateData.nextState = m.stateMachine.stPlaying
End Sub


Sub invokeQuickSkipWhenPaused()
	m.stateMachine.QuickSkipVideo()
End Sub


Sub invokeInstantReplayWhenPaused()
	m.stateMachine.InstantReplayVideo()
End Sub


Function STPausedEventHandler(event As Object, stateData As Object) As Object

    stateData.nextState = invalid
    
    if type(event) = "roAssociativeArray" then      ' internal message event

        if IsString(event["EventType"]) then
        
			eventMsg$ = event["EventType"]

            if eventMsg$ = "ENTRY_SIGNAL" then
            
                print m.id$ + ": entry signal"

				m.stateMachine.PausePlayback()

				' update last viewed position in database
				print "update last viewed position for ";m.stateMachine.selectedRecording.RecordingId;" to "; m.stateMachine.currentVideoPosition%
				m.stateMachine.jtr.UpdateDBLastViewedPosition(m.stateMachine.selectedRecording.RecordingId, m.stateMachine.currentVideoPosition%)
				m.stateMachine.selectedRecording.LastViewedPosition = m.stateMachine.currentVideoPosition%

				currentState = m.stateMachine.jtr.GetCurrentState()
				currentState.state = "paused"
				currentState.currentTime = m.stateMachine.selectedRecording.LastViewedPosition
				m.stateMachine.jtr.SetCurrentState(currentState)

                return "HANDLED"

            else if eventMsg$ = "EXIT_SIGNAL" then

                print m.id$ + ": exit signal"
            
            else if eventMsg$ = "RESUME_PLAYBACK" then

				' Replay Guide from browser on PC - Play show selected while show was playing

				' pause current video
'				m.stateMachine.ResumePlayback()

				' save current position
'				m.stateMachine.jtr.UpdateDBLastViewedPosition(m.stateMachine.selectedRecording.RecordingId, m.stateMachine.currentVideoPosition%)
'				m.stateMachine.selectedRecording.LastViewedPosition = m.stateMachine.currentVideoPosition%
				
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

			else if eventMsg$ = "PAUSE" then
				m.invokePauseWhenPaused(stateData)
				return "TRANSITION"
			else if eventMsg$ = "PLAY" then
				m.invokePlayWhenPaused(stateData)
				return "TRANSITION"            
            else if eventMsg$ = "INSTANT_REPLAY" then
				m.invokeInstantReplayWhenPaused()
				return "HANDLED"
            else if eventMsg$ = "QUICK_SKIP" then
				m.invokeQuickSkipWhenPaused()
				return "HANDLED"
            else if eventMsg$ = "MENU" then
				m.invokeMenuWhenPaused()
				' fall through to superState
			else
				' TODO - internal message / play from replay guide
			endif
            
        endif
        
	else if IsRemoteCommand(event) then    

		remoteCommand$ = GetRemoteCommand(event)

		if remoteCommand$ = "MENU" then
			m.invokeMenuWhenPaused()
			' fall through to superState
		else if remoteCommand$ = "PAUSE"
			m.invokePauseWhenPaused(stateData)
			return "TRANSITION"
		else if remoteCommand$ = "PLAY"	
			m.invokePlayWhenPaused(stateData)	
			return "TRANSITION"
		else if remoteCommand$ = "QUICK_SKIP" then
			m.invokeQuickSkipWhenPaused()
			return "HANDLED"
		else if remoteCommand$ = "INSTANT_REPLAY" then
			m.invokeInstantReplayWhenPaused()
			return "HANDLED"
		endif

    endif
            
    stateData.nextState = m.superState
    return "SUPER"
    
End Function


Sub invokeFastForwardWhenFastForwarding()
	m.stateMachine.NextFastForward()
End Sub


Sub invokeMenuWhenFastForwarding()
	' save current position
	m.stateMachine.jtr.UpdateDBLastViewedPosition(m.stateMachine.selectedRecording.RecordingId, m.stateMachine.currentVideoPosition%)
	m.stateMachine.selectedRecording.LastViewedPosition = m.stateMachine.currentVideoPosition%
End Sub


Sub invokePlayWhenFastForwarding(stateData As Object)
	m.stateMachine.ResumePlayback()
	m.stateMachine.StartVideoPlaybackTimer()
	stateData.nextState = m.stateMachine.stPlaying
End Sub


Sub invokePauseWhenFastForwarding(stateData As Object)
	stateData.nextState = m.stateMachine.stPaused
End Sub


Sub invokeQuickSkipWhenFastForwarding()
	' TODO - what if the progress bar is not visible?
	m.stateMachine.JumpToTick(true)
End Sub


Sub invokeInstantReplayWhenFastForwarding()
	' m.stateMachine.InstantReplayVideo()
	' should jump to prior tick mark in progress bar?
End Sub


Function STFastForwardingEventHandler(event As Object, stateData As Object) As Object

    stateData.nextState = invalid
    
    if type(event) = "roAssociativeArray" then      ' internal message event

        if IsString(event["EventType"]) then
        
			eventMsg$ = event["EventType"]

            if eventMsg$ = "ENTRY_SIGNAL" then
            
                print m.id$ + ": entry signal"

				' update last viewed position in database
				print "update last viewed position for ";m.stateMachine.selectedRecording.RecordingId;" to "; m.stateMachine.currentVideoPosition%
				m.stateMachine.jtr.UpdateDBLastViewedPosition(m.stateMachine.selectedRecording.RecordingId, m.stateMachine.currentVideoPosition%)
				m.stateMachine.selectedRecording.LastViewedPosition = m.stateMachine.currentVideoPosition%

				m.stateMachine.playbackSpeedIndex% = m.stateMachine.normalPlaybackSpeedIndex% + 1
				playbackSpeed = m.stateMachine.playbackSpeeds[m.stateMachine.playbackSpeedIndex%]

				m.stateMachine.videoPlayer.SetPlaybackSpeed(playbackSpeed)

				currentState = m.stateMachine.jtr.GetCurrentState()
				currentState.state = "fastForward"
				currentState.currentTime = m.stateMachine.selectedRecording.LastViewedPosition
				m.stateMachine.jtr.SetCurrentState(currentState)

                return "HANDLED"

            else if eventMsg$ = "EXIT_SIGNAL" then
                print m.id$ + ": exit signal"
			else if eventMsg$ = "PLAY" then
				m.invokePlayWhenFastForwarding(stateData)
				return "TRANSITION"
			else if eventMsg$ = "PAUSE" then
				m.invokePauseWhenFastForwarding(stateData)
				return "TRANSITION"
			else if eventMsg$ = "FASTFORWARD" then
				m.invokeFastForwardWhenFastForwarding()
				return "HANDLED"
			else if eventMsg$ = "MENU" then
				m.invokeMenuWhenFastForwarding()
				return "HANDLED"
			else if eventMsg$ = "QUICK_SKIP" then
				m.invokeQuickSkipWhenFastForwarding()
				return "HANDLED"
			else if eventMsg$ = "INSTANT_REPLAY" then
				m.invokeInstantReplayWhenFastForwarding()				    
				return "HANDLED"
			else
				' TODO - internal message / play from replay guide
			endif
            
        endif
        
	else if IsRemoteCommand(event) then    

		remoteCommand$ = GetRemoteCommand(event)

		if remoteCommand$ = "FF" then
			m.invokeFastForwardWhenFastForwarding()
			return "HANDLED"
		else if remoteCommand$ = "MENU" then
			m.invokeMenuWhenFastForwarding()
			' fall through to superState
		else if remoteCommand$ = "PLAY" then
			m.invokePlayWhenFastForwarding(stateData)
			return "TRANSITION"
		else if remoteCommand$ = "PAUSE" then
			m.invokePauseWhenFastForwarding(stateData)
			return "TRANSITION"
		else if remoteCommand$ = "QUICK_SKIP" then
			m.invokeQuickSkipWhenFastForwarding()
			return "HANDLED"
		else if remoteCommand$ = "INSTANT_REPLAY" then
			m.invokeInstantReplayWhenFastForwarding()
			return "HANDLED"
		' Jump
		' Play
		' Rewind
		endif

    endif
            
    stateData.nextState = m.superState
    return "SUPER"
    
End Function


Function NextFastForward()

	m.playbackSpeedIndex% = m.playbackSpeedIndex% + 1
	if m.playbackSpeedIndex% >= m.playbackSpeeds.Count() then
		m.playbackSpeedIndex% = m.normalPlaybackSpeedIndex% + 1
	endif

	playbackSpeed = m.playbackSpeeds[m.playbackSpeedIndex%]
	m.videoPlayer.SetPlaybackSpeed(playbackSpeed)

End Function


Function NextRewind()

	m.playbackSpeedIndex% = m.playbackSpeedIndex% - 1
	if m.playbackSpeedIndex% < 0 then
		m.playbackSpeedIndex% = m.normalPlaybackSpeedIndex% - 1
	endif

	playbackSpeed = m.playbackSpeeds[m.playbackSpeedIndex%]
	print "setplaybackspeed to ";playbackSpeed
	m.videoPlayer.SetPlaybackSpeed(playbackSpeed)

End Function


Sub invokeRewindWhenRewinding()
	m.stateMachine.NextRewind()
End Sub


Sub invokeMenuWhenRewinding()
	' save current position
	m.stateMachine.jtr.UpdateDBLastViewedPosition(m.stateMachine.selectedRecording.RecordingId, m.stateMachine.currentVideoPosition%)
	m.stateMachine.selectedRecording.LastViewedPosition = m.stateMachine.currentVideoPosition%
End Sub


Sub invokePlayWhenRewinding(stateData As Object)
	m.stateMachine.ResumePlayback()
	m.stateMachine.StartVideoPlaybackTimer()
	stateData.nextState = m.stateMachine.stPlaying
End Sub


Sub invokePauseWhenRewinding(stateData As Object)
	stateData.nextState = m.stateMachine.stPaused
End Sub


Sub invokeQuickSkipWhenRewinding()
	' TODO - what if the progress bar is not visible?
	' should jump to prior tick mark in progress bar
End Sub


Sub invokeInstantReplayWhenRewinding()
	m.stateMachine.JumpToTick(false)
End Sub


Function STRewindingEventHandler(event As Object, stateData As Object) As Object

    stateData.nextState = invalid
    
    if type(event) = "roAssociativeArray" then      ' internal message event

        if IsString(event["EventType"]) then
        
			eventMsg$ = event["EventType"]

            if eventMsg$ = "ENTRY_SIGNAL" then
            
                print m.id$ + ": entry signal"

				' update last viewed position in database
				print "update last viewed position for ";m.stateMachine.selectedRecording.RecordingId;" to "; m.stateMachine.currentVideoPosition%
				m.stateMachine.jtr.UpdateDBLastViewedPosition(m.stateMachine.selectedRecording.RecordingId, m.stateMachine.currentVideoPosition%)
				m.stateMachine.selectedRecording.LastViewedPosition = m.stateMachine.currentVideoPosition%

				m.stateMachine.playbackSpeedIndex% = m.stateMachine.normalPlaybackSpeedIndex% - 1
				playbackSpeed = m.stateMachine.playbackSpeeds[m.stateMachine.playbackSpeedIndex%]

				m.stateMachine.videoPlayer.SetPlaybackSpeed(playbackSpeed)

				currentState = m.stateMachine.jtr.GetCurrentState()
				currentState.state = "rewind"
				currentState.currentTime = m.stateMachine.selectedRecording.LastViewedPosition
				m.stateMachine.jtr.SetCurrentState(currentState)

                return "HANDLED"

            else if eventMsg$ = "EXIT_SIGNAL" then

                print m.id$ + ": exit signal"
            
			else if eventMsg$ = "PLAY" then
				m.invokePlayWhenRewinding(stateData)
				return "TRANSITION"
			else if eventMsg$ = "PAUSE" then
				m.invokePauseWhenRewinding(stateData)
				return "TRANSITION"
			else if eventMsg$ = "REWIND" then
				m.invokeRewindWhenRewinding()
				return "HANDLED"            
			else if eventMsg$ = "MENU" then
				m.invokeMenuWhenRewinding()
				' fall through to superState
			else if eventMsg$ = "QUICK_SKIP" then
				m.invokeQuickSkipWhenRewinding()
				return "HANDLED"
			else if eventMsg$ = "INSTANT_REPLAY" then
				m.invokeInstantReplayWhenRewinding()
				return "HANDLED"
			else
				' TODO - internal message / play from replay guide
			endif
            
        endif
        
	else if IsRemoteCommand(event) then    

		remoteCommand$ = GetRemoteCommand(event)

		if remoteCommand$ = "RW" then
			m.invokeRewindWhenRewinding()
			return "HANDLED"
		else if remoteCommand$ = "MENU" then
			m.invokeMenuWhenRewinding()
			' fall through to superState
		else if remoteCommand$ = "PLAY" then
			m.invokePlayWhenRewinding(stateData)
			return "TRANSITION"
		else if remoteCommand$ = "PAUSE"
			m.invokePauseWhenRewinding(stateData)
			return "TRANSITION"
		else if remoteCommand$ = "QUICK_SKIP" then
			m.invokeQuickSkipWhenRewinding()
			return "HANDLED"
		else if remoteCommand$ = "INSTANT_REPLAY" then
			m.invokeInstantReplayWhenRewinding()
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

	m.StartVideoPlaybackTimer()

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
	m.htmlWidget.SetLocalStorageDir("localstorage")
	m.htmlWidget.SetLocalStorageQuota(1 * 1024 * 1024)

	m.htmlWidget.SetUrl("file:///webSite/index.html")

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


Sub JumpToTick(movingForward As Boolean)

	currentPosition% = m.currentVideoPosition%
	numTicksPassed% = currentPosition% / (m.minutesPerTick * 60)

	if movingForward then
		if numTicksPassed% < m.numTicks then
			jumpToTick% = numTicksPassed% + 1
			jumpTo% = jumpToTick% * m.minutesPerTick * 60
		else
			jumpTo% = m.selectedRecording.Duration*60
		endif
	else
		if numTicksPassed% > 0 then
			jumpToTick% = numTicksPassed%
			jumpTo% = jumpToTick% * m.minutesPerTick * 60
		else
			jumpTo% = 0
		endif
	endif

	print "Jump to ";jumpTo%

	m.currentVideoPosition% = jumpTo%

	m.UpdateProgressBar()
	m.SeekToCurrentVideoPosition()

End Sub


