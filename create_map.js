// CREATE DIVS ------------------------------------------------------------------------------------------------------------------------------------------------
var referenceNodeMap = document.getElementsByClassName("listing__content")[0]
var mapDiv = referenceNodeMap.parentNode.insertBefore(document.createElement("div"), referenceNodeMap)
mapDiv.setAttribute("id", "mapDiv");
mapDiv.setAttribute("style", "width: 100%; height: 400px; margin-bottom: 8px");

var referenceNodeMsg = document.getElementsByClassName("listing__content")[0]
// var referenceNodeMsg = document.getElementsByClassName("key-features__station-distance")[0]
var msgDiv = referenceNodeMsg.parentNode.insertBefore(document.createElement("div"), referenceNodeMsg)
msgDiv.setAttribute("id", "msgDiv");
msgDiv.setAttribute("style", "padding-left: 16px; margin-bottom: 16px");


// GET AD LOCATION ------------------------------------------------------------------------------------------------------------------------------------------------
let ad_location = document.documentElement.innerHTML.match(/{latitude:\s*"(?<lat>[0-9.]+)",\s*longitude:\s*"(?<lng>[\-0-9.]+)",}/).groups
ad_location.lat = parseFloat(ad_location.lat)
ad_location.lng = parseFloat(ad_location.lng)


// SET AD LOCATION AS LINK
let adLocationLi = document.querySelectorAll(".feature--details > ul > :nth-child(2)")[0]
let originalText = adLocationLi.innerHTML



// CREATE CONSTANTS ------------------------------------------------------------------------------------------------------------------------------------------------
function getNextBusinessDay(date) {
  // Copy date so don't affect original
  date = new Date(+date);
  // Add days until get not Sat or Sun
  do {
    date.setDate(date.getDate() + 1);
  } while (!(date.getDay() % 6))
  return date;
}
const tomorrow = getNextBusinessDay(new Date())

var map;
// Locations of landmarks
const squarepoint = {lat: 51.519533, lng: -0.090183};
const center = {
    lat: (squarepoint.lat + ad_location.lat) / 2,
    lng: (squarepoint.lng + ad_location.lng) / 2
};
const options = {zoom: 15, scaleControl: true, center: center};
const morningRoute = {
    origin: ad_location,
    destination: squarepoint,
    provideRouteAlternatives: true,
    transitOptions: {
        departureTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 8, 30),
        routingPreference: "LESS_WALKING"
    },
}
const afternoonRoute = {
    origin: squarepoint,
    destination: ad_location,
    provideRouteAlternatives: true,
    transitOptions: {
        departureTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 19, 0),
        routingPreference: "LESS_WALKING"
    },
}


// CREATE MAP ------------------------------------------------------------------------------------------------------------------------------------------------
function initMap() {
    // The map, centered on Central Park
    map = new google.maps.Map(
        mapDiv, options);
    // The markers for The Dakota and The Frick Collection
    // var mk1 = new google.maps.Marker({position: squarepoint, map: map});
    // var mk2 = new google.maps.Marker({position: ad_location, map: map});

    const transitLayer = new google.maps.TransitLayer();

    transitLayer.setMap(map);

    createTimingTable().then(r => console.log("Table created"));
}

async function createTimingTable() {
    let table = `
        <table>
            <thead>
                <tr>
                    <th>Time</th>
                    <th>Transit</th>
                    <th>Bike</th>
                    <th>Walking</th>
                </tr>
            </thead>
                <tbody>
                    <tr>
                        <td>Morning</td>
                        <td>${await calcDirections(morningRoute, "TRANSIT", true)}</td>
                        <td>${await calcDirections(morningRoute, "BICYCLING")}</td>
                        <td>${await calcDirections(morningRoute, "WALKING")}</td>
                    </tr>
                    <tr>
                        <td>Afternoon</td>
                        <td>${await calcDirections(afternoonRoute, "TRANSIT", true)}</td>
                        <td>${await calcDirections(afternoonRoute, "BICYCLING")}</td>
                        <td>${await calcDirections(afternoonRoute, "WALKING")}</td>
                    </tr>
                </tbody>
        </table>
    `
    msgDiv.innerHTML = table

    setTimeout(() => mapDiv.scrollIntoView(true), 1400);
}


