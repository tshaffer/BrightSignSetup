Sub OpenDatabase()

	m.dbSchemaVersion$ = "1.0"

	m.db = CreateObject("roSqliteDatabase")
	m.db.SetPort(m.msgPort)

	ok = m.db.Open("jtr.db")
	if ok then
		version$ = m.GetDBVersion()
		if version$ <> m.dbSchemaVersion$ then stop
	else
		ok = m.db.Create("jtr.db")
		if not ok then stop

		m.CreateDBTable("CREATE TABLE SchemaVersion (Version TEXT);")

		m.SetDBVersion(m.dbSchemaVersion$)

		m.CreateDBTable("CREATE TABLE Recordings (RecordingId INTEGER PRIMARY KEY AUTOINCREMENT, Title TEXT, StartDateTime TEXT, Duration INT, FileName TEXT, LastViewedPosition INT, TranscodeComplete INT, HLSSegmentationComplete INT, HLSUrl TEXT);")

		m.CreateDBTable("CREATE TABLE ScheduledRecordings (Id INTEGER PRIMARY KEY AUTOINCREMENT, DateTime INT, Title TEXT, Duration INT, UseTuner INT, Channel TEXT);")

		m.CreateDBTable("CREATE TABLE LastSelectedShow (Id TEXT);")

		m.CreateDBTable("CREATE TABLE LastTunedChannel (Channel TEXT);")
	endif

End Sub


Sub CreateDBTable(statement$ As String)

	SQLITE_COMPLETE = 100

	createStmt = m.db.CreateStatement(statement$)

	if type(createStmt) <> "roSqliteStatement" then
        print "CreateStatement failure - " + statement$ : stop
	endif

	sqlResult = createStmt.Run()

	if sqlResult <> SQLITE_COMPLETE
        print "sqlResult <> SQLITE_COMPLETE" : stop
	endif

	createStmt.Finalise()

End Sub


Sub ExecuteDBInsert(insert$ As String, params As Object)
	
	SQLITE_COMPLETE = 100

	insertStatement = m.db.CreateStatement(insert$)

	if type(insertStatement) <> "roSqliteStatement" then
        print "CreateStatement failure - " + insert$ : stop
	endif

	if type(params) = "roArray" then
		bindResult = insertStatement.BindByOffset(params)
	else
		bindResult = insertStatement.BindByName(params)
	endif

	if not bindResult then
        print "Bind failure" : stop
	endif

	sqlResult = insertStatement.Run()

	if sqlResult <> SQLITE_COMPLETE
        print "sqlResult <> SQLITE_COMPLETE" : stop
	endif

	insertStatement.Finalise()

End Sub


Sub ExecuteDBSelect(select$ As String, resultsCallback As Object, selectData As Object, params As Object)

	SQLITE_ROWS = 102

	selectStmt = m.db.CreateStatement(select$)

	if type(selectStmt) <> "roSqliteStatement" then
        print "CreateStatement failure - " + select$ : stop
	endif

	bindResult = true
	if type(params) = "roArray" then
		bindResult = selectStmt.BindByOffset(params)
	else if type(params) = "roAssociativeArray" then
		bindResult = selectStmt.BindByName(params)
	endif

	if not bindResult then
        print "Bind failure" : stop
	endif

	sqlResult = selectStmt.Run()

	while sqlResult = SQLITE_ROWS

		resultsData = selectStmt.GetData()
	
		resultsCallback(resultsData, selectData)

		sqlResult = selectStmt.Run() 
		   
	end while

	selectStmt.Finalise()

End Sub


Sub SetDBVersion(version$ As String)

	insertSQL$ = "INSERT INTO SchemaVersion (Version) VALUES(:version_param);"

	params = { version_param: version$ }

	m.ExecuteDBInsert(insertSQL$, params)

End Sub


Sub GetDBVersionCallback(resultsData As Object, selectData As Object)

	selectData.version$ = resultsData["Version"]

End Sub


Function GetDBVersion() As String

	selectData = {}
	selectData.version$ = ""

	select$ = "SELECT SchemaVersion.Version FROM SchemaVersion;"
	m.ExecuteDBSelect(select$, GetDBVersionCallback, selectData, invalid)

	return selectData.version$

End Function


Sub GetLastScheduledRecordingIdCallback(resultsData As Object, selectData As Object)

	selectData.id = resultsData["MaxId"]

End Sub


Function GetLastScheduledRecordingId() As Integer

	selectData = {}

	select$ = "SELECT MAX (Id) as MaxId FROM ScheduledRecordings;"
	m.ExecuteDBSelect(select$, GetLastScheduledRecordingIdCallback, selectData, invalid)

	return selectData.id

End Function


