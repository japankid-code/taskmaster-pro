var tasks = {};

var createTask = function(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>").addClass("badge badge-primary badge-pill").text(taskDate);
  var taskP = $("<p>").addClass("m-1").text(taskText);
  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);
  // check due date
  auditTask(taskLi);
  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));
  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }
  // loop over object properties
  $.each(tasks, function(list, arr) {
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

// lets near due tasks get colored depending on due date 
var auditTask = function(taskEl) {
  var date = $(taskEl).find("span").text().trim();
  // convert to moment obj at 5pm
  var time = moment(date, "L").set("hour", 18);
  // remove old classes from the element
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");
  // apply new class if task is over due date
  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  } // apply new class if time within 2 days of due date
  else if (Math.abs(moment().diff(time, "days")) <= 2) {
    $(taskEl).addClass("list-group-item-warning");
  }
}

// adding the ability to edit tasks
$(".list-group").on("click", "p", function() {
  var text = $(this).text();
  // clicking on the p will change it to a textarea
  var textInput = $("<textarea>").addClass("form-control").val(text);
  $(this).replaceWith(textInput);
  textInput.trigger("focus");
  // click off the textarea
});

// value of text gets changed
$(".list-group").on("blur", "textarea", function() {
  // get the textarea's current val
  var text = $(this).val().trim();
  // get the parent ul's id
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");
  // get the tasks's position in the list of other li els
  var index = $(this).closest(".list-group-item").index();
  // update task in array
  tasks[status][index].text = text;
  saveTasks(); // update localStorage
  // recreate p ele
  var taskP = $("<p>").addClass("m-1").text(text);
  // replace textarea with p
  $(this).replaceWith(taskP);
})

// due date was clicked
$(".list-group").on("click", "span", function() {
  // get current text
  var date = $(this).text().trim();
  // create new input element
  var dateInput = $("<input>").attr("type", "text").addClass("form-control").val(date);
  $(this).replaceWith(dateInput);
  // enable jquery ui datepicker
  dateInput.datepicker({
    minDate: 0,
    onClose: function() {
      // when the calendar is closed, force a change even on the 'dateInput'
      $(this).trigger("change");
    }
  });
  // automatically focus on new element, bring up date picker
  dateInput.trigger("focus");
});

// value of due date gets changed
$(".list-group").on("change", "input[type='text']", function() {
  // get current text
  var date = $(this).val().trim();
  //get the parent ul's id attribute
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");
  // get the tasks's position in the list of other li els
  var index = $(this).closest(".list-group-item").index();
  // update task in array
  tasks[status][index].date = date;
  saveTasks(); // update localStorage
  // recreate span element with bootstrap classes
  var taskSpan = $("<span>").addClass("badge badge-primary badge-pill").text(date);
  // replace input with span element
  $(this).replaceWith(taskSpan);
  // pass task ele into audit Task to check new due dates
  auditTask($(taskSpan).closest(".list-group-item"));
})

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();
  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");
    // close modal
    $("#task-form-modal").modal("hide");
    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });
    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// make task lists sortable
$(".card, .list-group").sortable({
  activate: function() {
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag");
  },
  deactivate: function () {
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag");
  },
  over: function (e) {$(e.target).addClass("dropover-active")},
  out: function (e) {$(e.target).removeClass("dropover-active")},
  connectWith: $(".card, .list-group"),
  update: function(e) {
    let tempArr = [];
    // loop over current set of children in sortable list
    $(this).children().each(function() {
      let text = $(this).find("p").text().trim();
      let date = $(this).find("span").text().trim();
      // add tasks to temp array as an obj
      tempArr.push({
        text: text,
        date: date
      });
    });
  // trim down list's ID to match obj props
    let arrName = $(this)
      .attr("id")   
      .replace("list-", "");
  // update array on tasks' object and save
    tasks[arrName] = tempArr;
    saveTasks();
  },
});

// make mr. trash droppable
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function(event, ui) {
    ui.draggable.remove()
    // removing a task from any list triggers a sortable update() i.e. saveTasks()
    $(".bottom-trash").removeClass("bottom-trash-active");
  },
  over: function(event, ui) {
    $(".bottom-trash").addClass("bottom-trash-active");
  },
  out: function(event, ui) {
    $(".bottom-trash").removeClass("bottom-trash-active");
  }
});

// add date picker to modal window
$("#modalDueDate").datepicker({
  minDate: 0
});

// timers for auditing tasks, runs every 30 mins
setInterval(function() {
  $(".card .list-group-item").each(function(index, el) {
    auditTask(el);
  })
}, (1000 * 6) * 30);

// load tasks for the first time
loadTasks();
