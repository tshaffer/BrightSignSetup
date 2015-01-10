using System;
using System.IO;
using System.Net;
using System.Text;
using System.Diagnostics;

/// <summary>
/// Summary description for HTTPGet
/// </summary>
public class HTTPGet
{
    private HttpWebRequest request;
    private HttpWebResponse response;

    private byte[] responseBuffer;
    private string responseBody;
    private string escapedBody;
    private int statusCode;
    private double responseTime;
    private string errorMessage="";
    private int timeout = -1;
    private NetworkCredential networkCredential = null;

    public string ResponseBody { get { return responseBody; } }
    public byte[] ResponseBuffer { get { return responseBuffer; } }
    public string EscapedBody { get { return GetEscapedBody(); } }
    public int StatusCode { get { return statusCode; } }
    public double ResponseTime { get { return responseTime; } }
    public string Headers { get { return GetHeaders(); } }
    public string StatusLine { get { return GetStatusLine(); } }
    public string ErrorMessage { get { return errorMessage; } }
    
    public HTTPGet()
	{
        this.responseBuffer = new byte[65536 + 64];
        this.statusCode = -1;
    }

    public int Timeout
    {
        set { this.timeout = value; }
    }

    public void SetUsernamePassword(string userName, string password)
    {
        this.networkCredential = new NetworkCredential(userName, password);
    }

    public void RangeRequest(string url, int startOfRange, int endOfRange)
    {
        Stopwatch timer = new Stopwatch();
        this.responseBody = "";

        this.request = (HttpWebRequest)WebRequest.Create(url);
        if (endOfRange != 0)
        {
            this.request.AddRange(startOfRange, endOfRange);
        }

        try
        {
            timer.Start();
            this.response = (HttpWebResponse)this.request.GetResponse();
            Stream respStream = this.response.GetResponseStream();

            int offset = 0;
            int remaining = (int)this.response.ContentLength;
            while (remaining > 0)
            {
                int read = respStream.Read(this.responseBuffer, offset, remaining);
                remaining -= read;
                offset += read;
            }

            timer.Stop();

            this.statusCode = (int)(HttpStatusCode)this.response.StatusCode;
            this.responseTime = timer.ElapsedMilliseconds / 1000.0;
        }
        catch (WebException ex)
        {
            this.response = (HttpWebResponse)ex.Response;
            this.responseBody = "No Server Response";
            this.escapedBody = "No Server Response";
            this.responseTime = 0.0;
        }
    }

    public void Request(string url)
    {
        Stopwatch timer = new Stopwatch();
        StringBuilder respBody = new StringBuilder();

        this.request = (HttpWebRequest)WebRequest.Create(url);
        if (this.timeout > 0)
        {
            this.request.Timeout = this.timeout;
        }
        if (this.networkCredential != null)
        {
            this.request.Credentials = this.networkCredential;
        }

        try
        {
            timer.Start();
            this.response = (HttpWebResponse)this.request.GetResponse();
            byte[] buf = new byte[8192];
            Stream respStream = this.response.GetResponseStream();
            int count = 0;
            do
            {
                count = respStream.Read(buf, 0, buf.Length);
                if (count != 0)
                    respBody.Append(Encoding.ASCII.GetString(buf, 0, count));
            }
            while (count > 0);
            timer.Stop();

            this.responseBody = respBody.ToString();
            this.statusCode = (int)(HttpStatusCode)this.response.StatusCode;
            this.responseTime = timer.ElapsedMilliseconds / 1000.0;
        }
        catch (WebException ex)
        {
            this.response = (HttpWebResponse)ex.Response;
            this.responseBody = "No Server Response";
            this.escapedBody = "No Server Response";
            this.responseTime = 0.0;

            // return 401, 404 correctly
            if (ex.ToString().IndexOf("401") > 0)
            {
                this.statusCode = 401;
            }
            else if (ex.ToString().IndexOf("404") > 0)
            {
                this.statusCode = 404;
            }
        }
    }

