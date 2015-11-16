using System;
using System.Collections.Generic;
using System.Windows;
using System.Windows.Documents;
using System.IO;
using System.Diagnostics;
using System.Xml;
using System.Collections.Specialized;

namespace siteDownloader
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();

            txtBoxSiteFolder.Text = "C:\\Users\\Ted Shaffer\\Documents\\Miscellaneous\\Personal\\jtr\\jtr\\app";
            txtBoxSiteFolder.Text = "C:\\Users\\Ted Shaffer\\Documents\\Visual Studio 2012\\Projects\\jtr\\jtr";
            txtBoxSiteFolder.Text = "C:\\Users\\Ted Shaffer\\Documents\\Webstorm\\jtr\\jtr\\staging";
            txtBoxSiteFolder.Text = "Y:\\Documents\\Projects\\jtr\\jtr\\staging";

            //txtBoxIPAddress.Text = "10.1.0.90:8080";
            //txtBoxIPAddress.Text = "10.1.0.241:8080";
            txtBoxIPAddress.Text = "192.168.0.110:8080";
        }

        private void btnBrowse_Click(object sender, RoutedEventArgs e)
        {
            System.Windows.Forms.FolderBrowserDialog browseDialog = new System.Windows.Forms.FolderBrowserDialog();
            browseDialog.SelectedPath = "C:\\Users\\Ted Shaffer\\Documents\\Webstorm\\jtr\\jtr\\staging";

            browseDialog.Description = "Select Site Folder";

            if (browseDialog.ShowDialog() == System.Windows.Forms.DialogResult.OK)
            {
                txtBoxSiteFolder.Text = browseDialog.SelectedPath;
            }
        }

        private void btnBeginTransfer_Click(object sender, RoutedEventArgs e)
        {
            if (String.IsNullOrEmpty(txtBoxSiteFolder.Text) || String.IsNullOrEmpty(txtBoxIPAddress.Text))
            {
                MessageBox.Show("Site folder and IP address required", "Site Downloader", MessageBoxButton.OK, MessageBoxImage.Error);
                return;
            }
            BeginTransfer(txtBoxSiteFolder.Text, txtBoxIPAddress.Text);
        }

        private void BeginTransfer(string siteFolder, string ipAddress)
        {
            try
            {
                List<FileToTransfer> filesInSite = GetSiteFiles(siteFolder);

                string xmlPath = GenerateFilesInSite(filesInSite);

                List<string> relativePathsToTransfer = GetFilesToTransfer(ipAddress, xmlPath);

                if (relativePathsToTransfer != null && relativePathsToTransfer.Count > 0)
                {
                    txtBoxFilesTransferred.Text = "Copying files to " + ipAddress;
                    TransferFiles(siteFolder, relativePathsToTransfer, ipAddress);
                    txtBoxFilesTransferred.Text = txtBoxFilesTransferred.Text + Environment.NewLine + "File transfer complete";
                }
                else
                {
                    txtBoxFilesTransferred.Text = "No files to transfer. Site up to date.";
                }

                // tell script to exit
                HTTPGet httpGet = new HTTPGet();
                httpGet.Timeout = 10000;
                httpGet.Request("http://" + txtBoxIPAddress.Text + "/ExitScript");

            }
            catch (Exception ex)
            {
                Trace.WriteLine("Exception in BeginTransfer: " + ex.ToString());
                MessageBox.Show("Exception in BeginTransfer");
            }
        }

        private void TransferFiles(string siteFolder, List<string> relativePathsToTransfer, string ipAddress)
        {
            foreach (string relativePath in relativePathsToTransfer)
            {
                txtBoxFilesTransferred.Text = txtBoxFilesTransferred.Text + Environment.NewLine + relativePath;
                string fullPath = siteFolder + "/" + relativePath;
                fullPath = System.IO.Path.Combine(siteFolder, relativePath);
                UploadFileToBrightSign(fullPath, relativePath, ipAddress);
            }
        }

        private bool UploadFileToBrightSign(string sourcePath, string destinationRelativePath, string ipAddress)
        {
            Trace.WriteLine("UploadFileToBrightSign: " + sourcePath);

            //string encodedFileName = HttpUtility.UrlEncode(fileName);

            try
            {
                NameValueCollection nvc = new NameValueCollection();

                nvc.Add("Destination-Filename", destinationRelativePath);
                HTTPPost.HttpUploadFile("http://" + ipAddress + "/UploadFile", sourcePath, destinationRelativePath, nvc);

                return true;
            }
            catch (Exception ex)
            {
                Trace.WriteLine("Exception in UploadFileToBrightSign: " + ex.ToString());
                MessageBox.Show("Exception in UploadFileToBrightSign");
            }

            return false;
        }


        private List<string> ParseFilesToTransferXml(string xml)
        {
            List<string> filesToTransfer = new List<string>();

            XmlDocument doc = new XmlDocument();
            doc.LoadXml(xml);

            XmlNodeList fileNodes = doc.GetElementsByTagName("file");

            foreach (XmlElement fileItem in fileNodes)
            {
                XmlNodeList filePaths = fileItem.GetElementsByTagName("filePath");
                if (filePaths.Count == 1)
                {
                    XmlElement filePathElement = (XmlElement)filePaths[0];
                    filesToTransfer.Add(filePathElement.InnerText.Trim());
                }
            }

            return filesToTransfer;
        }

        private List<string> GetFilesToTransfer(string ipAddress, string xmlPath)
        {
            try
            {
                NameValueCollection nvc = new NameValueCollection();
                string filesToTransferXML = HTTPPost.HttpUploadFile("http://" + ipAddress + "/GetFilesToTransfer", xmlPath, "filesInSite.xml", nvc);
                if (filesToTransferXML != "404")
                {
                    if (!String.IsNullOrEmpty(filesToTransferXML))
                    {
                        return ParseFilesToTransferXml(filesToTransferXML);
                    }
                }
                else
                {
                    Trace.WriteLine("404 received - no files to transfer");
                }
            }
            catch (Exception ex)
            {
                Trace.WriteLine("Exception in GetFilesToTransfer: " + ex.ToString());
                MessageBox.Show(ex.ToString());
            }

            return null;
        }

        private string GenerateFilesInSite(List<FileToTransfer> filesToTransfer)
        {
            string folder = System.Windows.Forms.Application.LocalUserAppDataPath;

            XmlTextWriter writer = null;

            string tmpFileName = "tmpListOfFiles.xml";
            string tmpFilePath = System.IO.Path.Combine(folder, tmpFileName);

            try
            {
                writer = new XmlTextWriter(tmpFilePath, System.Text.Encoding.UTF8);

                writer.Formatting = Formatting.Indented;

                writer.WriteStartDocument();
                writer.WriteStartElement("files");
                writer.WriteAttributeString("version", "1.0");

                foreach (FileToTransfer fileToTransfer in filesToTransfer)
                {
                    writer.WriteStartElement("file");

                    writer.WriteElementString("fileName", fileToTransfer.Name);
                    writer.WriteElementString("filePath", fileToTransfer.Path);
                    writer.WriteElementString("hashValue", fileToTransfer.SHA1);
                    writer.WriteElementString("fileSize", fileToTransfer.Size.ToString());

                    writer.WriteEndElement(); //file
                }

                writer.WriteEndElement(); // files

                writer.WriteEndDocument();
                writer.Close();
                writer = null;
            }
            catch (Exception ex)
            {
                Trace.WriteLine("Exception in GenerateFileToTransfer: " + ex.ToString());
                MessageBox.Show("Exception in GenerateFileToTransfer");
                return null;
            }

            return tmpFilePath;
        }

        private List<FileToTransfer> GetSiteFiles(string folder)
        {
            List<FileToTransfer> filesToTransfer = new List<FileToTransfer>();

            try
            {
                foreach (string file in Directory.EnumerateFiles(folder, "*.*", SearchOption.AllDirectories))
                {
                    string relativePath = file.Substring(folder.Length + 1);
                    FileInfo fi = new FileInfo(file);
                    long fileSize = fi.Length;
                    string sha1 = GetSHA1Hash(file);

                    filesToTransfer.Add(
                        new FileToTransfer
                        {
                            Name = fi.Name,
                            Path = relativePath,
                            Size = fileSize,
                            SHA1 = sha1
                        });
                }

            }
            catch (Exception ex)
            {
                Trace.WriteLine("Exception in GetFilesToTransfer: " + ex.ToString());
                MessageBox.Show("Exception in GetFilesToTransfer");
                return null;
            }
            return filesToTransfer;
        }

        public static string GetSHA1Hash(string pathName)
        {
            string strResult = "";
            string strHashData = "";

            byte[] arrbytHashValue;
            System.IO.FileStream oFileStream = null;

            System.Security.Cryptography.SHA1CryptoServiceProvider oSHA1Hasher =
                       new System.Security.Cryptography.SHA1CryptoServiceProvider();

            try
            {
                oFileStream = GetFileStream(pathName);
                arrbytHashValue = oSHA1Hasher.ComputeHash(oFileStream);
                oFileStream.Close();

                strHashData = System.BitConverter.ToString(arrbytHashValue);
                strHashData = strHashData.Replace("-", "");
                strResult = strHashData;
            }
            catch (Exception ex)
            {
                Trace.WriteLine("Exception in GetSHA1Hash(string pathName)");
                Trace.WriteLine("Exception is: " + ex.ToString());
            }

            return (strResult.ToLower());
        }

        private static System.IO.FileStream GetFileStream(string pathName)
        {
            return (new System.IO.FileStream(pathName, System.IO.FileMode.Open,
                      System.IO.FileAccess.Read, System.IO.FileShare.ReadWrite));
        }

        class FileToTransfer
        {
            public string Name { get; set; }
            public string Path { get; set; }
            public long Size { get; set; }
            public string SHA1 { get; set; }
        }
    }
}
