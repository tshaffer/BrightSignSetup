using System.Collections.Specialized;
using System.Diagnostics;
using System.IO;
using System.Net;
using System;

    // originally based on http://stackoverflow.com/questions/566462/upload-files-with-httpwebrequest-multipart-form-data
    // also see: http://stackoverflow.com/questions/566462/upload-files-with-httpwebrequest-multipart-form-data/2996904#2996904
    public class HTTPPost
    {
        public static string HttpUploadFile(string url, string filePath, string fileName, NameValueCollection nvc)
        {
            Trace.WriteLine(string.Format("Uploading {0} to {1}", filePath, url));

            // http://support.microsoft.com/kb/908573 - starting point for code that might enable no buffer and authentication simultaneously - doesn't work out of the box.
            //HttpWebRequest WRequest;
            //HttpWebResponse WResponse;
            ////preAuth the request
            //// You can add logic so that you only pre-authenticate the very first request.
            //// You should not have to pre-authenticate each request.
            //WRequest = (HttpWebRequest)HttpWebRequest.Create(url);
            //// Set the username and the password.
            //WRequest.Credentials = credentials;
            //WRequest.PreAuthenticate = true;
            //WRequest.UserAgent = "Upload Test";
            //WRequest.Method = "HEAD";
            //WRequest.Timeout = 10000;
            //WResponse = (HttpWebResponse)WRequest.GetResponse();
            //WResponse.Close();

            ICredentials credentials = new NetworkCredential("", "");

            bool authenticationRequired = false;

            // **temporary** hack - authentication and no buffering don't work together - limits file size when using authentication to memory
            bool allowStreamBuffering = authenticationRequired;

            string boundary = "---------------------" + DateTime.Now.Ticks.ToString("x");
            byte[] boundarybytes = System.Text.Encoding.ASCII.GetBytes("--" + boundary + "\r\n");

            HttpWebRequest wr = (HttpWebRequest)WebRequest.Create(url);
            wr.ContentType = "multipart/form-data; boundary=" + boundary;
            wr.Method = "POST";
            wr.KeepAlive = true;
            wr.Credentials = credentials;
            wr.SendChunked = true;
            wr.ReadWriteTimeout = 3600000;
            wr.Timeout = 3600000;
            wr.AllowWriteStreamBuffering = allowStreamBuffering;
            wr.Proxy = null;
            //wr.PreAuthenticate = true;

            foreach (string key in nvc.Keys)
            {
                wr.Headers.Add(key, nvc[key]);
            }
            Stream rs = wr.GetRequestStream();
            rs.ReadTimeout = 3600000;
            rs.WriteTimeout = 3600000;
            rs.WriteTimeout = 3600000;

            Stream memStream = new System.IO.MemoryStream();

            memStream.Write(boundarybytes, 0, boundarybytes.Length);

            string headerTemplate = "Content-Disposition: form-data; name=\"{0}\"; filename=\"{1}\"\r\nContent-Type: application/octet-stream\r\n\r\n";
            string header = string.Format(headerTemplate, "file", fileName);
            byte[] headerbytes = System.Text.Encoding.UTF8.GetBytes(header);
            memStream.Write(headerbytes, 0, headerbytes.Length);

            memStream.Position = 0;
            byte[] tempBuffer = new byte[memStream.Length];
            memStream.Read(tempBuffer, 0, tempBuffer.Length);
            memStream.Close();
            rs.Write(tempBuffer, 0, tempBuffer.Length);

            int bufferSize = 65536 * 4;
            FileInfo fi = new FileInfo(filePath);
            long fileLength = fi.Length;
            int numChunks = (int)(fileLength / (long)bufferSize);

            FileStream fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
            byte[] buffer = new byte[bufferSize];
            int bytesRead = 0;
            while ((bytesRead = fileStream.Read(buffer, 0, buffer.Length)) != 0)
            {
                rs.Write(buffer, 0, bytesRead);
            }
            fileStream.Close();

            byte[] trailer = System.Text.Encoding.ASCII.GetBytes("\r\n--" + boundary + "--\r\n");
            rs.Write(trailer, 0, trailer.Length);
            rs.Close();

            WebResponse wresp = null;
            try
            {
                wresp = wr.GetResponse();
                Stream stream2 = wresp.GetResponseStream();
                StreamReader reader2 = new StreamReader(stream2);
                string responseString = reader2.ReadToEnd();
                wr = null;
                return responseString;
            }
            catch (Exception ex)
            {
                Trace.WriteLine("Error transferring file using local file networking: " + ex.ToString());
                if (wresp != null)
                {
                    wresp.Close();
                    wresp = null;
                }
                throw new Exception(ex.ToString());
            }
            finally
            {
                wr = null;
            }
        }
    }
