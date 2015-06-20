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

		m.CreateDBTable("CREATE TABLE ScheduledRecordings (Id INTEGER PRIMARY KEY AUTOINCREMENT, DateTime INT, Title TEXT, Duration INT, InputSource TEXT, Channel TEXT, RecordingBitRate INT, SegmentRecording INT);")

		m.CreateDBTable("CREATE TABLE Settings (RecordingBitRate INT, SegmentRecordings INT);")

		m.CreateDBTable("CREATE TABLE LastSelectedShow (Id TEXT);")

		m.CreateDBTable("CREATE TABLE LastTunedChannel (Channel TEXT);")

'		m.CreateDBTable("CREATE TABLE Stations (StationId PRIMARY KEY TEXT, AtscMajor INT, AtscMinor INT, CommonName TEXT, Name TEXT, CallSign TEXT);")
		m.CreateDBTable("CREATE TABLE Stations (StationId, AtscMajor INT, AtscMinor INT, CommonName TEXT, Name TEXT, CallSign TEXT);")
		m.PopulateStationsTable()

'		m.CreateDBTable("CREATE TABLE StationSchedulesForSingleDay (StationId TEXT, ScheduleDate TEXT, ModifiedDate TEXT, MD5 TEXT, PRIMARY KEY (StationId, ScheduleDate));")
		m.CreateDBTable("CREATE TABLE StationSchedulesForSingleDay (StationId TEXT, ScheduleDate TEXT, ModifiedDate TEXT, MD5 TEXT);")

		' JTR TODO - is it appropriate to store the MD5 in this table, or is it just used transiently when ProgramsForStations data is retrieved from the server?
		m.CreateDBTable("CREATE TABLE ProgramsForStations (StationId TEXT, ScheduleDate TEXT, ProgramId TEXT, AirDateTime TEXT, Duration TEXT, NewShow TEXT, MD5 TEXT);")
	
		m.CreateDBTable("CREATE TABLE Programs (ProgramId TEXT, Title TEXT, EpisodeTitle TEXT, Description TEXT, ShowType TEXT, OriginalAirDate TEXT, GracenoteSeasonEpisode TEXT, MD5 TEXT);")

		m.CreateDBTable("CREATE TABLE ProgramCast (ProgramId TEXT, Name TEXT, BillingOrder TEXT);")

		m.CreateDBTable("CREATE TABLE LastChannelGuideSelection (StationId TEXT, Date TEXT);")
		
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

	insertSQL$ = "INSERT INTO ScheduledRecordings (DateTime, Duration, Title, InputSource, Channel, RecordingBitRate, SegmentRecording) VALUES(?,?,?,?,?,?,?);"

	params = CreateObject("roArray", 5, false)
	params[ 0 ] = scheduledRecording.dateTime
	params[ 1 ] = scheduledRecording.duration%
	params[ 2 ] = scheduledRecording.title$
	params[ 3 ] = scheduledRecording.inputSource$
	params[ 4 ] = scheduledRecording.channel$
	params[ 5 ] = scheduledRecording.recordingBitRate%
	params[ 6 ] = scheduledRecording.segmentRecording%

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

	select$ = "SELECT Id, DateTime, Duration, Title, InputSource, Channel, RecordingBitRate, SegmentRecording FROM ScheduledRecordings;"
	m.ExecuteDBSelect(select$, GetDBScheduledRecordingsCallback, selectData, invalid)

	return selectData.scheduledRecordings

End Function



Sub AddDBRecording(scheduledRecording As Object)

	' convert duration from msec to minutes
	duration% = (scheduledRecording.duration% + 30000) / 60000

	insertSQL$ = "INSERT INTO Recordings (Title, StartDateTime, Duration, FileName, LastViewedPosition, TranscodeComplete, HLSSegmentationComplete, HLSUrl) VALUES(?,?,?,?,?,?,?,?);"

	params = CreateObject("roArray", 7, false)
	params[ 0 ] = scheduledRecording.title$
	params[ 1 ] = scheduledRecording.dateTime.GetString()
	params[ 2 ] = duration%
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


Function GetDBSettingsCallback(resultsData As Object, selectData As Object) As Object

	selectData.settings = resultsData

End Function


Function GetDBSettings() As Object

	selectData = {}
	selectData.settings = invalid

	select$ = "SELECT RecordingBitRate, SegmentRecordings FROM Settings;"
	m.ExecuteDBSelect(select$, GetDBSettingsCallback, selectData, invalid)

	return selectData.settings

