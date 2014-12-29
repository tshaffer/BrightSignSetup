Function newPlaybackEngine(jtr As Object) As Object

    PlaybackEngine = newHSM()
    PlaybackEngine.InitialPseudostateHandler = InitializePlaybackEngine

	PlaybackEngine.jtr = jtr
	PlaybackEngine.msgPort = jtr.msgPort

	PlaybackEngine.LaunchVideo					= LaunchVideo
	PlaybackEngine.PauseVideo					= PauseVideo
	PlaybackEngine.ResumeVideo					= ResumeVideo
	PlaybackEngine.QuickSkipVideo				= QuickSkipVideo
	PlaybackEngine.InstantReplayVideo			= InstantReplayVideo
	PlaybackEngine.FastForwardVideo				= FastForwardVideo
	PlaybackEngine.RewindVideo					= RewindVideo
	PlaybackEngine.Jump							= Jump
	PlaybackEngine.SeekToCurrentVideoPosition	= SeekToCurrentVideoPosition

    PlaybackEngine.stTop = PlaybackEngine.newHState(PlaybackEngine, "Top")
    PlaybackEngine.stTop.HStateEventHandler = STTopEventHandler

    PlaybackEngine.stPlaybackController = PlaybackEngine.newHState(PlaybackEngine, "PlaybackController")
    PlaybackEngine.stPlaybackController.HStateEventHandler = STPlaybackControllerEventHandler
	PlaybackEngine.stPlaybackController.superState = PlaybackEngine.stTop

    PlaybackEngine.stIdle = PlaybackEngine.newHState(PlaybackEngine, "PlaybackIdle")
    PlaybackEngine.stIdle.HStateEventHandler = STPlaybackIdleEventHandler
	PlaybackEngine.stIdle.superState = PlaybackEngine.stPlaybackController

    PlaybackEngine.stPlaying = PlaybackEngine.newHState(PlaybackEngine, "Playing")
    PlaybackEngine.stPlaying.HStateEventHandler = STPlayingEventHandler
	PlaybackEngine.stPlaying.superState = PlaybackEngine.stPlaybackController

    PlaybackEngine.stPaused = PlaybackEngine.newHState(PlaybackEngine, "Paused")
    PlaybackEngine.stPaused.HStateEventHandler = STPausedEventHandler
	PlaybackEngine.stPaused.superState = PlaybackEngine.stPlaybackController

	PlaybackEngine.topState = PlaybackEngine.stTop

	return PlaybackEngine

End Function


Function InitializePlaybackEngine() As Object

	m.videoPlayer = CreateObject("roVideoPlayer")
	m.videoPlayer.SetPort(m.msgPort)
    m.videoPlayer.SetLoopMode(0)

	m.currentVideoPosition% = 0
	m.selectedRecording = invalid
	m.priorSelectedRecording = invalid

	return m.stIdle

End Function


Function STPlaybackControllerEventHandler(event As Object, stateData As Object) As Object

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
		if type(m.stateMachine.videoProgressTimer) = "roTimer" and stri(m.stateMachine.videoProgressTimer.GetIdentity()) = eventIdentity$ then
			m.stateMachine.currentVideoPosition% = m.stateMachine.currentVideoPosition% + 1
			print "m.stateMachine.currentVideoPosition%=";m.stateMachine.currentVideoPosition%
			m.stateMachine.videoProgressTimer.Start()
		endif

	else if type(event) = "roIRRemotePress" then
	
		if GetRemoteCommand(event) = "MENU" then
			m.stateMachine.jtr.LaunchWebkit()
			return "HANDLED"
		endif

    endif
            
    stateData.nextState = m.superState
    return "SUPER"
    
End Function


Function STPlaybackIdleEventHandler(event As Object, stateData As Object) As Object

    stateData.nextState = invalid
    
    if type(event) = "roAssociativeArray" then      ' internal message event

        if IsString(event["EventType"]) then
        
            if event["EventType"] = "ENTRY_SIGNAL" then
            
                print m.id$ + ": entry signal"

                return "HANDLED"

            else if event["EventType"] = "EXIT_SIGNAL" then

                print m.id$ + ": exit signal"

            else if event["EventType"] = "PLAY_RECORDING" then
				
				m.stateMachine.priorSelectedRecording = m.stateMachine.selectedRecording
				if type(m.stateMachine.priorSelectedRecording) = "roAssociativeArray" then
					m.stateMachine.priorSelectedRecording.currentVideoPosition% = m.stateMachine.currentVideoPosition%
				endif

				m.stateMachine.selectedRecording = event["Recording"]
				m.stateMachine.currentVideoPosition% = 0
				stateData.nextState = m.stateMachine.stPlaying
				return "TRANSITION"            
			endif
            
        endif
        
	else if type(event) = "roIRRemotePress" then
	
		if GetRemoteCommand(event) = "PLAY" then

stop
' need a recording object

			' hardcode for now
