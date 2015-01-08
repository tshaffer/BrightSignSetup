Function newDisplayEngine(jtr As Object) As Object

    DisplayEngine = newHSM()
    DisplayEngine.InitialPseudostateHandler = InitializeDisplayEngine

	DisplayEngine.jtr = jtr
	DisplayEngine.msgPort = jtr.msgPort

	DisplayEngine.LaunchVideo					= LaunchVideo
	DisplayEngine.PauseVideo					= PauseVideo
	DisplayEngine.ResumeVideo					= ResumeVideo
	DisplayEngine.QuickSkipVideo				= QuickSkipVideo
	DisplayEngine.InstantReplayVideo			= InstantReplayVideo
	DisplayEngine.FastForwardVideo				= FastForwardVideo
	DisplayEngine.RewindVideo					= RewindVideo
	DisplayEngine.Jump							= Jump
	DisplayEngine.SeekToCurrentVideoPosition	= SeekToCurrentVideoPosition
	DisplayEngine.UpdateProgressBar				= UpdateProgressBar

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

				m.stateMachine.videoProgressTimer = CreateObject("roTimer")
				m.stateMachine.videoProgressTimer.SetPort(m.stateMachine.msgPort)
				m.stateMachine.videoProgressTimer.SetElapsed(1, 0)
				m.stateMachine.videoProgressTimer.Start()

				stateData.nextState = m.stateMachine.stPlaying
				return "TRANSITION"            
            
			endif
            
        endif
        
	else if type(event) = "roIRRemotePress" then

		remoteCommand$ = GetRemoteCommand(event)

		if remoteCommand$ = "MENU" then

			' TBD - UI unclear - may not want to remove UI on this key
			' TBD - probably just send a message to js that key was hit. let it decide what to do
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
			if remoteCommand$ = "NORTH" then
				commandToHtml$ = "Up"
			else if remoteCommand$ = "SOUTH" then
				commandToHtml$ = "Down"
			else if remoteCommand$ = "WEST" then
				commandToHtml$ = "Left"
			else if remoteCommand$ = "EAST" then
				commandToHtml$ = "Right"
			else if remoteCommand$ = "SEL" then
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
		if type(m.stateMachine.videoProgressTimer) = "roTimer" and stri(m.stateMachine.videoProgressTimer.GetIdentity()) = eventIdentity$ then
			m.stateMachine.currentVideoPosition% = m.stateMachine.currentVideoPosition% + 1
			print "m.stateMachine.currentVideoPosition%=";m.stateMachine.currentVideoPosition%
			m.stateMachine.videoProgressTimer.Start()

			' TODO - update the database once per minute

			m.stateMachine.UpdateProgressBar()

			return "HANDLED"
		endif

	else if type(event) = "roIRRemotePress" then
	
		remoteCommand$ = GetRemoteCommand(event)

		if remoteCommand$ = "MENU" then

			' TODO - undisplay overlay graphics

			' send message to js to display the menu
			aa = {}
			aa.AddReplace("bsMessage", "showMenu")
			m.stateMachine.htmlWidget.PostJSMessage(aa)
			
			stateData.nextState = m.stateMachine.stShowingUI
			return "TRANSITION"            

		else if remoteCommand$ = "VOLUP" then
			aa = {}
			aa.AddReplace("bsMessage", "togglePlayIcon")
			m.stateMachine.htmlWidget.PostJSMessage(aa)

			return "HANDLED"

		else if remoteCommand$ = "VOLDWN" then

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

				' Is this legit?
