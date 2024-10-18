require([
    "esri/config", 
    "esri/Map", 
    "esri/views/MapView", 
    "esri/layers/GraphicsLayer",
    "esri/Graphic",
    "esri/widgets/Locate",
    "esri/widgets/Search",
    "esri/widgets/Legend"
], function(esriConfig, Map, MapView, GraphicsLayer, Graphic, Locate, Search, Legend) {

    var myMap = new Map({
        basemap: "streets"
    });

    var myView = new MapView({
        container: "viewDiv",
        map: myMap,
        center: [-77.0428, -12.0464],
        zoom: 6
    });

    var graphicsLayer = new GraphicsLayer();
    myMap.add(graphicsLayer);

    var districts = [
        { name: "Lima", latitude: -12.0464, longitude: -77.0428 },
        { name: "Arequipa", latitude: -16.409, longitude: -71.537 },
        { name: "Cusco", latitude: -13.532, longitude: -71.967 },
        { name: "Chiclayo", latitude: -6.771, longitude: -79.840 },
        { name: "Piura", latitude: -5.194, longitude: -80.632 },
        { name: "Iquitos", latitude: -3.743, longitude: -73.251 },
        { name: "Tacna", latitude: -18.014, longitude: -70.251 },
        { name: "Huancayo", latitude: -12.065, longitude: -75.204 },
        { name: "Pucallpa", latitude: -8.379, longitude: -74.553 },
        { name: "Tumbes", latitude: -3.5669, longitude: -80.4515 },
        { name: "Ayacucho", latitude: -13.1588, longitude: -74.2236 },
        { name: "Puno", latitude: -15.8402, longitude: -70.0219 },
        { name: "Moquegua", latitude: -17.189, longitude: -70.935 },
        { name: "Juliaca", latitude: -15.4997, longitude: -70.1334 },
        { name: "Tarapoto", latitude: -6.4825, longitude: -76.3652 },
        { name: "Chachapoyas", latitude: -6.229, longitude: -77.8705 },
        { name: "Huaraz", latitude: -9.5275, longitude: -77.5278 },
        { name: "Cajamarca", latitude: -7.163, longitude: -78.5007 },
        { name: "Puerto Maldonado", latitude: -12.5995, longitude: -69.1899 },
        { name: "Trujillo", latitude: -8.109, longitude: -79.021 },
    ];

    function fetchAQIData(district, attempts = 3) {
        var apiUrl = `https://api.waqi.info/feed/geo:${district.latitude};${district.longitude}/?token=a0a07448baf1e30b58588b9d1858cffc45b2c82e`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if (data.status === "ok") {
                    var aqi = data.data.aqi;
                    var mainPollutant = data.data.dominentpol;
                    var markerColor = getAQIColor(aqi);
                    var marker = {
                        type: "simple-marker",
                        style: "circle",
                        color: markerColor,
                        size: "10px"
                    };
                    var popup_template = {
                        title: district.name + " Air Quality Index",
                        content: `<b>AQI</b>: ${aqi}<br><b>Pollutant</b>: ${mainPollutant}`
                    };
                    var graphic = new Graphic({
                        geometry: {
                            type: "point",
                            longitude: district.longitude,
                            latitude: district.latitude
                        },
                        symbol: marker,
                        popupTemplate: popup_template
                    });
                    graphicsLayer.add(graphic);
                } else if (attempts > 0) {
                    console.log(`Retrying ${district.name}, attempts left: ${attempts - 1}`);
                    fetchAQIData(district, attempts - 1); 
                }
            })
            .catch(error => {
                console.error("Error fetching AQI data:", error);
                if (attempts > 0) {
                    fetchAQIData(district, attempts - 1); 
                }
            });
    }

    function getAQIColor(aqi) {
        if (aqi <= 50) {
            return [0, 255, 0];
        } else if (aqi <= 100) {
            return [255, 255, 0];
        } else if (aqi <= 150) {
            return [255, 165, 0];
        } else {
            return [255, 0, 0];
        }
    }
   
    districts.map(district => fetchAQIData(district));

    var locate = new Locate({
        view: myView,
        useHeadingEnabled: false,
        goToOverride: function(view, options) {
            options.target.scale = 1500;
            return view.goTo(options.target);
        }
    });
    myView.ui.add(locate, "top-left");

    var search = new Search({
        view: myView
    });
    myView.ui.add(search, "top-right");

    var aqiLegend = document.createElement('div');
    aqiLegend.innerHTML = `
        <strong>Air Quality Levels</strong><br>
        <span style="color: rgb(0, 255, 0);">●</span> Good (0-50)<br>
        <span style="color: rgb(255, 255, 0);">●</span> Moderate (51-100)<br>
        <span style="color: rgb(255, 165, 0);">●</span> Unhealthy for Sensitive Groups (101-150)<br>
        <span style="color: rgb(255, 0, 0);">●</span> Unhealthy (151+)<br>
    `;
    myView.ui.add(aqiLegend, "bottom-left");
});
