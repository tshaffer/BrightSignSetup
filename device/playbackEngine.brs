Function newPlaybackEngine(jtr As Object) As Object

    PlaybackEngine = newHSM()
    PlaybackEngine.InitialPseudostateHandler = InitializePlaybackEngine

	PlaybackEngine.msgPort = jtr.msgPort

'	PlaybackEngine.InitializeDisplay			= playbackEngine_Initialize

    PlaybackEngine.stTop = PlaybackEngine.newHState(PlaybackEngine, "Top")
    PlaybackEngine.stTop.HStateEventHandler = STTopEventHandler

    PlaybackEngine.stIdle = PlaybackEngine.newHState(PlaybackEngine, "PlaybackIdle")
    PlaybackEngine.stIdle.HStateEventHandler = STPlaybackEngineIdleEventHandler
	PlaybackEngine.stIdle.superState = PlaybackEngine.stTop

    PlaybackEngine.stPlaying = PlaybackEngine.newHState(PlaybackEngine, "Playing")
	PlaybackEngine.stPlaying.LaunchVideo = LaunchVideo
    PlaybackEngine.stPlaying.HStateEventHandler = STPlayingEventHandler
	PlaybackEngine.stPlaying.superState = PlaybackEngine.stTop

    PlaybackEngine.stPaused = PlaybackEngine.newHState(PlaybackEngine, "Paused")
    PlaybackEngine.stPaused.HStateEventHandler = STPausedEventHandler
	PlaybackEngine.stPaused.superState = PlaybackEngine.stTop

	PlaybackEngine.topState = PlaybackEngine.stTop

	return PlaybackEngine

End Function


Function InitializePlaybackEngine() As Object

	m.videoPlayer = CreateObject("roVideoPlayer")
	m.videoPlayer.SetPort(m.msgPort)
    m.videoPlayer.SetLoopMode(0)

	return m.stIdle

End Function


Function STPlaybackEngineIdleEventHandler(event As Object, stateData As Object) As Object

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
        
	else if type(event) = "roIRRemotePress" then
	
		remoteEvent% = event.GetInt()
		remoteEvent$ = ConvertToRemoteCommand(remoteEvent%)
		print "remoteEvent=";remoteEvent$


		if remoteEvent$ = "PLAY" then

			' hardcode for now
'			fileName$ = "20141221T093400.ts"
			m.stateMachine.selectedFile$ = "20141221T093400.mp4"
			stateData.nextState = m.stateMachine.stPlaying
			return "TRANSITION"
		endif

    endif
            
    stateData.nextState = m.superState
    return "SUPER"
    
End Function


Sub LaunchVideo()

	print "LaunchVideo"

	m.stateMachine.currentVideoPosition% = 0

	ok = m.stateMachine.videoPlayer.PlayFile(m.stateMachine.selectedFile$)
	if not ok stop

	m.stateMachine.videoProgressTimer = CreateObject("roTimer")
	m.stateMachine.videoProgressTimer.SetPort(m.stateMachine.msgPort)
	m.stateMachine.videoProgressTimer.SetElapsed(1, 0)
	m.stateMachine.videoProgressTimer.Start()

End Sub


Function STPlayingEventHandler(event As Object, stateData As Object) As Object

    stateData.nextState = invalid
    
    if type(event) = "roAssociativeArray" then      ' internal message event

        if IsString(event["EventType"]) then
        
            if event["EventType"] = "ENTRY_SIGNAL" then
            
                print m.id$ + ": entry signal"

				m.LaunchVideo()

                return "HANDLED"

            else if event["EventType"] = "EXIT_SIGNAL" then

                print m.id$ + ": exit signal"
            
			endif
            
        endif
        
	else if type(event) = "roIRRemotePress" then
	
		remoteEvent% = event.GetInt()
		remoteEvent$ = ConvertToRemoteCommand(remoteEvent%)
		print "remoteEvent=";remoteEvent$

		if remoteEvent$ = "PAUSE" then
			stateData.nextState = m.stateMachine.stPaused
			return "TRANSITION"
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

                return "HANDLED"

            else if event["EventType"] = "EXIT_SIGNAL" then

                print m.id$ + ": exit signal"
            
			endif
            
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