    public void RequestToFile(string url, string filePath)
    {
        FileStream fs = null;
        BinaryWriter w = null;

        Stopwatch timer = new Stopwatch();
        StringBuilder respBody = new StringBuilder();

        this.request = (HttpWebRequest)WebRequest.Create(url);

        try
        {
            timer.Start();
            this.response = (HttpWebResponse)this.request.GetResponse();
            byte[] buf = new byte[8192];
            Stream respStream = this.response.GetResponseStream();

            fs = new FileStream(filePath, FileMode.Create);
            w = new BinaryWriter(fs);
            int count = 0;
            do
            {
                count = respStream.Read(buf, 0, buf.Length);
                if (count != 0)
                {
                    w.Write(buf, 0, count);
                }
            }
            while (count > 0);
            w.Close();
            fs.Close();

            timer.Stop();

            this.responseBody = respBody.ToString();
            this.statusCode = (int)(HttpStatusCode)this.response.StatusCode;
            this.responseTime = timer.ElapsedMilliseconds / 1000.0;
        }
        catch (WebException ex)
        {
            this.errorMessage = ex.Message;
            this.response = (HttpWebResponse)ex.Response;
            this.responseBody = "No Server Response";
            this.escapedBody = "No Server Response";
            this.responseTime = 0.0;
        }
        catch (Exception ex)
        {
            this.errorMessage = ex.Message;

            if (w != null)
            {
                w.Close();
            }
            if (fs != null)
            {
                fs.Close();
            }
        }
    }

    public byte[] RequestToMemory(string url)
    {
        byte[] byteArray = null;

        Stopwatch timer = new Stopwatch();

        this.request = (HttpWebRequest)WebRequest.Create(url);

        try
        {
            timer.Start();
            this.response = (HttpWebResponse)this.request.GetResponse();
            byte[] buf = new byte[8192];
            Stream respStream = this.response.GetResponseStream();

            MemoryStream ms = new MemoryStream();

            int count = 0;
            do
            {
                count = respStream.Read(buf, 0, buf.Length);
                if (count != 0)
                {
                    ms.Write(buf, 0, count);
                }
            }
            while (count > 0);

            ms.Seek(0, SeekOrigin.Begin);
            byteArray = new byte[ms.Length];
            count = ms.Read(byteArray, 0, (int)ms.Length);

            ms.Close();

            timer.Stop();

            this.statusCode = (int)(HttpStatusCode)this.response.StatusCode;
            this.responseTime = timer.ElapsedMilliseconds / 1000.0;
        }
        catch (WebException ex)
        {
            this.response = (HttpWebResponse)ex.Response;
            this.responseBody = "No Server Response";
            this.escapedBody = "No Server Response";
            this.responseTime = 0.0;
        }

        return byteArray;
    }

    public void HeadRequest(string url)
    {
        Stopwatch timer = new Stopwatch();

        try
        {
            this.request = (HttpWebRequest)WebRequest.Create(url);
            this.request.Method = "HEAD";

            timer.Start();
            this.response = (HttpWebResponse)this.request.GetResponse();
            timer.Stop();

            this.statusCode = (int)(HttpStatusCode)this.response.StatusCode;
            this.responseTime = timer.ElapsedMilliseconds / 1000.0;
        }
        catch (Exception ex)
        {
            // could be UriFormtException, WebException, or System.InvalidCastException
            this.errorMessage = ex.Message;
            this.responseBody = "No Server Response";
            this.escapedBody = "No Server Response";
            this.responseTime = 0.0;
            return;
        }
    }


    private string GetEscapedBody()
    {  // HTML escaped chars
        string escapedBody = responseBody;
        escapedBody = escapedBody.Replace("&", "&amp;");
        escapedBody = escapedBody.Replace("<", "&lt;");
        escapedBody = escapedBody.Replace(">", "&gt;");
        escapedBody = escapedBody.Replace("'", "&apos;");
        escapedBody = escapedBody.Replace("\"", "&quot;");
        this.escapedBody = escapedBody;

        return escapedBody;
    }



    private string GetHeaders()
    {
        if (response == null)
            return "No Server Response";
        else
        {
            StringBuilder headers = new StringBuilder();
            for (int i = 0; i < this.response.Headers.Count; ++i)
                headers.Append(String.Format("{0}:{1}|",
                    response.Headers.Keys[i], response.Headers[i]));

            return headers.ToString();
        }
    }



    private string GetStatusLine()
    {
        if (response == null)
            return "No Server Response";
        else
            return String.Format("HTTP/{0} {1} {2}", response.ProtocolVersion,
                (int)response.StatusCode, response.StatusDescription);
    }
}
