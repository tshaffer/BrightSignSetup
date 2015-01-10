Function IsString(inputVariable As Object) As Boolean

	if type(inputVariable) = "roString" or type(inputVariable) = "String" then return true
	return false
	
End Function

