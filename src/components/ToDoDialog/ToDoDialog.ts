import { ToDoItem } from "../../modules/toDoManager";
import dateToText from "../../utils/dateToText";

function generateDialog(toDo?: ToDo) {
    // Initialize
    const today = new Date();

    const dialog = document.createElement("dialog");
    dialog.classList.add("dialog");
    document.body.appendChild(dialog);

    // Remove Button
    const closeButton = document.createElement("button");
    closeButton.classList.add("dialog-close-button", "material-symbols-outlined");
    closeButton.textContent = "close";
    dialog.appendChild(closeButton);

    // Content container
    const content = document.createElement("div");
    content.classList.add("dialog-content");
    dialog.appendChild(content);

    // Heading
    const heading = document.createElement("h2");
    heading.classList.add("dialog-content-heading");
    heading.textContent = "Create To Do";
    content.appendChild(heading);

    // Form for ToDo
    const form = document.createElement("form");
    form.method = "dialog";
    form.classList.add("dialog-todo-form");
    content.appendChild(form);

    // Form Container
    const formContainer = document.createElement("div");
    formContainer.classList.add("todo-form-container");
    form.appendChild(formContainer);

    // Form Fields for each input
    // Title input
    const titleField = document.createElement("div");
    titleField.classList.add("todo-form-field");
    formContainer.appendChild(titleField);

    const titleLabel = document.createElement("label");
    titleLabel.htmlFor = "todo-title";
    titleLabel.textContent = "Title: ";
    titleField.appendChild(titleLabel);

    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.name = "title";
    titleInput.id = "todo-title";
    titleInput.maxLength = 30;
    titleInput.autofocus = true;
    titleInput.required = true;
    titleField.appendChild(titleInput);

    // Description Input
    const descField = document.createElement("div");
    descField.classList.add("todo-form-field");
    formContainer.appendChild(descField);

    const descLabel = document.createElement("label");
    descLabel.htmlFor = "todo-desc";
    descLabel.textContent = "Description: ";
    descField.appendChild(descLabel);

    const descInput = document.createElement("textarea");
    descInput.name = "desc";
    descInput.id = "todo-desc";
    descInput.maxLength = 300;
    descInput.required = true;
    descField.appendChild(descInput);

    // Date Input
    const dateField = document.createElement("div");
    dateField.classList.add("todo-form-field");
    formContainer.appendChild(dateField);

    const dateLabel = document.createElement("label");
    dateLabel.htmlFor = "todo-date";
    dateLabel.textContent = "Date: ";
    dateField.appendChild(dateLabel);

    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.name = "dueDate";
    dateInput.id = "todo-date";
    dateInput.min = dateToText(today);
    dateInput.valueAsDate = today;
    dateInput.required = true;
    dateField.appendChild(dateInput);

    // Priority Input
    const priorityField = document.createElement("div");
    priorityField.classList.add("todo-form-field");
    formContainer.appendChild(priorityField);

    const priorityLabel = document.createElement("label");
    priorityLabel.htmlFor = "todo-priority";
    priorityLabel.textContent = "Priority: ";
    priorityField.appendChild(priorityLabel);

    const prioritySelect = document.createElement("select");
    prioritySelect.name = "priority";
    prioritySelect.id = "todo-priority";
    prioritySelect.required = true;
    priorityField.appendChild(prioritySelect);

    const optionLow = document.createElement("option");
    optionLow.value = "low";
    optionLow.textContent = "Low";
    prioritySelect.appendChild(optionLow);

    const optionMedium = document.createElement("option");
    optionMedium.value = "medium";
    optionMedium.textContent = "Medium";
    prioritySelect.appendChild(optionMedium);

    const optionHigh = document.createElement("option");
    optionHigh.value = "high";
    optionHigh.textContent = "High";
    prioritySelect.appendChild(optionHigh);

    // Submit Button
    const submitButton = document.createElement("button");
    submitButton.classList.add("todo-submit");
    submitButton.textContent = "Submit";
    formContainer.appendChild(submitButton);

    // Default Values, if given
    if (toDo) {
        titleInput.value = toDo.title;
        descInput.value = toDo.description;
        dateInput.valueAsDate = toDo.dueDate;
        prioritySelect.selectedIndex = Array.from(prioritySelect.options).findIndex(
            option => option.value === toDo.priority
        );

        // Change date restriction
        dateInput.min = dateToText(toDo.dueDate);
    }

    return {
        dialog,
        closeButton,
        form,
        titleInput,
        descInput,
        dateInput,
        prioritySelect,
    };
}

function ToDoDialog(defaultToDo?: ToDo): Promise<ToDo | undefined> {
    return new Promise(resolve => {
        // Initialize
        document.body.style.overflowY = "hidden";

        const {
            dialog,
            closeButton,
            form,
            titleInput,
            descInput,
            dateInput,
            prioritySelect
        } = generateDialog(defaultToDo);

        dialog.style.setProperty("--backdrop-opacity", "0");
        dialog.showModal();

        // Request Animation/Transition Effect
        requestAnimationFrame(() => {
            dialog.style.opacity = "1";
            dialog.style.top = "-15%";
            dialog.style.setProperty("--backdrop-opacity", "1");
        });

        // Close dialog function
        const _closeDialog = (result?: ToDo) => {
            dialog.style.opacity = "0";
            dialog.style.top = "0%";
            dialog.style.setProperty("--backdrop-opacity", "0");

            setTimeout(() => {
                resolve(result);
                dialog.close();
                dialog.remove();
                document.body.style.overflowY = "";
            }, 300);
        };

        // Dialog Escape Event
        dialog.onkeydown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                _closeDialog();
                event.preventDefault();
            }
        };

        // Dialog Close Button
        closeButton.onclick = () => {
            _closeDialog();
        };

        // Form submission
        form.onsubmit = (event: SubmitEvent) => {
            const title = titleInput.value;
            const desc = descInput.value;
            const date = dateInput.valueAsDate ? dateInput.valueAsDate : "";
            let priorityTemp = prioritySelect.selectedOptions.item(0)?.value;

            const priority: Priority = priorityTemp ? priorityTemp as Priority : "low";

            const toDo = new ToDoItem(title, desc, new Date(date), priority, defaultToDo?.isComplete ? true : false);

            _closeDialog(toDo);
            event.preventDefault();
        };
    });
}

export default ToDoDialog;
