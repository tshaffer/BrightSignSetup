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

	m.encodingMediaStreamer = CreateObject("roMediaStreamer")

End Sub


Sub re_EventHandler(event As Object)

	if type(event) = "roHtmlWidgetEvent" then

		m.HandleHttpEvent(event)
	
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
				scheduledRecording.channel$ = aa.channel
				scheduledRecording.recordingBitRate% = int(val(aa.recordingBitRate))
				scheduledRecording.showType$ = aa.showType

				segmentRecording = int(val(aa.segmentRecording))
				if segmentRecording = 0 then
					scheduledRecording.segmentRecording = false
				else
					scheduledRecording.segmentRecording = true
				endif

				systemTime = CreateObject("roSystemTime")
				scheduledRecording.dateTime = systemTime.GetLocalDateTime()

				m.scheduledRecording = scheduledRecording

				m.StartManualRecord()
				
			else if aa.command = "endRecording" then
				startSegmentation = false
				if aa.startSegmentation = "false" then
					startSegmentation = false
				endif
				m.EndManualRecord(startSegmentation)
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

	m.scheduledRecording.fileName$ = Left(m.scheduledRecording.dateTime.ToIsoString(), 15)
	path$ = m.contentFolder + m.scheduledRecording.fileName$ + ".ts"

	if type(m.encodingMediaStreamer) = "roMediaStreamer" then

'		ok = m.encodingMediaStreamer.SetPipeline("hdmi:,encoder:,file:///" + path$)
'		ok = m.encodingMediaStreamer.SetPipeline("hdmi:,encoder:vbitrate=12000,file:///" + path$)
'		ok = m.encodingMediaStreamer.SetPipeline("hdmi:,encoder:vformat=1080i60&vbitrate=18000,file:///" + path$)
'		ok = m.encodingMediaStreamer.SetPipeline("hdmi:,encoder:vformat=1080i60&vbitrate=10000,file:///" + path$)
		
		vbitrate% = m.scheduledRecording.recordingBitRate% * 1000
		vbitrate$ = StripLeadingSpaces(stri(vbitrate%))

		ok = m.encodingMediaStreamer.SetPipeline("hdmi:,encoder:vbitrate=" + vbitrate$ + ",file:///" + path$)
		if not ok then stop

		ok = m.encodingMediaStreamer.Start()
		if not ok then stop

		' turn on record LED
		m.jtr.SetRecordLED(true)

	endif

End Sub


Sub re_EndManualRecord(startSegmentation)

	print "EndManualRecord " + m.scheduledRecording.title$
	ok = m.encodingMediaStreamer.Stop()
	if not ok then stop

	' Add or update record in database
	m.jtr.AddDBRecording(m.scheduledRecording)

	' turn off record LED
	m.jtr.SetRecordLED(false)

	if m.scheduledRecording.segmentRecording
		m.recordingToSegment = m.jtr.GetDBRecordingByFileName(m.scheduledRecording.fileName$)
		m.StartHLSSegmentation()
	endif

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

	m.segmentingMediaStreamer = CreateObject("roMediaStreamer")
	m.segmentingMediaStreamer.SetPort(m.msgPort)
	ok = m.segmentingMediaStreamer.SetPipeline(pipeLineSpec$)

	systemTime = CreateObject("roSystemTime")
	print "------- start segmentation at ";systemTime.GetLocalDateTime()

	ok = m.segmentingMediaStreamer.Start()

End Sub


Sub re_HLSSegmentationComplete()

	systemTime = CreateObject("roSystemTime")
	print "------- segmentation complete at ";systemTime.GetLocalDateTime()

	hlsUrl$ = "/content/hls/" + m.recordingToSegment.FileName + "/" + m.recordingToSegment.FileName + "_index.m3u8"

	' update db to indicate that hls segments were created`
	m.jtr.UpdateHLSSegmentationComplete(m.recordingId%, hlsUrl$)

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
