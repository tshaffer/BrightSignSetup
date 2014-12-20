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

		m.CreateDBTable("CREATE TABLE Recordings (RecordingId INTEGER PRIMARY KEY AUTOINCREMENT, FileName TEXT, FilePath TEXT, Duration INT);")

		m.CreateDBTable("CREATE TABLE ScheduledRecordings (ScheduledRecordingId INTEGER PRIMARY KEY AUTOINCREMENT, StartDateTime INT, Channel TEXT);")

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
