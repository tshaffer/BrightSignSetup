/**
 * Created by tedshaffer on 1/9/16.
 */
function DeviceController () {


    if (!(this instanceof DeviceController)) {
        console.log("DeviceController initialized");
        return new DeviceController();
    }
    else {
        console.log("DeviceController already initialized");
    }
};

DeviceController.prototype.printPizza = function() {
    console.log("eat pizza");
}

DeviceController.prototype.printMS = function() {
    console.log("drink milkshakes");
}


module.exports = DeviceController;
