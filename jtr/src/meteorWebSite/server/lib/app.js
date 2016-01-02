/**
 * Created by tedshaffer on 1/1/16.
 */
console.log("I am app.js on the server");

var url = "https://json.schedulesdirect.org/20141201/token";

HTTP.call("POST", url,
    {
        data: {"username":"jtrDev","password":"3bacdc30b9598fb498dfefc00b2f2ad52150eef4"},
        headers: {"User-Agent": "jtr" }
    },
    function (error, result) {
        if (error) {
            console.log("error");
            console.log(error);
        }
        else {
            //console.log("Schedules direct token");
            //console.log(JSON.stringify(result, null, 4));

            schedulesDirectToken = result.data.token;
            console.log("Schedules direct token = " + schedulesDirectToken);
        }
    });
