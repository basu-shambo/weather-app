//variables and DOM elements
const api_key = "4NmJNkGr8czB0AvzExCHtjnp7RT7kqdG";
const forecast_key = "26905ec6c3d33619fc011cf19c73a452"

const searchBar = document.querySelector(".search-bar");
const sugg = document.querySelector(".suggestions");
const disp = document.querySelector(".disp");

let namesMap = new Map(); 



//async functions

/**
 * @function
 *@async 
 *@param {string} str - this is completer/incomplete the search term in the city search field 
 *@returns {Promise<string>} this will return the promise with a list of city names and their
 *selecting their desired place for the weather information
 */
const getNames = async (str) => {
    const base = `https://dataservice.accuweather.com/locations/v1/cities/autocomplete?apikey=${api_key}&q=`;
    const request = await fetch(base+str);
    const cities =  await request.json();
    return cities;
}

/**
 * @function
 * @param {number} key- This will represent the key to get the latitude and longitude of the location
 * @return this will return the data using the key that has the longitude and latitude information in it  
 */
const getLatLon = async (key)=>{
   const response =await fetch(`https://dataservice.accuweather.com/locations/v1/${key}?apikey=${api_key}&language=en-us&details=false`);
   const data = await response.json();
   return data;
}

/**
 * @function
 * @param {number} latitude - this will be the latitude of place where the forecast is to be done
 * @param {number} longitude - this will be the longitude of place where the forecast is to be done
 * @returns this function returns the forecast information with the 
 */
const getForecast = async(name,country,lat,lon)=>{
    console.log(lat,lon)
    const response = await fetch((`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely&appid=${forecast_key}`));
    const data = await response.json();
    data["Country"]=country;
    data["Name"]=name;
    return data;
}



// functions

/**
 * @function
 * this calls the get names fucntion with the text from the search bar to show the autocomplete suggestions
 */
 const suggestionShow = function(e){
    e.stopPropagation();
    if(searchBar.value.length>=3){
        
        getNames(searchBar.value).then(cities=>{
            retString="";
            Array.from(cities).forEach(city=>{
                let t = `${city["LocalizedName"]}, ${city["Country"]["LocalizedName"]}`
                retString+=`<div class="suggestion-item">${t}</div>`
                namesMap.set(t,parseInt(city["Key"]));
            });
            sugg.innerHTML = retString;
        }).catch(err=>console.log(err));
        sugg.style.display="block";
    }
    else{
        sugg.style.display ="none";
    }
}



/**
 * @function
 * @param {object} data - This data will have all the information about the location selected
 * this will take the data from the getForecast function and then
 */
const showForecast = function(data){
    const curr = new Date((data["current"]["dt"])*1000)
    const temp = Math.round(data["current"]["temp"]-273.15)
    let ih = `<div id="name"><p>${data["Name"]}, <span id="country">${data["Country"]}</span></p><p id="time-updated">Last Updated:${curr.getDate()}/${curr.getMonth()}/${curr.getFullYear()} ${curr.getHours()}:${curr.getMinutes()}</p></div> 
    <div id="weather"><img src="http://openweathermap.org/img/wn/${data["current"]["weather"][0]["icon"]}@2x.png" ><p>${data["current"]["weather"][0]["main"]}</p></div>
    <div id="Temperature"><p id="main">${temp}&degC</p><p id="minmax">max/min: ${Math.round(data["daily"][0]["temp"]["max"]-273.15)}&degC/${Math.round(data["daily"][0]["temp"]["min"]-273.15)}&degC</p></div>
    <div id="others"><p>Pressure: ${data["current"]["pressure"]} hPa</p><p>Wind: ${data["current"]["wind_speed"]} m/s</p><p>Humidity: ${data["current"]["humidity"]} %</p></div>
    <div id="hourly-graph"> <canvas id="mycanvas"> </canvas>        </div>`;

    for(i=1;i<=7;i++){
        const date= new Date((data["daily"][i]["dt"]+data["timezone_offset"])*1000);
        const wt = data["daily"][i]["weather"][0]["main"]
        const mi= Math.round(data["daily"][i]["temp"]["min"]-273.15);
        const ma= Math.round(data["daily"][i]["temp"]["max"]-273.15);
        const ico = data["daily"][i]["weather"][0]["icon"];
        ih+=`<div id="day${i}"><p>${date.getUTCDate()}/${date.getUTCMonth()}</p><img src="http://openweathermap.org/img/wn/${ico}@2x.png" ><p>${wt}</p><p>${ma}&degC/${mi}&degC</p></div>`;
    }
    
    disp.innerHTML=ih;
    const canvas = document.querySelector("#mycanvas");
    canvas.style.width ='90%';
    canvas.style.height = "90%";
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext("2d");
    const points = data["hourly"].length;
    // canvas.style.background="rgba(73, 169, 246, 0.801)";
    
    let ma=0,mi=1000;
    for(i=0;i<points;i++){
        if(data["hourly"][i]["temp"]>ma){ma = data["hourly"][i]["temp"];}
        if(data["hourly"][i]["temp"]<mi){mi = data["hourly"][i]["temp"];}
    }
    const rangeMax= Math.round(ma-273.15+3);
    const rangeMin = Math.round(mi-273.15-1);
    const totalRange=rangeMax-rangeMin;
    const yunit = (canvas.height-15)/totalRange;
    const xunit = (canvas.width-15)/data["hourly"].length;
    console.log(rangeMin,rangeMax,totalRange)
    let j=0;   
    // ctx.beginPath();
    // ctx.moveTo(15,0);
    // ctx.lineTo(15,canvas.height);
    // ctx.moveTo(0,canvas.height-15);
    // ctx.lineTo(canvas.width,canvas.height-15)
    // ctx.stroke();
    

    for(j=0;j<=totalRange;j=j+3){
        ctx.fillStyle ="white";
        ctx.font = "15px sans-sherif";
        ctx.fillText(`${rangeMin+j}`,0,canvas.height-j*yunit-15,15);
    } 
    for(j=0;j<data["hourly"].length;j++){
        const date = new Date((data["hourly"][j]["dt"]+data["timezone_offset"])*1000);
        ctx.font ="15px sans-sherif"
        ctx.fillStyle ="white";
        if(j%6==1){ctx.fillText(`${date.getUTCHours()}:00`,15+j*xunit,canvas.height);}
        let val = Math.round(data["hourly"][j]["temp"]-273.15);
        if(j==0){
            ctx.moveTo(15+j*xunit,canvas.height-15-(val-rangeMin)*yunit);
        }
        else{
            ctx.lineTo(15+j*xunit,canvas.height-15-(val-rangeMin)*yunit);
        }

    }
    ctx.stroke();

}



// Event listeners

searchBar.addEventListener("keyup", suggestionShow);
searchBar.addEventListener("click", suggestionShow);

sugg.addEventListener("click",(e)=>{
    if(e.target.tagName="DIV"){
        searchBar.value = e.target.innerText;
        getLatLon(namesMap.get(searchBar.value))
            .then(data=>{
                return getForecast(data["LocalizedName"],data["Country"]["LocalizedName"],data["GeoPosition"]["Latitude"],data["GeoPosition"]["Longitude"]);
            }).then(data=>{
                console.log(data);
                showForecast(data);
            }).catch(err=>console.log(err));
        
    }
})
window.addEventListener("click",(e)=>{
    sugg.style.display ="none";
})