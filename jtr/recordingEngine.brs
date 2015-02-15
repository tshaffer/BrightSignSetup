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
	RecordingEngine.stRecording.Tune = Tune

    RecordingEngine.stSegmentingHLS = RecordingEngine.newHState(RecordingEngine, "SegmentingHLS")
    RecordingEngine.stSegmentingHLS.HStateEventHandler = STSegmentingHLSEventHandler
	RecordingEngine.stSegmentingHLS.superState = RecordingEngine.stRecordingController

	RecordingEngine.topState = RecordingEngine.stTop

	return RecordingEngine

End Function


Function InitializeRecordingEngine() As Object

	m.contentFolder = "content/"

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
            
            else if event["EventType"] = "RECORD_NOW" then

				scheduledRecording = {}
				scheduledRecording.title$ = event["Title"]
				scheduledRecording.duration% = event["Duration"]
				scheduledRecording.channel$ = "HDMI In"

				systemTime = CreateObject("roSystemTime")
				scheduledRecording.dateTime = systemTime.GetLocalDateTime()

				' phony timer object
				scheduledRecording.timer = CreateObject("roTimer")
				scheduledRecording.timerId$ = stri(scheduledRecording.timer.GetIdentity())

				m.stateMachine.scheduledRecordings.AddReplace(scheduledRecording.timerId$, scheduledRecording)

				m.stateMachine.scheduledRecording = scheduledRecording
				stateData.nextState = m.stateMachine.stRecording
				return "TRANSITION"

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
					m.stateMachine.recordingToSegment = m.stateMachine.jtr.GetDBRecordingByFileName(scheduledRecording.fileName$)
					stateData.nextState = m.stateMachine.stSegmentingHLS
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
'	m.Tune(scheduledRecording.channel$)

	endDateTime = scheduledRecording.dateTime
	endDateTime.AddSeconds(scheduledRecording.duration% * 60)

	print "Manual record will end at " + endDateTime.GetString()

	m.endRecordingTimer = CreateObject("roTimer")
	m.endRecordingTimer.SetPort(m.stateMachine.msgPort)
	m.endRecordingTimer.SetDateTime(endDateTime)
	m.endRecordingTimer.Start()

	m.stateMachine.recordingInProgressTimerId$ = scheduledRecording.timerId$

	' start recording
	scheduledRecording.fileName$ = Left(scheduledRecording.dateTime.ToIsoString(), 15)
	path$ = m.stateMachine.contentFolder + scheduledRecording.fileName$ + ".ts"

	if type(m.stateMachine.mediaStreamer) = "roMediaStreamer" then

		ok = m.stateMachine.mediaStreamer.SetPipeline("hdmi:,encoder:,file:///" + path$)
		if not ok then stop

		ok = m.stateMachine.mediaStreamer.Start()
		if not ok then stop

		' turn on record LED
		m.stateMachine.jtr.SetRecordLED(true)

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
	ok = m.stateMachine.mediaStreamer.Stop()
	if not ok then stop

	' Add or update record in database
	m.stateMachine.jtr.AddDBRecording(scheduledRecording)

	' Remove from list of pending records
	ok = m.stateMachine.scheduledRecordings.Delete(scheduledRecordingTimerIdentity)
	if not ok then stop

	' turn off record LED
	m.stateMachine.jtr.SetRecordLED(false)

	' TODO - turn on a different LED to indicate that segmentation is in progress

End Sub


Function STSegmentingHLSEventHandler(event As Object, stateData As Object) As Object

    stateData.nextState = invalid
    
    if type(event) = "roAssociativeArray" then      ' internal message event

        if IsString(event["EventType"]) then
        
            if event["EventType"] = "ENTRY_SIGNAL" then
            
                print m.id$ + ": entry signal"

				m.recordingId% = m.stateMachine.recordingToSegment.RecordingId
				recording = m.stateMachine.jtr.GetDBRecording(stri(m.recordingId%))

				' create directory where hls segments will be generated
				dirName$ = "content/hls/" + m.stateMachine.recordingToSegment.FileName
				ok = CreateDirectory(dirName$)

				path$ = GetTSFilePath(m.stateMachine.recordingToSegment.FileName)

				' store segments in /content/hls/file name without extension/fileName
				pipeLineSpec$ = "file:///" + path$ + ", hls:///" + dirName$ + "/" + m.stateMachine.recordingToSegment.FileName + "?duration=10"

				m.mediaStreamer = CreateObject("roMediaStreamer")
				m.mediaStreamer.SetPort(m.stateMachine.msgPort)
				ok = m.mediaStreamer.SetPipeline(pipeLineSpec$)

				systemTime = CreateObject("roSystemTime")
				print "------- start segmentation at ";systemTime.GetLocalDateTime()

				ok = m.mediaStreamer.Start()

                return "HANDLED"

            else if event["EventType"] = "EXIT_SIGNAL" then

                print m.id$ + ": exit signal"
            
				return "HANDLED"

			endif
            
        endif
        
	else if type(event) = "roMediaStreamerEvent" then

		systemTime = CreateObject("roSystemTime")
		print "------- segmentation complete at ";systemTime.GetLocalDateTime()

		' update db to indicate that hls segments were created
		m.stateMachine.jtr.UpdateHLSSegmentationComplete(m.recordingId%)

		' determine whether or not the .ts file can be deleted
		okToDelete = m.stateMachine.jtr.tsDeletable(m.recordingId%)
		if okToDelete then
			tsPath$ = GetTSFilePath(m.stateMachine.recordingToSegment.FileName)
			if tsPath$ <> "" then
				ok = DeleteFile(tsPath$)
				if not ok print "Delete after transcode complete failed"
			endif
		endif

		print "mediaStreamerEvent = ";event.GetEvent()
		stateData.nextState = m.stateMachine.stIdle
		return "TRANSITION"

    endif
            
    stateData.nextState = m.superState
    return "SUPER"

End Function




