
const city_form = $("#city_form");

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
}
if (city_names_data != null) {
  for (let city_name in city_names_data) {
    const row_number = city_name.row_number;
    $("city_row" + row_number).textContents = city_name;
  }
  /* Put the samed names on the screen.  */
  reload_city_names();
}

/* Function to handle a request for information about
 * a named city.  */
city_form.on("submit", handle_submit);
function handle_submit(event) {
  event.preventDefault();
  const target = $(event.target);
  const target_input = target.children("input");
  const city_name = target_input.val();
  remember_city_name(city_name);
  target_input.val("");
}

/* Function to add a city name to the list of remembered
 * city names.  */
function remember_city_name (city_name) {
  /* Add it to the list of names if necessary.  Give it
   * give it a date stamp that will move it to the top
   * of the list.  */
    const now = moment.utc();
    const date_stamp = now.toISOString();
    city_names_data[city_name] = {"last_used": date_stamp};

    /* Save the updated list of cities in local storage.  */
    localStorage.setItem("weather_dashboard", JSON.stringify(city_names_data));
  
    /* Update the displayed list of cities.  */
    reload_city_names();
    console.log(city_name);
  }

/* Function to load the saved city names onto the display.  */
function reload_city_names () {
  /* Sort the city names by least recently used, so the
   * oldest ones disappear off the list.  */
  const entries = Object.entries(city_names_data);
  const sorted_entries = entries.sort(
    function (a, b) {
      if (a[1].last_used > b[1].last_used) return -1;
      if (a[1].last_used < b[1].last_used) return 1;
      return 0;
    }
  )
  /* There is a line for each city name.  */
  for (let i = 0; i < sorted_entries.length; i++) {
    const row_id = String(i).padStart(2, "0");
    const row_element = $("#city_row_" + row_id);
    const city_name = sorted_entries[i][0];
    row_element.html(city_name);
  }
}

/* Clicking on a displayed city name searches for it.  */
$("#city_buttons").on("click", handle_city_button);
function handle_city_button (event) {
  const target = $(event.target);
  console.log(target.text());
}