'			fileName$ = "20141221T093400.ts"
			m.stateMachine.selectedFile$ = "20141221T093400.mp4"
			m.stateMachine.currentVideoPosition% = 0
			stateData.nextState = m.stateMachine.stPlaying
			return "TRANSITION"
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

				' Is this legit?
				if m.stateMachine.currentVideoPosition% = 0 then
					m.stateMachine.LaunchVideo()
				else
					m.stateMachine.ResumeVideo()
				endif

                return "HANDLED"

            else if event["EventType"] = "EXIT_SIGNAL" then

                print m.id$ + ": exit signal"
            
            else if event["EventType"] = "PLAY_RECORDING" then

				m.stateMachine.priorSelectedRecording = m.stateMachine.selectedRecording
				if type(m.stateMachine.priorSelectedRecording) = "roAssociativeArray" then
					m.stateMachine.priorSelectedRecording.currentVideoPosition% = m.stateMachine.currentVideoPosition%
				endif

				recording = event["Recording"]
				m.stateMachine.selectedRecording = recording
				m.stateMachine.currentVideoPosition% = 0
				m.stateMachine.LaunchVideo()
				return "HANDLED"            
			endif
            
        endif
        
	else if type(event) = "roIRRemotePress" then
	
		remoteCommand$ = GetRemoteCommand(event)

		if remoteCommand$ = "PAUSE" then
			stateData.nextState = m.stateMachine.stPaused
			return "TRANSITION"
		else if remoteCommand$ = "REPEAT" then
			m.stateMachine.QuickSkipVideo()
			return "HANDLED"
		else if remoteCommand$ = "ADD" then
			m.stateMachine.InstantReplayVideo()
			return "HANDLED"
		else if remoteCommand$ = "EXIT" then
			m.stateMachine.Jump()
			return "HANDLED"
		else if remoteCommand$ = "FF" then
			m.FastForwardVideo()
		else if remoteCommand$ = "RW" then
			m.RewindVideo()
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

				m.stateMachine.PauseVideo()

                return "HANDLED"

            else if event["EventType"] = "EXIT_SIGNAL" then

                print m.id$ + ": exit signal"
            
			endif
            
        endif
        
	else if type(event) = "roIRRemotePress" then

		remoteCommand$ = GetRemoteCommand(event)
		if remoteCommand$ = "PAUSE" or remoteCommand$ = "PLAY"
			' temporary and wrong - playing restarts the video; it doesn't resume it.
			stateData.nextState = m.stateMachine.stPlaying
			return "TRANSITION"
		else if remoteCommand$ = "REPEAT" then
			m.stateMachine.QuickSkipVideo()
			return "HANDLED"
		else if remoteCommand$ = "ADD" then
			m.stateMachine.InstantReplayVideo()
			return "HANDLED"
		endif

    endif
            
    stateData.nextState = m.superState
    return "SUPER"
    
End Function


Function STPlaybackEngineFillInNameEventHandler(event As Object, stateData As Object) As Object

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
        
    endif
            
    stateData.nextState = m.superState
    return "SUPER"
    
End Function


Function GetRemoteCommand(event As Object) As String

	remoteEvent% = event.GetInt()
	remoteEvent$ = ConvertToRemoteCommand(remoteEvent%)
	print "remoteEvent=";remoteEvent$
	return remoteEvent$

End Function


Sub LaunchVideo()

	print "LaunchVideo"

	ok = m.videoPlayer.PlayFile(m.selectedRecording.Path)
	if not ok stop

	m.videoProgressTimer = CreateObject("roTimer")
	m.videoProgressTimer.SetPort(m.msgPort)
	m.videoProgressTimer.SetElapsed(1, 0)
	m.videoProgressTimer.Start()

End Sub


Sub PauseVideo()
				
	ok = m.videoPlayer.Pause()
	if not ok stop

	m.videoProgressTimer.Stop()

End Sub


Sub ResumeVideo()

	ok = m.videoPlayer.Resume()
	if not ok stop

	m.videoProgressTimer.Start()

End Sub


Sub QuickSkipVideo()

	m.currentVideoPosition% = m.currentVideoPosition% + 10	' quick skip currently jumps ahead 10 seconds

	m.SeekToCurrentVideoPosition()

End Sub


Sub InstantReplayVideo()

	m.currentVideoPosition% = m.currentVideoPosition% - 7		' instant replay currently goes back 7 seconds
	if m.currentVideoPosition% < 0 then
		m.currentVideoPosition% = 0
	endif

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

	if type(m.priorSelectedRecording) <> "roAssociativeArray" then
		print "No prior recording"
		return
	endif

	tmpRecording = m.selectedRecording
	priorSelectedRecordingVideoPosition% = m.priorSelectedRecording.currentVideoPosition%
	m.selectedRecording = m.priorSelectedRecording
	m.priorSelectedRecording = tmpRecording
	m.priorSelectedRecording.currentVideoPosition% = m.currentVideoPosition%

	ok = m.videoPlayer.PlayFile(m.selectedRecording.Path)
	if not ok stop

	' seek to last watched position
	m.currentVideoPosition% = priorSelectedRecordingVideoPosition%
	m.SeekToCurrentVideoPosition()

End Sub


Sub FastForwardVideo()
End Sub

Sub RewindVideo()
End Sub