End Function


Sub SetDBSettings(recordingBitRate As Integer, segmentRecordings As Integer)

	m.db.RunBackground("UPDATE Settings SET RecordingBitRate=" + stri(recordingBitRate) + ", SegmentRecordings=" + stri(segmentRecordings) + ";", {})

End Sub


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
		' if recording.HLSSegmentationComplete = 1 return true
		' temporary - until information about whether or not segmentation will be complete is persistent
		return true
	endif

	return false

End Function


Sub AddDBStation(stationId As String, atscMajor As Integer, atscMinor As Integer, commonName As String, name as String, callSign As String)

	insertSQL$ = "INSERT INTO Stations (StationId, AtscMajor, AtscMinor, CommonName, Name, CallSign) VALUES(?,?,?,?,?,?);"

	params = CreateObject("roArray", 5, false)
	params[ 0 ] = stationId
	params[ 1 ] = atscMajor
	params[ 2 ] = atscMinor
	params[ 3 ] = commonName
	params[ 4 ] = name
	params[ 5 ] = callSign

	m.ExecuteDBInsert(insertSQL$, params)

End Sub


' hard code for now
Sub PopulateStationsTable()

	m.AddDBStation("19571", 2, 1, "KTVU", "KTVUDT (KTVU-DT)", "KTVUDT")
	m.AddDBStation("19573", 4, 1, "KRON", "KRONDT (KRON-DT)", "KRONDT")
	m.AddDBStation("19572", 5, 1, "KPIX", "KPIXDT (KPIX-DT)", "KPIXDT")
	m.AddDBStation("19574", 7, 1, "KGO", "KGODT (KGO-DT)", "KGODT")
	m.AddDBStation("24344", 9, 1, "KQED", "KQEDDT (KQED-DT)", "KQEDDT")
	m.AddDBStation("30507", 9, 2, "KQED-2", "KQEDDT2 (KQED-DT2)", "KQEDDT2")
	m.AddDBStation("35278", 9, 3, "KQED-3", "KQEDDT3 (KQED-DT3)", "KQEDDT3")
	m.AddDBStation("21785", 11, 1, "KNTV", "KNTVDT (KNTV-DT)", "KNTVDT")
	m.AddDBStation("21650", 36, 1, "KICU", "KICUDT (KICU-DT)", "KICUDT")
	m.AddDBStation("19575", 44, 1, "KBCW", "KBCWDT (KBCW-DT)", "KBCWDT")

End Sub


Sub GetDBStationsCallback(resultsData As Object, selectData As Object)

	selectData.stations.push(resultsData)

End Sub


Function GetDBStations() As Object

	selectData = {}
	selectData.stations = []

	select$ = "SELECT StationId, AtscMajor, AtscMinor, CommonName, Name, CallSign FROM Stations;"

	m.ExecuteDBSelect(select$, GetDBStationsCallback, selectData, invalid)

	return selectData.stations

End Function


' OBSOLETE?
'Sub AddDBStationScheduleForSingleDay(stationId As String, scheduleDate As String, modifiedDate as String, md5 as String)
'
'	insertSQL$ = "INSERT INTO StationSchedulesForSingleDay (StationId, ScheduleDate, ModifiedDate, MD5) VALUES(?,?,?,?);"

'	params = CreateObject("roArray", 4, false)
'	params[ 0 ] = stationId
'	params[ 1 ] = scheduleDate
'	params[ 2 ] = modifiedDate
'	params[ 3 ] = md5

'	m.ExecuteDBInsert(insertSQL$, params)

'End Sub


Sub GetDBStationSchedulesForSingleDayCallback(resultsData As Object, selectData As Object)

	selectData.stationSchedulesForSingleDay.push(resultsData)

End Sub


Function GetDBStationSchedulesForSingleDay() As Object

	selectData = {}
	selectData.stationSchedulesForSingleDay = []

	select$ = "SELECT StationId, ScheduleDate, ModifiedDate, MD5 FROM StationSchedulesForSingleDay;"
	m.ExecuteDBSelect(select$, GetDBStationSchedulesForSingleDayCallback, selectData, invalid)

	return selectData.stationSchedulesForSingleDay

End Function


Function GenerateSQLInsert(rowObjects As Object, tableName$ As String, columnKeys As Object, dbColumnNames As Object, startingRowIndex% As Integer, numItemsToInsert% As Integer) As Object

