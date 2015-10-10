using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using System.Data.SQLite;
using System.Diagnostics;
using System.IO;

namespace transcoderInteractive
{
    // sqlite documentation: http://blog.tigrangasparian.com/2012/02/09/getting-started-with-sqlite-in-c-part-one/
    // http://www.codeproject.com/Articles/22165/Using-SQLite-in-your-C-Application
    // http://system.data.sqlite.org/index.html/doc/trunk/www/downloads.wiki

    // speed tests
    //      ffmpeg directly on card: 7:30
    //      ffmpeg on hd: :50
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        private static string _tmpFolder = String.Empty;

        public MainWindow()
        {
            InitializeComponent();

            _tmpFolder = System.Windows.Forms.Application.LocalUserAppDataPath;
            _tmpFolder = System.IO.Path.Combine(_tmpFolder, "tmp");
            if (!Directory.Exists(_tmpFolder))
            {
                Trace.WriteLine("Create temporary folder : " + _tmpFolder);
                Directory.CreateDirectory(_tmpFolder);
            }
        }

        private void btnBrowse_Click(object sender, RoutedEventArgs e)
        {
            System.Windows.Forms.FolderBrowserDialog browseDialog = new System.Windows.Forms.FolderBrowserDialog();
            browseDialog.SelectedPath = "F:\\";

            browseDialog.Description = "Select drive";

            if (browseDialog.ShowDialog() == System.Windows.Forms.DialogResult.OK)
            {
                txtBoxDrive.Text = browseDialog.SelectedPath;
            }
        }

        private void btnTranscode_Click(object sender, RoutedEventArgs e)
        {
            string drive = txtBoxDrive.Text;
            string jtrFilePath = System.IO.Path.Combine(drive, "jtr.db");

            List<FileToTranscode> filesToTranscode = GetFilesToTranscode(jtrFilePath);
            CopySourceFiles(filesToTranscode);
            TranscodeFiles(filesToTranscode);
            DeleteUntranscodedFiles(filesToTranscode);
            CopyTranscodedFiles(filesToTranscode);

            MessageBox.Show("Files transcoded", "Transcoder", MessageBoxButton.OK, MessageBoxImage.Exclamation);
        }

        private List<FileToTranscode> GetFilesToTranscode(string dbFilePath)
        {
            List<FileToTranscode> filesToTranscode = new List<FileToTranscode>();

            try
            {
                SQLiteConnection m_dbConnection = new SQLiteConnection("Data Source=" + dbFilePath + ";Version=3;");
                m_dbConnection.Open();

                string sql = "SELECT RecordingId, Title, StartDateTime, Duration, FileName, LastViewedPosition, TranscodeComplete FROM Recordings WHERE TranscodeComplete=0;";
                SQLiteCommand command = new SQLiteCommand(sql, m_dbConnection);

                SQLiteDataReader reader = command.ExecuteReader();
                while (reader.Read())
                {
                    Console.WriteLine("Title: " + reader["Title"] + "\tFileName: " + reader["FileName"]);
                    filesToTranscode.Add(
                        new FileToTranscode
                        {
                            Title = (string)reader["Title"],
                            FileName = (string)reader["FileName"]
                        });
                }

                m_dbConnection.Close();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Exception: " + ex.ToString());
            }

            return filesToTranscode;
        }

        private void CopySourceFiles(List<FileToTranscode> filesToTranscode)
        {
            try
            {
                string drive = txtBoxDrive.Text;
                string contentDir = System.IO.Path.Combine(drive, "content");

                foreach (FileToTranscode fileToTranscode in filesToTranscode)
                {
                    string fileName = fileToTranscode.FileName + ".ts";

                    string sourcePath = System.IO.Path.Combine(contentDir, fileName);
                    string targetPath = System.IO.Path.Combine(_tmpFolder, fileName);

                    System.IO.File.Copy(sourcePath, targetPath, true);

                    fileToTranscode.UntranscodedFilePath = targetPath;
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("CopyFiles exception: " + ex.ToString());
            }
        }

        private void TranscodeFiles(List<FileToTranscode> filesToTranscode)
        {
            try
            {
                foreach (FileToTranscode fileToTranscode in filesToTranscode)
                {
                    string sourcePath = fileToTranscode.UntranscodedFilePath;
                    string targetPath = System.IO.Path.Combine(_tmpFolder, fileToTranscode.FileName + ".mp4");

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
                        }

                        // TODO - does ffmpeg locks up some times
                        // no, it's not okay. after timeout, ffmpeg is still running, which is a problem
                        // why is ffmpeg locking up? possibly due to the deadlock described here
                        // http://stackoverflow.com/questions/2471656/why-does-ffmpeg-stop-randomly-in-the-middle-of-a-process

                        process.PriorityClass = ProcessPriorityClass.Normal;

                        bool processExited = process.WaitForExit(600000);
                        LogMessage(GetTimeStamp() + " : TranscodeFile processExited=" + processExited.ToString());
                        if (!processExited)
                        {
                            LogMessage(GetTimeStamp() + " : TranscodeFile, Kill ffmpeg process");
                            process.Kill();
                        }
                        else
                        {
                            LogMessage(GetTimeStamp() + " :TranscodeFile - ffmpeg complete - target = " + targetPath);
                            fileToTranscode.TranscodedFilePath = targetPath;
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
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("TranscodeFiles exception: " + ex.ToString());
            }
        }

        private void DeleteUntranscodedFiles(List<FileToTranscode> filesToTranscode)
        {
            try
            {
                string drive = txtBoxDrive.Text;
                string contentDir = System.IO.Path.Combine(drive, "content");

                foreach (FileToTranscode fileToTranscode in filesToTranscode)
                {
                    string filePath = System.IO.Path.Combine(contentDir, fileToTranscode.FileName + ".ts");
                    System.IO.File.Delete(filePath);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("DeleteUntranscodedFiles exception: " + ex.ToString());
            }
        }

        private void CopyTranscodedFiles(List<FileToTranscode> filesToTranscode)
        {
            try
            {
                string drive = txtBoxDrive.Text;
                string contentDir = System.IO.Path.Combine(drive, "content");

                foreach (FileToTranscode fileToTranscode in filesToTranscode)
                {
                    string fileName = fileToTranscode.FileName + ".mp4";

                    string sourcePath = System.IO.Path.Combine(_tmpFolder, fileName);
                    string targetPath = System.IO.Path.Combine(contentDir, fileName);

                    System.IO.File.Copy(sourcePath, targetPath, true);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("CopyTranscodedFiles exception: " + ex.ToString());
            }
        }

        private static void LogMessage(string msg)
        {
            Trace.WriteLine(msg);
            Console.WriteLine(msg);
        }

        private static string GetTimeStamp()
        {
            return DateTime.Now.ToString();
        }
    }

    class FileToTranscode
    {
        public string Title { get; set; }
        public string FileName { get; set; }
        public string UntranscodedFilePath { get; set; }
        public string TranscodedFilePath { get; set; }
    }
}
