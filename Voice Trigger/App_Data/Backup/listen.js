let request = new XMLHttpRequest();
request.onreadystatechange = function (e) {
    if (request.readyState == 4 && request.status == 200) {
        //response

        var blob = new Blob([request.response], { type: "audio/wav" })
        var reader = new FileReader();
        reader.onload = function () {
            var dataURL = reader.result;
            document.querySelector("#audio").src = dataURL;
            //console.log(dataURL);
        };

        reader.readAsDataURL(blob);
        console.log(blobUrl);

        //console.log(request.response);

        //console.log(request.response);
    }

}


request.open("GET", "/listen/getFile");
request.send();