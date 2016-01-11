﻿using System;
using System.Diagnostics;
using System.IO;
using System.Collections.Specialized;
using System.Xml;
using System.Threading;

namespace transcoder
{
    class Program
    {
        // constants
        //private static string _bsIPAddress = "192.168.2.6:8080";
        //private static string _bsIPAddress = "10.1.0.244:8080";
        //private static string _bsIPAddress = "192.168.2.6:8080";
        //private static string _bsIPAddress = "192.168.0.117:8080";
        private static string _bsIPAddress = "10.1.0.241:8080";

        //private static string _jtrConnectIPAddress = "http://192.168.0.106:3000/";
        private static string _jtrConnectIPAddress = "http://10.1.0.73:3000/";

        private static StreamWriter _writer = null;

        private static int _timeToDelayAfterConversion = 60000;
        private static int _timeBetweenChecks = 60000;

        private static string _tmpFolder = String.Empty;

        static void Main(string[] args)
        {
            try
            {
                Initialize();

                //HTTPGet httpGet = new HTTPGet();
                //httpGet.Timeout = 5000;
                //string url = "http://192.168.0.106:3000/addRecording";
                //httpGet.Request(url);

                while (true)
                {
                    FileToTranscode fileToTranscode = GetFileToTranscode();
                    if (fileToTranscode != null)
                    {
                        string fileToTranscodePath = fileToTranscode.Path;

                        string transcodedFilePath = TranscodeFile(fileToTranscodePath);

                        if (!String.IsNullOrEmpty(transcodedFilePath))
                        {
                            // add transcoded file to JtrConnect db
                            NameValueCollection queryString = System.Web.HttpUtility.ParseQueryString(string.Empty);

                            queryString["Duration"] = fileToTranscode.Duration;
                            queryString["FileName"] = fileToTranscode.FileName;
                            queryString["HLSSegmentationComplete"] = fileToTranscode.HLSSegmentationComplete;
                            queryString["HLSUrl"] = fileToTranscode.HLSUrl;
                            queryString["JtrStorageDevice"] = fileToTranscode.JtrStorageDevice;
                            queryString["LastViewedPosition"] = fileToTranscode.LastViewedPosition;
                            queryString["path"] = fileToTranscode.Path;
                            queryString["RecordingId"] = fileToTranscode.Id;
                            queryString["StartDateTime"] = fileToTranscode.StartDateTime;
                            queryString["Title"] = fileToTranscode.Title;
                            queryString["TranscodeComplete"] = "1";
                            queryString["OnJtrConnectServer"] = "1";
                            queryString["JtrConnectPath"] = transcodedFilePath;
                            string fullQueryString = queryString.ToString();

                            HTTPGet httpGet = new HTTPGet();

                            //string url = String.Concat("http://192.168.0.106:3000/addRecording?", fullQueryString);
                            string url = String.Concat(_jtrConnectIPAddress + "addRecording?", fullQueryString);
                            httpGet.Timeout = 5000;
                            httpGet.Request(url);

                            if (httpGet.StatusCode == 200)
                            {
                                bool ok = UploadFileToServer(fileToTranscode.Id, transcodedFilePath);

                                if (ok)
                                {
                                    // delete local file (downloaded file)
                                    LogMessage(GetTimeStamp() + " : Main: delete " + fileToTranscodePath);
                                    // currently not deleting for purposes of debugging
                                    //File.Delete(fileToTranscodePath);

                                    LogMessage(GetTimeStamp() + " : Main: transcode successfully completed");

                                }
                                // delay some amount of time before looking for the next file
                                Thread.Sleep(_timeToDelayAfterConversion);
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                LogMessage(GetTimeStamp() + " : Main: " + ex.ToString());
                if (_writer != null) _writer.Close();
            }
        }

        private static void Initialize()
        {
            try
            {
                _tmpFolder = System.Windows.Forms.Application.LocalUserAppDataPath;

                _tmpFolder = System.IO.Path.Combine(_tmpFolder, "tmp");
                if (!Directory.Exists(_tmpFolder))
                {
                    Trace.WriteLine("Create temporary folder : " + _tmpFolder);
                    Directory.CreateDirectory(_tmpFolder);
                }

                string logFilePath = System.IO.Path.Combine(System.Windows.Forms.Application.LocalUserAppDataPath, DateTime.Now.ToString("yyyyMMdd-HHmm") + ".txt");

                _writer = new StreamWriter(logFilePath);
                _writer.AutoFlush = true;

                // Redirect standard output from the console to the output file.
                Console.SetOut(_writer);
            }
            catch (Exception ex)
            {
                Trace.WriteLine("Exception in initialize: " + ex.ToString());
            }

        }

        private static string GetTimeStamp()
        {
            return DateTime.Now.ToString();
        }

        private static FileToTranscode GetFileToTranscode()
        {
            while (true)
            {
                LogMessage(GetTimeStamp() + " : FileToTranscode: ");

                HTTPGet httpGet = new HTTPGet();

                string url = String.Concat("http://", _bsIPAddress, "/fileToTranscode");
                httpGet.Timeout = 5000;

                httpGet.Request(url);
                if (httpGet.StatusCode == 200)
                {
                    string xml = httpGet.ResponseBody;
                    XmlDocument doc = new XmlDocument();
                    doc.LoadXml(xml);

                    XmlNodeList nodes = doc.GetElementsByTagName("FileToTranscode");
                    if (nodes.Count > 0)
                    {
                        string relativeUrl = String.Empty;

                        XmlElement fileToTranscodeElem = (XmlElement)nodes[0];

                        FileToTranscode fileToTranscode = new FileToTranscode();

                        XmlNodeList childNodes = fileToTranscodeElem.ChildNodes;
                        foreach (XmlNode childNode in childNodes)
                        {
                            if (childNode.Name == "id")
                            {
                                fileToTranscode.Id = childNode.InnerText;
                            }
                            else if (childNode.Name == "path")
                            {
                                relativeUrl = childNode.InnerText;
                                fileToTranscode.Path = relativeUrl;
                            }
                            else if (childNode.Name == "duration")
                            {
                                fileToTranscode.Duration = childNode.InnerText;
                            }
                            else if (childNode.Name == "fileName")
                            {
                                fileToTranscode.FileName = childNode.InnerText;
                            }
                            else if (childNode.Name == "hlsSegmentationComplete")
                            {
                                fileToTranscode.HLSSegmentationComplete = childNode.InnerText;
                            }
                            else if (childNode.Name == "hlsUrl")
                            {
                                fileToTranscode.HLSUrl = childNode.InnerText;
                            }
                            else if (childNode.Name == "jtrStorageDevice")
                            {
                                fileToTranscode.JtrStorageDevice = childNode.InnerText;
                            }
                            else if (childNode.Name == "lastViewedPosition")
                            {
                                fileToTranscode.LastViewedPosition = childNode.InnerText;
                            }
                            else if (childNode.Name == "startDateTime")
                            {
                                fileToTranscode.StartDateTime = childNode.InnerText;
                            }
                            else if (childNode.Name == "title")
                            {
                                fileToTranscode.Title = childNode.InnerText;
                            }
                        }

                        if (fileToTranscode.Id != String.Empty && relativeUrl != String.Empty)
                        {
                            LogMessage(GetTimeStamp() + " : FileToTranscode: file spec retrieved, id=" + fileToTranscode.Id.ToString() + ", relativeUrl=" + relativeUrl);

                            // XML contains the path of the file relative to root. Use that as the relative url; then use the last part of the relative Url as the file name
                            string tmpPath = System.IO.Path.Combine(_tmpFolder, relativeUrl);
                            string targetPath = System.IO.Path.Combine(_tmpFolder, System.IO.Path.GetFileName(tmpPath));

                            httpGet = new HTTPGet();
                            httpGet.Timeout = 120000;   // 2 minutes - long enough for large files?

                            string fileUrl = "http://" + _bsIPAddress + "/" + relativeUrl;
                            LogMessage(GetTimeStamp() + " : FileToTranscode: retrieve file from " + fileUrl);

                            httpGet.RequestToFile(fileUrl, targetPath);

                            if (httpGet.StatusCode == 200)
                            {
                                LogMessage(GetTimeStamp() + " : FileToTranscode: file retrieved and written to " + targetPath);

                                fileToTranscode.Path = targetPath;
                                return fileToTranscode;
                            }
                            else
                            {
                                LogMessage(GetTimeStamp() + " : FileToTranscode: error downloading file, status code=" + httpGet.StatusCode.ToString());
                                Thread.Sleep(_timeBetweenChecks);
                            }
                        }
                        else
                        {
                            LogMessage(GetTimeStamp() + " : FileToTranscode: error parsing XML");
                            Thread.Sleep(_timeBetweenChecks);
                        }
                    }
                }
                else
                {
                    LogMessage(GetTimeStamp() + " : FileToTranscode: status code=" + httpGet.StatusCode.ToString());
                    Thread.Sleep(_timeBetweenChecks);
                }

                Thread.Sleep(_timeBetweenChecks);
            }
        }

        public static string TranscodeFile(string sourcePath)
        {
            //string targetPath = System.IO.Path.Combine(_tmpFolder, System.IO.Path.GetFileNameWithoutExtension(sourcePath) + ".mp4");
            string targetPath = System.Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
            targetPath = System.IO.Path.Combine(targetPath, "Miscellaneous", "Personal", "jtrRecordings", System.IO.Path.GetFileNameWithoutExtension(sourcePath) + ".mp4");
            return targetPath;

            LogMessage(GetTimeStamp() + " : TranscodeFile " + sourcePath + " to " + targetPath);

            // >ffmpeg -i GoodWife4.ts -bsf:a aac_adtstoasc -c copy GoodWife4.mp4
            string ffmpegArgs = String.Format("-i \"{0}\" -bsf:a aac_adtstoasc -c copy  \"{1}\"", sourcePath, targetPath);

            Process process = new Process();
            try
            {
                process.StartInfo.FileName = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "ffmpeg.exe");
                process.StartInfo.Arguments = ffmpegArgs;
                process.StartInfo.UseShellExecute = false;
                //process.StartInfo.RedirectStandardError = true;
                process.StartInfo.RedirectStandardError = false;
                process.StartInfo.CreateNoWindow = true;

                //process.Start();

                LogMessage(GetTimeStamp() + " : TranscodeFile:  start ffmpeg");
                if (!process.Start())
                {
                    LogMessage(GetTimeStamp() + " : TranscodeFile error starting process");
                    return null;
                }

                // TODO - does ffmpeg locks up some times
                // no, it's not okay. after timeout, ffmpeg is still running, which is a problem
                // why is ffmpeg locking up? possibly due to the deadlock described here
                // http://stackoverflow.com/questions/2471656/why-does-ffmpeg-stop-randomly-in-the-middle-of-a-process

                //StreamReader reader = process.StandardError;
                //string line;
                //while ((line = reader.ReadLine()) != null)
                //{
                //    Trace.WriteLine(line);
                //}

                process.PriorityClass = ProcessPriorityClass.Normal;

                bool processExited = process.WaitForExit(600000);
                LogMessage(GetTimeStamp() + " : TranscodeFile processExited=" + processExited.ToString());
                if (!processExited)
                {
                    LogMessage(GetTimeStamp() + " : TranscodeFile, Kill ffmpeg process");
                    process.Kill();
                }
            }
            catch (Exception ex)
            {
                LogMessage(GetTimeStamp() + " : TranscodeFile - ffmpeg exception converting " + sourcePath + " to " + targetPath);
                LogMessage(ex.ToString());

                targetPath = null;
            }
            finally
            {
                process.Dispose();
            }

            return targetPath;
        }

        private static bool UploadFileToServer(string id, string filePath)
        {
            string fileName = System.IO.Path.GetFileName(filePath);

            LogMessage(GetTimeStamp() + " : UploadFileToServer:  id=" + id.ToString() + ", filePath=" + filePath + ", fileName=" + fileName);

            NameValueCollection nvc = new NameValueCollection();

            nvc.Add("Destination-Filename", String.Concat("content/", fileName));
            nvc.Add("Friendly-Filename", fileName);
            nvc.Add("DB-Id", id);

            try
            {
                string responseString = HTTPPost.HttpUploadFile("http://" + _bsIPAddress + "/TranscodedFile", filePath, fileName, nvc);
                if (responseString != "RECEIVED")
                {
                    LogMessage(GetTimeStamp() + " : UploadFileToServer:  HTTPPost returned " + responseString);
                    return false;
                }
            }
            catch (Exception ex)
            {
                LogMessage("Exception in HTTPPost: " + ex.ToString());
                return false;
            }

            LogMessage(GetTimeStamp() + " : UploadFileToServer: success");
            return true;
        }

        private static void LogMessage(string msg)
        {
            Trace.WriteLine(msg);
            Console.WriteLine(msg);
        }
    }

    class FileToTranscode
    {
        public string Id { get; set; }
        public string Path { get; set; }
        public string Duration { get; set; }
        public string FileName { get; set; }
        public string HLSSegmentationComplete { get; set; }
        public string HLSUrl { get; set; }
        public string JtrStorageDevice { get; set; }
        public string LastViewedPosition { get; set; }
        public string StartDateTime { get; set; }
        public string Title { get; set; }
    }
}
