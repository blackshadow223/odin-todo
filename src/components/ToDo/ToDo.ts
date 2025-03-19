import Comms from "../../utils/commsHandler";
import dateToText from "../../utils/dateToText";
import confirmUI from "../ConfirmUI/ConfirmUI";
import ToDoDialog from "../ToDoDialog/ToDoDialog";

function createToDoComponent(toDo: ToDo): HTMLDivElement {
    // ToDo
    const todo = document.createElement("div");
    todo.classList.add("todo", toDo.priority);

    // ToDo Head
    const todoHead = document.createElement("div");
    todoHead.classList.add("todo-head");
    todo.appendChild(todoHead);

    // Head check button
    const check = document.createElement("span");
    check.classList.add("check", "material-symbols-outlined");
    check.textContent = "radio_button_unchecked";
    check.onclick = async () => {
        Comms.emitEvent("ToDoManager.toggleCompletion", toDo.id);

        const currentPage = await Comms.requestResponse("UI.header.getCurrentPageName", null);
        if (currentPage) {
            Comms.emitEvent("UI.changePage", currentPage);
        }
    };
    todoHead.appendChild(check);

    // Head title and description
    const content = document.createElement("div");
    todoHead.appendChild(content);

    const title = document.createElement("h3");
    title.textContent = toDo.title;
    content.appendChild(title);

    const desc = document.createElement("p");
    desc.textContent = toDo.description;
    content.appendChild(desc);

    if (toDo.isComplete) {
        title.style.textDecoration = "line-through";
        desc.style.textDecoration = "line-through";
        check.style.fontVariationSettings = "'FILL' 1";
        check.textContent = "check_circle";
    }

    // Make sure today is today midnight, and not literally right now
    // Otherwise, date matching won't work properly since everytime
    // a todo is made, it is made on today's midnight, rather than right
    // now
    const today = new Date(dateToText(new Date()));

    if (toDo.dueDate.getSeconds() < today.getSeconds()) {
        const overdue = document.createElement("span");
        overdue.textContent = "OVERDUE!";
        overdue.style.color = "red";
        overdue.style.border = "1px solid";
        overdue.style.padding = "0px 4px";
        todoHead.appendChild(overdue);
    }

    // ToDo Tail
    const todoTail = document.createElement("div");
    todoTail.classList.add("todo-tail");
    todo.appendChild(todoTail);

    // Tail contents
    const date = document.createElement("span");
    date.classList.add("todo-date");
    date.textContent = toDo.dueDate.toLocaleDateString();
    todoTail.appendChild(date);

    const editButton = document.createElement("button");
    editButton.classList.add("todo-edit", "material-symbols-outlined");
    editButton.textContent = "edit";
    editButton.onclick = async () => {
        const newToDo = await ToDoDialog(toDo);

        if (newToDo) {
            Comms.emitEvent("ToDoManager.editToDo", {
                oldToDo: toDo,
                newToDo: newToDo
            });

            const currentPage = await Comms.requestResponse("UI.header.getCurrentPageName", null);
            if (currentPage) {
                Comms.emitEvent("UI.changePage", currentPage);
            }
        }
    };
    todoTail.appendChild(editButton);

    const deleteButton = document.createElement("button");
    deleteButton.classList.add("todo-delete", "material-symbols-outlined");
    deleteButton.textContent = "delete";
    deleteButton.onclick = async () => {
        const confirmation = await confirmUI("Are you sure you want to delete this To Do?");

        if (confirmation) {
            Comms.emitEvent("ToDoManager.removeToDo", toDo.id);

            const currentPage = await Comms.requestResponse("UI.header.getCurrentPageName", null);
            if (currentPage) {
                Comms.emitEvent("UI.changePage", currentPage);
            }
        }
    };
    todoTail.appendChild(deleteButton);

    return todo;
}

export default createToDoComponent;