' example SQL that works
'	insertSQL$ = "INSERT INTO StationSchedulesForSingleDay (StationId, ScheduleDate, ModifiedDate, MD5) VALUES(?,?,?,?),(?,?,?,?);"

	insertSQL$ = "INSERT INTO " + tableName$ + " ("

	for columnIndex% = 0 to dbColumnNames.Count() - 1
	
		if columnIndex% > 0 then
			insertSQL$ = insertSQL$ + ", "
		endif

		insertSQL$ = insertSQL$ + dbColumnNames[columnIndex%]
	next

	insertSQL$ = insertSQL$ + ") VALUES "

	for rowIndex% = 0 to numItemsToInsert% - 1

		if rowIndex% > 0 then
			insertSQL$ = insertSQL$ + ","
		endif

		insertSQL$ = insertSQL$ + "("

		for columnIndex% = 0 to dbColumnNames.Count() - 1

			if columnIndex% > 0 then
				insertSQL$ = insertSQL$ + ","
			endif

			insertSQL$ = insertSQL$ + "?"

		next

		insertSQL$ = insertSQL$ + ")"

	next

	insertSQL$ = insertSQL$ + ";"

	params = []

	for rowIndex% = 0 to numItemsToInsert% - 1

		adjustedRowIndex% = rowIndex% + startingRowIndex%

		rowObject = rowObjects[adjustedRowIndex%]

		for columnIndex% = 0 to columnKeys.Count() - 1
			params.push(rowObject[columnKeys[columnIndex%]])
		next

	next

	sqlInsert = {}
	sqlInsert.insertSQL$ = insertSQL$
	sqlInsert.params = params

	return sqlInsert

End Function



Sub AddDBItems(insertItems As Object, columnKeys As Object, dbColumnNames As Object, tableName$ As String)

	itemIndex = 0
'	chunkSize = 500
	chunkSize = 100
	remainingItems = insertItems.Count()

	while remainingItems > 0

		if remainingItems > chunkSize
			numItemsToInsert = chunkSize
		else
			numItemsToInsert = remainingItems
		endif

		sqlInsert = GenerateSQLInsert(insertItems, tableName$, columnKeys, dbColumnNames, itemIndex, numItemsToInsert)

		remainingItems = remainingItems - numItemsToInsert
		itemIndex = itemIndex + numItemsToInsert

print "AddDBItems initiate insert"
		params = []
		m.ExecuteDBInsert(sqlInsert.insertSQL$, sqlInsert.params)
print "AddDBItems insert complete"

	end while

End Sub


Sub AddDBStationSchedulesForSingleDay(stationSchedulesForSingleDay)

	columnKeys = []
	columnKeys.push("stationId")
	columnKeys.push("scheduleDate")
	columnKeys.push("modifiedDate")
	columnKeys.push("md5")

	dbColumnNames = []
	dbColumnNames.push("StationId")
	dbColumnNames.push("ScheduleDate")
	dbColumnNames.push("ModifiedDate")
	dbColumnNames.push("MD5")

	m.AddDBItems(stationSchedulesForSingleDay, columnKeys, dbColumnNames, "StationSchedulesForSingleDay")

End Sub


Sub UpdateDBStationScheduleForSingleDay(stationId As String, scheduleDate As String, modifiedDate As String, md5 As String)

	params = { sid_param: stationId, sd_param: scheduleDate, md_param: modifiedDate, md5_param: md5 }
    m.db.RunBackground("UPDATE StationSchedulesForSingleDay SET ModifiedDate=:md_param, MD5=:md5_param WHERE StationId=:sid_param AND ScheduleDate=:sd_param;", params)

End Sub


Sub UpdateDBStationSchedulesForSingleDay(stationSchedulesForSingleDay As Object)

	for each stationScheduleForSingleDay in stationSchedulesForSingleDay
		m.UpdateDBStationScheduleForSingleDay(stationScheduleForSingleDay.stationId, stationScheduleForSingleDay.scheduleDate, stationScheduleForSingleDay.modifiedDate, stationScheduleForSingleDay.md5)
	next

End Sub


