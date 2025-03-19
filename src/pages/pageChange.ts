import createToDoComponent from "../components/ToDo/ToDo";
import Comms from "../utils/commsHandler";
import dateToText from "../utils/dateToText";

async function pageChange(pageName: string): Promise<HTMLElement> {
    const main = document.createElement("main");
    main.classList.add("main");

    const today = new Date(dateToText(new Date()));
    const dayInMS = 24 * 3600 * 1000;
    const tomorrow = new Date(today.getTime() + dayInMS);

    if (pageName === "Today") {
        const toDos = await Comms.requestResponse("ToDoManager.getAllToDos", null);
        const filteredToDos: ToDo[] = [];

        if (toDos) {
            toDos.forEach(toDo => {
                const dateTime = toDo.dueDate.getTime();

                if (dateTime >= today.getTime() && dateTime < tomorrow.getTime()) {
                    filteredToDos.push(toDo);
                }
            });
        }

        main.appendChild(_render(filteredToDos));
    } else if (pageName === "This week") {
        const weekInMS = 7 * dayInMS;
        const nextWeek = new Date(today.getTime() + weekInMS);

        const toDos = await Comms.requestResponse("ToDoManager.getAllToDos", null);
        const filteredToDos: ToDo[] = [];

        if (toDos) {
            toDos.forEach(toDo => {
                const dateTime = toDo.dueDate.getTime();

                if (dateTime >= tomorrow.getTime() && dateTime < nextWeek.getTime()) {
                    filteredToDos.push(toDo);
                }
            });
        }

        main.appendChild(_render(filteredToDos));
    } else if (pageName === "Important") {
        const toDos = await Comms.requestResponse("ToDoManager.getAllToDos", null);
        const filteredToDos: ToDo[] = [];

        if (toDos) {
            toDos.forEach(toDo => {
                if (toDo.priority === "high") {
                    filteredToDos.push(toDo);
                }
            });
        }

        main.appendChild(_render(filteredToDos));
    } else if (pageName === "All Tasks") {
        const toDos = await Comms.requestResponse("ToDoManager.getAllToDos", null);
        const filteredToDos: ToDo[] = [];

        if (toDos) {
            toDos.forEach(toDo => {
                filteredToDos.push(toDo);
            });
        }

        main.appendChild(_render(filteredToDos));
    } else {
        const projectToDos = await Comms.requestResponse("ToDoManager.getToDoListFromProject", pageName);

        if (projectToDos) {
            main.appendChild(_render(projectToDos));
        }
    }

    // Render ToDos
    function _render(toDos: ToDo[]): HTMLDivElement {
        const toDoContainer = document.createElement("div");
        toDoContainer.classList.add("todo-container");
        main.appendChild(toDoContainer);

        const completedToDos: ToDo[] = [];

        toDos.forEach(toDo => {
            if (toDo.isComplete) {
                completedToDos.push(toDo);
                return; // Render Completed ToDos at the end
            }

            toDoContainer.appendChild(createToDoComponent(toDo));
        });

        // Render Completed ToDos at the end
        completedToDos.forEach(toDo => {
            toDoContainer.appendChild(createToDoComponent(toDo));
        });

        return toDoContainer;
    }

    return main;
}

export default pageChange;
