Function newRecordingEngine(jtr As Object) As Object

	RecordingEngine = {}

' setup methods
	RecordingEngine.Initialize					= re_Initialize

	RecordingEngine.jtr = jtr
	RecordingEngine.msgPort = jtr.msgPort

' setup methods
    RecordingEngine.EventHandler				= re_EventHandler
	RecordingEngine.HandleHttpEvent				= re_HandleHttpEvent

	RecordingEngine.StartManualRecord			= re_StartManualRecord
	RecordingEngine.EndManualRecord				= re_EndManualRecord
	RecordingEngine.StartHLSSegmentation		= re_StartHLSSegmentation
	RecordingEngine.HLSSegmentationComplete		= re_HLSSegmentationComplete

	return RecordingEngine

End Function


Sub re_Initialize()

	m.contentFolder = "content/"

'	m.scheduledRecordings = {}
'	m.recordingInProgressTimerId$ = ""

	m.mediaStreamer = CreateObject("roMediaStreamer")

End Sub


Sub re_EventHandler(event As Object)

	if type(event) = "roHtmlWidgetEvent" then

		m.HandleHttpEvent(event)
	
	else if type(event) = "roTimerEvent" then

		eventIdentity$ = stri(event.GetSourceIdentity())

		' recording timer
		if type(m.endRecordingTimer) = "roTimer" and stri(m.endRecordingTimer.GetIdentity()) = eventIdentity$ then

			m.EndManualRecord()

			m.recordingToSegment = m.jtr.GetDBRecordingByFileName(m.scheduledRecording.fileName$)

			' start HLS segmentation
			m.StartHLSSegmentation()

		endif

	else if type(event) = "roMediaStreamerEvent" then

		print "mediaStreamerEvent = ";event.GetEvent()

		m.HLSSegmentationComplete()

	endif

End Sub


Sub re_HandleHttpEvent(event As Object)

	print "roHTMLWidgetEvent received in re_HandleHttpEvent"
	eventData = event.GetData()

	if type(eventData) = "roAssociativeArray" and type(eventData.reason) = "roString" then
        print "reason = " + eventData.reason
		if eventData.reason = "message" then
			aa = eventData.message
			if aa.command = "recordNow" then
				title$ = aa.title
				duration$ = aa.duration

				' capture recording parameters
				scheduledRecording = {}
				scheduledRecording.title$ = title$
				scheduledRecording.duration% = int(val(duration$))
				scheduledRecording.channel$ = "HDMI In"
				systemTime = CreateObject("roSystemTime")
				scheduledRecording.dateTime = systemTime.GetLocalDateTime()
				m.scheduledRecording = scheduledRecording

				' m.stateMachine.scheduledRecordings.AddReplace(scheduledRecording.timerId$, scheduledRecording)
				m.StartManualRecord()
				
			endif
		endif
	' don't understand the following
	else if eventData.reason = "message" then
		aa = eventData.message
		print "type(aa)=" + type(aa)		
		if type(aa.message) = "roString" then
			print "message from JS: ";aa.message		
		else if type(aa.command) = "roString" then
			command$ = aa.command
			if command$ = "recordNow" then
				stop
			endif
		endif
	endif

End Sub


Sub re_StartManualRecord()

	print "StartManualRecord " + m.scheduledRecording.title$ + " scheduled for " + m.scheduledRecording.dateTime.GetString()

	' tune channel
'	m.Tune(scheduledRecording.channel$)

	endDateTime = m.scheduledRecording.dateTime
	endDateTime.AddSeconds(m.scheduledRecording.duration% * 60)

	print "Manual record will end at " + endDateTime.GetString()

	m.endRecordingTimer = CreateObject("roTimer")
	m.endRecordingTimer.SetPort(m.msgPort)
	m.endRecordingTimer.SetDateTime(endDateTime)
	m.endRecordingTimer.Start()

'	m.stateMachine.recordingInProgressTimerId$ = scheduledRecording.timerId$

	' start recording
	m.scheduledRecording.fileName$ = Left(m.scheduledRecording.dateTime.ToIsoString(), 15)
	path$ = m.contentFolder + m.scheduledRecording.fileName$ + ".ts"

	if type(m.mediaStreamer) = "roMediaStreamer" then

		ok = m.mediaStreamer.SetPipeline("hdmi:,encoder:,file:///" + path$)
		if not ok then stop

		ok = m.mediaStreamer.Start()
		if not ok then stop

		' turn on record LED
		m.jtr.SetRecordLED(true)

	endif

End Sub


Sub re_EndManualRecord()

	print "EndManualRecord " + m.scheduledRecording.title$
	ok = m.mediaStreamer.Stop()
	if not ok then stop

	' Add or update record in database
	m.jtr.AddDBRecording(m.scheduledRecording)

	' Remove from list of pending records
'	ok = m.stateMachine.scheduledRecordings.Delete(scheduledRecordingTimerIdentity)
'	if not ok then stop

	' turn off record LED
	m.jtr.SetRecordLED(false)

	' TODO - turn on a different LED to indicate that segmentation is in progress

End Sub


Sub re_StartHLSSegmentation()

	m.recordingId% = m.recordingToSegment.RecordingId
	recording = m.jtr.GetDBRecording(stri(m.recordingId%))

	' create directory where hls segments will be generated
	dirName$ = "content/hls/" + m.recordingToSegment.FileName
	ok = CreateDirectory(dirName$)

	path$ = GetTSFilePath(m.recordingToSegment.FileName)

	' store segments in /content/hls/file name without extension/fileName
	pipeLineSpec$ = "file:///" + path$ + ", hls:///" + dirName$ + "/" + m.recordingToSegment.FileName + "?duration=10"

	m.mediaStreamer = CreateObject("roMediaStreamer")
	m.mediaStreamer.SetPort(m.msgPort)
	ok = m.mediaStreamer.SetPipeline(pipeLineSpec$)

	systemTime = CreateObject("roSystemTime")
	print "------- start segmentation at ";systemTime.GetLocalDateTime()

	ok = m.mediaStreamer.Start()

End Sub


Sub re_HLSSegmentationComplete()

	systemTime = CreateObject("roSystemTime")
	print "------- segmentation complete at ";systemTime.GetLocalDateTime()

	' update db to indicate that hls segments were created
	m.jtr.UpdateHLSSegmentationComplete(m.recordingId%)

	' determine whether or not the .ts file can be deleted
	okToDelete = m.jtr.tsDeletable(m.recordingId%)
	if okToDelete then
		tsPath$ = GetTSFilePath(m.recordingToSegment.FileName)
		if tsPath$ <> "" then
			ok = DeleteFile(tsPath$)
			if not ok print "Delete after transcode complete failed"
		endif
	endif

End Sub