Sub AddDBScheduledRecording(scheduledRecording As Object)

	insertSQL$ = "INSERT INTO ScheduledRecordings (DateTime, Duration, Title, UseTuner, Channel) VALUES(?,?,?,?,?);"

	params = CreateObject("roArray", 5, false)
	params[ 0 ] = scheduledRecording.dateTime
	params[ 1 ] = scheduledRecording.duration%
	params[ 2 ] = scheduledRecording.title$
	params[ 3 ] = scheduledRecording.useTuner%
	params[ 4 ] = scheduledRecording.channel$

	m.ExecuteDBInsert(insertSQL$, params)

End Sub


Sub DeleteDBScheduledRecording(scheduledRecordingId$ As String)

	SQLITE_COMPLETE = 100

	delete$ = "DELETE FROM ScheduledRecordings WHERE Id = " + scheduledRecordingId$ + ";"

	deleteStatement = m.db.CreateStatement(delete$)

	if type(deleteStatement) <> "roSqliteStatement" then
        print "DeleteStatement failure - " + delete$
		stop
	endif

	sqlResult = deleteStatement.Run()

	if sqlResult <> SQLITE_COMPLETE
        print "sqlResult <> SQLITE_COMPLETE"
	endif

	deleteStatement.Finalise()

End Sub


Sub GetDBScheduledRecordingsCallback(resultsData As Object, selectData As Object)

	selectData.scheduledRecordings.push(resultsData)

End Sub


Function GetDBScheduledRecordings() As Object

	selectData = {}
	selectData.scheduledRecordings = []

	select$ = "SELECT Id, DateTime, Duration, Title, UseTuner, Channel FROM ScheduledRecordings;"
	m.ExecuteDBSelect(select$, GetDBScheduledRecordingsCallback, selectData, invalid)

	return selectData.scheduledRecordings

End Function



Sub AddDBRecording(scheduledRecording As Object)

	
	insertSQL$ = "INSERT INTO Recordings (Title, StartDateTime, Duration, FileName, LastViewedPosition, TranscodeComplete, HLSSegmentationComplete, HLSUrl) VALUES(?,?,?,?,?,?,?,?);"

	params = CreateObject("roArray", 7, false)
	params[ 0 ] = scheduledRecording.title$
	params[ 1 ] = scheduledRecording.dateTime.GetString()
	params[ 2 ] = scheduledRecording.duration%
	params[ 3 ] = scheduledRecording.fileName$
	params[ 4 ] = 0
	params[ 5 ] = 0
	params[ 6 ] = 0
	params[ 7 ] = ""

	m.ExecuteDBInsert(insertSQL$, params)

	' TODO - last_insert_rowid - return the id of the added recording

End Sub


Sub DeleteDBRecording(recordingId$ As String)

	SQLITE_COMPLETE = 100

	delete$ = "DELETE FROM Recordings WHERE RecordingId = " + recordingId$ + ";"

	deleteStatement = m.db.CreateStatement(delete$)

	if type(deleteStatement) <> "roSqliteStatement" then
        print "DeleteStatement failure - " + delete$
		stop
	endif

	sqlResult = deleteStatement.Run()

	if sqlResult <> SQLITE_COMPLETE
        print "sqlResult <> SQLITE_COMPLETE"
	endif

	deleteStatement.Finalise()

End Sub


Sub GetDBLastTunedChannelCallback(resultsData As Object, selectData As Object)

	selectData.lastTunedChannel$ = resultsData["Channel"]

End Sub


Function GetDBLastTunedChannel() As Object

	selectData = {}
	selectData.lastTunedChannel$ = ""

	select$ = "SELECT LastTunedChannel.Channel FROM LastTunedChannel;"
	m.ExecuteDBSelect(select$, GetDBLastTunedChannelCallback, selectData, invalid)

	return selectData.lastTunedChannel$

End Function


Sub SetDBLastTunedChannel(channel$ As String)

    m.db.RunBackground("UPDATE LastTunedChannel SET Channel='" + channel$ + "';", {})

End Sub



Sub GetDBLastSelectedShowIdCallback(resultsData As Object, selectData As Object)

	selectData.lastSelectedShowId$ = resultsData["Id"]

End Sub


Function GetDBLastSelectedShowId() As Object

	selectData = {}
	selectData.lastSelectedShowId$ = ""

	select$ = "SELECT LastSelectedShow.Id FROM LastSelectedShow;"
	m.ExecuteDBSelect(select$, GetDBLastSelectedShowIdCallback, selectData, invalid)

	return selectData.lastSelectedShowId$

End Function


Sub SetDBLastSelectedShowId(lastSelectedShowId$ As String)

	existingShowId = m.GetDBLastSelectedShowId()