// CALCULATE DIRECTIONS ------------------------------------------------------------------------------------------------------------------------------------------------
async function calcDirections(route, travelMode, displayOnMap = false) {
    route.travelMode = travelMode;

    let cell = document.createElement("a")
    cell.href = `https://www.google.com/maps/dir/?api=1&origin=${route.origin.lat},${route.origin.lng}&destination=${route.destination.lat},${route.destination.lng}&travelmode=${travelMode.toLowerCase()}`
    cell.target="_blank"
    cell.style['color'] = 'inherit'

    let directionsService = new google.maps.DirectionsService();
    let directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map); // Existing map object displays directions
    ret = await directionsService.route(route,
        function (response, status) { // anonymous function to capture directions
            if (status !== 'OK') {
                window.alert('Directions request failed due to ' + status);
                cell.innerText = 'Directions request failed due to ' + status;
                return cell.outerHTML;
            }

            if (displayOnMap) {
                directionsRenderer.setDirections(response); // Add route to the map
            }

            var directionsData = response.routes[0].legs[0]; // Get data about the mapped route
            if (!directionsData) {
                window.alert('Directions request failed');
                cell.innerText = 'Directions request failed';
                return cell.outerHTML;
            }

            cell.innerText = directionsData.duration.text;
            if (directionsData.duration.value > 35 * 60) {
                cell.style['color'] = 'red'
                cell.style['font-weight'] = 'bold'
            } else if (directionsData.duration.value > 25 * 60) {
                cell.style['color'] = 'orange'
                cell.style['font-weight'] = 'bold'
            }
            return cell.outerHTML;
        });
    return cell.outerHTML;
}


// CHANGE PHOTOS WITH ARROWS ------------------------------------------------------------------------------------------------------------------------------------
document.onkeydown = function(e) {
    if ([...document.querySelector("div.overlay.gallery.loading").classList].find(item => item == "overlay_active") === undefined) {
        return
    }
    e.preventDefault()
    switch (e.keyCode) {
        case 39:
            document.querySelector("a.gallery_dir.gallery_next").click()
            break;
        case 37:
            document.querySelector("a.gallery_dir.gallery_prev").click()
            break;
    }
};


// LOAD GOOGLE MAPS API ---------------------------------------------------------------------------------------------------------------------------------------
let myScript = document.createElement("script");
myScript.onload = initMap
document.body.appendChild(myScript);
myScript.setAttribute("src", "https://maps.googleapis.com/maps/api/js?key=<your_key_not_mine>");



// CONVERT PRICES TO MONTHLY ---------------------------------------------------------------------------------------------------------------------------------------
[...document.querySelectorAll(".room-list__price")].forEach(rentNode => {
    rent = rentNode.innerHTML.match(/(£(?<pw>[0-9,]+)\spw)?(£(?<pcm>[0-9,]+)\spcm)?/).groups
    console.log(rent)
    if (rent.pw === undefined && rent.pcm === undefined) {
        return;
    }
    rent.pw = rent.pw ? parseFloat(rent.pw.replace(/,/g, "")) : undefined
    rent.pcm = rent.pcm ? parseFloat(rent.pcm.replace(/,/g, "")) : undefined
    console.log(rent)
    rentNode.innerHTML = `£${rent.pcm ? Math.ceil(rent.pcm/10)*10 + ' pcm' : Math.ceil(rent.pw*4.33/10)*10 + ' pcm (£' + rent.pw + ' pw)'}`
})


// CONVERT PRICES TO MONTHLY ---------------------------------------------------------------------------------------------------------------------------------------
if (document.documentElement.innerHTML.match(/You have previously contacted this advert. Go sto/) === undefined) {

}

[...document.querySelectorAll(".contact_the_advertiser > div > div > p")].forEach(node => {
    if (node.innerHTML.match(/You have previously contacted this advert/) === null) {
        return;
    }

    const referenceNode = document.getElementsByClassName("profile-photo__wrap profile-photo__show-viewer advert-details__profile-photo-wrap")[0]
    const msg = referenceNode.parentNode.insertBefore(document.createElement("div"), referenceNode)
    msg.innerHTML = "ALREADY CONTACTED"
    msg.setAttribute("style", "color: red; font-weight: bold")
})
