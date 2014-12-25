Function newRecordingEngine(jtr As Object) As Object

    RecordingEngine = newHSM()
    RecordingEngine.InitialPseudostateHandler = InitializeRecordingEngine

	RecordingEngine.jtr = jtr
	RecordingEngine.msgPort = jtr.msgPort

    RecordingEngine.stTop = RecordingEngine.newHState(RecordingEngine, "Top")
    RecordingEngine.stTop.HStateEventHandler = STTopEventHandler

    RecordingEngine.stRecordingController = RecordingEngine.newHState(RecordingEngine, "RecordingController")
    RecordingEngine.stRecordingController.HStateEventHandler = STRecordingControllerEventHandler
    RecordingEngine.stRecordingController.AddManualRecord = AddManualRecord
	RecordingEngine.stRecordingController.superState = RecordingEngine.stTop

    RecordingEngine.stIdle = RecordingEngine.newHState(RecordingEngine, "RecordingIdle")
    RecordingEngine.stIdle.HStateEventHandler = STRecordingIdleEventHandler
	RecordingEngine.stIdle.superState = RecordingEngine.stRecordingController

    RecordingEngine.stRecording = RecordingEngine.newHState(RecordingEngine, "Recording")
    RecordingEngine.stRecording.HStateEventHandler = STRecordingEventHandler
	RecordingEngine.stRecording.superState = RecordingEngine.stRecordingController
	RecordingEngine.stRecording.StartManualRecord = StartManualRecord
	RecordingEngine.stRecording.EndManualRecord	= EndManualRecord
	RecordingEngine.stRecording.StopRecord = StopRecord
	RecordingEngine.stRecording.Tune = Tune

	RecordingEngine.topState = RecordingEngine.stTop

	return RecordingEngine

End Function


Function InitializeRecordingEngine() As Object

	m.contentFolder = "Content/"

	m.scheduledRecordings = {}
	m.recordingInProgressTimerId$ = ""

	m.mediaStreamer = CreateObject("roMediaStreamer")

	return m.stIdle

End Function


Function STRecordingControllerEventHandler(event As Object, stateData As Object) As Object

    stateData.nextState = invalid
    
    if type(event) = "roAssociativeArray" then      ' internal message event

        if IsString(event["EventType"]) then
        
            if event["EventType"] = "ENTRY_SIGNAL" then
            
                print m.id$ + ": entry signal"

                return "HANDLED"

            else if event["EventType"] = "EXIT_SIGNAL" then

                print m.id$ + ": exit signal"
            
            else if event["EventType"] = "ADD_MANUAL_RECORD" then

				m.AddManualRecord(event["Title"], event["Channel"], event["DateTime"], event["Duration"], event["UseTuner"])

				return "HANDLED"

			endif
            
        endif
        
    endif
            
    stateData.nextState = m.superState
    return "SUPER"
    
End Function



Function STRecordingIdleEventHandler(event As Object, stateData As Object) As Object

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

		' check for a scheduled recording
		for each scheduledRecordingTimerIdentity in m.stateMachine.scheduledRecordings
			if eventIdentity$ = scheduledRecordingTimerIdentity then
				m.stateMachine.scheduledRecording = m.stateMachine.scheduledRecordings[scheduledRecordingTimerIdentity]
				stateData.nextState = m.stateMachine.stRecording
				return "TRANSITION"
				exit for
			endif
		next

    endif
            
    stateData.nextState = m.superState
    return "SUPER"
    
End Function


Function STRecordingEventHandler(event As Object, stateData As Object) As Object

    stateData.nextState = invalid
    
    if type(event) = "roAssociativeArray" then      ' internal message event

        if IsString(event["EventType"]) then
        
            if event["EventType"] = "ENTRY_SIGNAL" then

                print m.id$ + ": entry signal"

				m.StartManualRecord(m.stateMachine.scheduledRecording)

                return "HANDLED"

            else if event["EventType"] = "EXIT_SIGNAL" then

                print m.id$ + ": exit signal"
            
			endif
            
        endif
        
	else if type(event) = "roTimerEvent" then

		eventIdentity$ = stri(event.GetSourceIdentity())

		' check for a recording in progress
		if type(m.endRecordingTimer) = "roTimer" and stri(m.endRecordingTimer.GetIdentity()) = eventIdentity$ then
			for each scheduledRecordingTimerIdentity in m.stateMachine.scheduledRecordings
				if scheduledRecordingTimerIdentity = m.stateMachine.recordingInProgressTimerId$ then
					scheduledRecording = m.stateMachine.scheduledRecordings[scheduledRecordingTimerIdentity]
					m.EndManualRecord(scheduledRecordingTimerIdentity, scheduledRecording)
					stateData.nextState = m.stateMachine.stIdle
					return "TRANSITION"
				endif
			next
			return "HANDLED"
		endif

    endif
            
    stateData.nextState = m.superState
    return "SUPER"
    
End Function


Sub AddManualRecord(title$, channel$ As String, dateTime As Object, duration% As Integer, useTuner$ As String)

	print "Add scheduledRecording: " + title$ + " to begin at " + dateTime.GetString()

	timer = CreateObject("roTimer")
	timer.SetPort(m.stateMachine.msgPort)
	timer.SetDateTime(dateTime)

	scheduledRecording = {}
	scheduledRecording.timerId$ = stri(timer.GetIdentity())
	scheduledRecording.title$ = title$
	scheduledRecording.channel$ = channel$
	scheduledRecording.dateTime = dateTime
	scheduledRecording.duration% = duration%
	scheduledRecording.timer = timer

	timer.Start()

	m.stateMachine.scheduledRecordings.AddReplace(scheduledRecording.timerId$, scheduledRecording)

End Sub


Sub StartManualRecord(scheduledRecording As Object)

	print "StartManualRecord " + scheduledRecording.title$ + " scheduled for " + scheduledRecording.dateTime.GetString()

	' tune channel
	m.Tune(scheduledRecording.channel$)

	endDateTime = scheduledRecording.dateTime
	endDateTime.AddSeconds(scheduledRecording.duration% * 60)

	print "Manual record will end at " + endDateTime.GetString()

	m.endRecordingTimer = CreateObject("roTimer")
	m.endRecordingTimer.SetPort(m.stateMachine.msgPort)
	m.endRecordingTimer.SetDateTime(endDateTime)
	m.endRecordingTimer.Start()

	m.stateMachine.recordingInProgressTimerId$ = scheduledRecording.timerId$

	' start recording
	scheduledRecording.path$ = m.stateMachine.contentFolder + Left(scheduledRecording.dateTime.ToIsoString(), 15) + ".ts"

	if type(m.stateMachine.mediaStreamer) = "roMediaStreamer" then

'		ok = m.mediaStreamer.SetPipeline("hdmi:,encoder:,file:///myfilename.ts")
'		ok = m.stateMachine.mediaStreamer.SetPipeline("hdmi:,encoder:,file:///" + scheduledRecording.path$)
		ok = m.stateMachine.mediaStreamer.SetPipeline("hdmi:,encoder:,file:///" + scheduledRecording.path$)
		if not ok then stop

		ok = m.stateMachine.mediaStreamer.Start()
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

	' Add or uppate record in database
	m.stateMachine.jtr.AddDBRecording(scheduledRecording)

	' Remove from list of pending records
	ok = m.stateMachine.scheduledRecordings.Delete(scheduledRecordingTimerIdentity)
	if not ok then stop

End Sub


Sub StopRecord()

print "StopRecord"

	ok = m.stateMachine.mediaStreamer.Stop()
	if not ok then stop

End Sub






