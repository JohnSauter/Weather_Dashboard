
const city_form = $("#city_form");
const api_key = "25a26b394979e8570d0f315b2b7e6e2d"

/* On startup, load the remembered cities from
 * local storage, if available.  We use one object in 
 * local storage, with properties the name of the city.  
 * Each such property is an object, with the property 
 * row_number, that being the row number in the form 
 * where the city name is remembered.
 */
let city_names_data = {};

const city_names_string = localStorage.getItem("weather_dashboard");
if (city_names_string != null) {
  city_names_data = JSON.parse(city_names_string);

/* Display the last few city names used.  */
  reload_city_names();
}

/* Function to handle a request for information about
 * a named city.  */
city_form.on("submit", handle_submit);
function handle_submit(event) {
  event.preventDefault();
  const target = $(event.target);
  const target_input = target.children("input");
  let city_name = target_input.val();
  /* Remove spaces, since we will be constructing a URL with
   * the name.  */
  remember_city_name(city_name);
  target_input.val("");
}

/* Function to add a city name to the list of remembered
 * city names.  */
function remember_city_name (city_name) {
  /* Add it to the list of names if necessary.
   * Give it a date stamp that will move it to the top
   * of the list.  */
    const now = moment.utc();
    const date_stamp = now.toISOString();
    city_names_data[city_name] = {"last_used": date_stamp};

    /* Save the updated list of cities in local storage.  */
    localStorage.setItem("weather_dashboard", JSON.stringify(city_names_data));
  
    /* Update the displayed list of cities.  */
    reload_city_names();

    /* Process the specified city name.  */
    process_city_name(city_name);
  }

/* Function to load the saved city names onto the display.  */
function reload_city_names () {
  /* Sort the city names by least recently used, so the
   * oldest ones disappear off the list.  */
  const entries = Object.entries(city_names_data);
  const sorted_entries = entries.sort(
    function (a, b) {
      /* Item [1] is the time the city name was last used.  */
      if (a[1].last_used > b[1].last_used) return -1;
      if (a[1].last_used < b[1].last_used) return 1;
      return 0;
    }
  )
  /* There is a line for each city name.  */
  for (let i = 0; i < sorted_entries.length; i++) {
    const row_id = String(i).padStart(2, "0");
    const row_element = $("#city_row_" + row_id);
    /* Item [0] is the name of the city.  */
    const city_name = sorted_entries[i][0];
    row_element.html(city_name);
  }
}

/* Clicking on a displayed city name processes it.  */
$("#city_buttons").on("click", handle_city_button);
function handle_city_button (event) {
  const target = $(event.target);
  process_city_name(target.text());
}

/* Function to add the location to a city name.  */
async function add_location (city_name) {
  const URL_start = "http://api.openweathermap.org/geo/1.0/direct?q=";
  const URL_end = "&appid=";

  /* Construct the URL.  */
  const the_URL = URL_start + city_name + URL_end + api_key;

  /* Fetch the location of the city.  */
  console.log(the_URL);
  const response = await fetch(the_URL);
  const json = await response.json();
  const city_obj = json;
  city_names_data[city_name].location = city_obj;
  /* Save the location information in local storage
   * so we don't have to keep going back to the server
   * for it.  */
  localStorage.setItem("weather_dashboard", 
    JSON.stringify(city_names_data));
  /* Because this function is asynchronous we cannot call it
   * and expect it to be dome when it returns.  Therefore
   * when it completes it calls process_city_name, which
   * was its caller.  Process_city_name will find the location
   * in the city_names_data structure, and so not call 
   * add_location again.
   */
  process_city_name(city_name);
}

/* Function to show the weather for a named city.  */
function process_city_name (city_name) {

  /* We may have already done the geocoding for this
   * location.  If not, do it now and call back when
   * it is done.  */
  let city_obj = null;
  if ("location" in city_names_data[city_name]) {
    city_obj = city_names_data[city_name].location;

  /* Get the latitude and longitude from the geocoding data
   * if it exists.  */
  if (city_obj.length == 0) {
    alert("no such city");
    return;
  }

  const latitude = city_obj[0].lat;
  const longtitude = city_obj[0].lon;
  console.log(latitude + "," + longtitude);

  /* Now call the openweathermap server with the latitude
   * and longitude of the location for which we want
   * the weather.  */
  const URL_start = "http://api.openweathermap.org/data/2.5/onecall";
  const the_URL = URL_start + "?lat=" + latitude + 
    "&lon=" + longtitude + "&appid=" + api_key;
    fetch(the_URL)
    .then(function(response) {return response.json()})
    .then(function (data) {
      /* We have the weather data.  Store it and display it.  */
      city_names_data[city_name].weather = data;
      display_city_weather (city_name)});
  } else {
  /* We must fetch the city's location.  This process
   * is asynchronous, so we must exit here and repeat
   * process_city_name when the location information
   * has arrived.
   */
  add_location (city_name);
  /* Add location will call process city name when
   * its asynchronous operations complete.  */
  }
}

/* Function to display the weather information about a
 * named city.  All of the information we need is in
 * city_names_data[city_name].  */
function display_city_weather (city_name) {
  const location_data = city_names_data[city_name].location;
  const weather_data = city_names_data[city_name].weather;
  $("#display_city_name").text(location_data[0].name);
  const the_time_t = weather_data.current.dt;
  const the_date = moment.unix(the_time_t).format("dddd, MMMM Do YYYY, HH:mm:ss");
  $("#display_date").text(the_date);
  const weather_description = weather_data.current.weather[0].description;
  const weather_icon = weather_data.current.weather[0].icon;
  const weather_icon_URL = "https://openweathermap.org/img/wn/" +
    weather_icon + ".png";
  $("#display_conditions").html("<span>" + weather_description + 
    "<span> <img id='condition_image' src='" + weather_icon_URL + "'></span></span>");
    const temp_Kelvin = weather_data.current.temp;
    const temp_celcius = temp_Kelvin -273.15;
    $("#display_temperature").text(temp_celcius.toFixed(2) + "°C");
    const humidity = weather_data.current.humidity;
    $("#display_humidity").text(humidity + "%");
    const wind_speed = weather_data.current.wind_speed;
    $("#display_wind_speed").text(wind_speed + " meters per second");
    const UV_index = weather_data.current.uvi;
    $("#display_UV_index").text(UV_index);
}
