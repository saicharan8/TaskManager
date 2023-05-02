var tasks = {};

// INSPECT TASK TIME 
// <=2 DAYS - WARNING
// 
var inspectTask = function (task) {
  // get date from task
  var date = $(task).find("span").text().trim();

  // convert to moment object at 5:00pm
  var time = moment(date, "L").set("hour", 17);

  // remove any old classes from element
  $(task).removeClass("list-group-item-warning list-group-item-danger");

  // apply new class if task is near/over due date
  if (moment().isAfter(time)) {
    $(task).addClass("list-group-item-danger");
  } else if (Math.abs(moment().diff(time, "days")) <= 2) {
    $(task).addClass("list-group-item-warning");
  }
};
// END OF INSPECT TIME

var createTask = function (taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>").addClass("m-1").text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  inspectTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function () {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      review: [],
      done: [],
    };
  }

  // loop over object properties
  $.each(tasks, function (list, arr) {
    console.log(list, arr);
    // then loop over sub-array
    arr.forEach(function (task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function () {
  console.log(JSON.stringify(tasks));
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

// EDIT TASK DESC EVENT HANDLERS

// edit mode
$(".list-group").on("click", "p", function () {
  var text = $(this).text().trim();
  var textInput = $("<textarea>").addClass("form-control").val(text);
  $(this).replaceWith(textInput);
  textInput.trigger("focus");
  console.log("FOCUSED");
});

// save + revert to default
$(".list-group").on("blur", "textarea", function () {
  console.log("OUT OF FOCUS");
  // get the textarea's current value/text
  var text = $(this).val().trim();

  // get the parent ul's id attribute
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");

  // get the task's position in the list of other li elements
  var index = $(this).closest(".list-group-item").index();
  console.log(index);
  // programatically update text
  tasks[status][index].text = text;
  saveTasks();

  // convert textarea back to p
  var taskP = $("<p>").addClass("m-1").text(text);

  // replace textarea with p element
  $(this).replaceWith(taskP);
});

// END OF EDIT TASK DESC EVENT HANDLERS 

// TASK DATE EVENT HANDLERS

// edit mode
$(".list-group").on("click", "span", function () {
  console.log("focused");
  // get current text
  var date = $(this).text().trim();

  // create new input element
  var dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);

  // swap out elements
  $(this).replaceWith(dateInput);

  // enable jquery ui datepicker
  dateInput.datepicker({
    minDate: 1,
    onClose: function () {
      // when calendar is closed, force a "change" event on the `dateInput`
      $(this).trigger("change");
    },
  });

  // automatically focus on new element
  dateInput.trigger("focus");
});

// save + revert to default
$(".list-group").on("change", "input[type='text']", function () {
  console.log("changed");

  // get current text
  var date = $(this).val().trim();

  // get the parent's ul's id attribute
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");

  // get the task's position in the list of other li elements
  var index = $(this).closest(".list-group-item").index();

  // update task in array and re-save to local storage
  tasks[status][index].date = date;
  saveTasks();

  // re-create span element with bootstrap classes
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);

  // replace input with span element
  $(this).replaceWith(taskSpan);

  // Pass task's <li> element into inspectTask() to check new due date
  inspectTask($(taskSpan).closest(".list-group-item"));
  console.log($(taskSpan).closest(".list-group-item"));
});

// END OF TASK DATE EVENT HANDLERS

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function () {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function () {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function () {
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
      date: taskDate,
    });

    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", function () {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// load tasks for the first time
loadTasks();

// SORTABLE UI
$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function () {
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag");
  },
  deactivate: function () {
    $(this).removeClass("dropover");
    $(".bottom-trash").remove("bottom-trash-drag");
  },
  over: function (event) {
    $(this).addClass("dropover-active");
  },
  out: function (event) {
    $(this).removeClass("dropover-active");
  },
  update: function (event) {
    // array to store the task data in
    var tempArr = [];

    // loop over current set of children in sortable list
    $(this)
      .children()
      .each(function () {
        console.log($(this));
        var text = $(this).find("p").text().trim();

        var date = $(this).find("span").text().trim();

        // add task data to the temp array as an object
        tempArr.push({
          text: text,
          date: date,
        });
        console.log(text, date);
      });
    console.log($(this));
    // trim down list's ID to match object property
    var arrName = $(this).attr("id").replace("list-", "");

    // update array on tasks object and save
    tasks[arrName] = tempArr;
    saveTasks();
  },
});
// END OF SORTABLE UI

// DROP TO DELETE UI
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  over: function () {
    $(".bottom-trash").addClass("bottom-trash-active");
  },
  drop: function () {
    $(".bottom-trash").removeClass("bottom-trash-active");
  },
  out: function () {
    $(".bottom-trash").removeClass("bottom-trash-active");
  },
  drop: function (event, ui) {
    console.log("drop");
    ui.draggable.remove();
  },
});
// END OF DROP TO DELETE UI

// DATE PICKER UI
$("#modalDueDate").datepicker({
  minDate: 1,
});
// END OF DATE PICKER UI 

setInterval(function () {
  $(".card .list-group-item").each(function (index, el) {
    inspectTask(el);
  });
}, 1000 * 60 * 30);