Sub DeleteDBProgramsForStation(stationId As String, scheduleDate As String)

	SQLITE_COMPLETE = 100

    params = { :sid_param: stationId, :sd_param: scheduleDate }

	delete$ = "DELETE FROM ProgramsForStations WHERE StationId =:sid_param AND ScheduleDate =:sd_param;"
	
	deleteStatement = m.db.CreateStatement(delete$)

	if type(deleteStatement) <> "roSqliteStatement" then
        print "DeleteStatement failure - "; delete$ : stop
	endif

	bindResult = deleteStatement.BindByName(params)

	if not bindResult then
        print "Bind failure - " : stop
	endif

	sqlResult = deleteStatement.Run()

	if sqlResult <> SQLITE_COMPLETE
        print "sqlResult <> SQLITE_COMPLETE"
	endif

	deleteStatement.Finalise()

End Sub


Sub AddDBCastMembers(castMembers As Object)

	columnKeys = []
	columnKeys.push("programId")
	columnKeys.push("name")
	columnKeys.push("billingOrder")

	dbColumnNames = []
	dbColumnNames.push("ProgramId")
	dbColumnNames.push("Name")
	dbColumnNames.push("BillingOrder")

	m.AddDBItems(castMembers, columnKeys, dbColumnNames, "ProgramCast")

End Sub


Sub AddDBProgramsForStations(programsForStations)

	columnKeys = []
	columnKeys.push("stationId")
	columnKeys.push("scheduleDate")
	columnKeys.push("programId")
	columnKeys.push("airDateTime")
	columnKeys.push("duration")
	columnKeys.push("newShow")
	columnKeys.push("md5")

	dbColumnNames = []
	dbColumnNames.push("StationId")
	dbColumnNames.push("ScheduleDate")
	dbColumnNames.push("ProgramId")
	dbColumnNames.push("AirDateTime")
	dbColumnNames.push("Duration")
	dbColumnNames.push("NewShow")
	dbColumnNames.push("MD5")

	m.AddDBItems(programsForStations, columnKeys, dbColumnNames, "ProgramsForStations")

End Sub


Sub AddDBProgramsForStation(stationDatesToReplace As Object, programsForStations As Object)

	' first, remove the station/date data from the db (this is the data that is going to get replaced)
	for each stationDateToReplace in stationDatesToReplace
		m.DeleteDBProgramsForStation(stationDateToReplace.stationId, stationDateToReplace.scheduleDate)
	next

	' next, add new data
	m.AddDBProgramsForStations(programsForStations)

End Sub


Sub GetDBProgramsCallback(resultsData As Object, selectData As Object)

	selectData.programs.push(resultsData)

End Sub


Function GetDBPrograms() As Object

	selectData = {}
	selectData.programs = []

	select$ = "SELECT ProgramId, Title, Description, MD5 FROM Programs;"
	m.ExecuteDBSelect(select$, GetDBProgramsCallback, selectData, invalid)

	return selectData.programs

End Function


Sub AddDBPrograms(programs)

	columnKeys = []
	columnKeys.push("programId")
	columnKeys.push("title")
	columnKeys.push("episodeTitle")
	columnKeys.push("description")
	columnKeys.push("showType")
	columnKeys.push("originalAirDate")
	columnKeys.push("gracenoteSeasonEpisode")
	columnKeys.push("md5")

	dbColumnNames = []
	dbColumnNames.push("ProgramId")
	dbColumnNames.push("Title")
	dbColumnNames.push("EpisodeTitle")
	dbColumnNames.push("Description")
	dbColumnNames.push("ShowType")
	dbColumnNames.push("OriginalAirDate")
	dbColumnNames.push("GracenoteSeasonEpisode")
	dbColumnNames.push("MD5")

	m.AddDBItems(programs, columnKeys, dbColumnNames, "Programs")

End Sub


Sub UpdateDBProgram(programId As String, title As String, description As String, showType As String, originalAirDate As String, graceNoteSeasonEpisode As String, md5 As String)

	params = { pid_param: programId, t_param: title, d_param: description, s_param: showType, o_param: originalAirDate, g_param:  graceNoteSeasonEpisode, md5_param: md5 }
    m.db.RunBackground("UPDATE Programs SET Title=:t_param, Description=:d_param, ShowType=:s_param, OriginalAirDate=:o_param, GraceNoteSeasonEpisode=:g_param, MD5=:md5_param WHERE ProgramId=:pid_param;", params)

End Sub


Sub UpdateDBPrograms(programs As Object)

	for each program in programs
		m.UpdateDBProgram(program.programId, program.title, program.description, program.showType, program.originalAirDate, program.graceNoteSeasonEpisode, program.md5)
	next

End Sub


