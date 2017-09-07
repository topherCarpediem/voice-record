using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;


namespace Voice_Trigger.Controllers
{
    public class ListenController : Controller
    {
        // GET: Listen
        public ActionResult Index()
        {
            ViewBag.FileName = "topher";
            return View();
        }

        [HttpGet]
        public FileResult getFile() {

            string connectionString = ConfigurationManager.ConnectionStrings["DBConnectionString"].ConnectionString;
            string action = "SELECT TOP 1 * FROM tblRecords ORDER BY NEWID()";

            SqlConnection con = new SqlConnection(connectionString);

            SqlCommand cmd = new SqlCommand(action, con);

            DataTable dt = new DataTable();
            SqlDataAdapter sda = new SqlDataAdapter();
            sda.SelectCommand = cmd;
            sda.Fill(dt);
           
            con.Close();

            sda.Dispose();
            con.Dispose();
            
            if (dt != null)
            {

                //byte[] recordBytes = (byte[])dt.Rows[0]["blob_data"];
                var filePath = Server.MapPath(dt.Rows[0]["url"].ToString());
                //byte[] record = (byte[])dt.Rows[0]["blob_data"];
                
                //filename = dt.Rows[0]["filename"].ToString();
                FileStream fs = new FileStream(filePath, FileMode.Open, FileAccess.Read);

                string filename = dt.Rows[0]["filename"].ToString();
          
               // string content_type = dt.Rows[0]["content_type"].ToString();

                dt = null;
                //ViewBag.WordName = filename;
                return File(fs, "audio/wav", filename);
                //return File(fs, content_type);
                //return record;
            }

            return null;
            
            
        }
    }
}