'	if existingShowId = null then
'		insertSQL$ = "INSERT INTO LastSelectedShow (Id) VALUES(:id_param);"
'		params = { id_param: lastSelectedShowId$ }
'		m.ExecuteDBInsert(insertSQL$, params)
'	else
	    m.db.RunBackground("UPDATE LastSelectedShow SET Id='" + lastSelectedShowId$ + "';", {})
'	endif

End Sub


Sub GetDBRecordingsCallback(resultsData As Object, selectData As Object)

	resultsData.Path = GetFilePath(resultsData.FileName)
	selectData.recordings.push(resultsData)

End Sub


Function GetDBRecordings() As Object

	selectData = {}
	selectData.recordings = []

	select$ = "SELECT RecordingId, Title, StartDateTime, Duration, FileName, LastViewedPosition, TranscodeComplete, HLSSegmentationComplete, HLSUrl FROM Recordings;"
	m.ExecuteDBSelect(select$, GetDBRecordingsCallback, selectData, invalid)

	return selectData.recordings

End Function


Sub GetDBRecordingCallback(resultsData As Object, selectData As Object)

	resultsData.Path = GetFilePath(resultsData.FileName)
	selectData.recording = resultsData

End Sub


Function GetDBRecording(recordingId As String) As Object

	selectData = {}
	selectData.recording = invalid

	select$ = "SELECT RecordingId, Title, StartDateTime, Duration, FileName, LastViewedPosition, TranscodeComplete, HLSSegmentationComplete, HLSUrl FROM Recordings WHERE RecordingId='" + recordingId + "';"
	m.ExecuteDBSelect(select$, GetDBRecordingCallback, selectData, invalid)

	return selectData.recording

End Function


Function GetDBRecordingByFileName(fileName$ As String) As Object

	selectData = {}
	selectData.recording = invalid

	select$ = "SELECT RecordingId, Title, StartDateTime, Duration, FileName, LastViewedPosition, TranscodeComplete, HLSSegmentationComplete, HLSUrl FROM Recordings WHERE FileName='" + fileName$ + "';"
	m.ExecuteDBSelect(select$, GetDBRecordingCallback, selectData, invalid)

	return selectData.recording

End Function


Sub GetDBFileToTranscodeCallback(resultsData As Object, selectData As Object)

	resultsData.Path = GetFilePath(resultsData.FileName)
	selectData.recording = resultsData

End Sub


Function GetDBFileToTranscode() As Object

	selectData = {}
	selectData.recording = invalid

	select$ = "SELECT RecordingId, Title, StartDateTime, Duration, FileName, LastViewedPosition, TranscodeComplete FROM Recordings WHERE TranscodeComplete=0;"
	m.ExecuteDBSelect(select$, GetDBFileToTranscodeCallback, selectData, invalid)

	return selectData.recording

End Function


Sub UpdateDBTranscodeComplete(recordingId% As Integer)

    params = { ri_param: recordingId% }

    m.db.RunBackground("UPDATE Recordings SET TranscodeComplete=1 WHERE RecordingId=:ri_param;", params)

End Sub


Sub UpdateHLSSegmentationComplete(recordingId% As Integer, hlsUrl$ As String)

    params = { ri_param: recordingId%, hu_param: hlsUrl$ }

    m.db.RunBackground("UPDATE Recordings SET HLSSegmentationComplete=1, HLSUrl=:hu_param WHERE RecordingId=:ri_param;", params)

End Sub


Sub UpdateDBLastViewedPosition(recordingId% As Integer, lastViewedPosition% As Integer)

    params = { ri_param: recordingId%, lv_param: lastViewedPosition% }

    m.db.RunBackground("UPDATE Recordings SET LastViewedPosition=:lv_param WHERE RecordingId=:ri_param;", params)

End Sub


Function GetMP4FilePath(fileName$ As String) As String

	mp4Path$ = "content/" + fileName$ + ".mp4"
	readFile = CreateObject("roReadFile", mp4Path$)
	if type(readFile) = "roReadFile" return mp4Path$

	return ""

End Function


Function GetTSFilePath(fileName$ As String) As String

	tsPath$ = "content/" + fileName$ + ".ts"
	readFile = CreateObject("roReadFile", tsPath$)
	if type(readFile) = "roReadFile" return tsPath$
	
	return ""

End Function


Function GetFilePath(fileName$ As String) As String

	mp4Path$ = GetMP4FilePath(fileName$)
	if mp4Path$ <> "" return mp4Path$

	return GetTSFilePath(fileName$)

End Function


Function tsDeletable(recordingId% As Integer) As Boolean

	recording = m.GetDBRecording(stri(recordingId%))
	mp4FilePath$ = GetMP4FilePath(recording.FileName)
	if mp4FilePath$ <> "" then
		if recording.HLSSegmentationComplete = 1 return true
	endif

	return false

End Function
