Function IsString(inputVariable As Object) As Boolean

	if type(inputVariable) = "roString" or type(inputVariable) = "String" then return true
	return false
	
End Function


Function StripLeadingSpaces(inputString$ As String) As String

    while true
        if left(inputString$, 1)<>" " then return inputString$
        inputString$ = right(inputString$, len(inputString$)-1)
    endwhile

    return inputString$

End Function