'				if m.stateMachine.currentVideoPosition% = 0 then
'					m.stateMachine.LaunchVideo()
'				else
'					m.stateMachine.ResumeVideo()
'				endif

                return "HANDLED"

            else if event["EventType"] = "EXIT_SIGNAL" then

                print m.id$ + ": exit signal"
            
            else if event["EventType"] = "RESUME_PLAYBACK" then

				' Replay Guide from browser on PC - Play show selected while show was playing

				' pause video
				m.stateMachine.PauseVideo()

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
        
	else if type(event) = "roIRRemotePress" then
	
		remoteCommand$ = GetRemoteCommand(event)

		if remoteCommand$ = "MENU" then

			' pause video
			m.stateMachine.PauseVideo()

			' save current position
			m.stateMachine.jtr.UpdateDBLastViewedPosition(m.stateMachine.selectedRecording.RecordingId, m.stateMachine.currentVideoPosition%)
			m.stateMachine.selectedRecording.LastViewedPosition = m.stateMachine.currentVideoPosition%

			' fall through to superState

		else if remoteCommand$ = "PAUSE" then
			stateData.nextState = m.stateMachine.stPaused
			return "TRANSITION"
		else if remoteCommand$ = "REPEAT" then
			m.stateMachine.QuickSkipVideo()
			return "HANDLED"
		else if remoteCommand$ = "ADD" then
			m.stateMachine.InstantReplayVideo()
			return "HANDLED"
		else if remoteCommand$ = "SEARCH" then
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

				' update last viewed position in database
				print "update last viewed position for ";m.stateMachine.selectedRecording.RecordingId;" to "; m.stateMachine.currentVideoPosition%
				m.stateMachine.jtr.UpdateDBLastViewedPosition(m.stateMachine.selectedRecording.RecordingId, m.stateMachine.currentVideoPosition%)
				m.stateMachine.selectedRecording.LastViewedPosition = m.stateMachine.currentVideoPosition%

                return "HANDLED"

            else if event["EventType"] = "EXIT_SIGNAL" then

                print m.id$ + ": exit signal"
            
			else
				' TODO - internal message / play from replay guide
			endif
            
        endif
        
	else if type(event) = "roIRRemotePress" then

		remoteCommand$ = GetRemoteCommand(event)

		if remoteCommand$ = "MENU" then

			' save current position
			m.stateMachine.jtr.UpdateDBLastViewedPosition(m.stateMachine.selectedRecording.RecordingId, m.stateMachine.currentVideoPosition%)
			m.stateMachine.selectedRecording.LastViewedPosition = m.stateMachine.currentVideoPosition%

			' fall through to superState

		else if remoteCommand$ = "PAUSE" or remoteCommand$ = "PLAY"
			' TBD - watch out for case where EXIT is hit when the UI is up
			' TBD - is the following statement still true? temporary and wrong - playing restarts the video; it doesn't resume it.

			' unpause video before changing state
			ok = m.stateMachine.videoPlayer.Resume()
			if not ok stop

			m.stateMachine.videoProgressTimer.SetPort(m.stateMachine.msgPort)
			m.stateMachine.videoProgressTimer.SetElapsed(1, 0)
			m.stateMachine.videoProgressTimer.Start()
			ok = m.stateMachine.videoProgressTimer.Start()
			if not ok stop

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
	' if not ok stop - false is returned if video is already paused

	m.videoProgressTimer.Stop()

End Sub


' currently called after being paused or when launched from replay guide and not starting from the beginning
Sub ResumeVideo()
stop
' does resume work if it wasn't playing? No.
	ok = m.videoPlayer.Resume()
	if not ok then		' implies playback doesn't start from the beginning (error is because playback isn't active in any way)
		
		ok = m.videoPlayer.PlayFile(m.selectedRecording.Path)
		if not ok stop

		m.SeekToCurrentVideoPosition()

		if type(m.videoProgressTimer) <> "roTimer" then
			m.videoProgressTimer = CreateObject("roTimer")
			m.videoProgressTimer.SetPort(m.msgPort)
			m.videoProgressTimer.SetElapsed(1, 0)
		endif

	else
		stop
	endif

	m.videoProgressTimer.Start()

End Sub


Sub QuickSkipVideo()

	m.currentVideoPosition% = m.currentVideoPosition% + 10	' quick skip currently jumps ahead 10 seconds

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


Sub FastForwardVideo()
End Sub


Sub RewindVideo()
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