Sub DeleteDBProgramCast(programId As String)

	SQLITE_COMPLETE = 100

    params = { :pid_param: programId }

	delete$ = "DELETE FROM ProgramCast WHERE ProgramId =:pid_param;"
	
	deleteStatement = m.db.CreateStatement(delete$)

	if type(deleteStatement) <> "roSqliteStatement" then
        print "DeleteStatement failure - "; delete$ : stop
	endif

	bindResult = deleteStatement.BindByName(params)

	if not bindResult then
        print "Bind failure - " : stop
	endif

	sqlResult = deleteStatement.Run()

	if sqlResult <> SQLITE_COMPLETE
        print "sqlResult <> SQLITE_COMPLETE"
	endif

	deleteStatement.Finalise()

End Sub


Sub DeleteDBProgramCasts(programs As Object)

	for each program in programs
		m.DeleteDBProgramCast(program.programId)
	next

End Sub


Sub GetDBEpgDataCallback(resultsData As Object, selectData As Object)

	selectData.epgData.push(resultsData)

End Sub


Sub GetDBLastChannelGuideSelectionCallback(resultsData As Object, selectData As Object)

	selectData.stationId$ = resultsData["StationId"]
	selectData.date$ = resultsData["Date"]
	
End Sub


Function GetDBLastChannelGuideSelection() As Object

	selectData = {}
	selectData.stationId$ = ""
	selectData.date$ = ""
	
	select$ = "SELECT LastChannelGuideSelection.StationId, LastChannelGuideSelection.Date FROM LastChannelGuideSelection;"
	m.ExecuteDBSelect(select$, GetDBLastSelectedShowIdCallback, selectData, invalid)

	return selectData.lastSelectedShowId$

End Function


Sub UpdateDBLastChannelGuideSelection(stationId$ As String, date$ As String)

	m.db.RunBackground("UPDATE LastChannelGuideSelection SET StationId='" + stationId$ + ", Date=" + date$ + "';", {})

End Sub


Function GetDBEpgData(startDate$ As String)

	selectData = {}
	selectData.epgData = []

'	select$ = "SELECT Stations.AtscMajor, Stations.AtscMinor, Programs.Title, ProgramsForStations.ScheduleDate, ProgramsForStations.StationId, ProgramsForStations.AirDateTime, ProgramsForStations.Duration, ProgramsForStations.NewShow, Programs.EpisodeTitle, Programs.Description, Programs.ShowType, Programs.OriginalAirDate, Programs.GracenoteSeasonEpisode, group_concat(DISTINCT ProgramCast.Name) as CastMembers from ProgramsForStations, Programs, Stations, ProgramCast where ScheduleDate >= '" + startDate$ + "' and Programs.ProgramId=ProgramsForStations.ProgramId and ProgramsForStations.StationId=Stations.StationId and Programs.ProgramId=ProgramCast.ProgramId GROUP BY ProgramsForStations.ProgramId order by ScheduleDate asc, AirDateTime asc, Stations.AtscMajor asc, Stations.AtscMinor asc;"	
	
	select$ = "SELECT Stations.AtscMajor, Stations.AtscMinor, Programs.Title, ProgramsForStations.ScheduleDate, ProgramsForStations.StationId, ProgramsForStations.AirDateTime, ProgramsForStations.Duration, ProgramsForStations.NewShow, Programs.EpisodeTitle, Programs.Description, Programs.ShowType, Programs.OriginalAirDate, Programs.GracenoteSeasonEpisode, group_concat(DISTINCT ProgramCast.Name) as CastMembers from ProgramsForStations, Programs, Stations, ProgramCast where ScheduleDate >= '" + startDate$ + "' and Programs.ProgramId=ProgramsForStations.ProgramId and ProgramsForStations.StationId=Stations.StationId and Programs.ProgramId=ProgramCast.ProgramId GROUP BY Stations.AtscMajor, Stations.AtscMinor, Programs.Title, ProgramsForStations.ScheduleDate, ProgramsForStations.StationId, ProgramsForStations.AirDateTime, ProgramsForStations.Duration, ProgramsForStations.NewShow, Programs.EpisodeTitle, Programs.Description, Programs.ShowType, Programs.OriginalAirDate, Programs.GracenoteSeasonEpisode, ProgramsForStations.ProgramId order by ProgramsForStations.StationId, ScheduleDate asc, AirDateTime asc, Stations.AtscMajor asc, Stations.AtscMinor asc;"

	m.ExecuteDBSelect(select$, GetDBEpgDataCallback, selectData, invalid)

	return selectData.epgData

End Function
