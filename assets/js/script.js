const current_date = $("#current_date");
const scheduler_form = $("#scheduler_form");

/* We fetch the current time only once, for consistency.  */
const now = moment();
current_date.text(now.format("dddd[.] MMMM Do"))

/* Go through all the time blocks, coloring them to
 * indicate past, present or future using CSS classes.  */

const hour_ids = ["time_0900", "time_1000", "time_1100",
  "time_1200", "time_1300", "time_1400", "time_1500",
  "time_1600", "time_1700" ];
const hour_numbers = [9, 10, 11, 12, 13, 14, 15, 16, 17];
const this_hour = parseInt(now.format("HH"));

for (let i=0;i<hour_ids.length;i++) {
  let line_class = "past_line";
  if (this_hour === hour_numbers[i]) {
    line_class = "present_line";
  } else {
    if (this_hour < hour_numbers[i]) {
      line_class = "future_line";
    }
  }
  const input_element = $("#" + hour_ids[i]);
  input_element.addClass(line_class);
}

/* use fancy tooltips */
$(document).tooltip();

/* Submitting the form does nothing.  */
scheduler_form.on("submit", function(event) {
  event.preventDefault();
})

/* Clicking a Save button in the form saves the line.  */
scheduler_form.on("click", "button", save_line);

/* On startup, load the tasks from local storage,
 * if available.  We use one object in local storage,
 * with properties of the form "time_0000", where 0000 
 * is the time in 24-hour format: 0900, 1000, etc.
 * The value of each property is the text describing
 * the tasks for that hour.  A missing time means no
 * description for that hour.  */
let schedule_data = {};

const schedule_data_string = localStorage.getItem("work_day_scheduler");
if (schedule_data_string != null) {
  schedule_data = JSON.parse(schedule_data_string);
}
if (schedule_data != null) {
  for (let row_id in schedule_data) {
    /* The input fields have ids matching the properties
     * in the schedule_data object.  */
    const this_input = scheduler_form.find("#" + row_id);
    this_input.val(schedule_data[row_id]);
  }
}

/* Function to save the line clicked.  See above for the format
 * of local data.  */
function save_line (event) {
  const this_target = $(event.target);
  /* Move up the tree to the row.  */
  const this_row = this_target.parents("div.row");
  /* From there move down to the input field.  */
  const this_input = this_row.find("input");
  /* The id of the input field is the property
   * for the schedule_data object.  */
  const the_hour = this_input.attr("id");
  const the_text = this_input.val();
  /* Replace an existing description, or add a missing description
   * in the schedule_data object.  */
  schedule_data[the_hour] = the_text;
  /* Store the updated schedule_data object in local storage.  */
  localStorage.setItem("work_day_scheduler", JSON.stringify(schedule_data));
}
