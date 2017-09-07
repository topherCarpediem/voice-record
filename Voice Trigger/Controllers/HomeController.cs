using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

using System.Configuration;
using System.Data.SqlClient;
using System.Diagnostics;
using System.IO;


using System.Data;

namespace Voice_Trigger.Controllers
{
    public class HomeController : Controller
    {
        // GET: Home
        [HttpGet]
        public ActionResult Index()
        {
            //ReadAllBy
            //query("insert into tblWords values('Hello')");
            //Debug.WriteLine("Helloooooooooooooooooooo");
            return View();
        }

        [HttpPost]
        public ActionResult Upload() {
           

            string folder_name = String.Format("{0:yyyy-MM-dd}", DateTime.Now);

            var folder = Server.MapPath("~/App_Data/UploadRecordings/" + folder_name);

            if (!Directory.Exists(folder))
            {
                Directory.CreateDirectory(folder);
                if (Request.Files.Count > 0)
                {
                    try
                    {

                        string name = Request.Form["word_name"].ToLower();
                        string location = Request.Form["location"];
                        string gender = Request.Form["gender"];
                        string age = Request.Form["age"];

                        HttpFileCollectionBase files = Request.Files;

                        HttpPostedFileBase file = files[0];

                        string filename = file.FileName;
                        string the_filename = Path.Combine(folder, filename);
                        file.SaveAs(the_filename);

                        var filepath = Server.MapPath("~/App_Data/UploadRecordings/" + folder_name + "/" + filename);
                        var url = "~/App_Data/UploadRecordings/" + folder_name + "/" + filename;

                        query(name, location, gender, age, filepath, url);

                        folder_name = null;
                        folder = null;

                        return new JsonResult { Data = "File uploaded successfully" };
                    }

                    catch (Exception exception)
                    {
                        return Json("Error occurred. Error details: " + exception.Message);
                    }

                }
                else
                {
                    return Json("No file(s) selected.");
                }

            }
            else {

                if (Request.Files.Count > 0)
                {
                    try
                    {

                        string name = Request.Form["word_name"].ToLower();
                        string location = Request.Form["location"];
                        string gender = Request.Form["gender"];
                        string age = Request.Form["age"];

                        HttpFileCollectionBase files = Request.Files;

                        HttpPostedFileBase file = files[0];

                        string filename = file.FileName;
                        string the_filename = Path.Combine(folder, filename);
                        file.SaveAs(the_filename);

                        var filepath = Server.MapPath("~/App_Data/UploadRecordings/" + folder_name + "/" + filename);
                        var url = "~/App_Data/UploadRecordings/" + folder_name + "/" + filename;

                        query(name, location, gender, age, filepath, url);

                        folder_name = null;
                        folder = null;

                        return new JsonResult { Data = "File uploaded successfully" };
                    }

                    catch (Exception exception)
                    {
                        return Json("Error occurred. Error details: " + exception.Message);
                    }

                }
                else
                {
                    return Json("No file(s) selected.");
                }
            }
        }

        [NonAction]
        private void query(string name, string location, string gender, string age, string filepath, string url) {

            string connectionString = ConfigurationManager.ConnectionStrings["DBConnectionString"].ConnectionString;

            SqlConnection con = new SqlConnection(connectionString);

            string filename = Path.GetFileName(filepath);
            FileStream fs = new FileStream(filepath, FileMode.Open, FileAccess.Read);
            BinaryReader br = new BinaryReader(fs);
            Byte[] bytes = br.ReadBytes((Int32)fs.Length);
            br.Close();
            fs.Close();

            con.Open();

            string action = "INSERT INTO tblWords values(@word) INSERT INTO tblRecords values((SELECT id from tblWords where word=@word), @url , @filename, @content_type, @blob_data, @gender, @location, @age)";
            string actionIfWordExist = "INSERT INTO tblRecords values((SELECT id from tblWords where word=@word), @url , @filename, @content_type, @blob_data, @gender, @location, @age)";
            string countRecords = "SELECT COUNT(word) from tblWords where word=@word";

            SqlCommand existCmd = new SqlCommand(countRecords, con);
            existCmd.Parameters.AddWithValue("@word", name);
            int count = (int)existCmd.ExecuteScalar();
            if (count > 0)
            {

                SqlCommand ifExistCmd = new SqlCommand(actionIfWordExist, con);
                ifExistCmd.Parameters.AddWithValue("@word", name);
                ifExistCmd.Parameters.AddWithValue("@url", url);
                ifExistCmd.Parameters.AddWithValue("@filename", filename);
                ifExistCmd.Parameters.AddWithValue("@content_type", "audio/wav");
                ifExistCmd.Parameters.AddWithValue("@blob_data", bytes);
                ifExistCmd.Parameters.AddWithValue("@gender", gender);
                ifExistCmd.Parameters.AddWithValue("@location", location);
                ifExistCmd.Parameters.AddWithValue("@age", age);
                ifExistCmd.ExecuteNonQuery();
            }
            else {
                SqlCommand newRecordCmd = new SqlCommand(action, con);
                newRecordCmd.Parameters.AddWithValue("@word", name);
                newRecordCmd.Parameters.AddWithValue("@url", url);
                newRecordCmd.Parameters.AddWithValue("@filename", filename);
                newRecordCmd.Parameters.AddWithValue("@content_type", "audio/wav");
                newRecordCmd.Parameters.AddWithValue("@blob_data", bytes);
                newRecordCmd.Parameters.AddWithValue("@gender", gender);
                newRecordCmd.Parameters.AddWithValue("@location", location);
                newRecordCmd.Parameters.AddWithValue("@age", age);
                newRecordCmd.ExecuteNonQuery();

            }
            con.Close();
        }


        [HttpPost]
        public JsonResult getfile() {

            string connectionString = ConfigurationManager.ConnectionStrings["DBConnectionString"].ConnectionString;

            SqlConnection con = new SqlConnection(connectionString);

            string getId = "SELECT id from tblWords where word = @word";
            string getFile_cmd = "SELECT filename, content_type, blob_data from tblRecords where id=@id";
            con.Open();
            SqlCommand cmd = new SqlCommand(getId, con);
            cmd.Parameters.AddWithValue("@word", Request.Form["name"]);
            var a = cmd.ExecuteScalar();

            SqlCommand getFile = new SqlCommand(getFile_cmd, con);
            getFile.Parameters.AddWithValue("@id", a);
            DataTable dt = new DataTable();
            SqlDataAdapter sda = new SqlDataAdapter();
            sda.SelectCommand = getFile;
            sda.Fill(dt);

            con.Close();
            sda.Dispose();
            con.Dispose();
            Byte[] bytes = null;
            if (dt != null) {

                bytes = (Byte[])dt.Rows[0]["blob_data"];

                //Response.Buffer = true;
                //Response.Charset = "";
                //Response.Cache.SetCacheability(HttpCacheability.NoCache);
                //Response.ContentType = dt.Rows[0]["content_type"].ToString();
                //Response.AddHeader("content-disposition", "attachment;filename="
                //+ dt.Rows[0]["filename"].ToString());
                //Response.BinaryWrite(bytes);
                //Response.Flush();
                //Response.End();

                // create output file stream
                FileStream fs = new FileStream("C:\\Users\\pb7n0079\\Desktop\\output.wav", FileMode.Create, FileAccess.Write);

                // create a binary writer to write to the stream
                BinaryWriter bw = new BinaryWriter(fs);
                bw.Write(bytes);

                // flush and close the writer
                bw.Flush();
                bw.Close();


            }

            return Json(bytes);


            //return Json(Request.Form["name"]);

        }
    }
}