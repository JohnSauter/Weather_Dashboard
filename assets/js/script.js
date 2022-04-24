
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
    localStorage.setItem("weather_dashboard", 
      JSON.stringify(city_names_data));
  
    /* Update the displayed list of cities.  */
    reload_city_names();

    /* Process the specified city name.  This function is
     * asynchronous so we must exit and let the completion
     * of its promises carry on.  */
    process_city_name(city_name);
  }

/* Function to display the saved city names.  */
function reload_city_names () {
  /* Sort the city names by least recently used, so the
   * oldest ones disappear off the bottom of the list.  */
  const entries = Object.entries(city_names_data);
  const sorted_entries = entries.sort(
    function (a, b) {
      /* Item [1] is the time the city name was last used.  */
      if (a[1].last_used > b[1].last_used) return -1;
      if (a[1].last_used < b[1].last_used) return 1;
      return 0;
    }
  )
  /* There is a line for each displayable city name.  */
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
  remember_city_name(target.text());
}

/* Function to add the location to a city name.  
 * This is an asynchronous function, so it will return
 * before completing the update to the city_names_data object.  */
async function add_location (city_name) {
  const URL_start = "http://api.openweathermap.org/geo/1.0/direct?q=";
  const URL_end = "&appid=";

  /* Construct the URL.  */
  const the_URL = URL_start + encodeURIComponent (city_name) + URL_end + 
    encodeURIComponent(api_key);

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
  /* Because add location is asynchronous we cannot call it
   * and expect it to be dome when it returns.  Therefore
   * when it completes, it calls process_city_name, which
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
  const the_URL = URL_start + "?lat=" + encodeURIComponent(latitude) + 
    "&lon=" + encodeURIComponent(longtitude) + "&appid=" + 
      encodeURIComponent(api_key);
    fetch(the_URL)
    .then(function(response) {return response.json()})
    .then(function (data) {
      /* We have the weather data.  Store it and display it.  */
      city_names_data[city_name].weather = data;
      localStorage.setItem("weather_dashboard", 
        JSON.stringify(city_names_data));
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
  const the_date = moment.unix(the_time_t).format("[(]M[/]D[/]YYYY[)]");
  $("#display_date").text(the_date);
  const weather_icon = weather_data.current.weather[0].icon;
  const weather_icon_URL = "https://openweathermap.org/img/wn/" +
    weather_icon + ".png";
  $("#display_conditions").html("<span>" + 
    "<span> <img class='weather_condition_icon' src='" + weather_icon_URL + 
    "'></span></span>");
  const temp_Kelvin = weather_data.current.temp;
  const temp_celsius = temp_Kelvin - 273.15;
  const temp_farenheit = (temp_celsius * (9/5)) + 32.0;
  $("#display_temperature").text(temp_celsius.toFixed(2) + " °C = " +
    temp_farenheit.toFixed(2) + " °F");
  const humidity = weather_data.current.humidity;
  $("#display_humidity").text(humidity + "%");
  const wind_speed = weather_data.current.wind_speed;
  const wind_speed_mph = wind_speed * 2.236936292054402;
  $("#display_wind_speed").text(wind_speed + " meters per second = " +
    wind_speed_mph.toFixed(2) + " miles per hour");
  const UV_index = weather_data.current.uvi;

  /* Along with the UV index show a color which indicates the
   * condition: low, moderate, high, very high or extreme.  */
  let UV_index_color;
  if (UV_index < 3) {
     UV_index_color = "#80D07B"; /* green: low */
  } else {
    if (UV_index < 6) {
      UV_index_color = "#FEDD03"; /* yellow: moderate */
    } else {
      if (UV_index < 8) {
        UV_index_color = "#F79210"; /* orange: high */
      } else {
        if (UV_index < 11) {
          UV_index_color = "#ED1C24"; /* red: very high */
        } else {
          UV_index_color = "#DB1C85"; /* violet: extreme */
        }
      }
    }
  }
  const UV_index_text_1 = "<span> <svg height='20' width='20'>";
  const UV_index_text_2 = " <circle cx='10' cy='10' r='10' stroke='black'";
  const UV_index_text_3 = " stroke-width='2' fill='" + UV_index_color + "'";
  const UV_index_text_4 = " /></svg></span>"
  const UV_index_text = UV_index + UV_index_text_1 + UV_index_text_2 +
    UV_index_text_3 + UV_index_text_4;
  $("#display_UV_index").html(UV_index_text);

  /* Now fill in the daily forecasts.  */
  for (let day_no = 0; day_no < weather_data.daily.length; day_no++) {
    daily_forecast (weather_data, day_no);
  }
}

/* Function to display the forecast for each day.  */
function daily_forecast (weather_data, day_no) {
  const forecasts = weather_data.daily;
  const this_forecast = forecasts[day_no];
  const the_time_t = this_forecast.dt;
  const the_date = moment.unix(the_time_t).format("M[/]D[/]YYYY");
  const this_element = $("#forecast_" + String(day_no));
  const this_body = this_element.children("div");
  const this_title = this_body.children("h5");
  this_title.text(the_date);
  const weather_icon = this_forecast.weather[0].icon;
  const weather_icon_URL = "https://openweathermap.org/img/wn/" +
    weather_icon + ".png";
  let forecast_body = "<p> <img class='weather_condition_icon' src='" + 
    weather_icon_URL + "'></p>";
  const temp_Kelvin_min = this_forecast.temp.min;
  const temp_Kelvin_max = this_forecast.temp.max;
  const temp_celsius_min = temp_Kelvin_min - 273.15;
  const temp_celsius_max = temp_Kelvin_max - 273.15;
  const temp_farenheit_min = (temp_celsius_min * (9/5)) + 32.0;
  const temp_farenheit_max = (temp_celsius_max * (9/5)) + 32.0;
  forecast_body = forecast_body + "<p>Temp: " + temp_farenheit_min.toFixed(2) +
    "&ndash;" + temp_farenheit_max.toFixed(2) + " °F</p>";
  const wind_speed = this_forecast.wind_speed;
  const wind_speed_mph = wind_speed * 2.236936292054402;
  forecast_body = forecast_body + "<p>Wind: " + wind_speed_mph.toFixed(2) + 
    " MPH</p>";
  const humidity = this_forecast.humidity;
  forecast_body = forecast_body + "<p>Humidity: " + humidity + "%</p>";

  this_text = this_body.children("p");
  this_text.html(forecast_body);
}

